import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { OptionPicker } from '../components/parts/OptionPicker';
import {
  activatePriceCatalogRow,
  createPartConversion,
  createPartInStore,
  createPriceCatalogRow,
  getPartConversionCreateContext,
  getPartConversionDetail,
  getPartInStoreCreateContext,
  getPartInStoreDetail,
  getPriceCatalogCreateContext,
  getPriceCatalogDetail,
  updatePartConversion,
  updatePartInStore,
  updatePriceCatalogRow,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { ScreenAccessDenied } from '../components/ScreenAccessDenied';
import { useStaffPortal } from '../context/StaffPortalContext';
import { useScreenAccessGate } from '../hooks/useScreenAccessGate';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import type { CrudResource } from '../utils/crudPermissions';

export function PartsMgmtEditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PartsMgmtEdit'>>();
  const { kind, moduleRoute, recordId } = route.params;
  const isEdit = Boolean(recordId?.trim());
  const { token, portal } = useStaffPortal();

  const resource: CrudResource =
    kind === 'in_store'
      ? 'parts_in_store'
      : kind === 'conversion'
        ? 'part_conversions'
        : 'price_catalog';

  const access = useScreenAccessGate({
    portal,
    moduleRoute,
    resource,
    requireCreate: !isEdit,
    requireUpdate: isEdit,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [partId, setPartId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [minQty, setMinQty] = useState('1');
  const [maxQty, setMaxQty] = useState('0');
  const [status, setStatus] = useState('Active');
  const [orderUnitId, setOrderUnitId] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priceMode, setPriceMode] = useState('active');
  const [notes, setNotes] = useState('');

  const [catalogParts, setCatalogParts] = useState<{ id: string; label: string }[]>([]);
  const [stores, setStores] = useState<{ id: string; label: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; label: string }[]>([]);
  const [currencies, setCurrencies] = useState<{ id: string; label: string }[]>([]);
  const [priceModes, setPriceModes] = useState<{ id: string; label: string }[]>([]);

  const title =
    kind === 'in_store'
      ? isEdit
        ? 'Edit part in store'
        : 'New part in store'
      : kind === 'conversion'
        ? isEdit
          ? 'Edit conversion'
          : 'New conversion'
        : isEdit
          ? 'Edit price row'
          : 'New price row';

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (kind === 'in_store') {
        const ctx = (await getPartInStoreCreateContext(token)).data;
        setCatalogParts(ctx.catalog_parts);
        setStores(ctx.stores.map((s) => ({ id: s.id, label: `${s.name}${s.site ? ` · ${s.site}` : ''}` })));
        if (!isEdit) {
          setCode(ctx.suggested_code);
        }
        if (isEdit && recordId) {
          const d = (await getPartInStoreDetail(token, recordId)).data;
          setCode(d.code);
          setPartId(d.catalog_part_id ?? '');
          setStoreId(d.store_id ?? '');
          setMinQty(String(d.min_qty));
          setMaxQty(String(d.max_qty));
          setStatus(d.status);
        }
      } else if (kind === 'conversion') {
        const ctx = (await getPartConversionCreateContext(token)).data;
        setCatalogParts(ctx.catalog_parts);
        setUnits(ctx.units);
        if (isEdit && recordId) {
          const d = (await getPartConversionDetail(token, recordId)).data;
          setPartId(d.part_id);
          setOrderUnitId(d.order_unit_id);
          setExchangeRate(String(d.exchange_rate));
        }
      } else {
        const ctx = (await getPriceCatalogCreateContext(token)).data;
        setCatalogParts(ctx.catalog_parts);
        setCurrencies(ctx.currencies.map((c) => ({ id: c.code, label: c.label })));
        const modes = isEdit ? ctx.update_price_modes : ctx.price_modes;
        setPriceModes(modes.map((m) => ({ id: m.value, label: m.label })));
        if (isEdit && recordId) {
          const d = (await getPriceCatalogDetail(token, recordId)).data;
          setPartId(d.part_id);
          setPrice(String(d.price));
          setCurrency(d.currency);
          setStartDate(d.start_date ?? '');
          setEndDate(d.end_date ?? '');
          setPriceMode(d.status === 'scheduled' ? 'scheduled' : d.status === 'expired' ? 'expired' : 'active');
          setNotes(d.notes ?? '');
        } else if (ctx.currencies[0]) {
          setCurrency(ctx.currencies[0].code);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load form.');
    } finally {
      setLoading(false);
    }
  }, [isEdit, kind, recordId, token]);

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
      if (kind === 'in_store') {
        const body = {
          code: code.trim(),
          part_id: Number(partId),
          store_id: Number(storeId),
          min_qty: Number(minQty),
          max_qty: Number(maxQty),
          status: status.trim(),
        };
        if (isEdit && recordId) {
          await updatePartInStore(token, recordId, body);
        } else {
          await createPartInStore(token, body);
        }
      } else if (kind === 'conversion') {
        const body = {
          part_id: Number(partId),
          order_unit: Number(orderUnitId),
          exchange_rate: Number(exchangeRate),
        };
        if (isEdit && recordId) {
          await updatePartConversion(token, recordId, body);
        } else {
          await createPartConversion(token, body);
        }
      } else {
        const body = {
          part_id: Number(partId),
          price: Number(price),
          currency: currency.trim(),
          start_date: startDate.trim(),
          end_date: endDate.trim(),
          price_mode: priceMode,
          notes: notes.trim() || undefined,
        };
        if (isEdit && recordId) {
          await updatePriceCatalogRow(token, recordId, body);
        } else {
          await createPriceCatalogRow(token, body);
        }
      }
      navigation.navigate('ModuleList', { moduleRoute });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onActivate = async () => {
    if (!token || !recordId || kind !== 'price_catalog') {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await activatePriceCatalogRow(token, recordId);
      navigation.navigate('RecordDetail', {
        moduleRoute,
        detailKind: 'price_catalog',
        recordId,
        titleHint: '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activate failed.');
    } finally {
      setSaving(false);
    }
  };

  if (access.moduleGate === 'denied' || (isEdit && !access.canUpdate) || (!isEdit && !access.canCreate)) {
    return <ScreenAccessDenied message={access.deniedMessage} />;
  }

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
          {kind === 'in_store' ? (
            <>
              <Field label="Record code" value={code} onChangeText={setCode} />
              <OptionPicker label="Catalog part" options={catalogParts} valueId={partId} onSelect={setPartId} disabled={isEdit} />
              <OptionPicker label="Store" options={stores} valueId={storeId} onSelect={setStoreId} />
              <Field label="Min quantity" value={minQty} onChangeText={setMinQty} keyboard="decimal-pad" />
              <Field label="Max quantity" value={maxQty} onChangeText={setMaxQty} keyboard="decimal-pad" />
              <Field label="Status" value={status} onChangeText={setStatus} />
            </>
          ) : null}
          {kind === 'conversion' ? (
            <>
              <OptionPicker label="Catalog part" options={catalogParts} valueId={partId} onSelect={setPartId} />
              <OptionPicker label="Order unit" options={units} valueId={orderUnitId} onSelect={setOrderUnitId} />
              <Field label="Exchange rate" value={exchangeRate} onChangeText={setExchangeRate} keyboard="decimal-pad" hint="Units per 1 catalog UOM" />
            </>
          ) : null}
          {kind === 'price_catalog' ? (
            <>
              <OptionPicker label="Catalog part" options={catalogParts} valueId={partId} onSelect={setPartId} disabled={isEdit} />
              <Field label="Price" value={price} onChangeText={setPrice} keyboard="decimal-pad" />
              <OptionPicker label="Currency" options={currencies} valueId={currency} onSelect={setCurrency} />
              <Field label="Start date" value={startDate} onChangeText={setStartDate} hint="YYYY-MM-DD" />
              <Field label="End date" value={endDate} onChangeText={setEndDate} hint="YYYY-MM-DD" />
              <OptionPicker label="Status mode" options={priceModes} valueId={priceMode} onSelect={setPriceMode} />
              <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
              {isEdit && access.canUpdate ? (
                <Pressable onPress={() => void onActivate()} style={{ marginTop: 12, padding: 14, borderRadius: 10, backgroundColor: colors.statusApprovedBg }}>
                  <Text style={{ ...outfit('medium', 14), color: colors.statusApprovedText, textAlign: 'center' }}>Set as active price</Text>
                </Pressable>
              ) : null}
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
  keyboard,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  hint?: string;
  multiline?: boolean;
  keyboard?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboard}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 8,
          color: colors.textPrimary,
        }}
      />
      {hint ? <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}
