import { Text, View } from 'react-native';
import { styles } from '../styles/appStyles';

export type ToastType = 'success' | 'error' | 'info';

type ToastProps = {
  visible: boolean;
  message: string;
  type: ToastType;
};

export function Toast({ visible, message, type }: ToastProps) {
  if (!visible || !message) {
    return null;
  }

  return (
    <View style={styles.toastWrap} pointerEvents="none">
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
