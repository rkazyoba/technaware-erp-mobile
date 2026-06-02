import { useMemo } from 'react';
import type { MobilePortalBootstrap } from '../types/app';
import { canCrud, canCrudOrLegacy, PARTS_MGMT_LEGACY, type CrudResource } from '../utils/crudPermissions';
import { portalModuleAccessGate, type PortalModuleAccessGate } from '../utils/portalModuleAccess';

export type ScreenAccessGate = {
  moduleGate: PortalModuleAccessGate;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  deniedMessage: string;
};

type Options = {
  portal: MobilePortalBootstrap | null | undefined;
  moduleRoute: string;
  resource?: CrudResource;
  requireCreate?: boolean;
  requireUpdate?: boolean;
};

/**
 * Client-side defense in depth; API must still return 403 for unauthorized mutations.
 */
export function useScreenAccessGate({
  portal,
  moduleRoute,
  resource,
  requireCreate = false,
  requireUpdate = false,
}: Options): ScreenAccessGate {
  return useMemo(() => {
    const moduleGate = portalModuleAccessGate(portal, moduleRoute);
    const canView = moduleGate === 'allowed';
    const legacy = resource && PARTS_MGMT_LEGACY[resource] ? PARTS_MGMT_LEGACY[resource] : [];
    const crud = (action: 'create' | 'update' | 'delete') =>
      resource
        ? legacy.length > 0
          ? canCrudOrLegacy(portal, resource, action, legacy)
          : canCrud(portal, resource, action)
        : canView;
    const canCreate = crud('create');
    const canUpdate = crud('update');
    const canDelete = resource ? crud('delete') : false;

    let deniedMessage = 'You do not have access to this area.';
    if (moduleGate === 'denied') {
      deniedMessage = 'This module is not available for your role or tenant license.';
    } else if (requireCreate && !canCreate) {
      deniedMessage = 'You do not have permission to create records here.';
    } else if (requireUpdate && !canUpdate) {
      deniedMessage = 'You do not have permission to edit records here.';
    }

    return {
      moduleGate,
      canView,
      canCreate,
      canUpdate,
      canDelete,
      deniedMessage,
    };
  }, [portal, moduleRoute, resource, requireCreate, requireUpdate]);
}
