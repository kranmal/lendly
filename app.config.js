module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.GH_PAGES_BASE_URL ?? config.experiments?.baseUrl ?? '',
  },
});
