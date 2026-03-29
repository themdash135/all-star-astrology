import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.allstarastrology.app',
  appName: 'All Star Astrology',
  webDir: 'dist',
  server: {
    url: process.env.ASTRO_CAP_SERVER_URL || 'https://allstar-astrology-816912350023.us-central1.run.app',
    cleartext: (process.env.ASTRO_CAP_SERVER_URL || '').startsWith('http://'),
  },
};

export default config;
