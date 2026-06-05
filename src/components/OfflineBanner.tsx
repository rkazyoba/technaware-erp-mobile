import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useNetworkStatus } from '../context/NetworkStatusContext';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: colors.statusPendingBg,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      <Ionicons name="cloud-offline-outline" size={16} color={colors.statusPendingText} />
      <Text style={{ flex: 1, ...outfit('medium', 12), color: colors.statusPendingText }}>
        Offline — showing saved data where available. Connect to sync or save changes.
      </Text>
    </View>
  );
}
