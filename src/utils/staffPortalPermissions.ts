import type { MobilePortalBootstrap } from '../types/app';

/** True if the portal grants this explicit RBAC key (or wildcard). */
export function staffPortalHasPermission(portal: MobilePortalBootstrap | null | undefined, permission: string): boolean {
  if (!portal) {
    return false;
  }
  if (portal.has_wildcard) {
    return true;
  }
  return portal.permissions.includes(permission);
}

export function staffPortalHasAnyPermission(
  portal: MobilePortalBootstrap | null | undefined,
  permissions: readonly string[],
): boolean {
  return permissions.some((p) => staffPortalHasPermission(portal, p));
}

/**
 * Maps Store movements tab id → RBAC keys that grant StaffLogistics API list/detail access for that band.
 * Mirrors {@see StaffLogisticsController} guards.
 */
export const STORE_MOVEMENT_KIND_PERMISSIONS: Record<string, readonly string[]> = {
  k2s: ['erp.user.kitchen_to_store'],
  s2k: ['erp.user.store_to_kitchen'],
  inter_rcpt: ['erp.user.store_receipts', 'erp.approvals.store_receipts'],
  inter_issue: ['erp.user.store_issues', 'erp.approvals.store_issues'],
};

const STORE_MOVEMENT_KIND_ORDER = ['k2s', 's2k', 'inter_rcpt', 'inter_issue'] as const;

/** Tab ids the current user may use under Store movements (native lists). */
export function visibleStoreMovementKindsForPortal(portal: MobilePortalBootstrap | null): string[] {
  return STORE_MOVEMENT_KIND_ORDER.filter((id) =>
    staffPortalHasAnyPermission(portal, STORE_MOVEMENT_KIND_PERMISSIONS[id] ?? []),
  );
}
