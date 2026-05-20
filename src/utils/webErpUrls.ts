import { API_BASE_URL } from '../api';

export function webErpBaseUrl(): string {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
}

/** Staff web ERP paths (relative to tenant site root). */
export const webErpPaths = {
  newDeliveryNote: '/add/delivery/note',
  newRequisition: '/add/requisition',
  newGrnPo: '/add/po/receipt',
  newNonPoReceipt: '/add/non_po/receipt',
  newSupplierReturn: '/add/supplier/return',
  newPickTicket: '/pick-tickets/create',
} as const;

export function webErpUrl(path: string): string {
  const base = webErpBaseUrl().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
