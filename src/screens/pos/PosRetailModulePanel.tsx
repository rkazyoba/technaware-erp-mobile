import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/AppTypography';
import { getPosStandaloneSummary, type PosOpenShiftSummary, type PosPortalSummary } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { pendingPosSaleCount } from '../../utils/posOfflineQueue';
import { styles } from '../../styles/appStyles';

type Props = {
  token: string;
  navigation: NativeStackNavigationProp<ModulesStackParamList>;
};

export function PosRetailModulePanel({ token, navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PosPortalSummary | null>(null);
  const [terminalId, setTerminalId] = useState<number | null>(null);
  const [pendingOffline, setPendingOffline] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPosStandaloneSummary(token);
      setData(res.data);
      if (res.data.terminals.length && terminalId === null) {
        setTerminalId(res.data.terminals[0]?.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load POS.');
    } finally {
      setLoading(false);
    }
  }, [token, terminalId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void pendingPosSaleCount().then(setPendingOffline);
  }, [data, loading]);

  const selectedTerminal = useMemo(
    () => data?.terminals.find((t) => t.id === terminalId) ?? null,
    [data?.terminals, terminalId],
  );

  const openShift = useMemo((): PosOpenShiftSummary | undefined => {
    if (!terminalId) {
      return undefined;
    }
    return data?.open_shifts?.find((s) => s.terminal_id === terminalId);
  }, [data?.open_shifts, terminalId]);

  const requireShift = Boolean(data?.require_open_shift);
  const canSell = Boolean(terminalId) && (!requireShift || Boolean(openShift));

  return (
    <View style={styles.approvalsSection}>
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <ActivityIndicator color={colors.accentTeal} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>Could not load POS</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <Pressable style={styles.detailsButton} onPress={() => void load()}>
            <Text style={styles.detailsButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {data ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <View style={[styles.emptyStateCard, { flex: 1, minWidth: '45%', marginBottom: 0 }]}>
              <Text style={{ ...outfit('regular', 11), color: colors.textSecondary }}>Orders today</Text>
              <Text style={{ ...outfit('semibold', 20), color: colors.textPrimary }}>{data.summary.orders}</Text>
            </View>
            <View style={[styles.emptyStateCard, { flex: 1, minWidth: '45%', marginBottom: 0 }]}>
              <Text style={{ ...outfit('regular', 11), color: colors.textSecondary }}>Gross today</Text>
              <Text style={{ ...outfit('semibold', 20), color: colors.textPrimary }}>
                {Number(data.summary.gross).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <Text style={{ ...outfit('semibold', 13), color: colors.textPrimary, marginBottom: 8 }}>Terminal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {data.terminals.map((t) => {
              const selected = terminalId === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTerminalId(t.id)}
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: selected ? colors.primaryNavy : colors.surface,
                    borderWidth: 0.5,
                    borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                  }}
                >
                  <Text style={{ ...outfit('medium', 12), color: selected ? '#fff' : colors.textPrimary }}>{t.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {pendingOffline > 0 ? (
            <View style={[styles.emptyStateCard, { marginTop: 8, marginBottom: 0 }]}>
              <Text style={styles.emptyStateText}>{pendingOffline} offline sale(s) waiting to sync.</Text>
            </View>
          ) : null}

          {selectedTerminal ? (
            <View style={[styles.emptyStateCard, { marginTop: 8 }]}>
              <Text style={styles.emptyStateText}>
                {openShift
                  ? `Shift #${openShift.id} open · float ${Number(openShift.opening_float).toFixed(2)}`
                  : requireShift
                    ? 'No open shift — open one before selling.'
                    : 'No open shift (optional).'}
              </Text>
            </View>
          ) : null}

          <View style={{ gap: 10, marginTop: 12 }}>
            <Pressable
              style={[styles.detailsButton, { opacity: canSell ? 1 : 0.5 }]}
              disabled={!canSell}
              onPress={() =>
                navigation.navigate('PosRegister', {
                  terminalId: terminalId!,
                  terminalName: selectedTerminal?.name ?? 'Register',
                })
              }
            >
              <Text style={styles.detailsButtonText}>Open register</Text>
            </Pressable>

            <Pressable
              style={styles.detailsButton}
              disabled={!terminalId}
              onPress={() =>
                navigation.navigate('PosShift', {
                  terminalId: terminalId!,
                  terminalName: selectedTerminal?.name ?? 'Shift',
                  shiftId: openShift?.id,
                })
              }
            >
              <Text style={styles.detailsButtonText}>{openShift ? 'Close shift' : 'Open shift'}</Text>
            </Pressable>

            <Pressable
              style={styles.detailsButton}
              disabled={!terminalId}
              onPress={() =>
                navigation.navigate('PosHeld', {
                  terminalId: terminalId!,
                  terminalName: selectedTerminal?.name ?? 'Held',
                })
              }
            >
              <Text style={styles.detailsButtonText}>Held tickets</Text>
            </Pressable>

            <Pressable
              style={styles.detailsButton}
              onPress={() => navigation.navigate('PosOrders', { terminalId: terminalId ?? undefined })}
            >
              <Text style={styles.detailsButtonText}>Recent orders</Text>
            </Pressable>

            <Pressable
              style={styles.detailsButton}
              onPress={() => navigation.navigate('PosReturn', { terminalId: terminalId ?? undefined })}
            >
              <Text style={styles.detailsButtonText}>Process return</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => void load()}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6 }}
          >
            <Ionicons name="refresh" size={16} color={colors.accentTeal} />
            <Text style={{ ...outfit('medium', 13), color: colors.accentTeal }}>Refresh</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
