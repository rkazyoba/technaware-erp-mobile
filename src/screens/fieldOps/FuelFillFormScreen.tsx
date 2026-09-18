import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import {
  createFieldOpsFuelFill,
  createFieldOpsFuelFillWithReceipt,
  getFieldOpsFuelStations,
  getFieldOpsFuelVehicles,
  getFieldOpsSites,
  type FieldOpsFuelStation,
  type FieldOpsFuelVehicle,
  type FieldOpsSite,
} from '../../api';
import { Text } from '../../components/AppTypography';
import { DatePickerField } from '../../components/DatePickerField';
import { SearchableSelectField, type SearchableSelectOption } from '../../components/SearchableSelectField';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { canCrud } from '../../utils/crudPermissions';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FuelFillFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Fuel Consumption'), [portal]);
  const canCreate = useMemo(() => canCrud(portal, 'field_ops_fuel_fills', 'create'), [portal]);

  const [vehicles, setVehicles] = useState<FieldOpsFuelVehicle[]>([]);
  const [stations, setStations] = useState<FieldOpsFuelStation[]>([]);
  const [sites, setSites] = useState<FieldOpsSite[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [stationId, setStationId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [filledDate, setFilledDate] = useState(todayIsoDate());
  const [liters, setLiters] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [odometer, setOdometer] = useState('');
  const [receiptCode, setReceiptCode] = useState('');
  const [attendant, setAttendant] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Fuel Consumption');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );

  const vehicleOptions: SearchableSelectOption[] = useMemo(
    () =>
      vehicles.map((v) => ({
        id: v.id,
        label: v.label,
        subtitle: v.last_odometer_km != null ? `Last odometer: ${v.last_odometer_km} km` : undefined,
      })),
    [vehicles],
  );

  const stationOptions: SearchableSelectOption[] = useMemo(
    () => stations.map((s) => ({ id: s.id, label: s.label, subtitle: s.location || undefined })),
    [stations],
  );

  const siteOptions: SearchableSelectOption[] = useMemo(
    () => sites.map((s) => ({ id: s.id, label: s.name })),
    [sites],
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [vRes, sRes, sitesRes] = await Promise.all([
          getFieldOpsFuelVehicles(token),
          getFieldOpsFuelStations(token),
          getFieldOpsSites(token),
        ]);
        setVehicles(vRes.data.items);
        setStations(sRes.data.items);
        setSites(sitesRes.data.items);
        setVehicleId((prev) => prev || vRes.data.items[0]?.id || '');
        setStationId((prev) => prev || sRes.data.items[0]?.id || '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load lookups');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setReceiptUri(result.assets[0].uri);
  };

  const submit = async () => {
    setError(null);
    if (!canCreate) {
      setError('You do not have permission to register fuel fills.');
      return;
    }
    if (!vehicleId || !stationId || !liters.trim() || !amountPaid.trim() || !odometer.trim() || !receiptCode.trim() || !attendant.trim()) {
      setError('Vehicle, station, liters, amount, odometer, receipt code and attendant are required.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        vehicle_id: vehicleId,
        fuel_station_id: stationId,
        filled_at: `${filledDate}T12:00:00`,
        liters: liters.trim(),
        amount_paid: amountPaid.trim(),
        odometer_km: odometer.trim(),
        receipt_code: receiptCode.trim(),
        attendant_name: attendant.trim(),
        site_id: siteId || null,
        notes: notes.trim() || null,
      };
      const created = receiptUri
        ? await createFieldOpsFuelFillWithReceipt(token, body, receiptUri)
        : await createFieldOpsFuelFill(token, body);
      onPortalNotify?.('Fuel fill recorded.', 'success');
      navigation.replace('FuelFillDetail', { fillId: created.data.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (moduleGate === 'pending' || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.pageBg }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }
  if (moduleGate === 'denied') {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: colors.pageBg }}>
        <Text>No access to fuel consumption.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Register fuel fill</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.leaveFormCard}>
          <SearchableSelectField
            label="Vehicle"
            placeholder="Select vehicle"
            valueLabel={selectedVehicle?.label}
            options={vehicleOptions}
            onSelect={(opt) => setVehicleId(opt.id)}
            onClear={() => setVehicleId('')}
            modalTitle="Choose vehicle"
            searchPlaceholder="Search registration or name…"
          />
          {selectedVehicle?.last_odometer_km != null ? (
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
              Last recorded odometer: {selectedVehicle.last_odometer_km} km
              {selectedVehicle.last_filled_at ? ` (${selectedVehicle.last_filled_at.slice(0, 10)})` : ''}
            </Text>
          ) : null}

          <View style={{ marginTop: 12 }}>
            <SearchableSelectField
              label="Fuel station"
              placeholder="Select station"
              valueLabel={stations.find((s) => s.id === stationId)?.label}
              options={stationOptions}
              onSelect={(opt) => setStationId(opt.id)}
              onClear={() => setStationId('')}
              modalTitle="Choose station"
              searchPlaceholder="Search station…"
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <DatePickerField label="Fill date" value={filledDate} onChange={setFilledDate} />
          </View>

          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 12 }]}
            placeholder="Liters"
            keyboardType="decimal-pad"
            value={liters}
            onChangeText={setLiters}
          />
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 10 }]}
            placeholder="Amount paid"
            keyboardType="decimal-pad"
            value={amountPaid}
            onChangeText={setAmountPaid}
          />
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 10 }]}
            placeholder="Odometer (km)"
            keyboardType="decimal-pad"
            value={odometer}
            onChangeText={setOdometer}
          />
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 10 }]}
            placeholder="Receipt code"
            value={receiptCode}
            onChangeText={setReceiptCode}
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 10 }]}
            placeholder="Fuel attendant name"
            value={attendant}
            onChangeText={setAttendant}
          />

          <View style={{ marginTop: 12 }}>
            <SearchableSelectField
              label="Site (optional)"
              placeholder="Select site"
              valueLabel={sites.find((s) => s.id === siteId)?.name}
              options={siteOptions}
              onSelect={(opt) => setSiteId(opt.id)}
              onClear={() => setSiteId('')}
              modalTitle="Choose site"
              searchPlaceholder="Search site…"
            />
          </View>

          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 10, minHeight: 70, textAlignVertical: 'top' }]}
            placeholder="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Pressable style={[styles.detailsButton, { marginTop: 12 }]} onPress={() => void pickReceipt()}>
            <Text style={styles.detailsButtonText}>{receiptUri ? 'Change receipt photo' : 'Attach receipt photo (optional)'}</Text>
          </Pressable>
          {receiptUri ? (
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 6 }}>Receipt photo selected</Text>
          ) : null}

          {error ? <Text style={{ color: '#b42318', marginTop: 8 }}>{error}</Text> : null}
          {canCreate ? (
            <Pressable
              style={[styles.primaryAction, { marginTop: 12 }, saving ? { opacity: 0.65 } : null]}
              onPress={() => void submit()}
              disabled={saving}
            >
              <Text style={styles.primaryActionText}>{saving ? 'Saving…' : 'Save fuel fill'}</Text>
            </Pressable>
          ) : (
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 12 }}>
              View only — you do not have create permission.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
