import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../../components/AppTypography';
import { TopBar, TopBarIconButton } from '../../components/TopBar';
import { PosBarcodeScannerModal } from '../../components/pos/PosBarcodeScannerModal';
import {
  completePosSale,
  getPosHeldOrders,
  getPosStandaloneSummary,
  holdPosOrder,
  searchPosCatalog,
  type PosCatalogItem,
  type PosSaleLineInput,
  type PosSalePaymentInput,
} from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { clearPosCart, loadPosCart, savePosCart } from '../../utils/posCartCache';
import { enqueuePendingPosSale, syncPendingPosSales } from '../../utils/posOfflineQueue';
import { newPosIdempotencyKey, openShiftForTerminal, posPaymentMethodLabel } from '../../utils/posPortal';

type CartLine = PosSaleLineInput & { key: string };

export function PosRegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PosRegister'>>();
  const { token, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();
  const { isOffline } = useNetworkStatus();

  const [description, setDescription] = useState('');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payments, setPayments] = useState<PosSalePaymentInput[]>([{ payment_method: 'cash', amount: 0 }]);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [vatRate, setVatRate] = useState(18);
  const [requireShift, setRequireShift] = useState(false);
  const [hasShift, setHasShift] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<PosCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [paymentsTouched, setPaymentsTouched] = useState(false);
  const [heldOrderId, setHeldOrderId] = useState<number | null>(route.params.heldOrderId ?? null);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const paymentMethodKeys = useMemo(
    () => Object.keys(paymentMethods).filter((k) => k !== 'folio'),
    [paymentMethods],
  );

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Retail POS');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;
      (async () => {
        setLoadingMeta(true);
        try {
          const res = await getPosStandaloneSummary(token);
          if (cancelled) return;
          setPaymentMethods(res.data.payment_methods ?? {});
          setVatRate(res.data.vat_rate_percent ?? 18);
          setRequireShift(Boolean(res.data.require_open_shift));
          const shift = openShiftForTerminal(res.data.open_shifts, route.params.terminalId);
          setHasShift(Boolean(shift));
        } finally {
          if (!cancelled) setLoadingMeta(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token, route.params.terminalId]),
  );

  useEffect(() => {
    if (cartHydrated || !token) return;
    let cancelled = false;
    (async () => {
      if (route.params.heldOrderId) {
        try {
          const res = await getPosHeldOrders(token, route.params.terminalId);
          const held = res.data.orders.find((o) => o.id === route.params.heldOrderId);
          if (cancelled || !held) return;
          setHeldOrderId(held.id);
          setCart(
            held.lines.map((line, idx) => ({
              key: `held-${held.id}-${idx}`,
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unit_price,
              line_discount: line.line_discount ?? 0,
              product_id: line.product_id ?? undefined,
              part_in_store_id: line.part_in_store_id ?? undefined,
            })),
          );
        } catch {
          /* ignore */
        }
      } else {
        const saved = await loadPosCart(route.params.terminalId);
        if (cancelled || !saved?.cart.length) return;
        setCart(saved.cart.map((line, idx) => ({ ...line, key: `saved-${idx}` })));
        if (saved.payments?.length) {
          setPayments(saved.payments);
          setPaymentsTouched(true);
        }
        if (saved.held_order_id) setHeldOrderId(saved.held_order_id);
      }
      if (!cancelled) setCartHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [cartHydrated, token, route.params.heldOrderId, route.params.terminalId]);

  useEffect(() => {
    if (!cartHydrated) return;
    const handle = setTimeout(() => {
      void savePosCart(route.params.terminalId, {
        cart: cart.map(({ key: _k, ...line }) => line),
        held_order_id: heldOrderId,
        payments,
        saved_at: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [cart, payments, heldOrderId, cartHydrated, route.params.terminalId]);

  useEffect(() => {
    if (!token || isOffline) return;
    void syncPendingPosSales(token, (orderNo) => onPortalNotify?.(`Synced offline sale — ${orderNo}`, 'success')).then(
      ({ synced, failed }) => {
        if (synced > 0 && failed === 0) {
          onPortalNotify?.(`${synced} offline sale(s) synced.`, 'success');
        }
      },
    );
  }, [token, isOffline, onPortalNotify]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    cart.forEach((line) => {
      const net = Math.max(0, line.quantity * line.unit_price - (line.line_discount ?? 0));
      subtotal += net;
      tax += net * (vatRate / 100);
    });
    return { subtotal, tax, grand: subtotal + tax };
  }, [cart, vatRate]);

  const paidTotal = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments],
  );

  useEffect(() => {
    if (paymentsTouched) {
      return;
    }
    setPayments((prev) => {
      if (prev.length !== 1) {
        return prev;
      }
      const next = Number(totals.grand.toFixed(2));
      if (Math.abs(Number(prev[0].amount) - next) < 0.001) {
        return prev;
      }
      return [{ ...prev[0], amount: next }];
    });
  }, [totals.grand, paymentsTouched]);

  useEffect(() => {
    if (!token || catalogQuery.trim().length < 2) {
      setCatalogResults([]);
      return;
    }
    const handle = setTimeout(() => {
      setCatalogLoading(true);
      void searchPosCatalog(token, { terminal_id: route.params.terminalId, q: catalogQuery.trim(), limit: 20 })
        .then((res) => setCatalogResults(res.data.items ?? []))
        .catch(() => setCatalogResults([]))
        .finally(() => setCatalogLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [token, catalogQuery, route.params.terminalId]);

  const addCatalogItem = (item: PosCatalogItem) => {
    if (!item.in_stock) {
      Alert.alert('Out of stock', 'This item has no stock at the terminal store.');
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        description: item.name,
        quantity: 1,
        unit_price: item.unit_price,
        line_discount: 0,
        product_id: item.product_id,
        part_in_store_id: item.part_in_store_id ?? undefined,
      },
    ]);
    setCatalogQuery('');
    setBarcodeQuery('');
    setCatalogResults([]);
  };

  const lookupBarcode = async (codeOverride?: string) => {
    const code = (codeOverride ?? barcodeQuery).trim();
    if (!token || !code) return;
    setCatalogLoading(true);
    try {
      const res = await searchPosCatalog(token, { terminal_id: route.params.terminalId, barcode: code, limit: 5 });
      const items = res.data.items ?? [];
      if (items.length === 1) {
        addCatalogItem(items[0]);
      } else if (items.length === 0) {
        Alert.alert('Not found', 'No product matches that barcode.');
      } else {
        setCatalogResults(items);
      }
    } catch {
      Alert.alert('Lookup failed', 'Could not search catalog.');
    } finally {
      setCatalogLoading(false);
    }
  };

  const onCameraScan = (code: string) => {
    setBarcodeQuery(code);
    void lookupBarcode(code);
  };

  const cyclePaymentMethod = (idx: number) => {
    const keys = paymentMethodKeys.length ? paymentMethodKeys : ['cash', 'card', 'mobile', 'other'];
    setPaymentsTouched(true);
    setPayments((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const currentIdx = keys.indexOf(row.payment_method);
        const nextMethod = keys[(currentIdx + 1) % keys.length] ?? 'cash';
        return { ...row, payment_method: nextMethod };
      }),
    );
  };

  const addPaymentRow = () => {
    setPaymentsTouched(true);
    setPayments((prev) => [...prev, { payment_method: paymentMethodKeys[0] ?? 'cash', amount: 0 }]);
  };

  const removePaymentRow = (idx: number) => {
    setPaymentsTouched(true);
    setPayments((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const inputStyle = {
    backgroundColor: colors.pageBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    ...outfit('regular', 14),
    color: colors.textPrimary,
  } as const;

  const addLine = () => {
    const desc = description.trim();
    const price = parseFloat(unitPrice);
    const quantity = parseFloat(qty);
    const lineDiscount = parseFloat(discount || '0');
    if (!desc) {
      Alert.alert('Check form', 'Enter a description.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Check form', 'Enter a valid unit price.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert('Check form', 'Enter a valid quantity.');
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        description: desc,
        quantity,
        unit_price: price,
        line_discount: lineDiscount,
      },
    ]);
    setDescription('');
    setUnitPrice('');
    setQty('1');
    setDiscount('0');
  };

  const completeSale = async () => {
    if (!token) return;
    if (requireShift && !hasShift) {
      Alert.alert('Shift required', 'Open a cashier shift before completing sales.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Empty cart', 'Add at least one line.');
      return;
    }
    const payRows = payments.map((p) => ({ ...p, amount: Number(p.amount) }));
    if (Math.abs(paidTotal - totals.grand) > 0.05) {
      Alert.alert('Payment mismatch', `Total is ${totals.grand.toFixed(2)} but paid is ${paidTotal.toFixed(2)}.`);
      return;
    }
    const linePayload = cart.map(({ key: _k, ...line }) => line);
    const idempotencyKey = newPosIdempotencyKey();

    if (isOffline) {
      await enqueuePendingPosSale({
        id: idempotencyKey,
        terminal_id: route.params.terminalId,
        source_module: 'pos_standalone',
        lines: linePayload,
        payments: payRows,
        order_id: heldOrderId,
      });
      await clearPosCart(route.params.terminalId);
      setCart([]);
      setHeldOrderId(null);
      setPayments([{ payment_method: 'cash', amount: 0 }]);
      setPaymentsTouched(false);
      Alert.alert('Saved offline', 'Sale queued and will sync when you are back online.');
      navigation.goBack();
      return;
    }

    setSubmitting(true);
    try {
      const res = await completePosSale(token, {
        terminal_id: route.params.terminalId,
        source_module: 'pos_standalone',
        lines: linePayload,
        payments: payRows,
        order_id: heldOrderId,
        idempotency_key: idempotencyKey,
      });
      await clearPosCart(route.params.terminalId);
      onPortalNotify?.(`Sale completed — ${res.data.order.order_no}`, 'success');
      setCart([]);
      setHeldOrderId(null);
      setPayments([{ payment_method: 'cash', amount: 0 }]);
      setPaymentsTouched(false);
      navigation.replace('PosReceipt', {
        orderId: res.data.order.id,
        orderNo: res.data.order.order_no,
        terminalId: route.params.terminalId,
        terminalName: route.params.terminalName,
      });
    } catch (e) {
      Alert.alert('Sale failed', e instanceof Error ? e.message : 'Could not complete sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const holdTicket = async () => {
    if (!token || isOffline) {
      Alert.alert('Hold unavailable', 'Connect to the network to hold tickets on the server.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Empty cart', 'Add at least one line.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await holdPosOrder(token, {
        terminal_id: route.params.terminalId,
        order_id: heldOrderId,
        lines: cart.map(({ key: _k, ...line }) => line),
      });
      await clearPosCart(route.params.terminalId);
      onPortalNotify?.(`Ticket held — ${res.data.order.order_no}`, 'success');
      setCart([]);
      setHeldOrderId(null);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hold failed', e instanceof Error ? e.message : 'Could not hold ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title={route.params.terminalName}
        subtitle="Retail register"
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {loadingMeta ? (
          <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 12 }} />
        ) : null}

        {requireShift && !hasShift ? (
          <View style={{ backgroundColor: '#fff3cd', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ ...outfit('medium', 13), color: '#856404' }}>Open a shift before selling.</Text>
          </View>
        ) : null}

        {isOffline ? (
          <View style={{ backgroundColor: colors.statusPendingBg, borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ ...outfit('medium', 13), color: colors.statusPendingText }}>
              Offline — sales will queue locally and sync when connected.
            </Text>
          </View>
        ) : null}

        {heldOrderId ? (
          <Text style={{ ...outfit('medium', 12), color: colors.accentTeal, marginBottom: 8 }}>
            Recalled held ticket #{heldOrderId}
          </Text>
        ) : null}

        <Text style={{ ...outfit('semibold', 14), marginBottom: 8 }}>Product lookup</Text>
        <TextInput
          style={inputStyle}
          placeholder="Search name or SKU…"
          value={catalogQuery}
          onChangeText={setCatalogQuery}
        />
        <TextInput
          style={[inputStyle, { marginTop: 8 }]}
          placeholder="Scan or enter barcode"
          value={barcodeQuery}
          onChangeText={setBarcodeQuery}
          onSubmitEditing={() => void lookupBarcode()}
          returnKeyType="done"
        />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Pressable
            onPress={() => void lookupBarcode()}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...outfit('medium', 13), color: colors.primaryNavy }}>Add by barcode</Text>
          </Pressable>
          <Pressable
            onPress={() => setScannerOpen(true)}
            style={{
              flex: 1,
              backgroundColor: colors.primaryNavy,
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...outfit('medium', 13), color: '#fff' }}>Scan camera</Text>
          </Pressable>
        </View>
        {catalogLoading ? <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 8 }} /> : null}
        {catalogResults.map((item) => (
          <Pressable
            key={`${item.product_id}-${item.code}`}
            onPress={() => addCatalogItem(item)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 10,
              marginTop: 8,
              borderWidth: 0.5,
              borderColor: item.in_stock ? colors.borderSubtle : '#fcd34d',
            }}
          >
            <Text style={{ ...outfit('medium', 14) }}>{item.name}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 2 }}>
              {item.code} · {item.unit_price.toFixed(2)}
              {item.stock_qty != null ? ` · stock ${item.stock_qty}` : ''}
            </Text>
          </Pressable>
        ))}

        <Text style={{ ...outfit('semibold', 14), marginTop: 16, marginBottom: 8 }}>Cart ({cart.length})</Text>
        {cart.length === 0 ? (
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>No items yet.</Text>
        ) : (
          cart.map((line, idx) => (
            <View
              key={line.key}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: 0.5,
                borderColor: colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...outfit('medium', 14), flex: 1 }}>{line.description}</Text>
                <Pressable onPress={() => setCart((prev) => prev.filter((_, i) => i !== idx))}>
                  <Text style={{ color: '#c0392b' }}>Remove</Text>
                </Pressable>
              </View>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>
                {line.quantity} × {line.unit_price.toFixed(2)}
                {(line.line_discount ?? 0) > 0 ? ` · disc ${line.line_discount}` : ''}
              </Text>
            </View>
          ))
        )}

        <Text style={{ ...outfit('semibold', 14), marginTop: 8, marginBottom: 8 }}>Add item</Text>
        <TextInput style={inputStyle} placeholder="Description" value={description} onChangeText={setDescription} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput style={[inputStyle, { flex: 1 }]} placeholder="Qty" keyboardType="decimal-pad" value={qty} onChangeText={setQty} />
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            placeholder="Price"
            keyboardType="decimal-pad"
            value={unitPrice}
            onChangeText={setUnitPrice}
          />
        </View>
        <Pressable
          onPress={addLine}
          style={{ backgroundColor: colors.primaryNavy, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 }}
        >
          <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Add to cart</Text>
        </Pressable>

        <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 12 }}>
          <Text style={{ ...outfit('regular', 13) }}>Subtotal: {totals.subtotal.toFixed(2)}</Text>
          <Text style={{ ...outfit('regular', 13) }}>VAT ({vatRate}%): {totals.tax.toFixed(2)}</Text>
          <Text style={{ ...outfit('semibold', 16), marginTop: 6 }}>Total: {totals.grand.toFixed(2)}</Text>
        </View>

        <Text style={{ ...outfit('semibold', 14), marginTop: 16, marginBottom: 8 }}>Payment</Text>
        {payments.map((payment, idx) => (
          <View key={`pay-${idx}`} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <Pressable onPress={() => cyclePaymentMethod(idx)} style={[inputStyle, { flex: 1 }]}>
              <Text style={{ ...outfit('regular', 14) }}>
                {posPaymentMethodLabel(payment.payment_method, paymentMethods)}
              </Text>
            </Pressable>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              keyboardType="decimal-pad"
              value={String(payment.amount)}
              onChangeText={(v) => {
                setPaymentsTouched(true);
                setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, amount: parseFloat(v || '0') || 0 } : p)));
              }}
            />
            {payments.length > 1 ? (
              <Pressable onPress={() => removePaymentRow(idx)}>
                <Text style={{ color: '#c0392b', ...outfit('medium', 18) }}>×</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable onPress={addPaymentRow} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
          <Text style={{ ...outfit('medium', 13), color: colors.accentTeal }}>+ Split tender</Text>
        </Pressable>
        <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
          Paid {paidTotal.toFixed(2)} · Balance {(totals.grand - paidTotal).toFixed(2)}
        </Text>

        <Pressable
          onPress={() => void holdTicket()}
          disabled={submitting || cart.length === 0 || isOffline}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 16,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            opacity: submitting || isOffline ? 0.6 : 1,
          }}
        >
          <Text style={{ ...outfit('semibold', 15), color: colors.primaryNavy }}>
            {submitting ? 'Saving…' : 'Hold ticket'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void completeSale()}
          disabled={submitting || cart.length === 0 || (requireShift && !hasShift)}
          style={{
            backgroundColor: colors.accentTeal,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 10,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          <Text style={{ ...outfit('semibold', 15), color: '#fff' }}>
            {submitting ? 'Processing…' : isOffline ? 'Queue offline sale' : 'Complete sale'}
          </Text>
        </Pressable>
      </ScrollView>

      <PosBarcodeScannerModal visible={scannerOpen} onClose={() => setScannerOpen(false)} onScan={onCameraScan} />
    </View>
  );
}
