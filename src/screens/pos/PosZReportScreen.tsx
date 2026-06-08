import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, View } from 'react-native';
import { Text } from '../../components/AppTypography';
import { TopBar, TopBarIconButton } from '../../components/TopBar';
import { getPosShiftZReport, type PosZReportPayload } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { posPaymentMethodLabel } from '../../utils/posPortal';

export function PosZReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PosZReport'>>();
  const { token, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<PosZReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Retail POS reports');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPosShiftZReport(token, route.params.shiftId);
        if (!cancelled) setReport(res.data.z_report);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load Z-report.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, route.params.shiftId]);

  const shareReport = async () => {
    if (!report) return;
    const tenders = Object.entries(report.by_payment_method)
      .map(([method, amount]) => `${posPaymentMethodLabel(method)}: ${amount.toFixed(2)}`)
      .join('\n');
    const body = [
      `Z-report shift #${report.shift.id}`,
      report.shift.terminal ?? '',
      `Orders: ${report.orders_count}`,
      `Gross: ${report.gross.toFixed(2)} ${report.currency}`,
      `Tax: ${report.tax.toFixed(2)}`,
      `Returns: ${report.returns_count} (${report.returns_total.toFixed(2)})`,
      '',
      tenders,
      '',
      `Variance: ${report.shift.variance?.toFixed(2) ?? '—'}`,
    ].join('\n');
    await Share.share({ message: body, title: `Z-report #${report.shift.id}` });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title={`Z-report #${route.params.shiftId}`}
        subtitle={route.params.terminalName ?? 'Shift close'}
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {loading ? <ActivityIndicator color={colors.accentTeal} /> : null}
        {error ? <Text style={{ color: '#c0392b' }}>{error}</Text> : null}

        {report ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
              {report.shift.opened_at ?? '—'} → {report.shift.closed_at ?? '—'}
            </Text>
            <Text style={{ ...outfit('semibold', 14), marginTop: 8 }}>Orders: {report.orders_count}</Text>
            <Text style={{ ...outfit('regular', 13) }}>Gross: {report.gross.toFixed(2)} {report.currency}</Text>
            <Text style={{ ...outfit('regular', 13) }}>Tax: {report.tax.toFixed(2)}</Text>
            <Text style={{ ...outfit('regular', 13) }}>Returns: {report.returns_count} · {report.returns_total.toFixed(2)}</Text>

            <Text style={{ ...outfit('semibold', 14), marginTop: 12, marginBottom: 6 }}>By tender</Text>
            {Object.entries(report.by_payment_method).map(([method, amount]) => (
              <Text key={method} style={{ ...outfit('regular', 13) }}>
                {posPaymentMethodLabel(method)}: {amount.toFixed(2)}
              </Text>
            ))}

            <Text style={{ ...outfit('semibold', 14), marginTop: 12, marginBottom: 6 }}>Cash</Text>
            <Text style={{ ...outfit('regular', 13) }}>Opening float: {report.shift.opening_float.toFixed(2)}</Text>
            <Text style={{ ...outfit('regular', 13) }}>
              Expected: {report.shift.expected_cash?.toFixed(2) ?? '—'}
            </Text>
            <Text style={{ ...outfit('regular', 13) }}>
              Counted: {report.shift.closing_cash_count?.toFixed(2) ?? '—'}
            </Text>
            <Text style={{ ...outfit('semibold', 14), marginTop: 4 }}>
              Variance: {report.shift.variance?.toFixed(2) ?? '—'}
            </Text>
          </View>
        ) : null}

        {report ? (
          <Pressable
            onPress={() => void shareReport()}
            style={{
              backgroundColor: colors.accentTeal,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Text style={{ ...outfit('semibold', 15), color: '#fff' }}>Share Z-report</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
