import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { Text, TextInput } from '../components/AppTypography';
import { approveItem, getApprovalDetail, rejectItem, type ApprovalDetail, type CrmQuotationDetail } from '../api';
import {
  AccountingPeriodOverview,
  BankStatementLinesList,
  BankStatementOverview,
  CashFlowMapOverview,
  CoaAccountOverview,
  CurrencyOverview,
  DepreciationLinesList,
  DepreciationRunOverview,
  ExchangeRateWeekOverview,
  FixedAssetOverview,
  JournalEntryOverview,
  JournalLinesList,
  SupplierWhtTypeOverview,
} from '../components/AccountingDetailPresentation';
import { DetailTabBar } from '../components/DetailTabBar';
import {
  CustomerInvoiceOverview,
  FinanceLinesSection,
  financeCustomerInvoiceHero,
  financePaymentHero,
  financePaymentVoucherHero,
  financeProformaHero,
  financeSupplierInvoiceHero,
  type FinanceHeroMeta,
  PaymentOverview,
  PaymentVoucherOverview,
  ProformaInvoiceOverview,
  SupplierInvoiceOverview,
} from '../components/finance/FinanceDetailPresentation';
import { WebPortalSurfacePanel } from '../components/WebPortalSurfacePanel';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { hrCatalogRouteForDetailKind, isHrCatalogRoute } from '../hooks/hrCatalogPortal';
import { useRecordAccountingDetail } from '../hooks/useRecordAccountingDetail';
import { useRecordFinanceDetail } from '../hooks/useRecordFinanceDetail';
import type { ModulesStackParamList, RecordDetailParams } from '../navigation/moduleStackTypes';
import { styles } from '../styles/appStyles';
import {
  approvalWebDocumentAction,
  logisticsWebDocumentAction,
  parseApprovalCompositeId,
  purchaseOrderWebPdfUrl,
  quotationWebPdfUrl,
} from '../utils/erpDocumentPdfUrls';
import { webErpBaseUrl } from '../utils/webErpUrls';
import { isAccountingApiListModule } from '../utils/accountingPortal';
import { isFinanceReportMobileModule } from '../utils/financeReportPortal';
import { webPathForPortalSurface } from '../utils/portalWebSurfaces';
import { procurementRecordDetailAccessGate } from '../utils/portalModuleAccess';

const TAB_OVERVIEW = 'overview';
const TAB_LINES = 'lines';
const TAB_SOURCING = 'sourcing';

function fmtMoney(n: number | null | undefined, currency?: string | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  const cur = currency?.trim();
  const body = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur ? `${body} ${cur}` : body;
}

function detailTabDefs(kind: RecordDetailParams['detailKind']): { id: string; label: string }[] | null {
  switch (kind) {
    case 'logistics':
    case 'requisition':
    case 'purchase_order':
    case 'purchase_rfq':
    case 'supplier_quotation':
    case 'approval':
    case 'crm_quotation':
      return [
        { id: TAB_OVERVIEW, label: 'Overview' },
        { id: TAB_LINES, label: 'Lines' },
      ];
    case 'finance_customer_invoice':
    case 'finance_proforma_invoice':
    case 'finance_supplier_invoice':
    case 'finance_payment_voucher':
      return [
        { id: TAB_OVERVIEW, label: 'Overview' },
        { id: TAB_LINES, label: 'Lines' },
      ];
    case 'finance_payment':
    case 'hr_employee':
    case 'hr_leave_balance':
    case 'hr_department':
    case 'hr_position':
    case 'hr_job_grade':
    case 'hr_leave_type':
    case 'hr_payroll_run':
    case 'payslip':
      return [
        { id: TAB_OVERVIEW, label: 'Summary' },
        { id: TAB_LINES, label: 'Lines' },
      ];
    case 'accounting_currency':
    case 'accounting_exchange_rate_week':
    case 'accounting_supplier_wht_type':
    case 'accounting_period':
    case 'accounting_account':
    case 'accounting_fixed_asset':
    case 'accounting_cash_flow_map':
      return [{ id: TAB_OVERVIEW, label: 'Overview' }];
    case 'accounting_journal_entry':
    case 'accounting_depreciation_run':
    case 'accounting_bank_statement':
      return [
        { id: TAB_OVERVIEW, label: 'Overview' },
        { id: TAB_LINES, label: 'Lines' },
      ];
    case 'portal_web_surface':
      return null;
    case 'part':
      return [
        { id: TAB_OVERVIEW, label: 'Overview' },
        { id: TAB_LINES, label: 'Stock' },
      ];
    case 'support':
      return [
        { id: TAB_OVERVIEW, label: 'Details' },
        { id: TAB_LINES, label: 'Messages' },
      ];
    case 'leave':
      return [
        { id: TAB_OVERVIEW, label: 'Overview' },
        { id: TAB_LINES, label: 'Notes' },
      ];
    default:
      return null;
  }
}

function formatWorkflowStatus(raw: string | undefined): string {
  const s = String(raw ?? '').trim();
  if (s === '1' || s.toLowerCase() === 'pending') return 'Pending';
  if (s === '2' || s.toLowerCase() === 'approved') return 'Approved';
  if (s === '3' || s.toLowerCase() === 'rejected') return 'Rejected';
  if (s === '4') return 'Completed';
  if (s === '0') return 'Draft';
  return s || '—';
}

function formatQuotationMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Net before VAT; falls back to total − VAT when `total_selling_price` is absent (older API). */
function quotationNetExclVat(d: Pick<CrmQuotationDetail, 'total_selling_price' | 'total_amount' | 'total_vat'>): number | null {
  const tsp = d.total_selling_price;
  if (tsp != null && !Number.isNaN(Number(tsp))) return Number(tsp);
  if (d.total_amount != null && d.total_vat != null && !Number.isNaN(d.total_amount) && !Number.isNaN(d.total_vat)) {
    return Number((d.total_amount - d.total_vat).toFixed(2));
  }
  return null;
}

function quotationLineAmount(line: CrmQuotationDetail['lines'][number]): number | null {
  if (line.selling_price != null && !Number.isNaN(Number(line.selling_price))) return Number(line.selling_price);
  if (line.unit_price != null && line.quantity != null) {
    return Number((line.quantity * line.unit_price).toFixed(2));
  }
  return null;
}

function hasLoadedBody(kind: RecordDetailParams['detailKind'], sp: ReturnType<typeof useStaffPortal>, params: RecordDetailParams): boolean {
  switch (kind) {
    case 'logistics':
      return Boolean(sp.logisticsDetail);
    case 'requisition':
      return Boolean(sp.requisitionDetail);
    case 'purchase_order':
      return Boolean(sp.purchaseOrderDetail);
    case 'purchase_rfq':
      return Boolean(sp.purchaseRfqDetail);
    case 'supplier_quotation':
      return Boolean(sp.supplierQuotationDetail);
    case 'approval':
      return Boolean(sp.approvalDetail);
    case 'leave':
      return Boolean(sp.leaveDetail);
    case 'part':
      return Boolean(sp.partDetail);
    case 'support':
      return Boolean(sp.supportDetail);
    case 'notification':
      return Boolean(params.notificationPreview);
    case 'stock_line':
      return Boolean(params.stockLine);
    case 'attendance':
      return Boolean(params.attendancePreview);
    case 'crm_customer':
      return Boolean(sp.crmCustomerDetail);
    case 'supplier':
      return Boolean(sp.supplierDetail);
    case 'master_unit':
      return Boolean(sp.unitDetail);
    case 'master_category':
      return Boolean(sp.categoryDetail);
    case 'master_bank':
      return Boolean(sp.bankMasterDetail);
    case 'master_bank_branch':
      return Boolean(sp.bankBranchDetail);
    case 'master_mobile_operator':
      return Boolean(sp.mobileOperatorDetail);
    case 'crm_contract':
      return Boolean(sp.crmContractDetail);
    case 'crm_quotation':
      return Boolean(sp.crmQuotationDetail);
    case 'finance_customer_invoice':
    case 'finance_proforma_invoice':
    case 'finance_payment':
    case 'finance_payment_voucher':
    case 'finance_supplier_invoice':
      return false;
    case 'accounting_currency':
    case 'accounting_exchange_rate_week':
    case 'accounting_supplier_wht_type':
    case 'accounting_period':
    case 'accounting_account':
    case 'accounting_journal_entry':
    case 'accounting_fixed_asset':
    case 'accounting_depreciation_run':
    case 'accounting_bank_statement':
    case 'accounting_cash_flow_map':
      return false;
    case 'portal_web_surface':
      return Boolean(params.portalWebPath?.trim());
    case 'hr_employee':
      return Boolean(sp.employeeDetail);
    case 'hr_leave_balance':
      return Boolean(sp.leaveBalanceDetail);
    case 'hr_department':
      return Boolean(sp.hrCatalog.Departments.detail);
    case 'hr_position':
      return Boolean(sp.hrCatalog.Positions.detail);
    case 'hr_job_grade':
      return Boolean(sp.hrCatalog['Job grades'].detail);
    case 'hr_leave_type':
      return Boolean(sp.hrCatalog['Leave types'].detail);
    case 'hr_payroll_run':
      return Boolean(sp.hrCatalog['Payroll runs'].detail);
    case 'payslip':
      return Boolean(sp.payslipDetail);
    default:
      return false;
  }
}

