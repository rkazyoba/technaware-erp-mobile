import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PosSaleLineInput, PosSalePaymentInput } from '../api';

export type SavedPosCart = {
  cart: PosSaleLineInput[];
  customer_id?: number | null;
  held_order_id?: number | null;
  discount_type?: 'amount' | 'percent';
  discount_value?: number;
  payments?: PosSalePaymentInput[];
  saved_at: string;
};

function cartKey(terminalId: number): string {
  return `pos_register_cart:${terminalId}`;
}

export async function loadPosCart(terminalId: number): Promise<SavedPosCart | null> {
  const raw = await AsyncStorage.getItem(cartKey(terminalId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedPosCart;
  } catch {
    return null;
  }
}

export async function savePosCart(terminalId: number, cart: SavedPosCart): Promise<void> {
  await AsyncStorage.setItem(cartKey(terminalId), JSON.stringify({ ...cart, saved_at: new Date().toISOString() }));
}

export async function clearPosCart(terminalId: number): Promise<void> {
  await AsyncStorage.removeItem(cartKey(terminalId));
}
