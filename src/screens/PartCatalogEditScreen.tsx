import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { OptionPicker } from '../components/parts/OptionPicker';
import {
  createPart,
  getPartCatalogCreateContext,
  getPartCatalogDetail,
  updatePart,
  type PartCatalogCreateContext,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { ScreenAccessDenied } from '../components/ScreenAccessDenied';
import { useStaffPortal } from '../context/StaffPortalContext';
import { useScreenAccessGate } from '../hooks/useScreenAccessGate';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';

export function PartCatalogEditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PartCatalogEdit'>>();
  const { moduleRoute, recordId } = route.params;
  const isEdit = Boolean(recordId?.trim());
  const { token, portal } = useStaffPortal();

  const access = useScreenAccessGate({
    portal,
    moduleRoute: 'Part catalog',
    resource: 'parts',
    requireCreate: !isEdit,
    requireUpdate: isEdit,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<PartCatalogCreateContext | null>(null);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [unitId, setUnitId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [trackingMethod, setTrackingMethod] = useState('');
  const [status, setStatus] = useState('Active');

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ctxRes = await getPartCatalogCreateContext(token);
      setCtx(ctxRes.data);
      if (isEdit && recordId) {
        const d = (await getPartCatalogDetail(token, recordId)).data;
        setCode(d.code);
        setDescription(d.description);
        setStatus(d.status || 'Active');
        setUnitId(d.unit_id ?? '');
        setCategoryId(d.category_id ?? '');
        setSupplierId(d.supplier_id ?? '');
        setTrackingMethod(d.tracking_method ?? '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load form.');
    } finally {
      setLoading(false);
    }
  }, [isEdit, recordId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!token) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        code: code.trim(),
        description: description.trim(),
        unit_id: Number(unitId),
        category_id: Number(categoryId),
        supplier_id: Number(supplierId),
        tracking_method: trackingMethod.trim(),
        status: status.trim(),
      };
      if (isEdit && recordId) {
        await updatePart(token, recordId, body);
      } else {
        await createPart(token, body);
      }
      navigation.navigate('ModuleList', { moduleRoute });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (access.moduleGate === 'denied' || (isEdit && !access.canUpdate) || (!isEdit && !access.canCreate)) {
    return <ScreenAccessDenied message={access.deniedMessage} />;
  }

  const title = isEdit ? 'Edit catalog part' : 'New catalog part';

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
          <Field label="Code" value={code} onChangeText={setCode} />
          <Field label="Description" value={description} onChangeText={setDescription} />
          {ctx ? (
            <>
              <OptionPicker label="Unit" options={ctx.units} valueId={unitId} onSelect={setUnitId} />
              <OptionPicker label="Category" options={ctx.categories} valueId={categoryId} onSelect={setCategoryId} />
              <OptionPicker label="Supplier" options={ctx.suppliers} valueId={supplierId} onSelect={setSupplierId} />
            </>
          ) : null}
          <Field label="Tracking method" value={trackingMethod} onChangeText={setTrackingMethod} />
          <Field label="Status" value={status} onChangeText={setStatus} hint="Active or Inactive" />
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  hint?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
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
