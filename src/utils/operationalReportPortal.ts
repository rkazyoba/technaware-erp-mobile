export const OPERATIONAL_REPORT_MOBILE_MODULES = ['Store consumption', 'Movement trends'] as const;

export type OperationalReportMobileModule = (typeof OPERATIONAL_REPORT_MOBILE_MODULES)[number];

const SET = new Set<string>(OPERATIONAL_REPORT_MOBILE_MODULES);

export function isOperationalReportMobileModule(route: string): route is OperationalReportMobileModule {
  return SET.has(route);
}
