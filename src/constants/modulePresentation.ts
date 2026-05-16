export type ModuleColorFamily = 'navy' | 'teal' | 'amber' | 'blue' | 'purple' | 'coral' | 'green' | 'slate';

const COL: Record<ModuleColorFamily, { bg: string; fg: string }> = {
  navy: { bg: 'rgba(13,27,62,0.08)', fg: '#0d1b3e' },
  teal: { bg: 'rgba(0,200,150,0.12)', fg: '#00a87a' },
  amber: { bg: 'rgba(217,119,6,0.1)', fg: '#b45309' },
  blue: { bg: 'rgba(29,78,216,0.1)', fg: '#1d4ed8' },
  purple: { bg: 'rgba(109,40,217,0.1)', fg: '#7c3aed' },
  coral: { bg: 'rgba(220,38,38,0.08)', fg: '#dc2626' },
  green: { bg: 'rgba(22,163,74,0.1)', fg: '#16a34a' },
  slate: { bg: 'rgba(71,85,105,0.1)', fg: '#475569' },
};

export function moduleColorStyles(family: ModuleColorFamily) {
  return COL[family];
}

export type IonGlyph = string;

export const MODULE_ICON: Record<string, IonGlyph> = {
  notifications: 'notifications-outline',
  approvals: 'checkmark-done-outline',
  support: 'headset-outline',
  delivery_notes: 'car-outline',
  grn_po: 'clipboard-outline',
  non_po_receipts: 'receipt-outline',
  supplier_returns: 'arrow-undo-outline',
  pick_tickets: 'ticket-outline',
  store_movements: 'swap-horizontal-outline',
  master_data: 'library-outline',
  parts_catalog: 'book-outline',
  suppliers_directory: 'storefront-outline',
  units_master: 'speedometer-outline',
  categories_master: 'folder-outline',
  banks_catalog: 'card-outline',
  bank_branches_catalog: 'git-branch-outline',
  mobile_operators_master: 'phone-portrait-outline',
  procurement: 'cart-outline',
  purchase_orders_mobile: 'document-text-outline',
  stock_by_store: 'business-outline',
  requisitions_mobile: 'reader-outline',
  requisitions: 'cart-outline',
  my_payslips: 'document-text-outline',
  leave_requests: 'calendar-outline',
  attendance: 'time-outline',
  crm_customers: 'people-outline',
  crm_contracts: 'document-text-outline',
  crm_quotations: 'pricetag-outline',

  // Finance & commercial
  finance_customer_invoices: 'file-tray-full-outline',
  finance_proforma_invoices: 'file-tray-outline',
  finance_payments: 'cash-outline',
  finance_payment_vouchers: 'ticket-outline',
  finance_supplier_invoices: 'receipt-outline',

  accounting_currencies: 'business-outline',
  accounting_exchange_rates: 'swap-horizontal-outline',
  accounting_supplier_wht_types: 'document-text-outline',
  accounting_periods: 'calendar-outline',
  accounting_coa: 'list-outline',
  accounting_journals: 'clipboard-outline',
  accounting_fixed_assets: 'cube-outline',
  accounting_depreciation: 'trending-down-outline',
  accounting_bank_statements: 'wallet-outline',
  accounting_cash_flow_map: 'git-network-outline',
  finance_customer_statements: 'document-outline',
  finance_overdue_invoices: 'alert-circle-outline',
  finance_daily_invoice_report: 'today-outline',
  accounting_report_trial_balance: 'reader-outline',
  accounting_report_pnl: 'stats-chart-outline',
  accounting_report_balance_sheet: 'pie-chart-outline',
  accounting_report_cash_flow: 'cash-outline',
  accounting_report_supplier_wht: 'calculator-outline',

  // HR
  hr_employees_directory: 'people-outline',
  hr_departments: 'business-outline',
  hr_positions: 'briefcase-outline',
  hr_job_grades: 'ribbon-outline',
  hr_leave_types: 'calendar-outline',
  hr_leave_balances: 'calendar-outline',
  hr_payroll_runs: 'wallet-outline',
};

export function moduleIconForSurfaceId(id: string): IonGlyph {
  return MODULE_ICON[id] ?? 'apps-outline';
}

export function colorFamilyForSurfaceId(id: string): ModuleColorFamily {
  const map: Record<string, ModuleColorFamily> = {
    notifications: 'coral',
    approvals: 'amber',
    support: 'slate',
    delivery_notes: 'navy',
    grn_po: 'teal',
    non_po_receipts: 'green',
    supplier_returns: 'slate',
    pick_tickets: 'amber',
    store_movements: 'blue',
    master_data: 'purple',
    parts_catalog: 'teal',
    suppliers_directory: 'teal',
    units_master: 'slate',
    categories_master: 'purple',
    banks_catalog: 'navy',
    bank_branches_catalog: 'blue',
    mobile_operators_master: 'green',
    procurement: 'blue',
    purchase_orders_mobile: 'navy',
    stock_by_store: 'navy',
    requisitions_mobile: 'blue',
    requisitions: 'blue',
    my_payslips: 'purple',
    leave_requests: 'green',
    attendance: 'amber',
    crm_customers: 'blue',
    crm_contracts: 'navy',
    crm_quotations: 'teal',

    // Finance & commercial
    finance_customer_invoices: 'navy',
    finance_proforma_invoices: 'purple',
    finance_payments: 'teal',
    finance_payment_vouchers: 'amber',
    finance_supplier_invoices: 'slate',

    accounting_currencies: 'navy',
    accounting_exchange_rates: 'teal',
    accounting_supplier_wht_types: 'purple',
    accounting_periods: 'blue',
    accounting_coa: 'navy',
    accounting_journals: 'amber',
    accounting_fixed_assets: 'slate',
    accounting_depreciation: 'coral',
    accounting_bank_statements: 'teal',
    accounting_cash_flow_map: 'green',
    finance_customer_statements: 'navy',
    finance_overdue_invoices: 'coral',
    finance_daily_invoice_report: 'blue',
    accounting_report_trial_balance: 'navy',
    accounting_report_pnl: 'green',
    accounting_report_balance_sheet: 'purple',
    accounting_report_cash_flow: 'teal',
    accounting_report_supplier_wht: 'amber',

    // HR
    hr_employees_directory: 'blue',
    hr_departments: 'navy',
    hr_positions: 'purple',
    hr_job_grades: 'amber',
    hr_leave_types: 'teal',
    hr_leave_balances: 'green',
    hr_payroll_runs: 'purple',
  };
  return map[id] ?? 'navy';
}

export const CATEGORY_LABELS: Record<string, string> = {
  inventory_logistics: 'Inventory & logistics',
  stock_parts: 'Stock & stores',
  parts_management: 'Parts management',
  master_data: 'Master data',
  procurement: 'Procurement',
  hr_payroll: 'HR & payroll',
  finance_commercial: 'Finance & commercial',
  finance_accounting_setup: 'Accounting setup',
  finance_accounting: 'Accounting',
  finance_reports: 'Financial reports',
  inventory_reports: 'Inventory & stores',
  procurement_reports: 'Purchasing',
  operations_reports: 'Operations',
  workflow: 'Workflow & comms',
  uncategorised: 'Modules',
  crm_sales: 'CRM & sales',
};
