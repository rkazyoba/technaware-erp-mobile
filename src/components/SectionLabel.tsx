import { View, type ViewStyle } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';

type SectionLabelProps = {
  children: string;
  style?: ViewStyle;
};

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <View style={[{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }, style]}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '500',
          color: colors.textMuted,
          letterSpacing: 0.06 * 11,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Text>
    </View>
  );
}
