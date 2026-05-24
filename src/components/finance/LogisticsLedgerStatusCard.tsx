import { View } from 'react-native';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';

type Props = {
  /** Document workflow status code (e.g. approved = `2`). */
  status: string;
  ledgerPosted?: boolean;
  /** Shown when approved but no journal exists. */
  pendingMessage?: string;
  /** Shown when posted successfully. */
  postedMessage?: string;
};

export function LogisticsLedgerStatusCard({
  status,
  ledgerPosted,
  pendingMessage = 'Approved — ledger entry not found. Check chart of accounts and open accounting period.',
  postedMessage = 'Posted to ledger (inventory and accounts payable)',
}: Props) {
  if (status !== '2') {
    return null;
  }

  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <Text style={{ ...outfit('medium', 13), color: colors.textMuted, marginBottom: 6 }}>General ledger</Text>
      <Text style={{ ...outfit('medium', 14), color: ledgerPosted ? colors.accentTeal : colors.trendDown }}>
        {ledgerPosted ? postedMessage : pendingMessage}
      </Text>
    </View>
  );
}
