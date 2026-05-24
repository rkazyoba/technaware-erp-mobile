import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { LogisticsLedgerStatusCard } from './LogisticsLedgerStatusCard';
import type {
  CustomerInvoiceDetail,
  PaymentDetail,
  PaymentVoucherDetail,
  ProformaInvoiceDetail,
  SupplierInvoiceDetail,
} from '../../api';

export type FinanceLineItem = {
  id: string;
  item?: string;
  description?: string;
  quantity?: number | null;
  unit?: string;
  category?: string;
  unit_price?: number | null;
  gross_excl_vat?: number | null;
  line_discount?: string;
  vat?: number | null;
  amount_excl_vat?: number | null;
  line_total?: number | null;
};

export function fmtFinanceMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtFinanceMoneyWithCurrency(
  amount: number | null | undefined,
  currency?: string | null,
): string {
  const formatted = fmtFinanceMoney(amount);
  if (formatted === '—') return formatted;
  const code = String(currency ?? '').trim();
  return code ? `${code} ${formatted}` : formatted;
}

type FinanceAmountFields = {
  total_amount?: number | null;
  subtotal_excl_vat?: number | null;
  total_vat?: number | null;
  discount_amount?: number | null;
};

/** Resolved document total for display (uses API total or derives from components). */
export function financeDocumentTotal(d: FinanceAmountFields): number | null {
  if (d.total_amount != null && !Number.isNaN(Number(d.total_amount))) {
    return Number(d.total_amount);
  }
  const sub = d.subtotal_excl_vat != null && !Number.isNaN(Number(d.subtotal_excl_vat)) ? Number(d.subtotal_excl_vat) : null;
  const vat = d.total_vat != null && !Number.isNaN(Number(d.total_vat)) ? Number(d.total_vat) : null;
  const disc =
    d.discount_amount != null && !Number.isNaN(Number(d.discount_amount)) ? Number(d.discount_amount) : 0;
  if (sub != null && vat != null) {
    return Number((sub - disc + vat).toFixed(2));
  }
  if (sub != null) {
    return Number((sub - disc).toFixed(2));
  }

  return null;
}

export type FinanceHeroMeta = {
  subtitle?: string;
  amount: string;
  meta?: string;
};

export function financeCustomerInvoiceHero(d: CustomerInvoiceDetail): FinanceHeroMeta {
  const total = financeDocumentTotal(d);
  const metaParts: string[] = [];
  if (d.invoice_date) metaParts.push(`Invoice ${d.invoice_date}`);
  if (d.due_date) metaParts.push(`Due ${d.due_date}`);

  return {
    subtitle: d.customer_name?.trim() || undefined,
    amount: fmtFinanceMoneyWithCurrency(total, d.currency),
    meta: metaParts.length > 0 ? metaParts.join(' · ') : undefined,
  };
}

export function financeProformaHero(d: ProformaInvoiceDetail): FinanceHeroMeta {
  const total = financeDocumentTotal(d);
  const metaParts: string[] = [];
  if (d.invoice_date) metaParts.push(`Dated ${d.invoice_date}`);
  if (d.valid_date) metaParts.push(`Valid until ${d.valid_date}`);

  return {
    subtitle: d.customer_name?.trim() || undefined,
    amount: fmtFinanceMoneyWithCurrency(total, d.currency),
    meta: metaParts.length > 0 ? metaParts.join(' · ') : undefined,
  };
}

export function financePaymentHero(d: PaymentDetail): FinanceHeroMeta {
  const paid = d.paid_amount ?? d.total_amount;
  return {
    subtitle: d.customer_name?.trim() || undefined,
    amount: fmtFinanceMoney(paid),
    meta: d.invoice_ref ? `Against ${d.invoice_ref}` : undefined,
  };
}

export function financePaymentVoucherHero(d: PaymentVoucherDetail): FinanceHeroMeta {
  return {
    subtitle: d.description?.trim() || undefined,
    amount: fmtFinanceMoney(d.total_amount),
    meta: d.prepared_date ? `Prepared ${d.prepared_date}` : undefined,
  };
}

export function financeSupplierInvoiceHero(d: SupplierInvoiceDetail): FinanceHeroMeta {
  return {
    subtitle: d.supplier_name?.trim() || undefined,
    amount: fmtFinanceMoney(d.total_gross ?? d.total_net),
    meta: d.invoice_date ? `Invoice ${d.invoice_date}` : undefined,
  };
}

