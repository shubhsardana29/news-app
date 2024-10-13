export const config = {
    jwtSecret: process.env.JWT_SECRET!,
    newsApiKey: process.env.NEWS_API_KEY!,
  newsApiUrl: process.env.NEWS_API_URL!,
  googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
  googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    port: process.env.PORT || 3000,
  };