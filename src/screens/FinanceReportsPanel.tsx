import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { SimpleBarChart } from '../components/reports/SimpleBarChart';
import {
  type BalanceSheetReport,
  type CashFlowReport,
  type DailyInvoicesReport,
  type FinanceReportPreset,
  type OverdueInvoicesReport,
  type ProfitAndLossReport,
  type SupplierWhtMonthlyReport,
  type TrialBalanceReport,
  type ArSummaryReport,
  getFinanceReportArSummary,
  getFinanceReportBalanceSheet,
  getFinanceReportCashFlow,
  getFinanceReportDailyInvoices,
  getFinanceReportOverdueInvoices,
  getFinanceReportProfitAndLoss,
  getFinanceReportSupplierWhtMonthly,
  getFinanceReportTrialBalance,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { styles } from '../styles/appStyles';
import type { FinanceReportMobileModule } from '../utils/financeReportPortal';
import { webErpUrl } from '../utils/webErpUrls';

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  moduleRoute: FinanceReportMobileModule;
  webPath?: string;
  onOpenCustomerInvoice?: (id: string, titleHint?: string) => void;
};

export function FinanceReportsPanel({ moduleRoute, webPath, onOpenCustomerInvoice }: Props) {
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
  const [bs, setBs] = useState<BalanceSheetReport | null>(null);
  const [cf, setCf] = useState<CashFlowReport | null>(null);
  const [wht, setWht] = useState<SupplierWhtMonthlyReport | null>(null);

  const showPreset = useMemo(() => {
    return (
      moduleRoute === 'Report trial balance' ||
      moduleRoute === 'Report profit and loss' ||
      moduleRoute === 'Report cash flow'
    );
  }, [moduleRoute]);

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
        case 'Report profit and loss':
          setPnl((await getFinanceReportProfitAndLoss(token, preset)).data);
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
        default:
          break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report.');
    } finally {
      setLoading(false);
      setPullRefreshing(false);
    }
  }, [token, moduleRoute, preset, whtYear]);

  useEffect(() => {
    void load('initial');
  }, [load]);

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
  const webFooter =
    webPathTrimmed !== '' ? (
      <Pressable
        onPress={() => void Linking.openURL(webErpUrl(webPathTrimmed))}
        style={{
          marginTop: 20,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: colors.primaryNavy,
          alignItems: 'center',
        }}
      >
        <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Open full report in web ERP</Text>
        <Text style={{ ...outfit('regular', 11), color: 'rgba(255,255,255,0.75)', marginTop: 6, textAlign: 'center' }}>
          Tables, PDF export, and filters
        </Text>
      </Pressable>
    ) : null;

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
          <SimpleBarChart points={chartPts} barColor={colors.accentTeal} />
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
          <SimpleBarChart points={chartPts} />
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
  } else if (moduleRoute === 'Report profit and loss' && pnl) {
    const trendPts = (pnl.trend ?? []).map((t) => ({ label: t.label, amount: t.net_profit }));
    body = (
      <>
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted }}>
          {pnl.from} → {pnl.to}
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
              <SimpleBarChart points={trendPts} barColor={colors.accentTeal} />
            </View>
          </>
        ) : null}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 22 }}>Income ({fmtMoney(pnl.totals.income)})</Text>
        {pnl.income.slice(0, 40).map((r) => (
          <View key={r.account.id} style={[styles.approvalLineRow, { marginTop: 6 }]}>
            <Text style={styles.approvalType} numberOfLines={2}>
              {r.account.code} {r.account.name}
            </Text>
            <Text style={styles.meta}>{fmtMoney(r.amount)}</Text>
          </View>
        ))}
        <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 16 }}>Expenses ({fmtMoney(pnl.totals.expenses)})</Text>
        {pnl.expenses.slice(0, 40).map((r) => (
          <View key={r.account.id} style={[styles.approvalLineRow, { marginTop: 6 }]}>
            <Text style={styles.approvalType} numberOfLines={2}>
              {r.account.code} {r.account.name}
            </Text>
            <Text style={styles.meta}>{fmtMoney(r.amount)}</Text>
          </View>
        ))}
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
          <SimpleBarChart points={cfPts} barColor={colors.accentTeal} />
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
          <SimpleBarChart points={chartPts} barColor={colors.accentTeal} />
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
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={() => void load('pull')} tintColor={colors.accentTeal} />}
    >
      <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
        Snapshot for quick decisions; use the web ERP for official printing and detailed filters.
      </Text>
      {showPreset ? presetChips : null}
      {body}
      {webFooter}
    </ScrollView>
  );
}
