import { View } from 'react-native';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';

type StaffFinanceReadOnlyFieldProps = {
  label: string;
  value: string;
};

export function StaffFinanceReadOnlyField({ label, value }: StaffFinanceReadOnlyFieldProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ ...outfit('medium', 11), color: colors.textMuted, marginBottom: 2 }}>{label}</Text>
      <Text style={{ ...outfit('regular', 14), color: colors.textPrimary }}>{value || '—'}</Text>
    </View>
  );
}
