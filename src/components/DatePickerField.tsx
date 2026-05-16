import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';

/** Calendar date in local timezone → `YYYY-MM-DD` for ERP APIs. */
export function isoDateFromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse API `YYYY-MM-DD` as a local calendar date (noon to reduce TZ drift). */
export function parseIsoDateToLocal(iso: string): Date {
  const raw = iso.trim();
  const parts = raw.split('-').map((s) => Number.parseInt(s, 10));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
}

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Vertical offset above this field (matches prior form spacing). */
  marginTop?: number;
};

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  marginTop = 14,
}: DatePickerFieldProps) {
  const parsed = useMemo(() => parseIsoDateToLocal(value), [value]);
  const display =
    value.trim() !== ''
      ? parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Tap to choose';

  const [androidOpen, setAndroidOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState(parsed);

  const rowStyle = {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  };

  const applyPickerDate = (d: Date | undefined) => {
    if (!d) {
      return;
    }
    onChange(isoDateFromLocalDate(d));
  };

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginTop }}>
        <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            ...outfit('regular', 14),
            color: colors.textPrimary,
          }}
        />
      </View>
    );
  }

  const openPicker = () => {
    if (Platform.OS === 'android') {
      setAndroidOpen(true);
      return;
    }
    setIosDraft(parsed);
    setIosOpen(true);
  };

  return (
    <View style={{ marginTop }}>
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <Pressable onPress={openPicker} style={rowStyle}>
        <Text style={{ ...outfit('regular', 14), color: value.trim() ? colors.textPrimary : colors.textMuted }}>{display}</Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
      </Pressable>

      {Platform.OS === 'android' && androidOpen ? (
        <DateTimePicker
          value={parsed}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, date) => {
            setAndroidOpen(false);
            if (event.type === 'set') {
              applyPickerDate(date);
            }
          }}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setIosOpen(false)}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 28 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                <Pressable onPress={() => setIosOpen(false)} hitSlop={8}>
                  <Text style={{ ...outfit('medium', 16), color: colors.linkBlue }}>Cancel</Text>
                </Pressable>
                <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{label}</Text>
                <Pressable
                  onPress={() => {
                    applyPickerDate(iosDraft);
                    setIosOpen(false);
                  }}
                  hitSlop={8}
                >
                  <Text style={{ ...outfit('medium', 16), color: colors.linkBlue }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(_, date) => {
                  if (date) {
                    setIosDraft(date);
                  }
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
