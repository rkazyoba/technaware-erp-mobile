import { View } from 'react-native';
import { pinAuthStyles as styles } from '../styles/pinAuthStyles';

type PinDotsProps = {
  length: number;
  maxLength?: number;
};

export function PinDots({ length, maxLength = 4 }: PinDotsProps) {
  return (
    <View style={styles.pinDotsRow}>
      {Array.from({ length: maxLength }).map((_, index) => {
        const filled = index < length;
        const active = index === length && length < maxLength;

        return (
          <View
            key={`pin-dot-${index}`}
            style={[
              styles.pinDot,
              filled ? styles.pinDotFilled : null,
              active ? styles.pinDotActive : null,
            ]}
          >
            {filled ? <View style={styles.pinDotBullet} /> : null}
            {active ? <View style={styles.pinDotCursor} /> : null}
          </View>
        );
      })}
    </View>
  );
}
