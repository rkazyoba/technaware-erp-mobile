import type { PettyCashPaymentMethod, PettyCashRequestCategory } from '../api';

export const STAFF_FINANCE_PAYMENT_METHODS: { value: PettyCashPaymentMethod; label: string }[] = [
  { value: 0, label: 'Cash' },
  { value: 1, label: 'Bank transfer' },
  { value: 2, label: 'Mobile money' },
  { value: 3, label: 'Cheque' },
];

export const STAFF_FINANCE_CATEGORIES: { value: PettyCashRequestCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'training', label: 'Training' },
  { value: 'medical', label: 'Medical' },
  { value: 'travel', label: 'Travel' },
  { value: 'staff_welfare', label: 'Staff welfare' },
];

export const STAFF_FINANCE_CURRENCIES = ['TZS', 'USD'] as const;

export function staffFinanceModuleRoute(requestType: 'imprest' | 'expense_claim'): string {
  return requestType === 'expense_claim' ? 'Expense claims' : 'Staff imprest';
}

export function staffFinanceTypeLabel(requestType?: string): string {
  if (requestType === 'expense_claim') return 'Expense claim';
  if (requestType === 'imprest_retirement') return 'Imprest retirement';
  return 'Staff imprest';
}