export function RecordDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'RecordDetail'>>();
  const params = route.params;
  const {
    moduleRoute,
    detailKind,
    recordId,
    logisticsPath,
    titleHint,
    notificationPreview,
    stockLine,
    stockStoreName,
    attendancePreview,
    portalWebPath,
    portalWebTitle,
    portalWebDescription,
  } = params;

  const [notificationMarkedRead, setNotificationMarkedRead] = useState(false);
  const [quotationDecisionNote, setQuotationDecisionNote] = useState('');
  const [detailTab, setDetailTab] = useState<string>(TAB_OVERVIEW);
  const [localApprovalDetail, setLocalApprovalDetail] = useState<ApprovalDetail | null>(null);
  const [localApprovalLoading, setLocalApprovalLoading] = useState(false);
  const [localApprovalError, setLocalApprovalError] = useState<string | null>(null);

  useEffect(() => {
    setNotificationMarkedRead(Boolean(notificationPreview?.read));
  }, [notificationPreview?.read, notificationPreview?.id]);

  useEffect(() => {
    setQuotationDecisionNote('');
  }, [detailKind, recordId]);

  useEffect(() => {
    setDetailTab(TAB_OVERVIEW);
  }, [detailKind, recordId]);

  const sp = useStaffPortal();
  const {
    token,
    setPortalActiveTab,
    setPortalSelectedModule,
    fetchLogisticsDetail,
    loadRequisitionDetail,
    loadPurchaseOrderDetail,
    loadPurchaseRfqDetail,
    loadSupplierQuotationDetail,
    loadEmployeeDetail,
    loadLeaveBalanceDetail,
    hrCatalog,
    loadHrCatalogDetail,
    clearHrCatalogDetail,
    loadLeaveRequestDetail,
    loadPayslipDetail,
    fetchPartDetail,
    loadSupportDetail,
    loadApprovalDetail,
    loadCrmCustomerDetail,
    loadCrmContractDetail,
    loadCrmQuotationDetail,
    loadSupplierDetail,
    loadUnitDetail,
    loadCategoryDetail,
    loadBankMasterDetail,
    loadBankBranchDetail,
    loadMobileOperatorDetail,
    loadApprovals,
    logisticsDetailFetchSeqRef,
    partDetailFetchSeqRef,
    logisticsDetail,
    requisitionDetail,
    purchaseOrderDetail,
    purchaseRfqDetail,
    supplierQuotationDetail,
    employeeDetail,
    leaveBalanceDetail,
    leaveDetail,
    payslipDetail,
    approvalDetail,
    partDetail,
    supportDetail,
    crmCustomerDetail,
    crmContractDetail,
    crmQuotationDetail,
    supplierDetail,
    unitDetail,
    categoryDetail,
    bankMasterDetail,
    bankBranchDetail,
    mobileOperatorDetail,
    moduleLoading,
    moduleError,
    setLogisticsDetail,
    setRequisitionDetail,
    setPurchaseOrderDetail,
    setPurchaseRfqDetail,
    setSupplierQuotationDetail,
    setEmployeeDetail,
    setLeaveBalanceDetail,
    setLeaveDetail,
    setPayslipDetail,
    setPartDetail,
    setSupportDetail,
    setApprovalDetail,
    setCrmCustomerDetail,
    setCrmContractDetail,
    setCrmQuotationDetail,
    setSupplierDetail,
    setUnitDetail,
    setCategoryDetail,
    setBankMasterDetail,
    setBankBranchDetail,
    setMobileOperatorDetail,
    setModuleError,
    setModuleLoading,
    markOneNotificationRead,
    loadNotifications,
    portal,
    canViewMobileRequisitions,
    canViewMobilePurchaseRfqs,
    canViewMobileSupplierQuotations,
  } = sp;

  const openProcurementDetail = useCallback(
    (target: RecordDetailParams) => {
      navigation.navigate('RecordDetail', target);
    },
    [navigation],
  );

  const moduleAccessGate = useMemo(
    () =>
      procurementRecordDetailAccessGate(portal, moduleRoute.trim(), detailKind, {
        canViewPurchaseRfqs: canViewMobilePurchaseRfqs,
        canViewSupplierQuotations: canViewMobileSupplierQuotations,
        canViewRequisitions: canViewMobileRequisitions,
      }),
    [
      portal,
      moduleRoute,
      detailKind,
      canViewMobilePurchaseRfqs,
      canViewMobileSupplierQuotations,
      canViewMobileRequisitions,
    ],
  );

  const financeDetail = useRecordFinanceDetail(detailKind, recordId, token);
  const accountingDetail = useRecordAccountingDetail(detailKind, recordId, token);

  const loadLocalApprovalDetail = useCallback(async () => {
    if (!token || !recordId) {
      return;
    }
    setLocalApprovalLoading(true);
    setLocalApprovalError(null);
    try {
      const res = await getApprovalDetail(token, recordId);
      setLocalApprovalDetail(res.data);
    } catch (error) {
      setLocalApprovalDetail(null);
      const message = error instanceof Error ? error.message : 'Failed to load approval details.';
      setLocalApprovalError(
        /too many attempts/i.test(message)
          ? 'Too many requests. Wait about a minute, then tap Retry.'
          : message,
      );
    } finally {
      setLocalApprovalLoading(false);
    }
  }, [token, recordId]);

  useEffect(() => {
    if (detailKind !== 'approval' || moduleAccessGate !== 'allowed' || !token || !recordId) {
      return;
    }
    void loadLocalApprovalDetail();
  }, [detailKind, moduleAccessGate, token, recordId, loadLocalApprovalDetail]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule(moduleRoute);
      return () => {
        logisticsDetailFetchSeqRef.current += 1;
        partDetailFetchSeqRef.current += 1;
        if (isHrCatalogRoute(moduleRoute)) {
          clearHrCatalogDetail(moduleRoute);
        }
        setLogisticsDetail(null);
        setRequisitionDetail(null);
        setPurchaseOrderDetail(null);
        setPurchaseRfqDetail(null);
        setSupplierQuotationDetail(null);
        setEmployeeDetail(null);
        setLeaveBalanceDetail(null);
        setLeaveDetail(null);
        setPayslipDetail(null);
        setPartDetail(null);
        setSupportDetail(null);
        setApprovalDetail(null);
        setCrmCustomerDetail(null);
        setCrmContractDetail(null);
        setCrmQuotationDetail(null);
        setSupplierDetail(null);
        setUnitDetail(null);
        setCategoryDetail(null);
        setBankMasterDetail(null);
        setBankBranchDetail(null);
        setMobileOperatorDetail(null);
        setModuleError(null);
      };
    }, [
      moduleRoute,
      logisticsDetailFetchSeqRef,
      partDetailFetchSeqRef,
      setPortalActiveTab,
      setPortalSelectedModule,
      clearHrCatalogDetail,
      setLogisticsDetail,
      setRequisitionDetail,
      setPurchaseOrderDetail,
      setPurchaseRfqDetail,
      setSupplierQuotationDetail,
      setEmployeeDetail,
      setLeaveBalanceDetail,
      setLeaveDetail,
      setPartDetail,
      setSupportDetail,
      setApprovalDetail,
      setCrmCustomerDetail,
      setCrmContractDetail,
      setCrmQuotationDetail,
      setSupplierDetail,
      setUnitDetail,
      setCategoryDetail,
      setBankMasterDetail,
      setBankBranchDetail,
      setMobileOperatorDetail,
      setModuleError,
    ]),
  );

  useEffect(() => {
    if (moduleAccessGate === 'pending') {
      return;
    }
    if (moduleAccessGate === 'denied') {
      setModuleLoading(false);
      return;
    }

    setLogisticsDetail(null);
    setRequisitionDetail(null);
    setPurchaseOrderDetail(null);
    setPurchaseRfqDetail(null);
    setSupplierQuotationDetail(null);
    setEmployeeDetail(null);
    setLeaveBalanceDetail(null);
    setLeaveDetail(null);
    setPayslipDetail(null);
    setPartDetail(null);
    setSupportDetail(null);
    if (detailKind !== 'approval') {
      setApprovalDetail(null);
    }
    setCrmCustomerDetail(null);
    setCrmContractDetail(null);
    setCrmQuotationDetail(null);
    setSupplierDetail(null);
    setUnitDetail(null);
    setCategoryDetail(null);
    setBankMasterDetail(null);
    setBankBranchDetail(null);
    setMobileOperatorDetail(null);
    setModuleError(null);

    if (detailKind === 'notification' || detailKind === 'stock_line' || detailKind === 'attendance') {
      setModuleLoading(false);
    }

    if (detailKind === 'portal_web_surface') {
      setModuleLoading(false);
      return;
    }

    if (detailKind === 'logistics') {
      if (!logisticsPath) {
        setModuleError('Missing logistics path for this document.');
        return;
      }
      void fetchLogisticsDetail(recordId, logisticsPath);
      return;
    }
    if (detailKind === 'requisition') {
      void loadRequisitionDetail(recordId);
      return;
    }
    if (detailKind === 'purchase_order') {
      void loadPurchaseOrderDetail(recordId);
      return;
    }
    if (detailKind === 'purchase_rfq') {
      void loadPurchaseRfqDetail(recordId);
      return;
    }
    if (detailKind === 'supplier_quotation') {
      void loadSupplierQuotationDetail(recordId);
      return;
    }
    if (financeDetail.isFinance) {
      return;
    }
    if (accountingDetail.isAccountingDetail) {
      setModuleLoading(false);
      return;
    }
    if (detailKind === 'hr_employee') {
      void loadEmployeeDetail(recordId);
      return;
    }
    if (detailKind === 'hr_leave_balance') {
      void loadLeaveBalanceDetail(recordId);
      return;
    }
    const hrCatalogRoute = hrCatalogRouteForDetailKind(detailKind);
    if (hrCatalogRoute) {
      void loadHrCatalogDetail(hrCatalogRoute, recordId);
      return;
    }
    if (detailKind === 'approval') {
      return;
    }
    if (detailKind === 'leave') {
      void loadLeaveRequestDetail(recordId);
      return;
    }
    if (detailKind === 'payslip') {
      void loadPayslipDetail(recordId);
      return;
    }
    if (detailKind === 'part') {
      void fetchPartDetail(recordId);
      return;
    }
    if (detailKind === 'support') {
      void loadSupportDetail(recordId);
      return;
    }
    if (detailKind === 'crm_customer') {
      void loadCrmCustomerDetail(recordId);
      return;
    }
    if (detailKind === 'crm_contract') {
      void loadCrmContractDetail(recordId);
      return;
    }
    if (detailKind === 'crm_quotation') {
      void loadCrmQuotationDetail(recordId);
      return;
    }
    if (detailKind === 'supplier') {
      void loadSupplierDetail(recordId);
      return;
    }
    if (detailKind === 'master_unit') {
      void loadUnitDetail(recordId);
      return;
    }
    if (detailKind === 'master_category') {
      void loadCategoryDetail(recordId);
      return;
    }
    if (detailKind === 'master_bank') {
      void loadBankMasterDetail(recordId);
      return;
    }
    if (detailKind === 'master_bank_branch') {
      void loadBankBranchDetail(recordId);
      return;
    }
    if (detailKind === 'master_mobile_operator') {
      void loadMobileOperatorDetail(recordId);
      return;
    }
    if (detailKind === 'notification' && !notificationPreview) {
      setModuleError('Open this notification from the list to view its content.');
      return;
    }
    if (detailKind === 'stock_line' && !stockLine) {
      setModuleError('Missing stock line data.');
      return;
    }
    if (detailKind === 'attendance' && !attendancePreview) {
      setModuleError('Missing attendance row data.');
      return;
    }
  }, [
    detailKind,
    recordId,
    logisticsPath,
    notificationPreview,
    stockLine,
    attendancePreview,
    financeDetail.isFinance,
    accountingDetail.isAccountingDetail,
    fetchLogisticsDetail,
    loadRequisitionDetail,
    loadPurchaseOrderDetail,
    loadPurchaseRfqDetail,
    loadSupplierQuotationDetail,
    loadEmployeeDetail,
    loadLeaveBalanceDetail,
    loadHrCatalogDetail,
    loadLeaveRequestDetail,
    loadPayslipDetail,
    fetchPartDetail,
    loadSupportDetail,
    loadCrmCustomerDetail,
    loadCrmContractDetail,
    loadCrmQuotationDetail,
    loadSupplierDetail,
    loadUnitDetail,
    loadCategoryDetail,
    loadBankMasterDetail,
    loadBankBranchDetail,
    loadMobileOperatorDetail,
    setLogisticsDetail,
    setRequisitionDetail,
    setPurchaseOrderDetail,
    setPurchaseRfqDetail,
    setSupplierQuotationDetail,
    setEmployeeDetail,
    setLeaveBalanceDetail,
    setLeaveDetail,
    setPayslipDetail,
    setPartDetail,
    setSupportDetail,
    setApprovalDetail,
    setCrmCustomerDetail,
    setCrmContractDetail,
    setCrmQuotationDetail,
    setSupplierDetail,
    setUnitDetail,
    setCategoryDetail,
    setBankMasterDetail,
    setBankBranchDetail,
    setMobileOperatorDetail,
    setModuleError,
    setModuleLoading,
    loadApprovalDetail,
    moduleAccessGate,
  ]);

  const hrCatalogRoute = hrCatalogRouteForDetailKind(detailKind);
  const hrCatalogDetail = hrCatalogRoute ? hrCatalog[hrCatalogRoute].detail : null;

  const approvalDetailEffective = detailKind === 'approval' ? localApprovalDetail : approvalDetail;

  const loadedBody =
    detailKind === 'approval'
      ? Boolean(localApprovalDetail)
      : detailKind === 'portal_web_surface'
        ? Boolean(portalWebPath?.trim())
        : financeDetail.isFinance
          ? financeDetail.loaded
          : accountingDetail.isAccountingDetail
            ? accountingDetail.loaded
            : hasLoadedBody(detailKind, sp, params);
  const detailError =
    detailKind === 'approval'
      ? localApprovalError
      : detailKind === 'portal_web_surface'
        ? portalWebPath?.trim()
          ? null
          : 'Missing web ERP link for this report.'
        : financeDetail.isFinance
          ? financeDetail.error
          : accountingDetail.isAccountingDetail
            ? accountingDetail.error
            : moduleError;
  const detailLoading =
    detailKind === 'approval'
      ? localApprovalLoading
      : detailKind === 'portal_web_surface'
        ? false
        : financeDetail.isFinance
          ? financeDetail.loading
          : accountingDetail.isAccountingDetail
            ? accountingDetail.loading
            : moduleLoading;
  const showLoading = detailLoading && !loadedBody && !detailError;

  const webDocAction = useMemo(() => {
    if (detailKind === 'logistics') return logisticsWebDocumentAction(logisticsPath, recordId);
    if (detailKind === 'approval' && approvalDetailEffective?.id) return approvalWebDocumentAction(approvalDetailEffective.id);
    if (detailKind === 'crm_quotation') return quotationWebPdfUrl(recordId);
    if (detailKind === 'purchase_order') return purchaseOrderWebPdfUrl(recordId);
    return null;
  }, [detailKind, recordId, logisticsPath, approvalDetailEffective?.id]);

  const openWebDocument = useCallback(async () => {
    if (!webDocAction) return;
    const ok = await Linking.canOpenURL(webDocAction.url);
    if (ok) await Linking.openURL(webDocAction.url);
  }, [webDocAction]);

  const activeDetailTabs = useMemo(() => {
    if (!loadedBody || detailError) return null;
    const base = detailTabDefs(detailKind);
    if (!base) return null;
    if (detailKind === 'requisition' && requisitionDetail?.sourcing) {
      const s = requisitionDetail.sourcing;
      const hasSourcing =
        Boolean(s.active_rfq) || (s.rfqs?.length ?? 0) > 0 || (s.quotations?.length ?? 0) > 0 || Boolean(s.awarded_quotation);
      if (hasSourcing) {
        return [...base, { id: TAB_SOURCING, label: 'Sourcing' }];
      }
    }
    return base;
  }, [loadedBody, detailError, detailKind, requisitionDetail?.sourcing]);

  const financeHeroMeta = useMemo((): FinanceHeroMeta | null => {
    if (!financeDetail.isFinance || !financeDetail.loaded) return null;
    if (detailKind === 'finance_customer_invoice' && financeDetail.customerInvoice) {
      return financeCustomerInvoiceHero(financeDetail.customerInvoice);
    }
    if (detailKind === 'finance_proforma_invoice' && financeDetail.proformaInvoice) {
      return financeProformaHero(financeDetail.proformaInvoice);
    }
    if (detailKind === 'finance_payment' && financeDetail.payment) {
      return financePaymentHero(financeDetail.payment);
    }
    if (detailKind === 'finance_payment_voucher' && financeDetail.paymentVoucher) {
      return financePaymentVoucherHero(financeDetail.paymentVoucher);
    }
    if (detailKind === 'finance_supplier_invoice' && financeDetail.supplierInvoice) {
      return financeSupplierInvoiceHero(financeDetail.supplierInvoice);
    }
    return null;
  }, [detailKind, financeDetail]);

  const headline = (() => {
    if (detailKind === 'portal_web_surface') return portalWebTitle ?? titleHint ?? moduleRoute;
    if (detailKind === 'finance_customer_invoice' && financeDetail.customerInvoice) return financeDetail.customerInvoice.ref;
    if (detailKind === 'finance_proforma_invoice' && financeDetail.proformaInvoice) return financeDetail.proformaInvoice.ref;
    if (detailKind === 'finance_payment' && financeDetail.payment) {
      return financeDetail.payment.invoice_ref ?? financeDetail.payment.ref;
    }
    if (detailKind === 'finance_payment_voucher' && financeDetail.paymentVoucher) return financeDetail.paymentVoucher.ref;
    if (detailKind === 'finance_supplier_invoice' && financeDetail.supplierInvoice) return financeDetail.supplierInvoice.ref;
    if (detailKind === 'accounting_currency' && accountingDetail.currency) return accountingDetail.currency.code;
    if (detailKind === 'accounting_exchange_rate_week' && accountingDetail.exchangeWeek) {
      return accountingDetail.exchangeWeek.week_start?.trim() || titleHint || recordId;
    }
    if (detailKind === 'accounting_supplier_wht_type' && accountingDetail.whtType) return accountingDetail.whtType.name;
    if (detailKind === 'accounting_period' && accountingDetail.period) {
      const p = accountingDetail.period;
      return `${p.year}-${String(p.month).padStart(2, '0')}`;
    }
    if (detailKind === 'accounting_account' && accountingDetail.account) return accountingDetail.account.code;
    if (detailKind === 'accounting_journal_entry' && accountingDetail.journal) return accountingDetail.journal.reference;
    if (detailKind === 'accounting_fixed_asset' && accountingDetail.fixedAsset) return accountingDetail.fixedAsset.asset_code;
    if (detailKind === 'accounting_depreciation_run' && accountingDetail.depreciationRun) {
      return accountingDetail.depreciationRun.run_date?.trim() || titleHint || recordId;
    }
    if (detailKind === 'accounting_bank_statement' && accountingDetail.bankStatement) return accountingDetail.bankStatement.bank_name;
    if (detailKind === 'accounting_cash_flow_map' && accountingDetail.cashFlowMap) return titleHint || 'Cash flow mapping';
    if (titleHint) return titleHint;
    if (detailKind === 'logistics' && logisticsDetail) return logisticsDetail.ref;
    if (detailKind === 'requisition' && requisitionDetail) return requisitionDetail.ref;
    if (detailKind === 'purchase_order' && purchaseOrderDetail) return purchaseOrderDetail.ref;
    if (detailKind === 'purchase_rfq' && purchaseRfqDetail) return purchaseRfqDetail.ref;
    if (detailKind === 'supplier_quotation' && supplierQuotationDetail) return supplierQuotationDetail.ref;
    if (detailKind === 'hr_employee' && employeeDetail) return employeeDetail.employee_code || employeeDetail.name;
    if (detailKind === 'hr_leave_balance' && leaveBalanceDetail) return leaveBalanceDetail.leave_type_name || leaveBalanceDetail.leave_type_id;
    if (detailKind === 'hr_department' && hrCatalogDetail && 'name' in hrCatalogDetail) return hrCatalogDetail.name;
    if (detailKind === 'hr_position' && hrCatalogDetail && 'title' in hrCatalogDetail) return hrCatalogDetail.title;
    if (detailKind === 'hr_job_grade' && hrCatalogDetail && 'name' in hrCatalogDetail) return hrCatalogDetail.name;
    if (detailKind === 'hr_leave_type' && hrCatalogDetail && 'name' in hrCatalogDetail) return hrCatalogDetail.name;
    if (detailKind === 'hr_payroll_run' && hrCatalogDetail && 'ref' in hrCatalogDetail) return hrCatalogDetail.ref;
    if (detailKind === 'payslip' && payslipDetail) {
      const ps = payslipDetail.period_start ?? '';
      const pe = payslipDetail.period_end ?? '';
      return ps && pe ? `${ps} → ${pe}` : titleHint || recordId;
    }
    if (detailKind === 'approval' && approvalDetailEffective) return approvalDetailEffective.ref;
    if (detailKind === 'leave' && leaveDetail) return leaveDetail.id;
    if (detailKind === 'part' && partDetail) return partDetail.code;
    if (detailKind === 'support' && supportDetail) return supportDetail.ticket_number;
    if (detailKind === 'notification' && notificationPreview) return notificationPreview.title;
    if (detailKind === 'stock_line' && stockLine) return stockLine.code;
    if (detailKind === 'attendance' && attendancePreview) return attendancePreview.date ?? recordId;
    if (detailKind === 'crm_customer' && crmCustomerDetail) return crmCustomerDetail.name || crmCustomerDetail.code;
    if (detailKind === 'crm_contract' && crmContractDetail) return crmContractDetail.ref;
    if (detailKind === 'crm_quotation' && crmQuotationDetail) return crmQuotationDetail.ref;
    if (detailKind === 'supplier' && supplierDetail) return supplierDetail.name || supplierDetail.code;
    if (detailKind === 'master_unit' && unitDetail) return unitDetail.uom;
    if (detailKind === 'master_category' && categoryDetail) return categoryDetail.name;
    if (detailKind === 'master_bank' && bankMasterDetail) return bankMasterDetail.bank_name;
    if (detailKind === 'master_bank_branch' && bankBranchDetail) return bankBranchDetail.branch_name;
    if (detailKind === 'master_mobile_operator' && mobileOperatorDetail) return mobileOperatorDetail.name;
    return recordId;
  })();

  const openWebRoot = async () => {
    const url = webErpBaseUrl();
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const onRetry = () => {
    setModuleError(null);
    if (detailKind === 'logistics' && logisticsPath) void fetchLogisticsDetail(recordId, logisticsPath);
    else if (detailKind === 'requisition') void loadRequisitionDetail(recordId);
    else if (detailKind === 'purchase_order') void loadPurchaseOrderDetail(recordId);
    else if (detailKind === 'purchase_rfq') void loadPurchaseRfqDetail(recordId);
    else if (detailKind === 'supplier_quotation') void loadSupplierQuotationDetail(recordId);
    else if (financeDetail.isFinance) void financeDetail.reload();
    else if (accountingDetail.isAccountingDetail) void accountingDetail.reload();
    else if (detailKind === 'hr_employee') void loadEmployeeDetail(recordId);
    else if (detailKind === 'hr_leave_balance') void loadLeaveBalanceDetail(recordId);
    else if (hrCatalogRoute) void loadHrCatalogDetail(hrCatalogRoute, recordId);
    else if (detailKind === 'approval') void loadLocalApprovalDetail();
    else if (detailKind === 'leave') void loadLeaveRequestDetail(recordId);
    else if (detailKind === 'payslip') void loadPayslipDetail(recordId);
    else if (detailKind === 'part') void fetchPartDetail(recordId);
    else if (detailKind === 'support') void loadSupportDetail(recordId);
    else if (detailKind === 'crm_customer') void loadCrmCustomerDetail(recordId);
    else if (detailKind === 'crm_contract') void loadCrmContractDetail(recordId);
    else if (detailKind === 'crm_quotation') void loadCrmQuotationDetail(recordId);
    else if (detailKind === 'supplier') void loadSupplierDetail(recordId);
    else if (detailKind === 'master_unit') void loadUnitDetail(recordId);
    else if (detailKind === 'master_category') void loadCategoryDetail(recordId);
    else if (detailKind === 'master_bank') void loadBankMasterDetail(recordId);
    else if (detailKind === 'master_bank_branch') void loadBankBranchDetail(recordId);
    else if (detailKind === 'master_mobile_operator') void loadMobileOperatorDetail(recordId);
  };

  const markRead = async () => {
    if (!notificationPreview || notificationPreview.read || notificationMarkedRead) return;
    try {
      await markOneNotificationRead(notificationPreview.id);
      setNotificationMarkedRead(true);
      await loadNotifications(1);
    } catch {
      /* surface via portal toast elsewhere if needed */
    }
  };

  const runQuotationDecision = async (approved: boolean) => {
    if (!crmQuotationDetail?.can_approve) return;
    const id = crmQuotationDetail.approval_composite_id;
    const note = quotationDecisionNote.trim() || undefined;
    setModuleLoading(true);
    setModuleError(null);
    try {
      if (approved) {
        await approveItem(token, id, note);
      } else {
        await rejectItem(token, id, note);
      }
      setQuotationDecisionNote('');
      await loadCrmQuotationDetail(recordId);
      await loadApprovals(1, { force: true });
    } catch (error) {
      setModuleError(error instanceof Error ? error.message : 'Failed to update quotation.');
    } finally {
      setModuleLoading(false);
    }
  };

  const confirmQuotationApprove = () => {
    if (!crmQuotationDetail?.can_approve) return;
    Alert.alert('Approve quotation', 'Mark this quotation as approved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => void runQuotationDecision(true) },
    ]);
  };

  const confirmQuotationReject = () => {
    if (!crmQuotationDetail?.can_approve) return;
    Alert.alert('Reject quotation', 'Mark this quotation as rejected?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => void runQuotationDecision(false) },
    ]);
  };

  const showHero =
    !detailError &&
    !showLoading &&
    ((financeDetail.isFinance && financeDetail.loaded) ||
      (accountingDetail.isAccountingDetail && accountingDetail.loaded) ||
      (detailKind === 'logistics' && !!logisticsDetail) ||
      (detailKind === 'requisition' && !!requisitionDetail) ||
      (detailKind === 'purchase_order' && !!purchaseOrderDetail) ||
      (detailKind === 'purchase_rfq' && !!purchaseRfqDetail) ||
      (detailKind === 'supplier_quotation' && !!supplierQuotationDetail) ||
      (detailKind === 'hr_employee' && !!employeeDetail) ||
      (detailKind === 'hr_leave_balance' && !!leaveBalanceDetail) ||
      (hrCatalogRoute && !!hrCatalogDetail) ||
      (detailKind === 'approval' && !!approvalDetailEffective) ||
      (detailKind === 'leave' && !!leaveDetail) ||
      (detailKind === 'payslip' && !!payslipDetail) ||
      (detailKind === 'crm_customer' && !!crmCustomerDetail) ||
      (detailKind === 'crm_contract' && !!crmContractDetail) ||
      (detailKind === 'crm_quotation' && !!crmQuotationDetail) ||
      (detailKind === 'supplier' && !!supplierDetail) ||
      (detailKind === 'master_unit' && !!unitDetail) ||
      (detailKind === 'master_category' && !!categoryDetail) ||
      (detailKind === 'master_bank' && !!bankMasterDetail) ||
      (detailKind === 'master_bank_branch' && !!bankBranchDetail) ||
      (detailKind === 'master_mobile_operator' && !!mobileOperatorDetail));

  const heroStatusLabel =
    detailKind === 'logistics' && logisticsDetail
      ? logisticsDetail.status_label
      : detailKind === 'requisition' && requisitionDetail
        ? requisitionDetail.status_label
        : detailKind === 'purchase_order' && purchaseOrderDetail
          ? purchaseOrderDetail.status_label
          : detailKind === 'purchase_rfq' && purchaseRfqDetail
            ? purchaseRfqDetail.status_label
            : detailKind === 'supplier_quotation' && supplierQuotationDetail
              ? supplierQuotationDetail.status_label
              : detailKind === 'finance_customer_invoice' && financeDetail.customerInvoice
            ? financeDetail.customerInvoice.status_label
            : detailKind === 'finance_proforma_invoice' && financeDetail.proformaInvoice
              ? financeDetail.proformaInvoice.status_label
              : detailKind === 'finance_payment' && financeDetail.payment
                ? financeDetail.payment.status_label
                : detailKind === 'finance_payment_voucher' && financeDetail.paymentVoucher
                  ? financeDetail.paymentVoucher.status_label
                  : detailKind === 'finance_supplier_invoice' && financeDetail.supplierInvoice
                    ? financeDetail.supplierInvoice.status_label
                    : detailKind === 'accounting_currency' && accountingDetail.currency
                      ? accountingDetail.currency.is_active
                        ? 'Active'
                        : 'Inactive'
                      : detailKind === 'accounting_exchange_rate_week' && accountingDetail.exchangeWeek
                        ? accountingDetail.exchangeWeek.source || '—'
                        : detailKind === 'accounting_supplier_wht_type' && accountingDetail.whtType
                          ? accountingDetail.whtType.is_active
                            ? 'Active'
                            : 'Inactive'
                          : detailKind === 'accounting_period' && accountingDetail.period
                            ? accountingDetail.period.status
                            : detailKind === 'accounting_account' && accountingDetail.account
                              ? accountingDetail.account.is_active
                                ? 'Active'
                                : 'Inactive'
                              : detailKind === 'accounting_journal_entry' && accountingDetail.journal
                                ? accountingDetail.journal.status
                                : detailKind === 'accounting_fixed_asset' && accountingDetail.fixedAsset
                                  ? accountingDetail.fixedAsset.status
                                  : detailKind === 'accounting_depreciation_run' && accountingDetail.depreciationRun
                                    ? accountingDetail.depreciationRun.status
                                    : detailKind === 'accounting_bank_statement' && accountingDetail.bankStatement
                                      ? accountingDetail.bankStatement.source || 'Statement'
                                      : detailKind === 'accounting_cash_flow_map' && accountingDetail.cashFlowMap
                                        ? 'Configured'
                    : detailKind === 'hr_employee' && employeeDetail
                      ? employeeDetail.status
                      : detailKind === 'hr_leave_balance' && leaveBalanceDetail
                        ? leaveBalanceDetail.status ?? 'active'
                        : hrCatalogRoute && hrCatalogDetail && 'status' in hrCatalogDetail
                          ? String(hrCatalogDetail.status)
                          : hrCatalogRoute && hrCatalogDetail && 'status_label' in hrCatalogDetail
                            ? String(hrCatalogDetail.status_label)
                            : detailKind === 'approval' && approvalDetailEffective
                          ? formatWorkflowStatus(approvalDetailEffective.status)
          : detailKind === 'leave' && leaveDetail
            ? formatWorkflowStatus(leaveDetail.status)
            : detailKind === 'crm_customer' && crmCustomerDetail
              ? crmCustomerDetail.status
              : detailKind === 'crm_contract' && crmContractDetail
                ? crmContractDetail.status
                : detailKind === 'crm_quotation' && crmQuotationDetail
                  ? crmQuotationDetail.status_label
                  : detailKind === 'supplier' && supplierDetail
                    ? supplierDetail.status
                    : detailKind === 'master_unit' && unitDetail
                      ? unitDetail.status
                      : detailKind === 'master_category' && categoryDetail
                        ? categoryDetail.status
                        : detailKind === 'master_bank' && bankMasterDetail
                          ? bankMasterDetail.status
                          : detailKind === 'master_bank_branch' && bankBranchDetail
                            ? bankBranchDetail.status
                            : detailKind === 'master_mobile_operator' && mobileOperatorDetail
                              ? mobileOperatorDetail.status
                              : '—';

  if (moduleAccessGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <TopBar
          title={moduleRoute}
          left={
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          }
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <ActivityIndicator color={colors.accentTeal} size="large" />
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 14, textAlign: 'center' }}>Checking access…</Text>
        </View>
      </View>
    );
  }

  if (moduleAccessGate === 'denied') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <TopBar
          title={moduleRoute}
          left={
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          }
        />
        <View style={{ padding: 20 }}>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
            You do not have permission to open this record in the mobile portal.
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title={moduleRoute}
        left={
          <Pressable onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
        }
        right={
          webDocAction ? (
            <TopBarIconButton
              name={webDocAction.isPdf ? 'document-text-outline' : 'print-outline'}
              onPress={() => void openWebDocument()}
            />
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {detailKind === 'portal_web_surface' && portalWebPath?.trim() ? (
          <WebPortalSurfacePanel
            title={portalWebTitle ?? moduleRoute}
            description={portalWebDescription}
            webPath={portalWebPath.trim()}
          />
        ) : null}

        {showHero ? (
          <View
            style={{
              marginHorizontal: -16,
              marginTop: -16,
              backgroundColor: colors.primaryNavy,
              paddingHorizontal: 16,
              paddingVertical: 20,
              marginBottom: 12,
            }}
          >
            <Text style={{ ...outfit('medium', 10), color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2 }}>
              {financeHeroMeta
                ? detailKind === 'finance_customer_invoice'
                  ? 'CUSTOMER INVOICE'
                  : detailKind === 'finance_proforma_invoice'
                    ? 'PROFORMA'
                    : detailKind === 'finance_payment'
                      ? 'PAYMENT'
                      : detailKind === 'finance_payment_voucher'
                        ? 'PAYMENT VOUCHER'
                        : 'SUPPLIER INVOICE'
                : accountingDetail.isAccountingDetail && accountingDetail.loaded
                  ? 'ACCOUNTING'
                  : 'RECORD'}
            </Text>
            <Text style={{ ...outfit('medium', 20), color: '#fff', marginTop: 8 }} numberOfLines={3}>
              {headline}
            </Text>
            {financeHeroMeta?.subtitle ? (
              <Text
                style={{ ...outfit('regular', 14), color: 'rgba(255,255,255,0.88)', marginTop: 6 }}
                numberOfLines={2}
              >
                {financeHeroMeta.subtitle}
              </Text>
            ) : null}
            {financeHeroMeta?.amount && financeHeroMeta.amount !== '—' ? (
              <Text style={{ ...outfit('medium', 26), color: '#fff', marginTop: 12, letterSpacing: 0.2 }}>
                {financeHeroMeta.amount}
              </Text>
            ) : null}
            {financeHeroMeta?.meta ? (
              <Text style={{ ...outfit('regular', 12), color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                {financeHeroMeta.meta}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
              <StatusBadge label={heroStatusLabel} />
            </View>
          </View>
        ) : (
          <>
            <Text style={{ ...outfit('medium', 18), color: colors.textPrimary }}>{headline}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>Record details</Text>
          </>
        )}

        {showLoading ? (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accentTeal} />
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 10 }}>Loading details…</Text>
          </View>
        ) : null}

        {detailError ? (
          <View style={[styles.emptyStateCard, { marginTop: 16 }]}>
            <Text style={styles.emptyStateTitle}>Could not load</Text>
            <Text style={styles.emptyStateText}>{detailError}</Text>
            {financeDetail.isFinance ||
            accountingDetail.isAccountingDetail ||
            detailKind === 'logistics' ||
            detailKind === 'requisition' ||
            detailKind === 'purchase_order' ||
            detailKind === 'purchase_rfq' ||
            detailKind === 'supplier_quotation' ||
            detailKind === 'approval' ||
            detailKind === 'leave' ||
            detailKind === 'part' ||
            detailKind === 'support' ||
            detailKind === 'crm_customer' ||
            detailKind === 'crm_contract' ||
            detailKind === 'crm_quotation' ||
            detailKind === 'supplier' ||
            detailKind === 'master_unit' ||
            detailKind === 'master_category' ||
            detailKind === 'master_bank' ||
            detailKind === 'master_bank_branch' ||
            detailKind === 'master_mobile_operator' ? (
              <Pressable style={styles.detailsButton} onPress={onRetry}>
                <Text style={styles.detailsButtonText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'logistics' && logisticsDetail ? (
          <View style={{ marginTop: 8 }}>
            {logisticsPath === 'inventory/delivery-notes' ? (
              <Pressable
                style={[styles.detailsButton, { marginBottom: 12 }]}
                onPress={() =>
                  navigation.navigate('DeliveryNoteLines', { deliveryNoteId: recordId })
                }
              >
                <Text style={styles.detailsButtonText}>Open delivery note workspace</Text>
              </Pressable>
            ) : null}
            {logisticsPath === 'inventory/non-po-receipts' ? (
              <Pressable
                style={[styles.detailsButton, { marginBottom: 12 }]}
                onPress={() => navigation.navigate('NonPoReceiptWorkspace', { receiptId: recordId })}
              >
                <Text style={styles.detailsButtonText}>Open non-PO receipt workspace</Text>
              </Pressable>
            ) : null}
            {logisticsPath === 'inventory/po-receipts' ? (
              <Pressable
                style={[styles.detailsButton, { marginBottom: 12 }]}
                onPress={() => navigation.navigate('PoReceiptWorkspace', { receiptId: recordId })}
              >
                <Text style={styles.detailsButtonText}>Open PO receipt workspace</Text>
              </Pressable>
            ) : null}
            {logisticsPath === 'inventory/supplier-returns' ? (
              <Pressable
                style={[styles.detailsButton, { marginBottom: 12 }]}
                onPress={() => navigation.navigate('SupplierReturnWorkspace', { supplierReturnId: recordId })}
              >
                <Text style={styles.detailsButtonText}>Open supplier return workspace</Text>
              </Pressable>
            ) : null}
            {logisticsPath === 'inventory/pick-tickets' ? (
              <Pressable
                style={[styles.detailsButton, { marginBottom: 12 }]}
                onPress={() => navigation.navigate('PickTicketWorkspace', { pickTicketId: recordId })}
              >
                <Text style={styles.detailsButtonText}>Open pick ticket workspace</Text>
              </Pressable>
            ) : null}
            {logisticsPath === 'inventory/movements/kitchen-to-store' ||
            logisticsPath === 'inventory/movements/store-to-kitchen' ? (
              <Pressable
                style={[styles.detailsButton, { marginBottom: 12 }]}
                onPress={() => {
                  const docKind =
                    logisticsPath === 'inventory/movements/kitchen-to-store'
                      ? ('kitchen_to_store' as const)
                      : ('store_to_kitchen' as const);
                  const ctxParts = (logisticsDetail.context ?? '').split('→').map((s) => s.trim());
                  const stockName =
                    docKind === 'kitchen_to_store' ? ctxParts[0] ?? '' : ctxParts[1] ?? ctxParts[0] ?? '';
                  navigation.navigate('StoreMovementLines', {
                    issueId: recordId,
                    docKind,
                    stockStoreName: stockStoreName?.trim() || stockName,
                    readOnly: logisticsDetail.status !== '0',
                    initialTab: 'overview',
                  });
                }}
              >
                <Text style={styles.detailsButtonText}>Open store movement workspace</Text>
              </Pressable>
            ) : null}
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Document</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Ref: {logisticsDetail.ref}</Text>
                <Text style={styles.meta}>Status: {logisticsDetail.status_label}</Text>
                <Text style={styles.meta}>Date: {logisticsDetail.document_date ?? '—'}</Text>
                {logisticsDetail.context ? <Text style={styles.meta}>{logisticsDetail.context}</Text> : null}
                {logisticsDetail.total_amount != null || logisticsDetail.total_amount_reporting != null ? (
                  <Text style={styles.meta}>
                    Total: {fmtMoney(logisticsDetail.total_amount, logisticsDetail.base_currency)}
                    {logisticsDetail.total_amount_reporting != null
                      ? ` · Reporting: ${fmtMoney(logisticsDetail.total_amount_reporting, logisticsDetail.reporting_currency)}`
                      : ''}
                  </Text>
                ) : null}
                {logisticsDetail.expiration_summary ? (
                  <Text style={styles.meta}>
                    Lot / expiry: {logisticsDetail.expiration_summary.allocated_qty.toFixed(2)} of{' '}
                    {logisticsDetail.expiration_summary.received_qty.toFixed(2)} allocated
                    {logisticsDetail.expiration_summary.complete ? ' (complete)' : ` · ${logisticsDetail.expiration_summary.remaining_qty.toFixed(2)} remaining`}
                  </Text>
                ) : null}
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Line items</Text>
                {logisticsDetail.lines.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No line items.</Text>
                ) : (
                  logisticsDetail.lines.map((line) => (
                    <View key={line.id} style={styles.approvalLineRow}>
                      <Text style={styles.approvalType}>{line.item}</Text>
                      <Text style={styles.approvalOwner}>
                        {typeof line.quantity === 'number' ? line.quantity.toFixed(2) : line.quantity} {line.unit || ''}
                        {line.note ? ` · ${line.note}` : ''}
                        {line.line_amount != null ? ` · ${fmtMoney(line.line_amount, logisticsDetail.base_currency)}` : ''}
                        {line.line_amount_reporting != null
                          ? ` · Rpt ${fmtMoney(line.line_amount_reporting, logisticsDetail.reporting_currency)}`
                          : ''}
                        {line.pax != null && line.pax > 0 ? ` · Pax ${line.pax}` : ''}
                        {line.expiration_complete === true
                          ? ' · Lots OK'
                          : line.expiration_remaining_qty != null && line.expiration_remaining_qty > 0.00001
                            ? ` · Lots: ${(line.expiration_allocated_qty ?? 0).toFixed(2)}/${line.quantity.toFixed(2)}`
                            : null}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'requisition' && requisitionDetail ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Requisition</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Ref: {requisitionDetail.ref}</Text>
                <Text style={styles.meta}>Status: {requisitionDetail.status_label}</Text>
                <Text style={styles.meta}>Requested: {requisitionDetail.requested_date ?? '—'}</Text>
                <Text style={styles.meta}>Comment: {requisitionDetail.approval_comment ?? '—'}</Text>
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Line items</Text>
                {requisitionDetail.lines.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No line items.</Text>
                ) : (
                  requisitionDetail.lines.map((line) => (
                    <View key={line.id} style={styles.approvalLineRow}>
                      <Text style={styles.approvalType}>{line.item}</Text>
                      <Text style={styles.approvalOwner}>
                        {line.quantity} {line.unit || ''} {line.category ? `· ${line.category}` : ''}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_SOURCING) && requisitionDetail.sourcing ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Procurement sourcing</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>
                  Read-only snapshot from the web ERP. Manage RFQs and quotations on the web.
                </Text>
                {requisitionDetail.sourcing.active_rfq ? (
                  <Pressable
                    style={{ marginTop: 8 }}
                    onPress={() =>
                      openProcurementDetail({
                        moduleRoute: 'Purchase RFQs',
                        detailKind: 'purchase_rfq',
                        recordId: requisitionDetail.sourcing!.active_rfq!.id,
                        titleHint: requisitionDetail.sourcing!.active_rfq!.rfq_no,
                      })
                    }
                  >
                    <Text style={[styles.meta, { color: colors.accentTeal }]}>
                      Active RFQ: {requisitionDetail.sourcing.active_rfq.rfq_no} ·{' '}
                      {requisitionDetail.sourcing.active_rfq.status_label}
                      {requisitionDetail.sourcing.active_rfq.sent_at
                        ? ` · Sent ${requisitionDetail.sourcing.active_rfq.sent_at}`
                        : ''}
                      {' · View'}
                    </Text>
                  </Pressable>
                ) : null}
                {requisitionDetail.sourcing.awarded_quotation ? (
                  <Text style={styles.meta}>
                    Awarded: {requisitionDetail.sourcing.awarded_quotation.supplier || '—'}
                    {requisitionDetail.sourcing.awarded_quotation.quotation_ref
                      ? ` · ${requisitionDetail.sourcing.awarded_quotation.quotation_ref}`
                      : ''}
                    {' · '}
                    {fmtMoney(requisitionDetail.sourcing.awarded_quotation.total)}
                  </Text>
                ) : null}
                {requisitionDetail.sourcing.rfqs.length > 0 ? (
                  <>
                    <Text style={{ ...outfit('medium', 13), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>
                      RFQs
                    </Text>
                    {requisitionDetail.sourcing.rfqs.map((rfq) => (
                      <Pressable
                        key={rfq.id}
                        style={styles.approvalLineRow}
                        onPress={() =>
                          openProcurementDetail({
                            moduleRoute: 'Purchase RFQs',
                            detailKind: 'purchase_rfq',
                            recordId: rfq.id,
                            titleHint: rfq.rfq_no,
                          })
                        }
                      >
                        <Text style={styles.approvalType}>{rfq.rfq_no}</Text>
                        <Text style={styles.approvalOwner}>
                          {rfq.status_label}
                          {rfq.sent_at ? ` · Sent ${rfq.sent_at}` : ''}
                          {rfq.is_active ? ' · Active' : ''}
                          {' · View'}
                        </Text>
                      </Pressable>
                    ))}
                  </>
                ) : null}
                {requisitionDetail.sourcing.quotations.length > 0 ? (
                  <>
                    <Text style={{ ...outfit('medium', 13), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>
                      Supplier quotations
                    </Text>
                    {requisitionDetail.sourcing.quotations.map((q) => (
                      <Pressable
                        key={q.id}
                        style={styles.approvalLineRow}
                        onPress={() =>
                          openProcurementDetail({
                            moduleRoute: 'Supplier quotations',
                            detailKind: 'supplier_quotation',
                            recordId: q.id,
                            titleHint: q.quotation_ref || q.supplier,
                          })
                        }
                      >
                        <Text style={styles.approvalType}>{q.supplier || '—'}</Text>
                        <Text style={styles.approvalOwner}>
                          {q.quotation_ref || '—'} · {q.status_label} · {fmtMoney(q.total)}
                          {q.rfq_no ? ` · RFQ ${q.rfq_no}` : ''}
                          {' · View'}
                        </Text>
                      </Pressable>
                    ))}
                  </>
                ) : (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No supplier quotations yet.</Text>
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'purchase_order' && purchaseOrderDetail ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Purchase order</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Ref: {purchaseOrderDetail.ref}</Text>
                <Text style={styles.meta}>Supplier: {purchaseOrderDetail.supplier_name || '—'}</Text>
                <Text style={styles.meta}>Status: {purchaseOrderDetail.status_label}</Text>
                <Text style={styles.meta}>Order date: {purchaseOrderDetail.order_date ?? '—'}</Text>
                <Text style={styles.meta}>Due: {purchaseOrderDetail.order_due_date ?? '—'}</Text>
                {purchaseOrderDetail.requisition_ref?.trim() ? (
                  <Text style={styles.meta}>Requisition: {purchaseOrderDetail.requisition_ref}</Text>
                ) : null}
                {purchaseOrderDetail.approved_date ? (
                  <Text style={styles.meta}>Approved: {purchaseOrderDetail.approved_date}</Text>
                ) : null}
                {purchaseOrderDetail.description?.trim() ? (
                  <Text style={[styles.moduleBody, { marginTop: 10 }]}>{purchaseOrderDetail.description.trim()}</Text>
                ) : null}
                <View
                  style={{
                    marginTop: 16,
                    borderRadius: 12,
                    borderWidth: 0.5,
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    style={{
                      ...outfit('medium', 11),
                      color: colors.textMuted,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      paddingHorizontal: 14,
                      paddingTop: 12,
                      paddingBottom: 4,
                    }}
                  >
                    Totals
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('regular', 13), color: colors.textSecondary }}>Subtotal (excl. VAT)</Text>
                    <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
                      {formatQuotationMoney(purchaseOrderDetail.total_excl_vat)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('regular', 13), color: colors.textSecondary }}>VAT</Text>
                    <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
                      {formatQuotationMoney(purchaseOrderDetail.total_vat)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.borderSubtle,
                      backgroundColor: 'rgba(13, 27, 62, 0.06)',
                    }}
                  >
                    <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>Total</Text>
                    <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>
                      {formatQuotationMoney(
                        purchaseOrderDetail.total_incl_vat != null
                          ? purchaseOrderDetail.total_incl_vat
                          : purchaseOrderDetail.total_display
                      )}
                    </Text>
                  </View>
                </View>
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Line items</Text>
                {purchaseOrderDetail.lines.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No line items.</Text>
                ) : (
                  purchaseOrderDetail.lines.map((line) => (
                    <View
                      key={line.id}
                      style={[
                        styles.approvalLineRow,
                        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
                      ]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.approvalType} numberOfLines={3}>
                          {line.item}
                        </Text>
                        <Text style={[styles.approvalOwner, { marginTop: 4 }]}>
                          {line.quantity} {line.unit || ''}
                          {line.category ? ` · ${line.category}` : ''}
                          {line.unit_price != null ? ` · @${formatQuotationMoney(line.unit_price)}` : ''}
                        </Text>
                      </View>
                      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, flexShrink: 0 }}>
                        {formatQuotationMoney(line.line_total)}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'purchase_rfq' && purchaseRfqDetail ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Request for quotation</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Ref: {purchaseRfqDetail.ref}</Text>
                <Text style={styles.meta}>Status: {purchaseRfqDetail.status_label}</Text>
                <Text style={styles.meta}>Requisition: {purchaseRfqDetail.requisition_ref || '—'}</Text>
                <Text style={styles.meta}>Site: {purchaseRfqDetail.site || '—'}</Text>
                <Text style={styles.meta}>Store: {purchaseRfqDetail.store || '—'}</Text>
                {purchaseRfqDetail.sent_at ? <Text style={styles.meta}>Sent: {purchaseRfqDetail.sent_at}</Text> : null}
                {purchaseRfqDetail.awarded_supplier?.trim() ? (
                  <Text style={styles.meta}>Awarded supplier: {purchaseRfqDetail.awarded_supplier}</Text>
                ) : null}
                {purchaseRfqDetail.description?.trim() ? (
                  <Text style={[styles.moduleBody, { marginTop: 10 }]}>{purchaseRfqDetail.description.trim()}</Text>
                ) : null}
                {purchaseRfqDetail.requisition_description?.trim() ? (
                  <Text style={[styles.meta, { marginTop: 8 }]}>
                    Requisition note: {purchaseRfqDetail.requisition_description.trim()}
                  </Text>
                ) : null}
                {purchaseRfqDetail.invited_suppliers.length > 0 ? (
                  <>
                    <Text style={{ ...outfit('medium', 13), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>
                      Invited suppliers
                    </Text>
                    {purchaseRfqDetail.invited_suppliers.map((inv) => (
                      <View key={inv.id} style={styles.approvalLineRow}>
                        <Text style={styles.approvalType}>{inv.supplier || '—'}</Text>
                        <Text style={styles.approvalOwner}>
                          {inv.email || '—'} · {inv.status}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : null}
                {purchaseRfqDetail.quotations.length > 0 ? (
                  <>
                    <Text style={{ ...outfit('medium', 13), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>
                      Supplier quotations
                    </Text>
                    {purchaseRfqDetail.quotations.map((q) => (
                      <Pressable
                        key={q.id}
                        style={styles.approvalLineRow}
                        onPress={() =>
                          openProcurementDetail({
                            moduleRoute: 'Supplier quotations',
                            detailKind: 'supplier_quotation',
                            recordId: q.id,
                            titleHint: q.quotation_ref || q.supplier,
                          })
                        }
                      >
                        <Text style={styles.approvalType}>{q.supplier || '—'}</Text>
                        <Text style={styles.approvalOwner}>
                          {q.quotation_ref || '—'} · {q.status_label} · {fmtMoney(q.total)}
                          {' · View'}
                        </Text>
                      </Pressable>
                    ))}
                  </>
                ) : null}
                {purchaseRfqDetail.awarded_quotation ? (
                  <Text style={[styles.meta, { marginTop: 12 }]}>
                    Awarded: {purchaseRfqDetail.awarded_quotation.supplier || '—'}
                    {purchaseRfqDetail.awarded_quotation.quotation_ref
                      ? ` · ${purchaseRfqDetail.awarded_quotation.quotation_ref}`
                      : ''}
                    {' · '}
                    {fmtMoney(purchaseRfqDetail.awarded_quotation.total)}
                  </Text>
                ) : null}
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>RFQ line items</Text>
                {purchaseRfqDetail.lines.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No line items.</Text>
                ) : (
                  purchaseRfqDetail.lines.map((line) => (
                    <View key={line.id} style={styles.approvalLineRow}>
                      <Text style={styles.approvalType}>{line.item}</Text>
                      <Text style={styles.approvalOwner}>
                        {line.quantity} {line.unit || ''}
                        {line.note?.trim() ? ` · ${line.note.trim()}` : ''}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'supplier_quotation' && supplierQuotationDetail ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Supplier quotation</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Ref: {supplierQuotationDetail.ref}</Text>
                <Text style={styles.meta}>Supplier: {supplierQuotationDetail.supplier_name || '—'}</Text>
                <Text style={styles.meta}>Status: {supplierQuotationDetail.status_label}</Text>
                <Text style={styles.meta}>RFQ: {supplierQuotationDetail.rfq_no || '—'}</Text>
                <Text style={styles.meta}>Requisition: {supplierQuotationDetail.requisition_ref || '—'}</Text>
                {supplierQuotationDetail.quotation_date ? (
                  <Text style={styles.meta}>Quotation date: {supplierQuotationDetail.quotation_date}</Text>
                ) : null}
                {supplierQuotationDetail.valid_until ? (
                  <Text style={styles.meta}>Valid until: {supplierQuotationDetail.valid_until}</Text>
                ) : null}
                <Text style={[styles.meta, { marginTop: 8 }]}>
                  Subtotal: {fmtMoney(supplierQuotationDetail.subtotal)} · Total: {fmtMoney(supplierQuotationDetail.total)}
                </Text>
                {supplierQuotationDetail.rfq_id?.trim() ? (
                  <Pressable
                    style={{ marginTop: 12 }}
                    onPress={() =>
                      openProcurementDetail({
                        moduleRoute: 'Purchase RFQs',
                        detailKind: 'purchase_rfq',
                        recordId: supplierQuotationDetail.rfq_id,
                        titleHint: supplierQuotationDetail.rfq_no,
                      })
                    }
                  >
                    <Text style={{ ...outfit('medium', 13), color: colors.accentTeal }}>View linked RFQ</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Quotation lines</Text>
                {supplierQuotationDetail.lines.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No line items.</Text>
                ) : (
                  supplierQuotationDetail.lines.map((line) => (
                    <View
                      key={line.id}
                      style={[
                        styles.approvalLineRow,
                        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
                      ]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.approvalType} numberOfLines={3}>
                          {line.item}
                        </Text>
                        <Text style={[styles.approvalOwner, { marginTop: 4 }]}>
                          {line.quantity} {line.unit || ''}
                          {line.unit_price != null ? ` · @${fmtMoney(line.unit_price)}` : ''}
                          {line.note?.trim() ? ` · ${line.note.trim()}` : ''}
                        </Text>
                      </View>
                      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, flexShrink: 0 }}>
                        {fmtMoney(line.line_total)}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'approval' && approvalDetailEffective ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {approvalDetailEffective.kind === 'delivery_note' ||
            parseApprovalCompositeId(approvalDetailEffective.id)?.kind === 'delivery_note' ? (
              <Pressable
                style={[styles.detailsButton, { marginBottom: 12 }]}
                onPress={() => {
                  const numericId = parseApprovalCompositeId(approvalDetailEffective.id)?.numericId ?? recordId;
                  navigation.navigate('DeliveryNoteLines', { deliveryNoteId: numericId });
                }}
              >
                <Text style={styles.detailsButtonText}>Open delivery note workspace</Text>
              </Pressable>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>{approvalDetailEffective.type}</Text>
                {approvalDetailEffective.subject?.trim() ? (
                  <Text style={{ ...outfit('regular', 15), color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>
                    {approvalDetailEffective.subject.trim()}
                  </Text>
                ) : null}
                <Text style={[styles.meta, { marginTop: 10 }]}>Ref: {approvalDetailEffective.ref}</Text>
                <Text style={styles.meta}>Status: {formatWorkflowStatus(approvalDetailEffective.status)}</Text>
                {approvalDetailEffective.kind === 'delivery_note' ||
                parseApprovalCompositeId(approvalDetailEffective.id)?.kind === 'delivery_note' ? (
                  <>
                    <Text style={styles.meta}>
                      Customer: {approvalDetailEffective.customer_name?.trim() || approvalDetailEffective.owner || '—'}
                    </Text>
                    <Text style={styles.meta}>
                      Prepared: {approvalDetailEffective.prepared_date ?? approvalDetailEffective.requested_date ?? '—'}
                    </Text>
                    <Text style={styles.meta}>Despatch: {approvalDetailEffective.despatch_date ?? '—'}</Text>
                    {approvalDetailEffective.order_no?.trim() ? (
                      <Text style={styles.meta}>Order no.: {approvalDetailEffective.order_no.trim()}</Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.meta}>Requested: {approvalDetailEffective.requested_date ?? '—'}</Text>
                    <Text style={styles.meta}>Requested by: {approvalDetailEffective.owner}</Text>
                  </>
                )}
                <Text style={styles.meta}>Comment: {approvalDetailEffective.approval_comment ?? '—'}</Text>
                {approvalDetailEffective.priority ? (
                  <Text style={styles.meta}>Priority: {approvalDetailEffective.priority}</Text>
                ) : null}
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, marginTop: 4 }}>Product lines</Text>
                {approvalDetailEffective.lines.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No line items on this delivery note.</Text>
                ) : (
                  approvalDetailEffective.lines.map((line) => (
                    <View
                      key={line.id}
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: colors.surface,
                        borderWidth: 0.5,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      {line.product_code ? (
                        <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>{line.product_code}</Text>
                      ) : null}
                      <Text style={{ ...outfit('medium', 15), color: colors.textPrimary, marginTop: line.product_code ? 4 : 0 }}>
                        {line.item}
                      </Text>
                      <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 6 }}>
                        Qty {line.quantity}
                        {line.unit ? ` ${line.unit}` : ''}
                        {line.category ? ` · ${line.category}` : ''}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'leave' && leaveDetail ? (
          <View style={{ marginTop: 20 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Leave request</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Ref: {leaveDetail.id}</Text>
                <Text style={styles.meta}>Type: {leaveDetail.leave_type}</Text>
                <Text style={styles.meta}>Status: {leaveDetail.status}</Text>
                <Text style={styles.meta}>
                  Dates: {leaveDetail.date_start ?? '—'} → {leaveDetail.date_end ?? '—'}
                </Text>
                {leaveDetail.days_requested != null ? <Text style={styles.meta}>Days: {leaveDetail.days_requested}</Text> : null}
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Notes</Text>
                {leaveDetail.reason ? <Text style={[styles.moduleBody, { marginTop: 10 }]}>Reason: {leaveDetail.reason}</Text> : null}
                {leaveDetail.notes ? <Text style={[styles.moduleBody, { marginTop: 8 }]}>Notes: {leaveDetail.notes}</Text> : null}
                {leaveDetail.manager_approved_at ? (
                  <Text style={[styles.meta, { marginTop: 8 }]}>Manager approved: {leaveDetail.manager_approved_at}</Text>
                ) : null}
                {leaveDetail.approved_at ? <Text style={[styles.meta, { marginTop: 4 }]}>Approved: {leaveDetail.approved_at}</Text> : null}
                {leaveDetail.created_at ? <Text style={[styles.meta, { marginTop: 4 }]}>Created: {leaveDetail.created_at}</Text> : null}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'part' && partDetail ? (
          <View style={{ marginTop: 20 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Part</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Code: {partDetail.code}</Text>
                <Text style={styles.meta}>{partDetail.description}</Text>
                <Text style={styles.meta}>Status: {partDetail.status}</Text>
                <Text style={styles.meta}>Category: {partDetail.category}</Text>
                <Text style={styles.meta}>Supplier: {partDetail.supplier}</Text>
                <Text style={styles.meta}>Unit: {partDetail.unit}</Text>
                <Text style={styles.meta}>Stock on hand: {partDetail.stock_on_hand}</Text>
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>By store</Text>
                {partDetail.stock_by_store.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No store breakdown.</Text>
                ) : (
                  partDetail.stock_by_store.map((row, idx) => (
                    <View key={`${row.store_name}-${idx}`} style={styles.approvalLineRow}>
                      <Text style={styles.approvalType}>{row.store_name}</Text>
                      <Text style={styles.approvalOwner}>
                        {row.quantity} · {row.status}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'support' && supportDetail ? (
          <View style={{ marginTop: 20 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Support ticket</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>No.: {supportDetail.ticket_number}</Text>
                <Text style={styles.meta}>Status: {supportDetail.status_label}</Text>
                <Text style={styles.meta}>Category: {supportDetail.category}</Text>
                <Text style={styles.meta}>Created: {supportDetail.created_at ?? '—'}</Text>
                <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 14 }}>{supportDetail.subject}</Text>
                <Text style={[styles.moduleBody, { marginTop: 8 }]}>{supportDetail.description}</Text>
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Messages</Text>
                {supportDetail.messages.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No messages yet.</Text>
                ) : (
                  supportDetail.messages.map((m) => (
                    <View key={m.id} style={[styles.approvalLineRow, { borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }]}>
                      <Text style={styles.approvalType}>{m.author}</Text>
                      <Text style={styles.meta}>{m.created_at ?? '—'}</Text>
                      <Text style={[styles.moduleBody, { marginTop: 6 }]}>{m.body}</Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'notification' && notificationPreview ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Notification</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>{notificationPreview.created_at ?? '—'}</Text>
            {notificationPreview.module ? <Text style={styles.meta}>Module: {notificationPreview.module}</Text> : null}
            <Text style={[styles.meta, { marginTop: 8 }]}>{notificationPreview.read || notificationMarkedRead ? 'Read' : 'Unread'}</Text>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, marginTop: 14 }}>{notificationPreview.title}</Text>
            <Text style={[styles.moduleBody, { marginTop: 10 }]}>{notificationPreview.body}</Text>
            {!(notificationPreview.read || notificationMarkedRead) ? (
              <Pressable
                onPress={() => void markRead()}
                style={{ marginTop: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primaryNavy, alignItems: 'center' }}
              >
                <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Mark as read</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'stock_line' && stockLine ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Stock line</Text>
            {stockStoreName ? <Text style={[styles.meta, { marginTop: 8 }]}>Store: {stockStoreName}</Text> : null}
            <Text style={styles.meta}>Code: {stockLine.code}</Text>
            <Text style={styles.meta}>{stockLine.description}</Text>
            <Text style={styles.meta}>Qty: {stockLine.quantity}</Text>
            <Text style={styles.meta}>
              Min / max: {stockLine.min_qty ?? '—'} / {stockLine.max_qty ?? '—'}
            </Text>
            <Text style={styles.meta}>Status: {stockLine.status}</Text>
            <Text style={styles.meta}>Category: {stockLine.category}</Text>
            <Text style={styles.meta}>Supplier: {stockLine.supplier}</Text>
            <Text style={styles.meta}>Unit: {stockLine.unit}</Text>
          </View>
        ) : null}

        {detailKind === 'attendance' && attendancePreview ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Attendance</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Date: {attendancePreview.date ?? '—'}</Text>
            <Text style={styles.meta}>Status: {attendancePreview.status}</Text>
            <Text style={styles.meta}>In: {attendancePreview.check_in ?? '—'}</Text>
            <Text style={styles.meta}>Out: {attendancePreview.check_out ?? '—'}</Text>
            <Text style={styles.meta}>Hours: {attendancePreview.hours_worked ?? '—'}</Text>
            <Text style={styles.meta}>Overtime: {attendancePreview.overtime_hours.toFixed(2)}</Text>
            <Text style={styles.meta}>Source: {attendancePreview.source}</Text>
          </View>
        ) : null}

        {detailKind === 'crm_customer' && crmCustomerDetail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Customer</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Code: {crmCustomerDetail.code}</Text>
            <Text style={styles.meta}>Status: {crmCustomerDetail.status}</Text>
            <Text style={styles.meta}>Contact: {crmCustomerDetail.contact_person_name || '—'}</Text>
            <Text style={styles.meta}>Mobile: {crmCustomerDetail.contact_person_mobile || '—'}</Text>
            <Text style={styles.meta}>Email: {crmCustomerDetail.contact_person_email || '—'}</Text>
            <Text style={styles.meta}>Designation: {crmCustomerDetail.contact_person_designation || '—'}</Text>
            <Text style={[styles.moduleBody, { marginTop: 10 }]}>{crmCustomerDetail.address || '—'}</Text>
            <Text style={styles.meta}>TIN: {crmCustomerDetail.tin || '—'}</Text>
            <Text style={styles.meta}>VRN: {crmCustomerDetail.vrn || '—'}</Text>
          </View>
        ) : null}

        {detailKind === 'supplier' && supplierDetail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Supplier</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Code: {supplierDetail.code || '—'}</Text>
            <Text style={styles.meta}>Status: {supplierDetail.status}</Text>
            <Text style={styles.meta}>Phone: {supplierDetail.phone || '—'}</Text>
            <Text style={styles.meta}>Email: {supplierDetail.email || '—'}</Text>
            <Text style={[styles.moduleBody, { marginTop: 10 }]}>{supplierDetail.address || '—'}</Text>
            <Text style={styles.meta}>Payment type: {supplierDetail.payment_type || '—'}</Text>
            <Text style={styles.meta}>Account: {supplierDetail.account_no || '—'}</Text>
            <Text style={styles.meta}>Provider: {supplierDetail.account_provider || '—'}</Text>
            {supplierDetail.currency ? <Text style={styles.meta}>Currency: {supplierDetail.currency}</Text> : null}
          </View>
        ) : null}

        {detailKind === 'finance_customer_invoice' && financeDetail.customerInvoice ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <CustomerInvoiceOverview d={financeDetail.customerInvoice} /> : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Line items</Text>
                <FinanceLinesSection lines={financeDetail.customerInvoice.lines} />
              </View>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'finance_proforma_invoice' && financeDetail.proformaInvoice ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <ProformaInvoiceOverview d={financeDetail.proformaInvoice} /> : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Line items</Text>
                <FinanceLinesSection lines={financeDetail.proformaInvoice.lines} />
              </View>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'finance_payment' && financeDetail.payment ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <PaymentOverview d={financeDetail.payment} /> : null}
          </View>
        ) : null}

        {detailKind === 'finance_payment_voucher' && financeDetail.paymentVoucher ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <PaymentVoucherOverview d={financeDetail.paymentVoucher} /> : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Line items</Text>
                <FinanceLinesSection
                  lines={financeDetail.paymentVoucher.lines.map((line) => ({
                    id: line.id,
                    description: line.description,
                    amount_excl_vat: line.amount,
                  }))}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'finance_supplier_invoice' && financeDetail.supplierInvoice ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <SupplierInvoiceOverview d={financeDetail.supplierInvoice} /> : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Line items</Text>
                <FinanceLinesSection
                  lines={financeDetail.supplierInvoice.lines.map((line) => ({
                    id: line.id,
                    description: line.description,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    line_total: line.line_total,
                  }))}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'accounting_currency' && accountingDetail.currency ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <CurrencyOverview d={accountingDetail.currency} /> : null}
          </View>
        ) : null}

        {detailKind === 'accounting_exchange_rate_week' && accountingDetail.exchangeWeek ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <ExchangeRateWeekOverview d={accountingDetail.exchangeWeek} /> : null}
          </View>
        ) : null}

        {detailKind === 'accounting_supplier_wht_type' && accountingDetail.whtType ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <SupplierWhtTypeOverview d={accountingDetail.whtType} /> : null}
          </View>
        ) : null}

        {detailKind === 'accounting_period' && accountingDetail.period ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <AccountingPeriodOverview d={accountingDetail.period} /> : null}
          </View>
        ) : null}

        {detailKind === 'accounting_account' && accountingDetail.account ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <CoaAccountOverview d={accountingDetail.account} /> : null}
          </View>
        ) : null}

        {detailKind === 'accounting_journal_entry' && accountingDetail.journal ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <JournalEntryOverview d={accountingDetail.journal} /> : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Journal lines</Text>
                <JournalLinesList lines={accountingDetail.journal.lines} />
              </View>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'accounting_fixed_asset' && accountingDetail.fixedAsset ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <FixedAssetOverview d={accountingDetail.fixedAsset} /> : null}
          </View>
        ) : null}

        {detailKind === 'accounting_depreciation_run' && accountingDetail.depreciationRun ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <DepreciationRunOverview d={accountingDetail.depreciationRun} /> : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Depreciation lines</Text>
                <DepreciationLinesList lines={accountingDetail.depreciationRun.lines} />
              </View>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'accounting_bank_statement' && accountingDetail.bankStatement ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <BankStatementOverview d={accountingDetail.bankStatement} /> : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Statement lines</Text>
                <BankStatementLinesList lines={accountingDetail.bankStatement.lines} />
              </View>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'accounting_cash_flow_map' && accountingDetail.cashFlowMap ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? <CashFlowMapOverview d={accountingDetail.cashFlowMap} /> : null}
          </View>
        ) : null}

        {detailKind === 'hr_employee' && employeeDetail ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Employee</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Code: {employeeDetail.employee_code}</Text>
                <Text style={styles.meta}>Name: {employeeDetail.name}</Text>
                <Text style={styles.meta}>Job title: {employeeDetail.job_title}</Text>
                <Text style={styles.meta}>Status: {employeeDetail.status || '—'}</Text>
                <Text style={styles.meta}>Site: {employeeDetail.site_name || '—'}</Text>
                <Text style={styles.meta}>Store: {employeeDetail.store_name || '—'}</Text>
                {employeeDetail.department_name ? <Text style={styles.meta}>Department: {employeeDetail.department_name}</Text> : null}
                {employeeDetail.position_name ? <Text style={styles.meta}>Position: {employeeDetail.position_name}</Text> : null}
                {employeeDetail.job_grade_name ? <Text style={styles.meta}>Job grade: {employeeDetail.job_grade_name}</Text> : null}
                {employeeDetail.hire_date ? <Text style={styles.meta}>Hire date: {employeeDetail.hire_date}</Text> : null}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'hr_leave_balance' && leaveBalanceDetail ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Leave balance</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Type: {leaveBalanceDetail.leave_type_name}</Text>
                <Text style={styles.meta}>Cycle: {leaveBalanceDetail.cycle_start ?? '—'} → {leaveBalanceDetail.cycle_end ?? '—'}</Text>
                <Text style={styles.meta}>Entitled: {leaveBalanceDetail.entitled_days != null ? `${Number(leaveBalanceDetail.entitled_days).toFixed(1)} days` : '—'}</Text>
                <Text style={styles.meta}>Taken: {leaveBalanceDetail.taken_days != null ? `${Number(leaveBalanceDetail.taken_days).toFixed(1)} days` : '—'}</Text>
                <Text style={styles.meta}>Pending: {leaveBalanceDetail.pending_days != null ? `${Number(leaveBalanceDetail.pending_days).toFixed(1)} days` : '—'}</Text>
                <Text style={styles.meta}>Carried: {leaveBalanceDetail.carried_forward != null ? `${Number(leaveBalanceDetail.carried_forward).toFixed(1)} days` : '—'}</Text>
                <Text style={styles.meta}>Balance: {leaveBalanceDetail.balance_days != null ? `${Number(leaveBalanceDetail.balance_days).toFixed(1)} days` : '—'}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'hr_department' && hrCatalog.Departments.detail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Department</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Name: {hrCatalog.Departments.detail.name}</Text>
            <Text style={styles.meta}>Status: {hrCatalog.Departments.detail.status || '—'}</Text>
            {hrCatalog.Departments.detail.subtitle ? (
              <Text style={styles.meta}>Cost center: {hrCatalog.Departments.detail.subtitle}</Text>
            ) : null}
            {hrCatalog.Departments.detail.parent_name ? (
              <Text style={styles.meta}>Parent: {hrCatalog.Departments.detail.parent_name}</Text>
            ) : null}
            {hrCatalog.Departments.detail.manager_name ? (
              <Text style={styles.meta}>Manager: {hrCatalog.Departments.detail.manager_name}</Text>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'hr_position' && hrCatalog.Positions.detail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Position</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Title: {hrCatalog.Positions.detail.title}</Text>
            <Text style={styles.meta}>Status: {hrCatalog.Positions.detail.status || '—'}</Text>
            {hrCatalog.Positions.detail.department_name ? (
              <Text style={styles.meta}>Department: {hrCatalog.Positions.detail.department_name}</Text>
            ) : null}
            {hrCatalog.Positions.detail.job_grade_name ? (
              <Text style={styles.meta}>Job grade: {hrCatalog.Positions.detail.job_grade_name}</Text>
            ) : null}
            {hrCatalog.Positions.detail.headcount != null ? (
              <Text style={styles.meta}>Headcount: {hrCatalog.Positions.detail.headcount}</Text>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'hr_job_grade' && hrCatalog['Job grades'].detail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Job grade</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Name: {hrCatalog['Job grades'].detail.name}</Text>
            <Text style={styles.meta}>Status: {hrCatalog['Job grades'].detail.status || '—'}</Text>
            {hrCatalog['Job grades'].detail.subtitle ? (
              <Text style={styles.meta}>Code: {hrCatalog['Job grades'].detail.subtitle}</Text>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'hr_leave_type' && hrCatalog['Leave types'].detail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Leave type</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Name: {hrCatalog['Leave types'].detail.name}</Text>
            {hrCatalog['Leave types'].detail.code ? (
              <Text style={styles.meta}>Code: {hrCatalog['Leave types'].detail.code}</Text>
            ) : null}
            <Text style={styles.meta}>
              Entitled:{' '}
              {hrCatalog['Leave types'].detail.entitled_days != null
                ? `${Number(hrCatalog['Leave types'].detail.entitled_days).toFixed(1)} days`
                : '—'}
            </Text>
            <Text style={styles.meta}>Paid: {hrCatalog['Leave types'].detail.is_paid ? 'Yes' : 'No'}</Text>
            <Text style={styles.meta}>Active: {hrCatalog['Leave types'].detail.is_active ? 'Yes' : 'No'}</Text>
          </View>
        ) : null}

        {detailKind === 'hr_payroll_run' && hrCatalog['Payroll runs'].detail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Payroll run</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Reference: {hrCatalog['Payroll runs'].detail.ref}</Text>
            <Text style={styles.meta}>
              Status: {hrCatalog['Payroll runs'].detail.status_label || hrCatalog['Payroll runs'].detail.status || '—'}
            </Text>
            <Text style={styles.meta}>
              Period: {hrCatalog['Payroll runs'].detail.period_start ?? '—'} → {hrCatalog['Payroll runs'].detail.period_end ?? '—'}
            </Text>
            {hrCatalog['Payroll runs'].detail.processed_at ? (
              <Text style={styles.meta}>Processed: {hrCatalog['Payroll runs'].detail.processed_at}</Text>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'payslip' && payslipDetail ? (
          <View style={{ marginTop: 20 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Payslip</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>
                  Period: {payslipDetail.period_start ?? '—'} → {payslipDetail.period_end ?? '—'}
                </Text>
                <Text style={styles.meta}>Basic salary: TZS {payslipDetail.basic_salary.toFixed(2)}</Text>
                <Text style={styles.meta}>Gross: TZS {payslipDetail.gross_salary.toFixed(2)}</Text>
                <Text style={styles.meta}>Taxable income: TZS {payslipDetail.taxable_income.toFixed(2)}</Text>
                <Text style={styles.meta}>PAYE: TZS {payslipDetail.paye_amount.toFixed(2)}</Text>
                <Text style={styles.meta}>NSSF (employee): TZS {payslipDetail.nssf_employee.toFixed(2)}</Text>
                <Text style={styles.meta}>SDL: TZS {payslipDetail.sdl_amount.toFixed(2)}</Text>
                <Text style={styles.meta}>WCF: TZS {payslipDetail.wcf_amount.toFixed(2)}</Text>
                <Text style={styles.meta}>Total deductions: TZS {payslipDetail.total_deductions.toFixed(2)}</Text>
                <Text style={[styles.meta, { marginTop: 8, ...outfit('medium', 14), color: colors.primaryNavy }]}>
                  Net pay: TZS {payslipDetail.net_pay.toFixed(2)}
                </Text>
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, marginTop: activeDetailTabs ? 16 : 0 }}>Earnings & deductions</Text>
                {payslipDetail.lines.length === 0 ? (
                  <Text style={[styles.meta, { marginTop: 8 }]}>No line items on this payslip.</Text>
                ) : (
                  payslipDetail.lines.map((line) => (
                    <View
                      key={line.id}
                      style={{
                        marginTop: 8,
                        padding: 10,
                        borderRadius: 10,
                        backgroundColor: colors.surface,
                        borderWidth: 0.5,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <Text style={styles.meta}>{line.label}</Text>
                      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 4 }}>
                        TZS {line.amount.toFixed(2)}
                        {line.type ? ` · ${line.type}` : ''}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : null}

        {detailKind === 'master_unit' && unitDetail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Unit of measurement</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>UOM: {unitDetail.uom}</Text>
            <Text style={styles.meta}>Status: {unitDetail.status}</Text>
            <Text style={[styles.moduleBody, { marginTop: 10 }]}>{unitDetail.description || '—'}</Text>
          </View>
        ) : null}

        {detailKind === 'master_category' && categoryDetail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Category</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Name: {categoryDetail.name}</Text>
            <Text style={styles.meta}>Status: {categoryDetail.status}</Text>
          </View>
        ) : null}

        {detailKind === 'master_bank' && bankMasterDetail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Bank</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Name: {bankMasterDetail.bank_name}</Text>
            <Text style={styles.meta}>Code: {bankMasterDetail.bank_code || '—'}</Text>
            <Text style={styles.meta}>SWIFT: {bankMasterDetail.swift_code || '—'}</Text>
            <Text style={styles.meta}>Status: {bankMasterDetail.status}</Text>
          </View>
        ) : null}

        {detailKind === 'master_bank_branch' && bankBranchDetail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Bank branch</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Branch: {bankBranchDetail.branch_name}</Text>
            <Text style={styles.meta}>Branch code: {bankBranchDetail.branch_code || '—'}</Text>
            <Text style={styles.meta}>Bank: {bankBranchDetail.bank_name}</Text>
            <Text style={styles.meta}>Bank code: {bankBranchDetail.bank_code || '—'}</Text>
            <Text style={styles.meta}>SWIFT: {bankBranchDetail.swift_code || '—'}</Text>
            <Text style={styles.meta}>Status: {bankBranchDetail.status}</Text>
          </View>
        ) : null}

        {detailKind === 'master_mobile_operator' && mobileOperatorDetail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Mobile operator</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Name: {mobileOperatorDetail.name}</Text>
            <Text style={styles.meta}>Code: {mobileOperatorDetail.code || '—'}</Text>
            <Text style={styles.meta}>Status: {mobileOperatorDetail.status}</Text>
          </View>
        ) : null}

        {detailKind === 'crm_contract' && crmContractDetail ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Contract</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>Ref: {crmContractDetail.ref}</Text>
            <Text style={styles.meta}>Customer: {crmContractDetail.customer_name}</Text>
            <Text style={styles.meta}>Type: {crmContractDetail.contract_type}</Text>
            <Text style={styles.meta}>Status: {crmContractDetail.status}</Text>
            <Text style={styles.meta}>
              Period: {crmContractDetail.start_date ?? '—'} → {crmContractDetail.end_date ?? '—'}
            </Text>
            <Text style={styles.meta}>Payment term (days): {crmContractDetail.payment_term}</Text>
            <Text style={styles.meta}>Currency: {crmContractDetail.currency || '—'}</Text>
          </View>
        ) : null}

        {detailKind === 'crm_quotation' && crmQuotationDetail ? (
          <View style={{ marginTop: 8 }}>
            {activeDetailTabs ? <DetailTabBar tabs={activeDetailTabs} active={detailTab} onChange={setDetailTab} /> : null}
            {(!activeDetailTabs || detailTab === TAB_OVERVIEW) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Quotation</Text>
                <Text style={[styles.meta, { marginTop: 8 }]}>Ref: {crmQuotationDetail.ref}</Text>
                <Text style={styles.meta}>Customer: {crmQuotationDetail.customer_name}</Text>
                <Text style={styles.meta}>Status: {crmQuotationDetail.status_label}</Text>
                <Text style={styles.meta}>Date: {crmQuotationDetail.quotation_date ?? '—'}</Text>
                <Text style={styles.meta}>Valid to: {crmQuotationDetail.valid_date ?? '—'}</Text>
                {crmQuotationDetail.contract_ref ? <Text style={styles.meta}>Contract: {crmQuotationDetail.contract_ref}</Text> : null}
                {crmQuotationDetail.description?.trim() ? (
                  <Text style={[styles.moduleBody, { marginTop: 10 }]}>{crmQuotationDetail.description.trim()}</Text>
                ) : null}
                <View
                  style={{
                    marginTop: 16,
                    borderRadius: 12,
                    borderWidth: 0.5,
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                  }}
                >
                  <Text
                    style={{
                      ...outfit('medium', 11),
                      color: colors.textMuted,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      paddingHorizontal: 14,
                      paddingTop: 12,
                      paddingBottom: 4,
                    }}
                  >
                    Summary
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('regular', 13), color: colors.textSecondary }}>Subtotal (excl. VAT)</Text>
                    <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
                      {formatQuotationMoney(quotationNetExclVat(crmQuotationDetail))}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('regular', 13), color: colors.textSecondary }}>VAT</Text>
                    <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
                      {formatQuotationMoney(crmQuotationDetail.total_vat)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.borderSubtle,
                      backgroundColor: 'rgba(13, 27, 62, 0.06)',
                    }}
                  >
                    <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>Total</Text>
                    <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>
                      {formatQuotationMoney(crmQuotationDetail.total_amount)}
                    </Text>
                  </View>
                </View>
                {crmQuotationDetail.can_approve ? (
                  <View style={{ marginTop: 20 }}>
                    <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>Approval</Text>
                    <TextInput
                      style={{
                        marginTop: 8,
                        borderRadius: 10,
                        borderWidth: 0.5,
                        borderColor: colors.borderSubtle,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        fontSize: 13,
                        color: colors.textPrimary,
                        minHeight: 44,
                        textAlignVertical: 'top',
                      }}
                      placeholder="Optional note"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      value={quotationDecisionNote}
                      onChangeText={setQuotationDecisionNote}
                    />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
                      <Pressable
                        onPress={confirmQuotationApprove}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 10,
                          backgroundColor: colors.statusApprovedBg,
                        }}
                      >
                        <Text style={{ ...outfit('medium', 13), color: colors.statusApprovedText }}>Approve</Text>
                      </Pressable>
                      <Pressable
                        onPress={confirmQuotationReject}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 10,
                          backgroundColor: colors.statusRejectedBg,
                        }}
                      >
                        <Text style={{ ...outfit('medium', 13), color: colors.statusRejectedText }}>Reject</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}
            {(!activeDetailTabs || detailTab === TAB_LINES) ? (
              <>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Line items</Text>
                {crmQuotationDetail.lines.length === 0 ? (
                  <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No line items.</Text>
                ) : (
                  crmQuotationDetail.lines.map((line) => {
                    const lineAmt = quotationLineAmount(line);
                    return (
                      <View
                        key={line.id}
                        style={[
                          styles.approvalLineRow,
                          { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
                        ]}
                      >
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.approvalType} numberOfLines={3}>
                            {line.item}
                          </Text>
                          <Text style={[styles.approvalOwner, { marginTop: 4 }]}>
                            {line.quantity} {line.unit || ''}
                            {line.category ? ` · ${line.category}` : ''}
                            {line.unit_price != null ? ` · @${formatQuotationMoney(line.unit_price)}` : ''}
                          </Text>
                        </View>
                        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, flexShrink: 0 }}>
                          {formatQuotationMoney(lineAmt)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </>
            ) : null}
          </View>
        ) : null}

        <Pressable
          onPress={() => void openWebRoot()}
          style={{ marginTop: 24, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 0.5, borderColor: colors.borderSubtle }}
        >
          <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Open web ERP</Text>
          <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>Sign in on the full site for print, PDF, and edits.</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (moduleRoute === 'Approvals') {
              navigation.navigate('Approvals', {});
              return;
            }
            navigation.navigate('ModuleList', { moduleRoute });
          }}
          style={{
            marginTop: 12,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: colors.primaryNavy,
            alignItems: 'center',
          }}
        >
          <Text style={{ ...outfit('medium', 14), color: '#fff' }}>{moduleRoute === 'Approvals' ? 'Back to approvals' : 'Back to list'}</Text>
        </Pressable>

        {moduleRoute !== 'Approvals' &&
        !financeDetail.isFinance &&
        !accountingDetail.isAccountingDetail &&
        !(webPathForPortalSurface(moduleRoute, portal) && !isAccountingApiListModule(moduleRoute) && !isFinanceReportMobileModule(moduleRoute)) ? (
          <Pressable
            onPress={() => navigation.navigate('ModuleWorkspace', { moduleRoute })}
            style={{ marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 0.5, borderColor: colors.primaryNavy, alignItems: 'center' }}
          >
            <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>Open full workspace</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
