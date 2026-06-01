import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  staffPortalHasPermission,
  visibleStoreMovementKindsForPortal,
} from '../utils/staffPortalPermissions';
import {
  API_BASE_URL,
  approveItem,
  createLeaveRequest,
  createSupportTicket,
  getAccountingAccounts,
  getAccountingBankStatements,
  getAccountingCurrencies,
  getAccountingCashFlowMapList,
  getAccountingDepreciationRuns,
  getAccountingExchangeRateWeeks,
  getAccountingFixedAssets,
  getAccountingJournalEntries,
  getAccountingPeriods,
  getAccountingSupplierWhtTypes,
  type AccountingListItem,
  getApprovalDetail,
  getApprovals,
  getApprovalsSummary,
  type ApprovalsSummary,
  getAttendance,
  getHospitalityFrontDeskSummary,
  getHospitalityHousekeepingRooms,
  getHospitalityReservations,
  getHospitalityReservationDetail,
  getHospitalityGuests,
  getHospitalityGuestDetail,
  getHospitalityFolios,
  getHospitalityFolioDetail,
  postHospitalityFolioPayment,
  postHospitalityFolioCharge,
  getHospitalityOverview,
  getHospitalityRateCatalog,
  getHospitalityRoomsInventory,
  getHospitalityReportsSummary,
  getHospitalityChannelManagerSummary,
  getHospitalityReservationSales,
  getBankBranchDetail,
  getBankBranches,
  getBankMasterDetail,
  getBankMasterList,
  getCategoryDetail,
  getCategories,
  getCrmContractDetail,
  getCrmContracts,
  getCrmCustomerDetail,
  getCrmCustomers,
  getCrmQuotationDetail,
  getCrmQuotations,
  getCustomerInvoiceDetail,
  getCustomerInvoices,
  getEmployeeDetail,
  getEmployees,
  getLeaveBalanceDetail,
  getLeaveBalances,
  getLeaveRequest,
  getLeaveRequests,
  getLeaveTypes,
  getPaymentDetail,
  getPaymentVoucherDetail,
  getPaymentVouchers,
  getPayments,
  getLogisticsDocDetail,
  getLogisticsDocList,
  getMobileSummary,
  getNotifications,
  getMobileOperatorDetail,
  getMobileOperators,
  getPartCatalog,
  getPartCatalogDetail,
  getPayslipDetail,
  getPayslips,
  getProformaInvoiceDetail,
  getProformaInvoices,
  getPurchaseOrderDetail,
  getPurchaseOrders,
  getPurchaseRfqDetail,
  getPurchaseRfqs,
  getRequisitionDetail,
  getRequisitions,
  getSupplierQuotationDetail,
  getSupplierQuotations,
  getSupplierInvoiceDetail,
  getSupplierInvoices,
  getStockReportLines,
  getStockReportStores,
  getSupplierDetail,
  getSuppliers,
  getSupportTicket,
  getSupportTickets,
  getUnitDetail,
  getUnits,
  markAllNotificationsRead,
  markNotificationRead,
  postSupportTicketMessage,
  rejectItem,
  cancelSupportTicket,
  type ApprovalDetail,
  type ApprovalItem,
  type AttendanceRow,
  type HospitalityFrontDeskSummary,
  type HospitalityHousekeepingSummary,
  type HospitalityReservationListItem,
  type HospitalityReservationDetail,
  type HospitalityGuestListItem,
  type HospitalityGuestDetail,
  type HospitalityFolioListItem,
  type HospitalityFolioDetail,
  type HospitalityOverviewSummary,
  type HospitalityRateCatalogEntry,
  type HospitalityRateCatalogSummary,
  type HospitalityRoomsInventorySummary,
  type HospitalityReportsSummary,
  type HospitalityChannelManagerSummary,
  type HospitalitySalesDocument,
  type CrmContractDetail,
  type CrmContractListItem,
  type CrmCustomerDetail,
  type CrmCustomerListItem,
  type CrmQuotationDetail,
  type CrmQuotationListItem,
  type LeaveRequestDetail,
  type LeaveRequestItem,
  type LeaveTypeItem,
  type LogisticsDocDetail,
  type LogisticsDocListItem,
  type MobileSummary,
  type NotificationItem,
  type MobileOperatorDetail,
  type MobileOperatorListItem,
  type BankBranchListItem,
  type BankBranchMasterDetail,
  type BankMasterDetail,
  type BankMasterListItem,
  type CategoryDetail,
  type CategoryListItem,
  type UnitDetail,
  type UnitListItem,
  type PartCatalogDetail,
  type PartCatalogItem,
  type CustomerInvoiceDetail,
  type CustomerInvoiceListItem,
  type EmployeeDetail,
  type EmployeeListItem,
  type LeaveBalanceDetail,
  type LeaveBalanceListItem,
  type PayslipDetail,
  type PayslipListItem,
  type PurchaseOrderDetail,
  type PurchaseOrderListItem,
  type PurchaseRfqDetail,
  type PurchaseRfqListItem,
  type RequisitionDetail,
  type RequisitionListItem,
  type SupplierQuotationDetail,
  type SupplierQuotationListItem,
  type ProformaInvoiceDetail,
  type ProformaInvoiceListItem,
  type StockReportLine,
  type StockReportStoreItem,
  type SupportTicketDetail,
  type SupportTicketSummary,
  type PaymentDetail,
  type PaymentListItem,
  type PaymentVoucherDetail,
  type PaymentVoucherListItem,
  type SupplierDetail,
  type SupplierListItem,
  type SupplierInvoiceDetail,
  type SupplierInvoiceListItem,
} from '../api';
import {
  emptyHrCatalogState,
  fetchHrCatalogDetail,
  fetchHrCatalogList,
  HR_CATALOG_ROUTES,
  isHrCatalogRoute,
  type HrCatalogRoute,
  type HrCatalogState,
} from './hrCatalogPortal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTab, MobilePortalBootstrap, RefreshProfileOptions, SignedInUser } from '../types/app';
import { webPathForPortalSurface } from '../utils/portalWebSurfaces';
import { isAccountingApiListModule, type AccountingApiListModule } from '../utils/accountingPortal';
import { isFinanceReportMobileModule } from '../utils/financeReportPortal';
import { canCrud, canCrudOrLegacy, LOGISTICS_LEGACY } from '../utils/crudPermissions';
import { friendlyModuleLoadError } from '../utils/employeeProfile';

const LOGISTICS_DOC_ROUTES: Record<string, string> = {
  'GRN (PO)': 'inventory/po-receipts',
  'Non-PO receipts': 'inventory/non-po-receipts',
  'Supplier returns': 'inventory/supplier-returns',
  'Pick tickets': 'inventory/pick-tickets',
  'Delivery notes': 'inventory/delivery-notes',
};

const STORE_MOVEMENT_PATH: Record<string, string> = {
  k2s: 'inventory/movements/kitchen-to-store',
  s2k: 'inventory/movements/store-to-kitchen',
  inter_rcpt: 'inventory/movements/inter-store-receipts',
  inter_issue: 'inventory/movements/inter-store-issues',
};

export function logisticsPathFor(module: string, movementKind: string): string | null {
  if (module === 'Store movements') {
    return STORE_MOVEMENT_PATH[movementKind] ?? STORE_MOVEMENT_PATH.k2s;
  }
  return LOGISTICS_DOC_ROUTES[module] ?? null;
}

export function isLogisticsModule(module: string): boolean {
  return Boolean(LOGISTICS_DOC_ROUTES[module] || module === 'Store movements');
}

/** Min time between automatic dashboard snapshot API calls (home focus). Pull-to-refresh / module entry uses `force`. */
const PORTAL_SNAPSHOT_TTL_MS = 2 * 60 * 1000;

/** Persisted summary used for instant paint on cold start; older entries are ignored. */
const MOBILE_SUMMARY_DISK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const MOBILE_SUMMARY_STORAGE_PREFIX = 'erp_mobile_summary_v1:';

function mobileSummaryStorageKey(token: string): string {
  return `${MOBILE_SUMMARY_STORAGE_PREFIX}${token.slice(-28)}`;
}

function formatShortTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type LoadMobileSummaryOptions = {
  /** Bypass in-memory / network TTL (pull-to-refresh). */
  force?: boolean;
};

export type LoadApprovalsOptions = {
  /** Bypass home-screen throttle (module entry, pull refresh, after approve). */
  force?: boolean;
  /** Server-side filter (`UnifiedMobileApprovalService` kind slug). Pass empty string to clear. */
  kind?: string;
};

export type StaffPortalModelInput = {
  token: string;
  user: SignedInUser | null;
  portal: MobilePortalBootstrap | null;
  activeTab: AppTab;
  selectedModule: string;
  loading: boolean;
  onSetTab: (tab: AppTab) => void;
  onRefreshProfile: (options?: RefreshProfileOptions) => void | Promise<void>;
  onLogout: () => void;
  onOpenAction: (title: string) => void;
};

