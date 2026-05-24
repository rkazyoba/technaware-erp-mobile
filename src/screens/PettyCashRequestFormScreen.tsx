import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createStaffFinanceRequestHeader,
  getStaffFinanceCreateContext,
  type PettyCashRequestCategory,
  type PettyCashPaymentMethod,
  type StaffFinanceCreateContext,
} from '../api';
import { Text } from '../components/AppTypography';
import { StaffFinanceSiteStoreFields } from '../components/finance/StaffFinanceSiteStoreFields';
import {
  STAFF_FINANCE_CATEGORIES,
  STAFF_FINANCE_CURRENCIES,
  STAFF_FINANCE_PAYMENT_METHODS,
  staffFinanceModuleRoute,
} from '../constants/staffFinance';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { useModulesTabScrollInsets } from '../hooks/useModulesTabScrollInsets';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { canCrud } from '../utils/crudPermissions';
import { portalModuleAccessGate } from '../utils/portalModuleAccess';
import { styles } from '../styles/appStyles';

const TYPE_HINTS: Record<'imprest' | 'expense_claim', string> = {
  imprest: 'Advance before spending; add lines after saving this header. Retire with receipts after finance pays.',
  expense_claim: 'Reimbursement for money you already spent; add lines and receipts on the next screen.',
};

export function PettyCashRequestFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PettyCashRequestForm'>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const { scrollBottomPadding, keyboardVerticalOffset } = useModulesTabScrollInsets();

  const requestType = route.params?.requestType ?? 'imprest';
  const listModuleRoute = staffFinanceModuleRoute(requestType);
  const typeLabel = requestType === 'expense_claim' ? 'Expense claim' : 'Staff imprest';

  const moduleGate = useMemo(
    () =>
      portalModuleAccessGate(portal, listModuleRoute) === 'denied'
        ? portalModuleAccessGate(portal, 'Petty cash requests')
        : portalModuleAccessGate(portal, listModuleRoute),
    [portal, listModuleRoute],
  );
  const canCreate = useMemo(() => canCrud(portal, 'payment_vouchers', 'create'), [portal]);

  const [requestCategory, setRequestCategory] = useState<PettyCashRequestCategory>('general');
  const [currency, setCurrency] = useState<(typeof STAFF_FINANCE_CURRENCIES)[number]>('TZS');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PettyCashPaymentMethod>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [financeCreateContext, setFinanceCreateContext] = useState<StaffFinanceCreateContext | null>(null);
  const [siteId, setSiteId] = useState('');
  const [storeId, setStoreId] = useState('');

  useEffect(() => {
    if (!token) {
      setFinanceCreateContext(null);
      return;
    }
    let cancelled = false;
    void getStaffFinanceCreateContext(token)
      .then((res) => {
        if (cancelled) return;
        setFinanceCreateContext(res.data);
        if (res.data.default_site_id) setSiteId(res.data.default_site_id);
        if (res.data.default_store_id) setStoreId(res.data.default_store_id);
      })
      .catch(() => {
        if (!cancelled) setFinanceCreateContext(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule(listModuleRoute);
    }, [setPortalActiveTab, setPortalSelectedModule, listModuleRoute]),
  );

  const saveHeader = async () => {
    setFormError(null);
    const desc = description.trim();
    if (!desc) {
      setFormError('Describe what you need the money for.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createStaffFinanceRequestHeader(token, {
        request_type: requestType,
        description: desc,
        request_category: requestCategory,
        currency,
        payment_method: paymentMethod,
      });
      onPortalNotify?.('Header saved. Add amount lines next.', 'success');
      navigation.replace('StaffFinanceRequestWorkspace', {
        requestId: res.data.id,
        requestType,
        moduleRoute: listModuleRoute,
        initialTab: 'lines',
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save header.');
    } finally {
      setSubmitting(false);
    }
  };

  if (moduleGate === 'pending') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.accentTeal} />
        </View>
      </SafeAreaView>
    );
  }

  if (moduleGate === 'denied' || !canCreate) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
            {moduleGate === 'denied'
              ? `${typeLabel} is not enabled for your account.`
              : 'You need payment voucher create permission.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top', 'left', 'right']}>
      <View
        style={{
          backgroundColor: colors.primaryNavy,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>New {typeLabel}</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: scrollBottomPadding }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>{TYPE_HINTS[requestType]}</Text>

        {requestType === 'imprest' && financeCreateContext && (financeCreateContext.outstanding_total ?? 0) > 0 ? (
          <View style={[styles.emptyStateCard, { marginBottom: 12 }]}>
            <Text style={styles.emptyStateTitle}>Outstanding imprest</Text>
            <Text style={styles.emptyStateText}>
              {financeCreateContext.outstanding_total.toLocaleString()} total — retire these before new advances where possible.
            </Text>
            {financeCreateContext.outstanding_items.map((item) => (
              <Text key={item.id} style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
                {item.document_no}: {item.total_amount.toLocaleString()} {item.currency}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.leaveFormCard}>
          <Text style={[styles.approvalType, { marginBottom: 8 }]}>Header details</Text>
          <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginBottom: 12 }}>
            Save the header first. You will add amount lines and documents on the next screen.
          </Text>

          <StaffFinanceSiteStoreFields
            sites={financeCreateContext?.sites ?? []}
            stores={financeCreateContext?.stores ?? []}
            siteId={siteId}
            storeId={storeId}
            onSiteChange={setSiteId}
            onStoreChange={setStoreId}
          />

          <Text style={[styles.approvalType, { marginTop: 4 }]}>Category</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {STAFF_FINANCE_CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                style={[styles.leaveTypeChip, requestCategory === c.value ? styles.leaveTypeChipActive : null]}
                onPress={() => setRequestCategory(c.value)}
              >
                <Text style={styles.menuChipText}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.approvalType, { marginTop: 16 }]}>Currency</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {STAFF_FINANCE_CURRENCIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.leaveTypeChip, currency === c ? styles.leaveTypeChipActive : null]}
                onPress={() => setCurrency(c)}
              >
                <Text style={styles.menuChipText}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 16, marginBottom: 6 }}>Purpose</Text>
          <TextInput
            style={[styles.approvalNoteInput, { minHeight: 72, textAlignVertical: 'top' }]}
            multiline
            placeholder="e.g. Site visit transport and lunch"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.approvalType, { marginTop: 16 }]}>Payment method</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {STAFF_FINANCE_PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.value}
                style={[styles.leaveTypeChip, paymentMethod === m.value ? styles.leaveTypeChipActive : null]}
                onPress={() => setPaymentMethod(m.value)}
              >
                <Text style={styles.menuChipText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          {formError ? (
            <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginTop: 12 }}>{formError}</Text>
          ) : null}

          <Pressable
            style={[styles.primaryAction, submitting ? { opacity: 0.65 } : null, { marginTop: 16 }]}
            disabled={submitting}
            onPress={() => void saveHeader()}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryActionText}>Save header and continue</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
