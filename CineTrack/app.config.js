module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    tmdbApiKey:
      process.env.EXPO_PUBLIC_TMDB_API_KEY ??
      config.extra?.tmdbApiKey ??
      '',
  },
});
