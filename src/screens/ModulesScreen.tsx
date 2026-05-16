import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Text, TextInput } from '../components/AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { CATEGORY_LABELS, colorFamilyForSurfaceId, moduleColorStyles, moduleIconForSurfaceId } from '../constants/modulePresentation';
import { TopBar, TopBarIconButton } from '../components/TopBar';
import { navigateToPayslipTab } from '../navigation/navigateToPayslipTab';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { MobilePortalRow } from '../types/app';
import { isFinanceReportPortalSurface } from '../utils/reportPortal';

const VIEW_KEY = 'erp_mobile_modules_view';
const RECENT_KEY = 'erp_mobile_modules_recent_v1';

type ViewMode = 'grid' | 'list';

function categoryLabel(key: string | undefined): string {
  if (!key) return CATEGORY_LABELS.uncategorised;
  return CATEGORY_LABELS[key] ?? key.replace(/_/g, ' ');
}

function surfaceIsModuleGridRow(row: MobilePortalRow): boolean {
  if (!row.visible || !row.route?.trim()) {
    return false;
  }
  if (isFinanceReportPortalSurface(row)) {
    return false;
  }
  const tab = (row.target_tab ?? '').toLowerCase();
  return tab !== 'payslip' && tab !== 'payroll';
}

export function ModulesScreen() {
  const sp = useStaffPortal();
  const navigation = useNavigation<any>();
  const { setPortalActiveTab, portal, onRefreshProfile, loading } = sp;
  const [q, setQ] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [recent, setRecent] = useState<string[]>([]);

  const visiblePortalCount = useMemo(
    () => (portal?.surfaces ?? []).filter(surfaceIsModuleGridRow).length,
    [portal?.surfaces],
  );

  const portalRefreshAttemptedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      if (portal != null && visiblePortalCount === 0 && !portalRefreshAttemptedRef.current) {
        portalRefreshAttemptedRef.current = true;
        void onRefreshProfile({ silent: true });
      }
      void (async () => {
        const v = await AsyncStorage.getItem(VIEW_KEY);
        if (v === 'list' || v === 'grid') setView(v);
        const r = await AsyncStorage.getItem(RECENT_KEY);
        if (r) {
          try {
            const parsed = JSON.parse(r) as string[];
            if (Array.isArray(parsed)) setRecent(parsed.slice(0, 5));
          } catch {
            /* ignore */
          }
        }
      })();
    }, [setPortalActiveTab, portal, visiblePortalCount, onRefreshProfile]),
  );

  useEffect(() => {
    if (visiblePortalCount > 0) {
      portalRefreshAttemptedRef.current = false;
    }
  }, [visiblePortalCount]);

  const surfaces = useMemo(() => {
    const rows = (portal?.surfaces ?? []).filter(surfaceIsModuleGridRow);
    const filtered = q.trim()
      ? rows.filter((s) => `${s.label ?? ''} ${s.route ?? ''} ${s.description ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
      : rows;
    return [...filtered].sort((a, b) => {
      const ca = (a.category_key ?? 'zzz').localeCompare(b.category_key ?? 'zzz');
      if (ca !== 0) return ca;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999) || (a.label ?? '').localeCompare(b.label ?? '');
    });
  }, [portal?.surfaces, q]);

  const grouped = useMemo(() => {
    const m = new Map<string, MobilePortalRow[]>();
    for (const s of surfaces) {
      const k = s.category_key ?? 'uncategorised';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return [...m.entries()];
  }, [surfaces]);

  const pushRecent = async (id: string) => {
    const next = [id, ...recent.filter((x) => x !== id)].slice(0, 5);
    setRecent(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const openSurface = async (row: MobilePortalRow) => {
    const route = row.route ?? '';
    if (row.target_tab === 'payroll' || row.target_tab === 'payslip') {
      sp.setPortalActiveTab('payslip');
      navigateToPayslipTab(navigation);
      return;
    }
    await pushRecent(row.id);
    sp.setPortalActiveTab('modules');
    sp.setPortalSelectedModule(route);
    if (route === 'Approvals') {
      navigation.navigate('Approvals', {});
      return;
    }
    navigation.navigate('ModuleList', { moduleRoute: route });
  };

  const toggleView = async () => {
    const next: ViewMode = view === 'grid' ? 'list' : 'grid';
    setView(next);
    await AsyncStorage.setItem(VIEW_KEY, next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title="Modules"
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TopBarIconButton name="person-circle-outline" onPress={() => navigation.navigate('Profile')} />
            <TopBarIconButton name={view === 'grid' ? 'list-outline' : 'grid-outline'} onPress={() => void toggleView()} />
            <TopBarIconButton name="search-outline" onPress={() => {}} />
          </View>
        }
      />
      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search modules..." placeholderTextColor={colors.textMuted} style={{ flex: 1, fontSize: 14 }} />
        </View>
      </View>

      {recent.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              ...outfit('medium', 11),
              color: colors.textMuted,
              letterSpacing: 0.66,
              textTransform: 'uppercase',
              paddingHorizontal: 16,
              marginBottom: 10,
            }}
          >
            Recently used
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, minHeight: 96 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 2,
              paddingBottom: 10,
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            {recent.map((id) => {
              const row = surfaces.find((s) => s.id === id) ?? portal?.surfaces?.find((s) => s.id === id);
              if (!row || !row.route) return null;
              const fam = moduleColorStyles(colorFamilyForSurfaceId(row.id));
              const icon = moduleIconForSurfaceId(row.id) as keyof typeof Ionicons.glyphMap;
              return (
                <Pressable
                  key={id}
                  onPress={() => void openSurface(row)}
                  style={{ width: 82, alignItems: 'center', paddingBottom: 2 }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: fam.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={icon} size={22} color={fam.fg} />
                  </View>
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                    style={{
                      ...outfit('regular', 11),
                      lineHeight: 15,
                      color: colors.textSecondary,
                      textAlign: 'center',
                      marginTop: 8,
                      width: '100%',
                    }}
                  >
                    {row.label ?? row.route}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {portal == null ? (
          <View style={{ marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Module access not loaded</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 8 }}>
              Could not read your portal profile from the server. Check the API URL and network, then refresh.
            </Text>
            <Pressable
              onPress={() => void onRefreshProfile()}
              disabled={loading}
              style={{
                marginTop: 14,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primaryNavy,
                alignItems: 'center',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Text style={{ ...outfit('medium', 13), color: '#fff' }}>{loading ? 'Refreshing…' : 'Reload from server'}</Text>
            </Pressable>
          </View>
        ) : null}
        {portal != null && surfaces.length === 0 ? (
          <View style={{ marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>No modules available</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 8 }}>
              Your role or organization may not have mobile access configured. Pull to refresh on Home, or tap below to reload from the server.
            </Text>
            <Pressable
              onPress={() => void onRefreshProfile()}
              disabled={loading}
              style={{
                marginTop: 14,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primaryNavy,
                alignItems: 'center',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Text style={{ ...outfit('medium', 13), color: '#fff' }}>{loading ? 'Refreshing…' : 'Refresh access'}</Text>
            </Pressable>
          </View>
        ) : null}
        {grouped.map(([cat, rows]) => (
          <View key={cat} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '500', color: colors.textMuted, letterSpacing: 0.7, textTransform: 'uppercase' }}>
                {categoryLabel(cat)}
              </Text>
              <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)' }} />
            </View>
            {view === 'grid' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 }}>
                {rows.map((row) => {
                  const fam = moduleColorStyles(colorFamilyForSurfaceId(row.id));
                  const icon = moduleIconForSurfaceId(row.id) as keyof typeof Ionicons.glyphMap;
                  return (
                    <Pressable
                      key={row.id}
                      onPress={() => void openSurface(row)}
                      style={{
                        width: '48%',
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 14,
                        borderWidth: 0.5,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: fam.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={icon} size={18} color={fam.fg} />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textPrimary, marginTop: 10 }} numberOfLines={2}>
                        {row.label ?? row.route}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
                {rows.map((row, idx) => {
                  const fam = moduleColorStyles(colorFamilyForSurfaceId(row.id));
                  const icon = moduleIconForSurfaceId(row.id) as keyof typeof Ionicons.glyphMap;
                  return (
                    <Pressable
                      key={row.id}
                      onPress={() => void openSurface(row)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderBottomWidth: idx === rows.length - 1 ? 0 : 0.5,
                        borderBottomColor: colors.borderSubtle,
                        gap: 10,
                      }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: fam.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={icon} size={18} color={fam.fg} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textPrimary }}>{row.label ?? row.route}</Text>
                        {row.description ? (
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }} numberOfLines={2}>
                            {row.description}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
