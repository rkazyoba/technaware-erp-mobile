import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import type {
  AccountingListItem,
  LogisticsDocListItem,
  NotificationItem,
  PettyCashRequestListItem,
  StockReportLine,
  SupportTicketSummary,
} from '../api';
import { StaffFinanceListSection } from '../components/finance/StaffFinanceListSection';
import { Text } from '../components/AppTypography';
import { WebPortalSurfacePanel } from '../components/WebPortalSurfacePanel';
import { EmployeeProfileRequiredCard } from '../components/EmployeeProfileRequiredCard';
import { ModuleSearchToolbar } from '../components/ModuleSearchToolbar';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { canCrud } from '../utils/crudPermissions';
import {
  hrCatalogDetailKind,
  hrCatalogListLabel,
  hrCatalogListStatus,
  hrCatalogListSubtitle,
  hrCatalogSearchPlaceholder,
  isHrCatalogRoute,
} from '../hooks/hrCatalogPortal';
import { isLogisticsModule, logisticsPathFor } from '../hooks/useStaffPortalModel';
import { accountingDetailKindForModule, isAccountingApiListModule } from '../utils/accountingPortal';
import { moduleRequiresEmployeeProfile, userHasEmployeeProfile } from '../utils/employeeProfile';
import { moduleListHasItems } from '../utils/moduleListState';
import { isHospitalityNativeModule } from '../utils/hospitalityPortal';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';
import { webPathForPortalSurface } from '../utils/portalWebSurfaces';
import {
  isFinanceReportMobileModule,
  type FinanceReportMobileModule,
} from '../utils/financeReportPortal';
import { isOperationalReportMobileModule } from '../utils/operationalReportPortal';
import { OperationalReportsPanel } from './OperationalReportsPanel';
import { ReportWebExportPanel } from '../components/reports/ReportWebExportPanel';
import { reportWebPdfPath } from '../utils/reportWebPdfUrls';
import type { ModulesStackParamList, RecordDetailParams } from '../navigation/moduleStackTypes';
import { FinanceReportsPanel } from './FinanceReportsPanel';
import { styles } from '../styles/appStyles';

type Nav = NativeStackNavigationProp<ModulesStackParamList>;

type LogisticsStatusChip = 'All' | 'Approved' | 'Pending' | 'Draft' | 'Unfinished';

const LOGISTICS_STATUS_CHIPS: LogisticsStatusChip[] = ['All', 'Approved', 'Pending', 'Draft', 'Unfinished'];

const STORE_MOVEMENT_LABELS: Record<string, string> = {
  k2s: 'Kitchen → store',
  s2k: 'Store → kitchen',
  inter_rcpt: 'Inter-store receipt',
  inter_issue: 'Inter-store issue',
};

function logisticsMatchesStatusChip(item: LogisticsDocListItem, chip: LogisticsStatusChip): boolean {
  if (chip === 'All') {
    return true;
  }
  const label = (item.status_label ?? '').trim().toLowerCase();
  const st = String(item.status ?? '').trim();
  switch (chip) {
    case 'Approved':
      return label.includes('approved') || label.includes('completed') || label.includes('received') || st === '2' || st === '4';
    case 'Pending':
      return (
        label.includes('pending') ||
        label.includes('await') ||
        label.includes('submitted') ||
        label.includes('review') ||
        st === '1'
      );
    case 'Draft':
      return label.includes('draft') || st === '0';
    case 'Unfinished':
      return label.includes('unfinished') || label.includes('incomplete') || label.includes('open');
    default:
      return true;
  }
}

function ModuleListLoadingRow() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28 }}>
      <ActivityIndicator color={colors.accentTeal} />
      <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 10 }}>Loading records…</Text>
    </View>
  );
}

function hasListFirstUi(moduleRoute: string, portal: ReturnType<typeof useStaffPortal>['portal']): boolean {
  const trimmed = moduleRoute.trim();
  if (portal && portal.surfaces.length > 0 && !isPortalModuleRouteAccessible(portal, trimmed)) {
    return false;
  }
  if (isFinanceReportMobileModule(moduleRoute) || isOperationalReportMobileModule(moduleRoute)) {
    return true;
  }
  if (isAccountingApiListModule(moduleRoute)) {
    return true;
  }
  if (isHospitalityNativeModule(moduleRoute)) {
    return true;
  }
  if (webPathForPortalSurface(moduleRoute, portal)) {
    return true;
  }
  return (
    isLogisticsModule(moduleRoute) ||
    moduleRoute === 'Requisitions' ||
    moduleRoute === 'Purchase orders' ||
    moduleRoute === 'Purchase RFQs' ||
    moduleRoute === 'Supplier quotations' ||
    moduleRoute === 'Suppliers' ||
    moduleRoute === 'Customer invoices' ||
    moduleRoute === 'Proforma invoices' ||
    moduleRoute === 'Customer payments' ||
    moduleRoute === 'Payment vouchers' ||
    moduleRoute === 'Supplier invoices' ||
    moduleRoute === 'Units' ||
    moduleRoute === 'Categories' ||
    moduleRoute === 'Banks' ||
    moduleRoute === 'Bank branches' ||
    moduleRoute === 'Mobile operators' ||
    moduleRoute === 'Employees' ||
    moduleRoute === 'Leave balances' ||
    isHrCatalogRoute(moduleRoute) ||
    moduleRoute === 'Leave Requests' ||
    moduleRoute === 'Staff imprest' ||
    moduleRoute === 'Expense claims' ||
    moduleRoute === 'Imprest retirements' ||
    moduleRoute === 'Petty cash requests' ||
    moduleRoute === 'Notifications' ||
    moduleRoute === 'Support' ||
    moduleRoute === 'Customers' ||
    moduleRoute === 'Contracts' ||
    moduleRoute === 'Quotations' ||
    moduleRoute === 'Front desk' ||
    moduleRoute === 'Housekeeping' ||
    moduleRoute === 'Reservations' ||
    moduleRoute === 'Guests' ||
    moduleRoute === 'Folios & billing' ||
    moduleRoute === 'Part catalog' ||
    moduleRoute === 'Stock by store' ||
    moduleRoute === 'Attendance'
  );
}

