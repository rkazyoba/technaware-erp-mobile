import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  deleteDeliveryNoteLine,
  getLogisticsDocDetail,
  getProducts,
  postDeliveryNoteLine,
  postDeliveryNoteSubmitForApproval,
  type LogisticsDocDetail,
  type ProductListItem,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';
import { staffPortalHasPermission } from '../utils/staffPortalPermissions';

export function DeliveryNoteLinesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'DeliveryNoteLines'>>();
  const { deliveryNoteId } = route.params;

  const sp = useStaffPortal();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = sp;

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Delivery notes'), [portal]);
  const canEdit = staffPortalHasPermission(portal, 'erp.user.delivery_notes');

  const basePath = 'inventory/delivery-notes';

  const [detail, setDetail] = useState<LogisticsDocDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [productRows, setProductRows] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [qtyInput, setQtyInput] = useState('1');
  const [savingLine, setSavingLine] = useState(false);
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const linesEditable = Boolean(detail && (detail.status === '0' || detail.status === '3'));

  const loadDetail = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setLoading(true);
      }
      setLoadError(null);
      try {
        const res = await getLogisticsDocDetail(token, basePath, deliveryNoteId);
        setDetail(res.data);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load');
        setDetail(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, deliveryNoteId],
  );

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Delivery notes');
      void loadDetail(false);
    }, [loadDetail, setPortalActiveTab, setPortalSelectedModule]),
  );

  const onPullRefresh = () => {
    setRefreshing(true);
    void loadDetail(true);
  };

  const openProductPicker = () => {
    setSelectedProduct(null);
    setQtyInput('1');
    setProductQuery('');
    setProductRows([]);
    setLineModalOpen(true);
  };

  useEffect(() => {
    if (!lineModalOpen) {
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setProductLoading(true);
        try {
          const res = await getProducts(token, 1, 50, productQuery);
          const rows = res.data.items.filter((p) => (p.status ?? '').toLowerCase() === 'active');
          setProductRows(rows);
        } catch {
          setProductRows([]);
        } finally {
          setProductLoading(false);
        }
      })();
    }, 350);
    return () => clearTimeout(t);
  }, [lineModalOpen, productQuery, token]);

  const submitLine = async () => {
    if (!selectedProduct) {
      Alert.alert('Pick a product', 'Choose a product from the list.');
      return;
    }
    const qty = Number(qtyInput);
    if (Number.isNaN(qty) || qty <= 0) {
      Alert.alert('Quantity', 'Enter a valid quantity.');
      return;
    }
    setSavingLine(true);
    try {
      await postDeliveryNoteLine(token, deliveryNoteId, {
        product_id: Number.parseInt(selectedProduct.id, 10),
        quantity: qty,
      });
      setLineModalOpen(false);
      await loadDetail(true);
    } catch (e) {
      Alert.alert('Could not save line', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSavingLine(false);
    }
  };

  const confirmDeleteLine = (lineId: string) => {
    Alert.alert('Remove line?', 'This removes the line from the delivery note.', [
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
      await deleteDeliveryNoteLine(token, deliveryNoteId, lineId);
      await loadDetail(true);
    } catch (e) {
      Alert.alert('Could not remove line', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDeletingLineId(null);
    }
  };

  const submitForApproval = async () => {
    if (!detail || detail.lines.length < 1) {
      Alert.alert('Lines required', 'Add at least one product line before submitting.');
      return;
    }
    setSubmittingApproval(true);
    try {
      await postDeliveryNoteSubmitForApproval(token, deliveryNoteId);
      navigation.replace('RecordDetail', {
        moduleRoute: 'Delivery notes',
        detailKind: 'logistics',
        recordId: deliveryNoteId,
        logisticsPath: basePath,
        titleHint: detail.ref,
      });
    } catch (e) {
      Alert.alert('Submit failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmittingApproval(false);
    }
  };

  if (moduleGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (moduleGate === 'denied' || !isPortalModuleRouteAccessible(portal, 'Delivery notes') || !canEdit) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>Not available</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Go back</Text>
        </Pressable>
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
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 15), color: '#fff' }} numberOfLines={2}>
          Lines · {detail?.ref ?? deliveryNoteId}
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
            <Text style={{ ...outfit('regular', 12), color: colors.textMuted }}>delivery_notes · delivery_note_details</Text>
            <Text style={{ ...outfit('medium', 18), color: colors.textPrimary, marginTop: 6 }}>{detail.ref}</Text>
            <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 4 }}>{detail.description}</Text>
            {detail.context ? (
              <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 6 }}>{detail.context}</Text>
            ) : null}
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 6 }}>Status: {detail.status_label}</Text>

            {linesEditable ? (
              <>
                <Pressable
                  onPress={() => openProductPicker()}
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

                {detail.lines.length >= 1 ? (
                  <Pressable
                    onPress={() => void submitForApproval()}
                    disabled={submittingApproval}
                    style={{
                      marginTop: 12,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: submittingApproval ? colors.borderSubtle : colors.primaryNavy,
                      alignItems: 'center',
                    }}
                  >
                    {submittingApproval ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Submit for approval</Text>
                    )}
                  </Pressable>
                ) : null}
              </>
            ) : (
              <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 14 }}>
                This note cannot be edited in its current status.
              </Text>
            )}
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
                  {ln.note ? (
                    <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{ln.note}</Text>
                  ) : null}
                </View>
                {linesEditable ? (
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
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      ) : null}

      <Modal visible={lineModalOpen} transparent animationType="slide" onRequestClose={() => !savingLine && setLineModalOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => !savingLine && setLineModalOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '88%' }}>
            <Text style={{ ...outfit('medium', 16), marginBottom: 8 }}>{selectedProduct ? 'Quantity' : 'Pick product'}</Text>

            {!selectedProduct ? (
              <>
                <TextInput
                  value={productQuery}
                  onChangeText={setProductQuery}
                  placeholder="Search code or name"
                  placeholderTextColor={colors.textMuted}
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
                {productLoading ? <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 16 }} /> : null}
                <FlatList
                  style={{ maxHeight: 380 }}
                  data={productRows}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setSelectedProduct(item);
                        setQtyInput('1');
                      }}
                      style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }}
                    >
                      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
                        {item.code} · {item.name}
                      </Text>
                      <Text style={{ ...outfit('regular', 12), color: colors.textMuted }}>Active product · category #{item.category_id}</Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    productLoading ? null : (
                      <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, paddingVertical: 16 }}>No active products found.</Text>
                    )
                  }
                />
              </>
            ) : (
              <>
                <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
                  {selectedProduct.code} · {selectedProduct.name}
                </Text>
                <Text style={{ ...outfit('medium', 12), color: colors.textMuted }}>Quantity</Text>
                <TextInput
                  value={qtyInput}
                  onChangeText={setQtyInput}
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
                <Pressable
                  onPress={() => void submitLine()}
                  disabled={savingLine}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: savingLine ? colors.borderSubtle : colors.accentTeal,
                    alignItems: 'center',
                  }}
                >
                  {savingLine ? <ActivityIndicator color="#fff" /> : <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Save line</Text>}
                </Pressable>
                <Pressable onPress={() => setSelectedProduct(null)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
                  <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Pick a different product</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
