import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../components/AppTypography';
import { DatePickerField } from '../components/DatePickerField';
import { getCrmCustomers, postDeliveryNoteHeader, type CrmCustomerListItem } from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';
import { staffPortalHasPermission } from '../utils/staffPortalPermissions';

function isoToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DeliveryNoteHeaderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const sp = useStaffPortal();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = sp;

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Delivery notes'), [portal]);
  const canCreate = staffPortalHasPermission(portal, 'erp.user.delivery_notes');

  const [description, setDescription] = useState('');
  const [preparedDate, setPreparedDate] = useState(isoToday());
  const [despatchDate, setDespatchDate] = useState(isoToday());
  const [deliveryNoteRef, setDeliveryNoteRef] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerLabel, setCustomerLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerRows, setCustomerRows] = useState<CrmCustomerListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Delivery notes');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const pickCustomer = (row: CrmCustomerListItem) => {
    setCustomerId(row.id);
    setCustomerLabel(`${row.name} (${row.code})`);
    setCustomerModalOpen(false);
  };

  useEffect(() => {
    if (!customerModalOpen) {
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setCustomerLoading(true);
        try {
          const res = await getCrmCustomers(token, 1, 30, customerQuery);
          setCustomerRows(res.data.items);
        } catch {
          setCustomerRows([]);
        } finally {
          setCustomerLoading(false);
        }
      })();
    }, 350);
    return () => clearTimeout(t);
  }, [customerModalOpen, customerQuery, token]);

  const validate = (): string | null => {
    if (!description.trim()) {
      return 'Enter a short description.';
    }
    if (!customerId.trim()) {
      return 'Select a customer.';
    }
    if (!preparedDate.trim() || !despatchDate.trim()) {
      return 'Prepared date and despatch date are required.';
    }
    return null;
  };

  const saveHeader = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Check form', err);
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        description: description.trim(),
        prepared_date: preparedDate.trim(),
        despatch_date: despatchDate.trim(),
        customer_id: Number.parseInt(customerId, 10),
      };
      const dnRef = deliveryNoteRef.trim();
      if (dnRef) {
        body.delivery_note = dnRef;
      }
      const ord = orderNo.trim();
      if (ord) {
        body.order_no = ord;
      }
      const res = await postDeliveryNoteHeader(token, body);
      navigation.replace('DeliveryNoteLines', { deliveryNoteId: res.data.id });
    } catch (e) {
      Alert.alert('Could not save header', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (moduleGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 12 }}>Loading access…</Text>
      </View>
    );
  }

  if (moduleGate === 'denied' || !isPortalModuleRouteAccessible(portal, 'Delivery notes')) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Not available</Text>
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
          Delivery notes are not enabled for your portal profile.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primaryNavy, alignItems: 'center' }}
        >
          <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!canCreate) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Cannot create</Text>
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
          Your role needs operational permission erp.user.delivery_notes to create delivery notes.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primaryNavy, alignItems: 'center' }}
        >
          <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const inputStyle = {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    ...outfit('regular', 14),
    color: colors.textPrimary,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }} numberOfLines={2}>
          New delivery note · header
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
          Step 1 of 2 · Saves a draft delivery note (status Unfinished). Add product lines next, then submit for approval from the lines screen.
        </Text>

        <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What is being delivered?"
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />

        <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>Customer</Text>
        <Pressable
          onPress={() => setCustomerModalOpen(true)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ ...outfit('regular', 14), color: customerLabel ? colors.textPrimary : colors.textMuted }}>
            {customerLabel || 'Tap to choose customer'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>

        <DatePickerField label="Prepared date" value={preparedDate} onChange={setPreparedDate} />

        <DatePickerField label="Despatch date" value={despatchDate} onChange={setDespatchDate} />

        <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>DN reference (optional)</Text>
        <TextInput
          value={deliveryNoteRef}
          onChangeText={setDeliveryNoteRef}
          placeholder="Leave blank to auto-number"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          style={inputStyle}
        />

        <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>Order no. (optional)</Text>
        <TextInput
          value={orderNo}
          onChangeText={setOrderNo}
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />

        <Pressable
          onPress={() => void saveHeader()}
          disabled={submitting}
          style={{
            marginTop: 24,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: submitting ? colors.borderSubtle : colors.accentTeal,
            alignItems: 'center',
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Save header & continue</Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={customerModalOpen} transparent animationType="slide" onRequestClose={() => setCustomerModalOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setCustomerModalOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '88%' }}>
            <Text style={{ ...outfit('medium', 16), marginBottom: 8 }}>Choose customer</Text>
            <TextInput
              value={customerQuery}
              onChangeText={setCustomerQuery}
              placeholder="Search name or code"
              placeholderTextColor={colors.textMuted}
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            {customerLoading ? <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 16 }} /> : null}
            <FlatList
              style={{ maxHeight: 360 }}
              data={customerRows}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => pickCustomer(item)}
                  style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }}
                >
                  <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
                    {item.name} ({item.code})
                  </Text>
                  <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>{item.phone || item.contact || '—'}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                customerLoading ? null : (
                  <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, paddingVertical: 16 }}>No customers found.</Text>
                )
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
