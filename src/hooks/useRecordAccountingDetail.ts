import { useCallback, useEffect, useState } from 'react';
import {
  getAccountingAccountDetail,
  getAccountingBankStatementDetail,
  getAccountingCashFlowMapDetail,
  getAccountingCurrencyDetail,
  getAccountingDepreciationRunDetail,
  getAccountingExchangeRateWeekDetail,
  getAccountingFixedAssetDetail,
  getAccountingJournalEntryDetail,
  getAccountingPeriodDetail,
  getAccountingSupplierWhtTypeDetail,
  type AccountingAccountDetail,
  type AccountingBankStatementDetail,
  type AccountingCashFlowMapDetail,
  type AccountingCurrencyDetail,
  type AccountingDepreciationRunDetail,
  type AccountingExchangeRateWeekDetail,
  type AccountingFixedAssetDetail,
  type AccountingJournalEntryDetail,
  type AccountingPeriodDetail,
  type AccountingSupplierWhtTypeDetail,
} from '../api';
import type { RecordDetailParams } from '../navigation/moduleStackTypes';
import type { AccountingRecordDetailKind } from '../utils/accountingPortal';

function isAccountingDetailKind(kind: RecordDetailParams['detailKind']): kind is AccountingRecordDetailKind {
  return (
    kind === 'accounting_currency' ||
    kind === 'accounting_exchange_rate_week' ||
    kind === 'accounting_supplier_wht_type' ||
    kind === 'accounting_period' ||
    kind === 'accounting_account' ||
    kind === 'accounting_journal_entry' ||
    kind === 'accounting_fixed_asset' ||
    kind === 'accounting_depreciation_run' ||
    kind === 'accounting_bank_statement' ||
    kind === 'accounting_cash_flow_map'
  );
}

export function useRecordAccountingDetail(
  detailKind: RecordDetailParams['detailKind'],
  recordId: string,
  token: string,
) {
  const [currency, setCurrency] = useState<AccountingCurrencyDetail | null>(null);
  const [exchangeWeek, setExchangeWeek] = useState<AccountingExchangeRateWeekDetail | null>(null);
  const [whtType, setWhtType] = useState<AccountingSupplierWhtTypeDetail | null>(null);
  const [period, setPeriod] = useState<AccountingPeriodDetail | null>(null);
  const [account, setAccount] = useState<AccountingAccountDetail | null>(null);
  const [journal, setJournal] = useState<AccountingJournalEntryDetail | null>(null);
  const [fixedAsset, setFixedAsset] = useState<AccountingFixedAssetDetail | null>(null);
  const [depreciationRun, setDepreciationRun] = useState<AccountingDepreciationRunDetail | null>(null);
  const [bankStatement, setBankStatement] = useState<AccountingBankStatementDetail | null>(null);
  const [cashFlowMap, setCashFlowMap] = useState<AccountingCashFlowMapDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearAll = useCallback(() => {
    setCurrency(null);
    setExchangeWeek(null);
    setWhtType(null);
    setPeriod(null);
    setAccount(null);
    setJournal(null);
    setFixedAsset(null);
    setDepreciationRun(null);
    setBankStatement(null);
    setCashFlowMap(null);
  }, []);

  const load = useCallback(async () => {
    if (!isAccountingDetailKind(detailKind) || !recordId || !token) {
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
        case 'accounting_currency':
          setCurrency((await getAccountingCurrencyDetail(token, recordId)).data);
          break;
        case 'accounting_exchange_rate_week':
          setExchangeWeek((await getAccountingExchangeRateWeekDetail(token, recordId)).data);
          break;
        case 'accounting_supplier_wht_type':
          setWhtType((await getAccountingSupplierWhtTypeDetail(token, recordId)).data);
          break;
        case 'accounting_period':
          setPeriod((await getAccountingPeriodDetail(token, recordId)).data);
          break;
        case 'accounting_account':
          setAccount((await getAccountingAccountDetail(token, recordId)).data);
          break;
        case 'accounting_journal_entry':
          setJournal((await getAccountingJournalEntryDetail(token, recordId)).data);
          break;
        case 'accounting_fixed_asset':
          setFixedAsset((await getAccountingFixedAssetDetail(token, recordId)).data);
          break;
        case 'accounting_depreciation_run':
          setDepreciationRun((await getAccountingDepreciationRunDetail(token, recordId)).data);
          break;
        case 'accounting_bank_statement':
          setBankStatement((await getAccountingBankStatementDetail(token, recordId)).data);
          break;
        case 'accounting_cash_flow_map':
          setCashFlowMap((await getAccountingCashFlowMapDetail(token)).data);
          break;
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

  const loaded =
    (detailKind === 'accounting_currency' && currency != null) ||
    (detailKind === 'accounting_exchange_rate_week' && exchangeWeek != null) ||
    (detailKind === 'accounting_supplier_wht_type' && whtType != null) ||
    (detailKind === 'accounting_period' && period != null) ||
    (detailKind === 'accounting_account' && account != null) ||
    (detailKind === 'accounting_journal_entry' && journal != null) ||
    (detailKind === 'accounting_fixed_asset' && fixedAsset != null) ||
    (detailKind === 'accounting_depreciation_run' && depreciationRun != null) ||
    (detailKind === 'accounting_bank_statement' && bankStatement != null) ||
    (detailKind === 'accounting_cash_flow_map' && cashFlowMap != null);

  return {
    isAccountingDetail: isAccountingDetailKind(detailKind),
    currency,
    exchangeWeek,
    whtType,
    period,
    account,
    journal,
    fixedAsset,
    depreciationRun,
    bankStatement,
    cashFlowMap,
    loading,
    error,
    loaded,
    reload: load,
  };
}
