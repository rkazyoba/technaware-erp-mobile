import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteRequisitionLine,
  getRequisitionDetail,
  getRequisitionLineCategories,
  getRequisitionLineStoreItems,
  postRequisitionLines,
  postRequisitionSubmitForApproval,
  putRequisitionHeader,
  type RequisitionDetail,
  type RequisitionLineStoreItem,
} from '../api';
import { Text } from '../components/AppTypography';
import { DetailTabBar } from '../components/DetailTabBar';
import { SearchableSelectField, type SearchableSelectOption } from '../components/SearchableSelectField';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import { type ModulesStackParamList } from '../navigation/moduleStackTypes';
import { canCrudOrLegacy } from '../utils/crudPermissions';
import { portalModuleAccessGate } from '../utils/portalModuleAccess';
import { styles } from '../styles/appStyles';

const TAB_OVERVIEW = 'overview';
const TAB_LINES = 'lines';

export function RequisitionWorkspaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'RequisitionWorkspace'>>();
  const { requisitionId, initialTab } = route.params;

  const { token, portal, setPortalActiveTab, setPortalSelectedModule, loadRequisitions, onPortalNotify } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Requisitions'), [portal]);
  const canMutate = useMemo(
    () => canCrudOrLegacy(portal, 'requisitions', 'update', ['erp.user.requisitions']),
    [portal],
  );

  const [detail, setDetail] = useState<RequisitionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailTab, setDetailTab] = useState(initialTab ?? TAB_OVERVIEW);

  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('1');
  const [savingHeader, setSavingHeader] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [lineCategories, setLineCategories] = useState<SearchableSelectOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [lineItems, setLineItems] = useState<RequisitionLineStoreItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RequisitionLineStoreItem | null>(null);
  const [lineQty, setLineQty] = useState('1');
  const [lineSaving, setLineSaving] = useState(false);
  const [linePickError, setLinePickError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    try {
      const res = await getRequisitionDetail(token, requisitionId);
      setDetail(res.data);
      setDescription(res.data.description ?? '');
      setPriority(res.data.priority ?? '1');
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load requisition.');
    }
  }, [token, requisitionId]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Requisitions');
      setLoading(true);
      void loadDetail().finally(() => setLoading(false));
    }, [setPortalActiveTab, setPortalSelectedModule, loadDetail]),
  );

  const editable = Boolean(detail?.editable) && canMutate;

  const priorityOptions = useMemo(
    () => [
      { value: '0', label: 'Low' },
      { value: '1', label: 'Medium' },
      { value: '2', label: 'High' },
    ],
    [],
  );

  const saveHeader = async () => {
    if (!detail || !editable) return;
    setSavingHeader(true);
    try {
      await putRequisitionHeader(token, requisitionId, {
        description: description.trim(),
        priority,
      });
      await loadDetail();
      onPortalNotify?.('Header saved.', 'success');
    } catch (e) {
      onPortalNotify?.(e instanceof Error ? e.message : 'Failed to save header.', 'error');
    } finally {
      setSavingHeader(false);
    }
  };

  const submitForApproval = () => {
    if (!detail?.can_submit_for_approval) return;
    Alert.alert('Submit for approval', 'Send this requisition to approvers?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: () => {
          void (async () => {
            setSubmitting(true);
            try {
              await postRequisitionSubmitForApproval(token, requisitionId);
              await loadRequisitions(1);
              await loadDetail();
              onPortalNotify?.('Requisition submitted for approval.', 'success');
              navigation.navigate('ModuleList', { moduleRoute: 'Requisitions' });
            } catch (e) {
              onPortalNotify?.(e instanceof Error ? e.message : 'Submit failed.', 'error');
            } finally {
              setSubmitting(false);
            }
          })();
        },
      },
    ]);
  };

  const openLineModal = async () => {
    if (!detail?.store_id) return;
    setLineModalOpen(true);
    setLinePickError(null);
    setCategoryId('');
    setCategoryLabel('');
    setLineItems([]);
    setSelectedItem(null);
    setLineQty('1');
    try {
      const res = await getRequisitionLineCategories(token);
      setLineCategories(
        res.data.items.map((c) => ({
          id: c.id,
          label: c.name,
        })),
      );
    } catch {
      setLineCategories([]);
    }
  };

  const loadLineItems = async (catId: string, catLabel: string) => {
    if (!detail?.store_id) return;
    setCategoryId(catId);
    setCategoryLabel(catLabel);
    setSelectedItem(null);
    setLinePickError(null);
    try {
      const res = await getRequisitionLineStoreItems(token, detail.store_id, catId);
      setLineItems(res.data.items);
      if (res.data.items.length === 0) {
        setLinePickError('No items in this category for the selected store.');
      }
    } catch (e) {
      setLineItems([]);
      setLinePickError(e instanceof Error ? e.message : 'Could not load items.');
    }
  };

  const addLine = async () => {
    if (!selectedItem || !categoryId) return;
    const qty = Number.parseFloat(lineQty.replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) {
      setLinePickError('Enter a valid quantity.');
      return;
    }
    setLineSaving(true);
    setLinePickError(null);
    try {
      const res = await postRequisitionLines(token, requisitionId, [
        {
          category_id: categoryId,
          requested_item: selectedItem.id,
          unit_id: selectedItem.unit_id,
          quantity: qty,
        },
      ]);
      await loadDetail();
      setLineModalOpen(false);
      const msg = res.message || 'Line added.';
      onPortalNotify?.(msg, res.data.inserted > 0 ? 'success' : 'info');
    } catch (e) {
      setLinePickError(e instanceof Error ? e.message : 'Failed to add line.');
    } finally {
      setLineSaving(false);
    }
  };

  const removeLine = (lineId: string, label: string) => {
    Alert.alert('Remove line', `Remove ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteRequisitionLine(token, requisitionId, lineId);
              await loadDetail();
            } catch (e) {
              onPortalNotify?.(e instanceof Error ? e.message : 'Could not remove line.', 'error');
            }
          })();
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    void loadDetail().finally(() => setRefreshing(false));
  };

  if (moduleGate === 'denied') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
        <TopBar title="Requisition" left={<TopBarIconButton name="chevron-back" onPress={() => navigation.goBack()} />} />
        <View style={{ padding: 20 }}>
          <Text style={styles.emptyStateText}>Requisitions are not available for your account.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }} edges={['top']}>
      <TopBar
        title={detail?.ref ?? 'Requisition'}
        left={<TopBarIconButton name="chevron-back" onPress={() => navigation.goBack()} />}
      />
      {loading && !detail ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.accentTeal} />
        </View>
      ) : loadError ? (
        <View style={{ padding: 20 }}>
          <Text style={styles.emptyStateTitle}>Could not load</Text>
          <Text style={styles.emptyStateText}>{loadError}</Text>
          <Pressable style={styles.detailsButton} onPress={() => void loadDetail()}>
            <Text style={styles.detailsButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : detail ? (
        <>
          <DetailTabBar
            tabs={[
              { id: TAB_OVERVIEW, label: 'Overview' },
              { id: TAB_LINES, label: `Lines (${detail.lines.length})` },
            ]}
            active={detailTab}
            onChange={setDetailTab}
          />
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentTeal} />}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          >
            {detailTab === TAB_OVERVIEW ? (
              <View>
                <Text style={styles.meta}>Status: {detail.status_label}</Text>
                <Text style={styles.meta}>Site: {detail.site}</Text>
                <Text style={styles.meta}>Store: {detail.store}</Text>
                <Text style={styles.meta}>Requested: {detail.requested_date ?? '—'}</Text>

                <Text style={[styles.approvalType, { marginTop: 16 }]}>Description</Text>
                <TextInput
                  style={[styles.input, { marginTop: 6, minHeight: 72 }]}
                  value={description}
                  onChangeText={setDescription}
                  editable={editable}
                  multiline
                />

                <Text style={[styles.approvalType, { marginTop: 12 }]}>Priority</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {priorityOptions.map((p) => {
                    const active = priority === p.value;
                    return (
                      <Pressable
                        key={p.value}
                        disabled={!editable}
                        onPress={() => setPriority(p.value)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: active ? colors.accentTeal : colors.surface,
                          borderWidth: 1,
                          borderColor: active ? colors.accentTeal : colors.borderSubtle,
                          opacity: editable ? 1 : 0.7,
                        }}
                      >
                        <Text style={{ ...outfit('medium', 13), color: active ? '#fff' : colors.textPrimary }}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {editable ? (
                  <Pressable
                    style={[styles.detailsButton, { marginTop: 16 }, savingHeader && { opacity: 0.6 }]}
                    onPress={() => void saveHeader()}
                    disabled={savingHeader}
                  >
                    <Text style={styles.detailsButtonText}>{savingHeader ? 'Saving…' : 'Save header'}</Text>
                  </Pressable>
                ) : null}

                {editable && detail.can_submit_for_approval ? (
                  <Pressable
                    style={[styles.detailsButton, { marginTop: 10, backgroundColor: colors.primaryNavy }]}
                    onPress={submitForApproval}
                    disabled={submitting}
                  >
                    <Text style={[styles.detailsButtonText, { color: '#fff' }]}>
                      {submitting ? 'Submitting…' : 'Submit for approval'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {detailTab === TAB_LINES ? (
              <View>
                {editable ? (
                  <Pressable style={[styles.detailsButton, { marginBottom: 12 }]} onPress={() => void openLineModal()}>
                    <Text style={styles.detailsButtonText}>Add line</Text>
                  </Pressable>
                ) : null}
                {detail.lines.length === 0 ? (
                  <Text style={styles.emptyStateText}>No lines yet. Add items from the store catalog.</Text>
                ) : (
                  detail.lines.map((line) => (
                    <View key={line.id} style={[styles.approvalCard, { marginBottom: 10 }]}>
                      <Text style={styles.approvalSubject}>{line.item}</Text>
                      <Text style={styles.approvalOwner}>
                        {line.category} · {line.quantity} {line.unit}
                      </Text>
                      {editable ? (
                        <Pressable onPress={() => removeLine(line.id, line.item)} style={{ marginTop: 8 }}>
                          <Text style={{ ...outfit('medium', 13), color: colors.trendDown }}>Remove</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </ScrollView>

          <Modal visible={lineModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLineModalOpen(false)}>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
                <Pressable onPress={() => setLineModalOpen(false)} hitSlop={12}>
                  <Ionicons name="close" size={28} color={colors.textPrimary} />
                </Pressable>
                <Text style={{ ...outfit('medium', 16), color: colors.textPrimary, marginLeft: 12 }}>Add line</Text>
              </View>
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <SearchableSelectField
                  label="Category"
                  options={lineCategories}
                  valueLabel={categoryLabel}
                  onSelect={(opt) => void loadLineItems(opt.id, opt.label)}
                  placeholder="Search category"
                />
                {lineItems.length > 0 ? (
                  <>
                    <Text style={[styles.approvalType, { marginTop: 16 }]}>Item</Text>
                    {lineItems.map((item) => {
                      const active = selectedItem?.id === item.id;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => setSelectedItem(item)}
                          style={[
                            styles.approvalCard,
                            { marginTop: 8, borderWidth: active ? 2 : 0, borderColor: colors.accentTeal },
                          ]}
                        >
                          <Text style={styles.approvalId}>{item.code}</Text>
                          <Text style={styles.approvalSubject} numberOfLines={2}>
                            {item.description}
                          </Text>
                          <Text style={styles.approvalOwner}>{item.unit || '—'}</Text>
                        </Pressable>
                      );
                    })}
                    <Text style={[styles.approvalType, { marginTop: 16 }]}>Quantity</Text>
                    <TextInput
                      style={[styles.input, { marginTop: 6 }]}
                      value={lineQty}
                      onChangeText={setLineQty}
                      keyboardType="decimal-pad"
                    />
                  </>
                ) : null}
                {linePickError ? (
                  <Text style={{ ...outfit('regular', 13), color: colors.trendDown, marginTop: 12 }}>{linePickError}</Text>
                ) : null}
                <Pressable
                  style={[styles.detailsButton, { marginTop: 20 }, (!selectedItem || lineSaving) && { opacity: 0.5 }]}
                  onPress={() => void addLine()}
                  disabled={!selectedItem || lineSaving}
                >
                  <Text style={styles.detailsButtonText}>{lineSaving ? 'Saving…' : 'Add to requisition'}</Text>
                </Pressable>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </>
      ) : null}
    </SafeAreaView>
  );
}
