import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, View, ActivityIndicator } from 'react-native';
import { Text } from '../components/AppTypography';
import { WebPortalSurfacePanel } from '../components/WebPortalSurfacePanel';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { isAccountingApiListModule } from '../utils/accountingPortal';
import { isFinanceReportMobileModule } from '../utils/financeReportPortal';
import { portalModuleAccessGate } from '../utils/portalModuleAccess';
import { webPathForPortalSurface } from '../utils/portalWebSurfaces';
import { ModuleLegacyPanel } from './module/ModuleLegacyPanel';

export function ModuleWorkspaceScreen() {
  const route = useRoute<RouteProp<ModulesStackParamList, 'ModuleWorkspace'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const sp = useStaffPortal();
  const { setPortalActiveTab, refreshing, onPullRefresh, selectedModule, portal } = sp;

  const routeModule = route.params?.moduleRoute ?? selectedModule;

  const portalWebPath = useMemo(() => webPathForPortalSurface(routeModule, portal), [routeModule, portal]);
  const showPortalWebPanel =
    Boolean(portalWebPath) && !isAccountingApiListModule(routeModule) && !isFinanceReportMobileModule(routeModule);
  const portalSurfaceRow = useMemo(
    () => portal?.surfaces?.find((s) => s.visible && s.route === routeModule),
    [portal?.surfaces, routeModule],
  );

  const workspaceAccessGate = useMemo(() => portalModuleAccessGate(portal, routeModule.trim()), [portal, routeModule]);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
    }, [setPortalActiveTab]),
  );

  useEffect(() => {
    const m = route.params?.moduleRoute;
    if (m) {
      sp.setPortalSelectedModule(m);
    }
  }, [route.params?.moduleRoute, sp.setPortalSelectedModule]);

  if (workspaceAccessGate === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <ActivityIndicator color={colors.accentTeal} size="large" />
        <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 14, textAlign: 'center' }}>Loading module access…</Text>
      </View>
    );
  }

  if (workspaceAccessGate === 'denied') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }} numberOfLines={1}>
            {routeModule}
          </Text>
        </View>
        <View style={{ padding: 20 }}>
          <Text style={{ ...outfit('medium', 16), color: colors.textPrimary }}>No access</Text>
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 10 }}>
            This module is not enabled for your role in the mobile portal.
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
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }} numberOfLines={1}>
          {selectedModule}
        </Text>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.accentTeal} />}>
        {showPortalWebPanel ? (
          <>
            <WebPortalSurfacePanel title={portalSurfaceRow?.label ?? routeModule} description={portalSurfaceRow?.description} webPath={portalWebPath!} />
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Pressable
                onPress={() => navigation.navigate('ModuleList', { moduleRoute: routeModule })}
                style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 0.5, borderColor: colors.primaryNavy, alignItems: 'center' }}
              >
                <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>Open compact module screen</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <ModuleLegacyPanel />
        )}
      </ScrollView>
    </View>
  );
}
