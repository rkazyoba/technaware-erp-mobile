import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { pinAuthStyles as styles } from '../styles/pinAuthStyles';

type PinKeypadProps = {
  disabled?: boolean;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'back'],
] as const;

export function PinKeypad({ disabled = false, onDigit, onBackspace }: PinKeypadProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  return (
    <View style={styles.keypad}>
      {ROWS.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.keypadRow}>
          {row.map((key) => {
            if (key === '') {
              return <View key={`empty-${rowIndex}`} style={styles.keypadKeySpacer} />;
            }

            const keyId = key === 'back' ? 'back' : key;
            const isPressed = pressedKey === keyId;

            if (key === 'back') {
              return (
                <Pressable
                  key="back"
                  style={[
                    styles.keypadKey,
                    isPressed ? styles.keypadKeyPressed : null,
                    disabled ? styles.keypadKeyDisabled : null,
                  ]}
                  onPressIn={() => setPressedKey('back')}
                  onPressOut={() => setPressedKey(null)}
                  onPress={() => {
                    if (!disabled) {
                      onBackspace();
                    }
                  }}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel="Delete digit"
                >
                  <Text style={styles.keypadBackspace}>⌫</Text>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={key}
                style={[
                  styles.keypadKey,
                  isPressed ? styles.keypadKeyPressed : null,
                  disabled ? styles.keypadKeyDisabled : null,
                ]}
                onPressIn={() => setPressedKey(key)}
                onPressOut={() => setPressedKey(null)}
                onPress={() => {
                  if (!disabled) {
                    onDigit(key);
                  }
                }}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${key}`}
              >
                <Text style={styles.keypadDigit}>{key}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
