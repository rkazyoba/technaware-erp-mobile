import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveApiBaseUrl } from './apiBaseUrl';

export const APP_INFO = {
  name: Constants.expoConfig?.name ?? 'Technaware ERP',
  version: Constants.expoConfig?.version ?? '—',
  build:
    Constants.nativeBuildVersion ??
    (Platform.OS === 'android'
      ? String(Constants.expoConfig?.android?.versionCode ?? '—')
      : Constants.expoConfig?.ios?.buildNumber ?? '—'),
  company: 'Technaware Solutions',
  website: 'https://technawaresolutions.co.tz',
  supportEmail: 'info@technawaresolutions.co.tz',
  apiBaseUrl: __DEV__ ? resolveApiBaseUrl() : undefined,
} as const;
