/** Modules that load native accounting list/detail APIs (portal may also define web_path). */
export const ACCOUNTING_API_LIST_MODULES = [
  'Accounting currencies',
  'Accounting exchange rates',
  'Accounting supplier WHT types',
  'Accounting fiscal periods',
  'Accounting chart of accounts',
  'Accounting journal entries',
  'Accounting fixed assets',
  'Accounting depreciation runs',
  'Accounting bank reconciliation',
  'Accounting cash flow mapping',
] as const;

export type AccountingApiListModule = (typeof ACCOUNTING_API_LIST_MODULES)[number];

const ACCOUNTING_API_SET = new Set<string>(ACCOUNTING_API_LIST_MODULES);

/** Financial report / AR report shortcuts — web ERP only (detail uses portal_web_surface). */
export const ACCOUNTING_WEB_REPORT_MODULES = [
  'Customer statements',
  'Overdue invoices',
  'Daily invoice report',
  'Report trial balance',
  'Report profit and loss',
  'Report balance sheet',
  'Report cash flow',
  'Report supplier WHT monthly',
] as const;

const WEB_REPORT_SET = new Set<string>(ACCOUNTING_WEB_REPORT_MODULES);

export function isAccountingApiListModule(route: string): route is AccountingApiListModule {
  return ACCOUNTING_API_SET.has(route);
}

export function isAccountingWebReportModule(route: string): boolean {
  return WEB_REPORT_SET.has(route);
}

export type AccountingRecordDetailKind =
  | 'accounting_currency'
  | 'accounting_exchange_rate_week'
  | 'accounting_supplier_wht_type'
  | 'accounting_period'
  | 'accounting_account'
  | 'accounting_journal_entry'
  | 'accounting_fixed_asset'
  | 'accounting_depreciation_run'
  | 'accounting_bank_statement'
  | 'accounting_cash_flow_map';

export function accountingDetailKindForModule(route: AccountingApiListModule): AccountingRecordDetailKind {
  switch (route) {
    case 'Accounting currencies':
      return 'accounting_currency';
    case 'Accounting exchange rates':
      return 'accounting_exchange_rate_week';
    case 'Accounting supplier WHT types':
      return 'accounting_supplier_wht_type';
    case 'Accounting fiscal periods':
      return 'accounting_period';
    case 'Accounting chart of accounts':
      return 'accounting_account';
    case 'Accounting journal entries':
      return 'accounting_journal_entry';
    case 'Accounting fixed assets':
      return 'accounting_fixed_asset';
    case 'Accounting depreciation runs':
      return 'accounting_depreciation_run';
    case 'Accounting bank reconciliation':
      return 'accounting_bank_statement';
    case 'Accounting cash flow mapping':
      return 'accounting_cash_flow_map';
    default:
      return 'accounting_currency';
  }
}
