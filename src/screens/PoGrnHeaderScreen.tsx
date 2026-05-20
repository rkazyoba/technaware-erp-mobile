import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { FormSection, ReadonlyField, SearchableSelectField, type SearchableSelectOption } from '../components/SearchableSelectField';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import {
  getGrnEligiblePurchaseOrders,
  getPoReceiptOrderReceivingLocations,
  postPoReceiptHeader,
  type GrnEligibleOrder,
  type GrnReceivingLocation,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { isoDateFromLocalDate } from '../components/DatePickerField';

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

export function PoGrnHeaderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();

  const [orders, setOrders] = useState<GrnEligibleOrder[]>([]);
  const [storeLocations, setStoreLocations] = useState<GrnReceivingLocation[]>([]);

  const [orderId, setOrderId] = useState('');
  const [orderLabel, setOrderLabel] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierLabel, setSupplierLabel] = useState('');
  const [siteId, setSiteId] = useState('');
  const [siteLabel, setSiteLabel] = useState('');
  const [storeId, setStoreId] = useState('');
  const [storeLabel, setStoreLabel] = useState('');

  const [description, setDescription] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [receivedDate] = useState(isoToday());

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('GRN (PO)');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    void (async () => {
      setLoadingOrders(true);
      setError(null);
      try {
        const res = await getGrnEligiblePurchaseOrders(token);
        setOrders(res.data.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load purchase orders.');
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [token]);

  const orderOptions: SearchableSelectOption[] = useMemo(
    () =>
      orders.map((o) => {
        const description = (o.description ?? '').trim();
        return {
          id: o.id,
          label: o.ref || `PO-${o.id}`,
          subtitle: o.supplier_name?.trim() ? o.supplier_name.trim() : undefined,
          detail: description !== '' ? description : undefined,
        };
      }),
    [orders],
  );

  const storeOptions: SearchableSelectOption[] = useMemo(
    () =>
      storeLocations.map((loc) => ({
        id: `${loc.site_id}:${loc.store_id}`,
        label: loc.store_name || `Store #${loc.store_id}`,
        subtitle: loc.site_name || undefined,
      })),
    [storeLocations],
  );

  const applyLocation = (loc: GrnReceivingLocation) => {
    setSiteId(loc.site_id);
    setSiteLabel(loc.site_name || `Site #${loc.site_id}`);
    setStoreId(loc.store_id);
    setStoreLabel(loc.store_name || `Store #${loc.store_id}`);
  };

  const onSelectOrder = (opt: SearchableSelectOption) => {
    const hit = orders.find((o) => o.id === opt.id);
    if (!hit) {
      return;
    }
    setOrderId(hit.id);
    const desc = (hit.description ?? '').trim();
    setOrderLabel(desc !== '' ? `${opt.label} — ${desc}` : opt.label);
    setSupplierId(hit.supplier_id);
    setSupplierLabel(hit.supplier_name || '—');
    setSiteId('');
    setSiteLabel('');
    setStoreId('');
    setStoreLabel('');
    setStoreLocations([]);

    void (async () => {
      setLoadingLocations(true);
      try {
        const res = await getPoReceiptOrderReceivingLocations(token, hit.id);
        const locs = res.data.locations ?? [];
        setStoreLocations(locs);
        if (locs.length === 1) {
          applyLocation(locs[0]!);
        } else if (locs.length === 0 && hit.site_id && hit.store_id) {
          applyLocation({
            site_id: hit.site_id,
            store_id: hit.store_id,
            site_name: hit.site_name ?? '',
            store_name: hit.store_name ?? '',
          });
        }
      } catch {
        if (hit.site_id && hit.store_id) {
          applyLocation({
            site_id: hit.site_id,
            store_id: hit.store_id,
            site_name: hit.site_name ?? '',
            store_name: hit.store_name ?? '',
          });
        }
      } finally {
        setLoadingLocations(false);
      }
    })();
  };

  const onSelectStore = (opt: SearchableSelectOption) => {
    const loc = storeLocations.find((l) => `${l.site_id}:${l.store_id}` === opt.id);
    if (!loc) {
      return;
    }
    applyLocation(loc);
    setStoreLabel(opt.label);
  };

  const clearOrder = () => {
    setOrderId('');
    setOrderLabel('');
    setSupplierId('');
    setSupplierLabel('');
    setSiteId('');
    setSiteLabel('');
    setStoreId('');
    setStoreLabel('');
    setStoreLocations([]);
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
      Alert.alert('Check form', 'Enter a description for this GRN.');
      return;
    }
    if (!orderId || !supplierId || !siteId || !storeId) {
      Alert.alert('Check form', 'Select a purchase order and receiving store.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await postPoReceiptHeader(token, {
        order_id: Number(orderId),
        supplier_id: Number(supplierId),
        site_id: Number(siteId),
        store_id: Number(storeId),
        description: description.trim(),
        delivery_note: deliveryNote.trim(),
        received_date: receivedDate,
      });
      navigation.replace('PoReceiptWorkspace', {
        receiptId: res.data.id,
        initialTab: 'lines',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save GRN header.';
      setError(message);
      Alert.alert('Could not save', message);
    } finally {
      setSaving(false);
    }
  };

  const storeFieldRequired = orderId !== '' && storeLocations.length > 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title="New PO receipt"
        subtitle="Receipt header"
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
        right={
          <Pressable disabled={saving} onPress={() => void onSave()} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ ...outfit('medium', 13), color: saving ? colors.textMuted : colors.accentTeal }}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        }
      />

      {loadingOrders && orders.length === 0 ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accentTeal} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 14 }}>
            Save the header first, then add lines on the GRN detail screen. Set status to awaiting approval when complete (same as web ERP).
          </Text>

          {error ? (
            <Text style={{ ...outfit('regular', 13), color: colors.statusRejectedText, marginBottom: 12 }}>{error}</Text>
          ) : null}

          <FormSection title="Identification">
            <ReadonlyField
              label="Receipt no. (GRN)"
              value="Assigned when you save"
              hint="Suggested next number is generated on save (GRN + year + serial)."
            />
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Goods received note for…"
              placeholderTextColor={colors.textMuted}
              style={inputStyle}
            />
          </FormSection>

          <FormSection title="Receipt details">
            <SearchableSelectField
              label="Order no."
              hint="Approved and partially received POs for your site(s)."
              placeholder={
                !loadingOrders && orders.length === 0
                  ? 'No eligible purchase orders'
                  : 'Search and select purchase order'
              }
              valueLabel={orderLabel}
              loading={loadingOrders}
              options={orderOptions}
              onSelect={onSelectOrder}
              onClear={clearOrder}
              modalTitle="Purchase order"
              searchPlaceholder="Search PO no., supplier, or description"
            />
            {!loadingOrders && orders.length === 0 && !error ? (
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 8 }}>
                No approved or partially received POs are available for your assigned sites. Confirm the PO status on the
                web ERP, or ask an admin if your site assignment is correct.
              </Text>
            ) : null}

            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>
              Supplier delivery note
            </Text>
            <TextInput
              value={deliveryNote}
              onChangeText={setDeliveryNote}
              placeholder="Delivery note ref."
              placeholderTextColor={colors.textMuted}
              style={inputStyle}
            />

            <ReadonlyField
              label="Received date"
              value={formatDisplayDate(receivedDate)}
              hint="Recorded as today's date."
            />

            <ReadonlyField label="Supplier" value={supplierLabel} hint={orderId ? 'From selected purchase order.' : 'Select an order first.'} />

            <ReadonlyField label="Site" value={siteLabel} hint={orderId ? 'From linked requisition / PO.' : 'Select an order first.'} />

            {storeFieldRequired ? (
              <SearchableSelectField
                label="Store"
                hint="This PO is linked to more than one store — choose where goods are received."
                placeholder="Search and select store"
                valueLabel={storeLabel}
                disabled={!orderId}
                loading={loadingLocations}
                options={storeOptions}
                onSelect={onSelectStore}
                modalTitle="Receiving store"
                searchPlaceholder="Search store or site"
              />
            ) : (
              <ReadonlyField
                label="Store"
                value={storeLabel}
                hint={loadingLocations ? 'Loading store from PO…' : orderId ? 'Receiving store from purchase order.' : 'Select an order first.'}
              />
            )}
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
              <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Save header & continue</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
