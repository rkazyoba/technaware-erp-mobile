/** Portal routes (`erp_mobile_portal.php`) that use native mobile report dashboards instead of web-only shortcuts. */
export const FINANCE_REPORT_MOBILE_MODULES = [
  'Customer statements',
  'Overdue invoices',
  'Daily invoice report',
  'Report trial balance',
  'Report profit and loss',
  'Report site performance',
  'Report balance sheet',
  'Report cash flow',
  'Report supplier WHT monthly',
  'Report budget vs actual',
] as const;

export type FinanceReportMobileModule = (typeof FINANCE_REPORT_MOBILE_MODULES)[number];

const SET = new Set<string>(FINANCE_REPORT_MOBILE_MODULES);

export function isFinanceReportMobileModule(route: string): route is FinanceReportMobileModule {
  return SET.has(route);
}
