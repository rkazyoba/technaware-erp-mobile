import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { isoDateFromLocalDate } from '../components/DatePickerField';
import { FormSection, ReadonlyField, SearchableSelectField, type SearchableSelectOption } from '../components/SearchableSelectField';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import { getStockReportStores, getSuppliers, postSupplierReturnHeader, type StockReportStoreItem, type SupplierListItem } from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';

function isoToday(): string {
  return isoDateFromLocalDate(new Date());
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SupplierReturnHeaderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();

  const [stores, setStores] = useState<StockReportStoreItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);

  const [storeId, setStoreId] = useState('');
  const [storeLabel, setStoreLabel] = useState('');
  const [siteId, setSiteId] = useState('');
  const [siteLabel, setSiteLabel] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierLabel, setSupplierLabel] = useState('');
  const [description, setDescription] = useState('');
  const [returnedDate] = useState(isoToday());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Supplier returns');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [storesRes, supRes] = await Promise.all([getStockReportStores(token), getSuppliers(token, 1, 100)]);
        setStores(storesRes.data.items ?? []);
        setSuppliers(supRes.data.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load form data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const storeOptions: SearchableSelectOption[] = useMemo(
    () =>
      stores.map((s) => ({
        id: s.id,
        label: s.name,
        subtitle: s.site || undefined,
      })),
    [stores],
  );

  const supplierOptions: SearchableSelectOption[] = useMemo(
    () =>
      suppliers.map((s) => ({
        id: s.id,
        label: s.name,
        subtitle: s.code || undefined,
      })),
    [suppliers],
  );

  const onSelectStore = (opt: SearchableSelectOption) => {
    const hit = stores.find((s) => s.id === opt.id);
    setStoreId(opt.id);
    setStoreLabel(opt.label);
    setSiteId(hit?.site_id ?? '');
    setSiteLabel(hit?.site ?? '');
  };

  const onSelectSupplier = (opt: SearchableSelectOption) => {
    setSupplierId(opt.id);
    setSupplierLabel(opt.label);
  };

  const inputStyle = {
    backgroundColor: colors.pageBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    ...outfit('regular', 14),
    color: colors.textPrimary,
  } as const;

  const onSave = async () => {
    if (!token) {
      return;
    }
    if (!description.trim()) {
      Alert.alert('Check form', 'Enter a description for this return.');
      return;
    }
    if (!storeId || !siteId || !supplierId) {
      Alert.alert('Check form', 'Select store and supplier.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await postSupplierReturnHeader(token, {
        supplier_id: Number(supplierId),
        site_id: Number(siteId),
        store_id: Number(storeId),
        description: description.trim(),
        returned_date: returnedDate,
        order_type: 1,
      });
      navigation.replace('SupplierReturnWorkspace', {
        supplierReturnId: res.data.id,
        initialTab: 'lines',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save supplier return.';
      setError(message);
      Alert.alert('Could not save', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title="New supplier return"
        subtitle="Return header"
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
        right={
          <Pressable disabled={saving} onPress={() => void onSave()} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ ...outfit('medium', 13), color: saving ? colors.textMuted : colors.accentTeal }}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        }
      />

      {loading ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accentTeal} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 14 }}>
            Save the header first, then add return lines on the workspace (same as web ERP).
          </Text>

          {error ? (
            <Text style={{ ...outfit('regular', 13), color: colors.statusRejectedText, marginBottom: 12 }}>{error}</Text>
          ) : null}

          <FormSection title="Identification">
            <ReadonlyField
              label="Return no."
              value="Assigned when you save"
              hint="Suggested next number is generated on save."
            />
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Supplier return for…"
              placeholderTextColor={colors.textMuted}
              style={inputStyle}
            />
          </FormSection>

          <FormSection title="Return details">
            <ReadonlyField label="Returned date" value={formatDisplayDate(returnedDate)} hint="Recorded as today's date." />
            <SearchableSelectField
              label="Supplier"
              placeholder="Search supplier"
              valueLabel={supplierLabel}
              options={supplierOptions}
              onSelect={onSelectSupplier}
              modalTitle="Supplier"
              searchPlaceholder="Search supplier name"
            />
            <SearchableSelectField
              label="Store"
              hint="Store stock is returned from."
              placeholder="Search store"
              valueLabel={storeLabel}
              options={storeOptions}
              onSelect={onSelectStore}
              modalTitle="Store"
              searchPlaceholder="Search store or site"
            />
            <ReadonlyField label="Site" value={siteLabel} hint={storeId ? 'From selected store.' : 'Select a store first.'} />
          </FormSection>

          <Pressable
            onPress={() => void onSave()}
            disabled={saving}
            style={{
              marginTop: 8,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: saving ? colors.borderSubtle : colors.primaryNavy,
              alignItems: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Save header & add lines</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
