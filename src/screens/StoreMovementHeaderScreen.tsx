import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
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
import { getEmployees, postKitchenToStoreMovementHeader, postStoreToKitchenMovementHeader, type EmployeeListItem, type StockReportStoreItem } from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';

type MovementKind = 'k2s' | 's2k';

function isoToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function StoreMovementHeaderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'StoreMovementHeader'>>();
  const initialKind = route.params?.initialKind;

  const sp = useStaffPortal();
  const {
    token,
    portal,
    stockStores,
    loadStockStores,
    setPortalActiveTab,
    setPortalSelectedModule,
    canCreateKitchenToStoreMovement,
    canCreateStoreToKitchenMovement,
  } = sp;

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Store movements'), [portal]);

  const allowedKinds = useMemo((): MovementKind[] => {
    const out: MovementKind[] = [];
    if (canCreateKitchenToStoreMovement) {
      out.push('k2s');
    }
    if (canCreateStoreToKitchenMovement) {
      out.push('s2k');
    }
    return out;
  }, [canCreateKitchenToStoreMovement, canCreateStoreToKitchenMovement]);

  const [kind, setKind] = useState<MovementKind>('k2s');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'0' | '1'>('0');

  const [issuingStoreName, setIssuingStoreName] = useState('');
  const [destinationFreeText, setDestinationFreeText] = useState('');
  const [fromKitchenText, setFromKitchenText] = useState('');
  const [receivingStoreName, setReceivingStoreName] = useState('');

  const [issuedDate, setIssuedDate] = useState(isoToday());
  const [requestedDate, setRequestedDate] = useState(isoToday());
  const [returnedDate, setReturnedDate] = useState(isoToday());

  const [employeeId, setEmployeeId] = useState('');
  const [employeeLabel, setEmployeeLabel] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeModalRole, setStoreModalRole] = useState<'k2s_from' | 's2k_to'>('k2s_from');

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeRows, setEmployeeRows] = useState<EmployeeListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Store movements');
      void loadStockStores();
    }, [loadStockStores, setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    if (!allowedKinds.length) {
      return;
    }
    const preferred =
      initialKind && allowedKinds.includes(initialKind) ? initialKind : allowedKinds.includes('k2s') ? 'k2s' : 's2k';
    setKind(preferred);
  }, [allowedKinds, initialKind]);

  const openStorePicker = (role: typeof storeModalRole) => {
    setStoreModalRole(role);
    setStoreModalOpen(true);
  };

  const pickEmployee = (row: EmployeeListItem) => {
    setEmployeeId(row.id);
    setEmployeeLabel(`${row.name} (${row.employee_code})`);
    setEmployeeModalOpen(false);
  };

  useEffect(() => {
    if (!employeeModalOpen) {
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setEmployeeLoading(true);
        try {
          const res = await getEmployees(token, 1, 30, employeeQuery);
          setEmployeeRows(res.data.items);
        } catch {
          setEmployeeRows([]);
        } finally {
          setEmployeeLoading(false);
        }
      })();
    }, 350);
    return () => clearTimeout(t);
  }, [employeeModalOpen, employeeQuery, token]);

  const stockStoreNameForLines = kind === 'k2s' ? issuingStoreName.trim() : receivingStoreName.trim();

  const validate = (): string | null => {
    if (!description.trim()) {
      return 'Enter a short description.';
    }
    if (!employeeId.trim()) {
      return 'Select an employee.';
    }
    if (kind === 'k2s') {
      if (!issuingStoreName.trim()) {
        return 'Select the issuing store.';
      }
      if (!destinationFreeText.trim()) {
        return 'Enter the destination label.';
      }
    } else {
      if (!fromKitchenText.trim()) {
        return 'Enter the source label.';
      }
      if (!receivingStoreName.trim()) {
        return 'Select the receiving store.';
      }
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
      if (kind === 'k2s') {
        const res = await postKitchenToStoreMovementHeader(token, {
          description: description.trim(),
          from: issuingStoreName.trim(),
          to: destinationFreeText.trim(),
          issued_date: issuedDate,
          requested_date: requestedDate,
          requested_by: Number.parseInt(employeeId, 10),
          status,
        });
        navigation.replace('StoreMovementLines', {
          docKind: 'kitchen_to_store',
          issueId: res.data.id,
          stockStoreName: issuingStoreName.trim(),
        });
      } else {
        const res = await postStoreToKitchenMovementHeader(token, {
          description: description.trim(),
          from: fromKitchenText.trim(),
          to: receivingStoreName.trim(),
          returned_date: returnedDate,
          returned_by: Number.parseInt(employeeId, 10),
          status,
        });
        navigation.replace('StoreMovementLines', {
          docKind: 'store_to_kitchen',
          issueId: res.data.id,
          stockStoreName: receivingStoreName.trim(),
        });
      }
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

  if (moduleGate === 'denied' || !isPortalModuleRouteAccessible(portal, 'Store movements')) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Not available</Text>
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>Store movements are not enabled for your portal profile.</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primaryNavy, alignItems: 'center' }}
        >
          <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!allowedKinds.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Cannot create</Text>
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
          Your role does not include creating kitchen-to-store or store-to-kitchen movements.
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }} numberOfLines={2}>
          New movement · header
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
          Step 1 of 2 · Saves to{' '}
          <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
            {kind === 'k2s' ? 'kitchen_to_stores' : 'store_to_kitchens'}
          </Text>{' '}
          (ERP table). Lines are added next; each line updates stock for that document type.
        </Text>

        {allowedKinds.length > 1 ? (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {allowedKinds.includes('k2s') ? (
              <Pressable
                onPress={() => setKind('k2s')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: kind === 'k2s' ? colors.primaryNavy : colors.surface,
                  borderWidth: 0.5,
                  borderColor: kind === 'k2s' ? colors.primaryNavy : colors.borderSubtle,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...outfit('medium', 13), color: kind === 'k2s' ? '#fff' : colors.textPrimary }}>Kitchen → store</Text>
                <Text style={{ ...outfit('regular', 10), color: kind === 'k2s' ? 'rgba(255,255,255,0.75)' : colors.textMuted, marginTop: 2 }}>kitchen_to_stores</Text>
              </Pressable>
            ) : null}
            {allowedKinds.includes('s2k') ? (
              <Pressable
                onPress={() => setKind('s2k')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: kind === 's2k' ? colors.primaryNavy : colors.surface,
                  borderWidth: 0.5,
                  borderColor: kind === 's2k' ? colors.primaryNavy : colors.borderSubtle,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...outfit('medium', 13), color: kind === 's2k' ? '#fff' : colors.textPrimary }}>Store → kitchen</Text>
                <Text style={{ ...outfit('regular', 10), color: kind === 's2k' ? 'rgba(255,255,255,0.75)' : colors.textMuted, marginTop: 2 }}>store_to_kitchens</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What is being moved?"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            ...outfit('regular', 14),
            color: colors.textPrimary,
          }}
        />

        <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>Status</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['0', '1'] as const).map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatus(st)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: status === st ? colors.accentTeal : colors.surface,
                borderWidth: 0.5,
                borderColor: status === st ? colors.accentTeal : colors.borderSubtle,
              }}
            >
              <Text style={{ ...outfit('medium', 12), color: status === st ? '#fff' : colors.textPrimary }}>{st === '0' ? 'Draft' : 'Submit'}</Text>
            </Pressable>
          ))}
        </View>

        {kind === 'k2s' ? (
          <>
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>Issuing store (stock leaves — kitchen_to_store_details)</Text>
            <Pressable
              onPress={() => openStorePicker('k2s_from')}
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
              <Text style={{ ...outfit('regular', 14), color: issuingStoreName ? colors.textPrimary : colors.textMuted }}>
                {issuingStoreName || 'Tap to choose store'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>

            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>Destination</Text>
            <TextInput
              value={destinationFreeText}
              onChangeText={setDestinationFreeText}
              placeholder="Kitchen / site label"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                ...outfit('regular', 14),
                color: colors.textPrimary,
              }}
            />

            <DatePickerField label="Issued date" value={issuedDate} onChange={setIssuedDate} />

            <DatePickerField label="Requested date" value={requestedDate} onChange={setRequestedDate} />
          </>
        ) : (
          <>
            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>From (kitchen / source)</Text>
            <TextInput
              value={fromKitchenText}
              onChangeText={setFromKitchenText}
              placeholder="Source label"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                ...outfit('regular', 14),
                color: colors.textPrimary,
              }}
            />

            <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>Receiving store (stock into — store_to_kitchen_details)</Text>
            <Pressable
              onPress={() => openStorePicker('s2k_to')}
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
              <Text style={{ ...outfit('regular', 14), color: receivingStoreName ? colors.textPrimary : colors.textMuted }}>
                {receivingStoreName || 'Tap to choose store'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>

            <DatePickerField label="Returned date" value={returnedDate} onChange={setReturnedDate} />
          </>
        )}

        <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>
          {kind === 'k2s' ? 'Requested by' : 'Returned by'}
        </Text>
        <Pressable
          onPress={() => {
            setEmployeeQuery('');
            setEmployeeModalOpen(true);
          }}
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
          <Text style={{ ...outfit('regular', 14), color: employeeLabel ? colors.textPrimary : colors.textMuted }}>
            {employeeLabel || 'Tap to choose employee'}
          </Text>
          <Ionicons name="people-outline" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          disabled={submitting}
          onPress={() => void saveHeader()}
          style={{
            marginTop: 24,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: submitting ? colors.borderSubtle : colors.primaryNavy,
            alignItems: 'center',
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Save header & add lines</Text>
          )}
        </Pressable>

        {stockStoreNameForLines ? (
          <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 12 }}>
            Lines screen will use stock for store: <Text style={{ ...outfit('medium', 11), color: colors.textSecondary }}>{stockStoreNameForLines}</Text>
          </Text>
        ) : null}
      </ScrollView>

      <Modal visible={storeModalOpen} transparent animationType="slide" onRequestClose={() => setStoreModalOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setStoreModalOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '55%' }}>
            <Text style={{ ...outfit('medium', 16), marginBottom: 12 }}>Choose store</Text>
            <FlatList
              data={stockStores}
              keyExtractor={(item: StockReportStoreItem) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    if (storeModalRole === 'k2s_from') {
                      setIssuingStoreName(item.name);
                    } else {
                      setReceivingStoreName(item.name);
                    }
                    setStoreModalOpen(false);
                  }}
                  style={{ paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }}
                >
                  <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{item.name}</Text>
                  <Text style={{ ...outfit('regular', 12), color: colors.textMuted }}>{item.site}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={employeeModalOpen} transparent animationType="slide" onRequestClose={() => setEmployeeModalOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setEmployeeModalOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' }}>
            <Text style={{ ...outfit('medium', 16), marginBottom: 10 }}>Employee</Text>
            <TextInput
              value={employeeQuery}
              onChangeText={setEmployeeQuery}
              placeholder="Search name or code"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 10,
                ...outfit('regular', 14),
                color: colors.textPrimary,
              }}
            />
            {employeeLoading ? <ActivityIndicator color={colors.accentTeal} /> : null}
            <FlatList
              data={employeeRows}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => pickEmployee(item)} style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }}>
                  <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{item.name}</Text>
                  <Text style={{ ...outfit('regular', 12), color: colors.textMuted }}>
                    {item.employee_code} · {item.job_title}
                  </Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
