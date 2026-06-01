import type { AttendanceRow, FinanceReportPreset, NotificationItem, StockReportLine } from '../api';
import type { AccountingRecordDetailKind } from '../utils/accountingPortal';

export type NotificationDetailPreview = Pick<NotificationItem, 'id' | 'title' | 'body' | 'read' | 'created_at' | 'module'>;

export type AttendanceDetailPreview = Pick<
  AttendanceRow,
  'id' | 'date' | 'check_in' | 'check_out' | 'hours_worked' | 'overtime_hours' | 'status' | 'source'
>;

export type StockLineDetailPreview = Pick<
  StockReportLine,
  'id' | 'code' | 'description' | 'quantity' | 'min_qty' | 'max_qty' | 'status' | 'category' | 'supplier' | 'unit'
>;

export type RecordDetailParams = {
  moduleRoute: string;
  detailKind:
    | 'logistics'
    | 'requisition'
    | 'approval'
    | 'leave'
    | 'part'
    | 'support'
    | 'notification'
    | 'stock_line'
    | 'attendance'
    | 'crm_customer'
    | 'crm_contract'
    | 'crm_quotation'
    | 'purchase_order'
    | 'purchase_rfq'
    | 'supplier_quotation'
    | 'supplier'
    | 'master_unit'
    | 'master_category'
    | 'master_bank'
    | 'master_bank_branch'
    | 'master_mobile_operator'
    | 'finance_customer_invoice'
    | 'finance_proforma_invoice'
    | 'finance_payment'
    | 'finance_payment_voucher'
    | 'finance_petty_cash_request'
    | 'finance_supplier_invoice'
    | 'hr_employee'
    | 'hr_leave_balance'
    | 'hr_department'
    | 'hr_position'
    | 'hr_job_grade'
    | 'hr_leave_type'
    | 'hr_payroll_run'
    | 'payslip'
    | 'hospitality_reservation'
    | 'hospitality_guest'
    | 'hospitality_folio'
    | AccountingRecordDetailKind
    | 'portal_web_surface';
  recordId: string;
  logisticsPath?: string;
  titleHint?: string;
  stockStoreId?: string;
  stockStoreName?: string;
  stockLine?: StockLineDetailPreview;
  notificationPreview?: NotificationDetailPreview;
  attendancePreview?: AttendanceDetailPreview;
  /** When detailKind is portal_web_surface — opens full ERP in browser. */
  portalWebPath?: string;
  portalWebTitle?: string;
  portalWebDescription?: string;
};

export type ModulesStackParamList = {
  ModulesHome: undefined;
  Profile: undefined;
  ModuleList: {
    moduleRoute: string;
    /** Profit & loss site scope: '' omitted = all; `unallocated` or site id string */
    financePnlSiteId?: string;
    financePreset?: FinanceReportPreset;
  };
  ModuleWorkspace: { moduleRoute: string };
  HospitalityDetail: {
    detailKind: 'reservation' | 'guest' | 'folio';
    recordId: string;
    titleHint?: string;
  };
  RecordDetail: RecordDetailParams;
  Approvals: { approvalId?: string; typeFilter?: string; kindFilter?: string } | undefined;
  StoreMovementHeader: { initialKind?: 'k2s' | 's2k' } | undefined;
  StoreMovementLines: {
    docKind: 'kitchen_to_store' | 'store_to_kitchen';
    issueId: string;
    /** Store master name: issuing store (kitchen→store) or receiving store (store→kitchen) — used for stock line picker. */
    stockStoreName: string;
    readOnly?: boolean;
    initialTab?: 'overview' | 'lines';
  };
  DeliveryNoteHeader: undefined;
  DeliveryNoteLines: { deliveryNoteId: string };
  PoGrnHeader: undefined;
  PoReceiptWorkspace: { receiptId: string; initialTab?: 'overview' | 'lines' | 'document' };
  NonPoGrnHeader: undefined;
  NonPoReceiptWorkspace: { receiptId: string; initialTab?: 'overview' | 'lines' | 'document' };
  SupplierReturnHeader: undefined;
  SupplierReturnWorkspace: { supplierReturnId: string; initialTab?: 'overview' | 'lines' | 'document' };
  PickTicketHeader: undefined;
  PickTicketWorkspace: { pickTicketId: string; initialTab?: 'overview' | 'lines' | 'document' };
  MasterCatalogEdit: {
    kind: 'supplier' | 'unit' | 'category';
    moduleRoute: string;
    recordId?: string;
  };
  LeaveRequestForm: undefined;
  PettyCashRequestForm: { requestType?: 'imprest' | 'expense_claim' } | undefined;
  PaymentVoucherForm: undefined;
  CustomerPaymentRecord: {
    invoiceId: string;
    invoiceRef: string;
    dueAmount?: number | null;
    currency?: string;
  };
  PettyCashRetirement: { recordId: string };
  StaffFinanceRetirementWorkspace: { retirementId: string; imprestId?: string };
  StaffFinanceRequestWorkspace: {
    requestId: string;
    requestType: 'imprest' | 'expense_claim';
    moduleRoute: string;
    initialTab?: 'overview' | 'details' | 'header' | 'lines' | 'documents';
  };
};
