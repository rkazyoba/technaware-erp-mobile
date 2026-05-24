import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { PnLAccountActivityModal } from '../components/reports/PnLAccountActivityModal';
import { ReportWebExportPanel } from '../components/reports/ReportWebExportPanel';
import { SimpleBarChart } from '../components/reports/SimpleBarChart';
import {
  type BalanceSheetReport,
  type CashFlowReport,
  type DailyInvoicesReport,
  type FinanceReportPreset,
  type OverdueInvoicesReport,
  type ProfitAndLossReport,
  type SitePerformanceReport,
  type SupplierWhtMonthlyReport,
  type TrialBalanceReport,
  type ArSummaryReport,
  type BudgetListItem,
  type BudgetVsActualReport,
  getFinanceBudgetList,
  getFinanceBudgetVsActual,
  getFinanceReportArSummary,
  getFinanceReportBalanceSheet,
  getFinanceReportCashFlow,
  getFinanceReportDailyInvoices,
  getFinanceReportOverdueInvoices,
  getFinanceReportProfitAndLoss,
  getFinanceReportSitePerformance,
  getFinanceReportSupplierWhtMonthly,
  getFinanceReportTrialBalance,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { styles } from '../styles/appStyles';
import type { FinanceReportMobileModule } from '../utils/financeReportPortal';
import { reportWebPdfPath, type ReportPdfBuildParams } from '../utils/reportWebPdfUrls';

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  moduleRoute: FinanceReportMobileModule;
  webPath?: string;
  /** Applied when navigating from Site performance → P&L */
  initialPnlSiteId?: string;
  initialPreset?: FinanceReportPreset;
  onNavigateToProfitAndLoss?: (siteId: string, preset: FinanceReportPreset) => void;
  onOpenCustomerInvoice?: (id: string, titleHint?: string) => void;
  onOpenJournalEntry?: (id: string, titleHint?: string) => void;
};

