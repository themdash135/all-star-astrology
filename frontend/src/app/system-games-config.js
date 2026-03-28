/**
 * System Games Configuration — 27 premium games across 8 astrology systems.
 * Each game lives inside its system's Games tab.
 */

export const SYSTEM_GAMES = {
  bazi: [
    { id: 'bazi-element-balance', title: 'Element Balance', subtitle: 'Five-element strategy challenge', icon: '\u2696', duration: '2 min', gameType: 'identity', inputs: [], action: 'Cast the Elements' },
    { id: 'bazi-four-pillars', title: 'Four Pillars Explorer', subtitle: 'Discover your pillar secrets', icon: '\u67F1', duration: '3 min', gameType: 'explorer', inputs: [], action: 'Reveal My Pillars' },
    { id: 'bazi-luck-timeline', title: 'Luck Pillar Timeline', subtitle: 'Map your life phases', icon: '\u29D7', duration: '3 min', gameType: 'timeline', inputs: [], action: 'Map My Journey' },
    { id: 'bazi-compatibility', title: 'BaZi Compatibility', subtitle: 'Element harmony between two souls', icon: '\u267E', duration: '3 min', gameType: 'compatibility', inputs: ['partner_date'], action: 'Test Our Bond' },
  ],
  vedic: [
    { id: 'vedic-guna-match', title: 'Guna Match', subtitle: 'Sacred compatibility scoring', icon: '\u2728', duration: '3 min', gameType: 'compatibility', inputs: ['partner_date'], action: 'Begin the Ceremony' },
    { id: 'vedic-dasha-timeline', title: 'Dasha Timeline', subtitle: 'Planetary life periods', icon: '\u0D15', duration: '3 min', gameType: 'timeline', inputs: [], action: 'Enter the Timeline' },
    { id: 'vedic-prashna', title: 'Prashna Oracle', subtitle: 'Vedic question divination', icon: '\u0950', duration: '2 min', gameType: 'oracle', inputs: ['question'], action: 'Ask the Oracle' },
    { id: 'vedic-nakshatra', title: 'Nakshatra Destiny', subtitle: 'Your lunar mansion revealed', icon: '\u2606', duration: '2 min', gameType: 'identity', inputs: [], action: 'Reveal My Star' },
  ],
  western: [
    { id: 'western-synastry', title: 'Synastry Lab', subtitle: 'Advanced compatibility analysis', icon: '\u2697', duration: '3 min', gameType: 'compatibility', inputs: ['partner_date'], action: 'Open the Lab' },
    { id: 'western-natal-challenge', title: 'Natal Challenge', subtitle: 'Explore your chart layer by layer', icon: '\u2609', duration: '3 min', gameType: 'explorer', inputs: [], action: 'Start the Challenge' },
    { id: 'western-transit', title: 'Transit Impact', subtitle: 'Current cosmic influences', icon: '\u21BB', duration: '2 min', gameType: 'timeline', inputs: [], action: 'Read the Sky' },
    { id: 'western-house-power', title: 'House Power', subtitle: 'Your strongest life areas', icon: '\u2302', duration: '2 min', gameType: 'identity', inputs: [], action: 'Unlock My Houses' },
  ],
  chinese: [
    { id: 'chinese-compat-matrix', title: 'Zodiac Compatibility', subtitle: 'Animal sign harmony', icon: '\uD83D\uDC09', duration: '2 min', gameType: 'compatibility', inputs: ['partner_date'], action: 'Compare Animals' },
    { id: 'chinese-fortune-stick', title: 'Fortune Stick Oracle', subtitle: 'Draw your destiny verse', icon: '\uD83C\uDFCB', duration: '2 min', gameType: 'oracle', inputs: ['question'], action: 'Shake the Sticks' },
    { id: 'chinese-year-challenge', title: 'Year Challenge', subtitle: 'Your animal vs. the current year', icon: '\uD83C\uDF0A', duration: '2 min', gameType: 'timeline', inputs: [], action: 'Face the Year' },
  ],
  numerology: [
    { id: 'num-deep-decoder', title: 'Life Path Decoder', subtitle: 'All five core numbers revealed', icon: '\uD83D\uDD22', duration: '3 min', gameType: 'identity', inputs: [], action: 'Decode My Numbers' },
    { id: 'num-relationship', title: 'Number Match', subtitle: 'Numerology compatibility', icon: '\u2764', duration: '3 min', gameType: 'compatibility', inputs: ['partner_name', 'partner_date'], action: 'Match Our Numbers' },
    { id: 'num-year-timeline', title: 'Personal Year Map', subtitle: 'Your 9-year cycle decoded', icon: '\uD83D\uDCC5', duration: '2 min', gameType: 'timeline', inputs: [], action: 'Map My Cycle' },
  ],
  kabbalistic: [
    { id: 'kab-tree-journey', title: 'Tree of Life Journey', subtitle: 'Ascend the sephirot', icon: '\u2721', duration: '3 min', gameType: 'explorer', inputs: [], action: 'Begin the Ascent' },
    { id: 'kab-sephirot-balance', title: 'Sephirot Balance', subtitle: 'Your spiritual strengths', icon: '\u2726', duration: '2 min', gameType: 'identity', inputs: [], action: 'Read My Sephirot' },
    { id: 'kab-path-compat', title: 'Path Compatibility', subtitle: 'Two souls on the Tree', icon: '\u269B', duration: '3 min', gameType: 'compatibility', inputs: ['partner_date'], action: 'Walk Together' },
  ],
  gematria: [
    { id: 'gem-word-decoder', title: 'Word Value Decoder', subtitle: 'Unlock hidden number meanings', icon: '\u05D0', duration: '2 min', gameType: 'explorer', inputs: ['text'], action: 'Decode the Word' },
    { id: 'gem-hidden-link', title: 'Hidden Connection', subtitle: 'Find the numerical bridge', icon: '\uD83D\uDD17', duration: '2 min', gameType: 'compatibility', inputs: ['text', 'text2'], action: 'Find the Bridge' },
    { id: 'gem-soul-name', title: 'Soul Name Game', subtitle: 'Your name\u2019s spiritual code', icon: '\u2728', duration: '2 min', gameType: 'identity', inputs: [], action: 'Reveal My Name' },
  ],
  persian: [
    { id: 'persian-geomancy', title: 'Geomancy Reading', subtitle: 'Sacred sand divination', icon: '\u2637', duration: '3 min', gameType: 'oracle', inputs: ['question'], action: 'Cast the Sand' },
    { id: 'persian-astrolabe', title: 'Astrolabe Explorer', subtitle: 'Navigate celestial influence', icon: '\u263D', duration: '3 min', gameType: 'explorer', inputs: [], action: 'Turn the Astrolabe' },
    { id: 'persian-fal', title: 'Poetry Oracle', subtitle: 'Receive your sacred verse', icon: '\uD83D\uDCDC', duration: '2 min', gameType: 'oracle', inputs: ['question'], action: 'Open the Book' },
  ],
};

export const INPUT_LABELS = {
  partner_date: 'Partner\u2019s Birth Date',
  partner_name: 'Partner\u2019s Name',
  question: 'Your Question',
  text: 'Enter Word or Name',
  text2: 'Second Word or Name',
};

export const GAME_TYPE_LABELS = {
  identity: 'Self-Discovery',
  compatibility: 'Compatibility',
  timeline: 'Life Timeline',
  oracle: 'Divination',
  explorer: 'Interactive',
};
