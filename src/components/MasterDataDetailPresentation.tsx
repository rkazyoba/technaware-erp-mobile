import { View } from 'react-native';
import { Text } from './AppTypography';
import { StaffFinanceReadOnlyField } from './finance/StaffFinanceReadOnlyField';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';

export type MasterDetailField = {
  label: string;
  value?: string | number | null;
};

export type MasterDetailSection = {
  title: string;
  fields: MasterDetailField[];
};

function displayValue(value: string | number | null | undefined): string {
  if (value == null) return '—';
  const s = String(value).trim();
  return s === '' ? '—' : s;
}

type Props = {
  sections: MasterDetailSection[];
};

/** Shared read-only field sections for master / CRM / HR catalog records. */
export function MasterDataDetailPresentation({ sections }: Props) {
  const visible = sections.filter((s) => s.fields.length > 0);
  if (visible.length === 0) {
    return (
      <Text style={{ ...outfit('regular', 13), color: colors.textMuted, marginTop: 8 }}>No details available.</Text>
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      {visible.map((section) => (
        <View key={section.title} style={{ marginBottom: 16 }}>
          <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, marginBottom: 8 }}>{section.title}</Text>
          {section.fields.map((field) => (
            <StaffFinanceReadOnlyField key={`${section.title}-${field.label}`} label={field.label} value={displayValue(field.value)} />
          ))}
        </View>
      ))}
    </View>
  );
}
