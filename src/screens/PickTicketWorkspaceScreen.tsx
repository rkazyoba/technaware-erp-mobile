import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../components/AppTypography';
import { DetailTabBar } from '../components/DetailTabBar';
import { PickTicketOverviewPanel, type PickTicketHeaderForm } from '../components/pick/PickTicketOverviewPanel';
import { SearchableSelectField, type SearchableSelectOption } from '../components/SearchableSelectField';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import {
  deletePickTicketLine,
  getLogisticsDocDetail,
  getPickTicketLineCategories,
  getPickTicketLineStoreItems,
  getStockReportStores,
  postPickTicketLine,
  putPickTicketHeader,
  putPickTicketLine,
  type LogisticsDocDetail,
  type PickTicketLineStoreItem,
  type StockReportLine,
  type StockReportStoreItem,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { canCrud } from '../utils/crudPermissions';
import { logisticsWebDocumentAction } from '../utils/erpDocumentPdfUrls';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';

const BASE_PATH = 'inventory/pick-tickets';
const TAB_OVERVIEW = 'overview';
const TAB_LINES = 'lines';
const TAB_DOCUMENT = 'document';

function headerFormFromDetail(d: LogisticsDocDetail): PickTicketHeaderForm {
  return {
    description: d.description ?? '',
    storeId: d.store_id ?? '',
    storeLabel: d.store_name ?? '',
    siteId: d.site_id ?? '',
    siteLabel: d.site_name ?? '',
    departmentId: d.department_id ?? '',
    departmentLabel: d.department_name ?? '',
    status: d.status ?? '0',
  };
}

export function PickTicketWorkspaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PickTicketWorkspace'>>();
  const { pickTicketId, initialTab } = route.params;

  const sp = useStaffPortal();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = sp;

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Pick tickets'), [portal]);

  const canMutate = useMemo(() => canCrud(portal, 'pick_tickets', 'update'), [portal]);

  const [detail, setDetail] = useState<LogisticsDocDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailTab, setDetailTab] = useState(initialTab ?? TAB_OVERVIEW);

  const [headerForm, setHeaderForm] = useState<PickTicketHeaderForm | null>(null);
  const [stores, setStores] = useState<StockReportStoreItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [linePickError, setLinePickError] = useState<string | null>(null);
  const [lineCategoriesLoading, setLineCategoriesLoading] = useState(false);
  const [lineCategoryOptions, setLineCategoryOptions] = useState<SearchableSelectOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState('');
  const [lineItemsLoading, setLineItemsLoading] = useState(false);
  const [lineItemOptions, setLineItemOptions] = useState<SearchableSelectOption[]>([]);
  const [lineStoreItemsById, setLineStoreItemsById] = useState<Record<string, PickTicketLineStoreItem>>({});
  const [selectedStock, setSelectedStock] = useState<StockReportLine | null>(null);
  const [qtyInput, setQtyInput] = useState('1');
  const [unitPriceInput, setUnitPriceInput] = useState('0');
  const [savingLine, setSavingLine] = useState(false);
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const headerEditable = Boolean(detail && canMutate && (detail.status === '0' || detail.status === '1'));
  const linesEditable = Boolean(detail && canMutate && detail.status === '0');

  const loadDetail = useCallback(
    async (silent: boolean) => {
      if (!token) {
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      setLoadError(null);
      try {
        const res = await getLogisticsDocDetail(token, BASE_PATH, pickTicketId);
        setDetail(res.data);
        setHeaderForm(headerFormFromDetail(res.data));
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load receipt');
        setDetail(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, pickTicketId],
  );

  const loadLookups = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoadingLookups(true);
    try {
      const storesRes = await getStockReportStores(token);
      setStores(storesRes.data.items ?? []);
    } catch {
      /* optional for read-only view */
    } finally {
      setLoadingLookups(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Pick tickets');
      void loadDetail(false);
      void loadLookups();
    }, [loadDetail, loadLookups, setPortalActiveTab, setPortalSelectedModule]),
  );

  const onPullRefresh = () => {
    setRefreshing(true);
    void loadDetail(true);
  };

  const storeOptions: SearchableSelectOption[] = useMemo(
    () =>
      stores.map((s) => ({
        id: s.id,
        label: s.name,
        subtitle: s.site || undefined,
      })),
    [stores],
  );

  const onSelectStore = (opt: SearchableSelectOption) => {
    const hit = stores.find((s) => s.id === opt.id);
    setHeaderForm((prev) =>
      prev
        ? {
            ...prev,
            storeId: opt.id,
            storeLabel: opt.label,
            siteId: hit?.site_id ?? prev.siteId,
            siteLabel: hit?.site ?? prev.siteLabel,
          }
        : prev,
    );
  };

  const saveHeader = async () => {
    if (!token || !headerForm || !detail) {
      return;
    }
    if (!headerForm.description.trim()) {
      Alert.alert('Check form', 'Enter a description for this receipt.');
      return;
    }
    if (!headerForm.storeId) {
      Alert.alert('Check form', 'Select a store.');
      return;
    }
    setSavingHeader(true);
    try {
      await putPickTicketHeader(token, pickTicketId, {
        store_id: Number(headerForm.storeId),
        site_id: headerForm.siteId ? Number(headerForm.siteId) : null,
        department_id: headerForm.departmentId ? Number(headerForm.departmentId) : null,
        status: headerForm.status,
        description: headerForm.description.trim(),
      });
      await loadDetail(true);
      Alert.alert('Saved', 'Receipt details updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSavingHeader(false);
    }
  };

  const storeItemToStockRow = (item: PickTicketLineStoreItem, categoryLabel: string): StockReportLine => ({
    id: item.id,
    code: item.code,
    description: item.description,
    quantity: item.quantity,
    min_qty: null,
    max_qty: null,
    status: '',
    category: categoryLabel,
    category_id: item.category_id,
    supplier: '',
    unit: item.unit,
    unit_id: item.unit_id,
  });

  const resetLinePicker = () => {
    setLinePickError(null);
    setSelectedCategoryId('');
    setSelectedCategoryLabel('');
    setLineItemOptions([]);
    setLineStoreItemsById({});
    setSelectedStock(null);
  };

  const openStockPicker = async () => {
    const storeId = headerForm?.storeId || detail?.store_id;
    if (!storeId) {
      Alert.alert('Store required', 'Save receipt details with a store before adding lines.');
      return;
    }
    setEditingLineId(null);
    setQtyInput('1');
    setUnitPriceInput('0');
    resetLinePicker();
    setLineModalOpen(true);
    setLineCategoriesLoading(true);
    try {
      const res = await getPickTicketLineCategories(token);
      setLineCategoryOptions(
        (res.data.items ?? []).map((c) => ({
          id: c.id,
          label: c.name || `Category #${c.id}`,
        })),
      );
    } catch (e) {
      setLinePickError(e instanceof Error ? e.message : 'Could not load categories.');
      setLineCategoryOptions([]);
    } finally {
      setLineCategoriesLoading(false);
    }
  };

  const onSelectLineCategory = async (opt: SearchableSelectOption) => {
    const storeId = headerForm?.storeId || detail?.store_id;
    if (!storeId) {
      return;
    }
    setSelectedCategoryId(opt.id);
    setSelectedCategoryLabel(opt.label);
    setSelectedStock(null);
    setQtyInput('1');
    setUnitPriceInput('0');
    setLineItemOptions([]);
    setLineStoreItemsById({});
    setLineItemsLoading(true);
    setLinePickError(null);
    try {
      const res = await getPickTicketLineStoreItems(token, pickTicketId, opt.id);
      const byId: Record<string, PickTicketLineStoreItem> = {};
      const options = (res.data.items ?? []).map((item) => {
        byId[item.id] = item;
        const subtitleParts = [
          item.code ? `Code ${item.code}` : '',
          item.unit ? `UOM ${item.unit}` : '',
          item.quantity > 0 ? `On hand ${item.quantity}` : null,
        ].filter(Boolean);
        return {
          id: item.id,
          label: item.description || item.code || `Item #${item.id}`,
          subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
        };
      });
      setLineStoreItemsById(byId);
      setLineItemOptions(options);
    } catch (e) {
      setLinePickError(e instanceof Error ? e.message : 'Could not load items for this category.');
      setLineItemOptions([]);
    } finally {
      setLineItemsLoading(false);
    }
  };

  const onSelectLineItem = async (opt: SearchableSelectOption) => {
    const item = lineStoreItemsById[opt.id];
    if (!item) {
      return;
    }
    const row = storeItemToStockRow(item, selectedCategoryLabel);
    setSelectedStock(row);
    setUnitPriceInput('0');
  };

  const openEditLine = (lineId: string) => {
    const ln = detail?.lines.find((l) => l.id === lineId);
    if (!ln) {
      return;
    }
    setEditingLineId(lineId);
    setSelectedStock(null);
    setQtyInput(String(ln.quantity));
    setUnitPriceInput(ln.unit_price != null ? String(ln.unit_price) : '0');
    setLineModalOpen(true);
    resetLinePicker();
  };

  const submitLine = async () => {
    const qty = Number(qtyInput);
    if (Number.isNaN(qty) || qty <= 0) {
      Alert.alert('Quantity', 'Enter a valid quantity.');
      return;
    }

    setSavingLine(true);
    try {
      if (editingLineId) {
        await putPickTicketLine(token, pickTicketId, editingLineId, {
          quantity_requested: qty,
        });
      } else {
        if (!selectedStock?.category_id || !selectedStock.unit_id) {
          Alert.alert('Item', 'Select a stock item from the list.');
          return;
        }
        await postPickTicketLine(token, pickTicketId, {
          category_id: Number(selectedStock.category_id),
          part_in_store_id: Number(selectedStock.id),
          unit_id: Number(selectedStock.unit_id),
          quantity_requested: qty,
        });
      }
      setLineModalOpen(false);
      setDetailTab(TAB_LINES);
      await loadDetail(true);
    } catch (e) {
      Alert.alert('Could not save line', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSavingLine(false);
    }
  };

  const confirmDeleteLine = (lineId: string) => {
    Alert.alert('Remove line?', 'This line will be removed from the receipt.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void deleteLine(lineId) },
    ]);
  };

  const deleteLine = async (lineId: string) => {
    setDeletingLineId(lineId);
    try {
      await deletePickTicketLine(token, pickTicketId, lineId);
      await loadDetail(true);
    } catch (e) {
      Alert.alert('Could not remove line', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDeletingLineId(null);
    }
  };

  const openPdf = async () => {
    const action = logisticsWebDocumentAction(BASE_PATH, pickTicketId);
    if (!action) {
      return;
    }
    const ok = await Linking.canOpenURL(action.url);
    if (ok) {
      await Linking.openURL(action.url);
    }
  };

  const tabs = useMemo(
    () => [
      { id: TAB_OVERVIEW, label: 'Details' },
      { id: TAB_LINES, label: 'Lines' },
      { id: TAB_DOCUMENT, label: 'Document' },
    ],
    [],
  );

  if (moduleGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (moduleGate === 'denied' || !isPortalModuleRouteAccessible(portal, 'Pick tickets')) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Not available</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const pdfAction = logisticsWebDocumentAction(BASE_PATH, pickTicketId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title={detail?.ref ?? 'Pick ticket'}
        subtitle="Receipt workspace"
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
        right={
          pdfAction ? (
            <TopBarIconButton name="document-text-outline" onPress={() => void openPdf()} />
          ) : undefined
        }
      />

      {loading && !detail ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accentTeal} />
        </View>
      ) : null}

      {loadError ? (
        <View style={{ padding: 16 }}>
          <Text style={{ ...outfit('regular', 14), color: colors.statusRejectedText }}>{loadError}</Text>
          <Pressable onPress={() => void loadDetail(false)} style={{ marginTop: 12 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {detail && headerForm ? (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
            <DetailTabBar tabs={tabs} active={detailTab} onChange={setDetailTab} />
          </View>
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.accentTeal} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {detailTab === TAB_OVERVIEW ? (
              <PickTicketOverviewPanel
                detail={detail}
                lineCount={detail.lines.length}
                editable={headerEditable}
                form={headerForm}
                storeOptions={storeOptions}
                loadingStores={loadingLookups}
                onChangeForm={(patch) => setHeaderForm((prev) => (prev ? { ...prev, ...patch } : prev))}
                onSelectStore={onSelectStore}
                onSaveHeader={headerEditable ? () => void saveHeader() : undefined}
                savingHeader={savingHeader}
              />
            ) : null}

            {detailTab === TAB_LINES ? (
              <View>
                <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
                  {linesEditable
                    ? 'Add stock lines for this store. Each line saves immediately with catalog unit price.'
                    : 'Receipt lines are read-only in this status.'}
                </Text>
                {linesEditable ? (
                  <Pressable
                    onPress={() => void openStockPicker()}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: colors.accentTeal,
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Add line</Text>
                  </Pressable>
                ) : null}
                {detail.lines.length === 0 ? (
                  <Text style={{ ...outfit('regular', 14), color: colors.textSecondary }}>No lines yet.</Text>
                ) : (
                  detail.lines.map((ln) => (
                    <View
                      key={ln.id}
                      style={{
                        marginBottom: 10,
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: colors.surface,
                        borderWidth: 0.5,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{ln.item}</Text>
                          <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>
                            {ln.note ? `${ln.note} · ` : ''}
                            {ln.quantity} {ln.unit}
                            {ln.unit_price != null ? ` · @ ${ln.unit_price.toFixed(2)}` : ''}
                            {ln.line_amount != null ? ` · ${ln.line_amount.toFixed(2)}` : ''}
                          </Text>
                        </View>
                        {linesEditable ? (
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            <Pressable onPress={() => openEditLine(ln.id)} style={{ padding: 8 }} hitSlop={6}>
                              <Ionicons name="create-outline" size={20} color={colors.linkBlue} />
                            </Pressable>
                            <Pressable
                              onPress={() => confirmDeleteLine(ln.id)}
                              disabled={deletingLineId === ln.id}
                              style={{ padding: 8 }}
                              hitSlop={6}
                            >
                              {deletingLineId === ln.id ? (
                                <ActivityIndicator size="small" color={colors.statusRejectedText} />
                              ) : (
                                <Ionicons name="trash-outline" size={20} color={colors.statusRejectedText} />
                              )}
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}

            {detailTab === TAB_DOCUMENT ? (
              <View
                style={{
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  borderWidth: 0.5,
                  borderColor: colors.borderSubtle,
                  padding: 16,
                }}
              >
                <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Receipt document</Text>
                <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
                  Open the PDF on the web ERP for printing and sharing. Sign in if prompted.
                </Text>
                {pdfAction ? (
                  <Pressable
                    onPress={() => void openPdf()}
                    style={{
                      marginTop: 16,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: colors.primaryNavy,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Open PDF</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </>
      ) : null}

      <Modal visible={lineModalOpen} animationType="slide" onRequestClose={() => setLineModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.pageBg, paddingTop: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <Pressable onPress={() => setLineModalOpen(false)} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ ...outfit('medium', 17), color: colors.textPrimary, marginLeft: 8 }}>
              {editingLineId ? 'Edit line' : 'Add line'}
            </Text>
          </View>

          {editingLineId ? (
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Quantity</Text>
              <TextInput
                value={qtyInput}
                onChangeText={setQtyInput}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 0.5,
                  borderColor: colors.borderSubtle,
                  ...outfit('regular', 15),
                  color: colors.textPrimary,
                }}
              />
              <Pressable
                disabled={savingLine}
                onPress={() => void submitLine()}
                style={{
                  marginTop: 20,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: colors.primaryNavy,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...outfit('medium', 15), color: '#fff' }}>{savingLine ? 'Saving…' : 'Save line'}</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 14 }}>
                Choose category and stock item for this pick ticket store (same as web ERP).
              </Text>

              {linePickError ? (
                <Text style={{ ...outfit('regular', 13), color: colors.statusRejectedText, marginBottom: 12 }}>{linePickError}</Text>
              ) : null}

              <SearchableSelectField
                label="Category"
                placeholder="Select category"
                valueLabel={selectedCategoryLabel}
                loading={lineCategoriesLoading}
                options={lineCategoryOptions}
                onSelect={(opt) => void onSelectLineCategory(opt)}
                onClear={() => {
                  resetLinePicker();
                }}
                modalTitle="Category"
                searchPlaceholder="Search categories"
              />

              <SearchableSelectField
                label="Stock item"
                hint={selectedCategoryId ? 'Parts linked to this store and category.' : 'Select a category first.'}
                placeholder={
                  !selectedCategoryId
                    ? 'Select category first'
                    : lineItemsLoading
                      ? 'Loading items…'
                      : lineItemOptions.length === 0
                        ? 'No items for this category'
                        : 'Select item'
                }
                valueLabel={selectedStock?.description}
                disabled={!selectedCategoryId}
                loading={lineItemsLoading}
                options={lineItemOptions}
                onSelect={(opt) => void onSelectLineItem(opt)}
                onClear={() => {
                  setSelectedStock(null);
                  setQtyInput('1');
                  setUnitPriceInput('0');
                }}
                modalTitle="Stock item"
                searchPlaceholder="Search item code or description"
              />

              {!lineItemsLoading && selectedCategoryId && lineItemOptions.length === 0 ? (
                <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginBottom: 12 }}>
                  No parts are set up in this store for the selected category. Add the part to the store catalog on the web ERP,
                  then try again.
                </Text>
              ) : null}

              {selectedStock ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginBottom: 8 }}>
                    {selectedStock.code} · {selectedStock.unit}
                    {selectedStock.quantity > 0 ? ` · On hand ${selectedStock.quantity}` : ''}
                  </Text>
                  <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 8 }}>Quantity requested</Text>
                  <TextInput
                    value={qtyInput}
                    onChangeText={setQtyInput}
                    keyboardType="decimal-pad"
                    style={{
                      marginTop: 4,
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      padding: 10,
                      borderWidth: 0.5,
                      borderColor: colors.borderSubtle,
                      ...outfit('regular', 15),
                      color: colors.textPrimary,
                    }}
                  />
                  <Pressable
                    disabled={savingLine}
                    onPress={() => void submitLine()}
                    style={{
                      marginTop: 14,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: colors.primaryNavy,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ ...outfit('medium', 15), color: '#fff' }}>{savingLine ? 'Saving…' : 'Save line'}</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
