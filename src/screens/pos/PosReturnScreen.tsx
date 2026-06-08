import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../../components/AppTypography';
import { TopBar, TopBarIconButton } from '../../components/TopBar';
import { getPosOrders, processPosReturn, type PosOrderLine, type PosOrderRecord } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';

type ReturnLineState = { order_line_id: number; description: string; maxQty: number; quantity: string };

function monthStartIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PosReturnScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();

  const [orders, setOrders] = useState<PosOrderRecord[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [returnLines, setReturnLines] = useState<ReturnLineState[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Retail POS');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getPosOrders(token, {
          source_module: 'pos_standalone',
          from: monthStartIso(),
          to: todayIso(),
        });
        if (cancelled) return;
        const completed = (res.data.orders ?? []).filter((o) => o.status === 'completed');
        setOrders(completed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  useEffect(() => {
    if (!selectedOrder?.lines?.length) {
      setReturnLines([]);
      return;
    }
    setReturnLines(
      selectedOrder.lines
        .filter((line: PosOrderLine) => line.id != null)
        .map((line: PosOrderLine) => ({
          order_line_id: line.id as number,
          description: line.description,
          maxQty: Number(line.quantity),
          quantity: String(line.quantity),
        })),
    );
  }, [selectedOrder]);

  const submitReturn = async () => {
    if (!token || !selectedOrderId) return;
    const lines = returnLines
      .map((line) => ({ order_line_id: line.order_line_id, quantity: parseFloat(line.quantity) || 0 }))
      .filter((line) => line.quantity > 0);
    if (lines.length === 0) {
      Alert.alert('Check form', 'Enter return quantity for at least one line.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await processPosReturn(token, { order_id: selectedOrderId, lines });
      onPortalNotify?.(`Return processed — ${res.data.return.return_no ?? 'OK'}`, 'success');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Return failed', e instanceof Error ? e.message : 'Could not process return.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.pageBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    ...outfit('regular', 13),
    color: colors.textPrimary,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title="Process return"
        subtitle="Retail POS"
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {loading ? <ActivityIndicator color={colors.accentTeal} /> : null}

        <Text style={{ ...outfit('semibold', 14), marginBottom: 8 }}>Select order</Text>
        {orders.map((order) => {
          const selected = selectedOrderId === order.id;
          return (
            <Pressable
              key={order.id}
              onPress={() => setSelectedOrderId(order.id)}
              style={{
                backgroundColor: selected ? colors.primaryNavy : colors.surface,
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
                borderWidth: 0.5,
                borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
              }}
            >
              <Text style={{ ...outfit('medium', 14), color: selected ? '#fff' : colors.textPrimary }}>{order.order_no}</Text>
              <Text style={{ ...outfit('regular', 12), color: selected ? '#e2e8f0' : colors.textSecondary, marginTop: 2 }}>
                {Number(order.total_amount).toFixed(2)} · {order.completed_at?.slice(0, 16) ?? '—'}
              </Text>
            </Pressable>
          );
        })}

        {returnLines.length > 0 ? (
          <>
            <Text style={{ ...outfit('semibold', 14), marginTop: 16, marginBottom: 8 }}>Return lines</Text>
            {returnLines.map((line, idx) => (
              <View key={line.order_line_id} style={{ marginBottom: 10 }}>
                <Text style={{ ...outfit('medium', 13) }}>{line.description}</Text>
                <Text style={{ ...outfit('regular', 11), color: colors.textSecondary }}>Max {line.maxQty}</Text>
                <TextInput
                  style={[inputStyle, { marginTop: 6 }]}
                  keyboardType="decimal-pad"
                  value={line.quantity}
                  onChangeText={(v) =>
                    setReturnLines((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity: v } : row)))
                  }
                />
              </View>
            ))}
            <Pressable
              onPress={() => void submitReturn()}
              disabled={submitting}
              style={{
                backgroundColor: colors.accentTeal,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 8,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text style={{ ...outfit('semibold', 15), color: '#fff' }}>
                {submitting ? 'Processing…' : 'Submit return'}
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