export function useStaffPortalModel({
  token,
  user,
  portal,
  activeTab,
  selectedModule,
  loading,
  onSetTab,
  onRefreshProfile,
  onLogout,
  onOpenAction,
}: StaffPortalModelInput) {
  const insets = useSafeAreaInsets();
  const appBaseUrl = API_BASE_URL.replace('/api/v1', '');
  const logoUri = `${appBaseUrl}/backend/assets/img/logo.png`;

  const menuItems = useMemo(() => {
    if (!portal?.surfaces?.length) {
      return [];
    }
    return portal.surfaces
      .filter((s) => s.visible && (s.route ?? '').trim() !== '')
      .map((s) => (s.route as string).trim());
  }, [portal]);

  const quickActionItems = useMemo(() => {
    type Row = { title: string; hint: string; target: string };
    if (!portal) {
      return [] as Row[];
    }
    const rows = (portal.quick_actions ?? []).filter((q) => q.visible && (q.title ?? '').trim() !== '');
    return rows
      .map((q) => ({
        title: q.title!.trim(),
        hint: (q.hint ?? '').trim(),
        target: ((q.target_route ?? q.title) as string).trim(),
      }))
      .filter((r) => r.target !== '');
  }, [portal]);

  /** One chip per destination route — surfaces + quick actions often overlap (e.g. Attendance twice). */
  const navChips = useMemo(() => {
    const seen = new Set<string>();
    const rows: { key: string; label: string; target: string; variant: 'module' | 'quick' }[] = [];
    const norm = (s: string) => s.trim().toLowerCase();

    for (const label of menuItems) {
      const t = label.trim();
      const k = norm(t);
      if (k === '' || seen.has(k)) {
        continue;
      }
      seen.add(k);
      rows.push({ key: `m-${k}`, label: t, target: t, variant: 'module' });
    }
    for (const q of quickActionItems) {
      const t = q.target.trim();
      const k = norm(t);
      if (k === '' || seen.has(k)) {
        continue;
      }
      seen.add(k);
      rows.push({ key: `q-${k}`, label: q.title.trim(), target: t, variant: 'quick' });
    }
    return rows;
  }, [menuItems, quickActionItems]);

  const notificationsShortcutVisible = useMemo(() => {
    if (!portal?.surfaces?.length) {
      return false;
    }
    return portal.surfaces.some((s) => s.id === 'notifications' && s.visible && s.route);
  }, [portal]);

  const canViewMobileRequisitions = useMemo(() => {
    if (!portal?.permissions?.length) {
      return true;
    }
    if (portal.has_wildcard) {
      return true;
    }
    return portal.permissions.some(
      (x) => x === 'erp.user.requisitions' || x === 'erp.approvals.requisitions' || x.startsWith('erp.crud.requisitions.')
    );
  }, [portal]);

  const canViewMobilePurchaseOrders = useMemo(() => {
    if (!portal?.permissions?.length) {
      return true;
    }
    if (portal.has_wildcard) {
      return true;
    }
    return portal.permissions.some(
      (x) =>
        x === 'erp.user.purchase_orders' ||
        x === 'erp.approvals.purchase_orders' ||
        x === 'erp.nav.procurement' ||
        x.startsWith('erp.crud.purchase_orders.')
    );
  }, [portal]);

  const canViewMobilePurchaseRfqs = useMemo(() => {
    if (!portal?.permissions?.length) {
      return true;
    }
    if (portal.has_wildcard) {
      return true;
    }
    return portal.permissions.some(
      (x) => x === 'erp.crud.purchase_rfq.view' || x === 'erp.nav.procurement' || x.startsWith('erp.crud.purchase_rfq.')
    );
  }, [portal]);

  const canViewMobileSupplierQuotations = useMemo(() => {
    if (!portal?.permissions?.length) {
      return true;
    }
    if (portal.has_wildcard) {
      return true;
    }
    return portal.permissions.some(
      (x) =>
        x === 'erp.crud.supplier_quotations.view' ||
        x === 'erp.nav.procurement' ||
        x.startsWith('erp.crud.supplier_quotations.')
    );
  }, [portal]);

  const visibleStoreMovementKinds = useMemo(() => visibleStoreMovementKindsForPortal(portal), [portal]);

  const canCreateKitchenToStoreMovement = useMemo(
    () => canCrudOrLegacy(portal, 'kitchen_to_store', 'create', LOGISTICS_LEGACY.kitchen_to_store),
    [portal],
  );

  const canCreateStoreToKitchenMovement = useMemo(
    () => canCrudOrLegacy(portal, 'store_to_kitchen', 'create', LOGISTICS_LEGACY.store_to_kitchen),
    [portal],
  );

  const canCreateDeliveryNote = useMemo(
    () => canCrudOrLegacy(portal, 'delivery_notes', 'create', LOGISTICS_LEGACY.delivery_notes),
    [portal],
  );

  const canCreatePoReceipt = useMemo(
    () => canCrudOrLegacy(portal, 'po_receipts', 'create', LOGISTICS_LEGACY.po_receipts),
    [portal],
  );

  const canUpdatePoReceipt = useMemo(
    () => canCrudOrLegacy(portal, 'po_receipts', 'update', LOGISTICS_LEGACY.po_receipts),
    [portal],
  );

  const canCreateNonPoReceipt = useMemo(
    () => canCrudOrLegacy(portal, 'non_po_receipts', 'create', LOGISTICS_LEGACY.non_po_receipts),
    [portal],
  );

  const canCreateSupplierReturn = useMemo(
    () => canCrudOrLegacy(portal, 'supplier_returns', 'create', LOGISTICS_LEGACY.supplier_returns),
    [portal],
  );

  const canCreatePickTicket = useMemo(() => canCrud(portal, 'pick_tickets', 'create'), [portal]);

  const canUpdateNonPoReceipt = useMemo(
    () => canCrudOrLegacy(portal, 'non_po_receipts', 'update', LOGISTICS_LEGACY.non_po_receipts),
    [portal],
  );

  const canCreateSupplier = useMemo(() => canCrud(portal, 'suppliers', 'create'), [portal]);
  const canUpdateSupplier = useMemo(() => canCrud(portal, 'suppliers', 'update'), [portal]);
  const canCreateUnit = useMemo(() => canCrud(portal, 'units', 'create'), [portal]);
  const canUpdateUnit = useMemo(() => canCrud(portal, 'units', 'update'), [portal]);
  const canCreateCategory = useMemo(() => canCrud(portal, 'categories', 'create'), [portal]);
  const canUpdateCategory = useMemo(() => canCrud(portal, 'categories', 'update'), [portal]);
  const canCreatePart = useMemo(() => canCrud(portal, 'parts', 'create'), [portal]);
  const canUpdatePart = useMemo(() => canCrud(portal, 'parts', 'update'), [portal]);

  /** Operational (non–approval-only) access for inter-store native lists; mirrors POST guards when those endpoints exist. */
  const operationalInterStoreIssues = useMemo(
    () => staffPortalHasPermission(portal, 'erp.user.store_issues'),
    [portal],
  );

  const operationalInterStoreReceipts = useMemo(
    () => staffPortalHasPermission(portal, 'erp.user.store_receipts'),
    [portal],
  );

  const [moduleLoading, setModuleLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [approvalDetail, setApprovalDetail] = useState<ApprovalDetail | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [approvalsUpdatedAt, setApprovalsUpdatedAt] = useState<string | null>(null);
  const [notificationsUpdatedAt, setNotificationsUpdatedAt] = useState<string | null>(null);
  const [approvalPage, setApprovalPage] = useState(1);
  const [approvalHasMore, setApprovalHasMore] = useState(false);
  const [approvalListTotal, setApprovalListTotal] = useState(0);
  const [approvalSummary, setApprovalSummary] = useState<ApprovalsSummary | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationHasMore, setNotificationHasMore] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [leavePage, setLeavePage] = useState(1);
  const [leaveHasMore, setLeaveHasMore] = useState(false);
  const [leaveUpdatedAt, setLeaveUpdatedAt] = useState<string | null>(null);
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveNotes, setLeaveNotes] = useState('');

  const [requisitionItems, setRequisitionItems] = useState<RequisitionListItem[]>([]);
  const [requisitionDetail, setRequisitionDetail] = useState<RequisitionDetail | null>(null);
  const [requisitionPage, setRequisitionPage] = useState(1);
  const [requisitionHasMore, setRequisitionHasMore] = useState(false);
  const [requisitionsUpdatedAt, setRequisitionsUpdatedAt] = useState<string | null>(null);

  const [purchaseOrderItems, setPurchaseOrderItems] = useState<PurchaseOrderListItem[]>([]);
  const [purchaseOrderDetail, setPurchaseOrderDetail] = useState<PurchaseOrderDetail | null>(null);
  const [purchaseOrderPage, setPurchaseOrderPage] = useState(1);
  const [purchaseOrderHasMore, setPurchaseOrderHasMore] = useState(false);
  const [purchaseOrdersUpdatedAt, setPurchaseOrdersUpdatedAt] = useState<string | null>(null);

  const [purchaseRfqItems, setPurchaseRfqItems] = useState<PurchaseRfqListItem[]>([]);
  const [purchaseRfqDetail, setPurchaseRfqDetail] = useState<PurchaseRfqDetail | null>(null);
  const [purchaseRfqPage, setPurchaseRfqPage] = useState(1);
  const [purchaseRfqHasMore, setPurchaseRfqHasMore] = useState(false);
  const [purchaseRfqsUpdatedAt, setPurchaseRfqsUpdatedAt] = useState<string | null>(null);

  const [supplierQuotationItems, setSupplierQuotationItems] = useState<SupplierQuotationListItem[]>([]);
  const [supplierQuotationDetail, setSupplierQuotationDetail] = useState<SupplierQuotationDetail | null>(null);
  const [supplierQuotationPage, setSupplierQuotationPage] = useState(1);
  const [supplierQuotationHasMore, setSupplierQuotationHasMore] = useState(false);
  const [supplierQuotationsUpdatedAt, setSupplierQuotationsUpdatedAt] = useState<string | null>(null);

  // Finance (commercial)
  const [customerInvoiceItems, setCustomerInvoiceItems] = useState<CustomerInvoiceListItem[]>([]);
  const [customerInvoiceDetail, setCustomerInvoiceDetail] = useState<CustomerInvoiceDetail | null>(null);
  const [customerInvoicePage, setCustomerInvoicePage] = useState(1);
  const [customerInvoiceHasMore, setCustomerInvoiceHasMore] = useState(false);
  const [customerInvoicesUpdatedAt, setCustomerInvoicesUpdatedAt] = useState<string | null>(null);
  const [customerInvoiceSearchInput, setCustomerInvoiceSearchInput] = useState('');
  const [customerInvoiceQueryCommitted, setCustomerInvoiceQueryCommitted] = useState('');

  const [proformaInvoiceItems, setProformaInvoiceItems] = useState<ProformaInvoiceListItem[]>([]);
  const [proformaInvoiceDetail, setProformaInvoiceDetail] = useState<ProformaInvoiceDetail | null>(null);
  const [proformaInvoicePage, setProformaInvoicePage] = useState(1);
  const [proformaInvoiceHasMore, setProformaInvoiceHasMore] = useState(false);
  const [proformaInvoicesUpdatedAt, setProformaInvoicesUpdatedAt] = useState<string | null>(null);
  const [proformaInvoiceSearchInput, setProformaInvoiceSearchInput] = useState('');
  const [proformaInvoiceQueryCommitted, setProformaInvoiceQueryCommitted] = useState('');

  const [paymentItems, setPaymentItems] = useState<PaymentListItem[]>([]);
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentHasMore, setPaymentHasMore] = useState(false);
  const [paymentsUpdatedAt, setPaymentsUpdatedAt] = useState<string | null>(null);
  const [paymentSearchInput, setPaymentSearchInput] = useState('');
  const [paymentQueryCommitted, setPaymentQueryCommitted] = useState('');

  const [paymentVoucherItems, setPaymentVoucherItems] = useState<PaymentVoucherListItem[]>([]);
  const [paymentVoucherDetail, setPaymentVoucherDetail] = useState<PaymentVoucherDetail | null>(null);
  const [paymentVoucherPage, setPaymentVoucherPage] = useState(1);
  const [paymentVoucherHasMore, setPaymentVoucherHasMore] = useState(false);
  const [paymentVouchersUpdatedAt, setPaymentVouchersUpdatedAt] = useState<string | null>(null);
  const [paymentVoucherSearchInput, setPaymentVoucherSearchInput] = useState('');
  const [paymentVoucherQueryCommitted, setPaymentVoucherQueryCommitted] = useState('');

  const [supplierInvoiceItems, setSupplierInvoiceItems] = useState<SupplierInvoiceListItem[]>([]);
  const [supplierInvoiceDetail, setSupplierInvoiceDetail] = useState<SupplierInvoiceDetail | null>(null);
  const [supplierInvoicePage, setSupplierInvoicePage] = useState(1);
  const [supplierInvoiceHasMore, setSupplierInvoiceHasMore] = useState(false);
  const [supplierInvoicesUpdatedAt, setSupplierInvoicesUpdatedAt] = useState<string | null>(null);
  const [supplierInvoiceSearchInput, setSupplierInvoiceSearchInput] = useState('');
  const [supplierInvoiceQueryCommitted, setSupplierInvoiceQueryCommitted] = useState('');

  const [accountingListRoute, setAccountingListRoute] = useState<string | null>(null);
  const [accountingListItems, setAccountingListItems] = useState<AccountingListItem[]>([]);
  const [accountingListPage, setAccountingListPage] = useState(1);
  const [accountingListHasMore, setAccountingListHasMore] = useState(false);
  const [accountingListUpdatedAt, setAccountingListUpdatedAt] = useState<string | null>(null);
  const [accountingSearchInput, setAccountingSearchInput] = useState('');
  const [accountingQueryCommitted, setAccountingQueryCommitted] = useState('');

  // HR (Phase 1)
  const [employeeItems, setEmployeeItems] = useState<EmployeeListItem[]>([]);
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(null);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeHasMore, setEmployeeHasMore] = useState(false);
  const [employeesUpdatedAt, setEmployeesUpdatedAt] = useState<string | null>(null);
  const [employeeSearchInput, setEmployeeSearchInput] = useState('');
  const [employeeQueryCommitted, setEmployeeQueryCommitted] = useState('');

  const [leaveBalanceItems, setLeaveBalanceItems] = useState<LeaveBalanceListItem[]>([]);
  const [leaveBalanceDetail, setLeaveBalanceDetail] = useState<LeaveBalanceDetail | null>(null);
  const [leaveBalancePage, setLeaveBalancePage] = useState(1);
  const [leaveBalanceHasMore, setLeaveBalanceHasMore] = useState(false);
  const [leaveBalancesUpdatedAt, setLeaveBalancesUpdatedAt] = useState<string | null>(null);
  const [leaveBalanceSearchInput, setLeaveBalanceSearchInput] = useState('');
  const [leaveBalanceQueryCommitted, setLeaveBalanceQueryCommitted] = useState('');

  const [hrCatalog, setHrCatalog] = useState<HrCatalogState>(emptyHrCatalogState);

  const [supplierItems, setSupplierItems] = useState<SupplierListItem[]>([]);
  const [supplierDetail, setSupplierDetail] = useState<SupplierDetail | null>(null);
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierHasMore, setSupplierHasMore] = useState(false);
  const [suppliersUpdatedAt, setSuppliersUpdatedAt] = useState<string | null>(null);
  const [supplierSearchInput, setSupplierSearchInput] = useState('');
  const [supplierQueryCommitted, setSupplierQueryCommitted] = useState('');

  const [unitItems, setUnitItems] = useState<UnitListItem[]>([]);
  const [unitDetail, setUnitDetail] = useState<UnitDetail | null>(null);
  const [unitPage, setUnitPage] = useState(1);
  const [unitHasMore, setUnitHasMore] = useState(false);
  const [unitsUpdatedAt, setUnitsUpdatedAt] = useState<string | null>(null);
  const [unitSearchInput, setUnitSearchInput] = useState('');
  const [unitQueryCommitted, setUnitQueryCommitted] = useState('');

  const [categoryItems, setCategoryItems] = useState<CategoryListItem[]>([]);
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetail | null>(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryHasMore, setCategoryHasMore] = useState(false);
  const [categoriesUpdatedAt, setCategoriesUpdatedAt] = useState<string | null>(null);
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [categoryQueryCommitted, setCategoryQueryCommitted] = useState('');

  const [bankMasterItems, setBankMasterItems] = useState<BankMasterListItem[]>([]);
  const [bankMasterDetail, setBankMasterDetail] = useState<BankMasterDetail | null>(null);
  const [bankMasterPage, setBankMasterPage] = useState(1);
  const [bankMasterHasMore, setBankMasterHasMore] = useState(false);
  const [banksUpdatedAt, setBanksUpdatedAt] = useState<string | null>(null);
  const [bankMasterSearchInput, setBankMasterSearchInput] = useState('');
  const [bankMasterQueryCommitted, setBankMasterQueryCommitted] = useState('');

  const [bankBranchItems, setBankBranchItems] = useState<BankBranchListItem[]>([]);
  const [bankBranchDetail, setBankBranchDetail] = useState<BankBranchMasterDetail | null>(null);
  const [bankBranchPage, setBankBranchPage] = useState(1);
  const [bankBranchHasMore, setBankBranchHasMore] = useState(false);
  const [bankBranchesUpdatedAt, setBankBranchesUpdatedAt] = useState<string | null>(null);
  const [bankBranchSearchInput, setBankBranchSearchInput] = useState('');
  const [bankBranchQueryCommitted, setBankBranchQueryCommitted] = useState('');

  const [mobileOperatorItems, setMobileOperatorItems] = useState<MobileOperatorListItem[]>([]);
  const [mobileOperatorDetail, setMobileOperatorDetail] = useState<MobileOperatorDetail | null>(null);
  const [mobileOperatorPage, setMobileOperatorPage] = useState(1);
  const [mobileOperatorHasMore, setMobileOperatorHasMore] = useState(false);
  const [mobileOperatorsUpdatedAt, setMobileOperatorsUpdatedAt] = useState<string | null>(null);
  const [mobileOperatorSearchInput, setMobileOperatorSearchInput] = useState('');
  const [mobileOperatorQueryCommitted, setMobileOperatorQueryCommitted] = useState('');

  const [crmCustomerItems, setCrmCustomerItems] = useState<CrmCustomerListItem[]>([]);
  const [crmCustomerPage, setCrmCustomerPage] = useState(1);
  const [crmCustomerHasMore, setCrmCustomerHasMore] = useState(false);
  const [crmCustomersUpdatedAt, setCrmCustomersUpdatedAt] = useState<string | null>(null);
  const [crmCustomerDetail, setCrmCustomerDetail] = useState<CrmCustomerDetail | null>(null);

  const [crmContractItems, setCrmContractItems] = useState<CrmContractListItem[]>([]);
  const [crmContractPage, setCrmContractPage] = useState(1);
  const [crmContractHasMore, setCrmContractHasMore] = useState(false);
  const [crmContractsUpdatedAt, setCrmContractsUpdatedAt] = useState<string | null>(null);
  const [crmContractDetail, setCrmContractDetail] = useState<CrmContractDetail | null>(null);

  const [crmQuotationItems, setCrmQuotationItems] = useState<CrmQuotationListItem[]>([]);
  const [crmQuotationPage, setCrmQuotationPage] = useState(1);
  const [crmQuotationHasMore, setCrmQuotationHasMore] = useState(false);
  const [crmQuotationsUpdatedAt, setCrmQuotationsUpdatedAt] = useState<string | null>(null);
  const [crmQuotationDetail, setCrmQuotationDetail] = useState<CrmQuotationDetail | null>(null);
  const [crmQuotationStatus, setCrmQuotationStatus] = useState<'all' | 'pending'>('all');

  const [attendanceItems, setAttendanceItems] = useState<AttendanceRow[]>([]);
  const [attendanceFrom, setAttendanceFrom] = useState<string | null>(null);
  const [attendanceUpdatedAt, setAttendanceUpdatedAt] = useState<string | null>(null);
  const [hospitalityFrontDesk, setHospitalityFrontDesk] = useState<HospitalityFrontDeskSummary | null>(null);
  const [hospitalityFrontDeskUpdatedAt, setHospitalityFrontDeskUpdatedAt] = useState<string | null>(null);
  const [hospitalityHousekeeping, setHospitalityHousekeeping] = useState<HospitalityHousekeepingSummary | null>(null);
  const [hospitalityHousekeepingUpdatedAt, setHospitalityHousekeepingUpdatedAt] = useState<string | null>(null);
  const [hospitalityReservationItems, setHospitalityReservationItems] = useState<HospitalityReservationListItem[]>([]);
  const [hospitalityReservationPage, setHospitalityReservationPage] = useState(1);
  const [hospitalityReservationHasMore, setHospitalityReservationHasMore] = useState(false);
  const [hospitalityReservationsUpdatedAt, setHospitalityReservationsUpdatedAt] = useState<string | null>(null);
  const [hospitalityReservationSearchInput, setHospitalityReservationSearchInput] = useState('');
  const [hospitalityReservationQueryCommitted, setHospitalityReservationQueryCommitted] = useState('');
  const [hospitalityReservationDetail, setHospitalityReservationDetail] = useState<HospitalityReservationDetail | null>(null);

  const [hospitalityGuestItems, setHospitalityGuestItems] = useState<HospitalityGuestListItem[]>([]);
  const [hospitalityGuestPage, setHospitalityGuestPage] = useState(1);
  const [hospitalityGuestHasMore, setHospitalityGuestHasMore] = useState(false);
  const [hospitalityGuestsUpdatedAt, setHospitalityGuestsUpdatedAt] = useState<string | null>(null);
  const [hospitalityGuestSearchInput, setHospitalityGuestSearchInput] = useState('');
  const [hospitalityGuestQueryCommitted, setHospitalityGuestQueryCommitted] = useState('');
  const [hospitalityGuestDetail, setHospitalityGuestDetail] = useState<HospitalityGuestDetail | null>(null);
  const [hospitalityFolioItems, setHospitalityFolioItems] = useState<HospitalityFolioListItem[]>([]);
  const [hospitalityFolioPage, setHospitalityFolioPage] = useState(1);
  const [hospitalityFolioHasMore, setHospitalityFolioHasMore] = useState(false);
  const [hospitalityFoliosUpdatedAt, setHospitalityFoliosUpdatedAt] = useState<string | null>(null);
  const [hospitalityFolioSearchInput, setHospitalityFolioSearchInput] = useState('');
  const [hospitalityFolioQueryCommitted, setHospitalityFolioQueryCommitted] = useState('');
  const [hospitalityFolioDetail, setHospitalityFolioDetail] = useState<HospitalityFolioDetail | null>(null);
  const [hospitalityDetailLoading, setHospitalityDetailLoading] = useState(false);
  const [hospitalityDetailError, setHospitalityDetailError] = useState<string | null>(null);
  const [hospitalityOverview, setHospitalityOverview] = useState<HospitalityOverviewSummary | null>(null);
  const [hospitalityOverviewUpdatedAt, setHospitalityOverviewUpdatedAt] = useState<string | null>(null);
  const [hospitalityRateCatalog, setHospitalityRateCatalog] = useState<HospitalityRateCatalogSummary | null>(null);
  const [hospitalityRateCatalogPage, setHospitalityRateCatalogPage] = useState(1);
  const [hospitalityRateCatalogHasMore, setHospitalityRateCatalogHasMore] = useState(false);
  const [hospitalityRateCatalogUpdatedAt, setHospitalityRateCatalogUpdatedAt] = useState<string | null>(null);
  const [hospitalityRoomsInventory, setHospitalityRoomsInventory] = useState<HospitalityRoomsInventorySummary | null>(null);
  const [hospitalityRoomsInventoryUpdatedAt, setHospitalityRoomsInventoryUpdatedAt] = useState<string | null>(null);
  const [hospitalityReports, setHospitalityReports] = useState<HospitalityReportsSummary | null>(null);
  const [hospitalityReportsUpdatedAt, setHospitalityReportsUpdatedAt] = useState<string | null>(null);
  const [hospitalityChannelManager, setHospitalityChannelManager] = useState<HospitalityChannelManagerSummary | null>(null);
  const [hospitalityChannelManagerUpdatedAt, setHospitalityChannelManagerUpdatedAt] = useState<string | null>(null);
  const [hospitalitySalesItems, setHospitalitySalesItems] = useState<HospitalitySalesDocument[]>([]);
  const [hospitalitySalesPage, setHospitalitySalesPage] = useState(1);
  const [hospitalitySalesHasMore, setHospitalitySalesHasMore] = useState(false);
  const [hospitalitySalesUpdatedAt, setHospitalitySalesUpdatedAt] = useState<string | null>(null);
  const [hospitalitySalesSearchInput, setHospitalitySalesSearchInput] = useState('');
  const [hospitalitySalesQueryCommitted, setHospitalitySalesQueryCommitted] = useState('');
  const [hospitalitySalesKind, setHospitalitySalesKind] = useState<'all' | 'quotation' | 'proforma' | 'invoice'>('all');

  const [supportTickets, setSupportTickets] = useState<SupportTicketSummary[]>([]);
  const [supportDetail, setSupportDetail] = useState<SupportTicketDetail | null>(null);
  const [supportUpdatedAt, setSupportUpdatedAt] = useState<string | null>(null);
  const [supportNewCategory, setSupportNewCategory] = useState<'support_request' | 'bug_report' | 'other'>(
    'support_request'
  );
  const [supportNewSubject, setSupportNewSubject] = useState('');
  const [supportNewBody, setSupportNewBody] = useState('');
  const [supportReply, setSupportReply] = useState('');
  const [showSupportComposer, setShowSupportComposer] = useState(false);

  const [payslipItems, setPayslipItems] = useState<PayslipListItem[]>([]);
  const [payslipDetail, setPayslipDetail] = useState<PayslipDetail | null>(null);
  const [payslipsUpdatedAt, setPayslipsUpdatedAt] = useState<string | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState<string | null>(null);

  const [mobileSummary, setMobileSummary] = useState<MobileSummary | null>(null);
  const [mobileSummaryError, setMobileSummaryError] = useState<string | null>(null);
  const [mobileSummaryUpdatedAt, setMobileSummaryUpdatedAt] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [leaveDetail, setLeaveDetail] = useState<LeaveRequestDetail | null>(null);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  const [partItems, setPartItems] = useState<PartCatalogItem[]>([]);
  const [partPage, setPartPage] = useState(1);
  const [partHasMore, setPartHasMore] = useState(false);
  const [partListTotal, setPartListTotal] = useState(0);
  const [partSearchInput, setPartSearchInput] = useState('');
  const [partQueryCommitted, setPartQueryCommitted] = useState('');
  const [partsUpdatedAt, setPartsUpdatedAt] = useState<string | null>(null);
  const [partDetail, setPartDetail] = useState<PartCatalogDetail | null>(null);

  const [stockStores, setStockStores] = useState<StockReportStoreItem[]>([]);
  const [stockStoreId, setStockStoreId] = useState<string | null>(null);
  const [stockLines, setStockLines] = useState<StockReportLine[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockHasMore, setStockHasMore] = useState(false);
  const [stockSearchInput, setStockSearchInput] = useState('');
  const [stockLineQueryCommitted, setStockLineQueryCommitted] = useState('');
  const [stockStoresUpdatedAt, setStockStoresUpdatedAt] = useState<string | null>(null);
  const [stockLinesUpdatedAt, setStockLinesUpdatedAt] = useState<string | null>(null);

  const partCatalogFetchSeqRef = useRef(0);
  const partDetailFetchSeqRef = useRef(0);
  const stockStoresFetchSeqRef = useRef(0);
  const stockLinesFetchSeqRef = useRef(0);
  const logisticsListFetchSeqRef = useRef(0);
  const logisticsDetailFetchSeqRef = useRef(0);
  const lastApprovalDetailFetchRef = useRef<{ id: string; at: number } | null>(null);
  const prevSelectedModuleRef = useRef<string | null>(null);
  const prevModulesTabActiveRef = useRef(false);

  const lastMobileSummaryNetworkAtRef = useRef(0);
  const lastApprovalsNetworkAtRef = useRef(0);
  const approvalKindFilterRef = useRef<string | undefined>(undefined);
  const mobileSummaryForLogicRef = useRef<MobileSummary | null>(null);
  const mobileSummaryFetchSeqRef = useRef(0);
  const mobileSummaryLoadQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const [storeMovementKind, setStoreMovementKind] = useState<string>('k2s');
  const prevStoreMovementKindRef = useRef(storeMovementKind);
  const [logisticsItems, setLogisticsItems] = useState<LogisticsDocListItem[]>([]);
  const [logisticsDetail, setLogisticsDetail] = useState<LogisticsDocDetail | null>(null);
  const [logisticsPage, setLogisticsPage] = useState(1);
  const [logisticsHasMore, setLogisticsHasMore] = useState(false);
  const [logisticsTotal, setLogisticsTotal] = useState(0);
  const [logisticsSearchInput, setLogisticsSearchInput] = useState('');
  const [logisticsQueryCommitted, setLogisticsQueryCommitted] = useState('');
  const [logisticsUpdatedAt, setLogisticsUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (selectedModule !== 'Store movements') {
      return;
    }
    if (!visibleStoreMovementKinds.length) {
      return;
    }
    if (!visibleStoreMovementKinds.includes(storeMovementKind)) {
      setStoreMovementKind(visibleStoreMovementKinds[0]!);
    }
  }, [selectedModule, storeMovementKind, visibleStoreMovementKinds]);

  useEffect(() => {
    mobileSummaryForLogicRef.current = mobileSummary;
  }, [mobileSummary]);

  const formatNow = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const loadApprovalSummary = async (opts?: { force?: boolean }) => {
    const force = opts?.force ?? false;
    const now = Date.now();
    if (
      !force &&
      lastApprovalsNetworkAtRef.current !== 0 &&
      now - lastApprovalsNetworkAtRef.current < PORTAL_SNAPSHOT_TTL_MS &&
      approvalSummary !== null
    ) {
      return;
    }
    try {
      const res = await getApprovalsSummary(token);
      setApprovalSummary(res.data);
    } catch {
      /* summary is optional; inbox list still works */
    }
  };

  const loadApprovals = async (page = 1, opts?: LoadApprovalsOptions) => {
    const force = opts?.force ?? false;
    if (opts && 'kind' in opts) {
      const nextKind = opts.kind?.trim() || undefined;
      approvalKindFilterRef.current = nextKind;
    }
    const kindFilter = approvalKindFilterRef.current;
    const now = Date.now();
    if (
      page === 1 &&
      !force &&
      lastApprovalsNetworkAtRef.current !== 0 &&
      now - lastApprovalsNetworkAtRef.current < PORTAL_SNAPSHOT_TTL_MS
    ) {
      return;
    }
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getApprovals(token, page, 25, kindFilter);
      if (page === 1 && res.data.summary) {
        setApprovalSummary(res.data.summary);
      } else if (page === 1) {
        await loadApprovalSummary({ force });
      }
      setApprovalItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setApprovalPage(res.data.pagination.current_page);
      setApprovalHasMore(res.data.pagination.has_more);
      setApprovalListTotal(res.data.pagination.total ?? 0);
      setApprovalsUpdatedAt(formatNow());
      if (page === 1) {
        lastApprovalsNetworkAtRef.current = Date.now();
      }
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load approvals.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadNotifications = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getNotifications(token, page, 10);
      setNotifications((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setNotificationPage(res.data.pagination.current_page);
      setNotificationHasMore(res.data.pagination.has_more);
      setNotificationUnreadCount(res.data.unread_count);
      setNotificationsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load notifications.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadLeaveRequests = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const [requestsRes, typesRes] = await Promise.all([getLeaveRequests(token, page, 10), getLeaveTypes(token)]);
      setLeaveRequests((current) => (page === 1 ? requestsRes.data.items : [...current, ...requestsRes.data.items]));
      setLeavePage(requestsRes.data.pagination.current_page);
      setLeaveHasMore(requestsRes.data.pagination.has_more);
      setLeaveTypes(typesRes.data.items);
      if (!leaveTypeId && typesRes.data.items.length > 0) {
        setLeaveTypeId(typesRes.data.items[0].id);
      }
      setLeaveUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load leave requests.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadRequisitions = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getRequisitions(token, page, 10);
      setRequisitionItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setRequisitionPage(res.data.pagination.current_page);
      setRequisitionHasMore(res.data.pagination.has_more);
      setRequisitionsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load requisitions.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadRequisitionDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getRequisitionDetail(token, id);
      setRequisitionDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load requisition.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const loadPurchaseOrders = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getPurchaseOrders(token, page, 10);
      setPurchaseOrderItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setPurchaseOrderPage(res.data.pagination.current_page);
      setPurchaseOrderHasMore(res.data.pagination.has_more);
      setPurchaseOrdersUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load purchase orders.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadPurchaseOrderDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getPurchaseOrderDetail(token, id);
      setPurchaseOrderDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load purchase order.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const loadPurchaseRfqs = async (page = 1, q = '') => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getPurchaseRfqs(token, page, 15, q);
      setPurchaseRfqItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setPurchaseRfqPage(res.data.pagination.current_page);
      setPurchaseRfqHasMore(res.data.pagination.has_more);
      setPurchaseRfqsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load purchase RFQs.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadPurchaseRfqDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getPurchaseRfqDetail(token, id);
      setPurchaseRfqDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load purchase RFQ.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const loadSupplierQuotations = async (page = 1, q = '') => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getSupplierQuotations(token, page, 15, q);
      setSupplierQuotationItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setSupplierQuotationPage(res.data.pagination.current_page);
      setSupplierQuotationHasMore(res.data.pagination.has_more);
      setSupplierQuotationsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load supplier quotations.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadSupplierQuotationDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getSupplierQuotationDetail(token, id);
      setSupplierQuotationDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load supplier quotation.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  // ---- Finance lists/details ----
  const loadCustomerInvoices = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : customerInvoiceQueryCommitted;
    if (page === 1) {
      setCustomerInvoiceQueryCommitted(query);
    }
    try {
      const res = await getCustomerInvoices(token, page, 15, query);
      setCustomerInvoiceItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setCustomerInvoicePage(res.data.pagination.current_page);
      setCustomerInvoiceHasMore(res.data.pagination.has_more);
      setCustomerInvoicesUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load customer invoices.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadCustomerInvoiceDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getCustomerInvoiceDetail(token, id);
        setCustomerInvoiceDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load customer invoice.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadProformaInvoices = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : proformaInvoiceQueryCommitted;
    if (page === 1) {
      setProformaInvoiceQueryCommitted(query);
    }
    try {
      const res = await getProformaInvoices(token, page, 15, query);
      setProformaInvoiceItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setProformaInvoicePage(res.data.pagination.current_page);
      setProformaInvoiceHasMore(res.data.pagination.has_more);
      setProformaInvoicesUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load proforma invoices.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadProformaInvoiceDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getProformaInvoiceDetail(token, id);
        setProformaInvoiceDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load proforma invoice.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadPayments = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : paymentQueryCommitted;
    if (page === 1) {
      setPaymentQueryCommitted(query);
    }
    try {
      const res = await getPayments(token, page, 15, query);
      setPaymentItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setPaymentPage(res.data.pagination.current_page);
      setPaymentHasMore(res.data.pagination.has_more);
      setPaymentsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load payments.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadPaymentDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getPaymentDetail(token, id);
        setPaymentDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load payment.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadPaymentVouchers = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : paymentVoucherQueryCommitted;
    if (page === 1) {
      setPaymentVoucherQueryCommitted(query);
    }
    try {
      const res = await getPaymentVouchers(token, page, 15, query);
      setPaymentVoucherItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setPaymentVoucherPage(res.data.pagination.current_page);
      setPaymentVoucherHasMore(res.data.pagination.has_more);
      setPaymentVouchersUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load payment vouchers.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadPaymentVoucherDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getPaymentVoucherDetail(token, id);
        setPaymentVoucherDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load payment voucher.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadSupplierInvoices = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : supplierInvoiceQueryCommitted;
    if (page === 1) {
      setSupplierInvoiceQueryCommitted(query);
    }
    try {
      const res = await getSupplierInvoices(token, page, 15, query);
      setSupplierInvoiceItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setSupplierInvoicePage(res.data.pagination.current_page);
      setSupplierInvoiceHasMore(res.data.pagination.has_more);
      setSupplierInvoicesUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load supplier invoices.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadSupplierInvoiceDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getSupplierInvoiceDetail(token, id);
        setSupplierInvoiceDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load supplier invoice.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadAccountingModuleList = async (route: string, page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : accountingQueryCommitted;
    if (page === 1) {
      setAccountingQueryCommitted(query);
      setAccountingListRoute(route);
    }
    try {
      const perPage = 15;
      if (route === 'Accounting cash flow mapping') {
        const r = await getAccountingCashFlowMapList(token);
        setAccountingListItems(page === 1 ? r.data.items : []);
        setAccountingListPage(1);
        setAccountingListHasMore(false);
        setAccountingListUpdatedAt(formatNow());
        return;
      }
      const mod = route as AccountingApiListModule;
      let res: { data: { items: AccountingListItem[]; pagination: { current_page: number; has_more: boolean } } };
      switch (mod) {
        case 'Accounting currencies':
          res = await getAccountingCurrencies(token, page, perPage, query);
          break;
        case 'Accounting exchange rates':
          res = await getAccountingExchangeRateWeeks(token, page, perPage, query);
          break;
        case 'Accounting supplier WHT types':
          res = await getAccountingSupplierWhtTypes(token, page, perPage, query);
          break;
        case 'Accounting fiscal periods':
          res = await getAccountingPeriods(token, page, perPage, query);
          break;
        case 'Accounting chart of accounts':
          res = await getAccountingAccounts(token, page, perPage, query);
          break;
        case 'Accounting journal entries':
          res = await getAccountingJournalEntries(token, page, perPage, query);
          break;
        case 'Accounting fixed assets':
          res = await getAccountingFixedAssets(token, page, perPage, query);
          break;
        case 'Accounting depreciation runs':
          res = await getAccountingDepreciationRuns(token, page, perPage, query);
          break;
        case 'Accounting bank reconciliation':
          res = await getAccountingBankStatements(token, page, perPage, query);
          break;
        default:
          setModuleError('Unknown accounting module.');
          return;
      }
      setAccountingListItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setAccountingListPage(res.data.pagination.current_page);
      setAccountingListHasMore(res.data.pagination.has_more);
      setAccountingListUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load accounting list.');
    } finally {
      setModuleLoading(false);
    }
  };

  // ---- HR lists/details (Phase 1) ----
  const loadEmployees = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : employeeQueryCommitted;
    if (page === 1) {
      setEmployeeQueryCommitted(query);
    }
    try {
      const res = await getEmployees(token, page, 15, query);
      setEmployeeItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setEmployeePage(res.data.pagination.current_page);
      setEmployeeHasMore(res.data.pagination.has_more);
      setEmployeesUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load employees.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadEmployeeDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getEmployeeDetail(token, id);
        setEmployeeDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load employee.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadLeaveBalances = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : leaveBalanceQueryCommitted;
    if (page === 1) {
      setLeaveBalanceQueryCommitted(query);
    }
    try {
      const res = await getLeaveBalances(token, page, 15, query);
      setLeaveBalanceItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setLeaveBalancePage(res.data.pagination.current_page);
      setLeaveBalanceHasMore(res.data.pagination.has_more);
      setLeaveBalancesUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load leave balances.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadLeaveBalanceDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getLeaveBalanceDetail(token, id);
        setLeaveBalanceDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load leave balance.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const setHrCatalogSearchInput = (route: HrCatalogRoute, value: string) => {
    setHrCatalog((current) => ({
      ...current,
      [route]: { ...current[route], searchInput: value },
    }));
  };

  const loadHrCatalogList = async (route: HrCatalogRoute, page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : hrCatalog[route].queryCommitted;
    if (page === 1) {
      setHrCatalog((current) => ({
        ...current,
        [route]: { ...current[route], queryCommitted: query },
      }));
    }
    try {
      const res = await fetchHrCatalogList(token, route, page, 15, query);
      setHrCatalog((current) => ({
        ...current,
        [route]: {
          ...current[route],
          items: page === 1 ? res.data.items : [...current[route].items, ...res.data.items],
          page: res.data.pagination.current_page,
          hasMore: res.data.pagination.has_more,
          updatedAt: formatNow(),
          queryCommitted: page === 1 ? query : current[route].queryCommitted,
        },
      }));
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : `Failed to load ${route.toLowerCase()}.`);
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHrCatalogDetail = useCallback(
    async (route: HrCatalogRoute, id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await fetchHrCatalogDetail(token, route, id);
        setHrCatalog((current) => ({
          ...current,
          [route]: { ...current[route], detail: res.data as HrCatalogState[typeof route]['detail'] },
        }));
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load record.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const clearHrCatalogDetail = (route: HrCatalogRoute) => {
    setHrCatalog((current) => ({
      ...current,
      [route]: { ...current[route], detail: null },
    }));
  };

  const loadSuppliers = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : supplierQueryCommitted;
    if (page === 1) {
      setSupplierQueryCommitted(query);
    }
    try {
      const res = await getSuppliers(token, page, 15, query);
      setSupplierItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setSupplierPage(res.data.pagination.current_page);
      setSupplierHasMore(res.data.pagination.has_more);
      setSuppliersUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load suppliers.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadSupplierDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getSupplierDetail(token, id);
      setSupplierDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load supplier.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const loadUnits = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : unitQueryCommitted;
    if (page === 1) {
      setUnitQueryCommitted(query);
    }
    try {
      const res = await getUnits(token, page, 15, query);
      setUnitItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setUnitPage(res.data.pagination.current_page);
      setUnitHasMore(res.data.pagination.has_more);
      setUnitsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load units.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadUnitDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getUnitDetail(token, id);
        setUnitDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load unit.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadCategories = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : categoryQueryCommitted;
    if (page === 1) {
      setCategoryQueryCommitted(query);
    }
    try {
      const res = await getCategories(token, page, 15, query);
      setCategoryItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setCategoryPage(res.data.pagination.current_page);
      setCategoryHasMore(res.data.pagination.has_more);
      setCategoriesUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load categories.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadCategoryDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getCategoryDetail(token, id);
        setCategoryDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load category.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadBanks = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : bankMasterQueryCommitted;
    if (page === 1) {
      setBankMasterQueryCommitted(query);
    }
    try {
      const res = await getBankMasterList(token, page, 15, query);
      setBankMasterItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setBankMasterPage(res.data.pagination.current_page);
      setBankMasterHasMore(res.data.pagination.has_more);
      setBanksUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load banks.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadBankMasterDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getBankMasterDetail(token, id);
        setBankMasterDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load bank.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadBankBranches = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : bankBranchQueryCommitted;
    if (page === 1) {
      setBankBranchQueryCommitted(query);
    }
    try {
      const res = await getBankBranches(token, page, 15, query, '');
      setBankBranchItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setBankBranchPage(res.data.pagination.current_page);
      setBankBranchHasMore(res.data.pagination.has_more);
      setBankBranchesUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load bank branches.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadBankBranchDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getBankBranchDetail(token, id);
        setBankBranchDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load bank branch.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadMobileOperators = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : mobileOperatorQueryCommitted;
    if (page === 1) {
      setMobileOperatorQueryCommitted(query);
    }
    try {
      const res = await getMobileOperators(token, page, 15, query);
      setMobileOperatorItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setMobileOperatorPage(res.data.pagination.current_page);
      setMobileOperatorHasMore(res.data.pagination.has_more);
      setMobileOperatorsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load mobile operators.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadMobileOperatorDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getMobileOperatorDetail(token, id);
        setMobileOperatorDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load mobile operator.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token]
  );

  const loadCrmCustomers = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getCrmCustomers(token, page, 15, '');
      setCrmCustomerItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setCrmCustomerPage(res.data.pagination.current_page);
      setCrmCustomerHasMore(res.data.pagination.has_more);
      setCrmCustomersUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load customers.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadCrmCustomerDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getCrmCustomerDetail(token, id);
      setCrmCustomerDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load customer.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const loadCrmContracts = async (page = 1) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getCrmContracts(token, page, 15, '');
      setCrmContractItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setCrmContractPage(res.data.pagination.current_page);
      setCrmContractHasMore(res.data.pagination.has_more);
      setCrmContractsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load contracts.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadCrmContractDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getCrmContractDetail(token, id);
      setCrmContractDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load contract.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const loadCrmQuotations = async (page = 1, statusOverride?: 'all' | 'pending') => {
    setModuleLoading(true);
    setModuleError(null);
    const status = statusOverride ?? crmQuotationStatus;
    try {
      const res = await getCrmQuotations(token, page, 15, '', status);
      setCrmQuotationItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setCrmQuotationPage(res.data.pagination.current_page);
      setCrmQuotationHasMore(res.data.pagination.has_more);
      setCrmQuotationsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load quotations.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadCrmQuotationDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getCrmQuotationDetail(token, id);
      setCrmQuotationDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load quotation.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const loadAttendance = async () => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getAttendance(token, 60);
      setAttendanceItems(res.data.items);
      setAttendanceFrom(res.data.from_date);
      setAttendanceUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load attendance.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityFrontDesk = async (propertyId?: string | null) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const selected =
        propertyId !== undefined
          ? propertyId
          : hospitalityFrontDesk?.selected_property_id;
      const res = await getHospitalityFrontDeskSummary(token, selected);
      setHospitalityFrontDesk(res.data);
      setHospitalityFrontDeskUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load front desk summary.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityHousekeeping = async (params?: { propertyId?: string | null; status?: string | null }) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const selectedPropertyId =
        params?.propertyId !== undefined
          ? params.propertyId
          : hospitalityHousekeeping?.selected_property_id;
      const selectedStatus =
        params?.status !== undefined
          ? params.status
          : hospitalityHousekeeping?.status_filter;
      const res = await getHospitalityHousekeepingRooms(token, {
        propertyId: selectedPropertyId,
        status: selectedStatus,
      });
      setHospitalityHousekeeping(res.data);
      setHospitalityHousekeepingUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load housekeeping rooms.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityReservations = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : hospitalityReservationQueryCommitted;
    if (page === 1) {
      setHospitalityReservationQueryCommitted(query);
    }
    try {
      const res = await getHospitalityReservations(token, page, 15, query);
      setHospitalityReservationItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setHospitalityReservationPage(res.data.pagination.current_page);
      setHospitalityReservationHasMore(res.data.pagination.has_more);
      setHospitalityReservationsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load reservations.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityReservationDetail = useCallback(async (id: string) => {
    setHospitalityDetailLoading(true);
    setHospitalityDetailError(null);
    setHospitalityReservationDetail(null);
    try {
      const res = await getHospitalityReservationDetail(token, id);
      setHospitalityReservationDetail(res.data);
    } catch (error) {
      setHospitalityDetailError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load reservation detail.'),
      );
    } finally {
      setHospitalityDetailLoading(false);
    }
  }, [token]);

  const loadHospitalityGuests = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : hospitalityGuestQueryCommitted;
    if (page === 1) {
      setHospitalityGuestQueryCommitted(query);
    }
    try {
      const res = await getHospitalityGuests(token, page, 15, query);
      setHospitalityGuestItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setHospitalityGuestPage(res.data.pagination.current_page);
      setHospitalityGuestHasMore(res.data.pagination.has_more);
      setHospitalityGuestsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load guests.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityGuestDetail = useCallback(async (id: string) => {
    setHospitalityDetailLoading(true);
    setHospitalityDetailError(null);
    setHospitalityGuestDetail(null);
    try {
      const res = await getHospitalityGuestDetail(token, id);
      setHospitalityGuestDetail(res.data);
    } catch (error) {
      setHospitalityDetailError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load guest detail.'),
      );
    } finally {
      setHospitalityDetailLoading(false);
    }
  }, [token]);

  const loadHospitalityFolios = async (page = 1, q?: string) => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : hospitalityFolioQueryCommitted;
    if (page === 1) {
      setHospitalityFolioQueryCommitted(query);
    }
    try {
      const res = await getHospitalityFolios(token, page, 15, query);
      setHospitalityFolioItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setHospitalityFolioPage(res.data.pagination.current_page);
      setHospitalityFolioHasMore(res.data.pagination.has_more);
      setHospitalityFoliosUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load folios.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityFolioDetail = useCallback(async (reservationId: string) => {
    setHospitalityDetailLoading(true);
    setHospitalityDetailError(null);
    setHospitalityFolioDetail(null);
    try {
      const res = await getHospitalityFolioDetail(token, reservationId);
      setHospitalityFolioDetail(res.data);
    } catch (error) {
      setHospitalityDetailError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load folio detail.'),
      );
    } finally {
      setHospitalityDetailLoading(false);
    }
  }, [token]);

  const addHospitalityFolioPayment = useCallback(async (reservationId: string, amount: number, description?: string) => {
    setHospitalityDetailLoading(true);
    setHospitalityDetailError(null);
    try {
      const res = await postHospitalityFolioPayment(token, reservationId, amount, description);
      setHospitalityFolioDetail(res.data);
      setHospitalityFoliosUpdatedAt(formatNow());
    } catch (error) {
      setHospitalityDetailError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to add folio payment.'),
      );
    } finally {
      setHospitalityDetailLoading(false);
    }
  }, [token]);

  const addHospitalityFolioCharge = useCallback(async (reservationId: string, amount: number, description: string) => {
    setHospitalityDetailLoading(true);
    setHospitalityDetailError(null);
    try {
      const res = await postHospitalityFolioCharge(token, reservationId, amount, description);
      setHospitalityFolioDetail(res.data);
      setHospitalityFoliosUpdatedAt(formatNow());
    } catch (error) {
      setHospitalityDetailError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to add folio charge.'),
      );
    } finally {
      setHospitalityDetailLoading(false);
    }
  }, [token]);

  const loadHospitalityOverview = async () => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getHospitalityOverview(token);
      setHospitalityOverview(res.data);
      setHospitalityOverviewUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load hospitality overview.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityRateCatalog = async (page = 1, propertyId?: string | null) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const selected =
        propertyId !== undefined ? propertyId : hospitalityRateCatalog?.selected_property_id;
      const res = await getHospitalityRateCatalog(token, page, 20, selected);
      setHospitalityRateCatalog((current) => {
        if (page === 1 || !current) {
          return res.data;
        }
        return {
          ...res.data,
          items: [...current.items, ...res.data.items],
        };
      });
      setHospitalityRateCatalogPage(res.data.pagination.current_page);
      setHospitalityRateCatalogHasMore(res.data.pagination.has_more);
      setHospitalityRateCatalogUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load rate catalog.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityRoomsInventory = async (propertyId?: string | null) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const selected =
        propertyId !== undefined ? propertyId : hospitalityRoomsInventory?.selected_property_id;
      const res = await getHospitalityRoomsInventory(token, selected);
      setHospitalityRoomsInventory(res.data);
      setHospitalityRoomsInventoryUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load rooms inventory.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityReports = async (params?: { propertyId?: string | null; date?: string | null }) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getHospitalityReportsSummary(token, {
        propertyId: params?.propertyId !== undefined ? params.propertyId : hospitalityReports?.selected_property_id,
        date: params?.date !== undefined ? params.date : hospitalityReports?.date,
      });
      setHospitalityReports(res.data);
      setHospitalityReportsUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load hospitality reports.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityChannelManager = async (propertyId?: string | null) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const selected =
        propertyId !== undefined ? propertyId : hospitalityChannelManager?.selected_property_id;
      const res = await getHospitalityChannelManagerSummary(token, selected);
      setHospitalityChannelManager(res.data);
      setHospitalityChannelManagerUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load channel manager.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadHospitalityReservationSales = async (page = 1, q?: string, kind?: 'all' | 'quotation' | 'proforma' | 'invoice') => {
    setModuleLoading(true);
    setModuleError(null);
    const query = q !== undefined ? q : hospitalitySalesQueryCommitted;
    const docKind = kind !== undefined ? kind : hospitalitySalesKind;
    if (page === 1) {
      setHospitalitySalesQueryCommitted(query);
      if (kind !== undefined) {
        setHospitalitySalesKind(kind);
      }
    }
    try {
      const res = await getHospitalityReservationSales(token, page, 15, query, docKind);
      setHospitalitySalesItems((current) => (page === 1 ? res.data.items : [...current, ...res.data.items]));
      setHospitalitySalesPage(res.data.pagination.current_page);
      setHospitalitySalesHasMore(res.data.pagination.has_more);
      setHospitalitySalesUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load reservation sales.'),
      );
    } finally {
      setModuleLoading(false);
    }
  };

  const loadSupportTickets = async () => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getSupportTickets(token);
      setSupportTickets(res.data.items);
      setSupportUpdatedAt(formatNow());
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load support tickets.');
    } finally {
      setModuleLoading(false);
    }
  };

  const loadSupportDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getSupportTicket(token, id);
      setSupportDetail(res.data);
      setSupportReply('');
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load ticket.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const submitNewSupportTicket = async () => {
    if (!supportNewSubject.trim() || !supportNewBody.trim()) {
      setModuleError('Subject and description are required.');
      return;
    }
    setModuleLoading(true);
    setModuleError(null);
    try {
      await createSupportTicket(token, {
        category: supportNewCategory,
        subject: supportNewSubject.trim(),
        description: supportNewBody.trim(),
      });
      setSupportNewSubject('');
      setSupportNewBody('');
      setShowSupportComposer(false);
      await loadSupportTickets();
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to create ticket.');
    } finally {
      setModuleLoading(false);
    }
  };

  const submitSupportReply = async (ticketId: string) => {
    const body = supportReply.trim();
    if (!body) {
      setModuleError('Enter a message to send.');
      return;
    }
    setModuleLoading(true);
    setModuleError(null);
    try {
      await postSupportTicketMessage(token, ticketId, body);
      setSupportReply('');
      await loadSupportDetail(ticketId);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to send reply.');
    } finally {
      setModuleLoading(false);
    }
  };

  const fetchPartsCatalog = async (page: number, q: string) => {
    const seq = ++partCatalogFetchSeqRef.current;
    setModuleLoading(true);
    setModuleError(null);
    if (page === 1) {
      setPartQueryCommitted(q);
    }
    try {
      const res = await getPartCatalog(token, page, 15, q);
      if (seq !== partCatalogFetchSeqRef.current) {
        return;
      }
      setPartItems((c) => (page === 1 ? res.data.items : [...c, ...res.data.items]));
      setPartPage(res.data.pagination.current_page);
      setPartHasMore(res.data.pagination.has_more);
      setPartListTotal(res.data.pagination.total);
      setPartsUpdatedAt(formatNow());
    } catch (error) {
      if (seq !== partCatalogFetchSeqRef.current) {
        return;
      }
      setPartListTotal(0);
      setModuleError(error instanceof Error ? error.message : 'Failed to load parts.');
    } finally {
      if (seq === partCatalogFetchSeqRef.current) {
        setModuleLoading(false);
      }
    }
  };

  const fetchPartDetail = useCallback(async (id: string) => {
    const seq = ++partDetailFetchSeqRef.current;
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getPartCatalogDetail(token, id);
      if (seq !== partDetailFetchSeqRef.current) {
        return;
      }
      setPartDetail(res.data);
    } catch (error) {
      if (seq !== partDetailFetchSeqRef.current) {
        return;
      }
      setModuleError(error instanceof Error ? error.message : 'Failed to load part.');
    } finally {
      if (seq === partDetailFetchSeqRef.current) {
        setModuleLoading(false);
      }
    }
  }, [token]);

  const loadStockStores = async () => {
    const seq = ++stockStoresFetchSeqRef.current;
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getStockReportStores(token);
      if (seq !== stockStoresFetchSeqRef.current) {
        return;
      }
      setStockStores(res.data.items);
      setStockStoresUpdatedAt(formatNow());
    } catch (error) {
      if (seq !== stockStoresFetchSeqRef.current) {
        return;
      }
      setModuleError(error instanceof Error ? error.message : 'Failed to load stores.');
    } finally {
      if (seq === stockStoresFetchSeqRef.current) {
        setModuleLoading(false);
      }
    }
  };

  const fetchStockLines = async (page: number, storeId: string, q: string) => {
    const seq = ++stockLinesFetchSeqRef.current;
    setModuleLoading(true);
    setModuleError(null);
    if (page === 1) {
      setStockLineQueryCommitted(q);
    }
    try {
      const res = await getStockReportLines(token, storeId, page, 40, q);
      if (seq !== stockLinesFetchSeqRef.current) {
        return;
      }
      setStockLines((c) => (page === 1 ? res.data.items : [...c, ...res.data.items]));
      setStockPage(res.data.pagination.current_page);
      setStockHasMore(res.data.pagination.has_more);
      setStockLinesUpdatedAt(formatNow());
    } catch (error) {
      if (seq !== stockLinesFetchSeqRef.current) {
        return;
      }
      setModuleError(error instanceof Error ? error.message : 'Failed to load stock lines.');
    } finally {
      if (seq === stockLinesFetchSeqRef.current) {
        setModuleLoading(false);
      }
    }
  };

  const fetchLogisticsDocuments = async (page: number, basePath: string, q: string) => {
    const seq = ++logisticsListFetchSeqRef.current;
    setModuleLoading(true);
    setModuleError(null);
    if (page === 1) {
      setLogisticsQueryCommitted(q);
    }
    try {
      const res = await getLogisticsDocList(token, basePath, page, 15, q);
      if (seq !== logisticsListFetchSeqRef.current) {
        return;
      }
      setLogisticsItems((c) => (page === 1 ? res.data.items : [...c, ...res.data.items]));
      setLogisticsPage(res.data.pagination.current_page);
      setLogisticsHasMore(res.data.pagination.has_more);
      setLogisticsTotal(res.data.pagination.total);
      setLogisticsUpdatedAt(formatNow());
    } catch (error) {
      if (seq !== logisticsListFetchSeqRef.current) {
        return;
      }
      setLogisticsTotal(0);
      setModuleError(error instanceof Error ? error.message : 'Failed to load documents.');
    } finally {
      if (seq === logisticsListFetchSeqRef.current) {
        setModuleLoading(false);
      }
    }
  };

  const fetchLogisticsDetail = useCallback(async (id: string, basePath: string) => {
    const seq = ++logisticsDetailFetchSeqRef.current;
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getLogisticsDocDetail(token, basePath, id);
      if (seq !== logisticsDetailFetchSeqRef.current) {
        return;
      }
      setLogisticsDetail(res.data);
    } catch (error) {
      if (seq !== logisticsDetailFetchSeqRef.current) {
        return;
      }
      setModuleError(error instanceof Error ? error.message : 'Failed to load document.');
    } finally {
      if (seq === logisticsDetailFetchSeqRef.current) {
        setModuleLoading(false);
      }
    }
  }, [token]);

  const loadPayslips = useCallback(async () => {
    setPayrollLoading(true);
    setPayrollError(null);
    try {
      const res = await getPayslips(token);
      setPayslipItems(res.data.items);
      setPayslipsUpdatedAt(formatNow());
    } catch (error) {
      setPayrollError(
        friendlyModuleLoadError(error instanceof Error ? error.message : null, 'Failed to load payslips.'),
      );
    } finally {
      setPayrollLoading(false);
    }
  }, [token]);

  const loadPayslipDetail = useCallback(
    async (id: string) => {
      setModuleLoading(true);
      setModuleError(null);
      try {
        const res = await getPayslipDetail(token, id);
        setPayslipDetail(res.data);
      } catch (error) {
        setModuleError(error instanceof Error ? error.message : 'Failed to load payslip.');
      } finally {
        setModuleLoading(false);
      }
    },
    [token],
  );

  const loadMobileSummary = useCallback(
    (opts?: LoadMobileSummaryOptions) => {
      const job = async () => {
        const force = opts?.force ?? false;
        const now = Date.now();
        const hasLocal = mobileSummaryForLogicRef.current !== null;
        if (
          !force &&
          hasLocal &&
          lastMobileSummaryNetworkAtRef.current !== 0 &&
          now - lastMobileSummaryNetworkAtRef.current < PORTAL_SNAPSHOT_TTL_MS
        ) {
          return;
        }

        const blocking = !hasLocal;
        if (blocking) {
          setSummaryLoading(true);
        }
        setMobileSummaryError(null);
        const seq = ++mobileSummaryFetchSeqRef.current;
        try {
          const res = await getMobileSummary(token);
          if (seq !== mobileSummaryFetchSeqRef.current) {
            return;
          }
          setMobileSummary(res.data);
          mobileSummaryForLogicRef.current = res.data;
          const networkAt = Date.now();
          lastMobileSummaryNetworkAtRef.current = networkAt;
          setMobileSummaryUpdatedAt(formatNow());
          void AsyncStorage.setItem(
            mobileSummaryStorageKey(token),
            JSON.stringify({ networkAt, data: res.data }),
          ).catch(() => {
            /* ignore persist errors */
          });
        } catch (error) {
          if (seq !== mobileSummaryFetchSeqRef.current) {
            return;
          }
          if (!hasLocal) {
            setMobileSummary(null);
            mobileSummaryForLogicRef.current = null;
          }
          setMobileSummaryError(error instanceof Error ? error.message : 'Failed to load summary.');
        } finally {
          if (seq === mobileSummaryFetchSeqRef.current) {
            setSummaryLoading(false);
          }
        }
      };

      const queued = mobileSummaryLoadQueueRef.current.then(job, job);
      mobileSummaryLoadQueueRef.current = queued.catch(() => {});
      return queued;
    },
    [token],
  );

  useEffect(() => {
    if (!token) {
      lastMobileSummaryNetworkAtRef.current = 0;
      lastApprovalsNetworkAtRef.current = 0;
      mobileSummaryLoadQueueRef.current = Promise.resolve();
      mobileSummaryFetchSeqRef.current += 1;
      mobileSummaryForLogicRef.current = null;
      setMobileSummary(null);
      setMobileSummaryError(null);
      setMobileSummaryUpdatedAt(null);
      setSummaryLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(mobileSummaryStorageKey(token));
        if (cancelled) {
          return;
        }
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { networkAt: number; data: MobileSummary };
            if (
              parsed &&
              typeof parsed.networkAt === 'number' &&
              parsed.data &&
              Date.now() - parsed.networkAt <= MOBILE_SUMMARY_DISK_MAX_AGE_MS
            ) {
              mobileSummaryForLogicRef.current = parsed.data;
              setMobileSummary(parsed.data);
              lastMobileSummaryNetworkAtRef.current = parsed.networkAt;
              setMobileSummaryUpdatedAt(formatShortTime(parsed.networkAt));
              setMobileSummaryError(null);
            }
          } catch {
            /* ignore corrupt cache */
          }
        }
      } catch {
        /* ignore storage read errors */
      }
      if (!cancelled) {
        void loadMobileSummary();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, loadMobileSummary]);

  const loadLeaveRequestDetail = useCallback(async (id: string) => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getLeaveRequest(token, id);
      setLeaveDetail(res.data);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to load leave request.');
    } finally {
      setModuleLoading(false);
    }
  }, [token]);

  const cancelOpenedSupportTicket = async () => {
    if (!supportDetail) {
      return;
    }
    setModuleLoading(true);
    setModuleError(null);
    try {
      await cancelSupportTicket(token, supportDetail.id);
      setSupportDetail(null);
      await loadSupportTickets();
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to cancel ticket.');
    } finally {
      setModuleLoading(false);
    }
  };

  const setApprovalStatus = async (
    id: string,
    status: 'Approved' | 'Rejected',
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const note = approvalNotes[id]?.trim();
      if (status === 'Approved') {
        await approveItem(token, id, note);
      } else {
        await rejectItem(token, id, note);
      }
      setApprovalNotes((current) => ({ ...current, [id]: '' }));
      const removed = approvalItems.find((item) => item.id === id);
      setApprovalItems((current) => current.filter((item) => item.id !== id));
      setApprovalListTotal((n) => Math.max(0, n - 1));
      if (removed?.kind && approvalSummary) {
        setApprovalSummary((prev) => {
          if (!prev) {
            return prev;
          }
          const modules = prev.modules
            .map((m) => (m.kind === removed.kind ? { ...m, count: Math.max(0, m.count - 1) } : m))
            .filter((m) => m.count > 0);
          return { total: Math.max(0, prev.total - 1), modules };
        });
      }
      void loadApprovals(1, { force: true }).catch(() => {
        /* Inbox already updated optimistically; background sync can wait for pull-to-refresh. */
      });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update approval.';
      return { ok: false, error: message };
    }
  };

  const loadApprovalDetail = useCallback(async (id: string, opts?: { force?: boolean }) => {
    const now = Date.now();
    const last = lastApprovalDetailFetchRef.current;
    if (!opts?.force && last?.id === id && now - last.at < 3000) {
      return;
    }
    lastApprovalDetailFetchRef.current = { id, at: now };
    setModuleLoading(true);
    setModuleError(null);
    try {
      const res = await getApprovalDetail(token, id);
      if (lastApprovalDetailFetchRef.current?.id !== id) {
        return;
      }
      setApprovalDetail(res.data);
    } catch (error) {
      if (lastApprovalDetailFetchRef.current?.id !== id) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to load approval details.';
      setModuleError(
        /too many attempts/i.test(message)
          ? 'Too many requests. Wait about a minute, then tap Retry.'
          : message,
      );
    } finally {
      if (lastApprovalDetailFetchRef.current?.id === id) {
        setModuleLoading(false);
      }
    }
  }, [token]);

  const markOneNotificationRead = async (id: string) => {
    setModuleLoading(true);
    try {
      await markNotificationRead(token, id);
      await loadNotifications(1);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to update notification.');
    } finally {
      setModuleLoading(false);
    }
  };

  const markAllRead = async () => {
    setModuleLoading(true);
    try {
      await markAllNotificationsRead(token);
      await loadNotifications(1);
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to update notifications.');
    } finally {
      setModuleLoading(false);
    }
  };

  const submitLeaveRequest = async () => {
    if (!leaveStart.trim() || !leaveEnd.trim()) {
      setModuleError('Start date and end date are required.');
      return;
    }
    if (leaveTypes.length > 0 && !leaveTypeId) {
      setModuleError('Select a leave type.');
      return;
    }
    const start = new Date(leaveStart.trim());
    const end = new Date(leaveEnd.trim());
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      setModuleError('End date must be on or after the start date.');
      return;
    }

    setModuleLoading(true);
    setModuleError(null);
    try {
      const payload: { leave_type_id?: string; leave_type?: string; date_start: string; date_end: string; notes?: string } = {
        date_start: leaveStart.trim(),
        date_end: leaveEnd.trim(),
        notes: leaveNotes.trim() || undefined,
      };

      if (leaveTypeId) {
        payload.leave_type_id = leaveTypeId;
      } else {
        payload.leave_type = 'Other';
      }

      await createLeaveRequest(token, payload);
      setLeaveNotes('');
      setLeaveStart('');
      setLeaveEnd('');
      await loadLeaveRequests(1);
      return true;
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to submit leave request.');
      return false;
    } finally {
      setModuleLoading(false);
    }
  };

  const resolveNotificationTarget = (item: NotificationItem): { module: string; approvalId?: string } => {
    if (item.module && item.module.trim() !== '') {
      return {
        module: item.module,
        approvalId: item.target_id ? String(item.target_id) : undefined,
      };
    }

    const payload = item.data ?? {};
    const moduleFromPayload = String((payload['module'] ?? payload['target_module'] ?? '') || '');
    const approvalId =
      String((payload['approval_id'] ?? payload['requisition_id'] ?? payload['target_id'] ?? '') || '') || undefined;

    if (moduleFromPayload) {
      return { module: moduleFromPayload, approvalId };
    }

    const haystack = `${item.title} ${item.body}`.toLowerCase();
    if (haystack.includes('approval') || haystack.includes('requisition')) {
      return { module: 'Approvals', approvalId };
    }

    return { module: 'Notifications' };
  };

  const loadModuleListForRouteImpl = useCallback(
    (route: string, page = 1, q?: string) => {
      let movementKind = storeMovementKind;
      if (route === 'Store movements') {
        if (!visibleStoreMovementKinds.length) {
          setModuleLoading(false);
          return Promise.resolve();
        }
        movementKind = visibleStoreMovementKinds.includes(storeMovementKind)
          ? storeMovementKind
          : visibleStoreMovementKinds[0]!;
      }

      if (route === 'Approvals') {
        return loadApprovals(page, { force: page === 1 });
      }
      if (webPathForPortalSurface(route, portal) && !isAccountingApiListModule(route) && !isFinanceReportMobileModule(route)) {
        setModuleLoading(false);
        return Promise.resolve();
      }
      if (route === 'Notifications') {
        return loadNotifications(page);
      }
      if (route === 'Leave Requests') {
        return loadLeaveRequests(page);
      }
      if (route === 'Requisitions') {
        if (canViewMobileRequisitions) {
          return loadRequisitions(page);
        }
        return Promise.resolve();
      }
      if (route === 'Purchase orders') {
        if (canViewMobilePurchaseOrders) {
          return loadPurchaseOrders(page);
        }
        return Promise.resolve();
      }
      if (route === 'Purchase RFQs') {
        if (canViewMobilePurchaseRfqs) {
          return loadPurchaseRfqs(page, q ?? '');
        }
        return Promise.resolve();
      }
      if (route === 'Supplier quotations') {
        if (canViewMobileSupplierQuotations) {
          return loadSupplierQuotations(page, q ?? '');
        }
        return Promise.resolve();
      }
      if (route === 'Customer invoices') {
        return loadCustomerInvoices(page, q);
      }
      if (route === 'Proforma invoices') {
        return loadProformaInvoices(page, q);
      }
      if (route === 'Customer payments') {
        return loadPayments(page, q);
      }
      if (route === 'Payment vouchers') {
        return loadPaymentVouchers(page, q);
      }
      if (route === 'Supplier invoices') {
        return loadSupplierInvoices(page, q);
      }
      if (isAccountingApiListModule(route)) {
        return loadAccountingModuleList(route, page, q);
      }
      if (route === 'Employees') {
        return loadEmployees(page, q);
      }
      if (route === 'Leave balances') {
        return loadLeaveBalances(page, q);
      }
      if (isHrCatalogRoute(route)) {
        return loadHrCatalogList(route, page, q);
      }
      if (route === 'Customers') {
        return loadCrmCustomers(page);
      }
      if (route === 'Contracts') {
        return loadCrmContracts(page);
      }
      if (route === 'Quotations') {
        return loadCrmQuotations(page, crmQuotationStatus);
      }
      if (route === 'Attendance') {
        return loadAttendance();
      }
      if (route === 'Front desk') {
        return loadHospitalityFrontDesk();
      }
      if (route === 'Housekeeping') {
        return loadHospitalityHousekeeping();
      }
      if (route === 'Reservations') {
        return loadHospitalityReservations(page, q);
      }
      if (route === 'Guests') {
        return loadHospitalityGuests(page, q);
      }
      if (route === 'Folios & billing') {
        return loadHospitalityFolios(page, q);
      }
      if (route === 'Hospitality overview') {
        return loadHospitalityOverview();
      }
      if (route === 'Rate catalog') {
        return loadHospitalityRateCatalog(page);
      }
      if (route === 'Rooms & inventory') {
        return loadHospitalityRoomsInventory();
      }
      if (route === 'Hospitality reports') {
        return loadHospitalityReports();
      }
      if (route === 'Channel manager') {
        return loadHospitalityChannelManager();
      }
      if (route === 'Reservation sales') {
        return loadHospitalityReservationSales(page, q);
      }
      if (route === 'Support') {
        return loadSupportTickets();
      }
      if (route === 'Part catalog') {
        return fetchPartsCatalog(page, q ?? '');
      }
      if (route === 'Suppliers') {
        return loadSuppliers(page, q);
      }
      if (route === 'Units') {
        return loadUnits(page, q);
      }
      if (route === 'Categories') {
        return loadCategories(page, q);
      }
      if (route === 'Banks') {
        return loadBanks(page, q);
      }
      if (route === 'Bank branches') {
        return loadBankBranches(page, q);
      }
      if (route === 'Mobile operators') {
        return loadMobileOperators(page, q);
      }
      if (route === 'Stock by store') {
        return loadStockStores();
      }
      if (isLogisticsModule(route)) {
        const path = logisticsPathFor(route, movementKind);
        if (path) {
          return fetchLogisticsDocuments(page, path, q ?? '');
        }
      }
      return Promise.resolve();
    },
    [
      storeMovementKind,
      canViewMobileRequisitions,
      canViewMobilePurchaseOrders,
      canViewMobilePurchaseRfqs,
      canViewMobileSupplierQuotations,
      crmQuotationStatus,
      loadApprovals,
      loadNotifications,
      loadLeaveRequests,
      loadRequisitions,
      loadPurchaseOrders,
      loadPurchaseRfqs,
      loadSupplierQuotations,
      loadCustomerInvoices,
      loadProformaInvoices,
      loadPayments,
      loadPaymentVouchers,
      loadSupplierInvoices,
      loadAccountingModuleList,
      loadEmployees,
      loadLeaveBalances,
      loadHrCatalogList,
      loadCrmCustomers,
      loadCrmContracts,
      loadCrmQuotations,
      loadAttendance,
      loadHospitalityFrontDesk,
      loadHospitalityHousekeeping,
      loadHospitalityReservations,
      loadHospitalityGuests,
      loadHospitalityFolios,
      loadSupportTickets,
      fetchPartsCatalog,
      loadSuppliers,
      loadUnits,
      loadCategories,
      loadBanks,
      loadBankBranches,
      loadMobileOperators,
      loadStockStores,
      fetchLogisticsDocuments,
      portal,
      visibleStoreMovementKinds,
      setModuleLoading,
    ],
  );

  const loadModuleListForRouteRef = useRef(loadModuleListForRouteImpl);
  loadModuleListForRouteRef.current = loadModuleListForRouteImpl;

  /** Stable reference — safe to call from effects without re-subscribe loops. */
  const loadModuleListForRoute = useCallback((route: string, page = 1, q?: string) => {
    return loadModuleListForRouteRef.current(route, page, q);
  }, []);

  const openNotificationTarget = async (item: NotificationItem) => {
    if (!item.read) {
      await markOneNotificationRead(item.id);
    }

    const target = resolveNotificationTarget(item);
    onOpenAction(target.module);

    if (target.module === 'Approvals' && target.approvalId) {
      await loadApprovalDetail(target.approvalId);
    }
  };

  useEffect(() => {
    if (activeTab !== 'modules') {
      prevModulesTabActiveRef.current = false;
      return;
    }

    const tabEntered = !prevModulesTabActiveRef.current;
    prevModulesTabActiveRef.current = true;

    const moduleChanged = prevSelectedModuleRef.current !== selectedModule;
    const movementChanged =
      selectedModule === 'Store movements' && prevStoreMovementKindRef.current !== storeMovementKind;
    prevSelectedModuleRef.current = selectedModule;
    prevStoreMovementKindRef.current = storeMovementKind;

    if (!moduleChanged && !tabEntered && !movementChanged) {
      return;
    }

    setModuleError(null);

    // Do not clear list slices here — ModuleList renders one route at a time and each
    // loader replaces page-1 results. Clearing after an in-flight fetch caused empty Finance/HR lists.

    if (moduleChanged && selectedModule === 'Quotations') {
      setCrmQuotationStatus('all');
    }

    if (moduleChanged && selectedModule === 'Store movements') {
      if (visibleStoreMovementKinds.length > 0) {
        setStoreMovementKind(visibleStoreMovementKinds[0]!);
      }
    }

    void loadModuleListForRouteRef.current(selectedModule, 1, '');
  }, [activeTab, selectedModule, storeMovementKind, visibleStoreMovementKinds]);

  useEffect(() => {
    if (activeTab === 'payslip') {
      void loadPayslips();
    }
  }, [activeTab, token, loadPayslips]);

  const onPullRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([loadMobileSummary({ force: true }), loadApprovals(1, { force: true })]);
        return;
      }
      if (activeTab === 'payslip') {
        await loadPayslips();
        return;
      }
      if (activeTab === 'reports') {
        await Promise.all([
          loadMobileSummary({ force: true }),
          loadApprovalSummary({ force: true }),
        ]);
        return;
      }
      if (activeTab !== 'modules') {
        return;
      }
      if (selectedModule === 'Approvals') {
        await loadApprovals(1, { force: true });
      } else if (selectedModule === 'Notifications') {
        await loadNotifications(1);
      } else if (selectedModule === 'Leave Requests') {
        await loadLeaveRequests(1);
      } else if (selectedModule === 'Requisitions') {
        if (canViewMobileRequisitions) {
          await loadRequisitions(1);
        }
      } else if (selectedModule === 'Purchase orders') {
        if (canViewMobilePurchaseOrders) {
          await loadPurchaseOrders(1);
        }
      } else if (selectedModule === 'Customer invoices') {
        await loadCustomerInvoices(1, customerInvoiceQueryCommitted);
      } else if (selectedModule === 'Proforma invoices') {
        await loadProformaInvoices(1, proformaInvoiceQueryCommitted);
      } else if (selectedModule === 'Customer payments') {
        await loadPayments(1, paymentQueryCommitted);
      } else if (selectedModule === 'Payment vouchers') {
        await loadPaymentVouchers(1, paymentVoucherQueryCommitted);
      } else if (selectedModule === 'Supplier invoices') {
        await loadSupplierInvoices(1, supplierInvoiceQueryCommitted);
      } else if (selectedModule === 'Employees') {
        await loadEmployees(1, employeeQueryCommitted);
      } else if (selectedModule === 'Leave balances') {
        await loadLeaveBalances(1, leaveBalanceQueryCommitted);
      } else if (isHrCatalogRoute(selectedModule)) {
        await loadHrCatalogList(selectedModule, 1, hrCatalog[selectedModule].queryCommitted);
      } else if (selectedModule === 'Customers') {
        await loadCrmCustomers(1);
      } else if (selectedModule === 'Contracts') {
        await loadCrmContracts(1);
      } else if (selectedModule === 'Quotations') {
        await loadCrmQuotations(1, crmQuotationStatus);
      } else if (selectedModule === 'Attendance') {
        await loadAttendance();
      } else if (selectedModule === 'Front desk') {
        await loadHospitalityFrontDesk();
      } else if (selectedModule === 'Housekeeping') {
        await loadHospitalityHousekeeping();
      } else if (selectedModule === 'Reservations') {
        await loadHospitalityReservations(1, hospitalityReservationQueryCommitted);
      } else if (selectedModule === 'Guests') {
        await loadHospitalityGuests(1, hospitalityGuestQueryCommitted);
      } else if (selectedModule === 'Folios & billing') {
        await loadHospitalityFolios(1, hospitalityFolioQueryCommitted);
      } else if (selectedModule === 'Hospitality overview') {
        await loadHospitalityOverview();
      } else if (selectedModule === 'Rate catalog') {
        await loadHospitalityRateCatalog(1);
      } else if (selectedModule === 'Rooms & inventory') {
        await loadHospitalityRoomsInventory();
      } else if (selectedModule === 'Hospitality reports') {
        await loadHospitalityReports();
      } else if (selectedModule === 'Channel manager') {
        await loadHospitalityChannelManager();
      } else if (selectedModule === 'Reservation sales') {
        await loadHospitalityReservationSales(1, hospitalitySalesQueryCommitted);
      } else if (selectedModule === 'Support') {
        await loadSupportTickets();
      } else if (selectedModule === 'Part catalog') {
        await fetchPartsCatalog(1, partQueryCommitted);
      } else if (selectedModule === 'Suppliers') {
        await loadSuppliers(1, supplierQueryCommitted);
      } else if (selectedModule === 'Units') {
        await loadUnits(1, unitQueryCommitted);
      } else if (selectedModule === 'Categories') {
        await loadCategories(1, categoryQueryCommitted);
      } else if (selectedModule === 'Banks') {
        await loadBanks(1, bankMasterQueryCommitted);
      } else if (selectedModule === 'Bank branches') {
        await loadBankBranches(1, bankBranchQueryCommitted);
      } else if (selectedModule === 'Mobile operators') {
        await loadMobileOperators(1, mobileOperatorQueryCommitted);
      } else if (selectedModule === 'Stock by store') {
        if (stockStoreId) {
          await fetchStockLines(1, stockStoreId, stockLineQueryCommitted);
        } else {
          await loadStockStores();
        }
      } else if (isLogisticsModule(selectedModule)) {
        const path = logisticsPathFor(selectedModule, storeMovementKind);
        if (path) {
          await fetchLogisticsDocuments(1, path, logisticsQueryCommitted);
        }
      }
    } finally {
      setRefreshing(false);
    }
  };

  const dashboardSummaryTiles = useMemo(() => {
    const fmtMoney = (n: number) =>
      `TZS ${n.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtCount = (n: number | null | undefined) => (n === null || n === undefined ? '—' : String(n));
    const s = mobileSummary;
    const financeVisible = s?.revenue_by_month != null;
    return [
      { title: 'Unread notifications', value: fmtCount(s?.unread_notifications) },
      { title: 'Pending approvals', value: fmtCount(s?.pending_approvals) },
      { title: 'My open requisitions', value: fmtCount(s?.my_requisitions_open) },
      { title: 'Leave in progress', value: fmtCount(s?.pending_leave_requests) },
      {
        title: 'Latest net pay',
        value: s?.latest_payslip_net != null ? fmtMoney(s.latest_payslip_net) : '—',
      },
      {
        title: 'Last payslip period',
        value: s?.latest_payslip_period_end?.trim() ? s.latest_payslip_period_end : '—',
      },
      { title: 'Open support tickets', value: fmtCount(s?.open_support_tickets) },
      ...(financeVisible
        ? [
            { title: 'Revenue (this month)', value: s?.revenue_this_month != null ? fmtMoney(s.revenue_this_month) : '—' },
            { title: 'Revenue trend vs last month', value: s?.revenue_trend_pct != null ? `${s.revenue_trend_pct}%` : '—' },
            { title: 'Invoices awaiting approval', value: fmtCount(s?.invoices_pending_approval) },
            { title: 'Overdue invoices (approved)', value: fmtCount(s?.invoices_overdue) },
          ]
        : []),
    ];
  }, [mobileSummary]);

  return {
    token,
    user,
    portal,
    activeTab,
    selectedModule,
    loading,
    onSetTab,
    onRefreshProfile,
    onLogout,
    onOpenAction,
    appBaseUrl,
    approvalDetail,
    approvalHasMore,
    approvalItems,
    approvalListTotal,
    approvalSummary,
    approvalNotes,
    approvalPage,
    approvalsUpdatedAt,
    attendanceFrom,
    attendanceItems,
    attendanceUpdatedAt,
    hospitalityFrontDesk,
    hospitalityFrontDeskUpdatedAt,
    hospitalityHousekeeping,
    hospitalityHousekeepingUpdatedAt,
    hospitalityReservationItems,
    hospitalityReservationPage,
    hospitalityReservationHasMore,
    hospitalityReservationsUpdatedAt,
    hospitalityReservationSearchInput,
    hospitalityReservationQueryCommitted,
    hospitalityReservationDetail,
    hospitalityGuestItems,
    hospitalityGuestPage,
    hospitalityGuestHasMore,
    hospitalityGuestsUpdatedAt,
    hospitalityGuestSearchInput,
    hospitalityGuestQueryCommitted,
    hospitalityGuestDetail,
    hospitalityFolioItems,
    hospitalityFolioPage,
    hospitalityFolioHasMore,
    hospitalityFoliosUpdatedAt,
    hospitalityFolioSearchInput,
    hospitalityFolioQueryCommitted,
    hospitalityFolioDetail,
    hospitalityDetailLoading,
    hospitalityDetailError,
    hospitalityOverview,
    hospitalityOverviewUpdatedAt,
    hospitalityRateCatalog,
    hospitalityRateCatalogPage,
    hospitalityRateCatalogHasMore,
    hospitalityRateCatalogUpdatedAt,
    hospitalityRoomsInventory,
    hospitalityRoomsInventoryUpdatedAt,
    hospitalityReports,
    hospitalityReportsUpdatedAt,
    hospitalityChannelManager,
    hospitalityChannelManagerUpdatedAt,
    hospitalitySalesItems,
    hospitalitySalesPage,
    hospitalitySalesHasMore,
    hospitalitySalesUpdatedAt,
    hospitalitySalesSearchInput,
    hospitalitySalesQueryCommitted,
    hospitalitySalesKind,
    bankBranchDetail,
    bankBranchHasMore,
    bankBranchItems,
    bankBranchPage,
    bankBranchQueryCommitted,
    bankBranchSearchInput,
    bankBranchesUpdatedAt,
    bankMasterDetail,
    bankMasterHasMore,
    bankMasterItems,
    bankMasterPage,
    bankMasterQueryCommitted,
    bankMasterSearchInput,
    banksUpdatedAt,
    cancelOpenedSupportTicket,
    canCreateDeliveryNote,
    canCreateKitchenToStoreMovement,
    canCreateStoreToKitchenMovement,
    canCreatePoReceipt,
    canUpdatePoReceipt,
    canCreateNonPoReceipt,
    canUpdateNonPoReceipt,
    canCreateSupplierReturn,
    canCreatePickTicket,
    canCreateSupplier,
    canUpdateSupplier,
    canCreateUnit,
    canUpdateUnit,
    canCreateCategory,
    canUpdateCategory,
    canCreatePart,
    canUpdatePart,
    operationalInterStoreIssues,
    operationalInterStoreReceipts,
    canViewMobilePurchaseOrders,
    canViewMobileRequisitions,
    categoriesUpdatedAt,
    categoryDetail,
    categoryHasMore,
    categoryItems,
    categoryPage,
    categoryQueryCommitted,
    categorySearchInput,
    mobileOperatorDetail,
    mobileOperatorHasMore,
    mobileOperatorItems,
    mobileOperatorPage,
    mobileOperatorQueryCommitted,
    mobileOperatorSearchInput,
    mobileOperatorsUpdatedAt,
    unitDetail,
    unitHasMore,
    unitItems,
    unitPage,
    unitQueryCommitted,
    unitSearchInput,
    unitsUpdatedAt,
    crmContractDetail,
    crmContractHasMore,
    crmContractItems,
    crmContractPage,
    crmContractsUpdatedAt,
    crmCustomerDetail,
    crmCustomerHasMore,
    crmCustomerItems,
    crmCustomerPage,
    crmCustomersUpdatedAt,
    crmQuotationDetail,
    crmQuotationHasMore,
    crmQuotationItems,
    crmQuotationPage,
    crmQuotationsUpdatedAt,
    crmQuotationStatus,
    dashboardSummaryTiles,
    fetchLogisticsDetail,
    fetchLogisticsDocuments,
    fetchPartDetail,
    fetchPartsCatalog,
    fetchStockLines,
    formatNow,
    insets,
    leaveDetail,
    leaveEnd,
    leaveHasMore,
    leaveNotes,
    leavePage,
    leaveRequests,
    leaveStart,
    leaveTypeId,
    leaveTypes,
    leaveUpdatedAt,
    loadApprovalDetail,
    loadApprovals,
    loadApprovalSummary,
    loadAttendance,
    loadHospitalityFrontDesk,
    loadHospitalityHousekeeping,
    loadHospitalityReservations,
    loadHospitalityReservationDetail,
    loadHospitalityGuests,
    loadHospitalityGuestDetail,
    loadHospitalityFolios,
    loadHospitalityFolioDetail,
    addHospitalityFolioPayment,
    addHospitalityFolioCharge,
    loadHospitalityOverview,
    loadHospitalityRateCatalog,
    loadHospitalityRoomsInventory,
    loadHospitalityReports,
    loadHospitalityChannelManager,
    loadHospitalityReservationSales,
    loadCrmContractDetail,
    loadCrmContracts,
    loadCrmCustomerDetail,
    loadCrmCustomers,
    loadCrmQuotationDetail,
    loadCrmQuotations,
    loadLeaveRequestDetail,
    loadLeaveRequests,
    loadMobileSummary,
    loadMobileOperatorDetail,
    loadMobileOperators,
    loadNotifications,
    loadPayslipDetail,
    loadPayslips,
    loadBankBranchDetail,
    loadBankBranches,
    loadBankMasterDetail,
    loadBanks,
    loadCategories,
    loadCategoryDetail,
    loadPurchaseOrderDetail,
    loadPurchaseOrders,
    loadRequisitionDetail,
    loadRequisitions,
    loadStockStores,
    loadSupplierDetail,
    loadSuppliers,
    loadSupportDetail,
    loadSupportTickets,
    loadUnitDetail,
    loadUnits,
    logisticsDetail,
    logisticsDetailFetchSeqRef,
    logisticsHasMore,
    logisticsItems,
    logisticsListFetchSeqRef,
    logisticsPage,
    logisticsQueryCommitted,
    logisticsSearchInput,
    logisticsTotal,
    logisticsUpdatedAt,
    logoUri,
    markAllRead,
    markOneNotificationRead,
    menuItems,
    mobileSummary,
    mobileSummaryError,
    mobileSummaryUpdatedAt,
    moduleError,
    moduleLoading,
    navChips,
    notificationHasMore,
    notificationPage,
    notificationUnreadCount,
    notifications,
    notificationsShortcutVisible,
    notificationsUpdatedAt,
    onPullRefresh,
    openNotificationTarget,
    partCatalogFetchSeqRef,
    partDetail,
    partDetailFetchSeqRef,
    partHasMore,
    partItems,
    partListTotal,
    partPage,
    partQueryCommitted,
    partSearchInput,
    partsUpdatedAt,
    payrollError,
    payrollLoading,
    payslipDetail,
    payslipItems,
    payslipsUpdatedAt,
    purchaseOrderDetail,
    purchaseOrderHasMore,
    purchaseOrderItems,
    purchaseOrderPage,
    purchaseOrdersUpdatedAt,
    purchaseRfqDetail,
    purchaseRfqHasMore,
    purchaseRfqItems,
    purchaseRfqPage,
    purchaseRfqsUpdatedAt,
    canViewMobilePurchaseRfqs,
    canViewMobileSupplierQuotations,
    loadPurchaseRfqDetail,
    loadPurchaseRfqs,
    loadSupplierQuotationDetail,
    loadSupplierQuotations,
    supplierQuotationDetail,
    supplierQuotationHasMore,
    supplierQuotationItems,
    supplierQuotationPage,
    supplierQuotationsUpdatedAt,
    setPurchaseRfqDetail,
    setSupplierQuotationDetail,
    prevSelectedModuleRef,
    quickActionItems,
    refreshing,
    requisitionDetail,
    requisitionHasMore,
    requisitionItems,
    requisitionPage,
    requisitionsUpdatedAt,
    resolveNotificationTarget,
    setApprovalDetail,
    setApprovalHasMore,
    setApprovalItems,
    setApprovalNotes,
    setApprovalPage,
    setApprovalStatus,
    setApprovalsUpdatedAt,
    setAttendanceFrom,
    setAttendanceItems,
    setAttendanceUpdatedAt,
    setHospitalityReservationItems,
    setHospitalityReservationPage,
    setHospitalityReservationHasMore,
    setHospitalityReservationsUpdatedAt,
    setHospitalityReservationSearchInput,
    setHospitalityReservationQueryCommitted,
    setHospitalityReservationDetail,
    setHospitalityGuestItems,
    setHospitalityGuestPage,
    setHospitalityGuestHasMore,
    setHospitalityGuestsUpdatedAt,
    setHospitalityGuestSearchInput,
    setHospitalityGuestQueryCommitted,
    setHospitalityGuestDetail,
    setHospitalityFolioItems,
    setHospitalityFolioPage,
    setHospitalityFolioHasMore,
    setHospitalityFoliosUpdatedAt,
    setHospitalityFolioSearchInput,
    setHospitalityFolioQueryCommitted,
    setHospitalityFolioDetail,
    setHospitalitySalesSearchInput,
    setHospitalitySalesKind,
    setBankBranchDetail,
    setBankBranchHasMore,
    setBankBranchItems,
    setBankBranchPage,
    setBankBranchQueryCommitted,
    setBankBranchSearchInput,
    setBankBranchesUpdatedAt,
    setBankMasterDetail,
    setBankMasterHasMore,
    setBankMasterItems,
    setBankMasterPage,
    setBankMasterQueryCommitted,
    setBankMasterSearchInput,
    setBanksUpdatedAt,
    setCategoriesUpdatedAt,
    setCategoryDetail,
    setCategoryHasMore,
    setCategoryItems,
    setCategoryPage,
    setCategoryQueryCommitted,
    setCategorySearchInput,
    setCrmContractDetail,
    setCrmContractHasMore,
    setCrmContractItems,
    setCrmContractPage,
    setCrmContractsUpdatedAt,
    setCrmCustomerDetail,
    setCrmCustomerHasMore,
    setCrmCustomerItems,
    setCrmCustomerPage,
    setCrmCustomersUpdatedAt,
    setCrmQuotationDetail,
    setCrmQuotationHasMore,
    setCrmQuotationItems,
    setCrmQuotationPage,
    setCrmQuotationsUpdatedAt,
    setCrmQuotationStatus,
    setLeaveDetail,
    setLeaveEnd,
    setLeaveHasMore,
    setLeaveNotes,
    setLeavePage,
    setLeaveRequests,
    setLeaveStart,
    setLeaveTypeId,
    setLeaveTypes,
    setLeaveUpdatedAt,
    setLogisticsDetail,
    setLogisticsHasMore,
    setLogisticsItems,
    setLogisticsPage,
    setLogisticsQueryCommitted,
    setLogisticsSearchInput,
    setLogisticsTotal,
    setLogisticsUpdatedAt,
    setMobileSummary,
    setMobileSummaryError,
    setMobileSummaryUpdatedAt,
    setMobileOperatorDetail,
    setMobileOperatorHasMore,
    setMobileOperatorItems,
    setMobileOperatorPage,
    setMobileOperatorQueryCommitted,
    setMobileOperatorSearchInput,
    setMobileOperatorsUpdatedAt,
    setModuleError,
    setModuleLoading,
    setNotificationHasMore,
    setNotificationPage,
    setNotificationUnreadCount,
    setNotifications,
    setNotificationsUpdatedAt,
    setPartDetail,
    setPartHasMore,
    setPartItems,
    setPartListTotal,
    setPartPage,
    setPartQueryCommitted,
    setPartSearchInput,
    setPartsUpdatedAt,
    setPayrollError,
    setPayrollLoading,
    setPayslipDetail,
    setPayslipItems,
    setPayslipsUpdatedAt,
    setRefreshing,
    setPurchaseOrderDetail,
    setPurchaseOrderHasMore,
    setPurchaseOrderItems,
    setPurchaseOrderPage,
    setPurchaseOrdersUpdatedAt,
    setRequisitionDetail,
    setRequisitionHasMore,
    setRequisitionItems,
    setRequisitionPage,
    setRequisitionsUpdatedAt,
    setShowSupportComposer,
    setSupplierDetail,
    setSupplierHasMore,
    setSupplierItems,
    setSupplierPage,
    setSupplierQueryCommitted,
    setSupplierSearchInput,
    setSuppliersUpdatedAt,
    setStockHasMore,
    setStockLineQueryCommitted,
    setStockLines,
    setStockLinesUpdatedAt,
    setStockPage,
    setStockSearchInput,
    setStockStoreId,
    setStockStores,
    setStockStoresUpdatedAt,
    setStoreMovementKind,
    setSummaryLoading,
    setSupportDetail,
    setSupportNewBody,
    setSupportNewCategory,
    setSupportNewSubject,
    setSupportReply,
    setSupportTickets,
    setSupportUpdatedAt,
    setUnitDetail,
    setUnitHasMore,
    setUnitItems,
    setUnitPage,
    setUnitQueryCommitted,
    setUnitSearchInput,
    setUnitsUpdatedAt,
    showSupportComposer,
    supplierDetail,
    supplierHasMore,
    supplierItems,
    supplierPage,
    supplierQueryCommitted,
    supplierSearchInput,
    suppliersUpdatedAt,
    stockHasMore,
    stockLineQueryCommitted,
    stockLines,
    stockLinesFetchSeqRef,
    stockLinesUpdatedAt,
    stockPage,
    stockSearchInput,
    stockStoreId,
    stockStores,
    stockStoresFetchSeqRef,
    stockStoresUpdatedAt,
    storeMovementKind,
    visibleStoreMovementKinds,
    submitLeaveRequest,
    submitNewSupportTicket,
    submitSupportReply,
    summaryLoading,
    supportDetail,
    supportNewBody,
    supportNewCategory,
    supportNewSubject,
    supportReply,
    supportTickets,
    supportUpdatedAt,

    // Finance lists/details
    customerInvoiceItems,
    customerInvoiceDetail,
    customerInvoicePage,
    customerInvoiceHasMore,
    customerInvoicesUpdatedAt,
    customerInvoiceSearchInput,
    customerInvoiceQueryCommitted,
    loadCustomerInvoices,
    loadCustomerInvoiceDetail,
    setCustomerInvoiceDetail,
    setCustomerInvoiceHasMore,
    setCustomerInvoiceItems,
    setCustomerInvoicePage,
    setCustomerInvoicesUpdatedAt,
    setCustomerInvoiceSearchInput,
    setCustomerInvoiceQueryCommitted,

    proformaInvoiceItems,
    proformaInvoiceDetail,
    proformaInvoicePage,
    proformaInvoiceHasMore,
    proformaInvoicesUpdatedAt,
    proformaInvoiceSearchInput,
    proformaInvoiceQueryCommitted,
    loadProformaInvoices,
    loadProformaInvoiceDetail,
    setProformaInvoiceDetail,
    setProformaInvoiceHasMore,
    setProformaInvoiceItems,
    setProformaInvoicePage,
    setProformaInvoicesUpdatedAt,
    setProformaInvoiceSearchInput,
    setProformaInvoiceQueryCommitted,

    paymentItems,
    paymentDetail,
    paymentPage,
    paymentHasMore,
    paymentsUpdatedAt,
    paymentSearchInput,
    paymentQueryCommitted,
    loadPayments,
    loadPaymentDetail,
    setPaymentDetail,
    setPaymentHasMore,
    setPaymentItems,
    setPaymentPage,
    setPaymentsUpdatedAt,
    setPaymentSearchInput,
    setPaymentQueryCommitted,

    paymentVoucherItems,
    paymentVoucherDetail,
    paymentVoucherPage,
    paymentVoucherHasMore,
    paymentVouchersUpdatedAt,
    paymentVoucherSearchInput,
    paymentVoucherQueryCommitted,
    loadPaymentVouchers,
    loadPaymentVoucherDetail,
    setPaymentVoucherDetail,
    setPaymentVoucherHasMore,
    setPaymentVoucherItems,
    setPaymentVoucherPage,
    setPaymentVouchersUpdatedAt,
    setPaymentVoucherSearchInput,
    setPaymentVoucherQueryCommitted,

    supplierInvoiceItems,
    supplierInvoiceDetail,
    supplierInvoicePage,
    supplierInvoiceHasMore,
    supplierInvoicesUpdatedAt,
    supplierInvoiceSearchInput,
    supplierInvoiceQueryCommitted,
    loadSupplierInvoices,
    loadSupplierInvoiceDetail,
    setSupplierInvoiceDetail,
    setSupplierInvoiceHasMore,
    setSupplierInvoiceItems,
    setSupplierInvoicePage,
    setSupplierInvoicesUpdatedAt,
    setSupplierInvoiceSearchInput,
    setSupplierInvoiceQueryCommitted,

    accountingListRoute,
    accountingListItems,
    accountingListPage,
    accountingListHasMore,
    accountingListUpdatedAt,
    accountingSearchInput,
    accountingQueryCommitted,
    loadAccountingModuleList,
    setAccountingSearchInput,

    // HR lists/details (Phase 1)
    employeeItems,
    employeeDetail,
    employeePage,
    employeeHasMore,
    employeesUpdatedAt,
    employeeSearchInput,
    employeeQueryCommitted,
    loadEmployees,
    loadEmployeeDetail,
    setEmployeeDetail,
    setEmployeeHasMore,
    setEmployeeItems,
    setEmployeePage,
    setEmployeesUpdatedAt,
    setEmployeeSearchInput,
    setEmployeeQueryCommitted,

    leaveBalanceItems,
    leaveBalanceDetail,
    leaveBalancePage,
    leaveBalanceHasMore,
    leaveBalancesUpdatedAt,
    leaveBalanceSearchInput,
    leaveBalanceQueryCommitted,
    loadLeaveBalances,
    loadLeaveBalanceDetail,
    setLeaveBalanceDetail,
    setLeaveBalanceHasMore,
    setLeaveBalanceItems,
    setLeaveBalancePage,
    setLeaveBalancesUpdatedAt,
    setLeaveBalanceSearchInput,
    setLeaveBalanceQueryCommitted,

    hrCatalog,
    loadHrCatalogList,
    loadHrCatalogDetail,
    setHrCatalogSearchInput,
    clearHrCatalogDetail,
    HR_CATALOG_ROUTES,

    loadModuleListForRoute,
  };
}

export type StaffPortalModel = ReturnType<typeof useStaffPortalModel>;
