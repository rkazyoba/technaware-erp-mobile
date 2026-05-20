import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Text, TextInput } from '../components/AppTypography';
import { colors } from '../constants/colors';
import { ApprovalModuleScorePanel } from '../components/ApprovalModuleScorePanel';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import type { ApprovalModuleScore } from '../api';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { portalModuleAccessGate } from '../utils/portalModuleAccess';
import { approvalKindForTypeLabel, approvalTypeChipsFromSummary } from '../utils/approvalFilters';

type PendingDecision = { id: string; status: 'Approved' | 'Rejected' };

export function ApprovalsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'Approvals'>>();
  const sp = useStaffPortal();
  const {
    setPortalActiveTab,
    setPortalSelectedModule,
    approvalItems,
    approvalHasMore,
    approvalListTotal,
    approvalSummary,
    approvalNotes,
    approvalPage,
    approvalsUpdatedAt,
    loadApprovals,
    setApprovalNotes,
    setApprovalStatus,
    onPortalNotify,
    moduleError,
    moduleLoading,
    refreshing,
    onPullRefresh,
    portal,
  } = sp;

  const approvalsAccessGate = useMemo(() => portalModuleAccessGate(portal, 'Approvals'), [portal]);
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>(route.params?.typeFilter ?? 'All');
  const moduleScores = approvalSummary?.modules ?? [];
  const moduleScoresRef = useRef(moduleScores);
  moduleScoresRef.current = moduleScores;

  const applyTypeFilter = useCallback(
    (nextType: string, opts?: { force?: boolean; kind?: string }) => {
      setTypeFilter(nextType);
      const kind =
        opts?.kind !== undefined
          ? opts.kind.trim() || undefined
          : approvalKindForTypeLabel(nextType, moduleScores);
      void loadApprovals(1, { force: opts?.force ?? true, kind: kind ?? '' });
    },
    [loadApprovals, moduleScores],
  );

  const typeChips = useMemo(() => {
    const fromSummary = approvalTypeChipsFromSummary(moduleScores);
    if (fromSummary.length > 1) {
      return fromSummary;
    }
    const types = new Set(approvalItems.map((i) => i.type).filter(Boolean));
    return ['All', ...[...types].sort((a, b) => a.localeCompare(b))];
  }, [moduleScores, approvalItems]);

  const filteredItems = approvalItems;

  useFocusEffect(
    useCallback(() => {
      if (approvalsAccessGate !== 'allowed') {
        return;
      }
      setPortalActiveTab('modules');
      setPortalSelectedModule('Approvals');
      const initialType = route.params?.typeFilter ?? 'All';
      const initialKind =
        route.params?.kindFilter?.trim() ||
        approvalKindForTypeLabel(initialType, moduleScoresRef.current) ||
        '';
      setTypeFilter(initialType);
      void loadApprovals(1, { force: true, kind: initialKind });
    }, [
      approvalsAccessGate,
      setPortalActiveTab,
      setPortalSelectedModule,
      loadApprovals,
      route.params?.typeFilter,
      route.params?.kindFilter,
    ]),
  );

  const confirmAction = async () => {
    if (!pending || confirming) {
      return;
    }
    setConfirming(true);
    const result = await setApprovalStatus(pending.id, pending.status);
    setConfirming(false);
    if (!result.ok) {
      Alert.alert(
        pending.status === 'Approved' ? 'Approve failed' : 'Reject failed',
        result.error,
      );
      return;
    }
    setPending(null);
    onPortalNotify?.(
      pending.status === 'Approved' ? 'Request approved.' : 'Request rejected.',
      'success',
    );
  };

  const openDetail = (id: string, ref: string) => {
    navigation.navigate('RecordDetail', {
      moduleRoute: 'Approvals',
      detailKind: 'approval',
      recordId: id,
      titleHint: ref,
    });
  };

  const pendingTotal = approvalSummary?.total ?? (approvalListTotal > 0 ? approvalListTotal : approvalItems.length);
  const filterModuleCount =
    typeFilter === 'All' ? pendingTotal : moduleScores.find((m) => m.type === typeFilter)?.count ?? approvalListTotal;

  const openModuleInbox = (mod: ApprovalModuleScore) => {
    applyTypeFilter(mod.type, { force: true });
  };

  if (approvalsAccessGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <TopBar
          title="Approvals"
          left={
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          }
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <ActivityIndicator color={colors.accentTeal} size="large" />
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 14 }}>Loading module access…</Text>
        </View>
      </View>
    );
  }

  if (approvalsAccessGate === 'denied') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <TopBar
          title="Approvals"
          left={
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          }
        />
        <View style={{ padding: 20 }}>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
            Approvals are not enabled for your role in the mobile portal.
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginTop: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primaryNavy, alignItems: 'center' }}
          >
            <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title="Approvals"
        left={
          <Pressable onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6 }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.accentTeal} />}
      >
        <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Last updated: {approvalsUpdatedAt ?? 'Not synced yet'}</Text>

        <ApprovalModuleScorePanel
          total={pendingTotal}
          modules={moduleScores}
          activeTypeFilter={typeFilter}
          onSelectAll={() => applyTypeFilter('All', { force: true })}
          onSelectModule={openModuleInbox}
        />
        <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 8, paddingHorizontal: 4 }}>
          Tap a module card to filter the inbox below. Approve or reject from each row, or open View for line detail.
        </Text>

        <Text
          style={{
            ...outfit('medium', 11),
            color: colors.textMuted,
            letterSpacing: 0.66,
            textTransform: 'uppercase',
            marginTop: 18,
            marginBottom: 8,
          }}
        >
          Filter by type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {typeChips.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => applyTypeFilter(chip)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: typeFilter === chip ? colors.primaryNavy : colors.surface,
                borderWidth: 0.5,
                borderColor: typeFilter === chip ? colors.primaryNavy : colors.borderSubtle,
              }}
            >
              <Text style={{ ...outfit('medium', 12), color: typeFilter === chip ? '#fff' : colors.textPrimary }}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text
          style={{
            ...outfit('medium', 11),
            color: colors.textMuted,
            letterSpacing: 0.66,
            textTransform: 'uppercase',
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Awaiting your action
        </Text>

        {moduleError ? (
          <View style={{ marginTop: 4, padding: 14, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ color: colors.statusRejectedText, fontWeight: '500' }}>{moduleError}</Text>
            <Pressable
              onPress={() => void loadApprovals(1, { force: true, kind: approvalKindForTypeLabel(typeFilter, moduleScores) ?? '' })}
              style={{ marginTop: 10 }}
            >
              <Text style={{ color: colors.linkBlue, fontWeight: '500' }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {moduleLoading && approvalItems.length === 0 ? <ActivityIndicator style={{ marginTop: 24 }} color={colors.accentTeal} /> : null}

        {!moduleError && !moduleLoading && filteredItems.length === 0 ? (
          <View style={{ marginTop: 16, padding: 14, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>
              {typeFilter === 'All' ? 'Nothing waiting for approval' : `No ${typeFilter} items loaded`}
            </Text>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
              {typeFilter === 'All'
                ? 'You are up to date on every module you can approve.'
                : filterModuleCount > 0
                  ? `The summary shows ${filterModuleCount} pending ${typeFilter} document(s). Pull to refresh or tap Retry — if they still do not appear, check the same list on the web ERP.`
                  : 'Try another filter or tap Show all above.'}
            </Text>
          </View>
        ) : null}

        {!moduleError && filteredItems.length > 0 && approvalListTotal > filteredItems.length ? (
          <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 10 }}>
            Showing {filteredItems.length} of {approvalListTotal}
            {typeFilter !== 'All' ? ` ${typeFilter}` : ''} — scroll for more
          </Text>
        ) : null}

        {filteredItems.map((item) => (
          <View
            key={item.id}
            style={{
              marginTop: 12,
              padding: 14,
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ ...outfit('medium', 12), color: colors.linkBlue }}>{item.ref}</Text>
              <StatusBadge label={item.status === 'Approved' || item.status === 'Rejected' ? item.status : 'Pending'} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
              <View style={{ backgroundColor: colors.pageBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ ...outfit('medium', 10), color: colors.textSecondary }}>{item.type}</Text>
              </View>
            </View>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, marginTop: 4 }}>{item.subject}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 6 }}>Requested by {item.owner}</Text>
            {item.requested_date ? (
              <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{item.requested_date}</Text>
            ) : null}

            <TextInput
              style={{
                marginTop: 10,
                borderRadius: 10,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
                paddingHorizontal: 10,
                paddingVertical: 8,
                fontSize: 13,
                color: colors.textPrimary,
                minHeight: 44,
                textAlignVertical: 'top',
              }}
              placeholder="Optional action note"
              placeholderTextColor={colors.textMuted}
              multiline
              value={approvalNotes[item.id] ?? ''}
              onChangeText={(value) =>
                setApprovalNotes((current) => ({
                  ...current,
                  [item.id]: value,
                }))
              }
            />

            <View style={{ flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' }}>
              <Pressable
                onPress={() => void openDetail(item.id, item.ref)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: colors.pageBg,
                  marginRight: 8,
                  marginBottom: 8,
                  borderWidth: 0.5,
                  borderColor: colors.borderSubtle,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="eye-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>View</Text>
              </Pressable>
              <Pressable
                onPress={() => setPending({ id: item.id, status: 'Approved' })}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: colors.statusApprovedBg,
                  marginRight: 8,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.statusApprovedText} style={{ marginRight: 6 }} />
                <Text style={{ ...outfit('medium', 13), color: colors.statusApprovedText }}>Approve</Text>
              </Pressable>
              <Pressable
                onPress={() => setPending({ id: item.id, status: 'Rejected' })}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: colors.statusRejectedBg,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.statusRejectedText} style={{ marginRight: 6 }} />
                <Text style={{ ...outfit('medium', 13), color: colors.statusRejectedText }}>Reject</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {approvalHasMore ? (
          <Pressable onPress={() => void loadApprovals(approvalPage + 1)} style={{ marginTop: 8, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: colors.linkBlue, fontWeight: '500' }}>Load more</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal
        visible={pending != null}
        transparent
        animationType="slide"
        onRequestClose={() => !confirming && setPending(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
          onPress={() => !confirming && setPending(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              paddingBottom: 28,
            }}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderSubtle, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary }}>
              {pending?.status === 'Approved' ? 'Approve this request?' : 'Reject this request?'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
              This will send your optional note to the server and refresh the inbox.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 20 }}>
              <Pressable
                onPress={() => !confirming && setPending(null)}
                disabled={confirming}
                style={{ paddingVertical: 10, paddingHorizontal: 14 }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void confirmAction()}
                disabled={confirming}
                style={{ paddingVertical: 10, paddingHorizontal: 14, marginLeft: 8, flexDirection: 'row', alignItems: 'center' }}
              >
                {confirming ? <ActivityIndicator size="small" color={colors.accentTeal} style={{ marginRight: 8 }} /> : null}
                <Text style={{ color: pending?.status === 'Approved' ? colors.statusApprovedText : colors.statusRejectedText, fontWeight: '500' }}>
                  {confirming ? 'Saving…' : 'Confirm'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
