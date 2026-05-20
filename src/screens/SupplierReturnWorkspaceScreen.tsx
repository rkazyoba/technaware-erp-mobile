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
import { SupplierReturnOverviewPanel, type SupplierReturnHeaderForm } from '../components/supplierReturn/SupplierReturnOverviewPanel';
import { SearchableSelectField, type SearchableSelectOption } from '../components/SearchableSelectField';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import {
  deleteSupplierReturnLine,
  getCatalogUnitPrice,
  getLogisticsDocDetail,
  getSupplierReturnLineCategories,
  getSupplierReturnLineStoreItems,
  getStockReportStores,
  getSuppliers,
  postSupplierReturnLine,
  putSupplierReturnHeader,
  putSupplierReturnLine,
  type LogisticsDocDetail,
  type SupplierReturnLineStoreItem,
  type StockReportLine,
  type StockReportStoreItem,
  type SupplierListItem,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { canCrudOrLegacy, LOGISTICS_LEGACY } from '../utils/crudPermissions';
import { logisticsWebDocumentAction } from '../utils/erpDocumentPdfUrls';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';

const BASE_PATH = 'inventory/supplier-returns';
const TAB_OVERVIEW = 'overview';
const TAB_LINES = 'lines';
const TAB_DOCUMENT = 'document';

function headerFormFromDetail(d: LogisticsDocDetail): SupplierReturnHeaderForm {
  return {
    description: d.description ?? '',
    returnedDate: (d.document_date ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    supplierId: d.supplier_id ?? '',
    supplierLabel: d.supplier_name ?? '',
    siteId: d.site_id ?? '',
    siteLabel: d.site_name ?? '',
    storeId: d.store_id ?? '',
    storeLabel: d.store_name ?? '',
    status: d.status ?? '0',
  };
}

export function SupplierReturnWorkspaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'SupplierReturnWorkspace'>>();
  const { supplierReturnId, initialTab } = route.params;

  const sp = useStaffPortal();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = sp;

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Supplier returns'), [portal]);

  const canMutate = useMemo(
    () => canCrudOrLegacy(portal, 'supplier_returns', 'update', LOGISTICS_LEGACY.supplier_returns),
    [portal],
  );

  const [detail, setDetail] = useState<LogisticsDocDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailTab, setDetailTab] = useState(initialTab ?? TAB_OVERVIEW);

  const [headerForm, setHeaderForm] = useState<SupplierReturnHeaderForm | null>(null);
  const [stores, setStores] = useState<StockReportStoreItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
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
  const [lineStoreItemsById, setLineStoreItemsById] = useState<Record<string, SupplierReturnLineStoreItem>>({});
  const [selectedStock, setSelectedStock] = useState<StockReportLine | null>(null);
  const [qtyInput, setQtyInput] = useState('1');
  const [unitPriceInput, setUnitPriceInput] = useState('0');
  const [returnReasonInput, setReturnReasonInput] = useState('');
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
        const res = await getLogisticsDocDetail(token, BASE_PATH, supplierReturnId);
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
    [token, supplierReturnId],
  );

  const loadLookups = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoadingLookups(true);
    try {
      const [storesRes, supRes] = await Promise.all([getStockReportStores(token), getSuppliers(token, 1, 100)]);
      setStores(storesRes.data.items ?? []);
      setSuppliers(supRes.data.items ?? []);
    } catch {
      /* optional for read-only view */
    } finally {
      setLoadingLookups(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Supplier returns');
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

  const supplierOptions: SearchableSelectOption[] = useMemo(
    () =>
      suppliers.map((s) => ({
        id: s.id,
        label: s.name,
        subtitle: s.code || undefined,
      })),
    [suppliers],
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

  const onSelectSupplier = (opt: SearchableSelectOption) => {
    setHeaderForm((prev) => (prev ? { ...prev, supplierId: opt.id, supplierLabel: opt.label } : prev));
  };

  const saveHeader = async () => {
    if (!token || !headerForm || !detail) {
      return;
    }
    if (!headerForm.description.trim()) {
      Alert.alert('Check form', 'Enter a description for this receipt.');
      return;
    }
    if (!headerForm.supplierId || !headerForm.siteId || !headerForm.storeId) {
      Alert.alert('Check form', 'Select supplier and store.');
      return;
    }
    if (headerForm.status === '1') {
      if (detail.lines.length === 0) {
        Alert.alert('Lines required', 'Add at least one line before submitting for approval.');
        return;
      }
      const missingReason = detail.lines.find(
        (ln) => !(ln.return_reason ?? ln.note ?? '').trim(),
      );
      if (missingReason) {
        Alert.alert(
          'Return reason required',
          'Each line must include a reason for return. Edit the line and enter why the item is being returned.',
        );
        return;
      }
    }
    setSavingHeader(true);
    try {
      await putSupplierReturnHeader(token, supplierReturnId, {
        supplier_id: Number(headerForm.supplierId),
        site_id: Number(headerForm.siteId),
        store_id: Number(headerForm.storeId),
        status: headerForm.status,
        description: headerForm.description.trim(),
        returned_date: headerForm.returnedDate,
      });
      await loadDetail(true);
      Alert.alert('Saved', 'Receipt details updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSavingHeader(false);
    }
  };

  const storeItemToStockRow = (item: SupplierReturnLineStoreItem, categoryLabel: string): StockReportLine => ({
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
    setReturnReasonInput('');
    resetLinePicker();
    setLineModalOpen(true);
    setLineCategoriesLoading(true);
    try {
      const res = await getSupplierReturnLineCategories(token);
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
      const res = await getSupplierReturnLineStoreItems(token, storeId, opt.id);
      const byId: Record<string, SupplierReturnLineStoreItem> = {};
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
    const asOf = headerForm?.returnedDate || detail?.document_date?.slice(0, 10);
    try {
      const priceRes = await getCatalogUnitPrice(token, row.id, asOf ?? undefined);
      setUnitPriceInput(String(priceRes.data.price ?? 0));
    } catch {
      setUnitPriceInput('0');
    }
  };

  const openEditLine = (lineId: string) => {
    const ln = detail?.lines.find((l) => l.id === lineId);
    if (!ln) {
      return;
    }
    setEditingLineId(lineId);
    setSelectedStock(null);
    setQtyInput(String(ln.returned_qty ?? ln.quantity));
    setUnitPriceInput(ln.ordered_price != null ? String(ln.ordered_price) : ln.unit_price != null ? String(ln.unit_price) : '0');
    setReturnReasonInput(ln.return_reason ?? ln.note ?? '');
    setLineModalOpen(true);
    resetLinePicker();
  };

  const submitLine = async () => {
    const qty = Number(qtyInput);
    const unitPrice = Number(unitPriceInput);
    const returnReason = returnReasonInput.trim();
    if (Number.isNaN(qty) || qty <= 0) {
      Alert.alert('Quantity', 'Enter a valid quantity.');
      return;
    }
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      Alert.alert('Unit price', 'Enter a valid unit price from the price catalog.');
      return;
    }
    if (returnReason.length < 3) {
      Alert.alert('Return reason', 'Enter why this item is being returned to the supplier (at least 3 characters).');
      return;
    }

    setSavingLine(true);
    try {
      if (editingLineId) {
        await putSupplierReturnLine(token, supplierReturnId, editingLineId, {
          returned_qty: qty,
          ordered_qty: qty,
          ordered_price: unitPrice,
          return_reason: returnReason,
        });
      } else {
        if (!selectedStock?.category_id || !selectedStock.unit_id) {
          Alert.alert('Item', 'Select a stock item from the list.');
          return;
        }
        await postSupplierReturnLine(token, supplierReturnId, {
          returned_item: Number(selectedStock.id),
          returned_qty: qty,
          ordered_qty: qty,
          ordered_price: unitPrice,
          return_reason: returnReason,
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
      await deleteSupplierReturnLine(token, supplierReturnId, lineId);
      await loadDetail(true);
    } catch (e) {
      Alert.alert('Could not remove line', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDeletingLineId(null);
    }
  };

  const openPdf = async () => {
    const action = logisticsWebDocumentAction(BASE_PATH, supplierReturnId);
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

  if (moduleGate === 'denied' || !isPortalModuleRouteAccessible(portal, 'Supplier returns')) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Not available</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const pdfAction = logisticsWebDocumentAction(BASE_PATH, supplierReturnId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title={detail?.ref ?? 'Supplier return'}
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
              <SupplierReturnOverviewPanel
                detail={detail}
                lineCount={detail.lines.length}
                editable={headerEditable}
                form={headerForm}
                storeOptions={storeOptions}
                supplierOptions={supplierOptions}
                loadingStores={loadingLookups}
                loadingSuppliers={loadingLookups}
                onChangeForm={(patch) => setHeaderForm((prev) => (prev ? { ...prev, ...patch } : prev))}
                onSelectStore={onSelectStore}
                onSelectSupplier={onSelectSupplier}
                onSaveHeader={headerEditable ? () => void saveHeader() : undefined}
                savingHeader={savingHeader}
              />
            ) : null}

            {detailTab === TAB_LINES ? (
              <View>
                <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
                  {linesEditable
                    ? 'Add stock lines for this store. Each line needs a return reason and saves immediately with catalog unit price.'
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
                            {ln.quantity} {ln.unit}
                            {ln.unit_price != null ? ` · @ ${ln.unit_price.toFixed(2)}` : ''}
                            {ln.line_amount != null ? ` · ${ln.line_amount.toFixed(2)}` : ''}
                          </Text>
                          {(ln.return_reason ?? ln.note) ? (
                            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 6 }}>
                              Reason: {ln.return_reason ?? ln.note}
                            </Text>
                          ) : linesEditable ? (
                            <Text style={{ ...outfit('medium', 12), color: colors.statusRejectedText, marginTop: 6 }}>
                              Reason required — tap edit
                            </Text>
                          ) : null}
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
              <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 12, marginBottom: 6 }}>
                Unit price
              </Text>
              <TextInput
                value={unitPriceInput}
                onChangeText={setUnitPriceInput}
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
              <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 12, marginBottom: 6 }}>
                Return reason *
              </Text>
              <TextInput
                value={returnReasonInput}
                onChangeText={setReturnReasonInput}
                placeholder="Why is this item being returned?"
                multiline
                placeholderTextColor={colors.textMuted}
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
                Choose category and item for this store (same as web ERP). Unit price defaults from the price catalog.
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
                label="Received item"
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
                modalTitle="Received item"
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
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...outfit('medium', 12), color: colors.textMuted }}>Quantity</Text>
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
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...outfit('medium', 12), color: colors.textMuted }}>Unit price</Text>
                      <TextInput
                        value={unitPriceInput}
                        onChangeText={setUnitPriceInput}
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
                    </View>
                  </View>
                  <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 12, marginBottom: 6 }}>
                    Return reason *
                  </Text>
                  <TextInput
                    value={returnReasonInput}
                    onChangeText={setReturnReasonInput}
                    placeholder="Why is this item being returned?"
                    multiline
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      padding: 12,
                      minHeight: 72,
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
