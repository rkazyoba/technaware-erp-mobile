import { webErpUrl } from './webErpUrls';

/** Human label for opening the web document (PDF or HTML print view). */
export type ErpWebDocumentAction = {
  url: string;
  /** True when the URL serves a `.pdf` document route (vs HTML print). */
  isPdf: boolean;
};

function safeId(recordId: string): string {
  return encodeURIComponent(String(recordId).trim());
}

/**
 * Web ERP routes for logistics list/detail API paths (`/api/v1/inventory/...`).
 * Opens in the device browser; user must be signed in on the web tenant for auth.
 */
export function logisticsWebDocumentAction(logisticsPath: string | undefined, recordId: string): ErpWebDocumentAction | null {
  if (!logisticsPath) return null;
  const id = safeId(recordId);
  const map: Record<string, { path: string; isPdf: boolean }> = {
    'inventory/po-receipts': { path: `/po/receipt/${id}/document.pdf`, isPdf: true },
    'inventory/non-po-receipts': { path: `/non_po/receipt/${id}/document.pdf`, isPdf: true },
    'inventory/pick-tickets': { path: `/pick-tickets/${id}/document.pdf`, isPdf: true },
    'inventory/delivery-notes': { path: `/delivery/note/${id}/document.pdf`, isPdf: true },
    'inventory/supplier-returns': { path: `/print/supplier/return/${id}`, isPdf: false },
    'inventory/movements/kitchen-to-store': { path: `/print/kitchen/store/issue/${id}`, isPdf: false },
  };
  const hit = map[logisticsPath];
  if (!hit) return null;
  return { url: webErpUrl(hit.path), isPdf: hit.isPdf };
}

/** Parses `kind:numericId` from unified mobile approval composite ids. */
export function parseApprovalCompositeId(composite: string | undefined): { kind: string; numericId: string } | null {
  if (!composite || typeof composite !== 'string') return null;
  const m = composite.match(/^([a-z_]+):(\d+)$/i);
  if (!m) return null;
  return { kind: m[1].toLowerCase(), numericId: m[2] };
}

export function approvalWebDocumentAction(compositeId: string | undefined): ErpWebDocumentAction | null {
  const parsed = parseApprovalCompositeId(compositeId);
  if (!parsed) return null;
  const id = safeId(parsed.numericId);
  const hit = ((): { path: string; isPdf: boolean } | null => {
    switch (parsed.kind) {
      case 'purchase_order':
        return { path: `/purchase/order/${id}/document.pdf`, isPdf: true };
      case 'po_receipt':
        return { path: `/po/receipt/${id}/document.pdf`, isPdf: true };
      case 'non_po_receipt':
        return { path: `/non_po/receipt/${id}/document.pdf`, isPdf: true };
      case 'delivery_note':
        return { path: `/delivery/note/${id}/document.pdf`, isPdf: true };
      case 'quotation':
        return { path: `/quotation/${id}/document.pdf`, isPdf: true };
      case 'supplier_return':
        return { path: `/print/supplier/return/${id}`, isPdf: false };
      default:
        return null;
    }
  })();
  if (!hit) return null;
  return { url: webErpUrl(hit.path), isPdf: hit.isPdf };
}

export function quotationWebPdfUrl(quotationId: string): ErpWebDocumentAction {
  const id = safeId(quotationId);
  return { url: webErpUrl(`/quotation/${id}/document.pdf`), isPdf: true };
}

export function purchaseOrderWebPdfUrl(orderId: string): ErpWebDocumentAction {
  const id = safeId(orderId);
  return { url: webErpUrl(`/purchase/order/${id}/document.pdf`), isPdf: true };
}
