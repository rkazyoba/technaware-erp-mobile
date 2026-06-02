import { resolveApiBaseUrl } from './config/apiBaseUrl';
import type { MobilePortalBootstrap, SignedInUser } from './types/app';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
};

type LoginResponse = {
  token: string;
  token_type: string;
  user: SignedInUser;
  portal?: MobilePortalBootstrap;
};

type MeResponse = {
  user: SignedInUser;
  portal?: MobilePortalBootstrap;
};

export type TenantContextMutationResponse = {
  tenant_id: number;
  portal: MobilePortalBootstrap;
};

export type ApprovalItem = {
  id: string;
  /** Stable slug from the API (e.g. `purchase_order`, `po_receipt`). */
  kind?: string;
  ref: string;
  type: string;
  subject: string;
  owner: string;
  status: string;
  requested_date?: string | null;
};

export type ApprovalModuleScore = {
  kind: string;
  type: string;
  count: number;
};

export type ApprovalsSummary = {
  total: number;
  modules: ApprovalModuleScore[];
};

export type ApprovalDetail = {
  id: string;
  kind?: string;
  ref: string;
  type: string;
  subject: string;
  owner: string;
  status: string;
  approval_comment?: string | null;
  requested_date?: string | null;
  priority?: string;
  prepared_date?: string | null;
  despatch_date?: string | null;
  order_no?: string;
  customer_name?: string;
  lines: Array<{
    id: string;
    category: string;
    item: string;
    product_code?: string;
    quantity: number;
    unit: string;
  }>;
};

type ApprovalActionResponse = {
  id: string;
  status: string;
  comment?: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  module?: string;
  target_id?: string | null;
  action?: string;
  data?: Record<string, unknown>;
  read: boolean;
  read_at?: string | null;
  created_at?: string | null;
};

export type LeaveTypeItem = {
  id: string;
  name: string;
};

export type LeaveRequestItem = {
  id: string;
  leave_type: string;
  date_start?: string | null;
  date_end?: string | null;
  days_requested?: number | null;
  status: string;
  notes?: string | null;
  approver?: string;
  created_at?: string | null;
};

export type LeaveRequestDetail = LeaveRequestItem & {
  reason?: string | null;
  manager_approved_at?: string | null;
  approved_at?: string | null;
};

export type MobileSummaryInvoiceRow = {
  id: string;
  invoice_no: string;
  invoice_date: string | null;
  total_amount: number;
  status: string;
  status_label: string;
  customer_name: string | null;
};

export type MobileSummaryRevenueMonth = {
  label: string;
  amount: number;
};

export type MobileSummary = {
  unread_notifications: number;
  pending_approvals: number | null;
  my_requisitions_open: number | null;
  pending_leave_requests: number | null;
  latest_payslip_net: number | null;
  latest_payslip_period_end: string | null;
  open_support_tickets: number | null;
  delivery_notes_open: number | null;
  /** Present when user can view invoice-based sales summary (finance / invoice permissions). */
  revenue_this_month: number | null;
  revenue_last_month: number | null;
  revenue_trend_pct: number | null;
  invoices_pending_approval: number | null;
  invoices_overdue: number | null;
  recent_invoices: MobileSummaryInvoiceRow[] | null;
  revenue_by_month: MobileSummaryRevenueMonth[] | null;
};

export type MobileOperationalMonthPoint = { label: string; amount: number };

