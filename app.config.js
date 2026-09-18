const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const base = appJson.expo ?? config;
  const isDev = process.env.NODE_ENV !== 'production';
  const envApiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
  const fallbackDevApiBaseUrl = (base.extra?.apiBaseUrl ?? '').trim().replace(/\/+$/, '');

  return {
    ...base,
    extra: {
      ...base.extra,
      // Required for EAS Build / Updates — never strip when adjusting apiBaseUrl.
      ...(base.extra?.eas ? { eas: base.extra.eas } : {}),
      // Prefer .env so the device bundle always sees the configured LAN/production API URL.
      apiBaseUrl: envApiBaseUrl || (isDev ? fallbackDevApiBaseUrl : undefined) || undefined,
    },
  };
};
