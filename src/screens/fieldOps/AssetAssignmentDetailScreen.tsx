import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import {
  getEmployees,
  getFieldOpsAsset,
  getFieldOpsSites,
  returnFieldOpsAsset,
  transferFieldOpsAsset,
  updateFieldOpsAssetStatus,
  type EmployeeListItem,
  type FieldOpsAssetAssignment,
  type FieldOpsSite,
} from '../../api';
import { Text } from '../../components/AppTypography';
import { SearchableSelectField, type SearchableSelectOption } from '../../components/SearchableSelectField';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { canCrud } from '../../utils/crudPermissions';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

type ActionPanel = 'none' | 'return' | 'transfer' | 'status';

const CONDITIONS = ['good', 'fair', 'needs_repair', 'damaged'] as const;
const TERMINAL_STATUSES = ['lost', 'damaged', 'written_off'] as const;

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AssetAssignmentDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'AssetAssignmentDetail'>>();
  const assignmentId = route.params.assignmentId;
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Kit Assignments'), [portal]);
  const canUpdate = useMemo(() => canCrud(portal, 'field_ops_asset_assignments', 'update'), [portal]);

  const [item, setItem] = useState<FieldOpsAssetAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<ActionPanel>('none');
  const [saving, setSaving] = useState(false);

  const [returnCondition, setReturnCondition] = useState('good');
  const [returnNotes, setReturnNotes] = useState('');
  const [statusValue, setStatusValue] = useState<string>('lost');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusCondition, setStatusCondition] = useState<string>('');

  const [sites, setSites] = useState<FieldOpsSite[]>([]);
  const [transferSiteId, setTransferSiteId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [toEmployeeId, setToEmployeeId] = useState('');
  const [toEmployeeLabel, setToEmployeeLabel] = useState('');
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Kit Assignments');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, sitesRes] = await Promise.all([getFieldOpsAsset(token, assignmentId), getFieldOpsSites(token)]);
      setItem(res.data);
      setSites(sitesRes.data.items);
      if (res.data.condition) setReturnCondition(res.data.condition);
      if (res.data.site_id) setTransferSiteId(res.data.site_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignment');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, token]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    if (panel !== 'transfer') return;
    const t = setTimeout(() => {
      void (async () => {
        setEmployeeLoading(true);
        try {
          const res = await getEmployees(token, 1, 40, employeeQuery);
          setEmployees(res.data.items);
        } catch {
          setEmployees([]);
        } finally {
          setEmployeeLoading(false);
        }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [panel, employeeQuery, token]);

  const employeeOptions: SearchableSelectOption[] = useMemo(
    () =>
      employees
        .filter((e) => e.id !== item?.employee_id)
        .map((e) => ({
          id: e.id,
          label: e.name,
          subtitle: [e.employee_code, e.site_name].filter(Boolean).join(' · '),
        })),
    [employees, item?.employee_id],
  );

  const doReturn = async () => {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const res = await returnFieldOpsAsset(token, item.id, {
        return_condition: returnCondition,
        return_notes: returnNotes.trim() || null,
      });
      setItem(res.data);
      setPanel('none');
      onPortalNotify?.('Asset returned.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Return failed');
    } finally {
      setSaving(false);
    }
  };

  const doTransfer = async () => {
    if (!item || !toEmployeeId) {
      setError('Select the receiving employee.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await transferFieldOpsAsset(token, item.id, {
        to_employee_id: toEmployeeId,
        site_id: transferSiteId || null,
        notes: transferNotes.trim() || null,
      });
      onPortalNotify?.('Asset transferred.', 'success');
      navigation.replace('AssetAssignmentDetail', { assignmentId: res.data.to.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer failed');
    } finally {
      setSaving(false);
    }
  };

  const doStatus = async () => {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateFieldOpsAssetStatus(token, item.id, {
        status: statusValue,
        notes: statusNotes.trim() || null,
        condition: statusCondition || null,
      });
      setItem(res.data);
      setPanel('none');
      onPortalNotify?.('Status updated.', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
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
        <Text>No access to kit / asset assignments.</Text>
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
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Assignment detail</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {error ? <Text style={{ color: '#b42318', marginBottom: 10 }}>{error}</Text> : null}
        {!item ? (
          <Text>Assignment not found.</Text>
        ) : (
          <>
            <View style={[styles.card, { marginBottom: 12 }]}>
              <Text style={{ ...outfit('semibold', 16) }}>{item.asset_type_name}</Text>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 2 }}>
                {item.asset_type_code}
                {item.asset_category ? ` · ${item.asset_category}` : ''}
              </Text>
              <Text style={{ ...outfit('medium', 13), marginTop: 10, textTransform: 'capitalize' }}>
                Status: {item.status}
                {item.is_open ? ' (open)' : ''}
              </Text>
              <Text style={{ ...outfit('regular', 13), marginTop: 6 }}>Employee: {item.employee_name}</Text>
              <Text style={{ ...outfit('regular', 13), marginTop: 4 }}>
                Qty {item.quantity}
                {item.size ? ` · Size ${item.size}` : ''}
                {item.serial_no ? ` · S/N ${item.serial_no}` : ''}
              </Text>
              <Text style={{ ...outfit('regular', 13), marginTop: 4 }}>
                Condition: {(item.condition || '—').replace(/_/g, ' ')}
              </Text>
              {item.site_name ? (
                <Text style={{ ...outfit('regular', 13), marginTop: 4 }}>Site: {item.site_name}</Text>
              ) : null}
              {item.store_name ? (
                <Text style={{ ...outfit('regular', 13), marginTop: 4 }}>Store: {item.store_name}</Text>
              ) : null}
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 8 }}>
                Issued {fmtDate(item.issued_at)}
                {item.issued_by ? ` by ${item.issued_by}` : ''}
              </Text>
              {item.due_return_at ? (
                <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 2 }}>
                  Due {fmtDate(item.due_return_at)}
                </Text>
              ) : null}
              {item.returned_at ? (
                <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 2 }}>
                  Returned {fmtDate(item.returned_at)}
                  {item.return_condition ? ` · ${item.return_condition.replace(/_/g, ' ')}` : ''}
                </Text>
              ) : null}
              {item.notes ? (
                <Text style={{ ...outfit('regular', 12), marginTop: 8, color: colors.textPrimary }}>
                  Notes: {item.notes}
                </Text>
              ) : null}
            </View>

            {canUpdate && item.is_open ? (
              <View style={[styles.leaveTypeWrap, { marginBottom: 12 }]}>
                <Pressable
                  style={[styles.leaveTypeChip, panel === 'return' ? styles.leaveTypeChipActive : null]}
                  onPress={() => setPanel(panel === 'return' ? 'none' : 'return')}
                >
                  <Text style={styles.menuChipText}>Return</Text>
                </Pressable>
                <Pressable
                  style={[styles.leaveTypeChip, panel === 'transfer' ? styles.leaveTypeChipActive : null]}
                  onPress={() => setPanel(panel === 'transfer' ? 'none' : 'transfer')}
                >
                  <Text style={styles.menuChipText}>Transfer</Text>
                </Pressable>
                <Pressable
                  style={[styles.leaveTypeChip, panel === 'status' ? styles.leaveTypeChipActive : null]}
                  onPress={() => setPanel(panel === 'status' ? 'none' : 'status')}
                >
                  <Text style={styles.menuChipText}>Status</Text>
                </Pressable>
              </View>
            ) : null}

            {panel === 'return' ? (
              <View style={[styles.leaveFormCard, { marginBottom: 12 }]}>
                <Text style={styles.approvalType}>Return condition</Text>
                <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
                  {CONDITIONS.map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.leaveTypeChip, returnCondition === c ? styles.leaveTypeChipActive : null]}
                      onPress={() => setReturnCondition(c)}
                    >
                      <Text style={styles.menuChipText}>{c.replace(/_/g, ' ')}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={[styles.approvalNoteInput, { marginTop: 12, minHeight: 70, textAlignVertical: 'top' }]}
                  placeholder="Return notes"
                  value={returnNotes}
                  onChangeText={setReturnNotes}
                  multiline
                />
                <Pressable
                  style={[styles.primaryAction, { marginTop: 12 }, saving ? { opacity: 0.65 } : null]}
                  onPress={() => void doReturn()}
                  disabled={saving}
                >
                  <Text style={styles.primaryActionText}>Confirm return</Text>
                </Pressable>
              </View>
            ) : null}

            {panel === 'transfer' ? (
              <View style={[styles.leaveFormCard, { marginBottom: 12 }]}>
                <SearchableSelectField
                  label="Transfer to employee"
                  placeholder="Select employee"
                  valueLabel={toEmployeeLabel || undefined}
                  loading={employeeLoading}
                  options={employeeOptions}
                  onSelect={(opt) => {
                    setToEmployeeId(opt.id);
                    setToEmployeeLabel(opt.label);
                  }}
                  modalTitle="Receiving employee"
                />
                <TextInput
                  style={[styles.approvalNoteInput, { marginTop: 8, marginBottom: 8 }]}
                  placeholder="Search employees"
                  value={employeeQuery}
                  onChangeText={setEmployeeQuery}
                />
                <Text style={styles.approvalType}>Site (optional)</Text>
                <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
                  <Pressable
                    style={[styles.leaveTypeChip, !transferSiteId ? styles.leaveTypeChipActive : null]}
                    onPress={() => setTransferSiteId('')}
                  >
                    <Text style={styles.menuChipText}>Keep / none</Text>
                  </Pressable>
                  {sites.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[styles.leaveTypeChip, transferSiteId === s.id ? styles.leaveTypeChipActive : null]}
                      onPress={() => setTransferSiteId(s.id)}
                    >
                      <Text style={styles.menuChipText}>{s.name}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={[styles.approvalNoteInput, { marginTop: 12 }]}
                  placeholder="Transfer notes"
                  value={transferNotes}
                  onChangeText={setTransferNotes}
                />
                <Pressable
                  style={[styles.primaryAction, { marginTop: 12 }, saving ? { opacity: 0.65 } : null]}
                  onPress={() => void doTransfer()}
                  disabled={saving}
                >
                  <Text style={styles.primaryActionText}>Confirm transfer</Text>
                </Pressable>
              </View>
            ) : null}

            {panel === 'status' ? (
              <View style={[styles.leaveFormCard, { marginBottom: 12 }]}>
                <Text style={styles.approvalType}>Mark as</Text>
                <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
                  {TERMINAL_STATUSES.map((st) => (
                    <Pressable
                      key={st}
                      style={[styles.leaveTypeChip, statusValue === st ? styles.leaveTypeChipActive : null]}
                      onPress={() => setStatusValue(st)}
                    >
                      <Text style={styles.menuChipText}>{st.replace(/_/g, ' ')}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.approvalType, { marginTop: 12 }]}>Condition (optional — e.g. needs repair)</Text>
                <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
                  <Pressable
                    style={[styles.leaveTypeChip, !statusCondition ? styles.leaveTypeChipActive : null]}
                    onPress={() => setStatusCondition('')}
                  >
                    <Text style={styles.menuChipText}>Unchanged</Text>
                  </Pressable>
                  {CONDITIONS.map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.leaveTypeChip, statusCondition === c ? styles.leaveTypeChipActive : null]}
                      onPress={() => setStatusCondition(c)}
                    >
                      <Text style={styles.menuChipText}>{c.replace(/_/g, ' ')}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={[styles.approvalNoteInput, { marginTop: 12 }]}
                  placeholder="Notes"
                  value={statusNotes}
                  onChangeText={setStatusNotes}
                />
                <Pressable
                  style={[styles.primaryAction, { marginTop: 12 }, saving ? { opacity: 0.65 } : null]}
                  onPress={() => void doStatus()}
                  disabled={saving}
                >
                  <Text style={styles.primaryActionText}>Update status</Text>
                </Pressable>
              </View>
            ) : null}

            {(item.events ?? []).length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>History</Text>
                {(item.events ?? []).map((ev) => (
                  <View key={ev.id} style={[styles.card, { marginBottom: 8 }]}>
                    <Text style={{ ...outfit('semibold', 13), textTransform: 'capitalize' }}>
                      {(ev.event_type || '').replace(/_/g, ' ')}
                    </Text>
                    <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 2 }}>
                      {ev.from_employee_name || ev.to_employee_name
                        ? `${ev.from_employee_name || '—'} → ${ev.to_employee_name || '—'}`
                        : ''}
                    </Text>
                    <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 2 }}>
                      {fmtDate(ev.created_at)}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
