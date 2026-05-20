import { View } from 'react-native';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { formatChartValue } from '../../utils/formatChartValue';

export type SimpleBarPoint = { label: string; amount: number };

export type ChartLegendItem = { label: string; color: string };

type Props = {
  points: SimpleBarPoint[];
  barColor?: string;
  /** Show numeric value above each bar (default true). */
  showValues?: boolean;
  valueMode?: 'number' | 'money';
  legend?: ChartLegendItem[];
};

const BAR_AREA = 104;

export function SimpleBarChart({
  points,
  barColor = colors.accentTeal,
  showValues = true,
  valueMode = 'number',
  legend,
}: Props) {
  if (points.length === 0) {
    return <Text style={{ ...outfit('regular', 13), color: colors.textMuted }}>No data for this range.</Text>;
  }

  const max = Math.max(...points.map((p) => Math.abs(p.amount)), 1);

  return (
    <View>
      {legend && legend.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          {legend.map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
              <Text style={{ ...outfit('regular', 11), color: colors.textSecondary }}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_AREA + (showValues ? 34 : 22), gap: 6 }}>
        {points.map((m) => {
          const ratio = Math.abs(m.amount) / max;
          const h = Math.round(ratio * BAR_AREA);
          const barH = Math.abs(m.amount) <= 0 ? 3 : Math.max(h, 6);
          const valueLabel = formatChartValue(m.amount, valueMode);

          return (
            <View key={m.label} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: '100%', height: BAR_AREA + (showValues ? 18 : 0), justifyContent: 'flex-end', alignItems: 'center' }}>
                {showValues ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      ...outfit('medium', 9),
                      color: colors.textSecondary,
                      marginBottom: 4,
                      textAlign: 'center',
                      maxWidth: '100%',
                    }}
                  >
                    {valueLabel}
                  </Text>
                ) : null}
                <View
                  style={{
                    width: '72%',
                    maxWidth: 36,
                    height: barH,
                    backgroundColor: barColor,
                    borderRadius: 6,
                    opacity: Math.abs(m.amount) <= 0 ? 0.35 : 1,
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
    </View>
  );
}
