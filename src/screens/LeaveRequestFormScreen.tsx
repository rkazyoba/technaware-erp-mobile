import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { createLeaveRequest, getLeaveTypes, type LeaveTypeItem } from '../api';
import { DatePickerField, parseIsoDateToLocal } from '../components/DatePickerField';
import { Text } from '../components/AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { EmployeeProfileRequiredCard } from '../components/EmployeeProfileRequiredCard';
import { portalModuleAccessGate } from '../utils/portalModuleAccess';
import { userHasEmployeeProfile } from '../utils/employeeProfile';
import { styles } from '../styles/appStyles';

function isoToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function LeaveRequestFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, user, setPortalActiveTab, setPortalSelectedModule, loadLeaveRequests, onPortalNotify } = useStaffPortal();

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Leave Requests'), [portal]);
  const essBlocked = !userHasEmployeeProfile(user);

  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [leaveStart, setLeaveStart] = useState(isoToday());
  const [leaveEnd, setLeaveEnd] = useState(isoToday());
  const [leaveNotes, setLeaveNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Leave Requests');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setTypesLoading(true);
      try {
        const res = await getLeaveTypes(token);
        if (cancelled) return;
        setLeaveTypes(res.data.items);
        if (res.data.items.length > 0) {
          setLeaveTypeId(res.data.items[0]!.id);
        }
      } catch {
        if (!cancelled) {
          setLeaveTypes([]);
        }
      } finally {
        if (!cancelled) {
          setTypesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const startDateObj = useMemo(() => parseIsoDateToLocal(leaveStart), [leaveStart]);

  const submit = async () => {
    setFormError(null);
    if (!leaveStart.trim() || !leaveEnd.trim()) {
      setFormError('Choose a start and end date.');
      return;
    }
    if (leaveTypes.length > 0 && !leaveTypeId) {
      setFormError('Select a leave type.');
      return;
    }
    const start = parseIsoDateToLocal(leaveStart);
    const end = parseIsoDateToLocal(leaveEnd);
    if (end.getTime() < start.getTime()) {
      setFormError('End date must be on or after the start date.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: { leave_type_id?: string; leave_type?: string; date_start: string; date_end: string; notes?: string } = {
        date_start: leaveStart.trim(),
        date_end: leaveEnd.trim(),
        notes: leaveNotes.trim() || undefined,
      };
      if (leaveTypeId) {
        payload.leave_type_id = leaveTypeId;
      } else {
        payload.leave_type = 'Other';
      }
      await createLeaveRequest(token, payload);
      await loadLeaveRequests(1);
      onPortalNotify?.('Leave request submitted.', 'success');
      navigation.replace('ModuleList', { moduleRoute: 'Leave Requests' });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
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
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Leave request</Text>
        </View>
        <View style={{ padding: 20 }}>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>Leave requests are not enabled for your account.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>New leave request</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {essBlocked ? (
          <EmployeeProfileRequiredCard title="Cannot submit leave yet" />
        ) : (
        <>
        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
          Submit time off for manager or HR approval. Balances are checked when you submit.
        </Text>

        <View style={styles.leaveFormCard}>
          <Text style={styles.approvalType}>Leave type</Text>
          {typesLoading ? (
            <ActivityIndicator style={{ marginTop: 12 }} color={colors.accentTeal} />
          ) : leaveTypes.length === 0 ? (
            <Text style={[styles.emptyStateText, { marginTop: 8 }]}>No leave types configured. Contact HR.</Text>
          ) : (
            <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
              {leaveTypes.map((type) => (
                <Pressable
                  key={type.id}
                  style={[styles.leaveTypeChip, leaveTypeId === type.id ? styles.leaveTypeChipActive : null]}
                  onPress={() => setLeaveTypeId(type.id)}
                >
                  <Text style={styles.menuChipText}>{type.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <DatePickerField label="Start date" value={leaveStart} onChange={setLeaveStart} marginTop={16} />
          <DatePickerField label="End date" value={leaveEnd} onChange={setLeaveEnd} minimumDate={startDateObj} marginTop={12} />

          <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 14, marginBottom: 6 }}>Reason / notes</Text>
          <TextInput
            style={[styles.approvalNoteInput, { minHeight: 88, textAlignVertical: 'top' }]}
            placeholder="Optional notes for your approver"
            placeholderTextColor={colors.textMuted}
            multiline
            value={leaveNotes}
            onChangeText={setLeaveNotes}
          />

          {formError ? (
            <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginTop: 12 }}>{formError}</Text>
          ) : null}

          <Pressable
            style={[styles.primaryAction, submitting || typesLoading ? { opacity: 0.65 } : null]}
            disabled={submitting || typesLoading}
            onPress={() => void submit()}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryActionText}>Submit leave request</Text>
            )}
          </Pressable>
        </View>
        </>
        )}
      </ScrollView>
    </View>
  );
}
