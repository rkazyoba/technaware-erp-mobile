import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../components/AppTypography';
import {
  deleteKitchenToStoreMovementLine,
  deleteStoreToKitchenMovementLine,
  getLogisticsDocDetail,
  getStockReportLines,
  postKitchenToStoreMovementLine,
  postStoreToKitchenMovementLine,
  storeMovementDetailBasePath,
  type LogisticsDocDetail,
  type StockReportLine,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';
import { staffPortalHasPermission } from '../utils/staffPortalPermissions';

export function StoreMovementLinesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'StoreMovementLines'>>();
  const { docKind, issueId, stockStoreName } = route.params;

  const sp = useStaffPortal();
  const { token, portal, stockStores, loadStockStores, setPortalActiveTab, setPortalSelectedModule } = sp;

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Store movements'), [portal]);

  const canEdit = useMemo(() => {
    if (docKind === 'kitchen_to_store') {
      return staffPortalHasPermission(portal, 'erp.user.kitchen_to_store');
    }
    return staffPortalHasPermission(portal, 'erp.user.store_to_kitchen');
  }, [docKind, portal]);

  const basePath = storeMovementDetailBasePath(docKind);

  const [detail, setDetail] = useState<LogisticsDocDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [linePickLoading, setLinePickLoading] = useState(false);
  const [linePickRows, setLinePickRows] = useState<StockReportLine[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockReportLine | null>(null);
  const [qtyInput, setQtyInput] = useState('1');
  const [paxInput, setPaxInput] = useState('1');
  const [unitPriceInput, setUnitPriceInput] = useState('0');
  const [savingLine, setSavingLine] = useState(false);
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);

  const stockStoreId = useMemo(() => {
    const hit = stockStores.find((s) => s.name.trim() === stockStoreName.trim());
    return hit?.id ?? '';
  }, [stockStores, stockStoreName]);

  const loadDetail = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setLoading(true);
      }
      setLoadError(null);
      try {
        const res = await getLogisticsDocDetail(token, basePath, issueId);
        setDetail(res.data);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load');
        setDetail(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, basePath, issueId],
  );

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Store movements');
      void loadStockStores();
      void loadDetail(false);
    }, [loadDetail, loadStockStores, setPortalActiveTab, setPortalSelectedModule]),
  );

  const onPullRefresh = () => {
    setRefreshing(true);
    void loadDetail(true);
  };

  const openStockPicker = async () => {
    if (!stockStoreId) {
      Alert.alert('Store not found', `Reload modules or pick stock store "${stockStoreName}" from master data.`);
      return;
    }
    setSelectedStock(null);
    setQtyInput('1');
    setPaxInput('1');
    setUnitPriceInput('0');
    setLineModalOpen(true);
    setLinePickLoading(true);
    setLinePickRows([]);
    try {
      const res = await getStockReportLines(token, stockStoreId, 1, 150, '');
      const rows = res.data.items;
      setLinePickRows(docKind === 'kitchen_to_store' ? rows.filter((r) => r.quantity > 0) : rows);
    } catch {
      setLinePickRows([]);
    } finally {
      setLinePickLoading(false);
    }
  };

  const submitLine = async () => {
    if (!selectedStock) {
      Alert.alert('Pick an item', 'Choose a stock line first.');
      return;
    }
    const qty = Number(qtyInput);
    const pax = Number.parseInt(paxInput, 10);
    const unitPrice = Number(unitPriceInput);
    if (Number.isNaN(qty) || qty <= 0) {
      Alert.alert('Quantity', 'Enter a valid quantity.');
      return;
    }
    if (Number.isNaN(pax) || pax < 1) {
      Alert.alert('Pax', 'Enter a valid pax value (≥ 1).');
      return;
    }
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      Alert.alert('Unit price', 'Enter a valid unit price.');
      return;
    }
    if (docKind === 'kitchen_to_store' && qty > selectedStock.quantity) {
      Alert.alert('Quantity', 'Issued quantity cannot exceed on-hand quantity.');
      return;
    }

    setSavingLine(true);
    try {
      const desc = (selectedStock.description || selectedStock.code).trim();
      if (docKind === 'kitchen_to_store') {
        await postKitchenToStoreMovementLine(token, issueId, {
          part_id: Number.parseInt(selectedStock.id, 10),
          description: desc,
          requested_qty: qty,
          issued_qty: qty,
          pax,
          unit_price: unitPrice,
          amount: null,
        });
      } else {
        await postStoreToKitchenMovementLine(token, issueId, {
          part_id: Number.parseInt(selectedStock.id, 10),
          description: desc,
          returned_qty: qty,
          expected_pax: pax,
          unit_price: unitPrice,
          amount: null,
        });
      }
      setLineModalOpen(false);
      await loadDetail(true);
    } catch (e) {
      Alert.alert('Could not save line', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSavingLine(false);
    }
  };

  const confirmDeleteLine = (lineId: string) => {
    Alert.alert('Remove line?', 'Stock will be adjusted back. This cannot be undone from the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void deleteLine(lineId),
      },
    ]);
  };

  const deleteLine = async (lineId: string) => {
    setDeletingLineId(lineId);
    try {
      if (docKind === 'kitchen_to_store') {
        await deleteKitchenToStoreMovementLine(token, issueId, lineId);
      } else {
        await deleteStoreToKitchenMovementLine(token, issueId, lineId);
      }
      await loadDetail(true);
    } catch (e) {
      Alert.alert('Could not remove line', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDeletingLineId(null);
    }
  };

  if (moduleGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (moduleGate === 'denied' || !isPortalModuleRouteAccessible(portal, 'Store movements') || !canEdit) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Not available</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const docLabel =
    docKind === 'kitchen_to_store'
      ? 'Kitchen → store · kitchen_to_stores / kitchen_to_store_details'
      : 'Store → kitchen · store_to_kitchens / store_to_kitchen_details';

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 15), color: '#fff' }} numberOfLines={2}>
          Lines · {detail?.ref ?? issueId}
        </Text>
      </View>

      {loading && !detail ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
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

      {detail ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.accentTeal} />}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <Text style={{ ...outfit('regular', 12), color: colors.textMuted }}>{docLabel}</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.textPrimary, marginTop: 6 }}>{detail.ref}</Text>
            <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 4 }}>{detail.description}</Text>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 6 }}>{detail.context}</Text>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 4 }}>
              Status: {detail.status_label} · Total: {detail.total_amount != null ? detail.total_amount.toFixed(2) : '—'}
            </Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 8 }}>
              Stock cards from store: <Text style={{ ...outfit('medium', 12), color: colors.textSecondary }}>{stockStoreName}</Text>
              {docKind === 'kitchen_to_store'
                ? ' (each line deducts issued qty from this store)'
                : ' (each line increases returned qty into this store)'}
            </Text>

            <Pressable
              onPress={() => void openStockPicker()}
              style={{
                marginTop: 16,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: colors.accentTeal,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Add line (saves immediately)</Text>
            </Pressable>
          </View>

          <Text style={{ ...outfit('medium', 12), color: colors.textMuted, paddingHorizontal: 16, marginTop: 20, marginBottom: 8 }}>Saved lines</Text>
          {detail.lines.length === 0 ? (
            <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, paddingHorizontal: 16 }}>No lines yet.</Text>
          ) : (
            detail.lines.map((ln) => (
              <View
                key={ln.id}
                style={{
                  marginHorizontal: 16,
                  marginBottom: 10,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  borderWidth: 0.5,
                  borderColor: colors.borderSubtle,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{ln.item}</Text>
                  <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>
                    Qty {ln.quantity} {ln.unit ? `· ${ln.unit}` : ''}
                  </Text>
                  <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>Detail #{ln.id}</Text>
                </View>
                <Pressable
                  onPress={() => confirmDeleteLine(ln.id)}
                  disabled={deletingLineId === ln.id}
                  style={{ padding: 8 }}
                  hitSlop={6}
                >
                  {deletingLineId === ln.id ? (
                    <ActivityIndicator size="small" color={colors.statusRejectedText} />
                  ) : (
                    <Ionicons name="trash-outline" size={22} color={colors.statusRejectedText} />
                  )}
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      ) : null}

      <Modal visible={lineModalOpen} transparent animationType="slide" onRequestClose={() => !savingLine && setLineModalOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => !savingLine && setLineModalOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '88%' }}>
            <Text style={{ ...outfit('medium', 16), marginBottom: 8 }}>{selectedStock ? 'Quantity & price' : 'Pick stock item'}</Text>

            {!selectedStock ? (
              <>
                {linePickLoading ? <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 16 }} /> : null}
                <FlatList
                  style={{ maxHeight: 380 }}
                  data={linePickRows}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setSelectedStock(item);
                        const q = docKind === 'kitchen_to_store' ? Math.min(1, item.quantity || 1) : 1;
                        setQtyInput(String(q));
                      }}
                      style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }}
                    >
                      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
                        {item.code} · {item.description}
                      </Text>
                      <Text style={{ ...outfit('regular', 12), color: colors.textMuted }}>On hand: {item.quantity}</Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    linePickLoading ? null : (
                      <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, paddingVertical: 16 }}>No rows.</Text>
                    )
                  }
                />
              </>
            ) : (
              <>
                <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>{selectedStock.code}</Text>
                <Text style={{ ...outfit('medium', 12), color: colors.textMuted }}>{docKind === 'kitchen_to_store' ? 'Issued qty' : 'Returned qty'}</Text>
                <TextInput
                  value={qtyInput}
                  onChangeText={setQtyInput}
                  keyboardType="decimal-pad"
                  style={{
                    borderWidth: 0.5,
                    borderColor: colors.borderSubtle,
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 12,
                    ...outfit('regular', 15),
                    color: colors.textPrimary,
                  }}
                />
                <Text style={{ ...outfit('medium', 12), color: colors.textMuted }}>{docKind === 'kitchen_to_store' ? 'Pax' : 'Expected pax'}</Text>
                <TextInput
                  value={paxInput}
                  onChangeText={setPaxInput}
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 0.5,
                    borderColor: colors.borderSubtle,
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 12,
                    ...outfit('regular', 15),
                    color: colors.textPrimary,
                  }}
                />
                <Text style={{ ...outfit('medium', 12), color: colors.textMuted }}>Unit price</Text>
                <TextInput
                  value={unitPriceInput}
                  onChangeText={setUnitPriceInput}
                  keyboardType="decimal-pad"
                  style={{
                    borderWidth: 0.5,
                    borderColor: colors.borderSubtle,
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 16,
                    ...outfit('regular', 15),
                    color: colors.textPrimary,
                  }}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => setSelectedStock(null)}
                    disabled={savingLine}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 0.5, borderColor: colors.borderSubtle, alignItems: 'center' }}
                  >
                    <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void submitLine()}
                    disabled={savingLine}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: savingLine ? colors.borderSubtle : colors.primaryNavy,
                      alignItems: 'center',
                    }}
                  >
                    {savingLine ? <ActivityIndicator color="#fff" /> : <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Save line</Text>}
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
