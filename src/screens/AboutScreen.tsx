import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../components/AppTypography';
import { APP_INFO } from '../config/appInfo';
import { resolveApiBaseUrl } from '../config/apiBaseUrl';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      <Text style={{ ...outfit('medium', 12), color: colors.textMuted, width: 118 }}>{label}</Text>
      <Text style={{ flex: 1, ...outfit('regular', 13), color: colors.textPrimary }}>{value || '—'}</Text>
    </View>
  );
}

export function AboutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const logoUrl = resolveApiBaseUrl().replace(/\/api\/v1\/?$/, '') + '/backend/assets/img/logo.png';
  const year = new Date().getFullYear();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View
        style={{
          backgroundColor: colors.primaryNavy,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, marginLeft: 10, ...outfit('medium', 16), color: '#fff' }}>About</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <Image
            source={{ uri: logoUrl }}
            style={{ width: 72, height: 72, borderRadius: 14 }}
            resizeMode="contain"
            accessibilityLabel="Technaware logo"
          />
          <Text style={{ ...outfit('medium', 18), color: colors.textPrimary, marginTop: 12 }}>{APP_INFO.name}</Text>
          <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
            Staff portal for Technaware ERP
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            marginBottom: 16,
          }}
        >
          <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, paddingTop: 14, paddingBottom: 4 }}>
            Application
          </Text>
          <DetailRow label="Version" value={APP_INFO.version} />
          <DetailRow label="Build" value={APP_INFO.build} />
          {APP_INFO.apiBaseUrl ? <DetailRow label="API" value={APP_INFO.apiBaseUrl} /> : null}
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            borderWidth: 0.5,
            borderColor: colors.borderSubtle,
            marginBottom: 16,
          }}
        >
          <Text style={{ ...outfit('medium', 14), color: colors.textPrimary, paddingTop: 14, paddingBottom: 4 }}>
            Company
          </Text>
          <DetailRow label="Name" value={APP_INFO.company} />
          <Pressable
            onPress={() => void Linking.openURL(APP_INFO.website)}
            style={{ flexDirection: 'row', paddingVertical: 10, alignItems: 'center', gap: 6 }}
          >
            <Ionicons name="globe-outline" size={16} color={colors.linkBlue} />
            <Text style={{ ...outfit('medium', 13), color: colors.linkBlue }}>{APP_INFO.website}</Text>
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL(`mailto:${APP_INFO.supportEmail}`)}
            style={{ flexDirection: 'row', paddingVertical: 10, alignItems: 'center', gap: 6 }}
          >
            <Ionicons name="mail-outline" size={16} color={colors.linkBlue} />
            <Text style={{ ...outfit('medium', 13), color: colors.linkBlue }}>{APP_INFO.supportEmail}</Text>
          </Pressable>
        </View>

        <Text style={{ ...outfit('regular', 12), color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
          Powered by {APP_INFO.company}.{'\n'}© {year} {APP_INFO.company}. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}