export type MobileOperationalReports = {
  stock: { stores: number; low_stock_lines: number | null } | null;
  store_consumption: {
    headers_30d: number;
    quantity_30d: number | null;
    by_month: MobileOperationalMonthPoint[];
  } | null;
  movements: {
    kitchen_to_store_30d: number | null;
    store_to_kitchen_30d: number | null;
    by_month: Array<{
      label: string;
      kitchen_to_store: number;
      store_to_kitchen: number;
      total: number;
    }>;
  } | null;
  procurement: {
    open_purchase_orders: number | null;
    open_requisitions: number | null;
    by_month: Array<{ label: string; purchase_orders: number; requisitions: number }>;
  } | null;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

export type RequisitionListItem = {
  id: string;
  ref: string;
  description: string;
  status: string;
  status_label: string;
  requested_date?: string | null;
  site: string;
  store: string;
};

export type RequisitionSourcingSnapshot = {
  active_rfq: {
    id: string;
    rfq_no: string;
    status: string;
    status_label: string;
    sent_at?: string | null;
  } | null;
  rfqs: Array<{
    id: string;
    rfq_no: string;
    status: string;
    status_label: string;
    sent_at?: string | null;
    is_active: boolean;
  }>;
  quotations: Array<{
    id: string;
    rfq_no: string;
    supplier: string;
    quotation_ref: string;
    status: string;
    status_label: string;
    total: number;
  }>;
  awarded_quotation: {
    supplier: string;
    quotation_ref: string;
    total: number;
  } | null;
};

export type RequisitionDetail = RequisitionListItem & {
  approval_comment?: string | null;
  priority?: string;
  priority_label?: string;
  site_id?: string;
  store_id?: string;
  editable?: boolean;
  can_submit_for_approval?: boolean;
  lines: Array<{
    id: string;
    category: string;
    item: string;
    quantity: number;
    unit: string;
  }>;
  /** Present when procurement RFQ tables exist (read-only). */
  sourcing?: RequisitionSourcingSnapshot;
};

export type RequisitionCreateContext = {
  suggested_requisition_no: string;
  default_site_id: string | null;
  default_store_id: string | null;
  requestor_id: string;
  buyer_id: string | null;
  requested_date: string;
  sites: Array<{ id: string; label: string }>;
  stores: Array<{ id: string; site_id: string; label: string }>;
  priorities: Array<{ value: string; label: string }>;
};

export type RequisitionLineStoreItem = {
  id: string;
  code: string;
  description: string;
  category_id: string;
  unit_id: string;
  unit: string;
};

export type PurchaseOrderListItem = {
  id: string;
  ref: string;
  description: string;
  supplier_name: string;
  requisition_ref: string;
  status: string;
  status_label: string;
  order_date?: string | null;
  total_incl_vat: number | null;
  total_display: number | null;
};

export type PurchaseRfqListItem = {
  id: string;
  ref: string;
  status: string;
  status_label: string;
  sent_at?: string | null;
  requisition_ref: string;
  requisition_id: string;
  description: string;
  site: string;
  store: string;
  awarded_supplier: string;
  quotation_count: number;
};

export type PurchaseRfqDetail = PurchaseRfqListItem & {
  requisition_description: string;
  lines: Array<{
    id: string;
    item: string;
    quantity: number;
    unit: string;
    note?: string;
  }>;
  invited_suppliers: Array<{
    id: string;
    supplier: string;
    email: string;
    status: string;
  }>;
  quotations: Array<{
    id: string;
    supplier: string;
    quotation_ref: string;
    status: string;
    status_label: string;
    total: number;
  }>;
  awarded_quotation: {
    id: string;
    supplier: string;
    quotation_ref: string;
    total: number;
  } | null;
};

export type SupplierQuotationListItem = {
  id: string;
  ref: string;
  status: string;
  status_label: string;
  supplier_name: string;
  rfq_no: string;
  rfq_id: string;
  quotation_date?: string | null;
  total: number;
};

export type SupplierQuotationDetail = SupplierQuotationListItem & {
  requisition_ref: string;
  valid_until?: string | null;
  subtotal: number;
  lines: Array<{
    id: string;
    item: string;
    quantity: number;
    unit: string;
    unit_price?: number | null;
    line_total?: number | null;
    note?: string;
  }>;
};

export type PurchaseOrderDetail = PurchaseOrderListItem & {
  order_due_date?: string | null;
  approved_date?: string | null;
  total_excl_vat: number | null;
  total_vat: number | null;
  lines: Array<{
    id: string;
    category: string;
    item: string;
    quantity: number;
    unit: string;
    unit_price: number | null;
    line_total: number | null;
  }>;
};

export type CrmCustomerListItem = {
  id: string;
  code: string;
  name: string;
  status: string;
  contact: string;
  phone: string;
};

export type CrmCustomerDetail = {
  id: string;
  code: string;
  name: string;
  status: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_designation: string;
  contact_person_mobile: string;
  address: string;
  tin: string;
  vrn: string;
};

export type CrmContractListItem = {
  id: string;
  ref: string;
  customer_name: string;
  contract_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

export type CrmContractDetail = {
  id: string;
  ref: string;
  customer_id: string;
  customer_name: string;
  customer_code: string;
  contract_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  contract_period: number;
  payment_term: number;
  currency: string;
};

export type CrmQuotationListItem = {
  id: string;
  ref: string;
  description: string;
  customer_name: string;
  status: string;
  status_label: string;
  quotation_date?: string | null;
  total_amount: number | null;
};

export type CrmQuotationDetail = {
  id: string;
  ref: string;
  description: string;
  customer_name: string;
  contract_ref: string;
  status: string;
  status_label: string;
  quotation_date?: string | null;
  valid_date?: string | null;
  /** Net excl. VAT (matches web “Net (excl. VAT)”). Omitted on older API responses. */
  total_selling_price?: number | null;
  total_amount: number | null;
  total_vat: number | null;
  can_approve: boolean;
  approval_composite_id: string;
  lines: Array<{
    id: string;
    category: string;
    item: string;
    quantity: number;
    unit: string;
    unit_price: number | null;
    selling_price: number | null;
  }>;
};

export type SupplierListItem = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  status: string;
};

export type SupplierDetail = SupplierListItem & {
  address: string;
  payment_type: string;
  account_no: string;
  account_provider: string;
  currency?: string;
};

export type UnitListItem = {
  id: string;
  uom: string;
  description: string;
  status: string;
};

export type UnitDetail = UnitListItem;

export type CategoryListItem = {
  id: string;
  name: string;
  status: string;
};

export type CategoryDetail = CategoryListItem;

export type ProductListItem = {
  id: string;
  code: string;
  name: string;
  category_id: string;
  category?: string;
  unit_id: string;
  unit?: string;
  status: string;
  product_type: string;
};

export type ProductDetail = ProductListItem;

export type BankMasterListItem = {
  id: string;
  bank_code: string;
  bank_name: string;
  swift_code: string;
  status: string;
};

export type BankMasterDetail = BankMasterListItem;

export type BankBranchListItem = {
  id: string;
  branch_code: string;
  branch_name: string;
  bank_id: string;
  bank_label: string;
  status: string;
};

export type BankBranchMasterDetail = {
  id: string;
  branch_code: string;
  branch_name: string;
  bank_id: string;
  bank_name: string;
  bank_code: string;
  swift_code: string;
  status: string;
};

export type MobileOperatorListItem = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type MobileOperatorDetail = MobileOperatorListItem;

export type PartCatalogItem = {
  id: string;
  code: string;
  description: string;
  status: string;
  category: string;
  supplier: string;
  unit: string;
  stock_on_hand: number;
};

export type PartCatalogDetail = PartCatalogItem & {
  unit_id?: string | null;
  category_id?: string | null;
  supplier_id?: string | null;
  tracking_method?: string;
  stock_by_store: Array<{ store_name: string; quantity: number; status: string }>;
};

export type PartInStoreListItem = {
  id: string;
  code: string;
  description: string;
  status: string;
  store_id: string | null;
  store_name: string;
  unit: string;
  quantity: number;
  min_qty: number;
  max_qty: number;
  catalog_part_id: string | null;
  catalog_part_code: string;
  tenant_catalog_qty: number | null;
};

export type PartInStoreDetail = PartInStoreListItem & {
  tracking_method: string;
  category: string;
  supplier: string;
  catalog_part_description: string;
};

export type PartExpirationListItem = {
  id: string;
  receipt_id: string;
  receipt_no: string;
  part_in_store_id: string;
  part_code: string;
  part_description: string;
  batch_number: string | null;
  manufacture_date: string | null;
  expired_date: string | null;
  quantity: number;
  status: string;
};

export type PartExpirationDetail = PartExpirationListItem & {
  po_receipt_line_id: string | null;
  line_received_qty: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PartConversionListItem = {
  id: string;
  part_id: string;
  part_code: string;
  part_description: string;
  order_unit_id: string;
  order_unit: string;
  exchange_rate: number;
};

export type PartConversionDetail = PartConversionListItem & {
  part_status: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PriceCatalogListItem = {
  id: string;
  part_id: string;
  part_code: string;
  part_description: string;
  price: number;
  currency: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  is_consumption_active: boolean;
};

export type PriceCatalogDetail = PriceCatalogListItem & {
  source: string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  sibling_rows: PriceCatalogListItem[];
};

export type LogisticsDocListItem = {
  id: string;
  ref: string;
  description: string;
  status: string;
  status_label: string;
  document_date?: string | null;
  context?: string;
  /** Present on kitchen/store movement rows when serializer includes it. */
  total_amount?: number;
  /** Delivery note detail (mobile workspace). */
  prepared_date?: string | null;
  despatch_date?: string | null;
  order_no?: string;
  customer_name?: string;
  customer_code?: string;
  prepared_by_name?: string;
  supplier_id?: string;
  site_id?: string;
  store_id?: string;
  delivery_note?: string;
  supplier_name?: string;
  site_name?: string;
  store_name?: string;
  order_id?: string;
  department_id?: string;
  department_name?: string;
  non_po_id?: string;
  order_type?: string;
  /** Set on approved non-PO receipts when a GL journal exists. */
  ledger_posted?: boolean;
};

export type LogisticsDocLine = {
  id: string;
  item: string;
  product_code?: string;
  received_item?: string;
  ordered_item?: string;
  category_id?: string;
  unit_id?: string;
  ordered_qty?: number;
  quantity: number;
  unit: string;
  category?: string;
  note?: string;
  unit_price?: number | null;
  line_amount?: number | null;
  unit_price_reporting?: number | null;
  line_amount_reporting?: number | null;
  pax?: number | null;
  expiration_allocated_qty?: number | null;
  expiration_remaining_qty?: number | null;
  expiration_complete?: boolean | null;
  returned_item?: string;
  returned_qty?: number;
  return_reason?: string | null;
  ordered_price?: number | null;
  available_qty?: number | null;
  part_in_store_id?: string;
  quantity_requested?: number;
  quantity_issued?: number;
  quantity_finalized?: number;
};

export type GrnExpirationSummary = {
  received_qty: number;
  allocated_qty: number;
  remaining_qty: number;
  complete: boolean;
};

export type LogisticsDocDetail = LogisticsDocListItem & {
  lines: LogisticsDocLine[];
  total_amount?: number | null;
  total_amount_reporting?: number | null;
  base_currency?: string | null;
  reporting_currency?: string | null;
  expiration_summary?: GrnExpirationSummary;
};

export type StockReportStoreItem = {
  id: string;
  name: string;
  site: string;
  site_id?: string;
};

export type StockReportLine = {
  id: string;
  code: string;
  description: string;
  quantity: number;
  min_qty: number | null;
  max_qty: number | null;
  status: string;
  category: string;
  category_id?: string;
  supplier: string;
  unit: string;
  unit_id?: string;
};

export type AttendanceRow = {
  id: string;
  date: string | null;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number | null;
  overtime_hours: number;
  status: string;
  source: string;
};

export type HospitalityPropertyRef = {
  id: string;
  name: string;
};

export type HospitalityFrontDeskReservation = {
  id: string;
  document_no: string | null;
  guest_name: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  status: string;
  room_number?: string | null;
};

export type HospitalityFrontDeskSummary = {
  today: string;
  properties: HospitalityPropertyRef[];
  selected_property_id: string | null;
  arrivals: HospitalityFrontDeskReservation[];
  departures: HospitalityFrontDeskReservation[];
  in_house: HospitalityFrontDeskReservation[];
};

export type HospitalityHousekeepingRoom = {
  id: string;
  room_number: string;
  status: string;
  room_class_name: string | null;
  property_name: string | null;
};

export type HospitalityHousekeepingSummary = {
  properties: HospitalityPropertyRef[];
  selected_property_id: string | null;
  statuses: Record<string, string>;
  status_filter: string | null;
  counts: Record<string, number>;
  rooms: HospitalityHousekeepingRoom[];
};

export type HospitalityReservationListItem = {
  id: string;
  document_no: string;
  guest_name: string | null;
  property_name: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  status: string;
  room_number: string | null;
  total_amount: number;
};

export type HospitalityReservationDetail = {
  id: string;
  document_no: string;
  status: string;
  arrival_date: string | null;
  departure_date: string | null;
  guest: { id: string; name: string; phone?: string | null; email?: string | null } | null;
  property: { id: string; name: string } | null;
  room_number: string | null;
  total_amount: number;
  folio_balance: number;
  folio_status: string | null;
  nights: Array<{
    date: string | null;
    product_name: string | null;
    qty: number;
    unit_rate: number;
    line_total: number;
  }>;
};

export type HospitalityGuestListItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  country: string | null;
  status: string;
};

export type HospitalityGuestDetail = {
  id: string;
  name: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  document_type: string | null;
  document_no: string | null;
  date_of_birth: string | null;
  status: string;
  reservations: Array<{
    id: string;
    document_no: string;
    arrival_date: string | null;
    departure_date: string | null;
    status: string;
    total_amount: number;
  }>;
};

export type HospitalityFolioListItem = {
  reservation_id: string;
  reservation_no: string;
  guest_name: string | null;
  property_name: string | null;
  folio_status: string;
  folio_balance: number;
  currency: string;
  arrival_date: string | null;
  departure_date: string | null;
};

export type HospitalityFolioDetail = {
  reservation_id: string;
  reservation_no: string;
  guest_name: string | null;
  property_name: string | null;
  currency: string;
  folio_status: string;
  folio_balance: number;
  lines: Array<{
    id: string;
    posting_date: string | null;
    description: string;
    line_type: string;
    amount: number;
    currency: string;
  }>;
};

export type HospitalityOverviewSummary = {
  today: string;
  stats: {
    properties: number;
    arrivals_today: number;
    in_house: number;
  };
  properties: Array<{
    id: string;
    name: string;
    code: string | null;
    status: string;
    room_classes_count: number;
    reservations_count: number;
  }>;
};

export type HospitalityRateCatalogEntry = {
  id: string;
  product_code: string | null;
  product_name: string | null;
  room_class_name: string | null;
  rate_category_code: string | null;
  rate_category_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  amount: number;
  currency: string;
  min_stay: number | null;
};

export type HospitalityRateCatalogSummary = {
  properties: HospitalityPropertyRef[];
  selected_property_id: string | null;
  items: HospitalityRateCatalogEntry[];
  pagination: PaginationMeta;
};

export type HospitalityRoomsInventorySummary = {
  properties: HospitalityPropertyRef[];
  selected_property_id: string | null;
  room_classes: Array<{
    id: string;
    name: string;
    code: string | null;
    occupancy: string;
    occupancy_label: string;
    is_active: boolean;
    physical_rooms_count: number;
    sellable_products_count: number;
  }>;
  physical_rooms: Array<{
    id: string;
    room_number: string;
    status: string;
    room_class_name: string | null;
  }>;
  sellable_products: Array<{
    id: string;
    code: string;
    name: string | null;
    meal_plan: string | null;
    room_class_name: string | null;
  }>;
};

export type HospitalityReportsSummary = {
  properties: HospitalityPropertyRef[];
  selected_property_id: string | null;
  date: string;
  rooms_sold: number;
  total_pool: number;
  occupancy_pct: number;
  revenue: number;
  in_house: number;
  pool_by_class: Array<{
    room_class_name: string | null;
    pool_size: number;
    sold: number;
    available: number;
  }>;
};

export type HospitalityChannelManagerSummary = {
  properties: HospitalityPropertyRef[];
  selected_property_id: string | null;
  accounts: Array<{
    id: string;
    provider: string;
    environment: string;
    is_active: boolean;
    mappings_count: number;
  }>;
  recent_sync_logs: Array<{
    id: string;
    provider: string | null;
    direction: string;
    action: string;
    status: string;
    summary: string;
    created_at: string | null;
  }>;
};

export type HospitalitySalesDocument = {
  id: string;
  kind: 'quotation' | 'proforma' | 'invoice';
  document_no: string;
  status: string;
  guest_name: string | null;
  property_name: string | null;
  date: string | null;
  total_amount: number;
  currency: string;
};

export type SupportTicketSummary = {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  status_label: string;
  created_at?: string | null;
};

export type SupportTicketDetail = SupportTicketSummary & {
  description: string;
  messages: Array<{
    id: string;
    body: string;
    author: string;
    created_at?: string | null;
  }>;
};

export type PayslipListItem = {
  id: string;
  period_start?: string | null;
  period_end?: string | null;
  gross_salary: number;
  total_deductions: number;
  net_pay: number;
  released_at?: string | null;
};

export type PayslipDetail = {
  id: string;
  period_start?: string | null;
  period_end?: string | null;
  basic_salary: number;
  gross_salary: number;
  taxable_income: number;
  paye_amount: number;
  nssf_employee: number;
  nssf_employer: number;
  sdl_amount: number;
  wcf_amount: number;
  total_deductions: number;
  net_pay: number;
  lines: Array<{ id: string; label: string; amount: number; type: string }>;
};

const API_BASE_URL = resolveApiBaseUrl();

/** LAN / cellular dev. Override with EXPO_PUBLIC_API_TIMEOUT_MS (5000–120000). */
function readRequestTimeoutMs(): number {
  const raw = (process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? '').trim();
  if (raw !== '') {
    const n = Number.parseInt(raw, 10);
    if (!Number.isNaN(n)) {
      return Math.min(120_000, Math.max(5_000, n));
    }
  }
  return 20_000;
}

const REQUEST_TIMEOUT_MS = readRequestTimeoutMs();

function unreachableBackendHint(): string {
  return (
    ' On the PC running Laravel: run `php artisan serve --host=0.0.0.0 --port=8000` (not 127.0.0.1 only). ' +
    'Allow port 8000 in Windows Firewall. Phone and PC must be on the same network (or use VPN/tunnel). ' +
    'After changing app.json (cleartext), rebuild the dev client (`npx expo run:android`).'
  );
}

let onSessionInvalid: ((failedToken: string) => void) | null = null;

/** Called when an authenticated request receives HTTP 401 (e.g. revoked token). */
export function setSessionInvalidHandler(handler: ((failedToken: string) => void) | null): void {
  onSessionInvalid = handler;
}

function bearerTokenFromHeaders(headers: Headers): string | null {
  const v = headers.get('Authorization');
  if (typeof v !== 'string' || !v.startsWith('Bearer ')) {
    return null;
  }
  return v.slice('Bearer '.length).trim() || null;
}

export class ApiRequestError extends Error {
  readonly httpStatus: number;

  constructor(message: string, httpStatus: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.httpStatus = httpStatus;
  }
}

/** Hide raw SQL / stack traces from login and other API toasts. */
function sanitizeClientErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return 'Request failed. Please try again.';
  }
  if (/SQLSTATE|Connection:\s*mysql|PDOException|QueryException/i.test(trimmed)) {
    return 'Server database is unavailable. On your PC, start MySQL (XAMPP/WAMP/Laragon) and check danen-erp/.env DB_* settings.';
  }
  if (trimmed.length > 220) {
    return `${trimmed.slice(0, 217)}…`;
  }
  return trimmed;
}

