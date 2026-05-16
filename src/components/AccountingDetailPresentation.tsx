import { View } from 'react-native';
import { Text } from './AppTypography';
import type {
  AccountingAccountDetail,
  AccountingBankStatementDetail,
  AccountingBankStatementLine,
  AccountingCashFlowMapDetail,
  AccountingCashFlowSection,
  AccountingCurrencyDetail,
  AccountingDepreciationLine,
  AccountingDepreciationRunDetail,
  AccountingExchangeRateWeekDetail,
  AccountingFixedAssetDetail,
  AccountingJournalEntryDetail,
  AccountingJournalLine,
  AccountingPeriodDetail,
  AccountingSupplierWhtTypeDetail,
} from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { DetailRow, DetailSection, fmtFinanceMoney } from './finance/FinanceDetailPresentation';

function dash(v: string | null | undefined): string {
  const s = String(v ?? '').trim();
  return s !== '' ? s : '—';
}

export function CurrencyOverview({ d }: { d: AccountingCurrencyDetail }) {
  return (
    <DetailSection title="Currency">
      <DetailRow label="Code" value={dash(d.code)} emphasize />
      <DetailRow label="Name" value={dash(d.name)} />
      <DetailRow label="Symbol" value={dash(d.symbol)} />
      <DetailRow label="Decimals" value={d.decimals != null ? String(d.decimals) : '—'} />
      <DetailRow label="Functional" value={d.is_functional ? 'Yes' : 'No'} />
      <DetailRow label="Active" value={d.is_active ? 'Yes' : 'No'} />
    </DetailSection>
  );
}

export function ExchangeRateWeekOverview({ d }: { d: AccountingExchangeRateWeekDetail }) {
  return (
    <DetailSection title="Exchange rate week">
      <DetailRow label="Week start" value={dash(d.week_start)} emphasize />
      <DetailRow label="USD → TZS" value={dash(d.usd_to_tzs)} />
      <DetailRow label="EUR → TZS" value={dash(d.eur_to_tzs)} />
      <DetailRow label="Source" value={dash(d.source)} />
    </DetailSection>
  );
}

export function SupplierWhtTypeOverview({ d }: { d: AccountingSupplierWhtTypeDetail }) {
  return (
    <DetailSection title="Supplier WHT">
      <DetailRow label="Name" value={dash(d.name)} emphasize />
      <DetailRow label="Rate %" value={d.rate_percent != null ? String(d.rate_percent) : '—'} />
      <DetailRow label="Active" value={d.is_active ? 'Yes' : 'No'} />
      {d.description?.trim() ? <DetailRow label="Description" value={d.description.trim()} /> : null}
    </DetailSection>
  );
}

export function AccountingPeriodOverview({ d }: { d: AccountingPeriodDetail }) {
  const ym = `${d.year}-${String(d.month).padStart(2, '0')}`;
  return (
    <DetailSection title="Fiscal period">
      <DetailRow label="Period" value={ym} emphasize />
      <DetailRow label="Status" value={dash(d.status)} />
      {d.closed_at ? <DetailRow label="Closed at" value={d.closed_at} /> : null}
    </DetailSection>
  );
}

export function CoaAccountOverview({ d }: { d: AccountingAccountDetail }) {
  return (
    <DetailSection title="GL account">
      <DetailRow label="Code" value={dash(d.code)} emphasize />
      <DetailRow label="Name" value={dash(d.name)} />
      <DetailRow label="Type" value={dash(d.account_type)} />
      <DetailRow label="Category" value={dash(d.category)} />
      <DetailRow label="Manual posting" value={d.allow_manual_posting ? 'Allowed' : 'Not allowed'} />
      <DetailRow label="Active" value={d.is_active ? 'Yes' : 'No'} />
    </DetailSection>
  );
}

function JournalLineCard({ line }: { line: AccountingJournalLine }) {
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
      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
        {line.account_code} · {line.account_name || '—'}
      </Text>
      <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 6 }}>
        {line.side.toUpperCase()} · {fmtFinanceMoney(line.amount)}
      </Text>
      {line.description?.trim() ? (
        <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 6 }}>{line.description}</Text>
      ) : null}
    </View>
  );
}

export function JournalEntryOverview({ d }: { d: AccountingJournalEntryDetail }) {
  return (
    <DetailSection title="Journal entry">
      <DetailRow label="Reference" value={dash(d.reference)} emphasize />
      <DetailRow label="Date" value={dash(d.entry_date)} />
      <DetailRow label="Status" value={dash(d.status)} />
      <DetailRow label="Source" value={dash(d.source_module)} />
      {d.posted_at ? <DetailRow label="Posted" value={d.posted_at} /> : null}
      {d.description?.trim() ? <DetailRow label="Description" value={d.description.trim()} /> : null}
    </DetailSection>
  );
}

