import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/AppTypography';
import { TopBar, TopBarIconButton } from '../../components/TopBar';
import { getPosHeldOrders, voidPosOrder, type PosHeldOrder } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';

export function PosHeldScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PosHeld'>>();
  const { token, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PosHeldOrder[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getPosHeldOrders(token, route.params.terminalId);
      setOrders(res.data.orders ?? []);
    } catch (e) {
      Alert.alert('Could not load held tickets', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  }, [token, route.params.terminalId]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Retail POS');
      void load();
    }, [load, setPortalActiveTab, setPortalSelectedModule]),
  );

  const voidHeld = (order: PosHeldOrder) => {
    if (!token) return;
    Alert.alert('Void ticket?', order.held_label || order.order_no, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Void',
        style: 'destructive',
        onPress: () => {
          void voidPosOrder(token, order.id)
            .then(() => {
              onPortalNotify?.('Held ticket voided.', 'success');
              void load();
            })
            .catch((e) => Alert.alert('Void failed', e instanceof Error ? e.message : 'Try again.'));
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title="Held tickets"
        subtitle={route.params.terminalName}
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? <ActivityIndicator color={colors.accentTeal} /> : null}
        {!loading && orders.length === 0 ? (
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary }}>No held tickets for this terminal.</Text>
        ) : null}
        {orders.map((order) => (
          <View
            key={order.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...outfit('semibold', 14) }}>{order.held_label || order.order_no}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
              {Number(order.total_amount).toFixed(2)} · {order.lines.length} line(s)
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <Pressable
                onPress={() =>
                  navigation.navigate('PosRegister', {
                    terminalId: route.params.terminalId,
                    terminalName: route.params.terminalName,
                    heldOrderId: order.id,
                  })
                }
              >
                <Text style={{ ...outfit('medium', 13), color: colors.accentTeal }}>Recall</Text>
              </Pressable>
              <Pressable onPress={() => voidHeld(order)}>
                <Text style={{ ...outfit('medium', 13), color: '#c0392b' }}>Void</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
