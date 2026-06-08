import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, View } from 'react-native';
import * as Print from 'expo-print';
import { Text } from '../../components/AppTypography';
import { TopBar, TopBarIconButton } from '../../components/TopBar';
import { getPosOrderReceipt, retryPosOrderFiscal, type PosReceiptPayload } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { buildReceiptPrintHtml, formatReceiptPlainText } from '../../utils/posReceiptPrint';

export function PosReceiptScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PosReceipt'>>();
  const { token, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<PosReceiptPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      try {
        const res = await getPosOrderReceipt(token, route.params.orderId);
        if (!cancelled) setReceipt(res.data.receipt);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load receipt.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, route.params.orderId]);

  const shareReceipt = async () => {
    if (!receipt) return;
    await Share.share({
      message: formatReceiptPlainText(receipt),
      title: receipt.order.order_no,
    });
  };

  const printReceipt = async () => {
    if (!receipt) return;
    try {
      await Print.printAsync({
        html: buildReceiptPrintHtml(receipt),
        width: 576,
        height: 842,
      });
    } catch (e) {
      Alert.alert('Print unavailable', e instanceof Error ? e.message : 'Could not open print dialog.');
    }
  };

  const retryFiscal = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await retryPosOrderFiscal(token, route.params.orderId);
      setReceipt(res.data.receipt);
    } catch (e) {
      Alert.alert('Fiscal retry failed', e instanceof Error ? e.message : 'Could not sign fiscal receipt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title={route.params.orderNo ?? 'Receipt'}
        subtitle="Sale receipt"
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {loading ? <ActivityIndicator color={colors.accentTeal} /> : null}
        {error ? <Text style={{ color: '#c0392b' }}>{error}</Text> : null}

        {receipt ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...outfit('semibold', 16), textAlign: 'center' }}>{receipt.company.name}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
              {receipt.order.completed_at_display ?? ''}
            </Text>
            {receipt.terminal ? (
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, textAlign: 'center' }}>
                {receipt.terminal.name}
              </Text>
            ) : null}

            {receipt.lines.map((line, idx) => (
              <View key={`${line.description}-${idx}`} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...outfit('medium', 13), flex: 1 }}>{line.description}</Text>
                  <Text style={{ ...outfit('medium', 13) }}>{line.line_total.toFixed(2)}</Text>
                </View>
                <Text style={{ ...outfit('regular', 11), color: colors.textSecondary }}>
                  {line.quantity} × {line.unit_price.toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={{ borderTopWidth: 0.5, borderTopColor: colors.borderSubtle, marginTop: 12, paddingTop: 12 }}>
              <Text style={{ ...outfit('regular', 13) }}>Subtotal: {receipt.order.subtotal.toFixed(2)}</Text>
              <Text style={{ ...outfit('regular', 13) }}>VAT: {receipt.order.tax_amount.toFixed(2)}</Text>
              <Text style={{ ...outfit('semibold', 16), marginTop: 6 }}>
                Total: {receipt.order.total_amount.toFixed(2)} {receipt.order.currency}
              </Text>
            </View>

            {receipt.payments.map((p, idx) => (
              <Text key={`${p.method}-${idx}`} style={{ ...outfit('regular', 12), marginTop: 4 }}>
                {p.method_label}: {p.amount.toFixed(2)}
              </Text>
            ))}

            {receipt.fiscal?.status === 'signed' ? (
              <View style={{ borderTopWidth: 0.5, borderTopColor: colors.borderSubtle, marginTop: 12, paddingTop: 12 }}>
                <Text style={{ ...outfit('semibold', 13), textAlign: 'center' }}>
                  {receipt.fiscal.tra_mode_label ?? 'Fiscal receipt (TRA)'}
                </Text>
                {receipt.fiscal.receipt_number ? (
                  <Text style={{ ...outfit('regular', 12), marginTop: 4 }}>Receipt: {receipt.fiscal.receipt_number}</Text>
                ) : null}
                {receipt.fiscal.verification_code ? (
                  <Text style={{ ...outfit('regular', 12) }}>Verification: {receipt.fiscal.verification_code}</Text>
                ) : null}
                {receipt.fiscal.seller_tin ? (
                  <Text style={{ ...outfit('regular', 12) }}>TIN: {receipt.fiscal.seller_tin}</Text>
                ) : null}
              </View>
            ) : null}
            {receipt.fiscal?.status === 'failed' ? (
              <Text style={{ ...outfit('regular', 12), color: '#c0392b', marginTop: 8 }}>
                Fiscal signing failed: {receipt.fiscal.error_message ?? 'Unknown error'}
              </Text>
            ) : null}
          </View>
        ) : null}

        {receipt?.fiscal_enabled && receipt.fiscal?.status === 'failed' ? (
          <Pressable
            onPress={() => void retryFiscal()}
            style={{
              backgroundColor: '#f39c12',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ ...outfit('semibold', 14), color: '#fff' }}>Retry fiscal signing</Text>
          </Pressable>
        ) : null}

        {receipt ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Pressable
              onPress={() => void printReceipt()}
              style={{
                flex: 1,
                backgroundColor: colors.primaryNavy,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...outfit('semibold', 15), color: '#fff' }}>Print</Text>
            </Pressable>
            <Pressable
              onPress={() => void shareReceipt()}
              style={{
                flex: 1,
                backgroundColor: colors.accentTeal,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...outfit('semibold', 15), color: '#fff' }}>Share</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('PosRegister', { terminalId: route.params.terminalId, terminalName: route.params.terminalName })}
          style={{ alignItems: 'center', marginTop: 12 }}
        >
          <Text style={{ ...outfit('medium', 13), color: colors.accentTeal }}>New sale</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
