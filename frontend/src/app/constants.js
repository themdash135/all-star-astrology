export const FORM_KEY = 'allstar-form';
export const RESULT_KEY = 'allstar-result';
export const SPLASH_KEY = 'allstar-splash';
export const THEME_KEY = 'allstar-theme';
export const MOTION_KEY = 'allstar-motion';
export const ORACLE_HISTORY_KEY = 'allstar-oracle-history';
export const ORACLE_HISTORY_LIMIT = 12;

export const BLANK = {
  birth_date: '',
  birth_time: '',
  birth_location: '',
  full_name: '',
  hebrew_name: '',
};

export const SYSTEMS = [
  { id: 'western', name: 'Western', icon: '\u2648', desc: 'Tropical zodiac', color: '#6B8CFF', hasChart: true },
  { id: 'vedic', name: 'Vedic', icon: '\ud83e\udea7', desc: 'Sidereal chart', color: '#FF9B5E', hasChart: true },
  { id: 'chinese', name: 'Chinese', icon: '\ud83d\udc09', desc: 'Lunar zodiac', color: '#FF6B6B', hasChart: false },
  { id: 'bazi', name: 'BaZi', icon: '\u67f1', desc: 'Four Pillars', color: '#5ECC8F', hasChart: true },
  { id: 'numerology', name: 'Numerology', icon: '\ud83d\udd22', desc: 'Life path numbers', color: '#B47EFF', hasChart: false },
  { id: 'kabbalistic', name: 'Kabbalistic', icon: '\u2721', desc: 'Tree of Life', color: '#FFD76B', hasChart: true },
  { id: 'gematria', name: 'Gematria', icon: '\u05d0', desc: 'Sacred letters', color: '#7BE0E0', hasChart: false },
  { id: 'persian', name: 'Persian', icon: '\u263d', desc: 'Islamic astrology', color: '#E07BB4', hasChart: false },
];

export const SYSTEM_PAGES = ['Overview', 'Details', 'Calendar', 'Games'];

export const AREAS = [
  { key: 'love', label: 'Love', icon: '\u2661' },
  { key: 'career', label: 'Career', icon: '\u2605' },
  { key: 'health', label: 'Health', icon: '\u2726' },
  { key: 'wealth', label: 'Wealth', icon: '\u25c6' },
  { key: 'mood', label: 'Mood', icon: '\u263d' },
];

export const CITIES = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Miami, FL',
  'Seattle, WA', 'Boston, MA', 'Denver, CO', 'San Francisco, CA', 'Austin, TX',
  'Atlanta, GA', 'Phoenix, AZ', 'London, UK', 'Paris, France', 'Tokyo, Japan',
  'Sydney, Australia', 'Toronto, Canada', 'Mumbai, India', 'Berlin, Germany',
  'Tel Aviv, Israel', 'Jerusalem, Israel', 'Dubai, UAE', 'Singapore',
  'Mexico City, Mexico', 'Rome, Italy', 'Seoul, South Korea',
];
