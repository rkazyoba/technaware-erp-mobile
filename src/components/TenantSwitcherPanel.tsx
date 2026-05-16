import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { resetTenantContext, updateTenantContext, type TenantContextMutationResponse } from '../api';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import type { MobilePortalBootstrap } from '../types/app';

type TenantSwitcherPanelProps = {
  portal: MobilePortalBootstrap;
  token: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onContextChanged: (result: TenantContextMutationResponse) => void | Promise<void>;
};

export function TenantSwitcherPanel({ portal, token, busy, onBusyChange, onContextChanged }: TenantSwitcherPanelProps) {
  const ts = portal.tenant_switcher;
  if (ts == null || ts.enabled !== true) {
    return null;
  }

  const currentOrg = ts.tenants.find((t) => t.id === portal.tenant_id);
  const homeOrg = ts.tenants.find((t) => t.id === ts.home_tenant_id);
  const currentOrgLabel = currentOrg?.name?.trim() ? currentOrg.name : `Organization #${portal.tenant_id}`;
  const homeOrgLabel = homeOrg?.name?.trim() ? homeOrg.name : `Organization #${ts.home_tenant_id}`;

  const runOp = async (fn: () => Promise<{ data: TenantContextMutationResponse }>) => {
    onBusyChange(true);
    try {
      const res = await fn();
      await Promise.resolve(onContextChanged(res.data));
    } catch (error) {
      Alert.alert('Organization context', error instanceof Error ? error.message : 'Request failed.');
    } finally {
      onBusyChange(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ ...outfit('medium', 15), color: colors.textPrimary }}>Organization context</Text>
        {busy ? <ActivityIndicator color={colors.accentTeal} /> : null}
      </View>
      <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 8 }}>
        Platform admin: switch which tenant’s data you work with in the app.
      </Text>
      <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 6 }}>
        Working in: <Text style={{ ...outfit('medium', 12), color: colors.textPrimary }}>{currentOrgLabel}</Text>
      </Text>
      <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>
        Home tenant: {homeOrgLabel}
        {ts.overridden ? ' · switched from home' : ''}
      </Text>
      <View style={{ marginTop: 12, gap: 8 }}>
        {ts.tenants.map((row) => {
          const selected = portal.tenant_id === row.id;
          return (
            <Pressable
              key={row.id}
              disabled={busy}
              onPress={() => {
                if (row.id === portal.tenant_id) return;
                void runOp(() => updateTenantContext(token, row.id));
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 11,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 0.5,
                borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
                backgroundColor: selected ? 'rgba(13,27,62,0.06)' : colors.pageBg,
              }}
            >
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={selected ? colors.primaryNavy : colors.textMuted}
                style={{ marginRight: 10 }}
              />
              <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, flex: 1 }} numberOfLines={2}>
                {row.name}
              </Text>
              <Text style={{ ...outfit('regular', 11), color: colors.textMuted }}>#{row.id}</Text>
            </Pressable>
          );
        })}
      </View>
      {ts.overridden ? (
        <Pressable
          disabled={busy}
          onPress={() => void runOp(() => resetTenantContext(token))}
          style={{
            marginTop: 12,
            paddingVertical: 11,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            alignItems: 'center',
            backgroundColor: colors.pageBg,
          }}
        >
          <Text style={{ ...outfit('medium', 13), color: colors.textSecondary }}>Reset to my home tenant</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
