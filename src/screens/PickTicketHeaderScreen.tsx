import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { FormSection, ReadonlyField, SearchableSelectField, type SearchableSelectOption } from '../components/SearchableSelectField';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import { getStockReportStores, postPickTicketHeader, type StockReportStoreItem } from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';

export function PickTicketHeaderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();

  const [stores, setStores] = useState<StockReportStoreItem[]>([]);
  const [storeId, setStoreId] = useState('');
  const [storeLabel, setStoreLabel] = useState('');
  const [siteId, setSiteId] = useState('');
  const [siteLabel, setSiteLabel] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Pick tickets');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getStockReportStores(token);
        if (!cancelled) {
          setStores(res.data.items ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load stores.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const onSelectStore = (opt: SearchableSelectOption) => {
    const hit = stores.find((s) => s.id === opt.id);
    setStoreId(opt.id);
    setStoreLabel(opt.label);
    setSiteId(hit?.site_id ?? '');
    setSiteLabel(hit?.site ?? '');
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
      Alert.alert('Check form', 'Enter a description for this pick ticket.');
      return;
    }
    if (!storeId) {
      Alert.alert('Check form', 'Select a store.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await postPickTicketHeader(token, {
        store_id: Number(storeId),
        site_id: siteId ? Number(siteId) : null,
        description: description.trim(),
      });
      navigation.replace('PickTicketWorkspace', {
        pickTicketId: res.data.id,
        initialTab: 'lines',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save pick ticket.';
      setError(message);
      Alert.alert('Could not save', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title="New pick ticket"
        subtitle="Ticket header"
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
            Save the header first, then add pick lines on the workspace (same as web ERP).
          </Text>

          {error ? (
            <Text style={{ ...outfit('regular', 13), color: colors.statusRejectedText, marginBottom: 12 }}>{error}</Text>
          ) : null}

          <FormSection title="Identification">
            <ReadonlyField
              label="Pick ticket no."
              value="Assigned when you save"
              hint="Suggested next number is generated on save."
            />
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Pick ticket for…"
              placeholderTextColor={colors.textMuted}
              style={inputStyle}
            />
          </FormSection>

          <FormSection title="Pick details">
            <SearchableSelectField
              label="Store"
              hint="Store stock is picked from."
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