export function JournalLinesList({ lines }: { lines: AccountingJournalLine[] }) {
  if (lines.length === 0) {
    return <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 10 }}>No lines.</Text>;
  }
  return (
    <>
      {lines.map((line) => (
        <JournalLineCard key={line.id} line={line} />
      ))}
    </>
  );
}

export function FixedAssetOverview({ d }: { d: AccountingFixedAssetDetail }) {
  return (
    <>
      <DetailSection title="Asset">
        <DetailRow label="Code" value={dash(d.asset_code)} emphasize />
        <DetailRow label="Name" value={dash(d.name)} />
        <DetailRow label="Status" value={dash(d.status)} />
        <DetailRow label="Category" value={dash(d.category)} />
        <DetailRow label="Acquisition" value={dash(d.acquisition_date)} />
        <DetailRow label="In service" value={dash(d.in_service_date)} />
        <DetailRow label="Cost" value={fmtFinanceMoney(d.cost)} />
        <DetailRow label="Residual" value={fmtFinanceMoney(d.residual_value)} />
        <DetailRow label="Useful life (mo)" value={d.useful_life_months != null ? String(d.useful_life_months) : '—'} />
        <DetailRow label="Method" value={dash(d.depreciation_method)} />
      </DetailSection>
      <DetailSection title="GL links">
        <DetailRow label="Asset" value={dash(d.asset_account)} />
        <DetailRow label="Accum. depreciation" value={dash(d.accum_dep_account)} />
        <DetailRow label="Depr. expense" value={dash(d.dep_expense_account)} />
      </DetailSection>
      {d.notes?.trim() ? (
        <DetailSection title="Notes">
          <DetailRow label="Notes" value={d.notes.trim()} />
        </DetailSection>
      ) : null}
    </>
  );
}

function DepLineCard({ line }: { line: AccountingDepreciationLine }) {
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
      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
        {line.asset_code} · {line.asset_name}
      </Text>
      <Text style={{ ...outfit('regular', 12), color: colors.textPrimary, marginTop: 6 }}>{fmtFinanceMoney(line.amount)}</Text>
    </View>
  );
}

export function DepreciationRunOverview({ d }: { d: AccountingDepreciationRunDetail }) {
  return (
    <DetailSection title="Depreciation run">
      <DetailRow label="Run date" value={dash(d.run_date)} emphasize />
      <DetailRow label="Period" value={dash(d.period_label)} />
      <DetailRow label="Status" value={dash(d.status)} />
      {d.journal_entry_id ? <DetailRow label="Journal entry id" value={d.journal_entry_id} /> : null}
    </DetailSection>
  );
}

export function DepreciationLinesList({ lines }: { lines: AccountingDepreciationLine[] }) {
  if (lines.length === 0) {
    return <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 10 }}>No lines.</Text>;
  }
  return <>{lines.map((line) => <DepLineCard key={line.id} line={line} />)}</>;
}

function BankLineCard({ line }: { line: AccountingBankStatementLine }) {
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
      <Text style={{ ...outfit('medium', 13), color: colors.textPrimary }}>
        {line.transaction_date ?? '—'} · {fmtFinanceMoney(line.amount)}
      </Text>
      <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 4 }}>{line.description || '—'}</Text>
      <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>
        {line.is_reconciled ? 'Reconciled' : 'Open'}
        {line.reference ? ` · ${line.reference}` : ''}
      </Text>
    </View>
  );
}

export function BankStatementOverview({ d }: { d: AccountingBankStatementDetail }) {
  return (
    <DetailSection title="Bank statement">
      <DetailRow label="Bank" value={dash(d.bank_name)} emphasize />
      <DetailRow label="Period" value={`${dash(d.statement_date_from)} → ${dash(d.statement_date_to)}`} />
      <DetailRow label="Opening" value={fmtFinanceMoney(d.opening_balance)} />
      <DetailRow label="Closing" value={fmtFinanceMoney(d.closing_balance)} />
      <DetailRow label="Source" value={dash(d.source)} />
    </DetailSection>
  );
}

export function BankStatementLinesList({ lines }: { lines: AccountingBankStatementLine[] }) {
  if (lines.length === 0) {
    return <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 10 }}>No statement lines.</Text>;
  }
  return <>{lines.map((line) => <BankLineCard key={line.id} line={line} />)}</>;
}

export function CashFlowMapOverview({ d }: { d: AccountingCashFlowMapDetail }) {
  return (
    <>
      {d.sections.map((sec: AccountingCashFlowSection) => (
        <DetailSection key={sec.key} title={sec.label}>
          <DetailRow label="Account codes" value={sec.codes_preview.trim() !== '' ? sec.codes_preview : '—'} />
        </DetailSection>
      ))}
    </>
  );
}
