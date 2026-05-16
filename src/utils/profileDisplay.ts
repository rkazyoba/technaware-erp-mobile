import type { MobilePortalBootstrap, SignedInUser } from '../types/app';
import { webErpBaseUrl } from './webErpUrls';

export type TenantLabelPair = {
  home: string;
  active: string;
  homeId: number | null;
  activeId: number | null;
  overridden: boolean;
};

export function resolveTenantLabels(user: SignedInUser | null, portal: MobilePortalBootstrap | null): TenantLabelPair {
  const ctx = portal?.tenant_context;
  const ts = portal?.tenant_switcher;

  if (ts?.enabled === true) {
    const homeRow = ts.tenants.find((t) => t.id === ts.home_tenant_id);
    const activeRow = ts.tenants.find((t) => t.id === portal!.tenant_id);
    return {
      home: homeRow?.name?.trim() || ctx?.home_tenant_name || `Organization #${ts.home_tenant_id}`,
      active: activeRow?.name?.trim() || ctx?.active_tenant_name || `Organization #${portal!.tenant_id}`,
      homeId: ts.home_tenant_id,
      activeId: portal!.tenant_id,
      overridden: ts.overridden,
    };
  }

  if (ctx) {
    return {
      home: ctx.home_tenant_name || user?.home_tenant?.name || '—',
      active: ctx.active_tenant_name || '—',
      homeId: ctx.home_tenant_id,
      activeId: ctx.active_tenant_id,
      overridden: ctx.active_tenant_id !== ctx.home_tenant_id,
    };
  }

  const homeName = user?.home_tenant?.name;
  const homeId = user?.home_tenant?.id ?? user?.tenant_id ?? null;

  return {
    home: homeName?.trim() || (homeId != null ? `Organization #${homeId}` : '—'),
    active: homeName?.trim() || (homeId != null ? `Organization #${homeId}` : '—'),
    homeId,
    activeId: homeId,
    overridden: false,
  };
}

/** Re-host profile images on the same origin as the mobile API (LAN / staging friendly). */
export function resolveProfilePhotoUrl(user: SignedInUser | null): string | null {
  const raw = user?.photo_url?.trim();
  if (!raw) {
    return null;
  }
  try {
    const apiOrigin = new URL(webErpBaseUrl());
    const photo = new URL(raw);
    photo.protocol = apiOrigin.protocol;
    photo.host = apiOrigin.host;
    return photo.toString();
  } catch {
    return raw;
  }
}
