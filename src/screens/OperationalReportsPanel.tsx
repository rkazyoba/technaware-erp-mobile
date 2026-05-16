import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { SimpleBarChart } from '../components/reports/SimpleBarChart';
import { getMobileOperationalReports, type MobileOperationalReports } from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { OperationalReportMobileModule } from '../utils/operationalReportPortal';

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: '46%',
        backgroundColor: colors.pageBg,
        borderRadius: 12,
        padding: 12,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text style={{ ...outfit('medium', 10), color: colors.textMuted, letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ ...outfit('medium', 18), color: colors.textPrimary, marginTop: 6 }}>{value}</Text>
    </View>
  );
}

type Props = {
  moduleRoute: OperationalReportMobileModule;
};

export function OperationalReportsPanel({ moduleRoute }: Props) {
  const { token } = useStaffPortal();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MobileOperationalReports | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'pull' = 'initial') => {
      if (!token) return;
      if (mode === 'pull') setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await getMobileOperationalReports(token);
        setData(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load report.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const consumptionChart = useMemo(() => {
    const rows = data?.store_consumption?.by_month ?? [];
    return rows.map((m) => ({ label: m.label, amount: m.amount }));
  }, [data?.store_consumption?.by_month]);

  const movementChart = useMemo(() => {
    const rows = data?.movements?.by_month ?? [];
    return rows.map((m) => ({ label: m.label, amount: m.total }));
  }, [data?.movements?.by_month]);

  if (loading && !data) {
    return <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 24 }} />;
  }

  if (error) {
    return (
      <View style={{ padding: 16, margin: 16, backgroundColor: colors.surface, borderRadius: 14 }}>
        <Text style={{ color: colors.textPrimary }}>{error}</Text>
        <Pressable onPress={() => void load()} style={{ marginTop: 10 }}>
          <Text style={{ color: colors.linkBlue, fontWeight: '500' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('pull')} tintColor={colors.accentTeal} />}
    >
      {moduleRoute === 'Store consumption' && data?.store_consumption ? (
        <>
          <Text style={{ ...outfit('medium', 15), color: colors.textPrimary }}>Store → kitchen consumption</Text>
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4, marginBottom: 14 }}>
            Issued quantity from store to kitchen (last 30 days and 6-month trend).
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <StatPill label="MOVEMENTS (30D)" value={String(data.store_consumption.headers_30d)} />
            <StatPill
              label="QTY ISSUED (30D)"
              value={
                data.store_consumption.quantity_30d != null
                  ? data.store_consumption.quantity_30d.toLocaleString('en-TZ', { maximumFractionDigits: 0 })
                  : '—'
              }
            />
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 12 }}>Monthly quantity issued</Text>
            <SimpleBarChart points={consumptionChart} barColor={colors.primaryNavy} />
          </View>
        </>
      ) : null}

      {moduleRoute === 'Movement trends' && data?.movements ? (
        <>
          <Text style={{ ...outfit('medium', 15), color: colors.textPrimary }}>Store movement volume</Text>
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4, marginBottom: 14 }}>
            Combined kitchen ↔ store document counts by month.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {data.movements.kitchen_to_store_30d != null ? (
              <StatPill label="KITCHEN → STORE (30D)" value={String(data.movements.kitchen_to_store_30d)} />
            ) : null}
            {data.movements.store_to_kitchen_30d != null ? (
              <StatPill label="STORE → KITCHEN (30D)" value={String(data.movements.store_to_kitchen_30d)} />
            ) : null}
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.borderSubtle, marginBottom: 16 }}>
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 12 }}>Total movements per month</Text>
            <SimpleBarChart points={movementChart} />
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 10 }}>Monthly breakdown</Text>
            {(data.movements.by_month ?? []).map((row) => (
              <View
                key={row.label}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }}
              >
                <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>{row.label}</Text>
                <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
                  K→S {row.kitchen_to_store} · S→K {row.store_to_kitchen}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {!data?.store_consumption && moduleRoute === 'Store consumption' ? (
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary }}>Store consumption data is not available for your role.</Text>
      ) : null}
      {!data?.movements && moduleRoute === 'Movement trends' ? (
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary }}>Movement trends are not available for your role.</Text>
      ) : null}
    </ScrollView>
  );
}
