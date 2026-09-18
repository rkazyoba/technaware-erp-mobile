import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { createFieldOpsHandover, getFieldOpsHandovers, getFieldOpsSites, type FieldOpsSite } from '../../api';
import { Text } from '../../components/AppTypography';
import { DatePickerField } from '../../components/DatePickerField';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ShiftHandoverFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Shift Handover'), [portal]);

  const [sites, setSites] = useState<FieldOpsSite[]>([]);
  const [siteId, setSiteId] = useState('');
  const [date, setDate] = useState(isoToday());
  const [fromShift, setFromShift] = useState('day');
  const [toShift, setToShift] = useState('night');
  const [summary, setSummary] = useState('');
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Shift Handover');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [sitesRes, handRes] = await Promise.all([getFieldOpsSites(token), getFieldOpsHandovers(token)]);
        if (cancelled) return;
        setSites(sitesRes.data.items);
        if (sitesRes.data.items[0]) setSiteId(sitesRes.data.items[0].id);
        setItems(handRes.data.items);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async () => {
    setError(null);
    if (!siteId) {
      setError('Select a site.');
      return;
    }
    setSaving(true);
    try {
      await createFieldOpsHandover(token, {
        site_id: siteId,
        date,
        from_shift_slot: fromShift,
        to_shift_slot: toShift,
        summary: summary.trim() || undefined,
      });
      setSummary('');
      onPortalNotify?.('Handover saved.', 'success');
      const handRes = await getFieldOpsHandovers(token);
      setItems(handRes.data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

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
        <Text>No access to shift handovers.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Shift handover</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.leaveFormCard}>
          <DatePickerField label="Date" value={date} onChange={setDate} />
          <Text style={[styles.approvalType, { marginTop: 12 }]}>Site</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {sites.map((s) => (
              <Pressable key={s.id} style={[styles.leaveTypeChip, siteId === s.id ? styles.leaveTypeChipActive : null]} onPress={() => setSiteId(s.id)}>
                <Text style={styles.menuChipText}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.approvalType, { marginTop: 12 }]}>From → To</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {['day', 'night'].map((s) => (
              <Pressable key={`from-${s}`} style={[styles.leaveTypeChip, fromShift === s ? styles.leaveTypeChipActive : null]} onPress={() => setFromShift(s)}>
                <Text style={styles.menuChipText}>from {s}</Text>
              </Pressable>
            ))}
            {['day', 'night'].map((s) => (
              <Pressable key={`to-${s}`} style={[styles.leaveTypeChip, toShift === s ? styles.leaveTypeChipActive : null]} onPress={() => setToShift(s)}>
                <Text style={styles.menuChipText}>to {s}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 12, minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Handover summary"
            value={summary}
            onChangeText={setSummary}
            multiline
          />
          {error ? <Text style={{ color: '#b42318', marginTop: 8 }}>{error}</Text> : null}
          <Pressable style={[styles.primaryAction, { marginTop: 12 }, saving ? { opacity: 0.65 } : null]} onPress={() => void submit()} disabled={saving}>
            <Text style={styles.primaryActionText}>Save handover</Text>
          </Pressable>
        </View>
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent handovers</Text>
        {items.map((h, idx) => (
          <View key={String(h.id ?? idx)} style={[styles.card, { marginBottom: 8 }]}>
            <Text style={{ ...outfit('semibold', 14) }}>{String(h.site ?? '')}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
              {String(h.date ?? '')} · {String(h.from_shift ?? '')} → {String(h.to_shift ?? '')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
