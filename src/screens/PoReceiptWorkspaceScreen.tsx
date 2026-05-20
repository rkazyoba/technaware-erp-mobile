import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { PoReceiptOverviewPanel, type PoHeaderForm } from '../components/po/PoReceiptOverviewPanel';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import {
  deletePoReceiptLine,
  getLogisticsDocDetail,
  getPoReceiptOpenOrderLines,
  postPoReceiptLine,
  putPoReceiptHeader,
  putPoReceiptLine,
  type LogisticsDocDetail,
  type PoOpenOrderLine,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { canCrudOrLegacy, LOGISTICS_LEGACY } from '../utils/crudPermissions';
import { logisticsWebDocumentAction } from '../utils/erpDocumentPdfUrls';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';

const BASE_PATH = 'inventory/po-receipts';
const TAB_OVERVIEW = 'overview';
const TAB_LINES = 'lines';
const TAB_DOCUMENT = 'document';

function headerFormFromDetail(d: LogisticsDocDetail): PoHeaderForm {
  const orderLabel = d.order_no?.trim() || '';
  return {
    description: d.description ?? '',
    deliveryNote: d.delivery_note ?? '',
    receivedDate: (d.document_date ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    orderId: d.order_id ?? '',
    orderLabel,
    supplierLabel: d.supplier_name ?? '',
    siteLabel: d.site_name ?? '',
    storeLabel: d.store_name ?? '',
    status: d.status ?? '0',
  };
}

export function PoReceiptWorkspaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PoReceiptWorkspace'>>();
  const { receiptId, initialTab } = route.params;

  const sp = useStaffPortal();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = sp;

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'GRN (PO)'), [portal]);

  const canMutate = useMemo(
    () => canCrudOrLegacy(portal, 'po_receipts', 'update', LOGISTICS_LEGACY.po_receipts),
    [portal],
  );

  const [detail, setDetail] = useState<LogisticsDocDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailTab, setDetailTab] = useState(initialTab ?? TAB_OVERVIEW);

  const [headerForm, setHeaderForm] = useState<PoHeaderForm | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [openLinesLoading, setOpenLinesLoading] = useState(false);
  const [openLines, setOpenLines] = useState<PoOpenOrderLine[]>([]);
  const [openLinesError, setOpenLinesError] = useState<string | null>(null);
  const [selectedOpenLine, setSelectedOpenLine] = useState<PoOpenOrderLine | null>(null);
  const [receivedQtyInput, setReceivedQtyInput] = useState('1');
  const [savingLine, setSavingLine] = useState(false);
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const headerEditable = Boolean(detail && canMutate && (detail.status === '0' || detail.status === '1'));
  const linesEditable = headerEditable;

  /** PO part-in-store ids already saved on this GRN (one row per purchased_item). */
  const receivedPurchasedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ln of detail?.lines ?? []) {
      const pid = ln.ordered_item?.trim();
      if (pid) {
        ids.add(pid);
      }
    }
    return ids;
  }, [detail?.lines]);

  const openLinePickerRows = useMemo(() => {
    const available: PoOpenOrderLine[] = [];
    const alreadyOnReceipt: PoOpenOrderLine[] = [];
    for (const row of openLines) {
      if (receivedPurchasedIds.has(row.purchased_item)) {
        alreadyOnReceipt.push(row);
      } else {
        available.push(row);
      }
    }
    return { available, alreadyOnReceipt };
  }, [openLines, receivedPurchasedIds]);

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
        const res = await getLogisticsDocDetail(token, BASE_PATH, receiptId);
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
    [token, receiptId],
  );

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('GRN (PO)');
      void loadDetail(false);
    }, [loadDetail, setPortalActiveTab, setPortalSelectedModule]),
  );

  const onPullRefresh = () => {
    setRefreshing(true);
    void loadDetail(true);
  };

  const saveHeader = async () => {
    if (!token || !headerForm || !detail) {
      return;
    }
    if (!headerForm.description.trim()) {
      Alert.alert('Check form', 'Enter a description for this GRN.');
      return;
    }
    if (!headerForm.orderId || !detail.supplier_id || !detail.site_id || !detail.store_id) {
      Alert.alert('Check form', 'Receipt is missing purchase order or location.');
      return;
    }
    setSavingHeader(true);
    try {
      await putPoReceiptHeader(token, receiptId, {
        order_id: Number(headerForm.orderId),
        supplier_id: Number(detail.supplier_id),
        site_id: Number(detail.site_id),
        store_id: Number(detail.store_id),
        status: headerForm.status,
        description: headerForm.description.trim(),
        delivery_note: headerForm.deliveryNote.trim(),
        received_date: headerForm.receivedDate,
      });
      await loadDetail(true);
      Alert.alert('Saved', 'GRN details updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSavingHeader(false);
    }
  };

  const openLinePicker = async () => {
    const orderId = headerForm?.orderId || detail?.order_id;
    if (!orderId) {
      Alert.alert('Purchase order required', 'Save GRN details with a linked purchase order first.');
      return;
    }
    setEditingLineId(null);
    setSelectedOpenLine(null);
    setReceivedQtyInput('1');
    setOpenLinesError(null);
    setLineModalOpen(true);
    setOpenLinesLoading(true);
    setOpenLines([]);
    try {
      const res = await getPoReceiptOpenOrderLines(token, orderId);
      setOpenLines(res.data.items ?? []);
    } catch (e) {
      setOpenLinesError(e instanceof Error ? e.message : 'Could not load PO lines.');
    } finally {
      setOpenLinesLoading(false);
    }
  };

  const pickOpenLine = (row: PoOpenOrderLine) => {
    if (receivedPurchasedIds.has(row.purchased_item)) {
      return;
    }
    setSelectedOpenLine(row);
    setReceivedQtyInput(String(row.open_qty > 0 ? row.open_qty : 1));
  };

  const openEditLine = (lineId: string) => {
    const ln = detail?.lines.find((l) => l.id === lineId);
    if (!ln) {
      return;
    }
    setEditingLineId(lineId);
    setSelectedOpenLine(null);
    setReceivedQtyInput(String(ln.quantity));
    setOpenLines([]);
    setLineModalOpen(true);
  };

  const submitLine = async () => {
    const receivedQty = Number(receivedQtyInput);
    if (Number.isNaN(receivedQty) || receivedQty <= 0) {
      Alert.alert('Quantity', 'Enter a received quantity greater than zero.');
      return;
    }

    setSavingLine(true);
    try {
      if (editingLineId) {
        await putPoReceiptLine(token, receiptId, editingLineId, { received_qty: receivedQty });
      } else if (selectedOpenLine) {
        if (receivedQty > selectedOpenLine.open_qty + 0.0001) {
          Alert.alert(
            'Quantity',
            `Received qty cannot exceed open PO qty (${selectedOpenLine.open_qty.toFixed(2)}).`,
          );
          setSavingLine(false);
          return;
        }
        await postPoReceiptLine(token, receiptId, {
          category_id: Number(selectedOpenLine.category_id),
          ordered_item: Number(selectedOpenLine.purchased_item),
          unit_id: Number(selectedOpenLine.unit_id),
          ordered_qty: selectedOpenLine.open_qty,
          received_qty: receivedQty,
        });
      } else {
        return;
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
    Alert.alert('Remove line?', 'This line will be removed from the GRN.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void deleteLine(lineId) },
    ]);
  };

  const deleteLine = async (lineId: string) => {
    setDeletingLineId(lineId);
    try {
      await deletePoReceiptLine(token, receiptId, lineId);
      await loadDetail(true);
    } catch (e) {
      Alert.alert('Could not remove line', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDeletingLineId(null);
    }
  };

  const openPdf = async () => {
    const action = logisticsWebDocumentAction(BASE_PATH, receiptId);
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

  if (moduleGate === 'denied' || !isPortalModuleRouteAccessible(portal, 'GRN (PO)')) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Not available</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const pdfAction = logisticsWebDocumentAction(BASE_PATH, receiptId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title={detail?.ref ?? 'PO receipt'}
        subtitle="GRN workspace"
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
              <PoReceiptOverviewPanel
                detail={detail}
                lineCount={detail.lines.length}
                editable={headerEditable}
                form={headerForm}
                onChangeForm={(patch) => setHeaderForm((prev) => (prev ? { ...prev, ...patch } : prev))}
                onSaveHeader={headerEditable ? () => void saveHeader() : undefined}
                savingHeader={savingHeader}
              />
            ) : null}

            {detailTab === TAB_LINES ? (
              <View>
                <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
                  {linesEditable
                    ? 'Import open quantities from the linked purchase order. Each line saves immediately.'
                    : 'GRN lines are read-only in this status.'}
                </Text>
                {linesEditable ? (
                  <Pressable
                    onPress={() => void openLinePicker()}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: colors.accentTeal,
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Add line from PO</Text>
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
                            Received {ln.quantity}
                            {ln.ordered_qty != null ? ` · PO open ${ln.ordered_qty}` : ''}
                            {ln.unit ? ` ${ln.unit}` : ''}
                            {ln.unit_price != null ? ` · @ ${ln.unit_price.toFixed(2)}` : ''}
                            {ln.line_amount != null ? ` · ${ln.line_amount.toFixed(2)}` : ''}
                          </Text>
                          {ln.expiration_remaining_qty != null && ln.expiration_remaining_qty > 0.0001 ? (
                            <Text style={{ ...outfit('regular', 11), color: colors.statusRejectedText, marginTop: 4 }}>
                              Expiry: {ln.expiration_remaining_qty.toFixed(2)} qty still unallocated
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
                <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>GRN document</Text>
                <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
                  Open the PDF on the web ERP for printing and sharing.
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
              {editingLineId ? 'Edit received qty' : 'Add line from PO'}
            </Text>
          </View>

          {editingLineId || selectedOpenLine ? (
            <View style={{ paddingHorizontal: 16 }}>
              {selectedOpenLine ? (
                <>
                  <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{selectedOpenLine.description}</Text>
                  <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>
                    {selectedOpenLine.category_name} · Open qty {selectedOpenLine.open_qty} {selectedOpenLine.unit_name}
                  </Text>
                </>
              ) : null}
              <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginTop: 16, marginBottom: 6 }}>
                Received quantity
              </Text>
              <TextInput
                value={receivedQtyInput}
                onChangeText={setReceivedQtyInput}
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
              {selectedOpenLine ? (
                <Pressable onPress={() => setSelectedOpenLine(null)} style={{ marginTop: 10, alignItems: 'center' }}>
                  <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Pick another PO line</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <>
              {openLinesLoading ? (
                <ActivityIndicator style={{ marginTop: 24 }} color={colors.accentTeal} />
              ) : openLinesError ? (
                <Text style={{ ...outfit('regular', 14), color: colors.statusRejectedText, paddingHorizontal: 16 }}>
                  {openLinesError}
                </Text>
              ) : (
                <FlatList
                  data={openLinePickerRows.available}
                  keyExtractor={(item) => item.purchased_item}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                  ListHeaderComponent={
                    openLinePickerRows.alreadyOnReceipt.length > 0 ? (
                      <Text
                        style={{
                          ...outfit('regular', 12),
                          color: colors.textMuted,
                          marginBottom: 12,
                          lineHeight: 18,
                        }}
                      >
                        {openLinePickerRows.available.length === 0
                          ? 'All open PO lines below are already on this GRN. Remove a line from the receipt to add it again.'
                          : `${openLinePickerRows.alreadyOnReceipt.length} PO line(s) already on this GRN — shown faded and cannot be selected again.`}
                      </Text>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => pickOpenLine(item)}
                      style={{
                        paddingVertical: 12,
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.borderSubtle,
                      }}
                    >
                      <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{item.description}</Text>
                      <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 2 }}>
                        {item.category_name} · Open {item.open_qty} {item.unit_name}
                      </Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    openLines.length === 0 ? (
                      <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 16 }}>
                        No open PO lines left to receive (or PO is fully received).
                      </Text>
                    ) : null
                  }
                  ListFooterComponent={
                    openLinePickerRows.alreadyOnReceipt.length > 0 ? (
                      <View style={{ marginTop: openLinePickerRows.available.length > 0 ? 16 : 0 }}>
                        {openLinePickerRows.available.length > 0 ? (
                          <Text
                            style={{
                              ...outfit('medium', 11),
                              color: colors.textMuted,
                              letterSpacing: 0.5,
                              textTransform: 'uppercase',
                              marginBottom: 8,
                            }}
                          >
                            Already on this GRN
                          </Text>
                        ) : null}
                        {openLinePickerRows.alreadyOnReceipt.map((item) => (
                          <View
                            key={item.purchased_item}
                            style={{
                              paddingVertical: 12,
                              borderBottomWidth: 0.5,
                              borderBottomColor: colors.borderSubtle,
                              opacity: 0.42,
                            }}
                          >
                            <Text style={{ ...outfit('medium', 14), color: colors.textMuted }}>{item.description}</Text>
                            <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 2 }}>
                              {item.category_name} · Already received · Open {item.open_qty} {item.unit_name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null
                  }
                />
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
