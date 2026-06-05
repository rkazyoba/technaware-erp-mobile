import type { MobilePortalBootstrap } from '../types/app';
import { staffPortalHasAnyPermission, staffPortalHasPermission } from './staffPortalPermissions';

export type CrudResource =
  | 'parts'
  | 'parts_in_store'
  | 'part_expiration'
  | 'part_conversions'
  | 'price_catalog'
  | 'suppliers'
  | 'units'
  | 'categories'
  | 'products'
  | 'catalog_bank_master'
  | 'catalog_bank_branches'
  | 'catalog_mobile_operators'
  | 'po_receipts'
  | 'non_po_receipts'
  | 'delivery_notes'
  | 'kitchen_to_store'
  | 'store_to_kitchen'
  | 'store_issues'
  | 'store_receipts'
  | 'supplier_returns'
  | 'pick_tickets'
  | 'payment_vouchers'
  | 'requisitions';

export type CrudAction = 'view' | 'create' | 'update' | 'delete' | 'approve';

/** Explicit RBAC key: erp.crud.<resource>.<action> */
export function canCrud(portal: MobilePortalBootstrap | null | undefined, resource: CrudResource, action: CrudAction): boolean {
  if (!portal) {
    return false;
  }
  if (portal.has_wildcard) {
    return true;
  }
  return staffPortalHasPermission(portal, `erp.crud.${resource}.${action}`);
}

/**
 * Mobile write access: CRUD permission OR legacy operational erp.user.* flag (backward compatible with existing roles).
 */
export function canCrudOrLegacy(
  portal: MobilePortalBootstrap | null | undefined,
  resource: CrudResource,
  action: 'create' | 'update',
  legacyPermissions: readonly string[],
): boolean {
  return canCrud(portal, resource, action) || staffPortalHasAnyPermission(portal, legacyPermissions);
}

/**
 * Create actions that must match web {@see ErpUiAccess}: only {@code erp.crud.<resource>.create},
 * not {@code erp.user.*} or section nav (see unit tests for po/non_po/requisitions).
 */
export const STRICT_CRUD_CREATE_RESOURCES = new Set<CrudResource>([
  'requisitions',
  'po_receipts',
  'non_po_receipts',
  'pick_tickets',
]);

export function canCreateCrud(portal: MobilePortalBootstrap | null | undefined, resource: CrudResource): boolean {
  if (STRICT_CRUD_CREATE_RESOURCES.has(resource)) {
    return canCrud(portal, resource, 'create');
  }
  const legacy = LOGISTICS_LEGACY[resource];
  if (legacy) {
    return canCrudOrLegacy(portal, resource, 'create', legacy);
  }
  return canCrud(portal, resource, 'create');
}

export const LOGISTICS_LEGACY: Record<string, readonly string[]> = {
  po_receipts: ['erp.user.po_receipts'],
  non_po_receipts: ['erp.user.non_po_receipts'],
  delivery_notes: ['erp.user.delivery_notes'],
  kitchen_to_store: ['erp.user.kitchen_to_store'],
  store_to_kitchen: ['erp.user.store_to_kitchen'],
  store_issues: ['erp.user.store_issues'],
  store_receipts: ['erp.user.store_receipts'],
  supplier_returns: ['erp.user.supplier_returns'],
  requisitions: ['erp.user.requisitions'],
};

export const PARTS_MGMT_LEGACY: Record<string, readonly string[]> = {
  parts_in_store: ['erp.nav.stock', 'erp.user.catalog', 'erp.nav.catalog'],
  part_expiration: ['erp.nav.stock', 'erp.user.catalog', 'erp.user.stock'],
  part_conversions: ['erp.nav.stock', 'erp.nav.catalog'],
  price_catalog: ['erp.nav.stock', 'erp.user.catalog', 'erp.nav.catalog'],
};
