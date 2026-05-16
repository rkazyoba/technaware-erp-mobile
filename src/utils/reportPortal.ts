import type { MobilePortalBootstrap, MobilePortalRow } from '../types/app';
import { isFinanceReportMobileModule } from './financeReportPortal';

/** Surfaces that appear on Reports but stay in the Modules grid (not finance-only). */
const OPERATIONAL_REPORT_SURFACE_IDS = new Set([
  'stock_by_store',
  'store_movements',
  'purchase_orders_mobile',
  'requisitions_mobile',
  'grn_po',
  'report_store_consumption',
  'report_movement_trends',
]);

const OPERATIONAL_REPORT_ROUTES = new Set([
  'Stock by store',
  'Store movements',
  'Purchase orders',
  'Requisitions',
  'GRN (PO)',
  'Store consumption',
  'Movement trends',
]);

const REPORT_CATEGORY_KEYS = new Set([
  'finance_reports',
  'inventory_reports',
  'procurement_reports',
  'operations_reports',
]);

export function isFinanceReportPortalSurface(row: MobilePortalRow): boolean {
  if (!row.visible || !row.route?.trim()) {
    return false;
  }
  if (row.category_key === 'finance_reports') {
    return true;
  }
  if (row.route && isFinanceReportMobileModule(row.route)) {
    return true;
  }
  const webPath = (row.web_path ?? '').toLowerCase();
  return webPath.includes('/report') || webPath.includes('reports/');
}

export function isReportPortalSurface(row: MobilePortalRow): boolean {
  if (!row.visible || !row.route?.trim()) {
    return false;
  }
  if (isFinanceReportPortalSurface(row)) {
    return true;
  }
  if (row.category_key && REPORT_CATEGORY_KEYS.has(row.category_key)) {
    return true;
  }
  if (OPERATIONAL_REPORT_SURFACE_IDS.has(row.id)) {
    return true;
  }
  if (row.route && OPERATIONAL_REPORT_ROUTES.has(row.route.trim())) {
    return true;
  }
  return false;
}

export function reportCategoryKeyForRow(row: MobilePortalRow): string {
  if (row.category_key && REPORT_CATEGORY_KEYS.has(row.category_key)) {
    return row.category_key;
  }
  if (row.id === 'stock_by_store' || row.route === 'Stock by store' || row.route === 'Store consumption' || row.route === 'Movement trends') {
    return 'inventory_reports';
  }
  if (
    row.id === 'purchase_orders_mobile' ||
    row.id === 'requisitions_mobile' ||
    row.id === 'grn_po' ||
    row.route === 'Purchase orders' ||
    row.route === 'Requisitions' ||
    row.route === 'GRN (PO)'
  ) {
    return 'procurement_reports';
  }
  if (row.id === 'store_movements' || row.route === 'Store movements') {
    return 'inventory_reports';
  }
  return row.category_key ?? 'finance_reports';
}

export function reportSurfacesFromPortal(portal: MobilePortalBootstrap | null): MobilePortalRow[] {
  if (!portal?.surfaces?.length) {
    return [];
  }
  return portal.surfaces
    .filter(isReportPortalSurface)
    .map((row) => ({ ...row, category_key: reportCategoryKeyForRow(row) }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function reportSurfacesByCategory(rows: MobilePortalRow[]): Array<{ key: string; label: string; items: MobilePortalRow[] }> {
  const map = new Map<string, MobilePortalRow[]>();
  for (const row of rows) {
    const key = reportCategoryKeyForRow(row);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(row);
  }
  const labels: Record<string, string> = {
    finance_reports: 'Financial reports',
    inventory_reports: 'Inventory & stores',
    procurement_reports: 'Purchasing',
    operations_reports: 'Operations',
  };
  return [...map.entries()].map(([key, items]) => ({
    key,
    label: labels[key] ?? key.replace(/_/g, ' '),
    items,
  }));
}
