import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { getFieldOpsFuelFill, voidFieldOpsFuelFill, type FieldOpsFuelFill } from '../../api';
import { Text } from '../../components/AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { canCrud } from '../../utils/crudPermissions';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ ...outfit('regular', 11), color: colors.textMuted }}>{label}</Text>
      <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

export function FuelFillDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'FuelFillDetail'>>();
  const fillId = route.params.fillId;
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Fuel Consumption'), [portal]);
  const canVoid = useMemo(() => canCrud(portal, 'field_ops_fuel_fills', 'delete'), [portal]);

  const [item, setItem] = useState<FieldOpsFuelFill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVoid, setShowVoid] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Fuel Consumption');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFieldOpsFuelFill(token, fillId);
      setItem(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fuel fill');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [fillId, token]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const submitVoid = async () => {
    if (!item || !voidReason.trim()) {
      setError('Void reason is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await voidFieldOpsFuelFill(token, item.id, voidReason.trim());
      setItem(res.data);
      setShowVoid(false);
      setVoidReason('');
      onPortalNotify?.('Fuel fill voided.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Void failed');
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
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Fuel fill detail</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {error ? <Text style={{ color: '#b42318', marginBottom: 10 }}>{error}</Text> : null}
        {!item ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Not found</Text>
            <Text style={styles.emptyStateText}>This fuel fill could not be loaded.</Text>
          </View>
        ) : (
          <>
            <View style={styles.leaveFormCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ ...outfit('semibold', 16) }}>{item.vehicle_registration ?? 'Vehicle'}</Text>
                <Text
                  style={{
                    ...outfit('medium', 12),
                    color: item.status === 'voided' ? '#b42318' : '#0d7a4f',
                    textTransform: 'capitalize',
                  }}
                >
                  {item.status}
                </Text>
              </View>
              <Row label="Filled at" value={fmtDate(item.filled_at)} />
              <Row label="Station" value={`${item.fuel_station_code ?? ''} — ${item.fuel_station_name ?? ''}`.trim()} />
              <Row label="Liters" value={String(item.liters)} />
              <Row label="Amount paid" value={String(item.amount_paid)} />
              <Row label="Unit price" value={item.unit_price != null ? String(item.unit_price) : '—'} />
              <Row label="Odometer (km)" value={String(item.odometer_km)} />
              <Row label="Km since previous" value={item.km_since_previous != null ? String(item.km_since_previous) : '—'} />
              <Row label="Km per liter" value={item.km_per_liter != null ? String(item.km_per_liter) : '—'} />
              <Row label="L / 100 km" value={item.liters_per_100km != null ? String(item.liters_per_100km) : '—'} />
              <Row label="Receipt code" value={item.receipt_code} />
              <Row label="Attendant" value={item.attendant_name} />
              <Row label="Fuel type" value={item.fuel_type ?? '—'} />
              <Row label="Site" value={item.site_name ?? '—'} />
              <Row label="Receipt photo" value={item.has_receipt ? 'Attached' : 'None'} />
              <Row label="Notes" value={item.notes?.trim() ? item.notes : '—'} />
              {item.status === 'voided' ? (
                <>
                  <Row label="Voided at" value={fmtDate(item.voided_at)} />
                  <Row label="Void reason" value={item.void_reason ?? '—'} />
                </>
              ) : null}
            </View>

            {canVoid && item.status === 'recorded' ? (
              <View style={[styles.leaveFormCard, { marginTop: 12 }]}>
                {!showVoid ? (
                  <Pressable style={styles.primaryAction} onPress={() => setShowVoid(true)}>
                    <Text style={styles.primaryActionText}>Void this fill</Text>
                  </Pressable>
                ) : (
                  <>
                    <Text style={styles.approvalType}>Void reason</Text>
                    <TextInput
                      style={[styles.approvalNoteInput, { marginTop: 8, minHeight: 70, textAlignVertical: 'top' }]}
                      placeholder="Why is this fill being voided?"
                      value={voidReason}
                      onChangeText={setVoidReason}
                      multiline
                    />
                    <Pressable
                      style={[styles.primaryAction, { marginTop: 12, backgroundColor: '#b42318' }, saving ? { opacity: 0.65 } : null]}
                      onPress={() => void submitVoid()}
                      disabled={saving}
                    >
                      <Text style={styles.primaryActionText}>{saving ? 'Voiding…' : 'Confirm void'}</Text>
                    </Pressable>
                    <Pressable style={[styles.detailsButton, { marginTop: 8 }]} onPress={() => setShowVoid(false)}>
                      <Text style={styles.detailsButtonText}>Cancel</Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
