import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import {
  getFieldOpsSession,
  getFieldOpsSiteEmployees,
  getFieldOpsSites,
  openFieldOpsSession,
  submitFieldOpsSession,
  updateFieldOpsSessionMarks,
  uploadFieldOpsRegister,
  type FieldOpsSession,
  type FieldOpsSessionMark,
  type FieldOpsSite,
  type FieldOpsSiteEmployee,
} from '../../api';
import { Text } from '../../components/AppTypography';
import { DatePickerField } from '../../components/DatePickerField';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

const SHIFT_SLOTS = ['day', 'night', 'morning', 'evening', 'night_3'];

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function SiteAttendanceSessionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'SiteAttendanceSession'>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Site Attendance'), [portal]);

  const [sites, setSites] = useState<FieldOpsSite[]>([]);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [previewEmployees, setPreviewEmployees] = useState<FieldOpsSiteEmployee[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [date, setDate] = useState(isoToday());
  const [siteId, setSiteId] = useState('');
  const [shiftSlot, setShiftSlot] = useState('day');
  const [session, setSession] = useState<FieldOpsSession | null>(null);
  const [marks, setMarks] = useState<FieldOpsSessionMark[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Site Attendance');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setSitesLoading(true);
      setSitesError(null);
      try {
        const res = await getFieldOpsSites(token);
        if (cancelled) return;
        setSites(res.data.items);
        if (res.data.items[0] && !siteId) setSiteId(res.data.items[0].id);
        if (res.data.items.length === 0) {
          setSitesError('No sites found for this organisation.');
        }
      } catch (e) {
        if (!cancelled) {
          setSites([]);
          setSitesError(e instanceof Error ? e.message : 'Could not load sites. Check Field Ops access.');
        }
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load sites once per token
  }, [token]);

  useEffect(() => {
    if (!siteId || session) return;
    let cancelled = false;
    void (async () => {
      setPreviewLoading(true);
      try {
        const res = await getFieldOpsSiteEmployees(token, siteId, { date, shiftSlot });
        if (cancelled) return;
        setPreviewEmployees(res.data.items);
      } catch {
        if (!cancelled) setPreviewEmployees([]);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, siteId, date, shiftSlot, session]);

  useEffect(() => {
    const existingId = route.params?.sessionId;
    if (!existingId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await getFieldOpsSession(token, existingId);
        if (cancelled) return;
        setSession(res.data);
        setMarks(res.data.marks);
        setDate(res.data.date || isoToday());
        setSiteId(res.data.site_id);
        setShiftSlot(res.data.shift_slot || 'day');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load session');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params?.sessionId, token]);

  const openSession = async () => {
    setError(null);
    if (!siteId) {
      setError('Select a site.');
      return;
    }
    setLoading(true);
    try {
      const res = await openFieldOpsSession(token, {
        date,
        site_id: siteId,
        shift_slot: shiftSlot,
      });
      setSession(res.data);
      setMarks(res.data.marks);
      onPortalNotify?.(
        res.data.marks.length
          ? `Loaded ${res.data.marks.length} employee(s) for marking.`
          : 'Session opened — no employees assigned to this site yet.',
        'success',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open session');
    } finally {
      setLoading(false);
    }
  };

  const updateMark = (employeeId: string, patch: Partial<FieldOpsSessionMark>) => {
    setMarks((prev) => prev.map((m) => (m.employee_id === employeeId ? { ...m, ...patch } : m)));
  };

  const persistMarks = async () => {
    if (!session) return;
    return updateFieldOpsSessionMarks(
      token,
      session.id,
      marks.map((m) => ({
        employee_id: m.employee_id,
        status: m.status,
        absence_reason: m.status === 'absent' ? m.absence_reason || 'no_show' : null,
        supervisor_remark: m.supervisor_remark || null,
      })),
    );
  };

  const saveMarks = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    try {
      const res = await persistMarks();
      if (!res) return;
      setSession(res.data);
      setMarks(res.data.marks);
      onPortalNotify?.('Marks saved.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    try {
      await persistMarks();
      const res = await submitFieldOpsSession(token, session.id);
      setSession(res.data);
      setMarks(res.data.marks);
      onPortalNotify?.('Submitted — attendance synced.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSaving(false);
    }
  };

  const pickRegister = async () => {
    if (!session) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setSaving(true);
    try {
      await uploadFieldOpsRegister(token, session.id, result.assets[0].uri);
      const refreshed = await getFieldOpsSession(token, session.id);
      setSession(refreshed.data);
      onPortalNotify?.('Register uploaded.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  if (moduleGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (moduleGate === 'denied') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
          Enable Field Ops → Site attendance for this tenant, and grant supervisor site attendance permission.
        </Text>
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
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Site attendance</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
          Choose a site and shift, review employees, then mark present or absent. Submit syncs HR attendance.
        </Text>

        {!session ? (
          <View style={styles.leaveFormCard}>
            <DatePickerField label="Date" value={date} onChange={setDate} />

            <Text style={[styles.approvalType, { marginTop: 14 }]}>Sites</Text>
            {sitesLoading ? <ActivityIndicator style={{ marginTop: 10 }} color={colors.accentTeal} /> : null}
            {sitesError ? (
              <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginTop: 8 }}>{sitesError}</Text>
            ) : null}
            <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
              {sites.map((s) => (
                <Pressable
                  key={s.id}
                  style={[styles.leaveTypeChip, siteId === s.id ? styles.leaveTypeChipActive : null]}
                  onPress={() => {
                    setSiteId(s.id);
                    setSession(null);
                    setMarks([]);
                  }}
                >
                  <Text style={styles.menuChipText}>{s.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.approvalType, { marginTop: 14 }]}>Shift</Text>
            <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
              {SHIFT_SLOTS.map((slot) => (
                <Pressable
                  key={slot}
                  style={[styles.leaveTypeChip, shiftSlot === slot ? styles.leaveTypeChipActive : null]}
                  onPress={() => setShiftSlot(slot)}
                >
                  <Text style={styles.menuChipText}>{slot}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.approvalType, { marginTop: 16 }]}>
              Employees {siteId ? `(${previewEmployees.length})` : ''}
            </Text>
            {previewLoading ? <ActivityIndicator style={{ marginTop: 10 }} color={colors.accentTeal} /> : null}
            {!previewLoading && siteId && previewEmployees.length === 0 ? (
              <Text style={[styles.emptyStateText, { marginTop: 8 }]}>
                No employees on roster or assigned to this site. Assign staff to the site (or add a duty roster) on the web, then retry.
              </Text>
            ) : null}
            {!previewLoading
              ? previewEmployees.map((emp) => (
                  <View key={emp.id} style={[styles.card, { marginTop: 8 }]}>
                    <Text style={{ ...outfit('semibold', 14), color: colors.textPrimary }}>{emp.name}</Text>
                    <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
                      {emp.guard_title || 'Staff'} · {emp.source === 'roster' ? 'Rostered' : 'Site assigned'}
                    </Text>
                  </View>
                ))
              : null}

            <Pressable
              style={[styles.primaryAction, { marginTop: 16 }, loading || !siteId ? { opacity: 0.65 } : null]}
              onPress={() => void openSession()}
              disabled={loading || !siteId}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryActionText}>Start marking attendance</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {error ? <Text style={[styles.emptyStateText, { color: '#b42318', marginTop: 12 }]}>{error}</Text> : null}

        {session ? (
          <View style={{ marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>
                {session.site_name} · {session.shift_slot}
              </Text>
              <Pressable
                onPress={() => {
                  setSession(null);
                  setMarks([]);
                }}
              >
                <Text style={{ ...outfit('medium', 13), color: colors.linkBlue }}>Change site</Text>
              </Pressable>
            </View>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginBottom: 10 }}>
              Status: {session.status} · {marks.length} employee(s)
            </Text>

            {marks.length === 0 ? (
              <Text style={styles.emptyStateText}>
                No employees for this site. Assign employees to the site or create a duty roster, then tap Change site and reload.
              </Text>
            ) : null}

            {marks.map((m) => (
              <View key={m.employee_id} style={[styles.card, { marginBottom: 10 }]}>
                <Text style={{ ...outfit('semibold', 15), color: colors.textPrimary }}>{m.employee_name}</Text>
                <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>{m.guard_title || 'Guard'}</Text>
                <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
                  <Pressable
                    style={[styles.leaveTypeChip, m.status === 'present' ? styles.leaveTypeChipActive : null]}
                    onPress={() => updateMark(m.employee_id, { status: 'present', absence_reason: '' })}
                  >
                    <Text style={styles.menuChipText}>Present</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.leaveTypeChip, m.status === 'absent' ? styles.leaveTypeChipActive : null]}
                    onPress={() =>
                      updateMark(m.employee_id, { status: 'absent', absence_reason: m.absence_reason || 'no_show' })
                    }
                  >
                    <Text style={styles.menuChipText}>Absent</Text>
                  </Pressable>
                </View>
                {m.status === 'absent' ? (
                  <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
                    {(session.absence_reasons || ['sick', 'emergency', 'no_show', 'leave', 'other']).map((r) => (
                      <Pressable
                        key={r}
                        style={[styles.leaveTypeChip, m.absence_reason === r ? styles.leaveTypeChipActive : null]}
                        onPress={() => updateMark(m.employee_id, { absence_reason: r })}
                      >
                        <Text style={styles.menuChipText}>{r}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <TextInput
                  style={[styles.approvalNoteInput, { marginTop: 8 }]}
                  placeholder="Supervisor remark"
                  value={m.supervisor_remark}
                  onChangeText={(t) => updateMark(m.employee_id, { supervisor_remark: t })}
                />
              </View>
            ))}

            <Pressable
              style={[styles.primaryAction, saving ? { opacity: 0.65 } : null]}
              onPress={() => void saveMarks()}
              disabled={saving}
            >
              <Text style={styles.primaryActionText}>Save marks</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryAction, { marginTop: 10, backgroundColor: colors.accentTeal }, saving ? { opacity: 0.65 } : null]}
              onPress={() => void submit()}
              disabled={saving}
            >
              <Text style={styles.primaryActionText}>Submit & sync attendance</Text>
            </Pressable>
            <Pressable
              style={[styles.menuChip, { marginTop: 12, alignSelf: 'flex-start' }]}
              onPress={() => void pickRegister()}
              disabled={saving}
            >
              <Text style={styles.menuChipText}>Upload signed register</Text>
            </Pressable>
            {session.registers?.length ? (
              <Text style={[styles.emptyStateText, { marginTop: 8 }]}>
                Registers on file: {session.registers.length}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
