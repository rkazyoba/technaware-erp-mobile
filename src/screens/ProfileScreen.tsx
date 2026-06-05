import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { TenantSwitcherPanel } from '../components/TenantSwitcherPanel';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';
import { leaveProfileScreen } from '../navigation/navigateToProfile';
import { resolveProfilePhotoUrl, resolveTenantLabels } from '../utils/profileDisplay';
import { userHasEmployeeProfile } from '../utils/employeeProfile';
import { canPerformWrite } from '../utils/writeGate';
import { webErpUrl } from '../utils/webErpUrls';

function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, width: 118 }}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ ...outfit('regular', 13), color: colors.textPrimary }}>{value || '—'}</Text>
        {sub ? <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 3 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const [tenantBusy, setTenantBusy] = useState(false);
  const sp = useStaffPortal();
  const {
    setPortalActiveTab,
    user,
    portal,
    token,
    loading,
    onRefreshProfile,
    applyPortalBootstrap,
    onLogout,
    onPortalNotify,
    loadMobileSummary,
    loadApprovals,
    isOffline,
  } = sp;

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
    }, [setPortalActiveTab]),
  );

  const tenantSwitcherBusy = tenantBusy;
  const emp = user?.employee_profile;
  const tenants = useMemo(() => resolveTenantLabels(user, portal), [user, portal]);
  const photoUri = resolveProfilePhotoUrl(user);
  const profileWebUrl = webErpUrl('/profile');

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View style={{ backgroundColor: colors.primaryNavy, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => leaveProfileScreen(navigation)}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <ProfileAvatar uri={photoUri} size={88} name={user?.name} />
          <Text style={{ ...outfit('medium', 18), color: colors.textPrimary, marginTop: 12 }}>{user?.name ?? '—'}</Text>
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 4 }}>@{user?.username ?? '—'}</Text>
          {portal?.role?.name ? (
            <View style={{ marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(0,200,150,0.12)' }}>
              <Text style={{ ...outfit('medium', 12), color: colors.accentTeal }}>{portal.role.name}</Text>
            </View>
          ) : null}
          <Pressable
            onPress={() => void Linking.openURL(profileWebUrl)}
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons name="camera-outline" size={16} color={colors.linkBlue} />
            <Text style={{ ...outfit('medium', 12), color: colors.linkBlue }}>Update photo on web ERP</Text>
          </Pressable>
        </View>

        {portal ? (
          <TenantSwitcherPanel
            portal={portal}
            token={token}
            busy={tenantSwitcherBusy}
            onBusyChange={setTenantBusy}
            onContextChanged={(result) => {
              applyPortalBootstrap(result.portal);
              onPortalNotify?.('Organization context updated.', 'success');
              void onRefreshProfile({ silent: true });
              void loadMobileSummary({ force: true });
              void loadApprovals(1, { force: true, kind: '' });
            }}
          />
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, borderWidth: 0.5, borderColor: colors.borderSubtle, marginBottom: 16 }}>
          <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, paddingTop: 14, paddingBottom: 4 }}>Account</Text>
          <DetailRow label="Email" value={user?.email ?? ''} />
          <DetailRow label="Username" value={user?.username ?? ''} />
          {user?.phone ? <DetailRow label="Phone" value={user.phone} /> : null}
          <DetailRow
            label="Home tenant"
            value={tenants.home}
            sub={tenants.homeId != null ? `ID ${tenants.homeId}` : undefined}
          />
          <DetailRow
            label="Active tenant"
            value={tenants.active}
            sub={
              tenants.overridden
                ? `Switched · ID ${tenants.activeId ?? '—'}`
                : tenants.activeId != null
                  ? `ID ${tenants.activeId}`
                  : undefined
            }
          />
          {portal?.has_wildcard ? <DetailRow label="Access" value="Full (wildcard)" /> : null}
        </View>

        {emp || userHasEmployeeProfile(user) ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, borderWidth: 0.5, borderColor: colors.borderSubtle, marginBottom: 16 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, paddingTop: 14, paddingBottom: 4 }}>Employee (HR)</Text>
            <DetailRow label="Employee code" value={emp?.employee_code ?? ''} />
            <DetailRow label="Display name" value={emp?.name ?? ''} />
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.borderSubtle, marginBottom: 16 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>Employee profile</Text>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
              No employee linked. The email on your account ({user?.email ?? '—'}) must exactly match the email on your HR employee record in {tenants.active}. Ask HR to update the employee email, then tap Sync account.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => navigation.navigate('About')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => {
            if (!canPerformWrite(isOffline, (message) => onPortalNotify?.(message, 'info'))) {
              return;
            }
            void onRefreshProfile();
          }}
          disabled={loading || tenantBusy}
          style={{
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: colors.primaryNavy,
            alignItems: 'center',
            marginBottom: 10,
            opacity: loading || tenantBusy ? 0.65 : isOffline ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryNavy} />
          ) : (
            <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>
              {isOffline ? 'Sync account (offline)' : 'Sync account'}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => void onLogout()}
          disabled={tenantBusy}
          style={{ paddingVertical: 14, borderRadius: 12, backgroundColor: colors.statusRejectedBg, alignItems: 'center' }}
        >
          <Text style={{ ...outfit('medium', 14), color: colors.statusRejectedText }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
