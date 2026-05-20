import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../components/AppTypography';
import {
  createCategory,
  createSupplier,
  createUnit,
  getCategoryDetail,
  getSupplierDetail,
  getUnitDetail,
  updateCategory,
  updateSupplier,
  updateUnit,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';

type CatalogKind = 'supplier' | 'unit' | 'category';

export function MasterCatalogEditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'MasterCatalogEdit'>>();
  const { kind, recordId, moduleRoute } = route.params;
  const isEdit = Boolean(recordId?.trim());
  const { token } = useStaffPortal();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [uom, setUom] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Active');
  const [paymentType, setPaymentType] = useState('Cash');
  const [accountNo, setAccountNo] = useState('');

  const title =
    kind === 'supplier'
      ? isEdit
        ? 'Edit supplier'
        : 'New supplier'
      : kind === 'unit'
        ? isEdit
          ? 'Edit unit'
          : 'New unit'
        : isEdit
          ? 'Edit category'
          : 'New category';

  const load = useCallback(async () => {
    if (!isEdit || !token || !recordId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (kind === 'supplier') {
        const res = await getSupplierDetail(token, recordId);
        const d = res.data;
        setCode(d.code);
        setName(d.name);
        setPhone(d.phone);
        setEmail(d.email);
        setAddress(d.address);
        setStatus(d.status || 'Active');
        setPaymentType(d.payment_type || 'Cash');
        setAccountNo(d.account_no);
      } else if (kind === 'unit') {
        const res = await getUnitDetail(token, recordId);
        setUom(res.data.uom);
        setDescription(res.data.description);
        setStatus(res.data.status || 'Active');
      } else {
        const res = await getCategoryDetail(token, recordId);
        setName(res.data.name);
        setStatus(res.data.status || 'Active');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load record.');
    } finally {
      setLoading(false);
    }
  }, [isEdit, kind, recordId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      if (kind === 'supplier') {
        const body = {
          code: code.trim(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          status: status.trim(),
          payment_type: paymentType,
          account_no: accountNo.trim(),
        };
        if (isEdit && recordId) {
          await updateSupplier(token, recordId, body);
        } else {
          await createSupplier(token, body);
        }
      } else if (kind === 'unit') {
        const body = { uom: uom.trim(), description: description.trim(), status: status.trim() };
        if (isEdit && recordId) {
          await updateUnit(token, recordId, body);
        } else {
          await createUnit(token, body);
        }
      } else {
        const body = { name: name.trim(), status: status.trim() };
        if (isEdit && recordId) {
          await updateCategory(token, recordId, body);
        } else {
          await createCategory(token, body);
        }
      }
      navigation.navigate('ModuleList', { moduleRoute });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

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
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accentTeal} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {error ? (
            <Text style={{ ...outfit('regular', 13), color: '#b91c1c', marginBottom: 12 }}>{error}</Text>
          ) : null}
          {kind === 'supplier' ? (
            <>
              <Field label="Code" value={code} onChangeText={setCode} />
              <Field label="Name" value={name} onChangeText={setName} />
              <Field label="Phone" value={phone} onChangeText={setPhone} />
              <Field label="Email" value={email} onChangeText={setEmail} />
              <Field label="Address" value={address} onChangeText={setAddress} multiline />
              <Field label="Payment type" value={paymentType} onChangeText={setPaymentType} hint="Bank, Cash, or Mobile" />
              <Field label="Account no." value={accountNo} onChangeText={setAccountNo} />
              <Field label="Status" value={status} onChangeText={setStatus} />
            </>
          ) : null}
          {kind === 'unit' ? (
            <>
              <Field label="UOM" value={uom} onChangeText={setUom} />
              <Field label="Description" value={description} onChangeText={setDescription} />
              <Field label="Status" value={status} onChangeText={setStatus} />
            </>
          ) : null}
          {kind === 'category' ? (
            <>
              <Field label="Name" value={name} onChangeText={setName} />
              <Field label="Status" value={status} onChangeText={setStatus} />
            </>
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
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 8,
          ...outfit('regular', 14),
          color: colors.textPrimary,
        }}
      />
      {hint ? <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}
