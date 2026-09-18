import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import {
  getFieldOpsRosterBoard,
  getFieldOpsSites,
  type FieldOpsRosterBoard,
  type FieldOpsRosterBoardRow,
  type FieldOpsSite,
} from '../../api';
import { Text } from '../../components/AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { portalModuleAccessGate } from '../../utils/portalModuleAccess';
import { styles } from '../../styles/appStyles';

const STATUS_COLORS: Record<string, string> = {
  duty: '#1b6ca8',
  off: '#6c757d',
  present: '#0d7a4f',
  absent: '#b42318',
  unmarked: '#c47f00',
};

function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function labelDay(ymd: string): string {
  const [y, m, dd] = ymd.split('-').map(Number);
  const d = new Date(y, m - 1, dd);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function DutyRosterBoardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const { token, portal, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();
  const moduleGate = useMemo(() => portalModuleAccessGate(portal, 'Duty Roster'), [portal]);

  const [sites, setSites] = useState<FieldOpsSite[]>([]);
  const [siteId, setSiteId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(() => toYmd(new Date()));
  const [board, setBoard] = useState<FieldOpsRosterBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return toYmd(mondayOf(new Date(y, m - 1, d)));
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Duty Roster');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [sitesRes, boardRes] = await Promise.all([
          getFieldOpsSites(token),
          getFieldOpsRosterBoard(token, { weekStart, siteId: siteId || undefined }),
        ]);
        setSites(sitesRes.data.items);
        setBoard(boardRes.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load roster');
        setBoard(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, weekStart, siteId],
  );

  useFocusEffect(
    useCallback(() => {
      if (moduleGate !== 'allowed') return;
      void load();
    }, [load, moduleGate]),
  );

  const dayRows: FieldOpsRosterBoardRow[] = useMemo(() => {
    if (!board) return [];
    return board.rows.filter((r) => {
      const cell = r.days[selectedDate];
      return cell != null;
    });
  }, [board, selectedDate]);

  if (moduleGate === 'pending' || (loading && !board)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (moduleGate === 'denied') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, padding: 20 }}>
        <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
          Enable Field Ops → Duty roster for this tenant.
        </Text>
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
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Duty roster</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable
            onPress={() => {
              const [y, m, d] = selectedDate.split('-').map(Number);
              setSelectedDate(toYmd(addDays(new Date(y, m - 1, d), -1)));
            }}
            style={styles.menuChip}
          >
            <Text style={styles.menuChipText}>← Prev</Text>
          </Pressable>
          <Text style={{ ...outfit('semibold', 15), color: colors.textPrimary }}>{labelDay(selectedDate)}</Text>
          <Pressable
            onPress={() => {
              const [y, m, d] = selectedDate.split('-').map(Number);
              setSelectedDate(toYmd(addDays(new Date(y, m - 1, d), 1)));
            }}
            style={styles.menuChip}
          >
            <Text style={styles.menuChipText}>Next →</Text>
          </Pressable>
        </View>

        {board?.dates?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              {board.dates.map((ymd) => {
                const active = ymd === selectedDate;
                return (
                  <Pressable
                    key={ymd}
                    onPress={() => setSelectedDate(ymd)}
                    style={[
                      styles.leaveTypeChip,
                      { marginRight: 6 },
                      active ? styles.leaveTypeChipActive : null,
                    ]}
                  >
                    <Text style={styles.menuChipText}>{ymd.slice(8)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        <Text style={[styles.approvalType, { marginBottom: 8 }]}>Site</Text>
        <View style={[styles.leaveTypeWrap, { marginBottom: 12 }]}>
          <Pressable
            style={[styles.leaveTypeChip, !siteId ? styles.leaveTypeChipActive : null]}
            onPress={() => setSiteId('')}
          >
            <Text style={styles.menuChipText}>All</Text>
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

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.entries(STATUS_COLORS).map(([key, color]) => (
            <View
              key={key}
              style={{
                backgroundColor: color,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                marginRight: 6,
                marginBottom: 6,
              }}
            >
              <Text style={{ ...outfit('medium', 11), color: '#fff' }}>{key}</Text>
            </View>
          ))}
        </View>

        {error ? <Text style={[styles.emptyStateText, { color: '#b42318', marginBottom: 10 }]}>{error}</Text> : null}

        {dayRows.length === 0 ? (
          <Text style={styles.emptyStateText}>
            No staff for this day. Assign work shifts on the web, then use Generate week on the duty roster board.
          </Text>
        ) : null}

        {dayRows.map((row) => {
          const cell = row.days[selectedDate];
          const status = cell?.status ?? 'off';
          const color = STATUS_COLORS[status] ?? '#6c757d';
          return (
            <Pressable
              key={row.employee_id}
              style={[styles.card, { marginBottom: 10 }]}
              onPress={() => {
                if (status === 'duty' || status === 'unmarked' || status === 'present' || status === 'absent') {
                  navigation.navigate('SiteAttendanceSession', undefined);
                }
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ ...outfit('semibold', 15), color: colors.textPrimary }}>{row.employee_name}</Text>
                  <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
                    {row.guard_title || 'Staff'}
                    {row.work_shift_code ? ` · ${row.work_shift_code}` : ''}
                    {cell?.shift_slot ? ` · ${cell.shift_slot}` : ''}
                  </Text>
                </View>
                <View style={{ backgroundColor: color, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ ...outfit('medium', 12), color: '#fff' }}>{status}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.primaryAction, { marginTop: 8 }]}
          onPress={() => navigation.navigate('SiteAttendanceSession', undefined)}
        >
          <Text style={styles.primaryActionText}>Open site attendance</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
