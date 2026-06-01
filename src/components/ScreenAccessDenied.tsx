import { View } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';

type Props = {
  message: string;
};

export function ScreenAccessDenied({ message }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ ...outfit('medium', 16), color: colors.textPrimary, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}
