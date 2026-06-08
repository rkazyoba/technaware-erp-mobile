import type { PosReceiptPayload } from '../api';

const RECEIPT_WIDTH = 32;

function padLine(left: string, right: string, width = RECEIPT_WIDTH): string {
  const leftTrim = left.length > width - right.length - 1 ? left.slice(0, width - right.length - 4) + '…' : left;
  const spaces = Math.max(1, width - leftTrim.length - right.length);
  return `${leftTrim}${' '.repeat(spaces)}${right}`;
}

function center(text: string, width = RECEIPT_WIDTH): string {
  if (text.length >= width) return text.slice(0, width);
  const pad = Math.floor((width - text.length) / 2);
  return `${' '.repeat(pad)}${text}`;
}

function divider(char = '-'): string {
  return char.repeat(RECEIPT_WIDTH);
}

export function formatReceiptPlainText(receipt: PosReceiptPayload): string {
  const lines: string[] = [
    center(receipt.company.name),
    center(receipt.order.order_no),
    center(receipt.order.completed_at_display ?? ''),
    '',
  ];

  if (receipt.terminal) {
    lines.push(center(receipt.terminal.name));
  }

  lines.push(divider());

  receipt.lines.forEach((line) => {
    lines.push(line.description.slice(0, RECEIPT_WIDTH));
    lines.push(
      padLine(
        ` ${line.quantity} x ${line.unit_price.toFixed(2)}`,
        line.line_total.toFixed(2),
      ),
    );
  });

  lines.push(divider());
  lines.push(padLine('Subtotal', receipt.order.subtotal.toFixed(2)));
  if (receipt.order.discount_amount > 0) {
    lines.push(padLine('Discount', `-${receipt.order.discount_amount.toFixed(2)}`));
  }
  lines.push(padLine(`VAT ${receipt.vat_rate_percent ?? 18}%`, receipt.order.tax_amount.toFixed(2)));
  lines.push(padLine('TOTAL', `${receipt.order.total_amount.toFixed(2)} ${receipt.order.currency}`));

  receipt.payments.forEach((p) => {
    lines.push(padLine(p.method_label, p.amount.toFixed(2)));
  });

  if (receipt.fiscal?.status === 'signed') {
    lines.push(divider('='));
    lines.push(center(receipt.fiscal.tra_mode_label ?? 'FISCAL RECEIPT (TRA)'));
    if (receipt.fiscal.receipt_number) {
      lines.push(padLine('Receipt', receipt.fiscal.receipt_number));
    }
    if (receipt.fiscal.verification_code) {
      lines.push(padLine('Verify', receipt.fiscal.verification_code));
    }
    if (receipt.fiscal.seller_tin) {
      lines.push(padLine('TIN', receipt.fiscal.seller_tin));
    }
    if (receipt.fiscal.qr_payload) {
      lines.push('');
      lines.push(center(receipt.fiscal.qr_payload.slice(0, RECEIPT_WIDTH)));
    }
  }

  lines.push('', center('Thank you'));
  return lines.join('\n');
}

export function buildReceiptPrintHtml(receipt: PosReceiptPayload): string {
  const plain = formatReceiptPlainText(receipt)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 2mm; size: 80mm auto; }
  body {
    width: 72mm;
    margin: 0 auto;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.35;
    color: #000;
  }
  pre { white-space: pre-wrap; word-break: break-word; margin: 0; }
</style>
</head>
<body><pre>${plain}</pre></body>
</html>`;
}