function firstErrorLine(errors?: Record<string, string[]>): string | undefined {
  if (!errors) {
    return undefined;
  }
  for (const messages of Object.values(errors)) {
    if (messages?.length) {
      return messages[0];
    }
  }
  return undefined;
}

type ApiRequestInit = RequestInit & {
  /** Do not run the global 401 handler (e.g. while revoking the token on logout). */
  skipSessionInvalid?: boolean;
  /** Override default timeout (ms). Approval POSTs may run stock/GL side-effects. */
  timeoutMs?: number;
};

async function request<T>(path: string, init?: ApiRequestInit): Promise<ApiEnvelope<T>> {
  if (!API_BASE_URL) {
    throw new Error(
      'Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL in erp-mobile/.env or expo.extra.apiBaseUrl in app.json, then restart Expo with -c.'
    );
  }

  const timeoutMs = init?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const { headers: rawHeaders, signal: _ignoreSignal, body, ...restInit } = init ?? {};
  const merged = new Headers({ Accept: 'application/json' });
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData) {
    merged.set('Content-Type', 'application/json');
  }
  if (rawHeaders) {
    const extra = new Headers(rawHeaders as HeadersInit);
    extra.forEach((value, key) => {
      if (isFormData && key.toLowerCase() === 'content-type') {
        return;
      }
      merged.set(key, value);
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...restInit,
      body,
      headers: merged,
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: ApiEnvelope<T> | undefined;
    if (text) {
      try {
        payload = JSON.parse(text) as ApiEnvelope<T>;
      } catch {
        const ct = response.headers.get('content-type') ?? '';
        const snippet = text.slice(0, 160).replace(/\s+/g, ' ');
        throw new Error(
          sanitizeClientErrorMessage(
            `Server returned non-JSON (HTTP ${response.status}). ${snippet} Confirm EXPO_PUBLIC_API_BASE_URL ends with /api/v1.`,
          ),
        );
      }
    }

    const bearerToken = bearerTokenFromHeaders(merged);
    if (response.status === 401 && bearerToken && onSessionInvalid && !init?.skipSessionInvalid) {
      onSessionInvalid(bearerToken);
    }

    if (!response.ok) {
      const detail = firstErrorLine(payload?.errors);
      const rawMessage = payload?.message ?? detail ?? `Request failed (${response.status}).`;
      const friendly429 =
        response.status === 429
          ? 'Too many requests. Wait about a minute, then try again.'
          : sanitizeClientErrorMessage(rawMessage);
      throw new ApiRequestError(friendly429, response.status);
    }

    if (!payload) {
      throw new Error('Empty response from server.');
    }

    if (payload.success === false) {
      const detail = firstErrorLine(payload.errors);
      throw new Error(sanitizeClientErrorMessage(payload.message || detail || 'Request was rejected.'));
    }

    return payload;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '';

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s waiting for ${API_BASE_URL}.${unreachableBackendHint()}`,
      );
    }

    if (
      error instanceof TypeError &&
      (errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('failed to fetch'))
    ) {
      throw new Error(`Network request failed for ${API_BASE_URL}.${unreachableBackendHint()}`);
    }

    if (error instanceof Error) {
      throw new Error(sanitizeClientErrorMessage(error.message));
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function login(username: string, password: string, deviceName = 'expo-dev') {
  const safeDeviceName = deviceName.trim().slice(0, 100) || 'mobile-app';
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: username.trim(),
      password,
      device_name: safeDeviceName,
    }),
  });
}

export function me(token: string) {
  return request<MeResponse>('/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateTenantContext(token: string, tenantId: number) {
  return request<TenantContextMutationResponse>('/tenant-context', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tenant_id: tenantId }),
  });
}

export function resetTenantContext(token: string) {
  return request<TenantContextMutationResponse>('/tenant-context/reset', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export function logout(token: string, allDevices = false) {
  return request<null>('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ all_devices: allDevices }),
    skipSessionInvalid: true,
  });
}

export function getApprovals(token: string, page = 1, perPage = 25, kind?: string) {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const k = kind?.trim();
  if (k) {
    qs.set('kind', k);
  }
  return request<{ items: ApprovalItem[]; pagination: PaginationMeta; summary?: ApprovalsSummary }>(
    `/approvals?${qs.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function getApprovalsSummary(token: string) {
  return request<ApprovalsSummary>('/approvals/summary', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

const APPROVAL_ACTION_TIMEOUT_MS = 90_000;

export function approveItem(token: string, id: string, comment?: string) {
  const enc = encodeURIComponent(id);
  return request<ApprovalActionResponse>(`/approvals/${enc}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      comment: comment?.trim() ? comment.trim() : undefined,
    }),
    timeoutMs: APPROVAL_ACTION_TIMEOUT_MS,
  });
}

export function getApprovalDetail(token: string, id: string) {
  const enc = encodeURIComponent(id);
  return request<ApprovalDetail>(`/approvals/${enc}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function rejectItem(token: string, id: string, comment?: string) {
  const enc = encodeURIComponent(id);
  return request<ApprovalActionResponse>(`/approvals/${enc}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      comment: comment?.trim() ? comment.trim() : undefined,
    }),
    timeoutMs: APPROVAL_ACTION_TIMEOUT_MS,
  });
}

export function getNotifications(token: string, page = 1, perPage = 10) {
  return request<{ items: NotificationItem[]; unread_count: number; pagination: PaginationMeta }>(
    `/notifications?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export function markNotificationRead(token: string, id: string) {
  return request<null>(`/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export function markAllNotificationsRead(token: string) {
  return request<null>('/notifications/mark-all-read', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export function getLeaveTypes(token: string) {
  return request<{ items: LeaveTypeItem[] }>('/leave-types', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getLeaveRequests(token: string, page = 1, perPage = 10) {
  return request<{ items: LeaveRequestItem[]; pagination: PaginationMeta }>(
    `/leave-requests?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export function createLeaveRequest(
  token: string,
  payload: { leave_type_id?: string; leave_type?: string; date_start: string; date_end: string; notes?: string }
) {
  return request<{ id: string; status: string; leave_type: string }>('/leave-requests', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function getLeaveRequest(token: string, id: string) {
  return request<LeaveRequestDetail>(`/leave-requests/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type LeaveApprovalQueueItem = {
  id: string;
  approval_id: string;
  approval_kind: string;
  employee_name: string;
  employee_code: string;
  leave_type: string;
  date_start: string | null;
  date_end: string | null;
  days_requested: number | null;
  status: string;
  notes?: string | null;
  created_at?: string | null;
};

export function getManagerLeaveApprovalQueue(token: string, page = 1, perPage = 15) {
  return request<{ items: LeaveApprovalQueueItem[]; pagination: PaginationMeta }>(
    `/hr/leave-approvals/manager-queue?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function getHrLeaveApprovalQueue(token: string, page = 1, perPage = 15) {
  return request<{ items: LeaveApprovalQueueItem[]; pagination: PaginationMeta }>(
    `/hr/leave-approvals/hr-queue?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function getMobileSummary(token: string) {
  return request<MobileSummary>('/mobile/summary', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getMobileOperationalReports(token: string) {
  return request<MobileOperationalReports>('/mobile/reports/operational', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function cancelSupportTicket(token: string, ticketId: string) {
  return request<SupportTicketSummary>(`/support/tickets/${ticketId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
}

export function getCrmCustomers(token: string, page = 1, perPage = 15, q = '') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) qs.set('q', t);
  return request<{ items: CrmCustomerListItem[]; pagination: PaginationMeta }>(`/crm/customers?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getCrmCustomerDetail(token: string, id: string) {
  return request<CrmCustomerDetail>(`/crm/customers/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getCrmContracts(token: string, page = 1, perPage = 15, q = '') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) qs.set('q', t);
  return request<{ items: CrmContractListItem[]; pagination: PaginationMeta }>(`/crm/contracts?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getCrmContractDetail(token: string, id: string) {
  return request<CrmContractDetail>(`/crm/contracts/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getCrmQuotations(token: string, page = 1, perPage = 15, q = '', status: 'all' | 'pending' = 'all') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage), status });
  const t = q.trim();
  if (t) qs.set('q', t);
  return request<{ items: CrmQuotationListItem[]; pagination: PaginationMeta }>(`/crm/quotations?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getCrmQuotationDetail(token: string, id: string) {
  return request<CrmQuotationDetail>(`/crm/quotations/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getSuppliers(token: string, page = 1, perPage = 15, q = '') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) qs.set('q', t);
  return request<{ items: SupplierListItem[]; pagination: PaginationMeta }>(`/suppliers?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getSupplierDetail(token: string, id: string) {
  return request<SupplierDetail>(`/suppliers/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createSupplier(token: string, body: Record<string, unknown>) {
  return request<SupplierDetail>('/suppliers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updateSupplier(token: string, id: string, body: Record<string, unknown>) {
  return request<SupplierDetail>(`/suppliers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function createUnit(token: string, body: Record<string, unknown>) {
  return request<UnitDetail>('/master-data/units', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updateUnit(token: string, id: string, body: Record<string, unknown>) {
  return request<UnitDetail>(`/master-data/units/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function createCategory(token: string, body: Record<string, unknown>) {
  return request<CategoryDetail>('/master-data/categories', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updateCategory(token: string, id: string, body: Record<string, unknown>) {
  return request<CategoryDetail>(`/master-data/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function createPart(token: string, body: Record<string, unknown>) {
  return request<{ id: string; code: string; description: string; status: string }>('/parts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updatePart(token: string, id: string, body: Record<string, unknown>) {
  return request<{ id: string; code: string; description: string; status: string }>(`/parts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export type GrnReceivingLocation = {
  site_id: string;
  store_id: string;
  site_name: string;
  store_name: string;
};

export type GrnEligibleOrder = {
  id: string;
  ref: string;
  description?: string;
  supplier_name: string;
  supplier_id: string;
  status: string;
  site_id?: string;
  store_id?: string;
  site_name?: string;
  store_name?: string;
  receiving_location_count?: number;
};

export function getGrnEligiblePurchaseOrders(token: string, siteId?: string, storeId?: string) {
  const qs = new URLSearchParams();
  if (siteId) qs.set('site_id', siteId);
  if (storeId) qs.set('store_id', storeId);
  const q = qs.toString();
  return request<{ items: GrnEligibleOrder[] }>(`/inventory/po-receipts/eligible-orders${q ? `?${q}` : ''}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPoReceiptOrderReceivingLocations(token: string, orderId: string) {
  return request<{ locations: GrnReceivingLocation[] }>(
    `/inventory/po-receipts/orders/${encodeURIComponent(orderId)}/receiving-locations`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function postPoReceiptHeader(token: string, body: Record<string, unknown>) {
  return request<{ id: string; ref: string }>('/inventory/po-receipts/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putPoReceiptHeader(token: string, receiptId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/inventory/po-receipts/${encodeURIComponent(receiptId)}/header`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function postPoReceiptLine(token: string, receiptId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/inventory/po-receipts/${encodeURIComponent(receiptId)}/lines`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putPoReceiptLine(token: string, receiptId: string, lineId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(
    `/inventory/po-receipts/${encodeURIComponent(receiptId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export function deletePoReceiptLine(token: string, receiptId: string, lineId: string) {
  return request<null>(
    `/inventory/po-receipts/${encodeURIComponent(receiptId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export type PoOpenOrderLine = {
  category_id: string;
  category_name: string;
  purchased_item: string;
  description: string;
  unit_id: string;
  unit_name: string;
  open_qty: number;
  ordered_qty: number;
  unit_price: number;
};

export function getPoReceiptOpenOrderLines(token: string, orderId: string) {
  return request<{ items: PoOpenOrderLine[] }>(
    `/inventory/po-receipts/orders/${encodeURIComponent(orderId)}/open-lines`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export type NonPoLineCategory = {
  id: string;
  name: string;
};

export type NonPoLineStoreItem = {
  id: string;
  code: string;
  description: string;
  category_id: string;
  unit_id: string;
  unit: string;
  quantity: number;
};

export function getNonPoReceiptLineCategories(token: string) {
  return request<{ items: NonPoLineCategory[] }>('/inventory/non-po-receipts/line-categories', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getNonPoReceiptLineStoreItems(
  token: string,
  storeId: string,
  categoryId: string,
  q = '',
) {
  const qs = new URLSearchParams({
    store_id: storeId,
    category_id: categoryId,
  });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  return request<{ items: NonPoLineStoreItem[] }>(`/inventory/non-po-receipts/line-store-items?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function postNonPoReceiptHeader(token: string, body: Record<string, unknown>) {
  return request<{ id: string; ref: string }>('/inventory/non-po-receipts/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putNonPoReceiptHeader(token: string, receiptId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/inventory/non-po-receipts/${encodeURIComponent(receiptId)}/header`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function postNonPoReceiptLine(token: string, receiptId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/inventory/non-po-receipts/${encodeURIComponent(receiptId)}/lines`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putNonPoReceiptLine(token: string, receiptId: string, lineId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(
    `/inventory/non-po-receipts/${encodeURIComponent(receiptId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export function deleteNonPoReceiptLine(token: string, receiptId: string, lineId: string) {
  return request<null>(
    `/inventory/non-po-receipts/${encodeURIComponent(receiptId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export type PickTicketLineCategory = NonPoLineCategory;
export type PickTicketLineStoreItem = NonPoLineStoreItem;
export type SupplierReturnLineCategory = NonPoLineCategory;
export type SupplierReturnLineStoreItem = NonPoLineStoreItem & { available_qty?: number };

export function getPickTicketLineCategories(token: string) {
  return request<{ items: PickTicketLineCategory[] }>('/inventory/pick-tickets/line-categories', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPickTicketLineStoreItems(token: string, pickTicketId: string, categoryId: string, q = '') {
  const qs = new URLSearchParams({ category_id: categoryId });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  return request<{ items: PickTicketLineStoreItem[] }>(
    `/inventory/pick-tickets/${encodeURIComponent(pickTicketId)}/line-store-items?${qs.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function postPickTicketHeader(token: string, body: Record<string, unknown>) {
  return request<{ id: string; ref: string }>('/inventory/pick-tickets/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putPickTicketHeader(token: string, pickTicketId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/inventory/pick-tickets/${encodeURIComponent(pickTicketId)}/header`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function postPickTicketLine(token: string, pickTicketId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/inventory/pick-tickets/${encodeURIComponent(pickTicketId)}/lines`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putPickTicketLine(token: string, pickTicketId: string, lineId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(
    `/inventory/pick-tickets/${encodeURIComponent(pickTicketId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export function deletePickTicketLine(token: string, pickTicketId: string, lineId: string) {
  return request<null>(
    `/inventory/pick-tickets/${encodeURIComponent(pickTicketId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function getSupplierReturnLineCategories(token: string) {
  return request<{ items: SupplierReturnLineCategory[] }>('/inventory/supplier-returns/line-categories', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getSupplierReturnLineStoreItems(token: string, storeId: string, categoryId: string, q = '') {
  const qs = new URLSearchParams({
    store_id: storeId,
    category_id: categoryId,
  });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  return request<{ items: SupplierReturnLineStoreItem[] }>(
    `/inventory/supplier-returns/line-store-items?${qs.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function postSupplierReturnHeader(token: string, body: Record<string, unknown>) {
  return request<{ id: string; ref: string }>('/inventory/supplier-returns/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putSupplierReturnHeader(token: string, supplierReturnId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/inventory/supplier-returns/${encodeURIComponent(supplierReturnId)}/header`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function postSupplierReturnLine(token: string, supplierReturnId: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/inventory/supplier-returns/${encodeURIComponent(supplierReturnId)}/lines`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putSupplierReturnLine(
  token: string,
  supplierReturnId: string,
  lineId: string,
  body: Record<string, unknown>,
) {
  return request<{ id: string }>(
    `/inventory/supplier-returns/${encodeURIComponent(supplierReturnId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export function deleteSupplierReturnLine(token: string, supplierReturnId: string, lineId: string) {
  return request<null>(
    `/inventory/supplier-returns/${encodeURIComponent(supplierReturnId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

function masterDataQs(page: number, perPage: number, q: string): string {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) qs.set('q', t);
  return qs.toString();
}

export function getUnits(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: UnitListItem[]; pagination: PaginationMeta }>(`/master-data/units?${masterDataQs(page, perPage, q)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getUnitDetail(token: string, id: string) {
  return request<UnitDetail>(`/master-data/units/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getCategories(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: CategoryListItem[]; pagination: PaginationMeta }>(
    `/master-data/categories?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getCategoryDetail(token: string, id: string) {
  return request<CategoryDetail>(`/master-data/categories/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getProducts(token: string, page = 1, perPage = 50, q = '', categoryId?: string) {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  const c = categoryId?.trim();
  if (c) {
    qs.set('category_id', c);
  }
  return request<{ items: ProductListItem[]; pagination: PaginationMeta }>(`/master-data/products?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getProductDetail(token: string, id: string) {
  return request<ProductDetail>(`/master-data/products/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getBankMasterList(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: BankMasterListItem[]; pagination: PaginationMeta }>(`/master-data/banks?${masterDataQs(page, perPage, q)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getBankMasterDetail(token: string, id: string) {
  return request<BankMasterDetail>(`/master-data/banks/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getBankBranches(token: string, page = 1, perPage = 15, q = '', bankId = '') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) qs.set('q', t);
  if (bankId.trim()) qs.set('bank_id', bankId.trim());
  return request<{ items: BankBranchListItem[]; pagination: PaginationMeta }>(`/master-data/bank-branches?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getBankBranchDetail(token: string, id: string) {
  return request<BankBranchMasterDetail>(`/master-data/bank-branches/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getMobileOperators(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: MobileOperatorListItem[]; pagination: PaginationMeta }>(
    `/master-data/mobile-operators?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getMobileOperatorDetail(token: string, id: string) {
  return request<MobileOperatorDetail>(`/master-data/mobile-operators/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getRequisitions(token: string, page = 1, perPage = 10) {
  return request<{ items: RequisitionListItem[]; pagination: PaginationMeta }>(
    `/requisitions?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getRequisitionDetail(token: string, id: string) {
  return request<RequisitionDetail>(`/requisitions/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getRequisitionCreateContext(token: string) {
  return request<RequisitionCreateContext>('/requisitions/create-context', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function postRequisitionHeader(
  token: string,
  payload: {
    requisition_no?: string;
    description: string;
    priority: string;
    site_id: string;
    store_id: string;
    buyer?: string;
    requestor?: string;
    requested_date?: string;
  },
) {
  return request<{ id: string; ref: string }>('/requisitions/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function putRequisitionHeader(
  token: string,
  id: string,
  payload: { description: string; priority: string },
) {
  return request<{ id: string }>(`/requisitions/${encodeURIComponent(id)}/header`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function postRequisitionSubmitForApproval(token: string, id: string) {
  return request<{ id: string; status: string; status_label: string }>(
    `/requisitions/${encodeURIComponent(id)}/submit-for-approval`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function getRequisitionLineCategories(token: string) {
  return request<{ items: Array<{ id: string; name: string }> }>('/requisitions/line-categories', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getRequisitionLineStoreItems(token: string, storeId: string, categoryId: string, q = '') {
  const qs = new URLSearchParams({ store_id: storeId, category_id: categoryId });
  if (q.trim()) qs.set('q', q.trim());
  return request<{ items: RequisitionLineStoreItem[] }>(`/requisitions/line-store-items?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function postRequisitionLines(
  token: string,
  id: string,
  lines: Array<{ category_id: string; requested_item: string; unit_id: string; quantity: number }>,
) {
  return request<{ inserted: number; skipped_duplicates: number; skipped_invalid: number }>(
    `/requisitions/${encodeURIComponent(id)}/lines`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    },
  );
}

export function putRequisitionLineQuantity(token: string, requisitionId: string, lineId: string, quantity: number) {
  return request<{ id: string }>(`/requisitions/${encodeURIComponent(requisitionId)}/lines/${encodeURIComponent(lineId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
}

export function deleteRequisitionLine(token: string, requisitionId: string, lineId: string) {
  return request<null>(`/requisitions/${encodeURIComponent(requisitionId)}/lines/${encodeURIComponent(lineId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPurchaseOrders(token: string, page = 1, perPage = 10) {
  return request<{ items: PurchaseOrderListItem[]; pagination: PaginationMeta }>(
    `/purchase-orders?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getPurchaseRfqs(token: string, page = 1, perPage = 15, q = '') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (q.trim()) qs.set('q', q.trim());
  return request<{ items: PurchaseRfqListItem[]; pagination: PaginationMeta }>(
    `/procurement/purchase-rfqs?${qs.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function getPurchaseRfqDetail(token: string, id: string) {
  return request<PurchaseRfqDetail>(`/procurement/purchase-rfqs/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getSupplierQuotations(token: string, page = 1, perPage = 15, q = '') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (q.trim()) qs.set('q', q.trim());
  return request<{ items: SupplierQuotationListItem[]; pagination: PaginationMeta }>(
    `/procurement/supplier-quotations?${qs.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function getSupplierQuotationDetail(token: string, id: string) {
  return request<SupplierQuotationDetail>(`/procurement/supplier-quotations/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPurchaseOrderDetail(token: string, id: string) {
  return request<PurchaseOrderDetail>(`/purchase-orders/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPartCatalog(token: string, page = 1, perPage = 15, q = '') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  return request<{ items: PartCatalogItem[]; pagination: PaginationMeta }>(`/parts?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPartCatalogDetail(token: string, id: string) {
  return request<PartCatalogDetail>(`/parts/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

function partsMgmtQs(page: number, perPage: number, q: string, extra?: Record<string, string>) {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== '') {
        qs.set(k, v);
      }
    }
  }
  return qs;
}

export function getPartsInStore(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: PartInStoreListItem[]; pagination: PaginationMeta }>(
    `/parts/in-store?${partsMgmtQs(page, perPage, q).toString()}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getPartInStoreDetail(token: string, id: string) {
  return request<PartInStoreDetail>(`/parts/in-store/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPartExpirations(token: string, page = 1, perPage = 15, q = '', expiringWithinDays = 0) {
  const extra: Record<string, string> = {};
  if (expiringWithinDays > 0) {
    extra.expiring_within_days = String(expiringWithinDays);
  }
  return request<{ items: PartExpirationListItem[]; pagination: PaginationMeta }>(
    `/parts/expirations?${partsMgmtQs(page, perPage, q, extra).toString()}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getPartExpirationDetail(token: string, id: string) {
  return request<PartExpirationDetail>(`/parts/expirations/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPartConversions(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: PartConversionListItem[]; pagination: PaginationMeta }>(
    `/parts/conversions?${partsMgmtQs(page, perPage, q).toString()}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getPartConversionDetail(token: string, id: string) {
  return request<PartConversionDetail>(`/parts/conversions/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPriceCatalog(token: string, page = 1, perPage = 15, q = '', activeOnly = false) {
  const extra: Record<string, string> = {};
  if (activeOnly) {
    extra.active_only = '1';
  }
  return request<{ items: PriceCatalogListItem[]; pagination: PaginationMeta }>(
    `/parts/price-catalog?${partsMgmtQs(page, perPage, q, extra).toString()}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getPriceCatalogDetail(token: string, id: string) {
  return request<PriceCatalogDetail>(`/parts/price-catalog/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type PickerOption = { id: string; label: string; code?: string };

export type PartCatalogCreateContext = {
  units: PickerOption[];
  categories: PickerOption[];
  suppliers: PickerOption[];
  statuses: string[];
};

export function getPartCatalogCreateContext(token: string) {
  return request<PartCatalogCreateContext>('/parts/create-context', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type PartInStoreCreateContext = {
  suggested_code: string;
  stores: Array<{ id: string; name: string; site: string }>;
  catalog_parts: PickerOption[];
  statuses: string[];
};

export function getPartInStoreCreateContext(token: string) {
  return request<PartInStoreCreateContext>('/parts/in-store/create-context', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createPartInStore(token: string, body: Record<string, unknown>) {
  return request<{ id: string }>('/parts/in-store', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updatePartInStore(token: string, id: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/parts/in-store/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export type PartConversionCreateContext = {
  catalog_parts: PickerOption[];
  units: PickerOption[];
};

export function getPartConversionCreateContext(token: string) {
  return request<PartConversionCreateContext>('/parts/conversions/create-context', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createPartConversion(token: string, body: Record<string, unknown>) {
  return request<{ id: string }>('/parts/conversions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updatePartConversion(token: string, id: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/parts/conversions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export type PriceCatalogCreateContext = {
  catalog_parts: PickerOption[];
  currencies: Array<{ code: string; label: string }>;
  price_modes: Array<{ value: string; label: string }>;
  update_price_modes: Array<{ value: string; label: string }>;
};

export function getPriceCatalogCreateContext(token: string) {
  return request<PriceCatalogCreateContext>('/parts/price-catalog/create-context', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createPriceCatalogRow(token: string, body: Record<string, unknown>) {
  return request<{ id: string }>('/parts/price-catalog', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updatePriceCatalogRow(token: string, id: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/parts/price-catalog/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function activatePriceCatalogRow(token: string, id: string) {
  return request<{ id: string }>(`/parts/price-catalog/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type ExpirationReceiptOption = {
  id: string;
  receipt_no: string;
  store_name: string;
  status_label: string;
};

export function getExpirationReceiptsContext(token: string) {
  return request<{ items: ExpirationReceiptOption[] }>('/parts/expirations/receipts-context', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type ExpirationLineOption = {
  id: string;
  part_in_store_id: string;
  part_code: string;
  part_description: string;
  unit: string;
  received_qty: number;
  allocated_qty: number;
  remaining_qty: number;
};

export function getExpirationReceiptLinesContext(token: string, receiptId: string) {
  return request<{ receipt: { id: string; receipt_no: string }; lines: ExpirationLineOption[] }>(
    `/parts/expirations/receipts/${encodeURIComponent(receiptId)}/lines-context`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function createPartExpiration(token: string, body: Record<string, unknown>) {
  return request<{ id: string }>('/parts/expirations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updatePartExpiration(token: string, id: string, body: Record<string, unknown>) {
  return request<{ id: string }>(`/parts/expirations/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function deletePartExpiration(token: string, id: string) {
  return request<null>(`/parts/expirations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getLogisticsDocList(token: string, basePath: string, page = 1, perPage = 15, q = '') {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  return request<{ items: LogisticsDocListItem[]; pagination: PaginationMeta }>(`/${basePath}?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getLogisticsDocDetail(token: string, basePath: string, id: string) {
  return request<LogisticsDocDetail>(`/${basePath}/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type LogisticsWriteResponse = {
  id: string;
  issue_no?: string;
  delivery_note?: string;
  approval_mail_note?: string | null;
  doc_kind?: string;
};

export type DeliveryNoteLineMutationResponse = {
  line_id?: string;
  delivery_note_id: string;
  removed_line_id?: string;
};

export function postKitchenToStoreMovement(token: string, body: Record<string, unknown>) {
  return request<LogisticsWriteResponse>('/inventory/movements/kitchen-to-store', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export function postStoreToKitchenMovement(token: string, body: Record<string, unknown>) {
  return request<LogisticsWriteResponse>('/inventory/movements/store-to-kitchen', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export type StoreMovementHeaderResponse = {
  id: string;
  issue_no: string;
  doc_kind: 'kitchen_to_store' | 'store_to_kitchen';
};

export function postKitchenToStoreMovementHeader(token: string, body: Record<string, unknown>) {
  return request<StoreMovementHeaderResponse>('/inventory/movements/kitchen-to-store/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export function postStoreToKitchenMovementHeader(token: string, body: Record<string, unknown>) {
  return request<StoreMovementHeaderResponse>('/inventory/movements/store-to-kitchen/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export type StoreMovementLineMutationResponse = {
  line_id?: string;
  issue_id: string;
  total_amount: number;
};

export function postKitchenToStoreMovementLine(token: string, issueId: string, body: Record<string, unknown>) {
  return request<StoreMovementLineMutationResponse>(
    `/inventory/movements/kitchen-to-store/${encodeURIComponent(issueId)}/lines`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    },
  );
}

export function deleteKitchenToStoreMovementLine(token: string, issueId: string, lineId: string) {
  return request<StoreMovementLineMutationResponse>(
    `/inventory/movements/kitchen-to-store/${encodeURIComponent(issueId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function postStoreToKitchenMovementLine(token: string, issueId: string, body: Record<string, unknown>) {
  return request<StoreMovementLineMutationResponse>(
    `/inventory/movements/store-to-kitchen/${encodeURIComponent(issueId)}/lines`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    },
  );
}

export function deleteStoreToKitchenMovementLine(token: string, issueId: string, lineId: string) {
  return request<StoreMovementLineMutationResponse>(
    `/inventory/movements/store-to-kitchen/${encodeURIComponent(issueId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

/** GET list/detail base path for logistics helpers (matches Laravel routes). */
export function storeMovementDetailBasePath(docKind: 'kitchen_to_store' | 'store_to_kitchen'): string {
  return docKind === 'kitchen_to_store' ? 'inventory/movements/kitchen-to-store' : 'inventory/movements/store-to-kitchen';
}

export function postDeliveryNote(token: string, body: Record<string, unknown>) {
  return request<LogisticsWriteResponse>('/inventory/delivery-notes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export function postDeliveryNoteHeader(token: string, body: Record<string, unknown>) {
  return request<LogisticsWriteResponse>('/inventory/delivery-notes/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export function postDeliveryNoteLine(token: string, deliveryNoteId: string, body: Record<string, unknown>) {
  return request<DeliveryNoteLineMutationResponse>(
    `/inventory/delivery-notes/${encodeURIComponent(deliveryNoteId)}/lines`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    },
  );
}

export function deleteDeliveryNoteLine(token: string, deliveryNoteId: string, lineId: string) {
  return request<DeliveryNoteLineMutationResponse>(
    `/inventory/delivery-notes/${encodeURIComponent(deliveryNoteId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function postDeliveryNoteSubmitForApproval(token: string, deliveryNoteId: string) {
  return request<LogisticsWriteResponse>(`/inventory/delivery-notes/${encodeURIComponent(deliveryNoteId)}/submit-for-approval`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
}

export function getStockReportStores(token: string) {
  return request<{ items: StockReportStoreItem[] }>('/inventory/stock-report/stores', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type CatalogUnitPrice = {
  price: number;
  currency: string | null;
  catalog_id: string | null;
  end_date: string | null;
  status: string | null;
  part_id: string;
};

export function getCatalogUnitPrice(
  token: string,
  partInStoreId: string,
  asOf?: string,
) {
  const qs = new URLSearchParams({ part_in_store_id: partInStoreId });
  if (asOf?.trim()) {
    qs.set('as_of', asOf.trim());
  }
  return request<CatalogUnitPrice>(`/inventory/catalog-unit-price?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getStockReportLines(token: string, storeId: string, page = 1, perPage = 30, q = '') {
  const qs = new URLSearchParams({
    store_id: storeId,
    page: String(page),
    per_page: String(perPage),
  });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  return request<{ items: StockReportLine[]; pagination: PaginationMeta }>(
    `/inventory/stock-report/lines?${qs.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getAttendance(token: string, days = 45) {
  return request<{ items: AttendanceRow[]; from_date: string }>(`/attendance?days=${days}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type AttendanceToday = {
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number | null;
  status: string;
  source: string;
  can_check_in: boolean;
  can_check_out: boolean;
  completed: boolean;
  next_action: 'check_in' | 'check_out' | 'none';
};

export function getAttendanceToday(token: string) {
  return request<AttendanceToday>('/attendance/today', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function postAttendancePunch(token: string) {
  return request<AttendanceToday>('/attendance/punch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityFrontDeskSummary(token: string, propertyId?: string | null) {
  const qs = new URLSearchParams();
  if (propertyId && propertyId.trim() !== '') {
    qs.set('property_id', propertyId.trim());
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<HospitalityFrontDeskSummary>(`/hospitality/front-desk/summary${suffix}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityHousekeepingRooms(
  token: string,
  params?: { propertyId?: string | null; status?: string | null },
) {
  const qs = new URLSearchParams();
  if (params?.propertyId && params.propertyId.trim() !== '') {
    qs.set('property_id', params.propertyId.trim());
  }
  if (params?.status && params.status.trim() !== '') {
    qs.set('status', params.status.trim());
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<HospitalityHousekeepingSummary>(`/hospitality/housekeeping/rooms${suffix}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityReservations(
  token: string,
  page = 1,
  perPage = 15,
  q = '',
  params?: { propertyId?: string | null; status?: string | null },
) {
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  if (params?.propertyId && params.propertyId.trim() !== '') {
    qs.set('property_id', params.propertyId.trim());
  }
  if (params?.status && params.status.trim() !== '') {
    qs.set('status', params.status.trim());
  }
  return request<{ items: HospitalityReservationListItem[]; pagination: PaginationMeta }>(
    `/hospitality/reservations?${qs.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function getHospitalityReservationDetail(token: string, id: string) {
  return request<HospitalityReservationDetail>(`/hospitality/reservations/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityGuests(token: string, page = 1, perPage = 15, q = '') {
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  return request<{ items: HospitalityGuestListItem[]; pagination: PaginationMeta }>(`/hospitality/guests?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityGuestDetail(token: string, id: string) {
  return request<HospitalityGuestDetail>(`/hospitality/guests/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityFolios(token: string, page = 1, perPage = 15, q = '', status?: string | null) {
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  if (status && status.trim() !== '') {
    qs.set('status', status.trim());
  }
  return request<{ items: HospitalityFolioListItem[]; pagination: PaginationMeta }>(`/hospitality/folios?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityFolioDetail(token: string, reservationId: string) {
  return request<HospitalityFolioDetail>(`/hospitality/reservations/${encodeURIComponent(reservationId)}/folio`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function postHospitalityFolioPayment(token: string, reservationId: string, amount: number, description?: string) {
  return request<HospitalityFolioDetail>(`/hospitality/reservations/${encodeURIComponent(reservationId)}/folio/payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, description }),
  });
}

export function postHospitalityFolioCharge(token: string, reservationId: string, amount: number, description: string) {
  return request<HospitalityFolioDetail>(`/hospitality/reservations/${encodeURIComponent(reservationId)}/folio/charge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, description }),
  });
}

export function getHospitalityOverview(token: string) {
  return request<HospitalityOverviewSummary>('/hospitality/overview', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityRateCatalog(token: string, page = 1, perPage = 20, propertyId?: string | null) {
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (propertyId && propertyId.trim() !== '') {
    qs.set('property_id', propertyId.trim());
  }
  return request<HospitalityRateCatalogSummary>(`/hospitality/rate-catalog?${qs.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityRoomsInventory(token: string, propertyId?: string | null) {
  const qs = new URLSearchParams();
  if (propertyId && propertyId.trim() !== '') {
    qs.set('property_id', propertyId.trim());
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<HospitalityRoomsInventorySummary>(`/hospitality/rooms-inventory${suffix}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityReportsSummary(token: string, params?: { propertyId?: string | null; date?: string | null }) {
  const qs = new URLSearchParams();
  if (params?.propertyId && params.propertyId.trim() !== '') {
    qs.set('property_id', params.propertyId.trim());
  }
  if (params?.date && params.date.trim() !== '') {
    qs.set('date', params.date.trim());
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<HospitalityReportsSummary>(`/hospitality/reports/summary${suffix}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityChannelManagerSummary(token: string, propertyId?: string | null) {
  const qs = new URLSearchParams();
  if (propertyId && propertyId.trim() !== '') {
    qs.set('property_id', propertyId.trim());
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<HospitalityChannelManagerSummary>(`/hospitality/channel-manager/summary${suffix}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHospitalityReservationSales(
  token: string,
  page = 1,
  perPage = 15,
  q = '',
  kind: 'all' | 'quotation' | 'proforma' | 'invoice' = 'all',
) {
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    kind,
  });
  const t = q.trim();
  if (t) {
    qs.set('q', t);
  }
  return request<{ items: HospitalitySalesDocument[]; pagination: PaginationMeta }>(
    `/hospitality/reservation-sales?${qs.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export type PosSummary = {
  orders: number;
  gross: number;
  tax: number;
  by_module: Record<string, { orders: number; gross: number }>;
};

export type PosTerminalSummary = {
  id: number;
  code: string;
  name: string;
  site_id: number;
  store_id?: number | null;
  hotel_property_id?: number | null;
};

export type PosPortalSummary = {
  summary: PosSummary;
  terminals: PosTerminalSummary[];
};

export function getPosStandaloneSummary(token: string) {
  return request<PosPortalSummary>('/pos/standalone/summary', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPosHospitalitySummary(token: string) {
  return request<PosPortalSummary>('/pos/hospitality/summary', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPosReportsSummary(
  token: string,
  params?: { source_module?: 'pos_standalone' | 'pos_hospitality'; from?: string; to?: string },
) {
  const qs = new URLSearchParams();
  if (params?.source_module) qs.set('source_module', params.source_module);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<{ summary: PosSummary; reconciliation: PosSummary }>(`/pos/reports/summary${suffix}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getSupportTickets(token: string) {
  return request<{ items: SupportTicketSummary[] }>('/support/tickets', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getSupportTicket(token: string, id: string) {
  return request<SupportTicketDetail>(`/support/tickets/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createSupportTicket(
  token: string,
  payload: { category: 'support_request' | 'bug_report' | 'other'; subject: string; description: string }
) {
  return request<SupportTicketDetail>('/support/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function postSupportTicketMessage(token: string, ticketId: string, body: string) {
  return request<SupportTicketDetail>(`/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ body }),
  });
}

export function getPayslips(token: string) {
  return request<{ items: PayslipListItem[] }>('/payslips', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPayslipDetail(token: string, id: string) {
  return request<PayslipDetail>(`/payslips/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ----------------------------
// Finance (commercial) - Phase 1
// ----------------------------

export type CustomerInvoiceListItem = {
  id: string;
  ref: string;
  description: string;
  customer_name: string;
  status: string;
  status_label: string;
  invoice_date?: string | null;
  due_date?: string | null;
  total_amount?: number | null;
};

export type FinanceCommercialLine = {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  category: string;
  unit_price?: number | null;
  gross_excl_vat?: number | null;
  line_discount?: string;
  vat?: number | null;
  amount_excl_vat?: number | null;
};

export type CustomerInvoiceDetail = CustomerInvoiceListItem & {
  sales_type?: string;
  sales_type_label?: string;
  customer_code?: string;
  contract_ref?: string;
  vat_treatment?: string;
  vat_treatment_label?: string;
  discount_type?: string;
  discount_type_label?: string;
  discount_value?: number | null;
  discount_amount?: number | null;
  document_discount_label?: string;
  as_from_date?: string | null;
  to_date?: string | null;
  approved_date?: string | null;
  payment_term_days?: number | null;
  currency?: string;
  po_no?: string;
  referenced_invoice_ref?: string;
  subtotal_excl_vat?: number | null;
  total_vat?: number | null;
  lines: FinanceCommercialLine[];
  ledger_posted?: boolean;
  ledger_reversed?: boolean;
  can_record_payment?: boolean;
  payment?: {
    id: string;
    paid_amount?: number | null;
    due_amount?: number | null;
    status: string;
  };
};

export type ReceiptBankOption = {
  id: string;
  label: string;
  currency: string;
};

export type RecordInvoicePaymentResult = {
  payment_id: string;
  paid_amount: number;
  due_amount: number;
  status: string;
  invoice_status: string;
  gl_queued: boolean;
};

export type ProformaInvoiceListItem = {
  id: string;
  ref: string;
  description: string;
  customer_name: string;
  status: string;
  status_label: string;
  invoice_date?: string | null;
  total_amount?: number | null;
};

export type ProformaInvoiceDetail = ProformaInvoiceListItem & {
  contract_ref?: string;
  valid_date?: string | null;
  vat_treatment?: string;
  vat_treatment_label?: string;
  discount_type?: string;
  discount_type_label?: string;
  discount_value?: number | null;
  discount_amount?: number | null;
  document_discount_label?: string;
  as_from_date?: string | null;
  to_date?: string | null;
  payment_term_days?: number | null;
  currency?: string;
  subtotal_excl_vat?: number | null;
  total_vat?: number | null;
  lines: FinanceCommercialLine[];
};

export type PaymentListItem = {
  id: string;
  ref: string;
  customer_name: string;
  status: string;
  status_label: string;
  paid_amount?: number | null;
  total_amount?: number | null;
};

export type PaymentDetail = PaymentListItem & {
  invoice_ref?: string;
  due_amount?: number | null;
  remaining_amount?: number | null;
};

export type PaymentVoucherListItem = {
  id: string;
  ref: string;
  description: string;
  status: string;
  status_label: string;
  prepared_date?: string | null;
  total_amount?: number | null;
};

export type PaymentVoucherDetail = PaymentVoucherListItem & {
  approved_date?: string | null;
  voucher_purpose?: string | null;
  ledger_posted?: boolean;
  journal_entry_id?: string | null;
  lines: Array<{
    id: string;
    payee_name?: string;
    account_no?: string;
    payment_category?: number;
    pay_to?: number;
    net_pay?: number | null;
    total_pay?: number | null;
    description: string;
    amount?: number | null;
  }>;
};

export type SupplierInvoiceListItem = {
  id: string;
  ref: string;
  supplier_name: string;
  status: string;
  status_label: string;
  invoice_date?: string | null;
  total_gross?: number | null;
};

export type SupplierInvoiceDetail = SupplierInvoiceListItem & {
  supplier_reference?: string;
  due_date?: string | null;
  vat_treatment?: string;
  vat_treatment_label?: string;
  total_net?: number | null;
  total_vat?: number | null;
  lines: Array<{
    id: string;
    description: string;
    quantity?: number | null;
    unit_price?: number | null;
    line_total?: number | null;
  }>;
};

export function getCustomerInvoices(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: CustomerInvoiceListItem[]; pagination: PaginationMeta }>(
    `/finance/invoices?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getCustomerInvoiceDetail(token: string, id: string) {
  return request<CustomerInvoiceDetail>(`/finance/invoices/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getFinanceReceiptBanks(token: string) {
  return request<{ banks: ReceiptBankOption[] }>(`/finance/receipt-banks`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function recordCustomerInvoicePayment(
  token: string,
  invoiceId: string,
  body: {
    amount: number;
    payment_reference?: string;
    receipt_bank_id?: number;
    settle_in_full?: boolean;
  },
) {
  return request<RecordInvoicePaymentResult>(`/finance/invoices/${encodeURIComponent(invoiceId)}/record-payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function getProformaInvoices(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: ProformaInvoiceListItem[]; pagination: PaginationMeta }>(
    `/finance/proformas?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getProformaInvoiceDetail(token: string, id: string) {
  return request<ProformaInvoiceDetail>(`/finance/proformas/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPayments(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: PaymentListItem[]; pagination: PaginationMeta }>(
    `/finance/payments?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getPaymentDetail(token: string, id: string) {
  return request<PaymentDetail>(`/finance/payments/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPaymentVouchers(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: PaymentVoucherListItem[]; pagination: PaginationMeta }>(
    `/finance/payment-vouchers?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getPaymentVoucherDetail(token: string, id: string) {
  return request<PaymentVoucherDetail>(`/finance/payment-vouchers/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type PettyCashPaymentMethod = 0 | 1 | 2 | 3;

export type PettyCashRequestListItem = {
  id: string;
  ref: string;
  document_no?: string;
  description: string;
  request_type?: 'imprest' | 'expense_claim' | 'imprest_retirement' | string;
  workflow_status?: string;
  status_label: string;
  requested_date?: string | null;
  prepared_date?: string | null;
  total_amount?: number | null;
  can_submit_retirement?: boolean;
  imprest_retirement_id?: string | null;
  imprest_parent_id?: string | null;
};

export type PettyCashRequestCategory =
  | 'training'
  | 'medical'
  | 'travel'
  | 'staff_welfare'
  | 'general';

export type PettyCashRequestLineInput = {
  line_description: string;
  amount: number;
  currency?: string;
};

export type PaymentVoucherLineInput = {
  payee_name: string;
  account_no?: string;
  payment_category: number;
  pay_to: number;
  net_pay: number;
  advance_amount?: number;
  supplier_id?: number;
};

export type PettyCashAttachmentItem = {
  id: string;
  kind: string;
  name: string;
  download_url: string;
};

export type PettyCashRequestDetail = PettyCashRequestListItem & {
  request_type_label?: string;
  request_category?: string;
  request_category_label?: string;
  currency?: string;
  payment_method: number;
  finance_approved_date?: string | null;
  retirement_notes?: string | null;
  retirement_submitted_at?: string | null;
  rejection_reason?: string | null;
  ledger_posted?: boolean;
  can_edit?: boolean;
  can_submit?: boolean;
  imprest_parent_ref?: string | null;
  requested_amount?: number | null;
  total_spent?: number | null;
  refund_from_staff?: number | null;
  refund_to_staff?: number | null;
  outstanding_amount?: number | null;
  amount_in_word?: string | null;
  payment_method_label?: string;
  requested_by_label?: string;
  site_id?: string | null;
  store_id?: string | null;
  site_label?: string | null;
  store_label?: string | null;
  viewer_is_requester?: boolean;
  retired_date?: string | null;
  debit_account?: { code: string; name: string } | null;
  imprest_parent_debit_gl?: { code: string; name: string } | null;
  approval_ui?: {
    can_approve_site: boolean;
    can_approve_finance: boolean;
    can_reject: boolean;
    requires_expense_gl: boolean;
    imprest_auto_ledger: boolean;
    imprest_employee_gl?: {
      employee_code?: string;
      employee_name?: string;
      gl_code?: string;
      gl_name?: string;
      error?: string;
    } | null;
    gl_accounts?: Array<{ id: string; code: string; name: string }>;
    petty_cash_pool_gl_code?: string;
    payment_method_label?: string;
  } | null;
  attachments?: PettyCashAttachmentItem[];
  lines: Array<{
    id: string;
    line_description: string;
    currency: string;
    amount: number;
  }>;
};

export function getPettyCashRequests(
  token: string,
  page = 1,
  perPage = 15,
  opts?: { requestType?: 'imprest' | 'expense_claim' | 'imprest_retirement'; awaitingRetirement?: boolean },
) {
  const qs = new URLSearchParams(masterDataQs(page, perPage, ''));
  if (opts?.requestType) qs.set('request_type', opts.requestType);
  if (opts?.awaitingRetirement) qs.set('awaiting_retirement', '1');

  return request<{ items: PettyCashRequestListItem[]; pagination: PaginationMeta }>(
    `/finance/petty-cash-requests?${qs.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function getPettyCashRequestDetail(token: string, id: string) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type StaffFinanceSiteOption = { id: string; label: string };
export type StaffFinanceStoreOption = { id: string; site_id: string; label: string };

export type StaffFinanceCreateContext = {
  outstanding_total: number;
  outstanding_items: Array<{ id: string; document_no: string; total_amount: number; currency: string }>;
  default_site_id?: string | null;
  default_store_id?: string | null;
  sites?: StaffFinanceSiteOption[];
  stores?: StaffFinanceStoreOption[];
};

export function getStaffFinanceCreateContext(token: string) {
  return request<StaffFinanceCreateContext>('/finance/petty-cash-requests/create-context', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createStaffFinanceRequestHeader(
  token: string,
  payload: {
    request_type: 'imprest' | 'expense_claim';
    description: string;
    request_category: PettyCashRequestCategory;
    currency: string;
    payment_method: PettyCashPaymentMethod;
    site_id: number;
    store_id: number;
  },
) {
  return request<PettyCashRequestDetail>('/finance/petty-cash-requests/header', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateStaffFinanceHeader(
  token: string,
  requestId: string,
  payload: {
    description: string;
    request_category: PettyCashRequestCategory;
    currency: string;
    payment_method: PettyCashPaymentMethod;
    site_id?: number;
    store_id?: number;
  },
) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(requestId)}/header`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function createPettyCashRequest(
  token: string,
  payload: {
    request_type: 'imprest' | 'expense_claim';
    description: string;
    request_category: PettyCashRequestCategory;
    currency: string;
    payment_method: PettyCashPaymentMethod;
    submit?: boolean;
    lines: PettyCashRequestLineInput[];
  },
  receiptUris: string[] = [],
) {
  const form = new FormData();
  form.append('request_type', payload.request_type);
  form.append('description', payload.description);
  form.append('request_category', payload.request_category);
  form.append('currency', payload.currency);
  form.append('payment_method', String(payload.payment_method));
  form.append('submit', payload.submit !== false ? '1' : '0');
  form.append('lines', JSON.stringify(payload.lines));
  receiptUris.forEach((uri, i) => {
    form.append('attachments[]', {
      uri,
      name: `receipt-${i}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  });

  return request<PettyCashRequestDetail>('/finance/petty-cash-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

export function beginStaffFinanceRetirement(token: string, imprestId: string) {
  return request<PettyCashRequestDetail>(
    `/finance/petty-cash-requests/${encodeURIComponent(imprestId)}/begin-retirement`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    },
  );
}

export function saveStaffFinanceLine(
  token: string,
  requestId: string,
  payload: { line_description: string; amount: number; line_id?: string },
) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(requestId)}/lines`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteStaffFinanceLine(token: string, requestId: string, lineId: string) {
  return request<PettyCashRequestDetail>(
    `/finance/petty-cash-requests/${encodeURIComponent(requestId)}/lines/${encodeURIComponent(lineId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export function uploadStaffFinanceAttachments(token: string, requestId: string, fileUris: string[]) {
  const form = new FormData();
  fileUris.forEach((uri, i) => {
    form.append('attachments[]', {
      uri,
      name: `document-${i}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  });

  return request<PettyCashRequestDetail>(
    `/finance/petty-cash-requests/${encodeURIComponent(requestId)}/attachments`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
}

export function updateStaffFinanceRetirementNotes(token: string, requestId: string, retirementNotes: string) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(requestId)}/header`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ retirement_notes: retirementNotes }),
  });
}

export function updateStaffFinanceRetirementHeader(
  token: string,
  requestId: string,
  payload: { retirement_notes?: string; retired_date: string },
) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(requestId)}/header`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function submitStaffFinanceRequest(token: string, requestId: string) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(requestId)}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
}

/** @deprecated Use beginStaffFinanceRetirement + workspace submit flow */
export function submitPettyCashRetirement(
  token: string,
  id: string,
  notes: string,
  receiptUris: string[],
) {
  const form = new FormData();
  form.append('notes', notes);
  receiptUris.forEach((uri, i) => {
    form.append('attachments[]', {
      uri,
      name: `receipt-${i}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  });

  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(id)}/retirement`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

export function approvePettyCashSite(token: string, id: string) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(id)}/approve-site`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
}

export function approvePettyCashFinance(token: string, id: string, debitAccountId?: number) {
  const body: { debit_account_id?: number } = {};
  if (debitAccountId != null && debitAccountId > 0) {
    body.debit_account_id = debitAccountId;
  }
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(id)}/approve-finance`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function approvePettyCashRetirement(token: string, id: string, debitAccountId: number) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(id)}/approve-retirement`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ debit_account_id: debitAccountId }),
  });
}

export function rejectPettyCashRequest(token: string, id: string, comment?: string) {
  return request<PettyCashRequestDetail>(`/finance/petty-cash-requests/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ comment: comment ?? '' }),
  });
}

export function createPaymentVoucher(
  token: string,
  payload: {
    description: string;
    payment_method: PettyCashPaymentMethod;
    submit?: boolean;
    lines: PaymentVoucherLineInput[];
  },
) {
  const form = new FormData();
  form.append('description', payload.description);
  form.append('payment_method', String(payload.payment_method));
  form.append('submit', payload.submit !== false ? '1' : '0');
  form.append('lines', JSON.stringify(payload.lines));

  return request<PaymentVoucherDetail>('/finance/payment-vouchers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

export function getSupplierInvoices(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: SupplierInvoiceListItem[]; pagination: PaginationMeta }>(
    `/finance/supplier-invoices?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getSupplierInvoiceDetail(token: string, id: string) {
  return request<SupplierInvoiceDetail>(`/finance/supplier-invoices/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ----------------------------
// Accounting (GL & setup)
// ----------------------------

export type AccountingListItem = {
  id: string;
  ref: string;
  subtitle?: string;
  meta?: string;
};

export type AccountingCurrencyDetail = {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  decimals?: number | null;
  is_active: boolean;
  is_functional: boolean;
  sort_order?: number | null;
};

export type AccountingExchangeRateWeekDetail = {
  id: string;
  week_start?: string | null;
  usd_to_tzs: string;
  eur_to_tzs: string;
  source: string;
};

export type AccountingSupplierWhtTypeDetail = {
  id: string;
  name: string;
  description: string;
  rate_percent?: number | null;
  is_active: boolean;
  sort_order?: number | null;
};

export type AccountingPeriodDetail = {
  id: string;
  year: number;
  month: number;
  status: string;
  closed_at?: string | null;
};

export type AccountingAccountDetail = {
  id: string;
  code: string;
  name: string;
  account_type: string;
  category: string;
  is_active: boolean;
  allow_manual_posting: boolean;
};

export type AccountingJournalLine = {
  id: string;
  account_code: string;
  account_name: string;
  side: string;
  amount?: number | null;
  description: string;
};

export type AccountingJournalEntryDetail = {
  id: string;
  reference: string;
  description: string;
  entry_date?: string | null;
  status: string;
  source_module: string;
  posted_at?: string | null;
  lines: AccountingJournalLine[];
};

export type AccountingFixedAssetDetail = {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  status: string;
  acquisition_date?: string | null;
  in_service_date?: string | null;
  cost?: number | null;
  residual_value?: number | null;
  useful_life_months?: number | null;
  depreciation_method: string;
  disposal_date?: string | null;
  disposal_proceeds?: number | null;
  notes: string;
  asset_account: string;
  accum_dep_account: string;
  dep_expense_account: string;
};

export type AccountingDepreciationLine = {
  id: string;
  asset_code: string;
  asset_name: string;
  amount?: number | null;
};

export type AccountingDepreciationRunDetail = {
  id: string;
  run_date?: string | null;
  status: string;
  period_label: string;
  journal_entry_id?: string | null;
  lines: AccountingDepreciationLine[];
};

export type AccountingBankStatementLine = {
  id: string;
  transaction_date?: string | null;
  description: string;
  reference: string;
  amount?: number | null;
  is_reconciled: boolean;
};

export type AccountingBankStatementDetail = {
  id: string;
  bank_name: string;
  statement_date_from?: string | null;
  statement_date_to?: string | null;
  opening_balance?: number | null;
  closing_balance?: number | null;
  source: string;
  lines: AccountingBankStatementLine[];
};

export type AccountingCashFlowSection = {
  key: string;
  label: string;
  codes: string[];
  codes_preview: string;
};

export type AccountingCashFlowMapDetail = {
  id: string;
  sections: AccountingCashFlowSection[];
};

function accountingQs(page: number, perPage: number, q: string): string {
  const p = new URLSearchParams();
  p.set('page', String(page));
  p.set('per_page', String(perPage));
  if (q.trim()) p.set('q', q.trim());
  return p.toString();
}

export function getAccountingCurrencies(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/currencies?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingCurrencyDetail(token: string, id: string) {
  return request<AccountingCurrencyDetail>(`/accounting/currencies/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingExchangeRateWeeks(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/exchange-rate-weeks?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingExchangeRateWeekDetail(token: string, id: string) {
  return request<AccountingExchangeRateWeekDetail>(`/accounting/exchange-rate-weeks/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingSupplierWhtTypes(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/supplier-wht-types?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingSupplierWhtTypeDetail(token: string, id: string) {
  return request<AccountingSupplierWhtTypeDetail>(`/accounting/supplier-wht-types/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingPeriods(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/periods?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingPeriodDetail(token: string, id: string) {
  return request<AccountingPeriodDetail>(`/accounting/periods/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingAccounts(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/accounts?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingAccountDetail(token: string, id: string) {
  return request<AccountingAccountDetail>(`/accounting/accounts/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingJournalEntries(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/journal-entries?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingJournalEntryDetail(token: string, id: string) {
  return request<AccountingJournalEntryDetail>(`/accounting/journal-entries/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingFixedAssets(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/fixed-assets?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingFixedAssetDetail(token: string, id: string) {
  return request<AccountingFixedAssetDetail>(`/accounting/fixed-assets/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingDepreciationRuns(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/depreciation-runs?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingDepreciationRunDetail(token: string, id: string) {
  return request<AccountingDepreciationRunDetail>(`/accounting/depreciation-runs/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingBankStatements(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: AccountingListItem[]; pagination: PaginationMeta }>(
    `/accounting/bank-statements?${accountingQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getAccountingBankStatementDetail(token: string, id: string) {
  return request<AccountingBankStatementDetail>(`/accounting/bank-statements/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingCashFlowMapList(token: string) {
  return request<{ items: AccountingListItem[] }>('/accounting/cash-flow-map', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccountingCashFlowMapDetail(token: string) {
  return request<AccountingCashFlowMapDetail>('/accounting/cash-flow-map/detail', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ----------------------------
// Finance reports (mobile-native summaries + trends)
// ----------------------------

export type FinanceReportPreset = 'mtd' | 'ytd' | 'last_month' | 'custom';

export type OverdueInvoicesReport = {
  as_of: string;
  kpis: { count: number; total_amount: number };
  aging: {
    buckets: Array<{ key: string; label: string; count: number; amount: number }>;
    totals: { count: number; amount: number };
  };
  by_due_month: Array<{ period: string; count: number; amount: number }>;
  top: Array<{
    id: string;
    invoice_no: string;
    customer_name: string | null;
    due_date: string | null;
    days_overdue: number | null;
    amount: number;
  }>;
};

export type DailyInvoicesReport = {
  from: string;
  to: string;
  series: Array<{ date: string; count: number; amount: number }>;
  totals: { count: number; amount: number };
};

export type ArSummaryReport = {
  as_of: string;
  kpis: {
    open_invoices: number;
    open_amount: number;
    overdue_invoices: number;
    overdue_amount: number;
  };
  top_customers: Array<{
    customer_id: string;
    customer_name: string;
    open_invoices: number;
    open_amount: number;
    overdue_invoices: number;
    overdue_amount: number;
  }>;
};

export type TrialBalanceReportRow = {
  account: { id: string; code: string; name: string; account_type: string };
  opening: number;
  period_debit: number;
  period_credit: number;
  closing: number;
};

export type TrialBalanceReport = {
  company_id: string;
  preset: string;
  from: string;
  to: string;
  rows: TrialBalanceReportRow[];
  totals: { opening: number; period_debit: number; period_credit: number; closing: number };
};

export type ProfitAndLossReport = {
  company_id: string;
  preset: string;
  from: string;
  to: string;
  site_id?: string | null;
  income: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  cogs: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  expenses: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  totals: { income: number; cogs: number; expenses: number; gross_profit: number; net_profit: number };
  trend: Array<{ label: string; from: string; to: string; net_profit: number }>;
};

export type SitePerformanceTotals = {
  income: number;
  cogs: number;
  expenses: number;
  gross_profit: number;
  net_profit: number;
};

export type SitePerformanceSiteRow = {
  site_id: number;
  site_code: string;
  site_name: string;
  totals: SitePerformanceTotals;
};

export type SitePerformanceReport = {
  company_id: string;
  preset: string;
  from: string;
  to: string;
  sites: SitePerformanceSiteRow[];
  unallocated: { totals: SitePerformanceTotals };
  company: { totals: SitePerformanceTotals };
};

export type PnlAccountActivityLine = {
  journal_entry_id: string;
  entry_date: string;
  reference: string;
  journal_description: string;
  source_module: string;
  side: string;
  amount: number;
  signed_amount: number;
  line_description: string;
  site_id: number | null;
  site_name: string | null;
};

export type PnlAccountActivityReport = {
  company_id: string;
  preset: string;
  from: string;
  to: string;
  site_id?: string | null;
  account: { id: string; code: string; name: string; account_type: string };
  summary: { debit: number; credit: number; period_amount: number };
  lines: PnlAccountActivityLine[];
  truncated: boolean;
};

export type BalanceSheetReport = {
  company_id: string;
  as_of: string;
  assets: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  liabilities: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  equity: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    current_profit: number;
    liabilities_equity: number;
  };
};

export type CashFlowReport = {
  company_id: string;
  preset: string;
  from: string;
  to: string;
  sections: {
    operating: Array<{ label: string; amount: number }>;
    investing: Array<{ label: string; amount: number }>;
    financing: Array<{ label: string; amount: number }>;
  };
  totals: {
    operating: number;
    investing: number;
    financing: number;
    net_change: number;
    cash_delta: number;
    recon_difference: number;
  };
  assumptions: string[];
};

export type SupplierWhtMonthlyReport = {
  year: number;
  rows: Array<{ period_ym: string; line_count: number; total_base: number; total_wht: number }>;
};

function financeReportQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export function getFinanceReportOverdueInvoices(token: string) {
  return request<OverdueInvoicesReport>(`/finance/reports/overdue-invoices`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getFinanceReportDailyInvoices(token: string, from?: string, to?: string) {
  return request<DailyInvoicesReport>(`/finance/reports/daily-invoices${financeReportQuery({ from, to })}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getFinanceReportArSummary(token: string) {
  return request<ArSummaryReport>(`/finance/reports/ar-summary`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getFinanceReportTrialBalance(token: string, preset: FinanceReportPreset, from?: string, to?: string) {
  return request<TrialBalanceReport>(
    `/finance/reports/trial-balance${financeReportQuery({ preset, from, to })}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getFinanceReportProfitAndLoss(
  token: string,
  preset: FinanceReportPreset,
  from?: string,
  to?: string,
  siteId?: string | null,
) {
  return request<ProfitAndLossReport>(
    `/finance/reports/profit-and-loss${financeReportQuery({
      preset,
      from,
      to,
      include_trend: true,
      site_id: siteId ?? undefined,
    })}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getFinanceReportSitePerformance(token: string, preset: FinanceReportPreset, from?: string, to?: string) {
  return request<SitePerformanceReport>(
    `/finance/reports/site-performance${financeReportQuery({ preset, from, to })}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getFinanceReportPnlAccountActivity(
  token: string,
  accountId: string,
  preset: FinanceReportPreset,
  from?: string,
  to?: string,
  siteId?: string | null,
) {
  return request<PnlAccountActivityReport>(
    `/finance/reports/profit-and-loss/account-activity${financeReportQuery({
      account_id: accountId,
      preset,
      from,
      to,
      site_id: siteId ?? undefined,
    })}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

export function getFinanceReportBalanceSheet(token: string, asOf?: string) {
  return request<BalanceSheetReport>(`/finance/reports/balance-sheet${financeReportQuery({ as_of: asOf })}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getFinanceReportCashFlow(token: string, preset: FinanceReportPreset, from?: string, to?: string) {
  return request<CashFlowReport>(`/finance/reports/cash-flow${financeReportQuery({ preset, from, to })}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getFinanceReportSupplierWhtMonthly(token: string, year?: number) {
  return request<SupplierWhtMonthlyReport>(`/finance/reports/supplier-wht-monthly${financeReportQuery({ year })}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type BudgetListItem = {
  id: string;
  name: string;
  fiscal_year: number;
  scope_type: string;
  scope_label: string;
  status: string;
  budget_total: number;
};

export type BudgetVsActualRow = {
  account_id: number;
  code: string;
  name: string;
  budget: number;
  actual: number;
  variance: number;
  pct_used: number | null;
};

export type BudgetVsActualReport = {
  budget: {
    id: string;
    name: string;
    fiscal_year: number;
    scope_type: string;
    scope_label: string;
    status: string;
  };
  period: { from: string; to: string };
  rows: BudgetVsActualRow[];
  totals: {
    budget: number;
    actual: number;
    variance: number;
    committed: number;
    available: number;
  };
  as_of: string;
};

export type BudgetListResponse = { budgets: BudgetListItem[] };

export function getFinanceBudgetList(token: string, fiscalYear?: number) {
  return request<BudgetListResponse>(`/finance/budgets${financeReportQuery({ fiscal_year: fiscalYear })}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getFinanceBudgetVsActual(token: string, budgetId: string, asOf?: string) {
  return request<BudgetVsActualReport>(
    `/finance/budgets/${encodeURIComponent(budgetId)}/vs-actual${financeReportQuery({ as_of: asOf })}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
  );
}

// ----------------------------
// HR - Phase 1
// ----------------------------

export type EmployeeListItem = {
  id: string;
  employee_code: string;
  name: string;
  job_title: string;
  status: string;
  site_name: string;
  store_name: string;
};

export type EmployeeDetail = EmployeeListItem & {
  hire_date?: string | null;
  department_name?: string;
  position_name?: string;
  job_grade_name?: string;
};

export type LeaveBalanceListItem = {
  id: string;
  leave_type_id: string;
  leave_type_name: string;
  cycle_start?: string | null;
  cycle_end?: string | null;
  entitled_days?: number | null;
  taken_days?: number | null;
  pending_days?: number | null;
  carried_forward?: number | null;
  balance_days?: number | null;
  status?: string;
};

export type LeaveBalanceDetail = LeaveBalanceListItem;

export function getEmployees(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: EmployeeListItem[]; pagination: PaginationMeta }>(
    `/hr/employees?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getEmployeeDetail(token: string, id: string) {
  return request<EmployeeDetail>(`/hr/employees/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getLeaveBalances(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: LeaveBalanceListItem[]; pagination: PaginationMeta }>(
    `/hr/leave-balances?${masterDataQs(page, perPage, q)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getLeaveBalanceDetail(token: string, id: string) {
  return request<LeaveBalanceDetail>(`/hr/leave-balances/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type HrMasterListItem = {
  id: string;
  name: string;
  status: string;
  subtitle?: string;
};

export type HrDepartmentDetail = HrMasterListItem & {
  parent_name?: string;
  manager_name?: string;
};

export type HrPositionDetail = {
  id: string;
  title: string;
  status: string;
  department_name?: string;
  job_grade_name?: string;
  headcount?: number | null;
};

export type HrLeaveTypeDetail = {
  id: string;
  name: string;
  code?: string;
  entitled_days?: number | null;
  is_paid?: boolean;
  is_active?: boolean;
};

export type PayrollRunListItem = {
  id: string;
  ref: string;
  status: string;
  status_label: string;
  period_start?: string | null;
  period_end?: string | null;
};

export type PayrollRunDetail = PayrollRunListItem & {
  processed_at?: string | null;
};

function hrList(token: string, path: string, page: number, perPage: number, q: string) {
  return request<{ items: HrMasterListItem[]; pagination: PaginationMeta }>(
    `/hr/${path}?${masterDataQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
  );
}

export function getHrDepartments(token: string, page = 1, perPage = 15, q = '') {
  return hrList(token, 'departments', page, perPage, q);
}

export function getHrDepartmentDetail(token: string, id: string) {
  return request<HrDepartmentDetail>(`/hr/departments/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHrPositions(token: string, page = 1, perPage = 15, q = '') {
  return hrList(token, 'positions', page, perPage, q);
}

export function getHrPositionDetail(token: string, id: string) {
  return request<HrPositionDetail>(`/hr/positions/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHrJobGrades(token: string, page = 1, perPage = 15, q = '') {
  return hrList(token, 'job-grades', page, perPage, q);
}

export function getHrJobGradeDetail(token: string, id: string) {
  return request<HrMasterListItem & { subtitle?: string }>(`/hr/job-grades/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHrLeaveTypes(token: string, page = 1, perPage = 15, q = '') {
  return hrList(token, 'leave-types', page, perPage, q);
}

export function getHrLeaveTypeDetail(token: string, id: string) {
  return request<HrLeaveTypeDetail>(`/hr/leave-types/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getHrPayrollRuns(token: string, page = 1, perPage = 15, q = '') {
  return request<{ items: PayrollRunListItem[]; pagination: PaginationMeta }>(
    `/hr/payroll-runs?${masterDataQs(page, perPage, q)}`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
  );
}

export function getHrPayrollRunDetail(token: string, id: string) {
  return request<PayrollRunDetail>(`/hr/payroll-runs/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { API_BASE_URL };
