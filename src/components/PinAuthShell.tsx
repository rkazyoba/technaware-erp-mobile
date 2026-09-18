import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pinAuthStyles as styles } from '../styles/pinAuthStyles';
import { PinKeypad } from './PinKeypad';

type PinAuthShellProps = {
  header: ReactNode;
  keypadDisabled?: boolean;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  footer?: string;
};

export function PinAuthShell({
  header,
  keypadDisabled = false,
  onDigit,
  onBackspace,
  footer = 'Powered by Technaware Solutions',
}: PinAuthShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.headerScroll}
        contentContainerStyle={styles.headerScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {header}
      </ScrollView>

      <View style={[styles.keypadSection, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PinKeypad disabled={keypadDisabled} onDigit={onDigit} onBackspace={onBackspace} />
        <Text style={styles.footerText}>{footer}</Text>
      </View>
    </View>
  );
}
