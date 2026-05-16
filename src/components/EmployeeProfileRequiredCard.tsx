import { View } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { EMPLOYEE_PROFILE_REQUIRED_MESSAGE } from '../utils/employeeProfile';

type EmployeeProfileRequiredCardProps = {
  title?: string;
};

export function EmployeeProfileRequiredCard({ title = 'HR self-service unavailable' }: EmployeeProfileRequiredCardProps) {
  return (
    <View
      style={{
        marginTop: 12,
        padding: 16,
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text style={{ ...outfit('medium', 15), color: colors.textPrimary }}>{title}</Text>
      <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 10, lineHeight: 20 }}>
        {EMPLOYEE_PROFILE_REQUIRED_MESSAGE}
      </Text>
      <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 10, lineHeight: 18 }}>
        Until this is set up, leave, attendance, and payslips cannot load. Other modules (approvals, inventory, etc.) are unaffected.
      </Text>
    </View>
  );
}
