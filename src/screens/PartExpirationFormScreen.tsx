import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { OptionPicker } from '../components/parts/OptionPicker';
import {
  createPartExpiration,
  deletePartExpiration,
  getExpirationReceiptLinesContext,
  getExpirationReceiptsContext,
  getPartExpirationDetail,
  updatePartExpiration,
  type ExpirationLineOption,
  type ExpirationReceiptOption,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { ScreenAccessDenied } from '../components/ScreenAccessDenied';
import { useStaffPortal } from '../context/StaffPortalContext';
import { useScreenAccessGate } from '../hooks/useScreenAccessGate';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { PART_EXPIRATION_ROUTE } from '../utils/partsMgmtPortal';
import { canCrud } from '../utils/crudPermissions';

export function PartExpirationFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PartExpirationForm'>>();
  const { moduleRoute, recordId, receiptId: initialReceiptId } = route.params;
  const isEdit = Boolean(recordId?.trim());
  const { token, portal } = useStaffPortal();

  const access = useScreenAccessGate({
    portal,
    moduleRoute: PART_EXPIRATION_ROUTE,
    resource: 'part_expiration',
    requireCreate: !isEdit,
    requireUpdate: isEdit,
  });

  const canDelete = canCrud(portal, 'part_expiration', 'delete');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receipts, setReceipts] = useState<ExpirationReceiptOption[]>([]);
  const [receiptId, setReceiptId] = useState(initialReceiptId ?? '');
  const [lines, setLines] = useState<ExpirationLineOption[]>([]);
  const [lineId, setLineId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiredDate, setExpiredDate] = useState('');

  const receiptOptions = receipts.map((r) => ({
    id: r.id,
    label: `${r.receipt_no} · ${r.store_name} (${r.status_label})`,
  }));
  const lineOptions = lines.map((l) => ({
    id: l.id,
    label: `${l.part_code} — ${l.part_description} · remaining ${l.remaining_qty}`,
  }));

  const loadReceipts = useCallback(async () => {
    if (!token || isEdit) {
      return;
    }
    const res = await getExpirationReceiptsContext(token);
    setReceipts(res.data.items);
  }, [isEdit, token]);

  const loadLines = useCallback(
    async (rid: string) => {
      if (!token || !rid) {
        setLines([]);
        return;
      }
      const res = await getExpirationReceiptLinesContext(token, rid);
      setLines(res.data.lines);
    },
    [token],
  );

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEdit && recordId) {
        const d = (await getPartExpirationDetail(token, recordId)).data;
        setReceiptId(d.receipt_id);
        setLineId(d.po_receipt_line_id ?? '');
        setQuantity(String(d.quantity));
        setBatchNumber(d.batch_number ?? '');
        setManufactureDate(d.manufacture_date ?? '');
        setExpiredDate(d.expired_date ?? '');
        await loadLines(d.receipt_id);
      } else {
        await loadReceipts();
        if (initialReceiptId) {
          await loadLines(initialReceiptId);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load form.');
    } finally {
      setLoading(false);
    }
  }, [initialReceiptId, isEdit, loadLines, loadReceipts, recordId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isEdit && receiptId) {
      void loadLines(receiptId);
    }
  }, [isEdit, loadLines, receiptId]);

  const onSave = async () => {
    if (!token) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        po_receipt_line_id: Number(lineId),
        quantity: Number(quantity),
        batch_number: batchNumber.trim() || undefined,
        manufacture_date: manufactureDate.trim() || undefined,
        expired_date: expiredDate.trim(),
      };
      if (isEdit && recordId) {
        await updatePartExpiration(token, recordId, {
          quantity: body.quantity,
          batch_number: body.batch_number,
          manufacture_date: body.manufacture_date,
          expired_date: body.expired_date,
        });
      } else {
        await createPartExpiration(token, body);
      }
      navigation.navigate('ModuleList', { moduleRoute });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!token || !recordId || !canDelete) {
      return;
    }
    Alert.alert('Delete lot?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await deletePartExpiration(token, recordId);
              navigation.navigate('ModuleList', { moduleRoute });
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Delete failed.');
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  };

  if (access.moduleGate === 'denied' || (isEdit && !access.canUpdate) || (!isEdit && !access.canCreate)) {
    return <ScreenAccessDenied message={access.deniedMessage} />;
  }

  const title = isEdit ? 'Edit expiration lot' : 'Record expiration lot';

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>{title}</Text>
        <Pressable disabled={saving || loading} onPress={() => void onSave()} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accentTeal} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {error ? <Text style={{ color: colors.trendDown, marginBottom: 12 }}>{error}</Text> : null}
          {!isEdit ? (
            <OptionPicker
              label="GRN receipt"
              options={receiptOptions}
              valueId={receiptId}
              onSelect={(id) => {
                setReceiptId(id);
                setLineId('');
              }}
            />
          ) : (
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>GRN #{receiptId}</Text>
          )}
          <OptionPicker label="GRN line" options={lineOptions} valueId={lineId} onSelect={setLineId} disabled={isEdit} />
          <Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboard="decimal-pad" />
          <Field label="Batch number" value={batchNumber} onChangeText={setBatchNumber} />
          <Field label="Manufacture date" value={manufactureDate} onChangeText={setManufactureDate} hint="YYYY-MM-DD" />
          <Field label="Expiry date" value={expiredDate} onChangeText={setExpiredDate} hint="YYYY-MM-DD" />
          {isEdit && canDelete ? (
            <Pressable onPress={onDelete} style={{ marginTop: 20, padding: 14, borderRadius: 10, backgroundColor: colors.statusRejectedBg }}>
              <Text style={{ ...outfit('medium', 14), color: colors.statusRejectedText, textAlign: 'center' }}>Delete lot</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  hint,
  keyboard,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  hint?: string;
  keyboard?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          color: colors.textPrimary,
        }}
      />
      {hint ? <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}
