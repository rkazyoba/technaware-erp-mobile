import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../AppTypography';
import {
  type FinanceReportPreset,
  type PnlAccountActivityReport,
  getFinanceReportPnlAccountActivity,
} from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { styles } from '../../styles/appStyles';

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  visible: boolean;
  token: string | null;
  accountId: string;
  accountLabel: string;
  preset: FinanceReportPreset;
  from?: string;
  to?: string;
  siteId?: string | null;
  onClose: () => void;
  onOpenJournalEntry?: (journalEntryId: string, titleHint?: string) => void;
};

export function PnLAccountActivityModal({
  visible,
  token,
  accountId,
  accountLabel,
  preset,
  from,
  to,
  siteId,
  onClose,
  onOpenJournalEntry,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PnlAccountActivityReport | null>(null);

  const load = useCallback(async () => {
    if (!token || !visible) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getFinanceReportPnlAccountActivity(token, accountId, preset, from, to, siteId);
      setData(res.data);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Could not load journal detail.');
    } finally {
      setLoading(false);
    }
  }, [token, visible, accountId, preset, from, to, siteId]);

  useEffect(() => {
    if (visible) void load();
    else {
      setData(null);
      setError(null);
    }
  }, [visible, load]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }}>
          <Pressable onPress={onClose} style={{ padding: 8, marginRight: 8 }}>
            <Text style={{ ...outfit('medium', 14), color: colors.accentTeal }}>Close</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ ...outfit('medium', 15), color: colors.textPrimary }} numberOfLines={2}>
              {accountLabel}
            </Text>
            {data ? (
              <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 2 }}>
                {data.from} → {data.to}
              </Text>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={colors.accentTeal} />
          </View>
        ) : error ? (
          <View style={[styles.emptyStateCard, { margin: 16 }]}>
            <Text style={styles.emptyStateTitle}>Could not load detail</Text>
            <Text style={styles.emptyStateText}>{error}</Text>
            <Pressable style={styles.detailsButton} onPress={() => void load()}>
              <Text style={styles.detailsButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : data ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
            <View style={{ padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.borderSubtle }}>
              <Text style={{ ...outfit('regular', 12), color: colors.textSecondary }}>P&L amount (period)</Text>
              <Text style={{ ...outfit('medium', 20), color: colors.primaryNavy, marginTop: 4 }}>{fmtMoney(data.summary.period_amount)}</Text>
              <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 6 }}>
                Dr {fmtMoney(data.summary.debit)} · Cr {fmtMoney(data.summary.credit)}
              </Text>
            </View>
            <Text style={{ ...outfit('medium', 13), color: colors.textPrimary, marginTop: 20 }}>
              Journal lines ({data.lines.length}
              {data.truncated ? '+' : ''})
            </Text>
            {data.truncated ? (
              <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 6 }}>
                Showing the most recent 200 lines. Open the web report for the full ledger.
              </Text>
            ) : null}
            {data.lines.map((line) => (
              <Pressable
                key={`${line.journal_entry_id}-${line.amount}-${line.entry_date}-${line.side}`}
                style={[styles.approvalCard, { marginTop: 10 }]}
                onPress={() => onOpenJournalEntry?.(String(line.journal_entry_id), line.reference || undefined)}
                disabled={!onOpenJournalEntry}
              >
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalId} numberOfLines={1}>
                    {line.reference || `JE ${line.journal_entry_id}`}
                  </Text>
                  <Text style={styles.approvalStatus}>{fmtMoney(line.signed_amount)}</Text>
                </View>
                <Text style={styles.approvalOwner} numberOfLines={2}>
                  {line.entry_date} · {line.source_module || 'GL'}
                  {line.site_name ? ` · ${line.site_name}` : ''}
                </Text>
                {line.journal_description || line.line_description ? (
                  <Text style={{ ...styles.meta, marginTop: 4 }} numberOfLines={2}>
                    {line.line_description || line.journal_description}
                  </Text>
                ) : null}
                {onOpenJournalEntry ? (
                  <Text style={{ ...outfit('medium', 11), color: colors.accentTeal, marginTop: 6 }}>View journal entry</Text>
                ) : null}
              </Pressable>
            ))}
            {data.lines.length === 0 ? (
              <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 12 }}>No posted lines in this period.</Text>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}
