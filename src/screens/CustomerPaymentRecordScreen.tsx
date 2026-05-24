import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import {
  getFinanceReceiptBanks,
  recordCustomerInvoicePayment,
  type ReceiptBankOption,
} from '../api';
import { Text } from '../components/AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { styles } from '../styles/appStyles';

type Nav = NativeStackNavigationProp<ModulesStackParamList, 'CustomerPaymentRecord'>;
type Route = RouteProp<ModulesStackParamList, 'CustomerPaymentRecord'>;

export function CustomerPaymentRecordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { token } = useStaffPortal();
  const { invoiceId, invoiceRef, dueAmount, currency } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banks, setBanks] = useState<ReceiptBankOption[]>([]);
  const [amount, setAmount] = useState(dueAmount != null && dueAmount > 0 ? String(dueAmount) : '');
  const [reference, setReference] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [settleFull, setSettleFull] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getFinanceReceiptBanks(token);
      setBanks(res.data.banks ?? []);
      if (res.data.banks?.length === 1) {
        setSelectedBankId(res.data.banks[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load banks.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!token) return;
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!settleFull && (Number.isNaN(amt) || amt <= 0)) {
      setError('Enter a valid receipt amount.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await recordCustomerInvoicePayment(token, invoiceId, {
        amount: settleFull ? (dueAmount ?? amt) : amt,
        payment_reference: reference.trim() || undefined,
        receipt_bank_id: selectedBankId ? Number(selectedBankId) : undefined,
        settle_in_full: settleFull,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.pageBg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy }}>Record receipt</Text>
      <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 4 }}>
        {invoiceRef}
        {dueAmount != null ? ` · Due ${currency ? `${currency} ` : ''}${dueAmount.toLocaleString()}` : ''}
      </Text>
      <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 8 }}>
        Manual bank/cash receipt (no payment gateway). Posts Dr cash / Cr AR when GL is enabled.
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.accentTeal} />
      ) : (
        <>
          <Pressable
            onPress={() => {
              setSettleFull((v) => !v);
              if (!settleFull && dueAmount != null) setAmount(String(dueAmount));
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 20,
              padding: 12,
              borderRadius: 10,
              backgroundColor: settleFull ? colors.primaryNavy : colors.surface,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
            }}
          >
            <Ionicons name={settleFull ? 'checkbox' : 'square-outline'} size={22} color={settleFull ? '#fff' : colors.textMuted} />
            <Text style={{ ...outfit('medium', 14), color: settleFull ? '#fff' : colors.textPrimary, marginLeft: 10 }}>
              Settle invoice in full
            </Text>
          </Pressable>

          {!settleFull ? (
            <View style={{ marginTop: 16 }}>
              <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Amount received</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  borderWidth: 0.5,
                  borderColor: colors.borderSubtle,
                  padding: 12,
                  ...outfit('regular', 16),
                }}
              />
            </View>
          ) : null}

          <View style={{ marginTop: 16 }}>
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Payment reference</Text>
            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="Cheque no., transfer ref…"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 10,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                padding: 12,
                ...outfit('regular', 15),
              }}
            />
          </View>

          {banks.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 8 }}>Bank / cash account</Text>
              {banks.map((b) => {
                const sel = selectedBankId === b.id;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => setSelectedBankId(b.id)}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: 10,
                      backgroundColor: sel ? colors.primaryNavy : colors.surface,
                      borderWidth: 0.5,
                      borderColor: sel ? colors.primaryNavy : colors.borderSubtle,
                    }}
                  >
                    <Text style={{ ...outfit('medium', 13), color: sel ? '#fff' : colors.textPrimary }}>{b.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {error ? (
            <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginTop: 16 }}>{error}</Text>
          ) : null}

          <Pressable
            style={[styles.detailsButton, { marginTop: 24, opacity: submitting ? 0.6 : 1 }]}
            onPress={() => void submit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.detailsButtonText}>Save receipt</Text>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