function dash(value: string | null | undefined): string {
  const s = String(value ?? '').trim();
  return s !== '' ? s : '—';
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View
      style={{
        marginTop: 14,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surface,
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          ...outfit('medium', 11),
          color: colors.textMuted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export function DetailRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderTopWidth: 0.5,
        borderTopColor: colors.borderSubtle,
      }}
    >
      <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text
        style={{
          ...outfit(emphasize ? 'medium' : 'regular', 13),
          color: emphasize ? colors.textPrimary : colors.textPrimary,
          flex: 1.2,
          textAlign: 'right',
        }}
        numberOfLines={4}
      >
        {value}
      </Text>
    </View>
  );
}

export function FinanceTotalsCard({
  rows,
  totalLabel,
  totalValue,
}: {
  rows: Array<{ label: string; value: string; muted?: boolean }>;
  totalLabel: string;
  totalValue: string;
}) {
  return (
    <View
      style={{
        marginTop: 14,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surface,
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          ...outfit('medium', 11),
          color: colors.textMuted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 4,
        }}
      >
        Amounts
      </Text>
      {rows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderTopWidth: 0.5,
            borderTopColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary }}>{row.label}</Text>
          <Text style={{ ...outfit(row.muted ? 'regular' : 'medium', 13), color: colors.textPrimary }}>{row.value}</Text>
        </View>
      ))}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderTopWidth: 0.5,
          borderTopColor: colors.borderSubtle,
          backgroundColor: 'rgba(13, 27, 62, 0.06)',
        }}
      >
        <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>{totalLabel}</Text>
        <Text style={{ ...outfit('medium', 14), color: colors.primaryNavy }}>{totalValue}</Text>
      </View>
    </View>
  );
}

export function FinanceLineCard({ line, index }: { line: FinanceLineItem; index: number }) {
  const title = line.item ?? line.description ?? `Line ${index + 1}`;
  const qty =
    line.quantity != null
      ? `${Number(line.quantity).toLocaleString('en-US', { maximumFractionDigits: 4 })}${line.unit ? ` ${line.unit}` : ''}`
      : line.unit ?? '';

  return (
    <View
      style={{
        marginTop: 10,
        padding: 12,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.pageBg,
      }}
    >
      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }} numberOfLines={3}>
        {title}
      </Text>
      {line.category ? (
        <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{line.category}</Text>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
        {qty ? (
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Qty: {qty}</Text>
        ) : null}
        {line.unit_price != null ? (
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>
            Unit: {fmtFinanceMoney(line.unit_price)}
          </Text>
        ) : null}
        {line.line_discount ? (
          <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>Disc: {line.line_discount}</Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        {line.vat != null ? (
          <Text style={{ ...outfit('regular', 12), color: colors.textMuted }}>VAT {fmtFinanceMoney(line.vat)}</Text>
        ) : (
          <View />
        )}
        <Text style={{ ...outfit('medium', 13), color: colors.primaryNavy }}>
          {fmtFinanceMoney(line.amount_excl_vat ?? line.line_total ?? line.gross_excl_vat)}
        </Text>
      </View>
    </View>
  );
}

export function FinanceLinesSection({ lines, emptyLabel = 'No line items.' }: { lines: FinanceLineItem[]; emptyLabel?: string }) {
  if (lines.length === 0) {
    return <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 10 }}>{emptyLabel}</Text>;
  }
  return <>{lines.map((line, idx) => (
    <FinanceLineCard key={line.id} line={line} index={idx} />
  ))}</>;
}

