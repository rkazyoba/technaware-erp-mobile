import { View, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';

const VARIANT: Record<string, { bg: string; fg: string }> = {
  Approved: { bg: colors.statusApprovedBg, fg: colors.statusApprovedText },
  Pending: { bg: colors.statusPendingBg, fg: colors.statusPendingText },
  Rejected: { bg: colors.statusRejectedBg, fg: colors.statusRejectedText },
  Draft: { bg: colors.statusDraftBg, fg: colors.statusDraftText },
  Unfinished: { bg: colors.statusDraftBg, fg: colors.statusDraftText },
  'Awaiting approval': { bg: colors.statusPendingBg, fg: colors.statusPendingText },
  Completed: { bg: colors.statusApprovedBg, fg: colors.statusApprovedText },
  default: { bg: colors.statusDraftBg, fg: colors.statusDraftText },
};

type StatusBadgeProps = {
  label: string;
  style?: ViewStyle;
};

export function StatusBadge({ label, style }: StatusBadgeProps) {
  const v = VARIANT[label] ?? VARIANT.default;
  const pill: ViewStyle = {
    backgroundColor: v.bg,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  };
  const text: TextStyle = {
    fontSize: 9,
    fontWeight: '500',
    color: v.fg,
  };
  return (
    <View style={[pill, style]}>
      <Text style={text}>{label}</Text>
    </View>
  );
}
