import { Text, View } from 'react-native';
import { pinAuthStyles as styles } from '../styles/pinAuthStyles';

export function PinSecurityIcon() {
  return (
    <View style={styles.securityIconOuter}>
      <View style={styles.securityPhone}>
        <View style={styles.securityPhoneScreen} />
        <View style={styles.securityPhoneButton} />
      </View>
      <View style={styles.securityLockBadge}>
        <Text style={styles.securityLockGlyph}>🔒</Text>
      </View>
    </View>
  );
}
