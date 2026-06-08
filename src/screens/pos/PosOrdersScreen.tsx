import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../../components/AppTypography';
import { TopBar, TopBarIconButton } from '../../components/TopBar';
import { getPosOrders, type PosOrderRecord } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';

function monthStartIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PosOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();
  const [orders, setOrders] = useState<PosOrderRecord[]>([]);
  const [from, setFrom] = useState(monthStartIso());
  const [to, setTo] = useState(todayIso());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Retail POS');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPosOrders(token, { source_module: 'pos_standalone', from, to });
      setOrders(res.data.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const inputStyle = {
    flex: 1,
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
        title="Recent orders"
        subtitle="Retail POS"
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TextInput style={inputStyle} value={from} onChangeText={setFrom} placeholder="From YYYY-MM-DD" />
          <TextInput style={inputStyle} value={to} onChangeText={setTo} placeholder="To YYYY-MM-DD" />
        </View>
        <Pressable
          onPress={() => void load()}
          style={{ backgroundColor: colors.primaryNavy, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 12 }}
        >
          <Text style={{ ...outfit('medium', 13), color: '#fff' }}>Apply date range</Text>
        </Pressable>

        {loading ? <ActivityIndicator color={colors.accentTeal} /> : null}
        {error ? <Text style={{ color: '#c0392b' }}>{error}</Text> : null}
        {!loading && orders.length === 0 ? (
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary }}>No orders in this period.</Text>
        ) : null}
        {orders.map((order) => (
          <Pressable
            key={order.id}
            onPress={() => {
              if (order.status !== 'completed') return;
              navigation.navigate('PosReceipt', {
                orderId: order.id,
                orderNo: order.order_no,
                terminalId: order.terminal?.id ?? 0,
                terminalName: order.terminal?.name ?? 'POS',
              });
            }}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...outfit('semibold', 14) }}>{order.order_no}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
              {order.status} · {Number(order.total_amount).toFixed(2)} · {order.completed_at?.slice(0, 16) ?? '—'}
            </Text>
            {order.status === 'completed' ? (
              <Text style={{ ...outfit('medium', 11), color: colors.accentTeal, marginTop: 6 }}>View receipt</Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
