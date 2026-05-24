import { useCallback, useEffect, useState } from 'react';
import {
  getCustomerInvoiceDetail,
  getPaymentDetail,
  getPaymentVoucherDetail,
  getPettyCashRequestDetail,
  getProformaInvoiceDetail,
  getSupplierInvoiceDetail,
  type CustomerInvoiceDetail,
  type PaymentDetail,
  type PaymentVoucherDetail,
  type PettyCashRequestDetail,
  type ProformaInvoiceDetail,
  type SupplierInvoiceDetail,
} from '../api';
import type { RecordDetailParams } from '../navigation/moduleStackTypes';

type FinanceDetailKind =
  | 'finance_customer_invoice'
  | 'finance_proforma_invoice'
  | 'finance_payment'
  | 'finance_payment_voucher'
  | 'finance_petty_cash_request'
  | 'finance_supplier_invoice';

function pettyCashToPaymentVoucher(d: PettyCashRequestDetail): PaymentVoucherDetail {
  return {
    id: d.id,
    ref: d.ref,
    description: d.description,
    status: d.workflow_status ?? '',
    status_label: d.status_label,
    prepared_date: d.requested_date ?? null,
    approved_date: d.finance_approved_date ?? null,
    total_amount: d.total_amount,
    voucher_purpose: 'petty_cash',
    ledger_posted: d.ledger_posted,
    lines: d.lines.map((line) => ({
      id: line.id,
      description: line.line_description,
      amount: line.amount,
    })),
  };
}

function isFinanceDetailKind(kind: RecordDetailParams['detailKind']): kind is FinanceDetailKind {
  return (
    kind === 'finance_customer_invoice' ||
    kind === 'finance_proforma_invoice' ||
    kind === 'finance_payment' ||
    kind === 'finance_payment_voucher' ||
    kind === 'finance_petty_cash_request' ||
    kind === 'finance_supplier_invoice'
  );
}

export function useRecordFinanceDetail(
  detailKind: RecordDetailParams['detailKind'],
  recordId: string,
  token: string,
) {
  const [customerInvoice, setCustomerInvoice] = useState<CustomerInvoiceDetail | null>(null);
  const [proformaInvoice, setProformaInvoice] = useState<ProformaInvoiceDetail | null>(null);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [paymentVoucher, setPaymentVoucher] = useState<PaymentVoucherDetail | null>(null);
  const [pettyCash, setPettyCash] = useState<PettyCashRequestDetail | null>(null);
  const [supplierInvoice, setSupplierInvoice] = useState<SupplierInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearAll = useCallback(() => {
    setCustomerInvoice(null);
    setProformaInvoice(null);
    setPayment(null);
    setPaymentVoucher(null);
    setPettyCash(null);
    setSupplierInvoice(null);
  }, []);

  const load = useCallback(async () => {
    if (!isFinanceDetailKind(detailKind) || !recordId || !token) {
      clearAll();
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    clearAll();

    try {
      switch (detailKind) {
        case 'finance_customer_invoice': {
          const res = await getCustomerInvoiceDetail(token, recordId);
          setCustomerInvoice(res.data);
          break;
        }
        case 'finance_proforma_invoice': {
          const res = await getProformaInvoiceDetail(token, recordId);
          setProformaInvoice(res.data);
          break;
        }
        case 'finance_payment': {
          const res = await getPaymentDetail(token, recordId);
          setPayment(res.data);
          break;
        }
        case 'finance_payment_voucher': {
          const res = await getPaymentVoucherDetail(token, recordId);
          setPaymentVoucher(res.data);
          break;
        }
        case 'finance_petty_cash_request': {
          const res = await getPettyCashRequestDetail(token, recordId);
          const d = res.data;
          setPettyCash(d);
          setPaymentVoucher(pettyCashToPaymentVoucher(d));
          break;
        }
        case 'finance_supplier_invoice': {
          const res = await getSupplierInvoiceDetail(token, recordId);
          setSupplierInvoice(res.data);
          break;
        }
        default:
          break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load record.');
    } finally {
      setLoading(false);
    }
  }, [clearAll, detailKind, recordId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPettyCashDetail = useCallback((d: PettyCashRequestDetail) => {
    setPettyCash(d);
    setPaymentVoucher(pettyCashToPaymentVoucher(d));
  }, []);

  const loaded =
    (detailKind === 'finance_customer_invoice' && customerInvoice != null) ||
    (detailKind === 'finance_proforma_invoice' && proformaInvoice != null) ||
    (detailKind === 'finance_payment' && payment != null) ||
    (detailKind === 'finance_payment_voucher' && paymentVoucher != null) ||
    (detailKind === 'finance_petty_cash_request' && paymentVoucher != null) ||
    (detailKind === 'finance_supplier_invoice' && supplierInvoice != null);

  return {
    isFinance: isFinanceDetailKind(detailKind),
    customerInvoice,
    proformaInvoice,
    payment,
    paymentVoucher,
    pettyCash,
    supplierInvoice,
    loading,
    error,
    loaded,
    reload: load,
    applyPettyCashDetail,
  };
}
