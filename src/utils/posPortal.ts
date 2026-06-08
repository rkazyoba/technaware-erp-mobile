/** Portal route labels with native mobile POS UI (not web-only). */
export const POS_NATIVE_MODULE_ROUTES = ['Retail POS', 'Retail POS reports'] as const;

export type PosNativeModuleRoute = (typeof POS_NATIVE_MODULE_ROUTES)[number];

export function isPosNativeModule(moduleRoute: string): boolean {
  return POS_NATIVE_MODULE_ROUTES.includes(moduleRoute.trim() as PosNativeModuleRoute);
}

export function newPosIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const POS_PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  mobile: 'Mobile money',
  other: 'Other',
};

export function posPaymentMethodLabel(key: string, labels?: Record<string, string>): string {
  return labels?.[key] ?? POS_PAYMENT_METHOD_LABELS[key] ?? key;
}

import type { PosOpenShiftSummary } from '../api';

export function openShiftForTerminal(
  openShifts: PosOpenShiftSummary[] | undefined,
  terminalId: number,
): PosOpenShiftSummary | undefined {
  return openShifts?.find((s) => s.terminal_id === terminalId);
}
