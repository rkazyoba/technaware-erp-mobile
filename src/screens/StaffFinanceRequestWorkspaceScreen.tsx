import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import {
  deleteStaffFinanceLine,
  getPettyCashRequestDetail,
  getStaffFinanceCreateContext,
  saveStaffFinanceLine,
  type StaffFinanceCreateContext,
  submitStaffFinanceRequest,
  updateStaffFinanceHeader,
  uploadStaffFinanceAttachments,
  type PettyCashRequestCategory,
  type PettyCashPaymentMethod,
  type PettyCashRequestDetail,
} from '../api';
import { Text } from '../components/AppTypography';
import { DetailTabBar } from '../components/DetailTabBar';
import { StaffFinanceLinesPanel } from '../components/finance/StaffFinanceLinesPanel';
import { StaffFinanceReadOnlyField } from '../components/finance/StaffFinanceReadOnlyField';
import { StaffFinanceSiteStoreFields } from '../components/finance/StaffFinanceSiteStoreFields';
import {
  STAFF_FINANCE_CATEGORIES,
  STAFF_FINANCE_CURRENCIES,
  STAFF_FINANCE_PAYMENT_METHODS,
  staffFinanceTypeLabel,
} from '../constants/staffFinance';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { useModulesTabScrollInsets } from '../hooks/useModulesTabScrollInsets';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { styles } from '../styles/appStyles';

const TAB_OVERVIEW = 'overview';
const TAB_DETAILS = 'details';
const TAB_LINES = 'lines';
const TAB_DOCUMENTS = 'documents';

type WorkspaceTab = typeof TAB_OVERVIEW | typeof TAB_DETAILS | typeof TAB_LINES | typeof TAB_DOCUMENTS;

export function StaffFinanceRequestWorkspaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'StaffFinanceRequestWorkspace'>>();
  const { requestId, requestType, moduleRoute, initialTab } = route.params;
  const { token, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const { scrollBottomPadding, keyboardVerticalOffset } = useModulesTabScrollInsets();
  const scrollRef = useRef<ScrollView>(null);

  const isExpenseClaim = requestType === 'expense_claim';

  const scrollAmountFieldIntoView = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, []);

  const [detail, setDetail] = useState<PettyCashRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolveInitialTab = (): WorkspaceTab => {
    if (initialTab === 'details' || initialTab === 'header') return TAB_DETAILS;
    if (initialTab === 'lines' || initialTab === 'documents' || initialTab === 'overview') {
      return initialTab;
    }
    return TAB_OVERVIEW;
  };

  const [tab, setTab] = useState<WorkspaceTab>(resolveInitialTab());
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [description, setDescription] = useState('');
  const [requestCategory, setRequestCategory] = useState<PettyCashRequestCategory>('general');
  const [currency, setCurrency] = useState<(typeof STAFF_FINANCE_CURRENCIES)[number]>('TZS');
  const [paymentMethod, setPaymentMethod] = useState<PettyCashPaymentMethod>(0);
  const [siteId, setSiteId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [locationOptions, setLocationOptions] = useState<StaffFinanceCreateContext | null>(null);

  const [lineDesc, setLineDesc] = useState('');
  const [lineAmount, setLineAmount] = useState('');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [docUris, setDocUris] = useState<string[]>([]);

  const editable = Boolean(detail?.can_edit);

  const tabs = useMemo(() => {
    const base = [
      { id: TAB_OVERVIEW, label: 'Overview' },
      { id: TAB_DETAILS, label: 'Details' },
      { id: TAB_LINES, label: 'Lines' },
    ];
    if (isExpenseClaim) {
      base.push({ id: TAB_DOCUMENTS, label: 'Documents' });
    }
    return base;
  }, [isExpenseClaim]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule(moduleRoute);
    }, [setPortalActiveTab, setPortalSelectedModule, moduleRoute]),
  );

  const syncHeaderForm = useCallback((d: PettyCashRequestDetail) => {
    setDescription(d.description ?? '');
    setRequestCategory((d.request_category as PettyCashRequestCategory) ?? 'general');
    setCurrency((d.currency as (typeof STAFF_FINANCE_CURRENCIES)[number]) ?? 'TZS');
    setPaymentMethod((d.payment_method ?? 0) as PettyCashPaymentMethod);
    if (d.site_id) setSiteId(d.site_id);
    if (d.store_id) setStoreId(d.store_id);
  }, []);

  useEffect(() => {
    if (!token || !detail?.can_edit) return;
    let cancelled = false;
    void getStaffFinanceCreateContext(token)
      .then((res) => {
        if (!cancelled) setLocationOptions(res.data);
      })
      .catch(() => {
        if (!cancelled) setLocationOptions(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, detail?.can_edit]);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await getPettyCashRequestDetail(token, requestId);
      setDetail(res.data);
      syncHeaderForm(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load request.');
    } finally {
      setLoading(false);
    }
  }, [token, requestId, syncHeaderForm]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void reload();
    }, [reload]),
  );

  const lineCount = detail?.lines?.length ?? 0;
  const docCount = detail?.attachments?.length ?? 0;
  const canSubmit =
    Boolean(detail?.can_submit) &&
    lineCount >= 1 &&
    (!isExpenseClaim || docCount >= 1);

  const saveHeader = async () => {
    if (!editable) return;
    const desc = description.trim();
    if (!desc) {
      setFormError('Purpose is required.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const siteNum = Number.parseInt(siteId, 10);
      const storeNum = Number.parseInt(storeId, 10);
      const res = await updateStaffFinanceHeader(token, requestId, {
        description: desc,
        request_category: requestCategory,
        currency,
        payment_method: paymentMethod,
        ...(Number.isFinite(siteNum) && siteNum > 0 ? { site_id: siteNum } : {}),
        ...(Number.isFinite(storeNum) && storeNum > 0 ? { store_id: storeNum } : {}),
      });
      setDetail(res.data);
      syncHeaderForm(res.data);
      onPortalNotify?.('Header updated.', 'success');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save header.');
    } finally {
      setBusy(false);
    }
  };

  const saveLine = async () => {
    if (!editable) return;
    const desc = lineDesc.trim();
    const amount = parseFloat(lineAmount.replace(/,/g, ''));
    if (!desc) {
      setFormError('Enter what this amount is for.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter a valid amount.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const res = await saveStaffFinanceLine(token, requestId, {
        line_description: desc,
        amount,
        line_id: editingLineId ?? undefined,
      });
      setDetail(res.data);
      setLineDesc('');
      setLineAmount('');
      setEditingLineId(null);
      onPortalNotify?.('Line saved.', 'success');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save line.');
    } finally {
      setBusy(false);
    }
  };

  const removeLine = (lineId: string) => {
    Alert.alert('Remove line?', 'This amount line will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              const res = await deleteStaffFinanceLine(token, requestId, lineId);
              setDetail(res.data);
            } catch (e) {
              setFormError(e instanceof Error ? e.message : 'Could not remove line.');
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const pickDocuments = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setFormError('Allow photo access to attach receipts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    setDocUris(result.assets.map((a) => a.uri).filter(Boolean).slice(0, 10));
    setFormError(null);
  };

  const uploadDocuments = async () => {
    if (docUris.length < 1) {
      setFormError('Select at least one receipt to upload.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const res = await uploadStaffFinanceAttachments(token, requestId, docUris);
      setDetail(res.data);
      setDocUris([]);
      onPortalNotify?.('Receipts uploaded.', 'success');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setFormError(null);
    try {
      await submitStaffFinanceRequest(token, requestId);
      onPortalNotify?.('Request submitted for approval.', 'success');
      navigation.replace('RecordDetail', {
        moduleRoute,
        detailKind: 'finance_petty_cash_request',
        recordId: requestId,
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Submit failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !detail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.accentTeal} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !detail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ color: colors.trendDown }}>{error}</Text>
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
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ ...outfit('medium', 16), color: '#fff' }}>{detail?.ref ?? 'Draft'}</Text>
          <Text style={{ ...outfit('regular', 12), color: 'rgba(255,255,255,0.75)' }}>
            {staffFinanceTypeLabel(requestType)} · {detail?.status_label ?? 'Draft'}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <DetailTabBar tabs={tabs} active={tab} onChange={(id) => setTab(id as WorkspaceTab)} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: scrollBottomPadding }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {tab === TAB_OVERVIEW ? (
          <View style={styles.leaveFormCard}>
            <StaffFinanceReadOnlyField label="Document no." value={detail?.document_no ?? detail?.ref ?? ''} />
            <StaffFinanceReadOnlyField label="Date requested" value={detail?.requested_date?.slice(0, 10) ?? ''} />
            <StaffFinanceReadOnlyField label="Requested by" value={detail?.requested_by_label ?? ''} />
            {detail?.site_label ? <StaffFinanceReadOnlyField label="Site" value={detail.site_label} /> : null}
            {detail?.store_label ? <StaffFinanceReadOnlyField label="Store" value={detail.store_label} /> : null}
            <StaffFinanceReadOnlyField label="Workflow status" value={detail?.status_label ?? ''} />
            <StaffFinanceReadOnlyField label="Request category" value={detail?.request_category_label ?? detail?.request_category ?? ''} />
            <StaffFinanceReadOnlyField label="Currency" value={detail?.currency ?? ''} />
            <StaffFinanceReadOnlyField label="Payment method" value={detail?.payment_method_label ?? ''} />
            <StaffFinanceReadOnlyField label="Purpose" value={detail?.description ?? ''} />
            <StaffFinanceReadOnlyField
              label="Total amount"
              value={`${(detail?.total_amount ?? 0).toLocaleString()} ${detail?.currency ?? ''}`}
            />
            {detail?.amount_in_word ? (
              <StaffFinanceReadOnlyField label="Amount in words" value={detail.amount_in_word} />
            ) : null}
            <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 16 }}>Before submit:</Text>
            <Text style={{ ...outfit('regular', 13), color: lineCount >= 1 ? colors.textPrimary : colors.trendDown, marginTop: 4 }}>
              {lineCount >= 1 ? '✓' : '○'} At least one amount line ({lineCount})
            </Text>
            {isExpenseClaim ? (
              <Text style={{ ...outfit('regular', 13), color: docCount >= 1 ? colors.textPrimary : colors.trendDown, marginTop: 4 }}>
                {docCount >= 1 ? '✓' : '○'} At least one receipt ({docCount})
              </Text>
            ) : null}
            {editable ? (
              <>
                <Pressable style={[styles.detailsButton, { marginTop: 16 }]} onPress={() => setTab(TAB_LINES)}>
                  <Text style={styles.detailsButtonText}>Edit lines</Text>
                </Pressable>
                {isExpenseClaim ? (
                  <Pressable style={[styles.detailsButton, { marginTop: 8 }]} onPress={() => setTab(TAB_DOCUMENTS)}>
                    <Text style={styles.detailsButtonText}>Upload receipts</Text>
                  </Pressable>
                ) : null}
                {detail?.can_submit ? (
                  <Pressable
                    style={[styles.primaryAction, { marginTop: 16 }, !canSubmit || busy ? { opacity: 0.55 } : null]}
                    disabled={!canSubmit || busy}
                    onPress={() => void submit()}
                  >
                    <Text style={styles.primaryActionText}>Submit for approval</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}

        {tab === TAB_DETAILS ? (
          <View style={styles.leaveFormCard}>
            {!editable ? (
              <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginBottom: 12 }}>
                Header is read-only after submit.
              </Text>
            ) : null}
            <StaffFinanceSiteStoreFields
              sites={locationOptions?.sites ?? []}
              stores={locationOptions?.stores ?? []}
              siteId={siteId}
              storeId={storeId}
              onSiteChange={setSiteId}
              onStoreChange={setStoreId}
              editable={editable}
              siteLabel={detail?.site_label}
              storeLabel={detail?.store_label}
            />

            <Text style={[styles.approvalType, { marginBottom: 8 }]}>Category</Text>
            <View style={styles.leaveTypeWrap}>
              {STAFF_FINANCE_CATEGORIES.map((c) => (
                <Pressable
                  key={c.value}
                  style={[styles.leaveTypeChip, requestCategory === c.value ? styles.leaveTypeChipActive : null]}
                  disabled={!editable}
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
                  disabled={!editable}
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
              editable={editable}
              placeholder="Purpose of request"
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
                  disabled={!editable}
                  onPress={() => setPaymentMethod(m.value)}
                >
                  <Text style={styles.menuChipText}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
            {editable ? (
              <Pressable style={[styles.primaryAction, { marginTop: 16 }]} disabled={busy} onPress={() => void saveHeader()}>
                <Text style={styles.primaryActionText}>Save header</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {tab === TAB_LINES ? (
          <StaffFinanceLinesPanel
            lines={detail?.lines ?? []}
            currency={currency}
            editable={editable}
            busy={busy}
            editingLineId={editingLineId}
            lineDesc={lineDesc}
            lineAmount={lineAmount}
            onLineDescChange={setLineDesc}
            onLineAmountChange={setLineAmount}
            onEditLine={(line) => {
              setEditingLineId(line.id);
              setLineDesc(line.line_description);
              setLineAmount(String(line.amount));
            }}
            onCancelEdit={() => {
              setEditingLineId(null);
              setLineDesc('');
              setLineAmount('');
            }}
            onRemoveLine={removeLine}
            onSaveLine={() => void saveLine()}
            onFormFieldFocus={scrollAmountFieldIntoView}
          />
        ) : null}

        {tab === TAB_DOCUMENTS && isExpenseClaim ? (
          <View style={styles.leaveFormCard}>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 8 }}>
              At least one receipt is required before submit.
            </Text>
            {(detail?.attachments ?? []).map((att) => (
              <Pressable key={att.id} onPress={() => void Linking.openURL(att.download_url)} style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.accentTeal, ...outfit('medium', 13) }}>{att.name}</Text>
              </Pressable>
            ))}
            {editable ? (
              <>
                <Pressable onPress={() => void pickDocuments()} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Ionicons name="camera-outline" size={22} color={colors.accentTeal} />
                  <Text style={{ marginLeft: 8, color: colors.accentTeal, ...outfit('medium', 13) }}>Select receipt photos</Text>
                </Pressable>
                {docUris.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {docUris.map((uri) => (
                      <Image key={uri} source={{ uri }} style={{ width: 64, height: 64, borderRadius: 8 }} />
                    ))}
                  </View>
                ) : null}
                <Pressable style={[styles.primaryAction, { marginTop: 12 }]} disabled={busy} onPress={() => void uploadDocuments()}>
                  <Text style={styles.primaryActionText}>Upload receipts</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}

        {formError ? (
          <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginTop: 12 }}>{formError}</Text>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
