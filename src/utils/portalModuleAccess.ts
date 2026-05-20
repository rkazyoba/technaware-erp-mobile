import type { MobilePortalBootstrap } from '../types/app';

export type PortalModuleAccessGate = 'pending' | 'denied' | 'allowed';

/** Visible surface routes returned by the portal bootstrap (ERP RBAC + tenant modules). */
export function portalAccessibleModuleRoutes(portal: MobilePortalBootstrap | null | undefined): string[] {
  if (!portal?.surfaces?.length) {
    return [];
  }
  const out: string[] = [];
  for (const s of portal.surfaces) {
    const r = (s.route ?? '').trim();
    if (s.visible && r !== '') {
      out.push(r);
    }
  }
  return out;
}

export function isPortalModuleRouteAccessible(
  portal: MobilePortalBootstrap | null | undefined,
  moduleRoute: string,
): boolean {
  const key = moduleRoute.trim();
  if (!portal?.surfaces?.length || key === '') {
    return false;
  }
  return portal.surfaces.some((s) => s.visible && (s.route ?? '').trim() === key);
}

/**
 * `pending`: portal profile not loaded yet (avoid flashing deny).
 * `denied`: loaded profile has no surfaces, or this route is not an allowed surface.
 */
export function portalModuleAccessGate(
  portal: MobilePortalBootstrap | null | undefined,
  moduleRoute: string,
): PortalModuleAccessGate {
  if (portal === null || portal === undefined) {
    return 'pending';
  }
  if (!portal.surfaces?.length) {
    return 'denied';
  }
  return isPortalModuleRouteAccessible(portal, moduleRoute) ? 'allowed' : 'denied';
}

type ProcurementDetailAccessFlags = {
  canViewPurchaseRfqs: boolean;
  canViewSupplierQuotations: boolean;
  canViewRequisitions: boolean;
};

/**
 * RFQ / supplier quotation detail is opened from the procurement modules list or from
 * requisition sourcing links — do not require the destination module surface when the user
 * already has procurement or requisition read access.
 */
export function procurementRecordDetailAccessGate(
  portal: MobilePortalBootstrap | null | undefined,
  moduleRoute: string,
  detailKind: string,
  flags: ProcurementDetailAccessFlags,
): PortalModuleAccessGate {
  if (portal === null || portal === undefined) {
    return 'pending';
  }
  if (detailKind === 'purchase_rfq' && (flags.canViewPurchaseRfqs || flags.canViewRequisitions)) {
    return 'allowed';
  }
  if (detailKind === 'supplier_quotation' && (flags.canViewSupplierQuotations || flags.canViewRequisitions)) {
    return 'allowed';
  }
  return portalModuleAccessGate(portal, moduleRoute);
}