export function FinanceReportsPanel({
  moduleRoute,
  webPath,
  initialPnlSiteId,
  initialPreset,
  onNavigateToProfitAndLoss,
  onOpenCustomerInvoice,
  onOpenJournalEntry,
}: Props) {
  const { token } = useStaffPortal();
  const [loading, setLoading] = useState(true);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<FinanceReportPreset>('mtd');
  const [whtYear, setWhtYear] = useState(() => new Date().getFullYear());

  const [overdue, setOverdue] = useState<OverdueInvoicesReport | null>(null);
  const [daily, setDaily] = useState<DailyInvoicesReport | null>(null);
  const [ar, setAr] = useState<ArSummaryReport | null>(null);
  const [tb, setTb] = useState<TrialBalanceReport | null>(null);
  const [pnl, setPnl] = useState<ProfitAndLossReport | null>(null);
  /** '' = whole company, 'unallocated' = corporate only, else site id string */
  const [pnlSiteFilter, setPnlSiteFilter] = useState<string>('');
  const [sitePerf, setSitePerf] = useState<SitePerformanceReport | null>(null);
  const [bs, setBs] = useState<BalanceSheetReport | null>(null);
  const [cf, setCf] = useState<CashFlowReport | null>(null);
  const [wht, setWht] = useState<SupplierWhtMonthlyReport | null>(null);
  const [budgetList, setBudgetList] = useState<BudgetListItem[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [budgetReport, setBudgetReport] = useState<BudgetVsActualReport | null>(null);
  const [pnlActivityAccount, setPnlActivityAccount] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (initialPreset) setPreset(initialPreset);
  }, [initialPreset]);

  useEffect(() => {
    if (moduleRoute === 'Report profit and loss' && initialPnlSiteId !== undefined) {
      setPnlSiteFilter(initialPnlSiteId);
    }
  }, [moduleRoute, initialPnlSiteId]);

  const showPreset = useMemo(() => {
    return (
      moduleRoute === 'Report trial balance' ||
      moduleRoute === 'Report profit and loss' ||
      moduleRoute === 'Report site performance' ||
      moduleRoute === 'Report cash flow'
    );
  }, [moduleRoute]);

  const pnlSiteIdParam = useMemo(() => {
    if (pnlSiteFilter === '' || pnlSiteFilter === 'all') return undefined;
    if (pnlSiteFilter === 'unallocated') return 'unallocated';
    return pnlSiteFilter;
  }, [pnlSiteFilter]);

  const load = useCallback(async (mode: 'initial' | 'pull' = 'initial') => {
    if (!token) return;
    if (mode === 'pull') {
      setPullRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      switch (moduleRoute) {
        case 'Overdue invoices':
          setOverdue((await getFinanceReportOverdueInvoices(token)).data);
          break;
        case 'Daily invoice report':
          setDaily((await getFinanceReportDailyInvoices(token)).data);
          break;
        case 'Customer statements':
          setAr((await getFinanceReportArSummary(token)).data);
          break;
        case 'Report trial balance':
          setTb((await getFinanceReportTrialBalance(token, preset)).data);
          break;
        case 'Report profit and loss': {
          const [pnlRes, siteRes] = await Promise.all([
            getFinanceReportProfitAndLoss(token, preset, undefined, undefined, pnlSiteIdParam),
            getFinanceReportSitePerformance(token, preset),
          ]);
          setPnl(pnlRes.data);
          setSitePerf(siteRes.data);
          break;
        }
        case 'Report site performance':
          setSitePerf((await getFinanceReportSitePerformance(token, preset)).data);
          break;
        case 'Report balance sheet':
          setBs((await getFinanceReportBalanceSheet(token)).data);
          break;
        case 'Report cash flow':
          setCf((await getFinanceReportCashFlow(token, preset)).data);
          break;
        case 'Report supplier WHT monthly':
          setWht((await getFinanceReportSupplierWhtMonthly(token, whtYear)).data);
          break;
        case 'Report budget vs actual': {
          const listRes = await getFinanceBudgetList(token);
          const list = listRes.data.budgets ?? [];
          setBudgetList(list);
          const pick =
            selectedBudgetId && list.some((b) => b.id === selectedBudgetId)
              ? selectedBudgetId
              : list.find((b) => b.status === 'active')?.id ?? list[0]?.id ?? null;
          setSelectedBudgetId(pick);
          if (pick) {
            setBudgetReport((await getFinanceBudgetVsActual(token, pick)).data);
          } else {
            setBudgetReport(null);
          }
          break;
        }
        default:
          break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report.');
    } finally {
      setLoading(false);
      setPullRefreshing(false);
    }
  }, [token, moduleRoute, preset, whtYear, selectedBudgetId, pnlSiteIdParam]);

  const selectBudget = useCallback(
    async (id: string) => {
      if (!token) return;
      setSelectedBudgetId(id);
      setLoading(true);
      setError(null);
      try {
        setBudgetReport((await getFinanceBudgetVsActual(token, id)).data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load budget.');
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  const siteFilterChips =
    moduleRoute === 'Report profit and loss' && sitePerf ? (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ ...outfit('medium', 12), color: colors.textSecondary, marginBottom: 8 }}>Site scope</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            { id: '', label: 'All sites' },
            { id: 'unallocated', label: 'Corporate' },
            ...(sitePerf.sites ?? []).map((s) => ({
              id: String(s.site_id),
              label: s.site_name.length > 22 ? `${s.site_name.slice(0, 20)}…` : s.site_name,
            })),
          ].map((opt) => {
            const selected = pnlSiteFilter === opt.id;
            return (
              <Pressable
                key={opt.id || 'all'}
                onPress={() => setPnlSiteFilter(opt.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selected ? colors.primaryNavy : colors.surface,
                  borderWidth: 0.5,
                  borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                }}
              >
                <Text style={{ ...outfit('medium', 11), color: selected ? '#fff' : colors.textPrimary }}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    ) : null;

  const presetChips = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {(['mtd', 'ytd', 'last_month'] as const).map((p) => {
        const selected = preset === p;
        const label = p === 'mtd' ? 'MTD' : p === 'ytd' ? 'YTD' : 'Last month';
        return (
          <Pressable
            key={p}
            onPress={() => setPreset(p)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: selected ? colors.primaryNavy : colors.surface,
              borderWidth: 0.5,
              borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
            }}
          >
            <Text style={{ ...outfit('medium', 12), color: selected ? '#fff' : colors.textPrimary }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const webPathTrimmed = webPath?.trim() ?? '';

  const pdfBuildParams = useMemo((): ReportPdfBuildParams => {
    const periodPreset = (tb?.preset ?? pnl?.preset ?? cf?.preset ?? preset) as ReportPdfBuildParams['preset'];
    switch (moduleRoute) {
      case 'Report trial balance':
        return { preset: periodPreset, from: tb?.from, to: tb?.to };
      case 'Report profit and loss':
        return { preset: periodPreset, from: pnl?.from, to: pnl?.to, siteId: pnlSiteIdParam };
      case 'Report balance sheet':
        return { asOf: bs?.as_of };
      case 'Report cash flow':
        return { preset: periodPreset, from: cf?.from, to: cf?.to };
      case 'Daily invoice report':
        return { from: daily?.from, to: daily?.to };
      default:
        return { preset: periodPreset };
    }
  }, [moduleRoute, preset, tb, pnl, bs, cf, daily, pnlSiteIdParam]);

  const pdfPath = useMemo(() => reportWebPdfPath(moduleRoute, pdfBuildParams), [moduleRoute, pdfBuildParams]);

  const openPnlAccountActivity = (account: { id: string; code: string; name: string }) => {
    setPnlActivityAccount({ id: account.id, label: `${account.code} ${account.name}`.trim() });
  };

  const renderPnlAccountRows = (
    rows: ProfitAndLossReport['income'],
    emptyLabel: string,
  ) =>
    rows.length === 0 ? (
      <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 6 }}>{emptyLabel}</Text>
    ) : (
      rows.map((r) => (
        <Pressable
          key={r.account.id}
          style={[styles.approvalLineRow, { marginTop: 6 }]}
          onPress={() => openPnlAccountActivity(r.account)}
        >
          <Text style={styles.approvalType} numberOfLines={2}>
            {r.account.code} {r.account.name}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.meta}>{fmtMoney(r.amount)}</Text>
            <Text style={{ ...outfit('medium', 10), color: colors.accentTeal, marginTop: 2 }}>Journals</Text>
          </View>
        </Pressable>
      ))
    );

  let body: ReactNode = null;

  if (loading && !error) {
    body = (
      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 12 }}>Loading report…</Text>
      </View>
    );
  } else if (error) {
    body = (
      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyStateTitle}>Could not load report</Text>
        <Text style={styles.emptyStateText}>{error}</Text>
        <Pressable style={styles.detailsButton} onPress={() => void load('initial')}>
          <Text style={styles.detailsButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  } else if (moduleRoute === 'Overdue invoices' && overdue) {
    const chartPts = overdue.by_due_month.slice(-6).map((r) => ({ label: r.period.slice(5), amount: r.amount }));
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>As of {overdue.as_of}</Text>
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Overdue invoices</Text>
            <Text style={{ ...outfit('medium', 22), color: colors.primaryNavy, marginTop: 4 }}>{overdue.kpis.count}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Total overdue</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(overdue.kpis.total_amount)}</Text>
          </View>
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>By due month (amount)</Text>
        <View style={{ marginTop: 10 }}>
          <SimpleBarChart points={chartPts} barColor={colors.accentTeal} valueMode="money" />
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Aging</Text>
        {overdue.aging.buckets.map((b) => (
          <View key={b.key} style={[styles.approvalLineRow, { marginTop: 8 }]}>
            <Text style={styles.approvalType}>{b.label}</Text>
            <Text style={styles.meta}>
              {b.count} · {fmtMoney(b.amount)}
            </Text>
          </View>
        ))}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Largest overdue</Text>
        {overdue.top.map((row) => (
          <Pressable
            key={row.id}
            style={[styles.approvalCard, { marginTop: 10 }]}
            onPress={() => onOpenCustomerInvoice?.(row.id, row.invoice_no)}
          >
            <View style={styles.approvalHeader}>
              <Text style={styles.approvalId}>{row.invoice_no}</Text>
              <Text style={styles.approvalStatus}>{fmtMoney(row.amount)}</Text>
            </View>
            <Text style={styles.approvalSubject} numberOfLines={2}>
              {row.customer_name ?? '—'}
            </Text>
            <Text style={styles.approvalOwner}>
              Due {row.due_date ?? '—'}
              {row.days_overdue != null ? ` · ${row.days_overdue}d overdue` : ''}
            </Text>
            {onOpenCustomerInvoice ? <Text style={{ ...styles.meta, marginTop: 6 }}>Tap for invoice detail →</Text> : null}
          </Pressable>
        ))}
      </>
    );
  } else if (moduleRoute === 'Daily invoice report' && daily) {
    const chartPts = daily.series.map((r) => ({ label: r.date.slice(8), amount: r.amount }));
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>
          {daily.from} → {daily.to}
        </Text>
        <View style={{ marginTop: 14, flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Approved invoices</Text>
            <Text style={{ ...outfit('medium', 22), color: colors.primaryNavy, marginTop: 4 }}>{daily.totals.count}</Text>
          </View>
          <View style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Total invoiced</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(daily.totals.amount)}</Text>
          </View>
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Invoiced by day</Text>
        <View style={{ marginTop: 10 }}>
          <SimpleBarChart points={chartPts} valueMode="money" />
        </View>
      </>
    );
  } else if (moduleRoute === 'Customer statements' && ar) {
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>As of {ar.as_of}</Text>
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Open AR</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(ar.kpis.open_amount)}</Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{ar.kpis.open_invoices} invoices</Text>
          </View>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Overdue AR</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(ar.kpis.overdue_amount)}</Text>
            <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{ar.kpis.overdue_invoices} invoices</Text>
          </View>
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Top customers by open balance</Text>
        {ar.top_customers.map((c) => (
          <View key={c.customer_id} style={[styles.approvalCard, { marginTop: 10 }]}>
            <View style={styles.approvalHeader}>
              <Text style={styles.approvalId} numberOfLines={1}>
                {c.customer_name}
              </Text>
              <Text style={styles.approvalStatus}>{fmtMoney(c.open_amount)}</Text>
            </View>
            <Text style={styles.approvalOwner}>
              Open {c.open_invoices} · Overdue {fmtMoney(c.overdue_amount)} ({c.overdue_invoices})
            </Text>
          </View>
        ))}
      </>
    );
  } else if (moduleRoute === 'Report trial balance' && tb) {
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>
          {tb.from} → {tb.to}
        </Text>
        <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Totals (closing)</Text>
          <Text style={{ ...outfit('medium', 16), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(tb.totals.closing)}</Text>
          <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 6 }}>
            Debit {fmtMoney(tb.totals.period_debit)} · Credit {fmtMoney(tb.totals.period_credit)}
          </Text>
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 18 }}>Accounts ({tb.rows.length})</Text>
        {tb.rows.slice(0, 80).map((r) => (
          <View key={r.account.id} style={[styles.approvalLineRow, { marginTop: 6 }]}>
            <Text style={styles.approvalType} numberOfLines={2}>
              {r.account.code} {r.account.name}
            </Text>
            <Text style={styles.meta}>{fmtMoney(r.closing)}</Text>
          </View>
        ))}
        {tb.rows.length > 80 ? (
          <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 8 }}>Showing first 80 rows…</Text>
        ) : null}
      </>
    );
  } else if (moduleRoute === 'Report site performance' && sitePerf) {
    const sp = sitePerf;
    const chartPts = [...sp.sites]
      .sort((a, b) => b.totals.net_profit - a.totals.net_profit)
      .slice(0, 8)
      .map((s) => ({
        label: (s.site_code || String(s.site_id)).slice(0, 8),
        amount: s.totals.net_profit,
      }));
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>
          {sp.from} → {sp.to} · Company #{sp.company_id}
        </Text>
        <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 6 }}>
          Use YTD for historic bulk-imported data. Tap a site for profit & loss detail; tap account lines there for journal breakdown.
        </Text>
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Company net profit</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(sp.company.totals.net_profit)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Company income</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(sp.company.totals.income)}</Text>
          </View>
        </View>
        {chartPts.length > 0 ? (
          <>
            <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Top sites by net profit</Text>
            <View style={{ marginTop: 10 }}>
              <SimpleBarChart points={chartPts} barColor={colors.accentTeal} valueMode="money" />
            </View>
          </>
        ) : null}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>By site ({sp.sites.length})</Text>
        {sp.sites.map((row) => (
          <Pressable
            key={row.site_id}
            style={[styles.approvalCard, { marginTop: 10 }]}
            onPress={() => onNavigateToProfitAndLoss?.(String(row.site_id), preset)}
            disabled={!onNavigateToProfitAndLoss}
          >
            <View style={styles.approvalHeader}>
              <Text style={styles.approvalId} numberOfLines={2}>
                {row.site_name}
              </Text>
              <Text style={styles.approvalStatus}>{fmtMoney(row.totals.net_profit)}</Text>
            </View>
            <Text style={styles.approvalOwner}>
              Income {fmtMoney(row.totals.income)} · COGS {fmtMoney(row.totals.cogs)} · Expenses {fmtMoney(row.totals.expenses)}
            </Text>
            <Text style={{ ...styles.meta, marginTop: 4 }}>{row.site_code}</Text>
            {onNavigateToProfitAndLoss ? (
              <Text style={{ ...outfit('medium', 11), color: colors.accentTeal, marginTop: 8 }}>View profit & loss →</Text>
            ) : null}
          </Pressable>
        ))}
        <Pressable
          style={[styles.approvalLineRow, { marginTop: 16 }]}
          onPress={() => onNavigateToProfitAndLoss?.('unallocated', preset)}
          disabled={!onNavigateToProfitAndLoss}
        >
          <Text style={styles.approvalType}>Unallocated / corporate</Text>
          <Text style={styles.meta}>{fmtMoney(sp.unallocated.totals.net_profit)}</Text>
        </Pressable>
        {onNavigateToProfitAndLoss ? (
          <Pressable style={{ marginTop: 12 }} onPress={() => onNavigateToProfitAndLoss('', preset)}>
            <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>Company-wide profit & loss →</Text>
          </Pressable>
        ) : null}
      </>
    );
  } else if (moduleRoute === 'Report profit and loss' && pnl) {
    const trendPts = (pnl.trend ?? []).map((t) => ({ label: t.label, amount: t.net_profit }));
    const siteLabel =
      pnlSiteFilter === ''
        ? 'All sites'
        : pnlSiteFilter === 'unallocated'
          ? 'Corporate only'
          : sitePerf?.sites.find((s) => String(s.site_id) === pnlSiteFilter)?.site_name ?? `Site #${pnlSiteFilter}`;
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>
          {pnl.from} → {pnl.to} · {siteLabel}
        </Text>
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Net profit</Text>
            <Text style={{ ...outfit('medium', 20), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(pnl.totals.net_profit)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Gross profit</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(pnl.totals.gross_profit)}</Text>
          </View>
        </View>
        {trendPts.length > 0 ? (
          <>
            <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Net profit trend</Text>
            <View style={{ marginTop: 10 }}>
              <SimpleBarChart points={trendPts} barColor={colors.accentTeal} valueMode="money" />
            </View>
          </>
        ) : null}
        <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 8 }}>
          Tap an account to see posted journal lines behind the amount.
        </Text>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 18 }}>Income ({fmtMoney(pnl.totals.income)})</Text>
        {renderPnlAccountRows(pnl.income.slice(0, 40), 'No income accounts in this period.')}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 16 }}>COGS ({fmtMoney(pnl.totals.cogs)})</Text>
        {renderPnlAccountRows(pnl.cogs.slice(0, 40), 'No COGS accounts in this period.')}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 16 }}>Expenses ({fmtMoney(pnl.totals.expenses)})</Text>
        {renderPnlAccountRows(pnl.expenses.slice(0, 40), 'No expense accounts in this period.')}
      </>
    );
  } else if (moduleRoute === 'Report balance sheet' && bs) {
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>As of {bs.as_of}</Text>
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Assets</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(bs.totals.assets)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Liabilities + equity</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(bs.totals.liabilities_equity)}</Text>
          </View>
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Assets</Text>
        {bs.assets.slice(0, 50).map((r) => (
          <View key={r.account.id} style={[styles.approvalLineRow, { marginTop: 6 }]}>
            <Text style={styles.approvalType} numberOfLines={2}>
              {r.account.code} {r.account.name}
            </Text>
            <Text style={styles.meta}>{fmtMoney(r.amount)}</Text>
          </View>
        ))}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 16 }}>Liabilities</Text>
        {bs.liabilities.slice(0, 40).map((r) => (
          <View key={r.account.id} style={[styles.approvalLineRow, { marginTop: 6 }]}>
            <Text style={styles.approvalType} numberOfLines={2}>
              {r.account.code} {r.account.name}
            </Text>
            <Text style={styles.meta}>{fmtMoney(r.amount)}</Text>
          </View>
        ))}
      </>
    );
  } else if (moduleRoute === 'Report cash flow' && cf) {
    const cfPts = [
      { label: 'Ops', amount: cf.totals.operating },
      { label: 'Inv', amount: cf.totals.investing },
      { label: 'Fin', amount: cf.totals.financing },
    ];
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>
          {cf.from} → {cf.to}
        </Text>
        <View style={{ marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Net change (indirect)</Text>
          <Text style={{ ...outfit('medium', 22), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(cf.totals.net_change)}</Text>
          <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 8 }}>
            Cash movement {fmtMoney(cf.totals.cash_delta)} · Recon Δ {fmtMoney(cf.totals.recon_difference)}
          </Text>
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>By section</Text>
        <View style={{ marginTop: 10 }}>
          <SimpleBarChart points={cfPts} barColor={colors.accentTeal} valueMode="money" />
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Operating</Text>
        {cf.sections.operating.map((line, i) => (
          <View key={`o-${i}`} style={[styles.approvalLineRow, { marginTop: 6 }]}>
            <Text style={styles.approvalType}>{line.label}</Text>
            <Text style={styles.meta}>{fmtMoney(line.amount)}</Text>
          </View>
        ))}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 16 }}>Investing</Text>
        {cf.sections.investing.map((line, i) => (
          <View key={`i-${i}`} style={[styles.approvalLineRow, { marginTop: 6 }]}>
            <Text style={styles.approvalType}>{line.label}</Text>
            <Text style={styles.meta}>{fmtMoney(line.amount)}</Text>
          </View>
        ))}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 16 }}>Financing</Text>
        {cf.sections.financing.map((line, i) => (
          <View key={`f-${i}`} style={[styles.approvalLineRow, { marginTop: 6 }]}>
            <Text style={styles.approvalType}>{line.label}</Text>
            <Text style={styles.meta}>{fmtMoney(line.amount)}</Text>
          </View>
        ))}
      </>
    );
  } else if (moduleRoute === 'Report supplier WHT monthly' && wht) {
    const chartPts = [...wht.rows].reverse().map((r) => ({
      label: r.period_ym.slice(5),
      amount: r.total_wht,
    }));
    body = (
      <>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Pressable onPress={() => setWhtYear((y) => y - 1)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface }}>
            <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>−</Text>
          </Pressable>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>{wht.year}</Text>
          <Pressable onPress={() => setWhtYear((y) => y + 1)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface }}>
            <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>+</Text>
          </Pressable>
        </View>
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>WHT by month</Text>
        <View style={{ marginTop: 10 }}>
          <SimpleBarChart points={chartPts} barColor={colors.accentTeal} valueMode="money" />
        </View>
        {wht.rows.map((r) => (
          <View key={r.period_ym} style={[styles.approvalCard, { marginTop: 10 }]}>
            <View style={styles.approvalHeader}>
              <Text style={styles.approvalId}>{r.period_ym}</Text>
              <Text style={styles.approvalStatus}>{fmtMoney(r.total_wht)}</Text>
            </View>
            <Text style={styles.approvalOwner}>
              Base {fmtMoney(r.total_base)} · {r.line_count} lines
            </Text>
          </View>
        ))}
      </>
    );
  } else if (moduleRoute === 'Report budget vs actual') {
    if (budgetList.length === 0 && !budgetReport) {
      body = (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No budgets</Text>
          <Text style={styles.emptyStateText}>Create and activate a budget in the web ERP under Accounting setup → Budgets.</Text>
        </View>
      );
    } else if (budgetReport) {
      const br = budgetReport;
      body = (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {budgetList.map((b) => {
              const selected = b.id === selectedBudgetId;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => void selectBudget(b.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selected ? colors.primaryNavy : colors.surface,
                    borderWidth: 0.5,
                    borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                    maxWidth: '100%',
                  }}
                >
                  <Text style={{ ...outfit('medium', 11), color: selected ? '#fff' : colors.textPrimary }} numberOfLines={2}>
                    {b.name} ({b.fiscal_year})
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>
            {br.budget.scope_label} · {br.period.from} → {br.as_of}
          </Text>
          <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Annual budget</Text>
              <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(br.totals.budget)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>YTD actual</Text>
              <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(br.totals.actual)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Available</Text>
              <Text style={{ ...outfit('medium', 18), color: br.totals.available < 0 ? colors.trendDown : colors.primaryNavy, marginTop: 4 }}>
                {fmtMoney(br.totals.available)}
              </Text>
            </View>
          </View>
          {br.totals.committed > 0 ? (
            <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 10 }}>
              Committed (pending requisitions): {fmtMoney(br.totals.committed)}
            </Text>
          ) : null}
          <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>By account</Text>
          {br.rows.map((r) => (
            <View key={r.account_id} style={[styles.approvalLineRow, { marginTop: 8 }]}>
              <Text style={styles.approvalType} numberOfLines={2}>
                {r.code} {r.name}
              </Text>
              <Text style={styles.meta}>
                {fmtMoney(r.actual)} / {fmtMoney(r.budget)}
                {r.pct_used != null ? ` (${r.pct_used}%)` : ''}
              </Text>
            </View>
          ))}
        </>
      );
    }
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={() => void load('pull')} tintColor={colors.accentTeal} />}
      >
        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
          Snapshot for quick decisions; use the web ERP for official printing and detailed filters.
        </Text>
        {showPreset ? presetChips : null}
        {siteFilterChips}
        {body}
        <ReportWebExportPanel webPath={webPathTrimmed || undefined} pdfPathOrUrl={pdfPath ?? undefined} />
      </ScrollView>
      <PnLAccountActivityModal
        visible={pnlActivityAccount !== null}
        token={token}
        accountId={pnlActivityAccount?.id ?? ''}
        accountLabel={pnlActivityAccount?.label ?? ''}
        preset={(pnl?.preset ?? preset) as FinanceReportPreset}
        from={pnl?.from}
        to={pnl?.to}
        siteId={pnlSiteIdParam ?? null}
        onClose={() => setPnlActivityAccount(null)}
        onOpenJournalEntry={
          onOpenJournalEntry
            ? (id, hint) => {
                setPnlActivityAccount(null);
                onOpenJournalEntry(id, hint);
              }
            : undefined
        }
      />
    </>
  );
}
