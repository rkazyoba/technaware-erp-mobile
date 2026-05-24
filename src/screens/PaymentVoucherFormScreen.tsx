import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import {
  createPaymentVoucher,
  type PaymentVoucherLineInput,
  type PettyCashPaymentMethod,
} from '../api';
import { Text } from '../components/AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { canCrud } from '../utils/crudPermissions';
import { portalModuleAccessGate } from '../utils/portalModuleAccess';
import { styles } from '../styles/appStyles';

const PAYMENT_METHODS: { value: PettyCashPaymentMethod; label: string }[] = [
  { value: 0, label: 'Cash' },
  { value: 1, label: 'Bank transfer' },
  { value: 2, label: 'Mobile money' },
  { value: 3, label: 'Cheque' },
];

const PAYMENT_CATEGORIES = [
  { value: 0, label: 'Service' },
  { value: 1, label: 'Parts' },
  { value: 2, label: 'Salary advance' },
] as const;

const PAY_TO_OPTIONS = [
  { value: 2, label: 'Employee' },
  { value: 1, label: 'Technical service' },
  { value: 0, label: 'Supplier' },
] as const;

type LineDraft = {
  key: string;
  payee_name: string;
  account_no: string;
  payment_category: number;
  pay_to: number;
  net_pay: string;
  supplier_id: string;
};

function newLine(): LineDraft {
  return {
    key: String(Date.now()) + Math.random().toString(36).slice(2),
    payee_name: '',
    account_no: '',
    payment_category: 0,
    pay_to: 2,
    net_pay: '',
    supplier_id: '',
  };
}

export function PaymentVoucherFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Payment vouchers'), [portal]);
  const canCreate = useMemo(() => canCrud(portal, 'payment_vouchers', 'create'), [portal]);

  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PettyCashPaymentMethod>(0);
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Payment vouchers');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const submit = async () => {
    setFormError(null);
    const desc = description.trim();
    if (!desc) {
      setFormError('Describe what this voucher is for.');
      return;
    }

    const payloadLines: PaymentVoucherLineInput[] = [];
    for (const line of lines) {
      const amount = parseFloat(line.net_pay.replace(/,/g, ''));
      const payTo = line.pay_to;
      const supplierId = parseInt(line.supplier_id.trim(), 10);

      if (payTo === 0) {
        if (!Number.isFinite(supplierId) || supplierId < 1) {
          setFormError('Enter a valid supplier ID for supplier payee lines (or use the web ERP to pick a supplier).');
          return;
        }
      } else {
        const name = line.payee_name.trim();
        if (!name) {
          setFormError('Each line needs a payee name.');
          return;
        }
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        setFormError('Enter a valid amount on each line.');
        return;
      }

      payloadLines.push({
        payee_name: line.payee_name.trim(),
        account_no: line.account_no.trim() || undefined,
        payment_category: line.payment_category,
        pay_to: payTo,
        net_pay: amount,
        advance_amount: 0,
        supplier_id: payTo === 0 && Number.isFinite(supplierId) ? supplierId : undefined,
      });
    }

    setSubmitting(true);
    try {
      await createPaymentVoucher(token, {
        description: desc,
        payment_method: paymentMethod,
        submit: true,
        lines: payloadLines,
      });
      onPortalNotify?.('Payment voucher submitted for approval.', 'success');
      navigation.replace('ModuleList', { moduleRoute: 'Payment vouchers' });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not submit voucher.');
    } finally {
      setSubmitting(false);
    }
  };

  if (moduleGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (moduleGate === 'denied' || !canCreate) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <View style={{ padding: 20 }}>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
            {moduleGate === 'denied'
              ? 'Payment vouchers are not enabled for your account.'
              : 'You need payment voucher create permission to add vouchers from mobile.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>New payment voucher</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
          Submit for approval. Approvers with payment voucher permission will review before finance processes payment.
        </Text>

        <View style={styles.leaveFormCard}>
          <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Description</Text>
          <TextInput
            style={[styles.approvalNoteInput, { minHeight: 72, textAlignVertical: 'top' }]}
            multiline
            placeholder="What is this payment for?"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.approvalType, { marginTop: 16 }]}>Payment method</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.value}
                style={[styles.leaveTypeChip, paymentMethod === m.value ? styles.leaveTypeChipActive : null]}
                onPress={() => setPaymentMethod(m.value)}
              >
                <Text style={styles.menuChipText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.approvalType, { marginTop: 16 }]}>Payees</Text>
          {lines.map((line, index) => (
            <View
              key={line.key}
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 10,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginBottom: 8 }}>Line {index + 1}</Text>

              <View style={[styles.leaveTypeWrap, { marginBottom: 8 }]}>
                {PAY_TO_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.leaveTypeChip, line.pay_to === opt.value ? styles.leaveTypeChipActive : null]}
                    onPress={() => updateLine(line.key, { pay_to: opt.value })}
                  >
                    <Text style={styles.menuChipText}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              {line.pay_to === 0 ? (
                <TextInput
                  style={styles.approvalNoteInput}
                  placeholder="Supplier ID"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={line.supplier_id}
                  onChangeText={(t) => updateLine(line.key, { supplier_id: t })}
                />
              ) : (
                <TextInput
                  style={styles.approvalNoteInput}
                  placeholder="Payee name"
                  placeholderTextColor={colors.textMuted}
                  value={line.payee_name}
                  onChangeText={(t) => updateLine(line.key, { payee_name: t })}
                />
              )}

              <TextInput
                style={[styles.approvalNoteInput, { marginTop: 8 }]}
                placeholder="Account / mobile no. (optional)"
                placeholderTextColor={colors.textMuted}
                value={line.account_no}
                onChangeText={(t) => updateLine(line.key, { account_no: t })}
              />

              <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 8, marginBottom: 4 }}>Category</Text>
              <View style={styles.leaveTypeWrap}>
                {PAYMENT_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.value}
                    style={[styles.leaveTypeChip, line.payment_category === cat.value ? styles.leaveTypeChipActive : null]}
                    onPress={() => updateLine(line.key, { payment_category: cat.value })}
                  >
                    <Text style={styles.menuChipText}>{cat.label}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[styles.approvalNoteInput, { marginTop: 8 }]}
                placeholder="Amount"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={line.net_pay}
                onChangeText={(t) => updateLine(line.key, { net_pay: t })}
              />

              {lines.length > 1 ? (
                <Pressable onPress={() => setLines((prev) => prev.filter((l) => l.key !== line.key))} style={{ marginTop: 8 }}>
                  <Text style={{ ...outfit('medium', 12), color: colors.trendDown }}>Remove line</Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          <Pressable onPress={() => setLines((prev) => [...prev, newLine()])} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <Ionicons name="add-circle-outline" size={20} color={colors.accentTeal} />
            <Text style={{ marginLeft: 6, ...outfit('medium', 13), color: colors.accentTeal }}>Add payee</Text>
          </Pressable>

          {formError ? (
            <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginTop: 12 }}>{formError}</Text>
          ) : null}

          <Pressable
            style={[styles.primaryAction, submitting ? { opacity: 0.65 } : null, { marginTop: 16 }]}
            disabled={submitting}
            onPress={() => void submit()}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>Submit for approval</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
