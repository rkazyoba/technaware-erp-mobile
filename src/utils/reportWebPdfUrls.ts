import type { FinanceReportPreset } from '../api';
import type { FinanceReportMobileModule } from './financeReportPortal';
import { webErpUrl } from './webErpUrls';

export type ReportPdfBuildParams = {
  preset?: FinanceReportPreset;
  from?: string;
  to?: string;
  asOf?: string;
  storeId?: string;
  year?: number;
};

function qs(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/**
 * Relative web ERP path that streams the same PDF as the web UI (session required in browser).
 * Returns null when the report has no dedicated PDF route — use webPath only.
 */
export function reportWebPdfPath(
  moduleRoute: FinanceReportMobileModule | 'Stock by store',
  params: ReportPdfBuildParams = {},
): string | null {
  switch (moduleRoute) {
    case 'Report trial balance':
      return `/accounting/reports/trial-balance/pdf${qs({
        preset: params.preset ?? 'mtd',
        from: params.preset === 'custom' ? params.from : undefined,
        to: params.preset === 'custom' ? params.to : undefined,
      })}`;
    case 'Report profit and loss':
      return `/accounting/reports/profit-and-loss/pdf${qs({
        preset: params.preset ?? 'mtd',
        from: params.preset === 'custom' ? params.from : undefined,
        to: params.preset === 'custom' ? params.to : undefined,
      })}`;
    case 'Report balance sheet':
      return `/accounting/reports/balance-sheet/pdf${qs({ as_of: params.asOf })}`;
    case 'Report cash flow':
      return `/accounting/reports/cash-flow/pdf${qs({
        preset: params.preset ?? 'mtd',
        from: params.preset === 'custom' ? params.from : undefined,
        to: params.preset === 'custom' ? params.to : undefined,
      })}`;
    case 'Daily invoice report':
      if (!params.from || !params.to) return null;
      return `/daily/invoice/pdf${qs({ start_date: params.from, end_date: params.to })}`;
    case 'Stock by store':
      if (!params.storeId) return null;
      return `/stock/report${qs({ store_id: params.storeId })}`;
    default:
      return null;
  }
}

export function reportWebPdfUrl(
  moduleRoute: FinanceReportMobileModule | 'Stock by store',
  params: ReportPdfBuildParams = {},
): string | null {
  const path = reportWebPdfPath(moduleRoute, params);
  return path ? webErpUrl(path) : null;
}
