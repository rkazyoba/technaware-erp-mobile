import AsyncStorage from '@react-native-async-storage/async-storage';
import { completePosSale, type PosSaleLineInput, type PosSalePaymentInput } from '../api';

export type PendingPosSale = {
  id: string;
  terminal_id: number;
  source_module: 'pos_standalone';
  lines: PosSaleLineInput[];
  payments: PosSalePaymentInput[];
  customer_id?: number | null;
  order_id?: number | null;
  discount_type?: 'amount' | 'percent';
  discount_value?: number;
  created_at: string;
  attempts: number;
  last_error?: string;
};

const QUEUE_KEY = 'pos_offline_sale_queue';

export async function listPendingPosSales(): Promise<PendingPosSale[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PendingPosSale[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingPosSale[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function enqueuePendingPosSale(entry: Omit<PendingPosSale, 'created_at' | 'attempts'>): Promise<void> {
  const queue = await listPendingPosSales();
  queue.push({
    ...entry,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
  await writeQueue(queue);
}

export async function removePendingPosSale(id: string): Promise<void> {
  const queue = await listPendingPosSales();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function syncPendingPosSales(
  token: string,
  onSynced?: (orderNo: string) => void,
): Promise<{ synced: number; failed: number }> {
  const queue = await listPendingPosSales();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;
  const remaining: PendingPosSale[] = [];

  for (const item of queue) {
    try {
      const res = await completePosSale(token, {
        terminal_id: item.terminal_id,
        source_module: item.source_module,
        lines: item.lines,
        payments: item.payments,
        customer_id: item.customer_id,
        order_id: item.order_id ?? undefined,
        idempotency_key: item.id,
      });
      synced += 1;
      onSynced?.(res.data.order.order_no);
    } catch (e) {
      failed += 1;
      remaining.push({
        ...item,
        attempts: item.attempts + 1,
        last_error: e instanceof Error ? e.message : 'Sync failed',
      });
    }
  }

  await writeQueue(remaining);
  return { synced, failed };
}

export async function pendingPosSaleCount(): Promise<number> {
  return (await listPendingPosSales()).length;
}
