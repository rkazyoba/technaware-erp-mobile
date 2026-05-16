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
  lines: Array<{
    id: string;
    category: string;
    item: string;
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

export type RequisitionDetail = RequisitionListItem & {
  approval_comment?: string | null;
  lines: Array<{
    id: string;
    category: string;
    item: string;
    quantity: number;
    unit: string;
  }>;
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
  unit_id: string;
  status: string;
  product_type: string;
};

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
  stock_by_store: Array<{ store_name: string; quantity: number; status: string }>;
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
};

export type LogisticsDocLine = {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  note?: string;
};

export type LogisticsDocDetail = LogisticsDocListItem & {
  lines: LogisticsDocLine[];
};

export type StockReportStoreItem = {
  id: string;
  name: string;
  site: string;
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
  supplier: string;
  unit: string;
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
};

async function request<T>(path: string, init?: ApiRequestInit): Promise<ApiEnvelope<T>> {
  if (!API_BASE_URL) {
    throw new Error(
      'Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL in erp-mobile/.env or expo.extra.apiBaseUrl in app.json, then restart Expo with -c.'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const { headers: rawHeaders, signal: _ignoreSignal, ...restInit } = init ?? {};
  const merged = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });
  if (rawHeaders) {
    const extra = new Headers(rawHeaders as HeadersInit);
    extra.forEach((value, key) => {
      merged.set(key, value);
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...restInit,
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
      throw new Error(
        sanitizeClientErrorMessage(payload?.message ?? detail ?? `Request failed (${response.status}).`),
      );
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
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The app could not reach ${API_BASE_URL}.${unreachableBackendHint()}`
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
  return request<{ items: ApprovalItem[]; pagination: PaginationMeta }>(`/approvals?${qs.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getApprovalsSummary(token: string) {
  return request<ApprovalsSummary>('/approvals/summary', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

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

export function getPurchaseOrders(token: string, page = 1, perPage = 10) {
  return request<{ items: PurchaseOrderListItem[]; pagination: PaginationMeta }>(
    `/purchase-orders?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
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
  lines: Array<{
    id: string;
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
  income: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  cogs: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  expenses: Array<{ account: { id: string; code: string; name: string; account_type: string }; amount: number }>;
  totals: { income: number; cogs: number; expenses: number; gross_profit: number; net_profit: number };
  trend: Array<{ label: string; from: string; to: string; net_profit: number }>;
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

export function getFinanceReportProfitAndLoss(token: string, preset: FinanceReportPreset, from?: string, to?: string) {
  return request<ProfitAndLossReport>(
    `/finance/reports/profit-and-loss${financeReportQuery({ preset, from, to, include_trend: true })}`,
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
