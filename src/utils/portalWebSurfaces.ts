import type { MobilePortalBootstrap } from '../types/app';

/** Portal surface opens the full web ERP at this path (relative to site root). */
export function webPathForPortalSurface(moduleRoute: string, portal: MobilePortalBootstrap | null): string | undefined {
  const row = portal?.surfaces?.find(
    (s) => s.visible && s.route === moduleRoute && typeof s.web_path === 'string' && s.web_path.trim() !== '',
  );
  return row?.web_path?.trim();
}
