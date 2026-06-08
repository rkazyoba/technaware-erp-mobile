import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '../../components/AppTypography';
import { getPosReportsSummary, type PosSummary } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { styles } from '../../styles/appStyles';

type Props = {
  token: string;
};

export function PosReportsModulePanel({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PosSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPosReportsSummary(token, { source_module: 'pos_standalone' });
      setSummary(res.data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.approvalsSection}>
      {loading ? <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 16 }} /> : null}
      {error ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>Could not load reports</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <Pressable style={styles.detailsButton} onPress={() => void load()}>
            <Text style={styles.detailsButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {summary ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={[styles.emptyStateCard, { flex: 1, minWidth: '45%' }]}>
              <Text style={{ ...outfit('regular', 11), color: colors.textSecondary }}>Orders (period)</Text>
              <Text style={{ ...outfit('semibold', 20) }}>{summary.orders}</Text>
            </View>
            <View style={[styles.emptyStateCard, { flex: 1, minWidth: '45%' }]}>
              <Text style={{ ...outfit('regular', 11), color: colors.textSecondary }}>Gross</Text>
              <Text style={{ ...outfit('semibold', 20) }}>
                {Number(summary.gross).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.emptyStateCard, { flex: 1, minWidth: '45%' }]}>
              <Text style={{ ...outfit('regular', 11), color: colors.textSecondary }}>Tax</Text>
              <Text style={{ ...outfit('semibold', 20) }}>
                {Number(summary.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => void load()} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ ...outfit('medium', 13), color: colors.accentTeal }}>Refresh</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
