import type { MobilePortalBootstrap } from '../types/app';
import { staffPortalHasAnyPermission, staffPortalHasPermission } from './staffPortalPermissions';

export type CrudResource =
  | 'parts'
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
  | 'payment_vouchers';

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

export const LOGISTICS_LEGACY: Record<string, readonly string[]> = {
  po_receipts: ['erp.user.po_receipts'],
  non_po_receipts: ['erp.user.non_po_receipts'],
  delivery_notes: ['erp.user.delivery_notes'],
  kitchen_to_store: ['erp.user.kitchen_to_store'],
  store_to_kitchen: ['erp.user.store_to_kitchen'],
  store_issues: ['erp.user.store_issues'],
  store_receipts: ['erp.user.store_receipts'],
  supplier_returns: ['erp.user.supplier_returns'],
};