export function CustomerInvoiceOverview({ d }: { d: CustomerInvoiceDetail }) {
  const isCreditNote = d.sales_type === 'credit_note';
  const ledgerMsg = isCreditNote
    ? d.ledger_reversed
      ? 'Reversal posted to ledger'
      : d.status === '3'
        ? 'Cancelled — reversal journal not found'
        : 'Credit note reverses revenue / AR on approval'
    : d.ledger_posted
      ? 'Posted to ledger (revenue / AR)'
      : 'Approved — ledger entry not found';

  return (
    <>
      {(d.status === '2' || d.status === '4' || (isCreditNote && d.status === '3')) ? (
        <LogisticsLedgerStatusCard
          status={d.status === '3' ? '2' : d.status}
          ledgerPosted={isCreditNote ? !!d.ledger_reversed || d.status === '2' : !!d.ledger_posted}
          postedMessage={ledgerMsg}
          pendingMessage={ledgerMsg}
        />
      ) : null}
      {d.payment?.due_amount != null ? (
        <DetailSection title="Accounts receivable">
          <DetailRow label="Paid to date" value={fmtFinanceMoney(d.payment.paid_amount)} />
          <DetailRow label="Amount due" value={fmtFinanceMoney(d.payment.due_amount)} emphasize />
        </DetailSection>
      ) : null}
      <DetailSection title="Identification">
        <DetailRow label="Invoice no." value={dash(d.ref)} emphasize />
        <DetailRow label="Customer" value={dash(d.customer_name)} />
        {d.customer_code ? <DetailRow label="Customer code" value={d.customer_code} /> : null}
        {d.contract_ref ? <DetailRow label="Contract" value={d.contract_ref} /> : null}
        {d.description?.trim() ? <DetailRow label="Description" value={d.description.trim()} /> : null}
      </DetailSection>

      <DetailSection title="Document type & tax">
        <DetailRow label="Sales type" value={dash(d.sales_type_label ?? d.sales_type)} />
        <DetailRow label="VAT treatment" value={dash(d.vat_treatment_label ?? d.vat_treatment)} />
        {d.discount_type_label ? (
          <DetailRow label="Document discount" value={`${d.discount_type_label}${d.discount_value != null ? ` · ${d.discount_value}` : ''}`} />
        ) : null}
        {d.discount_amount != null && d.discount_amount > 0 ? (
          <DetailRow label={d.document_discount_label ?? 'Discount applied'} value={fmtFinanceMoney(d.discount_amount)} />
        ) : null}
      </DetailSection>

      {d.referenced_invoice_ref ? (
        <DetailSection title="Referenced document">
          <DetailRow label="Reference invoice" value={d.referenced_invoice_ref} />
        </DetailSection>
      ) : null}

      <DetailSection title="Dates & period">
        <DetailRow label="Invoice date" value={dash(d.invoice_date)} />
        <DetailRow label="Due date" value={dash(d.due_date)} />
        {d.as_from_date || d.to_date ? (
          <DetailRow
            label="Service period"
            value={`${dash(d.as_from_date)} → ${dash(d.to_date)}`}
          />
        ) : null}
        {d.approved_date ? <DetailRow label="Approved" value={d.approved_date} /> : null}
      </DetailSection>

      <DetailSection title="Payment & currency">
        {d.payment_term_days != null ? <DetailRow label="Payment terms" value={`${d.payment_term_days} days`} /> : null}
        {d.currency ? <DetailRow label="Currency" value={d.currency} /> : null}
        {d.po_no ? <DetailRow label="Purchase order" value={d.po_no} /> : null}
        <DetailRow label="Status" value={dash(d.status_label)} />
      </DetailSection>

      <FinanceTotalsCard
        rows={[
          ...(d.subtotal_excl_vat != null
            ? [{ label: 'Subtotal (excl. VAT)', value: fmtFinanceMoney(d.subtotal_excl_vat) }]
            : []),
          ...(d.discount_amount != null && d.discount_amount > 0
            ? [{ label: d.document_discount_label ?? 'Document discount', value: `− ${fmtFinanceMoney(d.discount_amount)}`, muted: true }]
            : []),
          ...(d.total_vat != null ? [{ label: 'VAT', value: fmtFinanceMoney(d.total_vat) }] : []),
        ]}
        totalLabel="Total"
        totalValue={fmtFinanceMoneyWithCurrency(financeDocumentTotal(d), d.currency)}
      />
    </>
  );
}

export function ProformaInvoiceOverview({ d }: { d: ProformaInvoiceDetail }) {
  return (
    <>
      <DetailSection title="Identification">
        <DetailRow label="Proforma no." value={dash(d.ref)} emphasize />
        <DetailRow label="Customer" value={dash(d.customer_name)} />
        {d.contract_ref ? <DetailRow label="Contract" value={d.contract_ref} /> : null}
        {d.description?.trim() ? <DetailRow label="Description" value={d.description.trim()} /> : null}
      </DetailSection>

      <DetailSection title="Document type & tax">
        <DetailRow label="VAT treatment" value={dash(d.vat_treatment_label ?? d.vat_treatment)} />
        {d.discount_type_label ? (
          <DetailRow label="Document discount" value={dash(d.discount_type_label)} />
        ) : null}
        {d.discount_amount != null && d.discount_amount > 0 ? (
          <DetailRow label={d.document_discount_label ?? 'Discount applied'} value={fmtFinanceMoney(d.discount_amount)} />
        ) : null}
      </DetailSection>

      <DetailSection title="Dates">
        <DetailRow label="Invoice date" value={dash(d.invoice_date)} />
        <DetailRow label="Valid to" value={dash(d.valid_date)} />
        {d.as_from_date || d.to_date ? (
          <DetailRow label="Service period" value={`${dash(d.as_from_date)} → ${dash(d.to_date)}`} />
        ) : null}
        <DetailRow label="Status" value={dash(d.status_label)} />
      </DetailSection>

      {(d.payment_term_days != null || d.currency) ? (
        <DetailSection title="Payment & currency">
          {d.payment_term_days != null ? <DetailRow label="Payment terms" value={`${d.payment_term_days} days`} /> : null}
          {d.currency ? <DetailRow label="Currency" value={d.currency} /> : null}
        </DetailSection>
      ) : null}

      <FinanceTotalsCard
        rows={[
          ...(d.subtotal_excl_vat != null
            ? [{ label: 'Subtotal (excl. VAT)', value: fmtFinanceMoney(d.subtotal_excl_vat) }]
            : []),
          ...(d.total_vat != null ? [{ label: 'VAT', value: fmtFinanceMoney(d.total_vat) }] : []),
        ]}
        totalLabel="Total"
        totalValue={fmtFinanceMoneyWithCurrency(financeDocumentTotal(d), d.currency)}
      />
    </>
  );
}

