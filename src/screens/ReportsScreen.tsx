import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { SimpleBarChart } from '../components/reports/SimpleBarChart';
import { getMobileOperationalReports, type MobileOperationalReports } from '../api';
import { PortalHeaderActions } from '../components/PortalHeaderActions';
import { TopBar } from '../components/TopBar';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { CATEGORY_LABELS, colorFamilyForSurfaceId, moduleColorStyles, moduleIconForSurfaceId } from '../constants/modulePresentation';
import { isPortalModuleRouteAccessible } from '../utils/portalModuleAccess';
import { reportSurfacesByCategory, reportSurfacesFromPortal } from '../utils/reportPortal';

function fmtCount(n: number | null | undefined): string {
  return n == null ? '—' : String(n);
}

type StatusCardProps = {
  label: string;
  value: string;
  hint?: string;
  onPress?: () => void;
  accent?: string;
  wide?: boolean;
};

function StatusCard({ label, value, hint, onPress, accent, wide }: StatusCardProps) {
  const inner = (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 12,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        minHeight: 92,
      }}
    >
      <Text style={{ ...outfit('medium', 10), color: colors.textMuted, letterSpacing: 0.4 }} numberOfLines={2}>
        {label}
      </Text>
      <Text style={{ ...outfit('medium', 22), color: accent ?? colors.textPrimary, marginTop: 8 }}>{value}</Text>
      {hint ? (
        <Text style={{ ...outfit('regular', 11), color: colors.textSecondary, marginTop: 6 }} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );

  const wrapStyle = wide ? { width: '100%' as const, marginBottom: 10 } : { width: '48%' as const, minWidth: '48%' as const, flexGrow: 1 };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={wrapStyle}>
        {inner}
      </Pressable>
    );
  }
  return <View style={wrapStyle}>{inner}</View>;
}

