import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.allstarastrology.app',
  appName: 'All Star Astrology',
  webDir: 'dist',
  server: {
    // For dev: point to the local backend so /api/* routes reach FastAPI.
    // Remove this url for production builds (API calls will fall back to Supabase).
    url: 'http://localhost:8892',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
