import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { safeOpenUrl } from '../utils/safeOpenUrl';
import {
  deleteStaffFinanceLine,
  getPettyCashRequestDetail,
  saveStaffFinanceLine,
  submitStaffFinanceRequest,
  updateStaffFinanceRetirementHeader,
  uploadStaffFinanceAttachments,
  type PettyCashRequestDetail,
} from '../api';
import { Text } from '../components/AppTypography';
import { DatePickerField } from '../components/DatePickerField';
import { DetailTabBar } from '../components/DetailTabBar';
import { StaffFinanceLinesPanel } from '../components/finance/StaffFinanceLinesPanel';
import { StaffFinanceReadOnlyField } from '../components/finance/StaffFinanceReadOnlyField';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { ScreenAccessDenied } from '../components/ScreenAccessDenied';
import { useStaffPortal } from '../context/StaffPortalContext';
import { useScreenAccessGate } from '../hooks/useScreenAccessGate';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { styles } from '../styles/appStyles';

const TAB_OVERVIEW = 'overview';
const TAB_DETAILS = 'details';
const TAB_LINES = 'lines';
const TAB_DOCUMENTS = 'documents';

type RetirementTab = typeof TAB_OVERVIEW | typeof TAB_DETAILS | typeof TAB_LINES | typeof TAB_DOCUMENTS;

export function StaffFinanceRetirementWorkspaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'StaffFinanceRetirementWorkspace'>>();
  const { retirementId } = route.params;
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const access = useScreenAccessGate({
    portal,
    moduleRoute: route.params.moduleRoute ?? 'Staff finance',
    requireUpdate: true,
  });

  const [detail, setDetail] = useState<PettyCashRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<RetirementTab>(TAB_OVERVIEW);
  const [notes, setNotes] = useState('');
  const [retiredDate, setRetiredDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lineDesc, setLineDesc] = useState('');
  const [lineAmount, setLineAmount] = useState('');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [docUris, setDocUris] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const editable = Boolean(detail?.can_edit);
  const lineCount = detail?.lines?.length ?? 0;
  const docCount = detail?.attachments?.length ?? 0;

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Imprest retirements');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await getPettyCashRequestDetail(token, retirementId);
      setDetail(res.data);
      setNotes(res.data.retirement_notes ?? '');
      setRetiredDate(res.data.retired_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load retirement.');
    } finally {
      setLoading(false);
    }
  }, [token, retirementId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void reload();
    }, [reload]),
  );

  const saveDetails = async () => {
    if (!editable) return;
    const date = retiredDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError('Retired date must be YYYY-MM-DD.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const res = await updateStaffFinanceRetirementHeader(token, retirementId, {
        retirement_notes: notes.trim(),
        retired_date: date,
      });
      setDetail(res.data);
      onPortalNotify?.('Retirement details saved.', 'success');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save details.');
    } finally {
      setBusy(false);
    }
  };

  const saveLine = async () => {
    if (!editable) return;
    const desc = lineDesc.trim();
    const amount = parseFloat(lineAmount.replace(/,/g, ''));
    if (!desc) {
      setFormError('Enter what was purchased or spent.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter a valid amount.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const res = await saveStaffFinanceLine(token, retirementId, {
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
    Alert.alert('Remove line?', 'This consumption line will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              const res = await deleteStaffFinanceLine(token, retirementId, lineId);
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
      setFormError('Allow photo access to attach documents.');
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
      setFormError('Select at least one document to upload.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const res = await uploadStaffFinanceAttachments(token, retirementId, docUris);
      setDetail(res.data);
      setDocUris([]);
      onPortalNotify?.('Documents uploaded.', 'success');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!detail?.can_submit) return;
    if ((detail.lines?.length ?? 0) < 1) {
      setFormError('Add at least one consumption line.');
      setTab(TAB_LINES);
      return;
    }
    if ((detail.attachments?.length ?? 0) < 1) {
      setFormError('Upload at least one supporting document.');
      setTab(TAB_DOCUMENTS);
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await updateStaffFinanceRetirementHeader(token, retirementId, {
        retirement_notes: notes.trim(),
        retired_date: retiredDate.trim(),
      });
      await submitStaffFinanceRequest(token, retirementId);
      onPortalNotify?.('Retirement submitted for approval.', 'success');
      navigation.replace('RecordDetail', {
        moduleRoute: 'Imprest retirements',
        detailKind: 'finance_petty_cash_request',
        recordId: retirementId,
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Submit failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !detail) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (error && !detail) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ color: colors.trendDown }}>{error}</Text>
      </View>
    );
  }

  if (access.moduleGate === 'denied' || !access.canUpdate) {
    return <ScreenAccessDenied message={access.deniedMessage} />;
  }

  const tabs = [
    { id: TAB_OVERVIEW, label: 'Overview' },
    { id: TAB_DETAILS, label: 'Details' },
    { id: TAB_LINES, label: 'Lines' },
    { id: TAB_DOCUMENTS, label: 'Documents' },
  ];

  const currency = detail?.currency ?? 'TZS';
  const fmt = (n: number | null | undefined) =>
    n != null ? `${n.toLocaleString()} ${currency}` : `— ${currency}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
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
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>
          {detail?.ref ?? 'Retirement'}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <DetailTabBar tabs={tabs} active={tab} onChange={(id) => setTab(id as RetirementTab)} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {tab === TAB_OVERVIEW ? (
          <View style={styles.leaveFormCard}>
            <StaffFinanceReadOnlyField label="Retirement no." value={detail?.document_no ?? ''} />
            <StaffFinanceReadOnlyField label="Imprest request" value={detail?.imprest_parent_ref ?? ''} />
            <StaffFinanceReadOnlyField label="Workflow status" value={detail?.status_label ?? ''} />
            <StaffFinanceReadOnlyField label="Requested amount (advance)" value={fmt(detail?.requested_amount)} />
            <StaffFinanceReadOnlyField label="Total spent (from lines)" value={fmt(detail?.total_spent ?? detail?.total_amount)} />
            <StaffFinanceReadOnlyField label="Refund from staff" value={fmt(detail?.refund_from_staff)} />
            <StaffFinanceReadOnlyField label="Refund to staff" value={fmt(detail?.refund_to_staff)} />
            <StaffFinanceReadOnlyField label="Unspent balance" value={fmt(detail?.outstanding_amount ?? detail?.refund_from_staff)} />
            {detail?.amount_in_word ? (
              <StaffFinanceReadOnlyField label="Amount in words (spent)" value={detail.amount_in_word} />
            ) : null}
            {detail?.retired_date ? (
              <StaffFinanceReadOnlyField label="Retired date" value={detail.retired_date.slice(0, 10)} />
            ) : null}
            <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 8 }}>Before submit:</Text>
            <Text style={{ ...outfit('regular', 13), color: lineCount >= 1 ? colors.textPrimary : colors.trendDown, marginTop: 4 }}>
              {lineCount >= 1 ? '✓' : '○'} At least one consumption line
            </Text>
            <Text style={{ ...outfit('regular', 13), color: docCount >= 1 ? colors.textPrimary : colors.trendDown, marginTop: 4 }}>
              {docCount >= 1 ? '✓' : '○'} At least one supporting document
            </Text>
            {editable ? (
              <>
                <Pressable style={[styles.detailsButton, { marginTop: 12 }]} onPress={() => setTab(TAB_DETAILS)}>
                  <Text style={styles.detailsButtonText}>Edit details</Text>
                </Pressable>
                <Pressable style={[styles.detailsButton, { marginTop: 8 }]} onPress={() => setTab(TAB_LINES)}>
                  <Text style={styles.detailsButtonText}>Edit lines</Text>
                </Pressable>
              </>
            ) : null}
            {editable && detail?.can_submit ? (
              <Pressable
                style={[styles.primaryAction, { marginTop: 16 }, busy ? { opacity: 0.65 } : null]}
                disabled={busy}
                onPress={() => void submit()}
              >
                <Text style={styles.primaryActionText}>Submit for approval</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {tab === TAB_DETAILS ? (
          <View style={styles.leaveFormCard}>
            <StaffFinanceReadOnlyField label="Description (from imprest)" value={detail?.description ?? ''} />
            <StaffFinanceReadOnlyField label="Currency" value={currency} />
            <StaffFinanceReadOnlyField label="Requested amount" value={fmt(detail?.requested_amount)} />
            <StaffFinanceReadOnlyField label="Total spent" value={fmt(detail?.total_spent ?? detail?.total_amount)} />
            {editable ? (
              <DatePickerField label="Retired date" value={retiredDate} onChange={setRetiredDate} marginTop={8} />
            ) : (
              <StaffFinanceReadOnlyField label="Retired date" value={retiredDate} />
            )}
            <Text style={[styles.approvalType, { marginTop: 16 }]}>Spending summary</Text>
            <TextInput
              style={[styles.approvalNoteInput, { minHeight: 96, textAlignVertical: 'top' }]}
              multiline
              editable={editable}
              placeholder="What was purchased, dates, amounts…"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
            {editable ? (
              <Pressable style={[styles.primaryAction, { marginTop: 12 }]} disabled={busy} onPress={() => void saveDetails()}>
                <Text style={styles.primaryActionText}>Save details</Text>
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
            addFormTitle="Add consumption line"
            editFormTitle="Edit consumption line"
            emptyHint="Add each purchase or expense from this imprest."
          />
        ) : null}

        {tab === TAB_DOCUMENTS ? (
          <View style={styles.leaveFormCard}>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 8 }}>
              At least one document is required before submit.
            </Text>
            {(detail?.attachments ?? []).map((att) => (
              <Pressable key={att.id} onPress={() => void safeOpenUrl(att.download_url)} style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.accentTeal, ...outfit('medium', 13) }}>{att.name}</Text>
              </Pressable>
            ))}
            {editable ? (
              <>
                <Pressable onPress={() => void pickDocuments()} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Ionicons name="camera-outline" size={22} color={colors.accentTeal} />
                  <Text style={{ marginLeft: 8, color: colors.accentTeal, ...outfit('medium', 13) }}>Select photos</Text>
                </Pressable>
                {docUris.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {docUris.map((uri) => (
                      <Image key={uri} source={{ uri }} style={{ width: 64, height: 64, borderRadius: 8 }} />
                    ))}
                  </View>
                ) : null}
                <Pressable style={[styles.primaryAction, { marginTop: 12 }]} disabled={busy} onPress={() => void uploadDocuments()}>
                  <Text style={styles.primaryActionText}>Upload documents</Text>
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
    </View>
  );
}
