import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import {
  getFieldOpsAssets,
  getFieldOpsAssetsOutstanding,
  getFieldOpsSites,
  type FieldOpsAssetAssignment,
  type FieldOpsSite,
} from '../../api';
import { Text } from '../../components/AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { canCrud } from '../../utils/crudPermissions';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

type TabKey = 'outstanding' | 'all';

const STATUS_FILTERS = ['', 'issued', 'returned', 'lost', 'damaged', 'written_off', 'transferred'] as const;

function statusColor(status: string): string {
  switch (status) {
    case 'issued':
      return '#1b6ca8';
    case 'returned':
      return '#0d7a4f';
    case 'lost':
    case 'damaged':
    case 'written_off':
      return '#b42318';
    case 'transferred':
      return '#6c757d';
    default:
      return colors.textSecondary;
  }
}

export function AssetAssignmentListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Kit Assignments'), [portal]);
  const canCreate = useMemo(() => canCrud(portal, 'field_ops_asset_assignments', 'create'), [portal]);

  const [tab, setTab] = useState<TabKey>('outstanding');
  const [sites, setSites] = useState<FieldOpsSite[]>([]);
  const [siteId, setSiteId] = useState('');
  const [status, setStatus] = useState<string>('');
  const [items, setItems] = useState<FieldOpsAssetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Kit Assignments');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const sitesRes = await getFieldOpsSites(token);
        setSites(sitesRes.data.items);
        const params = { siteId: siteId || undefined, status: tab === 'all' ? status || undefined : undefined };
        const res =
          tab === 'outstanding'
            ? await getFieldOpsAssetsOutstanding(token, { siteId: siteId || undefined })
            : await getFieldOpsAssets(token, params);
        setItems(res.data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load assignments');
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, tab, siteId, status],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (moduleGate === 'pending') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.pageBg }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }
  if (moduleGate === 'denied') {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: colors.pageBg }}>
        <Text>No access to kit / asset assignments.</Text>
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
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Kit assignments</Text>
        {canCreate ? (
          <Pressable
            onPress={() => navigation.navigate('AssetAssignmentIssue')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <View style={[styles.leaveTypeWrap, { marginBottom: 12 }]}>
          {(
            [
              ['outstanding', 'Outstanding'],
              ['all', 'All'],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.leaveTypeChip, tab === key ? styles.leaveTypeChipActive : null]}
              onPress={() => setTab(key)}
            >
              <Text style={styles.menuChipText}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.approvalType}>Site</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 12 }}>
          <View style={styles.leaveTypeWrap}>
            <Pressable
              style={[styles.leaveTypeChip, !siteId ? styles.leaveTypeChipActive : null]}
              onPress={() => setSiteId('')}
            >
              <Text style={styles.menuChipText}>All sites</Text>
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
        </ScrollView>

        {tab === 'all' ? (
          <>
            <Text style={styles.approvalType}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 12 }}>
              <View style={styles.leaveTypeWrap}>
                {STATUS_FILTERS.map((st) => (
                  <Pressable
                    key={st || 'any'}
                    style={[styles.leaveTypeChip, status === st ? styles.leaveTypeChipActive : null]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={styles.menuChipText}>{st || 'Any'}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </>
        ) : null}

        {canCreate ? (
          <Pressable
            style={[styles.primaryAction, { marginBottom: 16 }]}
            onPress={() => navigation.navigate('AssetAssignmentIssue')}
          >
            <Text style={styles.primaryActionText}>Issue kit / asset</Text>
          </Pressable>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.accentTeal} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={{ color: '#b42318', marginTop: 8 }}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No assignments</Text>
            <Text style={styles.emptyStateText}>
              {tab === 'outstanding'
                ? 'No open kit / asset assignments for this filter.'
                : 'No assignments match the selected filters.'}
            </Text>
          </View>
        ) : (
          items.map((row) => (
            <Pressable
              key={row.id}
              style={[styles.card, { marginBottom: 8 }]}
              onPress={() => navigation.navigate('AssetAssignmentDetail', { assignmentId: row.id })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ ...outfit('semibold', 14), flex: 1 }}>{row.asset_type_name || 'Asset'}</Text>
                <Text style={{ ...outfit('medium', 11), color: statusColor(row.status), textTransform: 'capitalize' }}>
                  {row.status}
                </Text>
              </View>
              <Text style={{ ...outfit('regular', 13), color: colors.textPrimary, marginTop: 4 }}>
                {row.employee_name}
              </Text>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 2 }}>
                Qty {row.quantity}
                {row.size ? ` · Size ${row.size}` : ''}
                {row.serial_no ? ` · S/N ${row.serial_no}` : ''}
                {row.site_name ? ` · ${row.site_name}` : ''}
              </Text>
              {row.condition ? (
                <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 2 }}>
                  Condition: {row.condition.replace(/_/g, ' ')}
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
