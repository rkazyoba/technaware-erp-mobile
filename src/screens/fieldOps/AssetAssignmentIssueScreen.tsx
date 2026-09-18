import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import {
  getEmployees,
  getFieldOpsAssetTypes,
  getFieldOpsSites,
  getStockReportStores,
  issueFieldOpsAsset,
  type EmployeeListItem,
  type FieldOpsAssetType,
  type FieldOpsSite,
  type StockReportStoreItem,
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

const CONDITIONS = ['good', 'fair', 'needs_repair', 'damaged'] as const;

export function AssetAssignmentIssueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Kit Assignments'), [portal]);
  const canCreate = useMemo(() => canCrud(portal, 'field_ops_asset_assignments', 'create'), [portal]);

  const [types, setTypes] = useState<FieldOpsAssetType[]>([]);
  const [sites, setSites] = useState<FieldOpsSite[]>([]);
  const [stores, setStores] = useState<StockReportStoreItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const [employeeId, setEmployeeId] = useState('');
  const [employeeLabel, setEmployeeLabel] = useState('');
  const [assetTypeId, setAssetTypeId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [size, setSize] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [condition, setCondition] = useState<string>('good');
  const [notes, setNotes] = useState('');
  const [dueReturnAt, setDueReturnAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  const selectedType = useMemo(() => types.find((t) => t.id === assetTypeId) ?? null, [types, assetTypeId]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Kit Assignments');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    void (async () => {
      setBootLoading(true);
      try {
        const [typesRes, sitesRes, storesRes] = await Promise.all([
          getFieldOpsAssetTypes(token),
          getFieldOpsSites(token),
          getStockReportStores(token).catch(() => ({ data: { items: [] as StockReportStoreItem[] } })),
        ]);
        setTypes(typesRes.data.items);
        setSites(sitesRes.data.items);
        setStores(storesRes.data.items);
        if (typesRes.data.items[0] && !assetTypeId) setAssetTypeId(typesRes.data.items[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load form');
      } finally {
        setBootLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, [token]);

  useEffect(() => {
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
  }, [employeeQuery, token]);

  const employeeOptions: SearchableSelectOption[] = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        label: e.name,
        subtitle: [e.employee_code, e.site_name].filter(Boolean).join(' · '),
      })),
    [employees],
  );

  const typeOptions: SearchableSelectOption[] = useMemo(
    () =>
      types.map((t) => ({
        id: t.id,
        label: t.name,
        subtitle: `${t.code} · ${t.category} · ${t.track_mode}`,
      })),
    [types],
  );

  const storeOptions: SearchableSelectOption[] = useMemo(
    () => stores.map((s) => ({ id: s.id, label: s.name, subtitle: s.site || undefined })),
    [stores],
  );

  const submit = async () => {
    setError(null);
    if (!canCreate) {
      setError('You do not have permission to issue assets.');
      return;
    }
    if (!employeeId || !assetTypeId) {
      setError('Employee and asset type are required.');
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (selectedType?.track_mode === 'serialized' && !serialNo.trim()) {
      setError('Serial number is required for serialized assets.');
      return;
    }
    if (selectedType?.track_mode === 'size_variant' && !size.trim()) {
      setError('Size is required for size-variant assets.');
      return;
    }

    setSaving(true);
    try {
      const res = await issueFieldOpsAsset(token, {
        employee_id: employeeId,
        asset_type_id: assetTypeId,
        site_id: siteId || null,
        store_id: storeId || null,
        quantity: qty,
        size: size.trim() || null,
        serial_no: serialNo.trim() || null,
        condition,
        notes: notes.trim() || null,
        due_return_at: dueReturnAt.trim() || null,
      });
      onPortalNotify?.('Asset issued.', 'success');
      navigation.replace('AssetAssignmentDetail', { assignmentId: res.data.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Issue failed');
    } finally {
      setSaving(false);
    }
  };

  if (moduleGate === 'pending' || bootLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.pageBg }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }
  if (moduleGate === 'denied' || !canCreate) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: colors.pageBg }}>
        <Text>No permission to issue kit / asset assignments.</Text>
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
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Issue kit / asset</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.leaveFormCard}>
          <SearchableSelectField
            label="Employee"
            placeholder="Select employee"
            valueLabel={employeeLabel || undefined}
            loading={employeeLoading}
            options={employeeOptions}
            onSelect={(opt) => {
              setEmployeeId(opt.id);
              setEmployeeLabel(opt.label);
            }}
            onClear={() => {
              setEmployeeId('');
              setEmployeeLabel('');
            }}
            modalTitle="Choose employee"
            searchPlaceholder="Search employees…"
          />
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 8, marginBottom: 12 }]}
            placeholder="Search employees (filters list)"
            value={employeeQuery}
            onChangeText={setEmployeeQuery}
          />

          <SearchableSelectField
            label="Asset type"
            placeholder="Select type"
            valueLabel={selectedType?.name}
            options={typeOptions}
            onSelect={(opt) => setAssetTypeId(opt.id)}
            modalTitle="Asset type"
          />

          <Text style={[styles.approvalType, { marginTop: 12 }]}>Site (optional)</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            <Pressable
              style={[styles.leaveTypeChip, !siteId ? styles.leaveTypeChipActive : null]}
              onPress={() => setSiteId('')}
            >
              <Text style={styles.menuChipText}>None</Text>
            </Pressable>
            {sites.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.leaveTypeChip, siteId === s.id ? styles.leaveTypeChipActive : null]}
                onPress={() => setSiteId(s.id)}
              >
                <Text style={styles.menuChipText}>{s.name}</Text>
              </Pressable>
            ))}
          </View>

          {storeOptions.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              <SearchableSelectField
                label="Store (optional, for stock)"
                placeholder="Select store"
                valueLabel={stores.find((s) => s.id === storeId)?.name}
                options={storeOptions}
                onSelect={(opt) => setStoreId(opt.id)}
                onClear={() => setStoreId('')}
                modalTitle="Store"
              />
            </View>
          ) : null}

          <Text style={[styles.approvalType, { marginTop: 12 }]}>Quantity</Text>
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 8 }]}
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
          />

          {selectedType?.track_mode === 'size_variant' || selectedType?.track_mode === 'quantity' ? (
            <>
              <Text style={[styles.approvalType, { marginTop: 12 }]}>
                Size{selectedType?.track_mode === 'size_variant' ? ' *' : ''}
              </Text>
              <TextInput
                style={[styles.approvalNoteInput, { marginTop: 8 }]}
                placeholder="e.g. L, 42"
                value={size}
                onChangeText={setSize}
              />
            </>
          ) : null}

          {selectedType?.track_mode === 'serialized' ? (
            <>
              <Text style={[styles.approvalType, { marginTop: 12 }]}>Serial no *</Text>
              <TextInput
                style={[styles.approvalNoteInput, { marginTop: 8 }]}
                placeholder="Serial / tag number"
                value={serialNo}
                onChangeText={setSerialNo}
              />
            </>
          ) : (
            <>
              <Text style={[styles.approvalType, { marginTop: 12 }]}>Serial no (optional)</Text>
              <TextInput
                style={[styles.approvalNoteInput, { marginTop: 8 }]}
                value={serialNo}
                onChangeText={setSerialNo}
              />
            </>
          )}

          <Text style={[styles.approvalType, { marginTop: 12 }]}>Condition</Text>
          <View style={[styles.leaveTypeWrap, { marginTop: 8 }]}>
            {CONDITIONS.map((c) => (
              <Pressable
                key={c}
                style={[styles.leaveTypeChip, condition === c ? styles.leaveTypeChipActive : null]}
                onPress={() => setCondition(c)}
              >
                <Text style={styles.menuChipText}>{c.replace(/_/g, ' ')}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.approvalType, { marginTop: 12 }]}>Due return (YYYY-MM-DD, optional)</Text>
          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 8 }]}
            placeholder="2026-12-31"
            value={dueReturnAt}
            onChangeText={setDueReturnAt}
          />

          <TextInput
            style={[styles.approvalNoteInput, { marginTop: 12, minHeight: 70, textAlignVertical: 'top' }]}
            placeholder="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {error ? <Text style={{ color: '#b42318', marginTop: 8 }}>{error}</Text> : null}
          <Pressable
            style={[styles.primaryAction, { marginTop: 12 }, saving ? { opacity: 0.65 } : null]}
            onPress={() => void submit()}
            disabled={saving}
          >
            <Text style={styles.primaryActionText}>{saving ? 'Issuing…' : 'Issue asset'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