export function ModuleListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'ModuleList'>>();
  const moduleRoute = route.params.moduleRoute;
  const financePnlSiteId = route.params.financePnlSiteId;
  const financePreset = route.params.financePreset;
  const sp = useStaffPortal();
  const canCreatePaymentVoucher = useMemo(() => canCrud(sp.portal, 'payment_vouchers', 'create'), [sp.portal]);
  const canCreatePettyCashRequest = canCreatePaymentVoucher;
  const {
    setPortalActiveTab,
    setPortalSelectedModule,
    selectedModule,
    refreshing,
    onPullRefresh,
    storeMovementKind,
    setStoreMovementKind,
    logisticsSearchInput,
    setLogisticsSearchInput,
    fetchLogisticsDocuments,
    logisticsItems,
    logisticsTotal,
    logisticsPage,
    logisticsHasMore,
    logisticsQueryCommitted,
    logisticsUpdatedAt,
    visibleStoreMovementKinds,
    canCreateDeliveryNote,
    canCreateKitchenToStoreMovement,
    canCreateStoreToKitchenMovement,
    canCreatePoReceipt,
    canCreateNonPoReceipt,
    canCreateSupplierReturn,
    canCreatePickTicket,
    canCreateSupplier,
    canUpdateSupplier,
    canCreateUnit,
    canUpdateUnit,
    canCreateCategory,
    canUpdateCategory,
    operationalInterStoreIssues,
    operationalInterStoreReceipts,
    moduleLoading,
    moduleError,
    requisitionItems,
    requisitionPage,
    requisitionHasMore,
    requisitionsUpdatedAt,
    loadRequisitions,
    canViewMobileRequisitions,
    canViewMobilePurchaseOrders,
    purchaseOrderItems,
    purchaseOrderPage,
    purchaseOrderHasMore,
    purchaseOrdersUpdatedAt,
    loadPurchaseOrders,
    purchaseRfqItems,
    purchaseRfqPage,
    purchaseRfqHasMore,
    purchaseRfqsUpdatedAt,
    loadPurchaseRfqs,
    canViewMobilePurchaseRfqs,
    supplierQuotationItems,
    supplierQuotationPage,
    supplierQuotationHasMore,
    supplierQuotationsUpdatedAt,
    loadSupplierQuotations,
    canViewMobileSupplierQuotations,

    // Finance (commercial)
    customerInvoiceItems,
    customerInvoicePage,
    customerInvoiceHasMore,
    customerInvoicesUpdatedAt,
    customerInvoiceSearchInput,
    setCustomerInvoiceSearchInput,
    customerInvoiceQueryCommitted,
    loadCustomerInvoices,

    proformaInvoiceItems,
    proformaInvoicePage,
    proformaInvoiceHasMore,
    proformaInvoicesUpdatedAt,
    proformaInvoiceSearchInput,
    setProformaInvoiceSearchInput,
    proformaInvoiceQueryCommitted,
    loadProformaInvoices,

    paymentItems,
    paymentPage,
    paymentHasMore,
    paymentsUpdatedAt,
    paymentSearchInput,
    setPaymentSearchInput,
    paymentQueryCommitted,
    loadPayments,

    paymentVoucherItems,
    paymentVoucherPage,
    paymentVoucherHasMore,
    paymentVouchersUpdatedAt,
    paymentVoucherSearchInput,
    setPaymentVoucherSearchInput,
    paymentVoucherQueryCommitted,
    loadPaymentVouchers,

    supplierInvoiceItems,
    supplierInvoicePage,
    supplierInvoiceHasMore,
    supplierInvoicesUpdatedAt,
    supplierInvoiceSearchInput,
    setSupplierInvoiceSearchInput,
    supplierInvoiceQueryCommitted,
    loadSupplierInvoices,

    accountingListUpdatedAt,
    accountingSearchInput,
    setAccountingSearchInput,
    accountingQueryCommitted,
    accountingListItems,
    accountingListPage,
    accountingListHasMore,
    loadAccountingModuleList,

    // HR (phase 1)
    employeeItems,
    employeePage,
    employeeHasMore,
    employeesUpdatedAt,
    employeeSearchInput,
    setEmployeeSearchInput,
    employeeQueryCommitted,
    loadEmployees,

    leaveBalanceItems,
    leaveBalancePage,
    leaveBalanceHasMore,
    leaveBalancesUpdatedAt,
    leaveBalanceSearchInput,
    setLeaveBalanceSearchInput,
    leaveBalanceQueryCommitted,
    loadLeaveBalances,

    hrCatalog,
    loadHrCatalogList,
    setHrCatalogSearchInput,

    leaveRequests,
    leavePage,
    leaveHasMore,
    leaveUpdatedAt,
    loadLeaveRequests,
    notifications,
    notificationPage,
    notificationHasMore,
    notificationsUpdatedAt,
    loadNotifications,
    supportTickets,
    supportUpdatedAt,
    loadSupportTickets,
    partItems,
    partPage,
    partHasMore,
    partsUpdatedAt,
    fetchPartsCatalog,
    partSearchInput,
    setPartSearchInput,
    partQueryCommitted,
    stockStores,
    stockStoresUpdatedAt,
    stockStoreId,
    setStockStoreId,
    stockLines,
    stockPage,
    stockHasMore,
    stockLinesUpdatedAt,
    fetchStockLines,
    loadStockStores,
    stockSearchInput,
    setStockSearchInput,
    stockLineQueryCommitted,
    setStockLines,
    attendanceItems,
    attendanceUpdatedAt,
    attendanceFrom,
    loadAttendance,
    hospitalityFrontDesk,
    hospitalityFrontDeskUpdatedAt,
    loadHospitalityFrontDesk,
    hospitalityHousekeeping,
    hospitalityHousekeepingUpdatedAt,
    loadHospitalityHousekeeping,
    hospitalityReservationItems,
    hospitalityReservationPage,
    hospitalityReservationHasMore,
    hospitalityReservationsUpdatedAt,
    hospitalityReservationSearchInput,
    setHospitalityReservationSearchInput,
    hospitalityReservationQueryCommitted,
    hospitalityReservationDetail,
    setHospitalityReservationDetail,
    loadHospitalityReservations,
    loadHospitalityReservationDetail,
    hospitalityGuestItems,
    hospitalityGuestPage,
    hospitalityGuestHasMore,
    hospitalityGuestsUpdatedAt,
    hospitalityGuestSearchInput,
    setHospitalityGuestSearchInput,
    hospitalityGuestQueryCommitted,
    hospitalityGuestDetail,
    setHospitalityGuestDetail,
    loadHospitalityGuests,
    loadHospitalityGuestDetail,
    hospitalityFolioItems,
    hospitalityFolioPage,
    hospitalityFolioHasMore,
    hospitalityFoliosUpdatedAt,
    hospitalityFolioSearchInput,
    setHospitalityFolioSearchInput,
    hospitalityFolioQueryCommitted,
    hospitalityFolioDetail,
    setHospitalityFolioDetail,
    loadHospitalityFolios,
    loadHospitalityFolioDetail,
    addHospitalityFolioPayment,
    addHospitalityFolioCharge,
    crmCustomerItems,
    crmCustomerPage,
    crmCustomerHasMore,
    crmCustomersUpdatedAt,
    loadCrmCustomers,
    crmContractItems,
    crmContractPage,
    crmContractHasMore,
    crmContractsUpdatedAt,
    loadCrmContracts,
    crmQuotationItems,
    crmQuotationPage,
    crmQuotationHasMore,
    crmQuotationsUpdatedAt,
    crmQuotationStatus,
    setCrmQuotationStatus,
    loadCrmQuotations,
    supplierItems,
    supplierPage,
    supplierHasMore,
    suppliersUpdatedAt,
    loadSuppliers,
    supplierSearchInput,
    setSupplierSearchInput,
    supplierQueryCommitted,
    unitItems,
    unitPage,
    unitHasMore,
    unitsUpdatedAt,
    loadUnits,
    unitSearchInput,
    setUnitSearchInput,
    unitQueryCommitted,
    categoryItems,
    categoryPage,
    categoryHasMore,
    categoriesUpdatedAt,
    loadCategories,
    categorySearchInput,
    setCategorySearchInput,
    categoryQueryCommitted,
    bankMasterItems,
    bankMasterPage,
    bankMasterHasMore,
    banksUpdatedAt,
    loadBanks,
    bankMasterSearchInput,
    setBankMasterSearchInput,
    bankMasterQueryCommitted,
    bankBranchItems,
    bankBranchPage,
    bankBranchHasMore,
    bankBranchesUpdatedAt,
    loadBankBranches,
    bankBranchSearchInput,
    setBankBranchSearchInput,
    bankBranchQueryCommitted,
    mobileOperatorItems,
    mobileOperatorPage,
    mobileOperatorHasMore,
    mobileOperatorsUpdatedAt,
    loadMobileOperators,
    mobileOperatorSearchInput,
    setMobileOperatorSearchInput,
    mobileOperatorQueryCommitted,
    loadModuleListForRoute,
    portal,
    user,
  } = sp;

  const essBlocked = moduleRequiresEmployeeProfile(moduleRoute) && !userHasEmployeeProfile(user);

  const moduleAccessGate = useMemo(() => portalModuleAccessGate(portal, moduleRoute.trim()), [portal, moduleRoute]);
  const [folioTxnAmount, setFolioTxnAmount] = useState('1');
  const [folioTxnDescription, setFolioTxnDescription] = useState('');

  const portalWebPath = useMemo(() => webPathForPortalSurface(moduleRoute, portal), [moduleRoute, portal]);
  const showPortalWebPanel =
    Boolean(portalWebPath) &&
    !isAccountingApiListModule(moduleRoute) &&
    !isFinanceReportMobileModule(moduleRoute) &&
    moduleRoute !== 'Stock by store' &&
    !isHospitalityNativeModule(moduleRoute);
  const portalSurfaceRow = useMemo(
    () => portal?.surfaces?.find((s) => s.visible && s.route === moduleRoute),
    [portal?.surfaces, moduleRoute],
  );

  const listLoading = moduleLoading && !moduleError && !moduleListHasItems(moduleRoute, sp);

  const loadModuleListRef = useRef(loadModuleListForRoute);
  loadModuleListRef.current = loadModuleListForRoute;

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule(moduleRoute);
    }, [moduleRoute, setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    if (moduleAccessGate !== 'allowed' || essBlocked) {
      return;
    }
    void loadModuleListRef.current(moduleRoute, 1, '');
  }, [moduleRoute, moduleAccessGate, essBlocked]);

  const [logisticsStatusChip, setLogisticsStatusChip] = useState<LogisticsStatusChip>('All');

  useEffect(() => {
    setLogisticsStatusChip('All');
  }, [moduleRoute, storeMovementKind]);

  const filteredLogisticsItems = useMemo(() => {
    if (!isLogisticsModule(moduleRoute)) {
      return [];
    }
    return logisticsItems.filter((row) => logisticsMatchesStatusChip(row, logisticsStatusChip));
  }, [logisticsItems, logisticsStatusChip, moduleRoute]);

  const selectedStoreName = useMemo(() => {
    if (!stockStoreId) return '';
    return stockStores.find((s) => s.id === stockStoreId)?.name ?? '';
  }, [stockStoreId, stockStores]);

  const openRecordDetail = (payload: RecordDetailParams) => {
    navigation.navigate('RecordDetail', payload);
  };

  const openLeaveRequestForm = () => {
    navigation.navigate('LeaveRequestForm');
  };

  const openPettyCashRequestForm = (requestType: 'imprest' | 'expense_claim' = 'imprest') => {
    navigation.navigate('PettyCashRequestForm', { requestType });
  };

  const openStaffFinanceDetail = (item: PettyCashRequestListItem) => {
    openRecordDetail({
      moduleRoute,
      detailKind: 'finance_petty_cash_request',
      recordId: item.id,
      titleHint: item.ref,
    });
  };

  const openPaymentVoucherForm = () => {
    navigation.navigate('PaymentVoucherForm');
  };

  const openFullWorkspace = () => {
    navigation.navigate('ModuleWorkspace', { moduleRoute });
  };

  const openNotification = (item: NotificationItem) => {
    openRecordDetail({
      moduleRoute: 'Notifications',
      detailKind: 'notification',
      recordId: item.id,
      titleHint: item.title,
      notificationPreview: {
        id: item.id,
        title: item.title,
        body: item.body,
        read: item.read,
        created_at: item.created_at ?? null,
        module: item.module,
      },
    });
  };

  const openSupportTicket = (item: SupportTicketSummary) => {
    openRecordDetail({
      moduleRoute: 'Support',
      detailKind: 'support',
      recordId: item.id,
      titleHint: item.ticket_number,
    });
  };

  const openPart = (id: string, code: string) => {
    openRecordDetail({
      moduleRoute: 'Part catalog',
      detailKind: 'part',
      recordId: id,
      titleHint: code,
    });
  };

  const openSupplier = (id: string, name: string) => {
    openRecordDetail({
      moduleRoute: 'Suppliers',
      detailKind: 'supplier',
      recordId: id,
      titleHint: name,
    });
  };

  const openStockLine = (line: StockReportLine) => {
    if (!stockStoreId) return;
    openRecordDetail({
      moduleRoute: 'Stock by store',
      detailKind: 'stock_line',
      recordId: line.id,
      titleHint: line.code,
      stockStoreId,
      stockStoreName: selectedStoreName,
      stockLine: {
        id: line.id,
        code: line.code,
        description: line.description,
        quantity: line.quantity,
        min_qty: line.min_qty,
        max_qty: line.max_qty,
        status: line.status,
        category: line.category,
        supplier: line.supplier,
        unit: line.unit,
      },
    });
  };

  const openAttendanceRow = (row: (typeof attendanceItems)[number]) => {
    openRecordDetail({
      moduleRoute: 'Attendance',
      detailKind: 'attendance',
      recordId: row.id,
      titleHint: row.date ?? row.id,
      attendancePreview: {
        id: row.id,
        date: row.date,
        check_in: row.check_in,
        check_out: row.check_out,
        hours_worked: row.hours_worked,
        overtime_hours: row.overtime_hours,
        status: row.status,
        source: row.source,
      },
    });
  };

  if (moduleAccessGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <ActivityIndicator color={colors.accentTeal} size="large" />
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 14, textAlign: 'center' }}>
          Loading module access…
        </Text>
      </View>
    );
  }

  if (moduleAccessGate === 'denied') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }} numberOfLines={1}>
            {moduleRoute}
          </Text>
        </View>
        <View style={{ padding: 20 }}>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
            This module is not enabled for your role in the mobile portal. Ask an administrator if you need it.
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginTop: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primaryNavy, alignItems: 'center' }}
          >
            <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!hasListFirstUi(moduleRoute, portal)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }} numberOfLines={1}>
            {moduleRoute}
          </Text>
        </View>
        <View style={{ padding: 20 }}>
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary }}>
            This module uses tables, filters, and actions that are not split into list/detail yet. Open the full workspace to use every feature.
          </Text>
          <Pressable
            onPress={openFullWorkspace}
            style={{ marginTop: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primaryNavy, alignItems: 'center' }}
          >
            <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Open full workspace</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }} numberOfLines={1}>
          {selectedModule}
        </Text>
        {!hasListFirstUi(moduleRoute, portal) ? (
          <Pressable onPress={openFullWorkspace} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Full</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'Delivery notes' && canCreateDeliveryNote ? (
          <Pressable
            onPress={() => navigation.navigate('DeliveryNoteHeader')}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Create</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'Store movements' && (canCreateKitchenToStoreMovement || canCreateStoreToKitchenMovement) ? (
          <Pressable
            onPress={() =>
              navigation.navigate('StoreMovementHeader', {
                initialKind:
                  storeMovementKind === 'k2s' && canCreateKitchenToStoreMovement
                    ? 'k2s'
                    : storeMovementKind === 's2k' && canCreateStoreToKitchenMovement
                      ? 's2k'
                      : undefined,
              })
            }
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Create</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'GRN (PO)' && canCreatePoReceipt ? (
          <Pressable onPress={() => navigation.navigate('PoGrnHeader')} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Create</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'Supplier returns' && canCreateSupplierReturn ? (
          <Pressable
            onPress={() => navigation.navigate('SupplierReturnHeader')}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ ...outfit('medium', 13), color: colors.accentTeal }}>+ New</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'Pick tickets' && canCreatePickTicket ? (
          <Pressable onPress={() => navigation.navigate('PickTicketHeader')} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ ...outfit('medium', 13), color: colors.accentTeal }}>+ New</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'Non-PO receipts' && canCreateNonPoReceipt ? (
          <Pressable onPress={() => navigation.navigate('NonPoGrnHeader')} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Create</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'Suppliers' && canCreateSupplier ? (
          <Pressable
            onPress={() => navigation.navigate('MasterCatalogEdit', { kind: 'supplier', moduleRoute: 'Suppliers' })}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Create</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'Units' && canCreateUnit ? (
          <Pressable
            onPress={() => navigation.navigate('MasterCatalogEdit', { kind: 'unit', moduleRoute: 'Units' })}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Create</Text>
          </Pressable>
        ) : null}
        {moduleRoute === 'Categories' && canCreateCategory ? (
          <Pressable
            onPress={() => navigation.navigate('MasterCatalogEdit', { kind: 'category', moduleRoute: 'Categories' })}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Create</Text>
          </Pressable>
        ) : null}
      </View>

      {isOperationalReportMobileModule(moduleRoute) ? (
        <OperationalReportsPanel moduleRoute={moduleRoute} />
      ) : isFinanceReportMobileModule(moduleRoute) ? (
        <FinanceReportsPanel
          moduleRoute={moduleRoute as FinanceReportMobileModule}
          webPath={portalWebPath}
          initialPnlSiteId={financePnlSiteId}
          initialPreset={financePreset}
          onNavigateToProfitAndLoss={(siteId, reportPreset) =>
            navigation.push('ModuleList', {
              moduleRoute: 'Report profit and loss',
              financePnlSiteId: siteId,
              financePreset: reportPreset,
            })
          }
          onOpenCustomerInvoice={(id, titleHint) =>
            navigation.navigate('RecordDetail', {
              moduleRoute: 'Customer invoices',
              detailKind: 'finance_customer_invoice',
              recordId: id,
              titleHint,
            })
          }
          onOpenJournalEntry={(id, titleHint) =>
            navigation.navigate('RecordDetail', {
              moduleRoute: 'Accounting journal entries',
              detailKind: 'accounting_journal_entry',
              recordId: id,
              titleHint,
            })
          }
        />
      ) : (
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.accentTeal} />} contentContainerStyle={{ paddingBottom: 120 }}>
        {showPortalWebPanel ? (
          <WebPortalSurfacePanel title={portalSurfaceRow?.label ?? moduleRoute} description={portalSurfaceRow?.description} webPath={portalWebPath!} />
        ) : (
          <>
        {listLoading ? <ModuleListLoadingRow /> : null}
        {isLogisticsModule(moduleRoute) ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {logisticsUpdatedAt ?? 'Not synced yet'}</Text>
            {moduleRoute === 'Delivery notes' && portal && !portal.has_wildcard && !canCreateDeliveryNote ? (
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4, marginBottom: 4 }}>
                View-only: your role can review delivery notes but not create them. Operational permission{' '}
                <Text style={{ ...outfit('medium', 12), color: colors.textSecondary }}>erp.user.delivery_notes</Text> is required to create documents (same as the web ERP).
              </Text>
            ) : null}
            {moduleRoute === 'Store movements' ? (
              visibleStoreMovementKinds.length === 0 ? (
                <View style={[styles.emptyStateCard, { marginTop: 8 }]}>
                  <Text style={styles.emptyStateTitle}>No movement lists for your role</Text>
                  <Text style={styles.emptyStateText}>
                    Native lists require operational or approval access aligned with each movement type (e.g. kitchen-to-store, inter-store). Ask your administrator if something is missing.
                  </Text>
                </View>
              ) : (
              <View style={styles.movementChipRow}>
                {visibleStoreMovementKinds.map((optId) => (
                  <Pressable
                    key={optId}
                    style={[styles.menuChip, storeMovementKind === optId ? styles.movementChipSelected : null]}
                    onPress={() => setStoreMovementKind(optId)}
                  >
                    <Text style={styles.menuChipText}>{STORE_MOVEMENT_LABELS[optId] ?? optId}</Text>
                  </Pressable>
                ))}
              </View>
              )
            ) : null}
            {moduleRoute === 'Store movements' && visibleStoreMovementKinds.length > 0 && storeMovementKind === 'inter_issue' && !operationalInterStoreIssues ? (
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 6 }}>
                Approval access: you can review inter-store issues here; creating new movements requires operational store-issue permission on the web ERP.
              </Text>
            ) : null}
            {moduleRoute === 'Store movements' && visibleStoreMovementKinds.length > 0 && storeMovementKind === 'inter_rcpt' && !operationalInterStoreReceipts ? (
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 6 }}>
                Approval access: you can review inter-store receipts here; receiving into stock operationally uses store-receipt permissions on the web ERP.
              </Text>
            ) : null}
            {moduleRoute === 'Store movements' && visibleStoreMovementKinds.length === 0 ? null : (
              <>
                <ModuleSearchToolbar
                  value={logisticsSearchInput}
                  onChangeText={setLogisticsSearchInput}
                  onSearch={() => {
                    const p = logisticsPathFor(moduleRoute, storeMovementKind);
                    if (p) void fetchLogisticsDocuments(1, p, logisticsSearchInput.trim());
                  }}
                  onClear={() => {
                    setLogisticsSearchInput('');
                    const p = logisticsPathFor(moduleRoute, storeMovementKind);
                    if (p) void fetchLogisticsDocuments(1, p, '');
                  }}
                  placeholder="Search ref or description"
                />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {LOGISTICS_STATUS_CHIPS.map((chip) => {
                const selected = logisticsStatusChip === chip;
                return (
                  <Pressable
                    key={chip}
                    onPress={() => setLogisticsStatusChip(chip)}
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: selected ? colors.primaryNavy : colors.surface,
                      borderWidth: 0.5,
                      borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('medium', 12), color: selected ? '#fff' : colors.textPrimary }}>{chip}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {moduleLoading && logisticsItems.length === 0 && !moduleError ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator color={colors.accentTeal} />
                <Text style={[styles.syncText, { marginTop: 10 }]}>Loading…</Text>
              </View>
            ) : null}
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load documents</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable
                  style={styles.loadMoreBar}
                  onPress={() => {
                    const p = logisticsPathFor(moduleRoute, storeMovementKind);
                    if (p) void fetchLogisticsDocuments(1, p, logisticsQueryCommitted);
                  }}
                >
                  <Text style={styles.loadMoreBarText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && logisticsItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No documents</Text>
                <Text style={styles.emptyStateText}>Try another search or confirm data in the web ERP.</Text>
              </View>
            ) : null}
            {!moduleError && logisticsItems.length > 0 && filteredLogisticsItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No matches on this page</Text>
                <Text style={styles.emptyStateText}>
                  No rows match “{logisticsStatusChip}” in the current results. Try All, load more, or adjust search.
                </Text>
              </View>
            ) : null}
            {logisticsItems.length > 0 && logisticsTotal > 0 ? (
              <Text style={styles.listMetaLine}>
                Loaded {logisticsItems.length} of {logisticsTotal} from server
                {logisticsStatusChip !== 'All'
                  ? ` · ${filteredLogisticsItems.length} match “${logisticsStatusChip}” on this page`
                  : ''}
              </Text>
            ) : null}
            {filteredLogisticsItems.length > 0 ? (
              <Text
                style={{
                  ...outfit('medium', 11),
                  color: colors.textMuted,
                  letterSpacing: 0.66,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  marginTop: 4,
                }}
              >
                {filteredLogisticsItems.length}{' '}
                {moduleRoute === 'Delivery notes'
                  ? 'delivery notes'
                  : moduleRoute === 'Store movements'
                    ? 'movements'
                    : 'documents'}
              </Text>
            ) : null}
            {filteredLogisticsItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() => {
                  const p = logisticsPathFor(moduleRoute, storeMovementKind);
                  if (!p) return;
                  if (moduleRoute === 'Delivery notes') {
                    navigation.navigate('DeliveryNoteLines', { deliveryNoteId: item.id });
                    return;
                  }
                  if (moduleRoute === 'Non-PO receipts') {
                    navigation.navigate('NonPoReceiptWorkspace', { receiptId: item.id });
                    return;
                  }
                  if (moduleRoute === 'GRN (PO)') {
                    navigation.navigate('PoReceiptWorkspace', { receiptId: item.id });
                    return;
                  }
                  if (moduleRoute === 'Supplier returns') {
                    navigation.navigate('SupplierReturnWorkspace', { supplierReturnId: item.id });
                    return;
                  }
                  if (moduleRoute === 'Pick tickets') {
                    navigation.navigate('PickTicketWorkspace', { pickTicketId: item.id });
                    return;
                  }
                  if (moduleRoute === 'Store movements') {
                    const docKind =
                      storeMovementKind === 'k2s' ? ('kitchen_to_store' as const) : ('store_to_kitchen' as const);
                    const ctxParts = (item.context ?? '').split('→').map((s) => s.trim());
                    const stockStoreName =
                      storeMovementKind === 'k2s' ? ctxParts[0] ?? '' : ctxParts[1] ?? ctxParts[0] ?? '';
                    navigation.navigate('StoreMovementLines', {
                      issueId: item.id,
                      docKind,
                      stockStoreName,
                      readOnly: item.status !== '0',
                      initialTab: 'overview',
                    });
                    return;
                  }
                  openRecordDetail({
                    moduleRoute,
                    detailKind: 'logistics',
                    recordId: item.id,
                    logisticsPath: p,
                    titleHint: item.ref,
                  });
                }}
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  <Text style={styles.approvalStatus}>{item.status_label}</Text>
                </View>
                <Text style={styles.approvalSubject}>{item.description || '—'}</Text>
                <Text style={styles.approvalOwner}>
                  {item.document_date ?? '—'}
                  {item.context ? ` · ${item.context}` : ''}
                </Text>
                <Text style={{ ...styles.meta, marginTop: 6 }}>Tap for details →</Text>
              </Pressable>
            ))}
            {logisticsHasMore ? (
              <Pressable
                style={styles.loadMoreBar}
                onPress={() => {
                  const p = logisticsPathFor(moduleRoute, storeMovementKind);
                  if (p) void fetchLogisticsDocuments(logisticsPage + 1, p, logisticsQueryCommitted);
                }}
              >
                <Text style={styles.loadMoreBarText}>Load more</Text>
              </Pressable>
            ) : null}
              </>
            )}
          </View>
        ) : null}

        {moduleRoute === 'Requisitions' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {requisitionsUpdatedAt ?? 'Not synced yet'}</Text>
            {!canViewMobileRequisitions ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Requisitions not available</Text>
                <Text style={styles.emptyStateText}>You do not have permission to view requisitions.</Text>
              </View>
            ) : null}
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load requisitions</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadRequisitions(1)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {canViewMobileRequisitions && !moduleError && !moduleLoading && requisitionItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No requisitions</Text>
                <Text style={styles.emptyStateText}>Create requisitions in the web ERP.</Text>
              </View>
            ) : null}
            {canViewMobileRequisitions
              ? requisitionItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.approvalCard}
                    onPress={() =>
                      openRecordDetail({
                        moduleRoute: 'Requisitions',
                        detailKind: 'requisition',
                        recordId: item.id,
                        titleHint: item.ref,
                      })
                    }
                  >
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.ref}</Text>
                      <Text style={styles.approvalStatus}>{item.status_label}</Text>
                    </View>
                    <Text style={styles.approvalSubject}>{item.description || '—'}</Text>
                    <Text style={styles.approvalOwner}>
                      {item.requested_date ?? '—'} · {item.site} / {item.store}
                    </Text>
                  </Pressable>
                ))
              : null}
            {canViewMobileRequisitions && requisitionHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadRequisitions(requisitionPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Purchase orders' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {purchaseOrdersUpdatedAt ?? 'Not synced yet'}</Text>
            {!canViewMobilePurchaseOrders ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Purchase orders not available</Text>
                <Text style={styles.emptyStateText}>You do not have permission to view purchase orders.</Text>
              </View>
            ) : null}
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load purchase orders</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadPurchaseOrders(1)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {canViewMobilePurchaseOrders && !moduleError && !moduleLoading && purchaseOrderItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No purchase orders</Text>
                <Text style={styles.emptyStateText}>Purchase orders you can access will appear here.</Text>
              </View>
            ) : null}
            {canViewMobilePurchaseOrders
              ? purchaseOrderItems.map((item) => {
                  const total = item.total_display ?? item.total_incl_vat;
                  const totalLabel =
                    total != null && !Number.isNaN(Number(total))
                      ? Number(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '—';
                  return (
                    <Pressable
                      key={item.id}
                      style={styles.approvalCard}
                      onPress={() =>
                        openRecordDetail({
                          moduleRoute: 'Purchase orders',
                          detailKind: 'purchase_order',
                          recordId: item.id,
                          titleHint: item.ref,
                        })
                      }
                    >
                      <View style={styles.approvalHeader}>
                        <Text style={styles.approvalId}>{item.ref}</Text>
                        <Text style={styles.approvalStatus}>{item.status_label}</Text>
                      </View>
                      <Text style={styles.approvalSubject} numberOfLines={2}>
                        {item.supplier_name || item.description || '—'}
                      </Text>
                      <Text style={styles.approvalOwner}>
                        {item.order_date ?? '—'}
                        {item.requisition_ref ? ` · Req ${item.requisition_ref}` : ''}
                      </Text>
                      <Text style={{ ...styles.meta, marginTop: 6 }}>Total (incl. VAT): {totalLabel}</Text>
                    </Pressable>
                  );
                })
              : null}
            {canViewMobilePurchaseOrders && purchaseOrderHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadPurchaseOrders(purchaseOrderPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Purchase RFQs' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {purchaseRfqsUpdatedAt ?? 'Not synced yet'}</Text>
            {!canViewMobilePurchaseRfqs ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Purchase RFQs not available</Text>
                <Text style={styles.emptyStateText}>You do not have permission to view requests for quotation.</Text>
              </View>
            ) : null}
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load purchase RFQs</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadPurchaseRfqs(1)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {canViewMobilePurchaseRfqs && !moduleError && !moduleLoading && purchaseRfqItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No purchase RFQs</Text>
                <Text style={styles.emptyStateText}>RFQs linked to requisitions you can access will appear here.</Text>
              </View>
            ) : null}
            {canViewMobilePurchaseRfqs
              ? purchaseRfqItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.approvalCard}
                    onPress={() =>
                      openRecordDetail({
                        moduleRoute: 'Purchase RFQs',
                        detailKind: 'purchase_rfq',
                        recordId: item.id,
                        titleHint: item.ref,
                      })
                    }
                  >
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.ref}</Text>
                      <Text style={styles.approvalStatus}>{item.status_label}</Text>
                    </View>
                    <Text style={styles.approvalSubject} numberOfLines={2}>
                      Req {item.requisition_ref || '—'} · {item.description || '—'}
                    </Text>
                    <Text style={styles.approvalOwner}>
                      {item.site || '—'}
                      {item.store ? ` · ${item.store}` : ''}
                      {item.quotation_count > 0 ? ` · ${item.quotation_count} quote(s)` : ''}
                    </Text>
                  </Pressable>
                ))
              : null}
            {canViewMobilePurchaseRfqs && purchaseRfqHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadPurchaseRfqs(purchaseRfqPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Supplier quotations' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {supplierQuotationsUpdatedAt ?? 'Not synced yet'}</Text>
            {!canViewMobileSupplierQuotations ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Supplier quotations not available</Text>
                <Text style={styles.emptyStateText}>You do not have permission to view supplier quotations.</Text>
              </View>
            ) : null}
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load supplier quotations</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadSupplierQuotations(1)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {canViewMobileSupplierQuotations && !moduleError && !moduleLoading && supplierQuotationItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No supplier quotations</Text>
                <Text style={styles.emptyStateText}>Quotations received against RFQs will appear here.</Text>
              </View>
            ) : null}
            {canViewMobileSupplierQuotations
              ? supplierQuotationItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.approvalCard}
                    onPress={() =>
                      openRecordDetail({
                        moduleRoute: 'Supplier quotations',
                        detailKind: 'supplier_quotation',
                        recordId: item.id,
                        titleHint: item.ref,
                      })
                    }
                  >
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{item.ref}</Text>
                      <Text style={styles.approvalStatus}>{item.status_label}</Text>
                    </View>
                    <Text style={styles.approvalSubject} numberOfLines={2}>
                      {item.supplier_name || '—'}
                    </Text>
                    <Text style={styles.approvalOwner}>
                      RFQ {item.rfq_no || '—'} · {item.quotation_date ?? '—'} · {item.total.toFixed(2)}
                    </Text>
                  </Pressable>
                ))
              : null}
            {canViewMobileSupplierQuotations && supplierQuotationHasMore ? (
              <Pressable
                style={styles.detailsButton}
                onPress={() => void loadSupplierQuotations(supplierQuotationPage + 1)}
              >
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Customer invoices' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {customerInvoicesUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={customerInvoiceSearchInput}
              onChangeText={setCustomerInvoiceSearchInput}
              onSearch={() => void loadCustomerInvoices(1, customerInvoiceSearchInput.trim())}
              onClear={() => {
                setCustomerInvoiceSearchInput('');
                void loadCustomerInvoices(1, '');
              }}
              placeholder="Search ref or description"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load customer invoices</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadCustomerInvoices(1, customerInvoiceQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && customerInvoiceItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No customer invoices</Text>
              </View>
            ) : null}
            {customerInvoiceItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Customer invoices',
                    detailKind: 'finance_customer_invoice',
                    recordId: item.id,
                    titleHint: item.ref,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  <Text style={styles.approvalStatus}>{item.status_label}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.customer_name || '—'}
                </Text>
                <Text style={styles.approvalOwner}>{item.invoice_date ?? '—'}</Text>
              </Pressable>
            ))}
            {customerInvoiceHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadCustomerInvoices(customerInvoicePage + 1, customerInvoiceQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Proforma invoices' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {proformaInvoicesUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={proformaInvoiceSearchInput}
              onChangeText={setProformaInvoiceSearchInput}
              onSearch={() => void loadProformaInvoices(1, proformaInvoiceSearchInput.trim())}
              onClear={() => {
                setProformaInvoiceSearchInput('');
                void loadProformaInvoices(1, '');
              }}
              placeholder="Search ref or description"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load proformas</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadProformaInvoices(1, proformaInvoiceQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && proformaInvoiceItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No proforma invoices</Text>
              </View>
            ) : null}
            {proformaInvoiceItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Proforma invoices',
                    detailKind: 'finance_proforma_invoice',
                    recordId: item.id,
                    titleHint: item.ref,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  <Text style={styles.approvalStatus}>{item.status_label}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.customer_name || '—'}
                </Text>
                <Text style={styles.approvalOwner}>{item.invoice_date ?? '—'}</Text>
              </Pressable>
            ))}
            {proformaInvoiceHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadProformaInvoices(proformaInvoicePage + 1, proformaInvoiceQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Customer payments' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {paymentsUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={paymentSearchInput}
              onChangeText={setPaymentSearchInput}
              onSearch={() => void loadPayments(1, paymentSearchInput.trim())}
              onClear={() => {
                setPaymentSearchInput('');
                void loadPayments(1, '');
              }}
              placeholder="Search ref or description"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load payments</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadPayments(1, paymentQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && paymentItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No customer payments</Text>
              </View>
            ) : null}
            {paymentItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Customer payments',
                    detailKind: 'finance_payment',
                    recordId: item.id,
                    titleHint: item.ref,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  <Text style={styles.approvalStatus}>{item.status_label}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.customer_name || '—'}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.paid_amount != null ? `Paid: ${Number(item.paid_amount).toFixed(2)}` : '—'}
                </Text>
              </Pressable>
            ))}
            {paymentHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadPayments(paymentPage + 1, paymentQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Payment vouchers' ? (
          <View style={styles.approvalsSection}>
            {canCreatePaymentVoucher ? (
              <Pressable style={styles.primaryAction} onPress={openPaymentVoucherForm}>
                <Text style={styles.primaryActionText}>New payment voucher</Text>
              </Pressable>
            ) : null}
            <Text style={styles.syncText}>Last updated: {paymentVouchersUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={paymentVoucherSearchInput}
              onChangeText={setPaymentVoucherSearchInput}
              onSearch={() => void loadPaymentVouchers(1, paymentVoucherSearchInput.trim())}
              onClear={() => {
                setPaymentVoucherSearchInput('');
                void loadPaymentVouchers(1, '');
              }}
              placeholder="Search voucher no or description"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load payment vouchers</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadPaymentVouchers(1, paymentVoucherQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && paymentVoucherItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No payment vouchers</Text>
              </View>
            ) : null}
            {paymentVoucherItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Payment vouchers',
                    detailKind: 'finance_payment_voucher',
                    recordId: item.id,
                    titleHint: item.ref,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  <Text style={styles.approvalStatus}>{item.status_label}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.description || '—'}
                </Text>
                <Text style={styles.approvalOwner}>{item.prepared_date ?? '—'}</Text>
              </Pressable>
            ))}
            {paymentVoucherHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadPaymentVouchers(paymentVoucherPage + 1, paymentVoucherQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Supplier invoices' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {supplierInvoicesUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={supplierInvoiceSearchInput}
              onChangeText={setSupplierInvoiceSearchInput}
              onSearch={() => void loadSupplierInvoices(1, supplierInvoiceSearchInput.trim())}
              onClear={() => {
                setSupplierInvoiceSearchInput('');
                void loadSupplierInvoices(1, '');
              }}
              placeholder="Search ref or supplier"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load supplier invoices</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadSupplierInvoices(1, supplierInvoiceQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && supplierInvoiceItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No supplier invoices</Text>
              </View>
            ) : null}
            {supplierInvoiceItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Supplier invoices',
                    detailKind: 'finance_supplier_invoice',
                    recordId: item.id,
                    titleHint: item.ref,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  <Text style={styles.approvalStatus}>{item.status_label}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.supplier_name || '—'}
                </Text>
                <Text style={styles.approvalOwner}>{item.invoice_date ?? '—'}</Text>
              </Pressable>
            ))}
            {supplierInvoiceHasMore ? (
              <Pressable
                style={styles.detailsButton}
                onPress={() => void loadSupplierInvoices(supplierInvoicePage + 1, supplierInvoiceQueryCommitted)}
              >
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {isAccountingApiListModule(moduleRoute) ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {accountingListUpdatedAt ?? 'Not synced yet'}</Text>
            {moduleRoute !== 'Accounting cash flow mapping' ? (
              <ModuleSearchToolbar
                value={accountingSearchInput}
                onChangeText={setAccountingSearchInput}
                onSearch={() => void loadAccountingModuleList(moduleRoute, 1, accountingSearchInput.trim())}
                onClear={() => {
                  setAccountingSearchInput('');
                  void loadAccountingModuleList(moduleRoute, 1, '');
                }}
                placeholder="Search ref or note"
              />
            ) : null}
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load records</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadAccountingModuleList(moduleRoute, 1, accountingQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && accountingListItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No records</Text>
              </View>
            ) : null}
            {accountingListItems.map((item: AccountingListItem) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute,
                    detailKind: accountingDetailKindForModule(moduleRoute),
                    recordId: moduleRoute === 'Accounting cash flow mapping' ? 'current' : item.id,
                    titleHint: item.ref,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  {item.meta?.trim() ? <Text style={styles.approvalStatus}>{item.meta}</Text> : null}
                </View>
                {item.subtitle?.trim() ? (
                  <Text style={styles.approvalSubject} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </Pressable>
            ))}
            {accountingListHasMore ? (
              <Pressable
                style={styles.detailsButton}
                onPress={() => void loadAccountingModuleList(moduleRoute, accountingListPage + 1, accountingQueryCommitted)}
              >
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Employees' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {employeesUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={employeeSearchInput}
              onChangeText={setEmployeeSearchInput}
              onSearch={() => void loadEmployees(1, employeeSearchInput.trim())}
              onClear={() => {
                setEmployeeSearchInput('');
                void loadEmployees(1, '');
              }}
              placeholder="Search employee code or name"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load employees</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadEmployees(1, employeeQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && employeeItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No employees</Text>
              </View>
            ) : null}
            {employeeItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Employees',
                    detailKind: 'hr_employee',
                    recordId: item.id,
                    titleHint: item.employee_code,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.employee_code || '—'}</Text>
                  <Text style={styles.approvalStatus}>{item.status || '—'}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.name || '—'}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.job_title || '—'}
                </Text>
              </Pressable>
            ))}
            {employeeHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadEmployees(employeePage + 1, employeeQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Leave balances' ? (
          <View style={styles.approvalsSection}>
            {essBlocked ? <EmployeeProfileRequiredCard title="Leave balances unavailable" /> : null}
            {!essBlocked ? (
            <>
            <Text style={styles.syncText}>Last updated: {leaveBalancesUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={leaveBalanceSearchInput}
              onChangeText={setLeaveBalanceSearchInput}
              onSearch={() => void loadLeaveBalances(1, leaveBalanceSearchInput.trim())}
              onClear={() => {
                setLeaveBalanceSearchInput('');
                void loadLeaveBalances(1, '');
              }}
              placeholder="Search leave type"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load leave balances</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadLeaveBalances(1, leaveBalanceQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && leaveBalanceItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No leave balances</Text>
              </View>
            ) : null}
            {leaveBalanceItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Leave balances',
                    detailKind: 'hr_leave_balance',
                    recordId: item.id,
                    titleHint: item.leave_type_name,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.leave_type_name}</Text>
                  <Text style={styles.approvalStatus}>{item.balance_days != null ? `${Number(item.balance_days).toFixed(1)} days` : '—'}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.cycle_start ?? '—'} to {item.cycle_end ?? '—'}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.entitled_days != null ? `Entitled: ${Number(item.entitled_days).toFixed(1)}` : '—'} ·{' '}
                  {item.taken_days != null ? `Taken: ${Number(item.taken_days).toFixed(1)}` : '—'}
                  {item.pending_days != null ? ` · Pending: ${Number(item.pending_days).toFixed(1)}` : ''}
                </Text>
              </Pressable>
            ))}
            {leaveBalanceHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadLeaveBalances(leaveBalancePage + 1, leaveBalanceQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
            </>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Staff imprest' ? (
          <StaffFinanceListSection
            moduleRoute={moduleRoute}
            filter={{ kind: 'imprest' }}
            navigation={navigation}
            canCreate={canCreatePettyCashRequest}
            onOpenDetail={openStaffFinanceDetail}
          />
        ) : null}

        {moduleRoute === 'Expense claims' ? (
          <StaffFinanceListSection
            moduleRoute={moduleRoute}
            filter={{ kind: 'expense_claim' }}
            navigation={navigation}
            canCreate={canCreatePettyCashRequest}
            onOpenDetail={openStaffFinanceDetail}
          />
        ) : null}

        {moduleRoute === 'Imprest retirements' ? (
          <View>
            <Text style={[styles.approvalType, { marginBottom: 8, paddingHorizontal: 4 }]}>Ready to retire</Text>
            <StaffFinanceListSection
              moduleRoute={moduleRoute}
              filter={{ kind: 'awaiting_retirement' }}
              navigation={navigation}
              canCreate={false}
              onOpenDetail={openStaffFinanceDetail}
            />
            <Text style={[styles.approvalType, { marginTop: 16, marginBottom: 8, paddingHorizontal: 4 }]}>
              Submitted retirements
            </Text>
            <StaffFinanceListSection
              moduleRoute={moduleRoute}
              filter={{ kind: 'imprest_retirement' }}
              navigation={navigation}
              canCreate={false}
              onOpenDetail={openStaffFinanceDetail}
            />
          </View>
        ) : null}

        {moduleRoute === 'Petty cash requests' ? (
          <View>
            {canCreatePettyCashRequest ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <Pressable style={[styles.primaryAction, { flex: 1 }]} onPress={() => openPettyCashRequestForm('imprest')}>
                  <Text style={styles.primaryActionText}>New imprest</Text>
                </Pressable>
                <Pressable
                  style={[styles.detailsButton, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
                  onPress={() => openPettyCashRequestForm('expense_claim')}
                >
                  <Text style={styles.detailsButtonText}>New expense claim</Text>
                </Pressable>
              </View>
            ) : null}
            <StaffFinanceListSection
              moduleRoute={moduleRoute}
              filter={{ kind: 'all' }}
              navigation={navigation}
              canCreate={false}
              onOpenDetail={openStaffFinanceDetail}
            />
          </View>
        ) : null}

        {moduleRoute === 'Leave Requests' ? (
          <View style={styles.approvalsSection}>
            {essBlocked ? <EmployeeProfileRequiredCard title="Leave requests unavailable" /> : null}
            {!essBlocked ? (
            <>
            <Pressable style={styles.primaryAction} onPress={openLeaveRequestForm}>
              <Text style={styles.primaryActionText}>New leave request</Text>
            </Pressable>
            <Text style={styles.syncText}>Last updated: {leaveUpdatedAt ?? 'Not synced yet'}</Text>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load leave requests</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadLeaveRequests(1)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && leaveRequests.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No leave requests yet</Text>
              </View>
            ) : null}
            {leaveRequests.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute,
                    detailKind: 'leave',
                    recordId: item.id,
                    titleHint: item.id,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.id}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalType}>{item.leave_type}</Text>
                <Text style={styles.approvalOwner}>
                  {item.date_start || '-'} to {item.date_end || '-'}
                  {item.days_requested ? ` (${item.days_requested} days)` : ''}
                </Text>
              </Pressable>
            ))}
            {leaveHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadLeaveRequests(leavePage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
            </>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Notifications' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {notificationsUpdatedAt ?? 'Not synced yet'}</Text>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load notifications</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadNotifications(1)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && notifications.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No notifications</Text>
              </View>
            ) : null}
            {notifications.map((item) => (
              <Pressable key={item.id} style={styles.approvalCard} onPress={() => openNotification(item)}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.read ? <Text style={styles.approvalStatus}>Unread</Text> : <Text style={styles.meta}>Read</Text>}
                </View>
                <Text style={styles.approvalOwner} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={{ ...styles.meta, marginTop: 6 }}>{item.created_at ?? ''}</Text>
              </Pressable>
            ))}
            {notificationHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadNotifications(notificationPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Support' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {supportUpdatedAt ?? 'Not synced yet'}</Text>
            <Pressable
              onPress={openFullWorkspace}
              style={{ marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 0.5, borderColor: colors.borderSubtle, backgroundColor: colors.surface }}
            >
              <Text style={{ ...outfit('medium', 13), color: colors.primaryNavy }}>Reply or create tickets (full workspace)</Text>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>Composer, replies, and cancel live in the classic panel.</Text>
            </Pressable>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load tickets</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadSupportTickets()}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && supportTickets.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No support tickets</Text>
              </View>
            ) : null}
            {supportTickets.map((item) => (
              <Pressable key={item.id} style={styles.approvalCard} onPress={() => openSupportTicket(item)}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ticket_number}</Text>
                  <Text style={styles.approvalStatus}>{item.status_label}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.subject}
                </Text>
                <Text style={styles.approvalOwner}>{item.category}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isHrCatalogRoute(moduleRoute) ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>
              Last updated: {hrCatalog[moduleRoute].updatedAt ?? 'Not synced yet'}
            </Text>
            <ModuleSearchToolbar
              value={hrCatalog[moduleRoute].searchInput}
              onChangeText={(value) => setHrCatalogSearchInput(moduleRoute, value)}
              onSearch={() => void loadHrCatalogList(moduleRoute, 1, hrCatalog[moduleRoute].searchInput.trim())}
              onClear={() => {
                setHrCatalogSearchInput(moduleRoute, '');
                void loadHrCatalogList(moduleRoute, 1, '');
              }}
              placeholder={hrCatalogSearchPlaceholder(moduleRoute)}
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load {moduleRoute.toLowerCase()}</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable
                  style={styles.detailsButton}
                  onPress={() => void loadHrCatalogList(moduleRoute, 1, hrCatalog[moduleRoute].queryCommitted)}
                >
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && hrCatalog[moduleRoute].items.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No records</Text>
              </View>
            ) : null}
            {hrCatalog[moduleRoute].items.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute,
                    detailKind: hrCatalogDetailKind(moduleRoute),
                    recordId: item.id,
                    titleHint: hrCatalogListLabel(item, moduleRoute),
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{hrCatalogListLabel(item, moduleRoute)}</Text>
                  <Text style={styles.approvalStatus}>{hrCatalogListStatus(item, moduleRoute)}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {hrCatalogListSubtitle(item, moduleRoute) || '—'}
                </Text>
              </Pressable>
            ))}
            {hrCatalog[moduleRoute].hasMore ? (
              <Pressable
                style={styles.detailsButton}
                onPress={() => void loadHrCatalogList(moduleRoute, hrCatalog[moduleRoute].page + 1)}
              >
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Customers' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {crmCustomersUpdatedAt ?? 'Not synced yet'}</Text>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load customers</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadCrmCustomers(1)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && crmCustomerItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No customers</Text>
              </View>
            ) : null}
            {crmCustomerItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Customers',
                    detailKind: 'crm_customer',
                    recordId: item.id,
                    titleHint: item.name || item.code,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.code || item.name}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.contact || '—'}
                  {item.phone ? ` · ${item.phone}` : ''}
                </Text>
              </Pressable>
            ))}
            {crmCustomerHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadCrmCustomers(crmCustomerPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Suppliers' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {suppliersUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={supplierSearchInput}
              onChangeText={setSupplierSearchInput}
              onSearch={() => void loadSuppliers(1, supplierSearchInput.trim())}
              onClear={() => {
                setSupplierSearchInput('');
                void loadSuppliers(1, '');
              }}
              placeholder="Search name, code, phone, or email"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load suppliers</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadSuppliers(1, supplierQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && supplierItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No suppliers</Text>
              </View>
            ) : null}
            {supplierItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() => openSupplier(item.id, item.name || item.code)}
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.code || item.name}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.phone || '—'}
                  {item.email ? ` · ${item.email}` : ''}
                </Text>
              </Pressable>
            ))}
            {supplierHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadSuppliers(supplierPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Units' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {unitsUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={unitSearchInput}
              onChangeText={setUnitSearchInput}
              onSearch={() => void loadUnits(1, unitSearchInput.trim())}
              onClear={() => {
                setUnitSearchInput('');
                void loadUnits(1, '');
              }}
              placeholder="Search UOM or description"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load units</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadUnits(1, unitQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && unitItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No units</Text>
              </View>
            ) : null}
            {unitItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Units',
                    detailKind: 'master_unit',
                    recordId: item.id,
                    titleHint: item.uom,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.uom}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.description || '—'}
                </Text>
              </Pressable>
            ))}
            {unitHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadUnits(unitPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Categories' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {categoriesUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={categorySearchInput}
              onChangeText={setCategorySearchInput}
              onSearch={() => void loadCategories(1, categorySearchInput.trim())}
              onClear={() => {
                setCategorySearchInput('');
                void loadCategories(1, '');
              }}
              placeholder="Search category name"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load categories</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadCategories(1, categoryQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && categoryItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No categories</Text>
              </View>
            ) : null}
            {categoryItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Categories',
                    detailKind: 'master_category',
                    recordId: item.id,
                    titleHint: item.name,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.name}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
              </Pressable>
            ))}
            {categoryHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadCategories(categoryPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Banks' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {banksUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={bankMasterSearchInput}
              onChangeText={setBankMasterSearchInput}
              onSearch={() => void loadBanks(1, bankMasterSearchInput.trim())}
              onClear={() => {
                setBankMasterSearchInput('');
                void loadBanks(1, '');
              }}
              placeholder="Search bank name or code"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load banks</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadBanks(1, bankMasterQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && bankMasterItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No banks</Text>
              </View>
            ) : null}
            {bankMasterItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Banks',
                    detailKind: 'master_bank',
                    recordId: item.id,
                    titleHint: item.bank_name,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.bank_code || item.bank_name}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.bank_name}
                </Text>
                <Text style={styles.approvalOwner}>SWIFT: {item.swift_code || '—'}</Text>
              </Pressable>
            ))}
            {bankMasterHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadBanks(bankMasterPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Bank branches' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {bankBranchesUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={bankBranchSearchInput}
              onChangeText={setBankBranchSearchInput}
              onSearch={() => void loadBankBranches(1, bankBranchSearchInput.trim())}
              onClear={() => {
                setBankBranchSearchInput('');
                void loadBankBranches(1, '');
              }}
              placeholder="Search branch or bank"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load bank branches</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadBankBranches(1, bankBranchQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && bankBranchItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No bank branches</Text>
              </View>
            ) : null}
            {bankBranchItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Bank branches',
                    detailKind: 'master_bank_branch',
                    recordId: item.id,
                    titleHint: item.branch_name,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.branch_code || item.branch_name}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.branch_name}
                </Text>
                <Text style={styles.approvalOwner}>{item.bank_label || '—'}</Text>
              </Pressable>
            ))}
            {bankBranchHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadBankBranches(bankBranchPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Mobile operators' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {mobileOperatorsUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={mobileOperatorSearchInput}
              onChangeText={setMobileOperatorSearchInput}
              onSearch={() => void loadMobileOperators(1, mobileOperatorSearchInput.trim())}
              onClear={() => {
                setMobileOperatorSearchInput('');
                void loadMobileOperators(1, '');
              }}
              placeholder="Search operator name or code"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load mobile operators</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadMobileOperators(1, mobileOperatorQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && mobileOperatorItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No mobile operators</Text>
              </View>
            ) : null}
            {mobileOperatorItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Mobile operators',
                    detailKind: 'master_mobile_operator',
                    recordId: item.id,
                    titleHint: item.name,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.code || item.name}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
            {mobileOperatorHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadMobileOperators(mobileOperatorPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Contracts' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {crmContractsUpdatedAt ?? 'Not synced yet'}</Text>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load contracts</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadCrmContracts(1)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && crmContractItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No contracts</Text>
              </View>
            ) : null}
            {crmContractItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Contracts',
                    detailKind: 'crm_contract',
                    recordId: item.id,
                    titleHint: item.ref,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.customer_name}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.contract_type} · {item.start_date ?? '—'} → {item.end_date ?? '—'}
                </Text>
              </Pressable>
            ))}
            {crmContractHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadCrmContracts(crmContractPage + 1)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Quotations' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {crmQuotationsUpdatedAt ?? 'Not synced yet'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {(['all', 'pending'] as const).map((chip) => {
                const selected = crmQuotationStatus === chip;
                return (
                  <Pressable
                    key={chip}
                    onPress={() => {
                      setCrmQuotationStatus(chip);
                      void loadCrmQuotations(1, chip);
                    }}
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: selected ? colors.primaryNavy : colors.surface,
                      borderWidth: 0.5,
                      borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('medium', 12), color: selected ? '#fff' : colors.textPrimary }}>
                      {chip === 'all' ? 'All' : 'Pending approval'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load quotations</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadCrmQuotations(1, crmQuotationStatus)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && crmQuotationItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No quotations</Text>
              </View>
            ) : null}
            {crmQuotationItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  openRecordDetail({
                    moduleRoute: 'Quotations',
                    detailKind: 'crm_quotation',
                    recordId: item.id,
                    titleHint: item.ref,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.ref}</Text>
                  <Text style={styles.approvalStatus}>{item.status_label}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.description || '—'}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.customer_name}
                  {item.quotation_date ? ` · ${item.quotation_date}` : ''}
                </Text>
              </Pressable>
            ))}
            {crmQuotationHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadCrmQuotations(crmQuotationPage + 1, crmQuotationStatus)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Part catalog' ? (
          <View style={styles.approvalsSection}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginBottom: 10 }}>
              Same data as the web catalog: search below, stock on hand per line, and open a part for category, supplier, unit, and stock by store.
            </Text>
            <Text style={styles.syncText}>Last updated: {partsUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={partSearchInput}
              onChangeText={setPartSearchInput}
              onSearch={() => void fetchPartsCatalog(1, partSearchInput.trim())}
              onClear={() => {
                setPartSearchInput('');
                void fetchPartsCatalog(1, '');
              }}
              placeholder="Search code or description"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load parts</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void fetchPartsCatalog(1, partQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && partItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No parts</Text>
              </View>
            ) : null}
            {partItems.map((item) => (
              <Pressable key={item.id} style={styles.approvalCard} onPress={() => openPart(item.id, item.code)}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.code}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.category} · {item.supplier} · SOH {item.stock_on_hand} {item.unit}
                </Text>
              </Pressable>
            ))}
            {partHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void fetchPartsCatalog(partPage + 1, partQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Stock by store' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Stores: {stockStoresUpdatedAt ?? 'Not synced yet'}</Text>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load stock</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadStockStores()}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!stockStoreId ? (
              <>
                {!moduleError && !moduleLoading && stockStores.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No stores</Text>
                  </View>
                ) : null}
                {stockStores.map((s) => (
                  <Pressable
                    key={s.id}
                    style={styles.approvalCard}
                    onPress={() => {
                      setStockStoreId(s.id);
                      void fetchStockLines(1, s.id, '');
                    }}
                  >
                    <Text style={styles.approvalSubject}>{s.name}</Text>
                    <Text style={styles.approvalOwner}>{s.site}</Text>
                  </Pressable>
                ))}
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    setStockStoreId(null);
                    setStockLines([]);
                  }}
                  style={{ marginBottom: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 0.5, borderColor: colors.primaryNavy }}
                >
                  <Text style={{ ...outfit('medium', 12), color: colors.primaryNavy }}>← Change store</Text>
                </Pressable>
                <ReportWebExportPanel
                  compact
                  webPath={portalWebPath ?? '/view/stock/report'}
                  pdfPathOrUrl={reportWebPdfPath('Stock by store', { storeId: stockStoreId }) ?? undefined}
                />
                <Text style={styles.syncText}>Lines: {stockLinesUpdatedAt ?? '—'}</Text>
                <ModuleSearchToolbar
                  value={stockSearchInput}
                  onChangeText={setStockSearchInput}
                  onSearch={() => {
                    if (stockStoreId) void fetchStockLines(1, stockStoreId, stockSearchInput.trim());
                  }}
                  onClear={() => {
                    setStockSearchInput('');
                    if (stockStoreId) void fetchStockLines(1, stockStoreId, '');
                  }}
                  placeholder="Search code or description"
                />
                {stockLines.map((line) => (
                  <Pressable key={line.id} style={styles.approvalCard} onPress={() => openStockLine(line)}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{line.code}</Text>
                      <Text style={styles.approvalStatus}>{line.quantity}</Text>
                    </View>
                    <Text style={styles.approvalSubject} numberOfLines={2}>
                      {line.description}
                    </Text>
                    <Text style={styles.approvalOwner}>
                      {line.category} · {line.status}
                    </Text>
                  </Pressable>
                ))}
                {stockHasMore && stockStoreId ? (
                  <Pressable style={styles.detailsButton} onPress={() => void fetchStockLines(stockPage + 1, stockStoreId, stockLineQueryCommitted)}>
                    <Text style={styles.detailsButtonText}>Load more</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {moduleRoute === 'Attendance' ? (
          <View style={styles.approvalsSection}>
            {essBlocked ? <EmployeeProfileRequiredCard title="Attendance unavailable" /> : null}
            {!essBlocked ? (
            <>
            <Text style={styles.syncText}>
              Last updated: {attendanceUpdatedAt ?? 'Not synced yet'}
              {attendanceFrom ? ` · From ${attendanceFrom}` : ''}
            </Text>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load attendance</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadAttendance()}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && attendanceItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No attendance rows</Text>
              </View>
            ) : null}
            {attendanceItems.map((row) => (
              <Pressable key={row.id} style={styles.approvalCard} onPress={() => openAttendanceRow(row)}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{row.date ?? '—'}</Text>
                  <Text style={styles.approvalStatus}>{row.status}</Text>
                </View>
                <Text style={styles.approvalOwner}>
                  In {row.check_in ?? '—'} · Out {row.check_out ?? '—'} · Hours {row.hours_worked ?? '—'}
                </Text>
              </Pressable>
            ))}
            </>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Front desk' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>
              Last updated: {hospitalityFrontDeskUpdatedAt ?? 'Not synced yet'}
              {hospitalityFrontDesk?.today ? ` · ${hospitalityFrontDesk.today}` : ''}
            </Text>
            {hospitalityFrontDesk?.properties?.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                <Pressable
                  onPress={() => void loadHospitalityFrontDesk(null)}
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: !hospitalityFrontDesk.selected_property_id ? colors.primaryNavy : colors.surface,
                    borderWidth: 0.5,
                    borderColor: !hospitalityFrontDesk.selected_property_id ? colors.primaryNavy : colors.borderSubtle,
                  }}
                >
                  <Text style={{ ...outfit('medium', 12), color: !hospitalityFrontDesk.selected_property_id ? '#fff' : colors.textPrimary }}>
                    All properties
                  </Text>
                </Pressable>
                {hospitalityFrontDesk.properties.map((p) => {
                  const selected = hospitalityFrontDesk.selected_property_id === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => void loadHospitalityFrontDesk(p.id)}
                      style={{
                        borderRadius: 20,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        backgroundColor: selected ? colors.primaryNavy : colors.surface,
                        borderWidth: 0.5,
                        borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                      }}
                    >
                      <Text style={{ ...outfit('medium', 12), color: selected ? '#fff' : colors.textPrimary }}>{p.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load front desk</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadHospitalityFrontDesk()}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && !hospitalityFrontDesk ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No front desk data</Text>
              </View>
            ) : null}
            {hospitalityFrontDesk ? (
              <>
                {([
                  ['Arrivals', hospitalityFrontDesk.arrivals],
                  ['Departures', hospitalityFrontDesk.departures],
                  ['In house', hospitalityFrontDesk.in_house],
                ] as const).map(([sectionTitle, rows]) => (
                  <View key={sectionTitle} style={{ marginTop: 8 }}>
                    <Text style={{ ...outfit('semibold', 13), color: colors.textPrimary, marginBottom: 8 }}>
                      {sectionTitle} ({rows.length})
                    </Text>
                    {rows.length === 0 ? (
                      <View style={styles.emptyStateCard}>
                        <Text style={styles.emptyStateTitle}>No {sectionTitle.toLowerCase()}</Text>
                      </View>
                    ) : (
                      rows.map((row) => (
                        <Pressable
                          key={`${sectionTitle}-${row.id}`}
                          style={styles.approvalCard}
                          onPress={() =>
                            navigation.navigate('HospitalityDetail', {
                              detailKind: 'reservation',
                              recordId: row.id,
                              titleHint: row.document_no ?? `Reservation #${row.id}`,
                            })
                          }
                        >
                          <View style={styles.approvalHeader}>
                            <Text style={styles.approvalId}>{row.document_no ?? `#${row.id}`}</Text>
                            <Text style={styles.approvalStatus}>{row.status}</Text>
                          </View>
                          <Text style={styles.approvalSubject} numberOfLines={2}>
                            {row.guest_name ?? 'Guest'}
                          </Text>
                          <Text style={styles.approvalOwner}>
                            {row.arrival_date ?? '—'} → {row.departure_date ?? '—'}
                            {row.room_number ? ` · Room ${row.room_number}` : ''}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                ))}
              </>
            ) : null}
          </View>
        ) : null}

        {moduleRoute === 'Housekeeping' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {hospitalityHousekeepingUpdatedAt ?? 'Not synced yet'}</Text>
            {hospitalityHousekeeping?.properties?.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                <Pressable
                  onPress={() => void loadHospitalityHousekeeping({ propertyId: null })}
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: !hospitalityHousekeeping.selected_property_id ? colors.primaryNavy : colors.surface,
                    borderWidth: 0.5,
                    borderColor: !hospitalityHousekeeping.selected_property_id ? colors.primaryNavy : colors.borderSubtle,
                  }}
                >
                  <Text style={{ ...outfit('medium', 12), color: !hospitalityHousekeeping.selected_property_id ? '#fff' : colors.textPrimary }}>
                    All properties
                  </Text>
                </Pressable>
                {hospitalityHousekeeping.properties.map((p) => {
                  const selected = hospitalityHousekeeping.selected_property_id === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => void loadHospitalityHousekeeping({ propertyId: p.id })}
                      style={{
                        borderRadius: 20,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        backgroundColor: selected ? colors.primaryNavy : colors.surface,
                        borderWidth: 0.5,
                        borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                      }}
                    >
                      <Text style={{ ...outfit('medium', 12), color: selected ? '#fff' : colors.textPrimary }}>{p.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load housekeeping</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadHospitalityHousekeeping()}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && !hospitalityHousekeeping ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No housekeeping data</Text>
              </View>
            ) : null}
            {hospitalityHousekeeping ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                  <Pressable
                    onPress={() => void loadHospitalityHousekeeping({ status: null })}
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: !hospitalityHousekeeping.status_filter ? colors.primaryNavy : colors.surface,
                      borderWidth: 0.5,
                      borderColor: !hospitalityHousekeeping.status_filter ? colors.primaryNavy : colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('medium', 12), color: !hospitalityHousekeeping.status_filter ? '#fff' : colors.textPrimary }}>
                      All statuses
                    </Text>
                  </Pressable>
                  {Object.entries(hospitalityHousekeeping.statuses).map(([statusKey, statusLabel]) => {
                    const selected = hospitalityHousekeeping.status_filter === statusKey;
                    const count = hospitalityHousekeeping.counts?.[statusKey] ?? 0;
                    return (
                      <Pressable
                        key={statusKey}
                        onPress={() => void loadHospitalityHousekeeping({ status: statusKey })}
                        style={{
                          borderRadius: 20,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          backgroundColor: selected ? colors.primaryNavy : colors.surface,
                          borderWidth: 0.5,
                          borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                        }}
                      >
                        <Text style={{ ...outfit('medium', 12), color: selected ? '#fff' : colors.textPrimary }}>
                          {statusLabel} ({count})
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {!moduleError && !moduleLoading && hospitalityHousekeeping.rooms.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>No rooms</Text>
                  </View>
                ) : null}
                {hospitalityHousekeeping.rooms.map((room) => (
                  <View key={room.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>Room {room.room_number}</Text>
                      <Text style={styles.approvalStatus}>{room.status}</Text>
                    </View>
                    <Text style={styles.approvalOwner}>
                      {room.room_class_name ?? '—'} · {room.property_name ?? '—'}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        ) : null}
        {moduleRoute === 'Reservations' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {hospitalityReservationsUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={hospitalityReservationSearchInput}
              onChangeText={setHospitalityReservationSearchInput}
              onSearch={() => void loadHospitalityReservations(1, hospitalityReservationSearchInput.trim())}
              onClear={() => {
                setHospitalityReservationSearchInput('');
                setHospitalityReservationDetail(null);
                void loadHospitalityReservations(1, '');
              }}
              placeholder="Search reservation no or guest"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load reservations</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadHospitalityReservations(1, hospitalityReservationQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && hospitalityReservationItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No reservations</Text>
              </View>
            ) : null}
            {hospitalityReservationItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  navigation.navigate('HospitalityDetail', {
                    detailKind: 'reservation',
                    recordId: item.id,
                    titleHint: item.document_no || `Reservation #${item.id}`,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.document_no || `#${item.id}`}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.guest_name ?? 'Guest'}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.property_name ?? '—'} · {item.arrival_date ?? '—'} → {item.departure_date ?? '—'}
                  {item.room_number ? ` · Room ${item.room_number}` : ''}
                </Text>
              </Pressable>
            ))}
            {hospitalityReservationHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadHospitalityReservations(hospitalityReservationPage + 1, hospitalityReservationQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
            {hospitalityReservationDetail ? (
              <View style={{ ...styles.emptyStateCard, marginTop: 10 }}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.emptyStateTitle}>Reservation detail</Text>
                  <Pressable onPress={() => setHospitalityReservationDetail(null)}>
                    <Text style={styles.detailsButtonText}>Close</Text>
                  </Pressable>
                </View>
                <Text style={styles.emptyStateText}>
                  {hospitalityReservationDetail.document_no} · {hospitalityReservationDetail.status}
                </Text>
                <Text style={styles.emptyStateText}>
                  Guest: {hospitalityReservationDetail.guest?.name ?? '—'} · Room: {hospitalityReservationDetail.room_number ?? '—'}
                </Text>
                <Text style={styles.emptyStateText}>
                  Stay: {hospitalityReservationDetail.arrival_date ?? '—'} → {hospitalityReservationDetail.departure_date ?? '—'}
                </Text>
                <Text style={styles.emptyStateText}>
                  Total: {hospitalityReservationDetail.total_amount} · Folio balance: {hospitalityReservationDetail.folio_balance}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {moduleRoute === 'Guests' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {hospitalityGuestsUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={hospitalityGuestSearchInput}
              onChangeText={setHospitalityGuestSearchInput}
              onSearch={() => void loadHospitalityGuests(1, hospitalityGuestSearchInput.trim())}
              onClear={() => {
                setHospitalityGuestSearchInput('');
                setHospitalityGuestDetail(null);
                void loadHospitalityGuests(1, '');
              }}
              placeholder="Search guest name, email, phone"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load guests</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadHospitalityGuests(1, hospitalityGuestQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && hospitalityGuestItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No guests</Text>
              </View>
            ) : null}
            {hospitalityGuestItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.approvalCard}
                onPress={() =>
                  navigation.navigate('HospitalityDetail', {
                    detailKind: 'guest',
                    recordId: item.id,
                    titleHint: item.name,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.name}</Text>
                  <Text style={styles.approvalStatus}>{item.status}</Text>
                </View>
                <Text style={styles.approvalOwner}>
                  {item.phone ?? '—'} · {item.email ?? '—'}
                </Text>
                <Text style={styles.approvalOwner}>{item.country ?? '—'}</Text>
              </Pressable>
            ))}
            {hospitalityGuestHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadHospitalityGuests(hospitalityGuestPage + 1, hospitalityGuestQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
            {hospitalityGuestDetail ? (
              <View style={{ ...styles.emptyStateCard, marginTop: 10 }}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.emptyStateTitle}>Guest detail</Text>
                  <Pressable onPress={() => setHospitalityGuestDetail(null)}>
                    <Text style={styles.detailsButtonText}>Close</Text>
                  </Pressable>
                </View>
                <Text style={styles.emptyStateText}>
                  {hospitalityGuestDetail.name} · {hospitalityGuestDetail.status}
                </Text>
                <Text style={styles.emptyStateText}>
                  {hospitalityGuestDetail.phone ?? '—'} · {hospitalityGuestDetail.email ?? '—'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {hospitalityGuestDetail.document_type ?? '—'}: {hospitalityGuestDetail.document_no ?? '—'}
                </Text>
                <Text style={styles.emptyStateText}>
                  Reservations: {hospitalityGuestDetail.reservations.length}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {moduleRoute === 'Folios & billing' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {hospitalityFoliosUpdatedAt ?? 'Not synced yet'}</Text>
            <ModuleSearchToolbar
              value={hospitalityFolioSearchInput}
              onChangeText={setHospitalityFolioSearchInput}
              onSearch={() => void loadHospitalityFolios(1, hospitalityFolioSearchInput.trim())}
              onClear={() => {
                setHospitalityFolioSearchInput('');
                setHospitalityFolioDetail(null);
                void loadHospitalityFolios(1, '');
              }}
              placeholder="Search reservation no or guest"
            />
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load folios</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void loadHospitalityFolios(1, hospitalityFolioQueryCommitted)}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!moduleError && !moduleLoading && hospitalityFolioItems.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No folios</Text>
              </View>
            ) : null}
            {hospitalityFolioItems.map((item) => (
              <Pressable
                key={item.reservation_id}
                style={styles.approvalCard}
                onPress={() =>
                  navigation.navigate('HospitalityDetail', {
                    detailKind: 'folio',
                    recordId: item.reservation_id,
                    titleHint: item.reservation_no || `Folio #${item.reservation_id}`,
                  })
                }
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{item.reservation_no || `#${item.reservation_id}`}</Text>
                  <Text style={styles.approvalStatus}>{item.folio_status}</Text>
                </View>
                <Text style={styles.approvalSubject} numberOfLines={2}>
                  {item.guest_name ?? 'Guest'}
                </Text>
                <Text style={styles.approvalOwner}>
                  {item.currency} {item.folio_balance} · {item.arrival_date ?? '—'} → {item.departure_date ?? '—'}
                </Text>
              </Pressable>
            ))}
            {hospitalityFolioHasMore ? (
              <Pressable style={styles.detailsButton} onPress={() => void loadHospitalityFolios(hospitalityFolioPage + 1, hospitalityFolioQueryCommitted)}>
                <Text style={styles.detailsButtonText}>Load more</Text>
              </Pressable>
            ) : null}
            {hospitalityFolioDetail ? (
              <View style={{ ...styles.emptyStateCard, marginTop: 10 }}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.emptyStateTitle}>Folio detail</Text>
                  <Pressable onPress={() => setHospitalityFolioDetail(null)}>
                    <Text style={styles.detailsButtonText}>Close</Text>
                  </Pressable>
                </View>
                <Text style={styles.emptyStateText}>
                  {hospitalityFolioDetail.reservation_no} · {hospitalityFolioDetail.folio_status}
                </Text>
                <Text style={styles.emptyStateText}>
                  Guest: {hospitalityFolioDetail.guest_name ?? '—'} · Balance: {hospitalityFolioDetail.currency} {hospitalityFolioDetail.folio_balance}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TextInput
                    value={folioTxnAmount}
                    onChangeText={setFolioTxnAmount}
                    keyboardType="numeric"
                    placeholder="Amount"
                    style={{
                      flex: 1,
                      borderWidth: 0.5,
                      borderColor: colors.borderSubtle,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                    }}
                  />
                  <TextInput
                    value={folioTxnDescription}
                    onChangeText={setFolioTxnDescription}
                    placeholder="Description"
                    style={{
                      flex: 2,
                      borderWidth: 0.5,
                      borderColor: colors.borderSubtle,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                    }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Pressable
                    style={styles.detailsButton}
                    onPress={() =>
                      void addHospitalityFolioPayment(
                        hospitalityFolioDetail.reservation_id,
                        Number.parseFloat(folioTxnAmount) || 0,
                        folioTxnDescription || 'Mobile payment',
                      )
                    }
                  >
                    <Text style={styles.detailsButtonText}>Add payment</Text>
                  </Pressable>
                  <Pressable
                    style={styles.detailsButton}
                    onPress={() =>
                      void addHospitalityFolioCharge(
                        hospitalityFolioDetail.reservation_id,
                        Number.parseFloat(folioTxnAmount) || 0,
                        folioTxnDescription || 'Mobile charge',
                      )
                    }
                  >
                    <Text style={styles.detailsButtonText}>Add charge</Text>
                  </Pressable>
                </View>
                {hospitalityFolioDetail.lines.map((line) => (
                  <View key={line.id} style={{ ...styles.approvalCard, marginTop: 8 }}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{line.posting_date ?? '—'}</Text>
                      <Text style={styles.approvalStatus}>{line.line_type}</Text>
                    </View>
                    <Text style={styles.approvalSubject}>{line.description}</Text>
                    <Text style={styles.approvalOwner}>
                      {line.currency} {line.amount}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
        {moduleRoute === 'Hospitality overview' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {sp.hospitalityOverviewUpdatedAt ?? 'Not synced yet'}</Text>
            {moduleError ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Could not load overview</Text>
                <Text style={styles.emptyStateText}>{moduleError}</Text>
                <Pressable style={styles.detailsButton} onPress={() => void sp.loadHospitalityOverview()}>
                  <Text style={styles.detailsButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {sp.hospitalityOverview ? (
              <>
                <View style={styles.approvalCard}>
                  <Text style={styles.approvalSubject}>Properties: {sp.hospitalityOverview.stats.properties}</Text>
                  <Text style={styles.approvalOwner}>Arrivals today: {sp.hospitalityOverview.stats.arrivals_today}</Text>
                  <Text style={styles.approvalOwner}>In house: {sp.hospitalityOverview.stats.in_house}</Text>
                </View>
                {sp.hospitalityOverview.properties.map((p) => (
                  <View key={p.id} style={styles.approvalCard}>
                    <View style={styles.approvalHeader}>
                      <Text style={styles.approvalId}>{p.name}</Text>
                      <Text style={styles.approvalStatus}>{p.status}</Text>
                    </View>
                    <Text style={styles.approvalOwner}>Room classes: {p.room_classes_count} · Reservations: {p.reservations_count}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        ) : null}
        {moduleRoute === 'Rate catalog' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {sp.hospitalityRateCatalogUpdatedAt ?? 'Not synced yet'}</Text>
            {!moduleError && sp.hospitalityRateCatalog?.items.map((e) => (
              <View key={e.id} style={styles.approvalCard}>
                <Text style={styles.approvalId}>{e.product_code ?? '—'} · {e.rate_category_code ?? '—'}</Text>
                <Text style={styles.approvalOwner}>{e.valid_from ?? '—'} → {e.valid_to ?? '—'}</Text>
                <Text style={styles.approvalOwner}>{e.currency} {e.amount}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {moduleRoute === 'Rooms & inventory' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {sp.hospitalityRoomsInventoryUpdatedAt ?? 'Not synced yet'}</Text>
            {sp.hospitalityRoomsInventory?.room_classes.map((rc) => (
              <View key={rc.id} style={styles.approvalCard}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{rc.name}</Text>
                  <Text style={styles.approvalStatus}>{rc.occupancy}</Text>
                </View>
                <Text style={styles.approvalOwner}>Rooms: {rc.physical_rooms_count} · Products: {rc.sellable_products_count}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {moduleRoute === 'Hospitality reports' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {sp.hospitalityReportsUpdatedAt ?? 'Not synced yet'}</Text>
            {sp.hospitalityReports ? (
              <View style={styles.approvalCard}>
                <Text style={styles.approvalSubject}>Date: {sp.hospitalityReports.date}</Text>
                <Text style={styles.approvalOwner}>Occupancy: {sp.hospitalityReports.occupancy_pct}%</Text>
                <Text style={styles.approvalOwner}>Rooms sold: {sp.hospitalityReports.rooms_sold} / {sp.hospitalityReports.total_pool}</Text>
                <Text style={styles.approvalOwner}>Revenue: {sp.hospitalityReports.revenue}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {moduleRoute === 'Channel manager' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {sp.hospitalityChannelManagerUpdatedAt ?? 'Not synced yet'}</Text>
            {sp.hospitalityChannelManager?.accounts.map((a) => (
              <View key={a.id} style={styles.approvalCard}>
                <Text style={styles.approvalId}>{a.provider} · {a.environment}</Text>
                <Text style={styles.approvalOwner}>Mappings: {a.mappings_count}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {moduleRoute === 'Reservation sales' ? (
          <View style={styles.approvalsSection}>
            <Text style={styles.syncText}>Last updated: {sp.hospitalitySalesUpdatedAt ?? 'Not synced yet'}</Text>
            {sp.hospitalitySalesItems.map((doc) => (
              <View key={`${doc.kind}-${doc.id}`} style={styles.approvalCard}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId}>{doc.document_no}</Text>
                  <Text style={styles.approvalStatus}>{doc.kind}</Text>
                </View>
                <Text style={styles.approvalOwner}>{doc.status} · {doc.currency} {doc.total_amount}</Text>
              </View>
            ))}
          </View>
        ) : null}
          </>
        )}
      </ScrollView>
      )}
    </View>
  );
}
