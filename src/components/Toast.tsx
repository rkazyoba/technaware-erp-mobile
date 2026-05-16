import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppTypography';
import { styles } from '../styles/appStyles';

export type ToastType = 'success' | 'error' | 'info';

type ToastProps = {
  visible: boolean;
  message: string;
  type: ToastType;
};

export function Toast({ visible, message, type }: ToastProps) {
  const insets = useSafeAreaInsets();

  if (!visible || !message) {
    return null;
  }

  return (
    <View style={[styles.toastWrap, { top: insets.top + 8 }]} pointerEvents="none">
      <View
        style={[
          styles.toastCard,
          type === 'success' ? styles.toastSuccess : null,
          type === 'error' ? styles.toastError : null,
          type === 'info' ? styles.toastInfo : null,
        ]}
      >
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </View>
  );
}
