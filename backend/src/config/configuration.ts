export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  social: {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    facebookAppId: process.env.FACEBOOK_APP_ID,
    facebookAppSecret: process.env.FACEBOOK_APP_SECRET,
    appleClientId: process.env.APPLE_CLIENT_ID,
  },
  gemini: {
    // Optional: without it, MarketService disables the feature instead of
    // failing to boot (it's a nice-to-have, not core to the app).
    apiKey: process.env.GEMINI_API_KEY,
  },
});
