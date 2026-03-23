import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.allstarastrology.app',
  appName: 'All Star Astrology',
  webDir: 'dist',
  server: {
    // No local server needed — API calls go directly to Supabase Edge Functions.
    // Allow cleartext for development flexibility.
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
