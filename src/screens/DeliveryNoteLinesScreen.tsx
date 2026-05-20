import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Text } from '../components/AppTypography';
import { DetailTabBar } from '../components/DetailTabBar';
import { DeliveryNoteOverviewPanel } from '../components/delivery/DeliveryNoteOverviewPanel';
import { DeliveryNoteProductPicker } from '../components/delivery/DeliveryNoteProductPicker';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import {
  deleteDeliveryNoteLine,
  getLogisticsDocDetail,
  postDeliveryNoteLine,
  postDeliveryNoteSubmitForApproval,
  type LogisticsDocDetail,
  type ProductListItem,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { canCrud, canCrudOrLegacy, LOGISTICS_LEGACY } from '../utils/crudPermissions';
import { isPortalModuleRouteAccessible, portalModuleAccessGate } from '../utils/portalModuleAccess';
import { staffPortalHasAnyPermission } from '../utils/staffPortalPermissions';

const TAB_OVERVIEW = 'overview';
const TAB_LINES = 'lines';

export function DeliveryNoteLinesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'DeliveryNoteLines'>>();
  const { deliveryNoteId } = route.params;

  const sp = useStaffPortal();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = sp;

  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Delivery notes'), [portal]);

  const canView = useMemo(
    () =>
      staffPortalHasAnyPermission(portal, ['erp.user.delivery_notes', 'erp.approvals.delivery_notes']) ||
      canCrud(portal, 'delivery_notes', 'view'),
    [portal],
  );

  const canMutate = useMemo(
    () =>
      canCrudOrLegacy(portal, 'delivery_notes', 'create', LOGISTICS_LEGACY.delivery_notes) ||
      canCrudOrLegacy(portal, 'delivery_notes', 'update', LOGISTICS_LEGACY.delivery_notes),
    [portal],
  );

  const basePath = 'inventory/delivery-notes';

  const [detail, setDetail] = useState<LogisticsDocDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailTab, setDetailTab] = useState(TAB_OVERVIEW);

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [savingLine, setSavingLine] = useState(false);
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const linesEditable = Boolean(detail && canMutate && (detail.status === '0' || detail.status === '3'));

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

  const saveLine = async (product: ProductListItem, qty: number) => {
    setSavingLine(true);
    try {
      await postDeliveryNoteLine(token, deliveryNoteId, {
        product_id: Number.parseInt(product.id, 10),
        quantity: qty,
      });
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
      await loadDetail(true);
      setDetailTab(TAB_OVERVIEW);
      Alert.alert('Submitted', 'Delivery note is awaiting approval.');
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

  if (moduleGate === 'denied' || !isPortalModuleRouteAccessible(portal, 'Delivery notes') || !canView) {
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
      <TopBar
        title={detail?.ref ?? 'Delivery note'}
        subtitle={detail?.status_label}
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
      />

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
        <>
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.accentTeal} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: linesEditable ? 120 : 32 }}
          >
            <DetailTabBar
              tabs={[
                { id: TAB_OVERVIEW, label: 'Overview' },
                { id: TAB_LINES, label: 'Lines' },
              ]}
              active={detailTab}
              onChange={setDetailTab}
            />

            {detailTab === TAB_OVERVIEW ? (
              <>
                <DeliveryNoteOverviewPanel detail={detail} lineCount={detail.lines.length} />
                {linesEditable && detail.lines.length >= 1 ? (
                  <Pressable
                    onPress={() => void submitForApproval()}
                    disabled={submittingApproval}
                    style={{
                      marginTop: 8,
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
                {!linesEditable ? (
                  <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                    This delivery note cannot be edited in its current status.
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                {detail.lines.length === 0 ? (
                  <View
                    style={{
                      padding: 24,
                      borderRadius: 14,
                      backgroundColor: colors.surface,
                      borderWidth: 0.5,
                      borderColor: colors.borderSubtle,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="list-outline" size={32} color={colors.textMuted} />
                    <Text style={{ ...outfit('medium', 15), color: colors.textPrimary, marginTop: 12 }}>No lines yet</Text>
                    <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
                      Add products to build this delivery note.
                    </Text>
                  </View>
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
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        {ln.product_code ? (
                          <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>{ln.product_code}</Text>
                        ) : null}
                        <Text style={{ ...outfit('medium', 15), color: colors.textPrimary, marginTop: ln.product_code ? 4 : 0 }}>
                          {ln.item}
                        </Text>
                        {(ln.category ?? ln.note) ? (
                          <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>{ln.category ?? ln.note}</Text>
                        ) : null}
                        <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy, marginTop: 8 }}>
                          Qty {ln.quantity}
                          {ln.unit ? ` ${ln.unit}` : ''}
                        </Text>
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

                {linesEditable && detail.lines.length >= 1 ? (
                  <Pressable
                    onPress={() => void submitForApproval()}
                    disabled={submittingApproval}
                    style={{
                      marginTop: 8,
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
            )}
          </ScrollView>

          {linesEditable && detailTab === TAB_LINES ? (
            <Pressable
              onPress={() => setLineModalOpen(true)}
              style={{
                position: 'absolute',
                right: 20,
                bottom: 24,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.accentTeal,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
          ) : null}

          {linesEditable && detailTab === TAB_OVERVIEW ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
              <Pressable
                onPress={() => {
                  setDetailTab(TAB_LINES);
                  setLineModalOpen(true);
                }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: colors.accentTeal,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Add product line</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}

      <DeliveryNoteProductPicker
        visible={lineModalOpen}
        token={token}
        saving={savingLine}
        onClose={() => !savingLine && setLineModalOpen(false)}
        onSave={(product, qty) => void saveLine(product, qty)}
      />
    </View>
  );
}
