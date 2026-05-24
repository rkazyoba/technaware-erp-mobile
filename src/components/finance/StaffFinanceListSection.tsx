import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { beginStaffFinanceRetirement, getPettyCashRequests, type PettyCashRequestListItem } from '../../api';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { styles } from '../../styles/appStyles';

type StaffFinanceListFilter =
  | { kind: 'imprest' }
  | { kind: 'expense_claim' }
  | { kind: 'imprest_retirement' }
  | { kind: 'awaiting_retirement' }
  | { kind: 'all' };

type StaffFinanceListSectionProps = {
  moduleRoute: string;
  filter: StaffFinanceListFilter;
  navigation: NativeStackNavigationProp<ModulesStackParamList>;
  canCreate: boolean;
  onOpenDetail: (item: PettyCashRequestListItem) => void;
};

function openStaffFinanceRecord(
  navigation: NativeStackNavigationProp<ModulesStackParamList>,
  moduleRoute: string,
  item: PettyCashRequestListItem,
  onOpenDetail: (item: PettyCashRequestListItem) => void,
) {
  const isDraftImprestOrExpense =
    item.workflow_status === 'draft' &&
    (item.request_type === 'imprest' || item.request_type === 'expense_claim');

  if (isDraftImprestOrExpense) {
    navigation.navigate('StaffFinanceRequestWorkspace', {
      requestId: item.id,
      requestType: item.request_type as 'imprest' | 'expense_claim',
      moduleRoute,
    });
    return;
  }

  onOpenDetail(item);
}

function requestTypeLabel(item: PettyCashRequestListItem): string {
  if (item.request_type === 'expense_claim') return 'Expense claim';
  if (item.request_type === 'imprest_retirement') return 'Imprest retirement';
  return 'Staff imprest';
}

export function StaffFinanceListSection({
  moduleRoute,
  filter,
  navigation,
  canCreate,
  onOpenDetail,
}: StaffFinanceListSectionProps) {
  const { token, formatNow } = useStaffPortal();
  const [items, setItems] = useState<PettyCashRequestListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingRetirementId, setStartingRetirementId] = useState<string | null>(null);

  const listOpts = useCallback(() => {
    switch (filter.kind) {
      case 'imprest':
        return { requestType: 'imprest' as const };
      case 'expense_claim':
        return { requestType: 'expense_claim' as const };
      case 'imprest_retirement':
        return { requestType: 'imprest_retirement' as const };
      case 'awaiting_retirement':
        return { awaitingRetirement: true as const };
      default:
        return {};
    }
  }, [filter.kind]);

  const load = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPettyCashRequests(token, pageNum, 15, listOpts());
        setItems((cur) => (pageNum === 1 ? res.data.items : [...cur, ...res.data.items]));
        setPage(res.data.pagination.current_page);
        setHasMore(res.data.pagination.current_page < res.data.pagination.last_page);
        setUpdatedAt(formatNow());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load requests.');
      } finally {
        setLoading(false);
      }
    },
    [token, listOpts, formatNow],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const openCreate = (requestType: 'imprest' | 'expense_claim') => {
    navigation.navigate('PettyCashRequestForm', { requestType });
  };

  const startRetirement = async (imprestId: string) => {
    setStartingRetirementId(imprestId);
    try {
      const res = await beginStaffFinanceRetirement(token, imprestId);
      navigation.navigate('StaffFinanceRetirementWorkspace', {
        retirementId: res.data.id,
        imprestId,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start retirement.');
    } finally {
      setStartingRetirementId(null);
    }
  };

  const showFab = canCreate && (filter.kind === 'imprest' || filter.kind === 'expense_claim');

  return (
    <View style={styles.approvalsSection}>
      <Text style={styles.syncText}>Last updated: {updatedAt ?? 'Not synced yet'}</Text>
      {error ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>Could not load</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <Pressable style={styles.detailsButton} onPress={() => void load(1)}>
            <Text style={styles.detailsButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {!error && !loading && items.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No records</Text>
          <Text style={styles.emptyStateText}>
            {filter.kind === 'awaiting_retirement'
              ? 'Paid imprest requests ready for retirement will appear here.'
              : filter.kind === 'imprest_retirement'
                ? 'Submitted retirements will appear here.'
                : 'Create a request using the + button.'}
          </Text>
        </View>
      ) : null}
      {items.map((item) => (
        <View key={item.id} style={styles.approvalCard}>
          <Pressable onPress={() => openStaffFinanceRecord(navigation, moduleRoute, item, onOpenDetail)}>
            <View style={styles.approvalHeader}>
              <Text style={styles.approvalId}>{item.ref}</Text>
              <Text style={styles.approvalStatus}>{item.status_label}</Text>
            </View>
            <Text style={styles.approvalOwner}>{requestTypeLabel(item)}</Text>
            <Text style={styles.approvalType} numberOfLines={2}>
              {item.description}
            </Text>
            {item.total_amount != null ? (
              <Text style={styles.approvalOwner}>{item.total_amount.toLocaleString()}</Text>
            ) : null}
          </Pressable>
          {item.can_submit_retirement ? (
            <Pressable
              style={[styles.detailsButton, { marginTop: 10 }]}
              disabled={startingRetirementId === item.id}
              onPress={() => void startRetirement(item.id)}
            >
              {startingRetirementId === item.id ? (
                <ActivityIndicator size="small" color={colors.accentTeal} />
              ) : (
                <Text style={styles.detailsButtonText}>Start retirement</Text>
              )}
            </Pressable>
          ) : null}
          {item.request_type === 'imprest_retirement' && item.workflow_status === 'draft' ? (
            <Pressable
              style={[styles.detailsButton, { marginTop: 10 }]}
              onPress={() =>
                navigation.navigate('StaffFinanceRetirementWorkspace', {
                  retirementId: item.id,
                  imprestId: item.imprest_parent_id ?? undefined,
                })
              }
            >
              <Text style={styles.detailsButtonText}>Continue draft</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {hasMore ? (
        <Pressable style={styles.detailsButton} onPress={() => void load(page + 1)}>
          <Text style={styles.detailsButtonText}>Load more</Text>
        </Pressable>
      ) : null}
      {loading ? <ActivityIndicator color={colors.accentTeal} style={{ marginTop: 12 }} /> : null}

      {showFab ? (
        <Pressable
          onPress={() => openCreate(filter.kind === 'expense_claim' ? 'expense_claim' : 'imprest')}
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
            elevation: 4,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }}
          accessibilityLabel={filter.kind === 'expense_claim' ? 'New expense claim' : 'New staff imprest'}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}
