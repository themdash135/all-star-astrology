/**
 * Calendar Configuration — category definitions for all 8 astrology systems.
 * Scores use signed format: -10 to +10.
 */

/* ── Color mapping for signed scores ── */

export function scoreToColor(score) {
  if (score >= 6) return '#22C55E';       // bright green
  if (score >= 3) return '#4ADE80';       // green
  if (score >= 1) return '#5ECC8F';       // teal-green
  if (score >= -1) return '#64748B';      // neutral gray
  if (score >= -3) return '#A78BFA';      // muted purple
  if (score >= -6) return '#E87979';      // soft red
  return '#EF4444';                        // deep red
}

export function scoreToBg(score) {
  if (score >= 6) return 'rgba(34,197,94,.35)';
  if (score >= 3) return 'rgba(74,222,128,.22)';
  if (score >= 1) return 'rgba(94,204,143,.12)';
  if (score >= -1) return 'rgba(100,116,139,.08)';
  if (score >= -3) return 'rgba(167,139,250,.14)';
  if (score >= -6) return 'rgba(232,121,121,.22)';
  return 'rgba(239,68,68,.32)';
}

export function formatScore(score) {
  if (score > 0) return `+${score}`;
  return String(score);
}

export const CALENDAR_SYSTEMS = {
  western: {
    name: 'Western',
    categories: [
      { key: 'potency',    label: 'Potency',       icon: '\u2609', desc: 'Overall power of the day' },
      { key: 'money',      label: 'Money & Work',   icon: '\u2605', desc: 'Financial and career energy' },
      { key: 'power',      label: 'Power',          icon: '\u2726', desc: 'Ambition and influence' },
      { key: 'health',     label: 'Health',          icon: '\u2661', desc: 'Physical and mental wellness' },
      { key: 'love',       label: 'Love',            icon: '\u2764', desc: 'Romance and relationships' },
    ],
  },
  vedic: {
    name: 'Vedic',
    categories: [
      { key: 'strength',   label: 'Daily Strength',  icon: '\u2609', desc: 'Overall graha influence' },
      { key: 'career',     label: 'Career',           icon: '\u2605', desc: 'Professional success energy' },
      { key: 'wealth',     label: 'Wealth',            icon: '\u25C6', desc: 'Material abundance' },
      { key: 'relations',  label: 'Relationships',     icon: '\u2661', desc: 'Bonds and partnerships' },
      { key: 'health',     label: 'Health',             icon: '\u2726', desc: 'Physical vitality' },
      { key: 'spiritual',  label: 'Spiritual',          icon: '\u0950', desc: 'Inner growth and focus' },
    ],
  },
  chinese: {
    name: 'Chinese',
    categories: [
      { key: 'fortune',    label: 'Daily Fortune',   icon: '\uD83C\uDF1F', desc: 'Overall luck' },
      { key: 'career',     label: 'Career Luck',      icon: '\u2605', desc: 'Work and recognition' },
      { key: 'money',      label: 'Money Luck',       icon: '\u25C6', desc: 'Financial flow' },
      { key: 'love',       label: 'Relationship',     icon: '\u2661', desc: 'Love and social bonds' },
      { key: 'health',     label: 'Health Luck',      icon: '\u2726', desc: 'Physical well-being' },
      { key: 'harmony',    label: 'Harmony',          icon: '\u262F', desc: 'Balance and conflict' },
    ],
  },
  bazi: {
    name: 'BaZi',
    categories: [
      { key: 'potency',    label: 'Potency',          icon: '\u67F1', desc: 'Day pillar strength' },
      { key: 'money',      label: 'Money & Work',     icon: '\u2605', desc: 'Wealth element flow' },
      { key: 'power',      label: 'Power',            icon: '\u2726', desc: 'Authority and influence' },
      { key: 'health',     label: 'Health',            icon: '\u2661', desc: 'Physical element balance' },
      { key: 'relations',  label: 'Relationships',    icon: '\u2764', desc: 'Interpersonal harmony' },
      { key: 'resource',   label: 'Resource',         icon: '\u2696', desc: 'Support and backing' },
    ],
  },
  numerology: {
    name: 'Numerology',
    categories: [
      { key: 'vibration',  label: 'Daily Vibration',  icon: '\uD83D\uDD22', desc: 'Number resonance' },
      { key: 'money',      label: 'Money & Work',     icon: '\u2605', desc: 'Material vibration' },
      { key: 'relations',  label: 'Relationships',    icon: '\u2661', desc: 'Connection energy' },
      { key: 'health',     label: 'Health',            icon: '\u2726', desc: 'Wellness vibration' },
      { key: 'growth',     label: 'Growth',            icon: '\u2191', desc: 'Personal evolution' },
      { key: 'opportunity',label: 'Opportunity',       icon: '\u2737', desc: 'Openings and chance' },
    ],
  },
  kabbalistic: {
    name: 'Kabbalistic',
    categories: [
      { key: 'spiritual',  label: 'Spiritual Energy', icon: '\u2721', desc: 'Sefirot resonance' },
      { key: 'discipline', label: 'Discipline',       icon: '\u2726', desc: 'Gevurah influence' },
      { key: 'love',       label: 'Love & Harmony',   icon: '\u2661', desc: 'Chesed flow' },
      { key: 'work',       label: 'Manifestation',    icon: '\u2605', desc: 'Malkuth grounding' },
      { key: 'healing',    label: 'Healing',           icon: '\u2727', desc: 'Tiferet balance' },
      { key: 'balance',    label: 'Inner Balance',    icon: '\u2696', desc: 'Tree harmony' },
    ],
  },
  gematria: {
    name: 'Gematria',
    categories: [
      { key: 'resonance',  label: 'Daily Resonance',  icon: '\u05D0', desc: 'Date-name alignment' },
      { key: 'communication', label: 'Communication', icon: '\u270E', desc: 'Word and speech energy' },
      { key: 'love',       label: 'Love',              icon: '\u2661', desc: 'Heart-number match' },
      { key: 'wealth',     label: 'Wealth',            icon: '\u25C6', desc: 'Material number flow' },
      { key: 'focus',      label: 'Focus',             icon: '\u25CE', desc: 'Mental clarity' },
      { key: 'alignment',  label: 'Inner Alignment',  icon: '\u2726', desc: 'Soul-number harmony' },
    ],
  },
  persian: {
    name: 'Persian',
    categories: [
      { key: 'influence',  label: 'Daily Influence',  icon: '\u263D', desc: 'Planetary day ruler' },
      { key: 'work',       label: 'Work & Status',    icon: '\u2605', desc: 'Career energy' },
      { key: 'wealth',     label: 'Wealth',            icon: '\u25C6', desc: 'Material fortune' },
      { key: 'love',       label: 'Love & Family',    icon: '\u2661', desc: 'Relationship harmony' },
      { key: 'health',     label: 'Health',            icon: '\u2726', desc: 'Vitality and caution' },
      { key: 'protection', label: 'Protection',       icon: '\u2637', desc: 'Safety and warning' },
    ],
  },
};

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
