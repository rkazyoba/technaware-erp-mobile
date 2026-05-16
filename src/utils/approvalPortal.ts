import type { IonGlyph } from '../constants/modulePresentation';
import type { ModuleColorFamily } from '../constants/modulePresentation';

export type ApprovalKindMeta = {
  icon: IonGlyph;
  colorFamily: ModuleColorFamily;
};

/** Visual metadata for unified approval inbox kinds (matches Laravel `UnifiedMobileApprovalService`). */
export const APPROVAL_KIND_META: Record<string, ApprovalKindMeta> = {
  requisition: { icon: 'reader-outline', colorFamily: 'teal' },
  purchase_order: { icon: 'document-text-outline', colorFamily: 'blue' },
  po_receipt: { icon: 'clipboard-outline', colorFamily: 'green' },
  non_po_receipt: { icon: 'receipt-outline', colorFamily: 'green' },
  supplier_return: { icon: 'arrow-undo-outline', colorFamily: 'coral' },
  delivery_note: { icon: 'car-outline', colorFamily: 'navy' },
  quotation: { icon: 'pricetag-outline', colorFamily: 'purple' },
  invoice: { icon: 'cash-outline', colorFamily: 'amber' },
  proforma_invoice: { icon: 'document-outline', colorFamily: 'amber' },
  payment_voucher: { icon: 'wallet-outline', colorFamily: 'slate' },
  supplier_invoice: { icon: 'receipt-outline', colorFamily: 'slate' },
  store_issue: { icon: 'log-out-outline', colorFamily: 'navy' },
  store_receipt: { icon: 'log-in-outline', colorFamily: 'navy' },
};

export function approvalKindMeta(kind: string): ApprovalKindMeta {
  return APPROVAL_KIND_META[kind] ?? { icon: 'checkmark-circle-outline', colorFamily: 'slate' };
}
