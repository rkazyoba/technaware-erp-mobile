import { View } from 'react-native';
import { Text } from './AppTypography';
import type { MobileSummaryRevenueMonth } from '../api';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';

type Props = {
  months: MobileSummaryRevenueMonth[];
};

const BAR_AREA = 104;

export function HomeRevenueChart({ months }: Props) {
  const max = Math.max(...months.map((m) => m.amount), 1);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_AREA + 22, gap: 6 }}>
      {months.map((m) => {
        const ratio = m.amount / max;
        const h = Math.round(ratio * BAR_AREA);
        const barH = m.amount <= 0 ? 3 : Math.max(h, 6);

        return (
          <View key={m.label} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: '100%', height: BAR_AREA, justifyContent: 'flex-end', alignItems: 'center' }}>
              <View
                style={{
                  width: '72%',
                  maxWidth: 32,
                  height: barH,
                  backgroundColor: colors.accentTeal,
                  borderRadius: 6,
                  opacity: m.amount <= 0 ? 0.35 : 1,
                }}
              />
            </View>
            <Text
              numberOfLines={1}
              style={{ ...outfit('regular', 10), color: colors.textMuted, marginTop: 6, textAlign: 'center' }}
            >
              {m.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
