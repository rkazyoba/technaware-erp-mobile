import { Linking, Pressable, View } from 'react-native';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { webErpUrl } from '../utils/webErpUrls';

type Props = {
  title: string;
  description?: string | null;
  webPath: string;
};

export function WebPortalSurfacePanel({ title, description, webPath }: Props) {
  const url = webErpUrl(webPath);

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <View
        style={{
          borderRadius: 12,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: 16,
        }}
      >
        <Text style={{ ...outfit('medium', 11), color: colors.textMuted, letterSpacing: 0.9 }}>WEB ERP</Text>
        <Text style={{ ...outfit('medium', 18), color: colors.primaryNavy, marginTop: 8 }}>{title}</Text>
        {description?.trim() ? (
          <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, marginTop: 8 }}>{description.trim()}</Text>
        ) : null}
        <Pressable
          onPress={() => void Linking.openURL(url)}
          style={{ marginTop: 18, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primaryNavy, alignItems: 'center' }}
        >
          <Text style={{ ...outfit('medium', 14), color: '#fff' }}>Open in web ERP</Text>
        </Pressable>
        <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 12 }}>
          Full accounting tables, filters, and PDF exports open in your browser. Sign in again if prompted.
        </Text>
      </View>
    </View>
  );
}
