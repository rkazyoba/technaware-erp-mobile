import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import {
  getFieldOpsFuelFills,
  getFieldOpsFuelStations,
  getFieldOpsFuelVehicles,
  type FieldOpsFuelFill,
  type FieldOpsFuelStation,
  type FieldOpsFuelVehicle,
} from '../../api';
import { Text } from '../../components/AppTypography';
import { DatePickerField } from '../../components/DatePickerField';
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

function monthStartIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function statusColor(status: string): string {
  return status === 'voided' ? '#b42318' : '#0d7a4f';
}

export function FuelFillListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Fuel Consumption'), [portal]);
  const canCreate = useMemo(() => canCrud(portal, 'field_ops_fuel_fills', 'create'), [portal]);

  const [vehicles, setVehicles] = useState<FieldOpsFuelVehicle[]>([]);
  const [stations, setStations] = useState<FieldOpsFuelStation[]>([]);
  const [items, setItems] = useState<FieldOpsFuelFill[]>([]);
  const [from, setFrom] = useState(monthStartIsoDate());
  const [to, setTo] = useState(todayIsoDate());
  const [vehicleId, setVehicleId] = useState('');
  const [stationId, setStationId] = useState('');
  const [includeVoided, setIncludeVoided] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Fuel Consumption');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [vRes, sRes, fRes] = await Promise.all([
          getFieldOpsFuelVehicles(token),
          getFieldOpsFuelStations(token),
          getFieldOpsFuelFills(token, {
            from,
            to,
            vehicleId: vehicleId || undefined,
            fuelStationId: stationId || undefined,
            includeVoided,
          }),
        ]);
        setVehicles(vRes.data.items);
        setStations(sRes.data.items);
        setItems(fRes.data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load fuel fills');
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, from, to, vehicleId, stationId, includeVoided],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (moduleGate === 'pending') {
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
      <View
        style={{
          backgroundColor: colors.primaryNavy,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Fuel consumption</Text>
        {canCreate ? (
          <Pressable
            onPress={() => navigation.navigate('FuelFillForm')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <DatePickerField label="From" value={from} onChange={setFrom} />
        <View style={{ marginTop: 10 }}>
          <DatePickerField label="To" value={to} onChange={setTo} />
        </View>

        <Text style={[styles.approvalType, { marginTop: 12 }]}>Vehicle</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 8 }}>
          <View style={styles.leaveTypeWrap}>
            <Pressable
              style={[styles.leaveTypeChip, !vehicleId ? styles.leaveTypeChipActive : null]}
              onPress={() => setVehicleId('')}
            >
              <Text style={styles.menuChipText}>All vehicles</Text>
            </Pressable>
            {vehicles.map((v) => (
              <Pressable
                key={v.id}
                style={[styles.leaveTypeChip, vehicleId === v.id ? styles.leaveTypeChipActive : null]}
                onPress={() => setVehicleId(v.id)}
              >
                <Text style={styles.menuChipText}>{v.registration_number}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.approvalType}>Station</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 8 }}>
          <View style={styles.leaveTypeWrap}>
            <Pressable
              style={[styles.leaveTypeChip, !stationId ? styles.leaveTypeChipActive : null]}
              onPress={() => setStationId('')}
            >
              <Text style={styles.menuChipText}>All stations</Text>
            </Pressable>
            {stations.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.leaveTypeChip, stationId === s.id ? styles.leaveTypeChipActive : null]}
                onPress={() => setStationId(s.id)}
              >
                <Text style={styles.menuChipText}>{s.code}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Pressable
          style={[styles.leaveTypeChip, includeVoided ? styles.leaveTypeChipActive : null, { alignSelf: 'flex-start', marginBottom: 12 }]}
          onPress={() => setIncludeVoided((v) => !v)}
        >
          <Text style={styles.menuChipText}>{includeVoided ? 'Including voided' : 'Hide voided'}</Text>
        </Pressable>

        {canCreate ? (
          <Pressable style={[styles.primaryAction, { marginBottom: 16 }]} onPress={() => navigation.navigate('FuelFillForm')}>
            <Text style={styles.primaryActionText}>Register fuel fill</Text>
          </Pressable>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.accentTeal} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={{ color: '#b42318', marginTop: 8 }}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No fuel fills</Text>
            <Text style={styles.emptyStateText}>No fills match the selected filters.</Text>
          </View>
        ) : (
          items.map((row) => (
            <Pressable
              key={row.id}
              style={[styles.card, { marginBottom: 8, opacity: row.status === 'voided' ? 0.7 : 1 }]}
              onPress={() => navigation.navigate('FuelFillDetail', { fillId: row.id })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ ...outfit('semibold', 14), flex: 1 }}>
                  {row.vehicle_registration ?? 'Vehicle'} · {row.liters} L
                </Text>
                <Text style={{ ...outfit('medium', 11), color: statusColor(row.status), textTransform: 'capitalize' }}>
                  {row.status}
                </Text>
              </View>
              <Text style={{ ...outfit('regular', 13), color: colors.textPrimary, marginTop: 4 }}>
                Amount {row.amount_paid} · Odo {row.odometer_km} km
              </Text>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 2 }}>
                {row.fuel_station_code ?? ''} · receipt {row.receipt_code}
                {row.has_receipt ? ' · photo' : ''}
              </Text>
              <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 2 }}>
                {row.filled_at?.slice(0, 16)?.replace('T', ' ') ?? ''} · {row.attendant_name}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
