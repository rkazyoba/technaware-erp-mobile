import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { HomeRevenueChart } from '../components/HomeRevenueChart';
import { API_BASE_URL } from '../api';
import { ApprovalModuleScorePanel } from '../components/ApprovalModuleScorePanel';
import { StatusBadge } from '../components/StatusBadge';
import type { ApprovalModuleScore } from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { isPortalModuleRouteAccessible } from '../utils/portalModuleAccess';
import { navigateToPayslipTab } from '../navigation/navigateToPayslipTab';
import { PortalHeaderActions } from '../components/PortalHeaderActions';
import { staffPortalHasPermission } from '../utils/staffPortalPermissions';

function greetingPrefix(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function invoiceStatusBadgeLabel(statusLabel: string): string {
  if (statusLabel === 'Awaiting approval' || statusLabel === 'Returned for modification') return 'Pending';
  if (statusLabel === 'Approved' || statusLabel === 'Completed') return 'Approved';
  if (statusLabel === 'Cancelled') return 'Rejected';
  if (statusLabel === 'Unfinished') return 'Unfinished';
  return 'Draft';
}

export function HomeScreen() {
  const sp = useStaffPortal();
  const navigation = useNavigation<any>();
  const {
    setPortalActiveTab,
    setPortalSelectedModule,
    onOpenAction,
    user,
    portal,
    mobileSummary,
    mobileSummaryUpdatedAt,
    approvalsUpdatedAt,
    summaryLoading,
    loadMobileSummary,
    loadApprovals,
    loadApprovalSummary,
    approvalSummary,
    approvalItems,
    refreshing,
    onPullRefresh,
    isOffline,
  } = sp;

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('dashboard');
      void loadMobileSummary();
      void loadApprovalSummary();
      void loadApprovals(1);
    }, [setPortalActiveTab, loadMobileSummary, loadApprovalSummary, loadApprovals]),
  );

  const logoUri = `${API_BASE_URL.replace('/api/v1', '')}/backend/assets/img/logo.png`;
  const roleLine = useMemo(() => {
    const role = portal?.role?.name ?? 'Staff';
    return `${role} · ERP`;
  }, [portal?.role?.name]);

  const fmtCount = (n: number | null | undefined) => (n == null ? '—' : String(n));
  const fmtMoney = (n: number) =>
    `TZS ${n.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const attention = approvalSummary?.total ?? mobileSummary?.pending_approvals ?? null;
  const approvalModuleScores = approvalSummary?.modules ?? [];

  const goApprovals = (mod?: ApprovalModuleScore) => {
    if (!approvalsAccessible) {
      return;
    }
    setPortalActiveTab('modules');
    setPortalSelectedModule('Approvals');
    navigation.navigate('Modules', {
      screen: 'Approvals',
      params: mod ? { typeFilter: mod.type, kindFilter: mod.kind } : {},
    });
  };

  const onApprovalModulePress = (mod: ApprovalModuleScore) => {
    goApprovals(mod);
  };

  const openRecentInvoice = (id: string, invoiceNo: string) => {
    setPortalActiveTab('modules');
    setPortalSelectedModule('Customer invoices');
    navigation.navigate('Modules', {
      screen: 'RecordDetail',
      params: {
        moduleRoute: 'Customer invoices',
        detailKind: 'finance_customer_invoice',
        recordId: id,
        titleHint: invoiceNo,
      },
    });
  };
  const supportOpen = mobileSummary?.open_support_tickets ?? null;
  const dnOpen = mobileSummary?.delivery_notes_open ?? null;
  const leaveP = mobileSummary?.pending_leave_requests ?? null;
  const payslipNet = mobileSummary?.latest_payslip_net;

  const financeVisible = mobileSummary?.revenue_by_month != null;
  const revenueThis = mobileSummary?.revenue_this_month;
  const revenueTrend = mobileSummary?.revenue_trend_pct;
  const invPending = mobileSummary?.invoices_pending_approval ?? null;
  const invOverdue = mobileSummary?.invoices_overdue ?? null;
  const revenueMonths = mobileSummary?.revenue_by_month ?? [];
  const recentInvoices = mobileSummary?.recent_invoices ?? [];

  const homeQuickTiles = useMemo(() => {
    if (!portal?.surfaces?.length) {
      return [] as Array<
        | { key: string; label: string; kind: 'store_movement' }
        | { key: string; label: string; kind: 'leave_form' }
        | { key: string; label: string; kind: 'module_list'; moduleRoute: string }
        | { key: string; label: string; kind: 'payslip_tab' }
      >;
    }
    const tiles: Array<
      | { key: string; label: string; kind: 'store_movement' }
      | { key: string; label: string; kind: 'leave_form' }
      | { key: string; label: string; kind: 'module_list'; moduleRoute: string }
      | { key: string; label: string; kind: 'payslip_tab' }
    > = [];
    if (
      isPortalModuleRouteAccessible(portal, 'Store movements') &&
      (staffPortalHasPermission(portal, 'erp.user.kitchen_to_store') ||
        staffPortalHasPermission(portal, 'erp.user.store_to_kitchen'))
    ) {
      tiles.push({ key: 'store_movement', label: 'New store movement', kind: 'store_movement' });
    }
    if (isPortalModuleRouteAccessible(portal, 'Leave Requests')) {
      tiles.push({ key: 'leave', label: 'New leave request', kind: 'leave_form' });
    }
    if (isPortalModuleRouteAccessible(portal, 'Leave balances')) {
      tiles.push({ key: 'leave_balances', label: 'Leave balances', kind: 'module_list', moduleRoute: 'Leave balances' });
    }
    tiles.push({ key: 'payslips', label: 'My payslips', kind: 'payslip_tab' });
    return tiles;
  }, [portal]);

  const approvalsAccessible = useMemo(() => {
    if (!portal?.surfaces?.length) {
      return false;
    }
    return isPortalModuleRouteAccessible(portal, 'Approvals');
  }, [portal]);

  const revenueTrendLine = (() => {
    if (!financeVisible || revenueTrend == null) {
      return { text: 'Trend vs last month not available', color: 'rgba(255,255,255,0.55)' };
    }
    if (revenueTrend > 0) {
      return { text: `Vs last month: +${revenueTrend}%`, color: colors.accentTeal };
    }
    if (revenueTrend < 0) {
      return { text: `Vs last month: ${revenueTrend}%`, color: colors.trendDown };
    }
    return { text: 'Same as last month', color: 'rgba(255,255,255,0.75)' };
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View
        style={{
          backgroundColor: colors.primaryNavy,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, minWidth: 0, minHeight: 52, justifyContent: 'center' }}>
          <Image
            source={{ uri: logoUri }}
            style={{ width: '100%', height: 52, maxWidth: 220, alignSelf: 'flex-start' }}
            resizeMode="contain"
            accessibilityLabel="Technaware logo"
          />
        </View>
        <PortalHeaderActions />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.accentTeal} />}
      >
        <View style={{ backgroundColor: colors.greetingBar, paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ ...outfit('regular', 13), color: 'rgba(255,255,255,0.75)' }}>{greetingPrefix()}</Text>
          <Text style={{ ...outfit('medium', 22), color: '#fff', marginTop: 4 }}>{user?.name || user?.username}</Text>
          <Text style={{ ...outfit('regular', 12), color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{roleLine}</Text>
          {mobileSummaryUpdatedAt || approvalsUpdatedAt ? (
            <Text style={{ ...outfit('regular', 11), color: 'rgba(255,255,255,0.45)', marginTop: 10 }}>
              {isOffline ? 'Offline · showing saved data' : 'Last sync'}
              {mobileSummaryUpdatedAt ? ` · dashboard ${mobileSummaryUpdatedAt}` : ''}
              {approvalsUpdatedAt ? ` · approvals ${approvalsUpdatedAt}` : ''}
            </Text>
          ) : isOffline ? (
            <Text style={{ ...outfit('regular', 11), color: 'rgba(255,255,255,0.45)', marginTop: 10 }}>
              Offline · connect to refresh dashboard
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 }}>
          <View style={{ width: '48%', backgroundColor: colors.primaryNavy, borderRadius: 14, padding: 12, flexGrow: 1 }}>
            <Text style={{ ...outfit('medium', 10), color: 'rgba(255,255,255,0.75)', letterSpacing: 0.6 }}>REVENUE (TZS)</Text>
            <Text style={{ ...outfit('medium', 20), color: '#fff', marginTop: 6 }}>
              {financeVisible && revenueThis != null ? fmtMoney(revenueThis) : '—'}
            </Text>
            <Text style={{ ...outfit('regular', 9), color: revenueTrendLine.color, marginTop: 6 }}>{revenueTrendLine.text}</Text>
            {financeVisible ? (
              <Text style={{ ...outfit('regular', 10), color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
                This month · invoice totals
              </Text>
            ) : null}
            {payslipNet != null ? (
              <Text style={{ ...outfit('regular', 10), color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
                Last payslip net: TZS {payslipNet.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {mobileSummary?.latest_payslip_period_end ? ` · ${mobileSummary.latest_payslip_period_end}` : ''}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => goApprovals()}
            disabled={!approvalsAccessible}
            style={{
              width: '48%',
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
              flexGrow: 1,
              opacity: approvalsAccessible ? 1 : 0.85,
            }}
          >
            <Text style={{ ...outfit('medium', 10), color: colors.textMuted, letterSpacing: 0.6 }}>PENDING APPROVALS</Text>
            <Text style={{ ...outfit('medium', 20), color: colors.statusPendingText, marginTop: 6 }}>{fmtCount(attention)}</Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textSecondary, marginTop: 6 }}>
              {approvalsAccessible ? 'Tap to open approvals inbox' : 'Approvals not enabled for your role'}
            </Text>
            {supportOpen != null ? (
              <Text style={{ ...outfit('regular', 10), color: colors.textMuted, marginTop: 4 }}>Support open: {supportOpen}</Text>
            ) : null}
          </Pressable>
          {financeVisible ? (
            <View
              style={{
                width: '48%',
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 12,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                flexGrow: 1,
              }}
            >
              <Text style={{ ...outfit('medium', 10), color: colors.textMuted, letterSpacing: 0.6 }}>INVOICES · QUEUE</Text>
              <Text style={{ ...outfit('medium', 20), color: colors.textPrimary, marginTop: 6 }}>{fmtCount(invPending)}</Text>
              <Text style={{ ...outfit('regular', 11), color: colors.textSecondary, marginTop: 6 }}>Awaiting approval</Text>
            </View>
          ) : null}
          {financeVisible ? (
            <View
              style={{
                width: '48%',
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 12,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                flexGrow: 1,
              }}
            >
              <Text style={{ ...outfit('medium', 10), color: colors.textMuted, letterSpacing: 0.6 }}>INVOICES · OVERDUE</Text>
              <Text style={{ ...outfit('medium', 20), color: colors.textPrimary, marginTop: 6 }}>{fmtCount(invOverdue)}</Text>
              <Text style={{ ...outfit('regular', 11), color: colors.textSecondary, marginTop: 6 }}>Approved, past due date</Text>
            </View>
          ) : null}
          <View
            style={{
              width: '48%',
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
              flexGrow: 1,
            }}
          >
            <Text style={{ ...outfit('medium', 10), color: colors.textMuted, letterSpacing: 0.6 }}>LOGISTICS QUEUE</Text>
            <Text style={{ ...outfit('medium', 20), color: colors.textPrimary, marginTop: 6 }}>{fmtCount(dnOpen)}</Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textSecondary, marginTop: 6 }}>
              Delivery notes (unfinished / awaiting approval)
            </Text>
          </View>
          <View
            style={{
              width: '48%',
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
              flexGrow: 1,
            }}
          >
            <Text style={{ ...outfit('medium', 10), color: colors.textMuted, letterSpacing: 0.6 }}>WORK IN PROGRESS</Text>
            <Text style={{ ...outfit('medium', 20), color: colors.textPrimary, marginTop: 6 }}>{fmtCount(mobileSummary?.my_requisitions_open)}</Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textSecondary, marginTop: 6 }}>
              Open requisitions · leave in progress: {fmtCount(leaveP)}
            </Text>
          </View>
        </View>

        {financeVisible && revenueMonths.length > 0 ? (
          <>
            <Text
              style={{
                ...outfit('medium', 11),
                color: colors.textMuted,
                letterSpacing: 0.66,
                textTransform: 'uppercase',
                paddingHorizontal: 16,
                marginBottom: 8,
              }}
            >
              Revenue trend
            </Text>
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 8,
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginBottom: 10 }}>
                Last six months · invoiced totals
              </Text>
              <HomeRevenueChart months={revenueMonths} />
            </View>
          </>
        ) : null}

        {financeVisible && recentInvoices.length > 0 ? (
          <>
            <Text
              style={{
                ...outfit('medium', 11),
                color: colors.textMuted,
                letterSpacing: 0.66,
                textTransform: 'uppercase',
                paddingHorizontal: 16,
                marginBottom: 8,
                marginTop: 4,
              }}
            >
              Recent invoices
            </Text>
            {recentInvoices.map((inv) => (
              <Pressable
                key={inv.id}
                onPress={() => openRecentInvoice(inv.id, inv.invoice_no || `#${inv.id}`)}
                style={({ pressed }) => ({
                  marginHorizontal: 16,
                  marginBottom: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: 0.5,
                  borderColor: colors.borderSubtle,
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ ...outfit('medium', 12), color: colors.linkBlue }}>{inv.invoice_no || `#${inv.id}`}</Text>
                  <StatusBadge label={invoiceStatusBadgeLabel(inv.status_label)} />
                </View>
                <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 6 }} numberOfLines={2}>
                  {inv.customer_name ?? 'Customer'}
                </Text>
                <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 6 }}>
                  {inv.invoice_date ?? '—'} · {fmtMoney(inv.total_amount)}
                </Text>
              </Pressable>
            ))}
          </>
        ) : null}

        {homeQuickTiles.length > 0 ? (
          <>
        <Text
          style={{
            ...outfit('medium', 11),
            color: colors.textMuted,
            letterSpacing: 0.66,
            textTransform: 'uppercase',
            paddingHorizontal: 16,
            marginBottom: 8,
          }}
        >
          Quick actions
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 }}>
          {homeQuickTiles.map((row) => (
            <Pressable
              key={row.key}
              onPress={() => {
                if (row.kind === 'store_movement') {
                  setPortalActiveTab('modules');
                  setPortalSelectedModule('Store movements');
                  navigation.navigate('Modules', { screen: 'StoreMovementHeader', params: {} });
                  return;
                }
                if (row.kind === 'leave_form') {
                  setPortalActiveTab('modules');
                  setPortalSelectedModule('Leave Requests');
                  navigation.navigate('Modules', { screen: 'LeaveRequestForm' });
                  return;
                }
                if (row.kind === 'payslip_tab') {
                  setPortalActiveTab('payslip');
                  navigateToPayslipTab(navigation);
                  return;
                }
                if (row.kind === 'module_list') {
                  setPortalActiveTab('modules');
                  setPortalSelectedModule(row.moduleRoute);
                  navigation.navigate('Modules', { screen: 'ModuleList', params: { moduleRoute: row.moduleRoute } });
                }
              }}
              style={{
                width: '48%',
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 12,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="flash-outline" size={16} color={colors.primaryNavy} style={{ marginRight: 8 }} />
              <Text style={{ ...outfit('medium', 12), color: colors.textPrimary, flex: 1 }}>{row.label}</Text>
            </Pressable>
          ))}
        </View>
          </>
        ) : null}

        {approvalsAccessible ? (
          <>
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <ApprovalModuleScorePanel
            total={attention ?? 0}
            modules={approvalModuleScores}
            onSelectAll={() => goApprovals()}
            onSelectModule={onApprovalModulePress}
            compact
          />
        </View>
        <Text
          style={{
            ...outfit('medium', 11),
            color: colors.textMuted,
            letterSpacing: 0.66,
            textTransform: 'uppercase',
            paddingHorizontal: 16,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Approvals in queue
        </Text>
        {summaryLoading && mobileSummary == null ? (
          <Text style={{ paddingHorizontal: 16, ...outfit('regular', 13), color: colors.textSecondary }}>Loading…</Text>
        ) : null}
        {approvalItems.slice(0, 3).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              setPortalActiveTab('modules');
              setPortalSelectedModule('Approvals');
              navigation.navigate('Modules', {
                screen: 'RecordDetail',
                params: {
                  moduleRoute: 'Approvals',
                  detailKind: 'approval',
                  recordId: item.id,
                  titleHint: item.ref,
                },
              });
            }}
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ ...outfit('medium', 12), color: colors.linkBlue }}>{item.ref}</Text>
              <StatusBadge label={item.status === 'Approved' || item.status === 'Rejected' ? item.status : 'Pending'} />
            </View>
            <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 6 }} numberOfLines={2}>
              {item.subject}
            </Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 6 }}>
              {item.type} · {item.owner}
            </Text>
          </Pressable>
        ))}
        {approvalItems.length === 0 ? (
          <Text style={{ paddingHorizontal: 16, ...outfit('regular', 13), color: colors.textSecondary }}>No pending approvals.</Text>
        ) : null}
        {approvalItems.length > 0 ? (
          <Pressable
            onPress={() => {
              setPortalActiveTab('modules');
              setPortalSelectedModule('Approvals');
              goApprovals();
            }}
            style={{ paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Text style={{ ...outfit('medium', 13), color: colors.linkBlue }}>View all approvals</Text>
          </Pressable>
        ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