function OperationalInsights({
  data,
  loading,
}: {
  data: MobileOperationalReports | null;
  loading: boolean;
}) {
  const consumption = data?.store_consumption;
  const movements = data?.movements;
  const procurement = data?.procurement;
  const stock = data?.stock;

  const hasAny = Boolean(consumption || movements || procurement || stock);
  if (!hasAny && !loading) {
    return null;
  }

  const consumptionPoints = (consumption?.by_month ?? []).map((m) => ({ label: m.label, amount: m.amount }));
  const movementPoints = (movements?.by_month ?? []).map((m) => ({ label: m.label, amount: m.total }));
  const procurementPoints = (procurement?.by_month ?? []).map((m) => ({
    label: m.label,
    amount: m.purchase_orders + m.requisitions,
  }));

  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ ...outfit('medium', 11), color: colors.textMuted, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>
        Trends
      </Text>
      {loading && !data ? <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 12 }} /> : null}

      {stock ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            marginBottom: 12,
          }}
        >
          <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>Stock overview</Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <View>
              <Text style={{ ...outfit('medium', 10), color: colors.textMuted }}>STORES</Text>
              <Text style={{ ...outfit('medium', 20), color: colors.primaryNavy, marginTop: 4 }}>{stock.stores}</Text>
            </View>
            {stock.low_stock_lines != null ? (
              <View>
                <Text style={{ ...outfit('medium', 10), color: colors.textMuted }}>LINES TRACKED</Text>
                <Text style={{ ...outfit('medium', 20), color: colors.textPrimary, marginTop: 4 }}>{stock.low_stock_lines}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {consumption && consumptionPoints.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            marginBottom: 12,
          }}
        >
          <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>Store → kitchen consumption</Text>
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
            {consumption.headers_30d} movements ·{' '}
            {consumption.quantity_30d != null
              ? `${consumption.quantity_30d.toLocaleString('en-TZ', { maximumFractionDigits: 0 })} qty (30d)`
              : 'qty n/a'}
          </Text>
          <View style={{ marginTop: 14 }}>
            <SimpleBarChart
              points={consumptionPoints}
              barColor={colors.primaryNavy}
              legend={[{ label: 'Quantity issued (store → kitchen)', color: colors.primaryNavy }]}
            />
          </View>
        </View>
      ) : null}

      {movements && movementPoints.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            marginBottom: 12,
          }}
        >
          <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>Movement volume</Text>
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
            K→S {fmtCount(movements.kitchen_to_store_30d)} · S→K {fmtCount(movements.store_to_kitchen_30d)} (30 days)
          </Text>
          <View style={{ marginTop: 14 }}>
            <SimpleBarChart
              points={movementPoints}
              legend={[{ label: 'Total movement documents (K↔S)', color: colors.accentTeal }]}
            />
          </View>
        </View>
      ) : null}

      {procurement && procurementPoints.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>Purchasing activity</Text>
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
            Open POs {fmtCount(procurement.open_purchase_orders)} · Open reqs {fmtCount(procurement.open_requisitions)}
          </Text>
          <View style={{ marginTop: 14 }}>
            <SimpleBarChart
              points={procurementPoints}
              barColor="#5B7FD6"
              legend={[{ label: 'Open POs + open requisitions (per month)', color: '#5B7FD6' }]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function ReportsScreen() {
  const navigation = useNavigation<any>();
  const sp = useStaffPortal();
  const {
    setPortalActiveTab,
    portal,
    token,
    mobileSummary,
    mobileSummaryUpdatedAt,
    mobileSummaryError,
    summaryLoading,
    approvalSummary,
    refreshing,
    onPullRefresh,
    loadMobileSummary,
    loadApprovalSummary,
  } = sp;

  const [operational, setOperational] = useState<MobileOperationalReports | null>(null);
  const [operationalLoading, setOperationalLoading] = useState(false);

  const reportRows = useMemo(() => reportSurfacesFromPortal(portal), [portal]);
  const reportGroups = useMemo(() => reportSurfacesByCategory(reportRows), [reportRows]);
  const financeVisible = mobileSummary?.revenue_by_month != null;
  const approvalsAccessible = isPortalModuleRouteAccessible(portal, 'Approvals');

  const loadOperational = useCallback(async () => {
    if (!token) return;
    setOperationalLoading(true);
    try {
      const res = await getMobileOperationalReports(token);
      setOperational(res.data);
    } catch {
      setOperational(null);
    } finally {
      setOperationalLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('reports');
      void loadMobileSummary();
      void loadApprovalSummary();
      void loadOperational();
    }, [setPortalActiveTab, loadMobileSummary, loadApprovalSummary, loadOperational]),
  );

  const openReport = (route: string) => {
    setPortalActiveTab('modules');
    navigation.navigate('Modules', { screen: 'ModuleList', params: { moduleRoute: route } });
  };

  const openApprovals = () => {
    if (!approvalsAccessible) return;
    setPortalActiveTab('modules');
    navigation.navigate('Modules', { screen: 'Approvals', params: {} });
  };

  const pendingApprovals = fmtCount(approvalSummary?.total ?? mobileSummary?.pending_approvals);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title="Reports"
        subtitle={
          mobileSummaryUpdatedAt
            ? `Status snapshot · Updated ${mobileSummaryUpdatedAt}`
            : 'Status snapshot · inventory, purchasing & finance'
        }
        right={<PortalHeaderActions />}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.accentTeal} />}
      >
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>
          Status
        </Text>
        {summaryLoading && !mobileSummary ? (
          <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 16 }} />
        ) : null}
        {mobileSummaryError ? (
          <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginBottom: 12 }}>{mobileSummaryError}</Text>
        ) : null}

        <StatusCard
          label="Pending approvals"
          value={pendingApprovals}
          hint={approvalsAccessible ? 'Tap to open inbox' : 'Not enabled'}
          accent={colors.statusPendingText}
          onPress={approvalsAccessible ? openApprovals : undefined}
          wide
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 20 }}>
          {financeVisible ? (
            <StatusCard label="Invoices · queue" value={fmtCount(mobileSummary?.invoices_pending_approval)} hint="Awaiting approval" />
          ) : null}
          {financeVisible ? (
            <StatusCard label="Invoices · overdue" value={fmtCount(mobileSummary?.invoices_overdue)} hint="Past due date" />
          ) : null}
          <StatusCard label="Delivery notes" value={fmtCount(mobileSummary?.delivery_notes_open)} hint="Open / pending" />
          <StatusCard
            label="Requisitions"
            value={fmtCount(mobileSummary?.my_requisitions_open)}
            hint={`Leave pending: ${fmtCount(mobileSummary?.pending_leave_requests)}`}
          />
          <StatusCard label="Support tickets" value={fmtCount(mobileSummary?.open_support_tickets)} hint="Open requests" />
          {financeVisible && mobileSummary?.revenue_this_month != null ? (
            <StatusCard
              label="Revenue (month)"
              value={`TZS ${mobileSummary.revenue_this_month.toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`}
              hint={
                mobileSummary.revenue_trend_pct != null
                  ? `Vs last month: ${mobileSummary.revenue_trend_pct > 0 ? '+' : ''}${mobileSummary.revenue_trend_pct}%`
                  : undefined
              }
            />
          ) : null}
        </View>

        <OperationalInsights data={operational} loading={operationalLoading} />

        <Text style={{ ...outfit('medium', 11), color: colors.textMuted, letterSpacing: 0.66, textTransform: 'uppercase', marginBottom: 10 }}>
          Available reports
        </Text>
        {reportGroups.length === 0 ? (
          <View style={{ padding: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>No report modules yet</Text>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
              Pull to refresh after your admin updates mobile access. Stock, purchasing, and finance reports appear here when your role has the same permissions as on the web ERP.
            </Text>
          </View>
        ) : (
          reportGroups.map((group) => (
            <View key={group.key} style={{ marginBottom: 18 }}>
              <Text style={{ ...outfit('medium', 12), color: colors.textSecondary, marginBottom: 8 }}>
                {CATEGORY_LABELS[group.key] ?? group.label}
              </Text>
              {group.items.map((row) => {
                const fam = moduleColorStyles(colorFamilyForSurfaceId(row.id));
                const icon = moduleIconForSurfaceId(row.id) as keyof typeof Ionicons.glyphMap;
                return (
                  <Pressable
                    key={row.id}
                    onPress={() => openReport(row.route!)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      marginBottom: 8,
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      borderWidth: 0.5,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: fam.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name={icon} size={22} color={fam.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{row.label ?? row.route}</Text>
                      {row.description ? (
                        <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }} numberOfLines={2}>
                          {row.description}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
