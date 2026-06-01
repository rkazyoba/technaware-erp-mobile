const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const base = appJson.expo ?? config;
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    ...base,
    extra: {
      ...base.extra,
      // Required for EAS Build / Updates — never strip when adjusting apiBaseUrl.
      ...(base.extra?.eas ? { eas: base.extra.eas } : {}),
      // Do not ship a default HTTP API URL in production builds.
      apiBaseUrl: isDev ? base.extra?.apiBaseUrl : undefined,
    },
  };
};