export function PaymentOverview({ d }: { d: PaymentDetail }) {
  return (
    <>
      <DetailSection title="Payment">
        <DetailRow label="Invoice" value={dash(d.invoice_ref ?? d.ref)} emphasize />
        <DetailRow label="Customer" value={dash(d.customer_name)} />
        <DetailRow label="Status" value={dash(d.status_label)} />
      </DetailSection>
      <FinanceTotalsCard
        rows={[
          { label: 'Invoice total', value: fmtFinanceMoney(d.total_amount) },
          { label: 'Paid', value: fmtFinanceMoney(d.paid_amount) },
          { label: 'Due', value: fmtFinanceMoney(d.due_amount) },
        ]}
        totalLabel="Remaining"
        totalValue={fmtFinanceMoney(d.remaining_amount)}
      />
    </>
  );
}

function ledgerStatusLabel(d: { status?: string; ledger_posted?: boolean }): string | null {
  if (String(d.status ?? '') !== '2') {
    return null;
  }
  if (d.ledger_posted) {
    return 'Posted to general ledger';
  }
  return 'Approved — ledger entry pending';
}

export function PaymentVoucherOverview({ d }: { d: PaymentVoucherDetail }) {
  const ledgerLabel = ledgerStatusLabel(d);

  return (
    <>
      <DetailSection title="Voucher">
        <DetailRow label="Voucher no." value={dash(d.ref)} emphasize />
        <DetailRow label="Status" value={dash(d.status_label)} />
        {ledgerLabel ? <DetailRow label="Accounting" value={ledgerLabel} /> : null}
        <DetailRow label="Prepared" value={dash(d.prepared_date)} />
        {d.approved_date ? <DetailRow label="Approved" value={d.approved_date} /> : null}
        {d.voucher_purpose === 'petty_cash' ? <DetailRow label="Type" value="Petty cash" /> : null}
        {d.description?.trim() ? <DetailRow label="Description" value={d.description.trim()} /> : null}
      </DetailSection>
      {d.total_amount != null ? (
        <FinanceTotalsCard rows={[]} totalLabel="Total" totalValue={fmtFinanceMoney(d.total_amount)} />
      ) : null}
    </>
  );
}

export function SupplierInvoiceOverview({ d }: { d: SupplierInvoiceDetail }) {
  return (
    <>
      <DetailSection title="Identification">
        <DetailRow label="Invoice no." value={dash(d.ref)} emphasize />
        <DetailRow label="Supplier" value={dash(d.supplier_name)} />
        {d.supplier_reference?.trim() ? <DetailRow label="Supplier reference" value={d.supplier_reference.trim()} /> : null}
        <DetailRow label="Status" value={dash(d.status_label)} />
      </DetailSection>

      <DetailSection title="Dates & tax">
        <DetailRow label="Invoice date" value={dash(d.invoice_date)} />
        <DetailRow label="Due date" value={dash(d.due_date)} />
        {d.vat_treatment_label ? <DetailRow label="VAT treatment" value={d.vat_treatment_label} /> : null}
      </DetailSection>

      <FinanceTotalsCard
        rows={[
          ...(d.total_net != null ? [{ label: 'Net', value: fmtFinanceMoney(d.total_net) }] : []),
          ...(d.total_vat != null ? [{ label: 'VAT', value: fmtFinanceMoney(d.total_vat) }] : []),
        ]}
        totalLabel="Gross total"
        totalValue={fmtFinanceMoney(d.total_gross)}
      />
    </>
  );
}
