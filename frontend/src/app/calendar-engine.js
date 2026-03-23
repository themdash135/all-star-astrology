/**
 * Calendar Scoring Engine — deterministic day scoring for all 8 systems.
 * All computation is client-side from birth data + calendar date.
 * Scores range from -10 to +10 (signed).
 */

import {
  signFromDate, reduceNumber, lifePath, seededRandom,
} from './games-engine.js';

// ══════════════════════════════════════════════════════
//  Shared Helpers
// ══════════════════════════════════════════════════════

const HEAVENLY_STEMS = ['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'];
const EARTHLY_BRANCHES = ['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'];
const STEM_ELEMENTS = { Jia:'Wood',Yi:'Wood',Bing:'Fire',Ding:'Fire',Wu:'Earth',Ji:'Earth',Geng:'Metal',Xin:'Metal',Ren:'Water',Gui:'Water' };
const BRANCH_ELEMENTS = { Zi:'Water',Chou:'Earth',Yin:'Wood',Mao:'Wood',Chen:'Earth',Si:'Fire',Wu:'Fire',Wei:'Earth',Shen:'Metal',You:'Metal',Xu:'Earth',Hai:'Water' };
const BRANCH_ANIMALS = { Zi:'Rat',Chou:'Ox',Yin:'Tiger',Mao:'Rabbit',Chen:'Dragon',Si:'Snake',Wu:'Horse',Wei:'Goat',Shen:'Monkey',You:'Rooster',Xu:'Dog',Hai:'Pig' };
const ELEMENT_PRODUCE = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
const ELEMENT_CONTROL = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };
const ELEMENT_NAMES = ['Wood','Fire','Earth','Metal','Water'];

const CHINESE_ANIMALS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const CHINESE_COMPAT = {
  Rat:[1,0,-1,0,1,0,-1,0,1,0,0,-1], Ox:[0,1,0,0,-1,1,0,-1,0,1,0,0],
  Tiger:[-1,0,1,0,0,-1,1,0,0,-1,1,1], Rabbit:[0,0,0,1,0,0,0,1,-1,0,-1,1],
  Dragon:[1,-1,0,0,1,0,0,0,1,-1,1,0], Snake:[0,1,-1,0,0,1,-1,0,0,1,0,0],
  Horse:[-1,0,1,0,0,-1,1,1,0,0,0,-1], Goat:[0,-1,0,1,0,0,1,1,0,0,0,1],
  Monkey:[1,0,0,-1,1,0,0,0,1,0,0,-1], Rooster:[0,1,-1,0,-1,1,0,0,0,1,0,0],
  Dog:[0,0,1,-1,1,0,0,0,0,0,1,-1], Pig:[-1,0,1,1,0,0,-1,1,-1,0,-1,1],
};

const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
const PLANET_DAY_RULERS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']; // Su,Mo,Tu,We,Th,Fr,Sa

const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

const SEPHIROT = ['Keter','Chokmah','Binah','Chesed','Gevurah','Tiferet','Netzach','Hod','Yesod','Malkhut'];
const SEPHIROT_QUALITIES = {
  Keter:'Divine Will', Chokmah:'Wisdom', Binah:'Understanding', Chesed:'Mercy',
  Gevurah:'Discipline', Tiferet:'Harmony', Netzach:'Endurance', Hod:'Intellect',
  Yesod:'Foundation', Malkhut:'Manifestation',
};

const LATIN_VALUES = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12,m:13,n:14,o:15,p:16,q:17,r:18,s:19,t:20,u:21,v:22,w:23,x:24,y:25,z:26 };

function getJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
}

function dayPillar(y, m, d) {
  const jdn = getJDN(y, m, d);
  const refJdn = getJDN(2000, 1, 7);
  const diff = jdn - refJdn;
  const si = ((diff % 10) + 10) % 10;
  const bi = ((diff % 12) + 12) % 12;
  return { stem: HEAVENLY_STEMS[si], branch: EARTHLY_BRANCHES[bi], stemIdx: si, branchIdx: bi };
}

function birthDayMaster(dateStr) {
  if (!dateStr) return 'Wood';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dp = dayPillar(y, m, d);
  return STEM_ELEMENTS[dp.stem];
}

function chineseAnimal(year) {
  return CHINESE_ANIMALS[((year - 4) % 12 + 12) % 12];
}

function approxNakshatraIdx(y, m, d) {
  const jdn = getJDN(y, m, d);
  return ((jdn * 7 + 13) % 27 + 27) % 27;
}

function wordValue(text) {
  let total = 0;
  for (const ch of (text || '').toLowerCase()) total += LATIN_VALUES[ch] || 0;
  return total;
}

function dateValue(y, m, d) {
  const digits = `${y}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}`;
  let sum = 0;
  for (const ch of digits) sum += Number(ch);
  return reduceNumber(sum);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }

// Deterministic hash for a day+category+system combo
function dayHash(y, m, d, systemId, catKey) {
  const s = `${y}-${m}-${d}-${systemId}-${catKey}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

// Seeded value -10..+10 with bias
function seededScore(seed, bias) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  h = (h * 1103515245 + 12345) & 0x7fffffff;
  const raw = (h / 0x7fffffff) * 20 - 10; // -10..+10
  return clamp(raw + bias, -10, 10);
}


// ══════════════════════════════════════════════════════
//  BaZi Scoring
// ══════════════════════════════════════════════════════

function scoreBaZi(y, m, d, category, form) {
  const dm = birthDayMaster(form?.birth_date);
  const dp = dayPillar(y, m, d);
  const dayStemEl = STEM_ELEMENTS[dp.stem];
  const dayBranchEl = BRANCH_ELEMENTS[dp.branch];

  // Element relationships
  const produces = ELEMENT_PRODUCE[dm] === dayStemEl;
  const producedBy = ELEMENT_PRODUCE[dayStemEl] === dm;
  const controls = ELEMENT_CONTROL[dm] === dayStemEl;
  const controlledBy = ELEMENT_CONTROL[dayStemEl] === dm;
  const same = dm === dayStemEl;

  let base = 0;
  if (same) base = 2;
  if (producedBy) base = 4;     // day feeds you
  if (produces) base = 1;       // you feed the day
  if (controls) base = -1;      // you drain controlling
  if (controlledBy) base = -3;  // day controls you

  // Branch element adds secondary influence
  const branchSame = dm === dayBranchEl;
  const branchProduces = ELEMENT_PRODUCE[dayBranchEl] === dm;
  const branchControls = ELEMENT_CONTROL[dayBranchEl] === dm;
  let branchMod = 0;
  if (branchSame) branchMod = 1;
  if (branchProduces) branchMod = 2;
  if (branchControls) branchMod = -2;

  // Category-specific weighting
  const catWeights = {
    potency:  { stemW: 1.0, branchW: 0.8, noise: 1.5 },
    money:    { stemW: 0.8, branchW: 1.0, noise: 1.8 },
    power:    { stemW: 1.2, branchW: 0.6, noise: 1.3 },
    health:   { stemW: 0.7, branchW: 1.2, noise: 1.6 },
    relations:{ stemW: 0.9, branchW: 0.9, noise: 2.0 },
    resource: { stemW: 1.1, branchW: 1.1, noise: 1.2 },
  };
  const w = catWeights[category] || catWeights.potency;

  const deterministic = base * w.stemW + branchMod * w.branchW;
  const noise = seededScore(`bazi-${y}-${m}-${d}-${category}-${dm}`, 0) * (w.noise / 10);
  const primary = clamp(deterministic + noise, -10, 10);
  const secondary = clamp(branchMod * 2 + seededScore(`bazi2-${y}-${m}-${d}-${category}`, 0) * 0.3, -10, 10);

  // Build factors
  const factors = [];
  factors.push({ label: 'Day Stem', value: `${dp.stem} (${dayStemEl})`, impact: base > 0 ? 'helps' : base < 0 ? 'hurts' : 'neutral' });
  factors.push({ label: 'Day Branch', value: `${dp.branch} (${dayBranchEl})`, impact: branchMod > 0 ? 'helps' : branchMod < 0 ? 'hurts' : 'neutral' });
  factors.push({ label: 'Day Master', value: `${dm}`, impact: 'neutral' });

  const helps = [];
  const hurts = [];
  if (producedBy || branchProduces) helps.push(`${dayStemEl} energy supports your ${dm} Day Master`);
  if (same || branchSame) helps.push(`Same-element resonance with ${dm}`);
  if (controlledBy || branchControls) hurts.push(`${dayStemEl} challenges your ${dm} nature`);
  if (controls) hurts.push(`You must exert effort to manage ${dayStemEl} energy`);

  const relationship = produces ? 'producing' : producedBy ? 'nourishing' : controls ? 'controlling' : controlledBy ? 'challenging' : same ? 'harmonious' : 'neutral';
  const summary = `${dp.stem} ${dp.branch} day creates a ${relationship} relationship with your ${dm} Day Master.`;

  return { primary, secondary, factors, helps, hurts, summary, actions: primary < -2 ? ['Avoid major decisions', 'Focus on routine tasks'] : primary > 3 ? ['Take initiative', 'Good day for important meetings'] : ['Stay balanced', 'Observe before acting'] };
}


// ══════════════════════════════════════════════════════
//  Western Scoring
// ══════════════════════════════════════════════════════

function scoreWestern(y, m, d, category, form) {
  const sign = signFromDate(form?.birth_date);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  const planetRuler = PLANET_DAY_RULERS[dayOfWeek];

  // Sign-planet affinity (simplified)
  const signRulers = { Aries:'Mars', Taurus:'Venus', Gemini:'Mercury', Cancer:'Moon', Leo:'Sun', Virgo:'Mercury', Libra:'Venus', Scorpio:'Mars', Sagittarius:'Jupiter', Capricorn:'Saturn', Aquarius:'Saturn', Pisces:'Jupiter' };
  const myRuler = signRulers[sign] || 'Sun';
  const rulerMatch = myRuler === planetRuler;

  // Lunar phase approximation
  const jdn = getJDN(y, m, d);
  const lunarPhase = ((jdn - 2451550.1) % 29.53 + 29.53) % 29.53;
  const isNewMoon = lunarPhase < 2 || lunarPhase > 27.5;
  const isFullMoon = lunarPhase > 13 && lunarPhase < 16;

  let base = rulerMatch ? 3 : 0;

  // Category modifiers
  const catMods = {
    potency:  { rulerBonus: 2, moonMod: isFullMoon ? 2 : isNewMoon ? -1 : 0 },
    money:    { rulerBonus: planetRuler === 'Jupiter' ? 3 : planetRuler === 'Saturn' ? -1 : 0, moonMod: 0 },
    power:    { rulerBonus: planetRuler === 'Sun' ? 3 : planetRuler === 'Mars' ? 2 : 0, moonMod: isFullMoon ? 1 : 0 },
    health:   { rulerBonus: planetRuler === 'Moon' ? 2 : planetRuler === 'Mars' ? -1 : 0, moonMod: isNewMoon ? -2 : 0 },
    love:     { rulerBonus: planetRuler === 'Venus' ? 4 : planetRuler === 'Saturn' ? -2 : 0, moonMod: isFullMoon ? 2 : 0 },
  };
  const cm = catMods[category] || catMods.potency;
  base += cm.rulerBonus + cm.moonMod;

  const noise = seededScore(`west-${y}-${m}-${d}-${category}-${sign}`, 0) * 0.25;
  const primary = clamp(base + noise, -10, 10);
  const secondary = clamp(cm.moonMod + seededScore(`west2-${y}-${m}-${d}-${category}`, 0) * 0.2, -10, 10);

  const factors = [
    { label: 'Day Ruler', value: planetRuler, impact: rulerMatch ? 'helps' : 'neutral' },
    { label: 'Your Sign', value: sign, impact: 'neutral' },
    { label: 'Lunar Phase', value: isFullMoon ? 'Full Moon' : isNewMoon ? 'New Moon' : `Day ${Math.floor(lunarPhase)}`, impact: cm.moonMod > 0 ? 'helps' : cm.moonMod < 0 ? 'hurts' : 'neutral' },
  ];

  const helps = [];
  const hurts = [];
  if (rulerMatch) helps.push(`${planetRuler} rules both the day and your sign`);
  if (cm.rulerBonus > 0) helps.push(`${planetRuler} favors ${category}`);
  if (cm.rulerBonus < 0) hurts.push(`${planetRuler} energy conflicts with ${category}`);
  if (cm.moonMod > 0) helps.push('Favorable lunar phase amplifies energy');
  if (cm.moonMod < 0) hurts.push('Lunar phase dampens vitality');

  const summary = `${planetRuler} rules this day. ${rulerMatch ? `Strong alignment with your ${sign} nature.` : `Your ${sign} ruler ${myRuler} is not the day\u2019s focus.`}`;

  return { primary, secondary, factors, helps, hurts, summary, actions: primary > 2 ? ['Pursue goals actively', 'Make important calls'] : primary < -2 ? ['Rest and reflect', 'Postpone big decisions'] : ['Steady pace', 'Good for routine'] };
}


// ══════════════════════════════════════════════════════
//  Vedic Scoring
// ══════════════════════════════════════════════════════

function scoreVedic(y, m, d, category, form) {
  const nakIdx = approxNakshatraIdx(y, m, d);
  const nak = NAKSHATRAS[nakIdx];
  const birthNakIdx = form?.birth_date ? approxNakshatraIdx(...form.birth_date.split('-').map(Number)) : 0;

  // Nakshatra compatibility (tara bala simplified)
  const taraDist = ((nakIdx - birthNakIdx) % 9 + 9) % 9;
  const taraScores = [3, -2, -3, 2, -1, 3, 1, -2, 4]; // janma, sampat, vipat, kshema, pratyak, sadhana, naidhana, mitra, ati-mitra
  const taraBase = taraScores[taraDist] || 0;

  // Tithi (lunar day) influence
  const jdn = getJDN(y, m, d);
  const lunarAge = ((jdn - 2451550.1) % 29.53 + 29.53) % 29.53;
  const tithi = Math.floor(lunarAge / (29.53 / 30)) + 1;
  const tithiMod = tithi <= 5 ? 1 : tithi <= 10 ? 0 : tithi <= 15 ? 1 : tithi <= 20 ? -1 : tithi <= 25 ? 0 : -1;

  const catMods = {
    strength:  { taraW: 1.0, tithiW: 0.8 },
    career:    { taraW: 0.7, tithiW: 0.5 },
    wealth:    { taraW: 0.8, tithiW: 1.0 },
    relations: { taraW: 1.2, tithiW: 0.6 },
    health:    { taraW: 0.6, tithiW: 1.2 },
    spiritual: { taraW: 1.0, tithiW: 1.0 },
  };
  const cm = catMods[category] || catMods.strength;

  const base = taraBase * cm.taraW + tithiMod * cm.tithiW;
  const noise = seededScore(`vedic-${y}-${m}-${d}-${category}-${birthNakIdx}`, 0) * 0.2;
  const primary = clamp(base + noise, -10, 10);
  const secondary = clamp(tithiMod * 2 + seededScore(`vedic2-${y}-${m}-${d}-${category}`, 0) * 0.2, -10, 10);

  const taraNames = ['Janma','Sampat','Vipat','Kshema','Pratyak','Sadhana','Naidhana','Mitra','Ati-Mitra'];
  const factors = [
    { label: 'Nakshatra', value: nak, impact: taraBase > 0 ? 'helps' : taraBase < 0 ? 'hurts' : 'neutral' },
    { label: 'Tara Bala', value: taraNames[taraDist], impact: taraBase > 0 ? 'helps' : 'hurts' },
    { label: 'Tithi', value: `${tithi}`, impact: tithiMod > 0 ? 'helps' : tithiMod < 0 ? 'hurts' : 'neutral' },
  ];

  const helps = [], hurts = [];
  if (taraBase > 0) helps.push(`${taraNames[taraDist]} tara brings favorable energy from ${nak}`);
  if (taraBase < 0) hurts.push(`${taraNames[taraDist]} tara creates friction with ${nak}`);
  if (tithiMod > 0) helps.push(`Tithi ${tithi} supports activity`);
  if (tithiMod < 0) hurts.push(`Tithi ${tithi} suggests restraint`);

  const summary = `Moon transits ${nak}. Your tara bala is ${taraNames[taraDist]} (${taraBase > 0 ? 'favorable' : taraBase < 0 ? 'challenging' : 'neutral'}).`;

  return { primary, secondary, factors, helps, hurts, summary, actions: primary > 2 ? ['Initiate new ventures', 'Perform rituals or prayers'] : primary < -2 ? ['Avoid new beginnings', 'Focus on spiritual practice'] : ['Moderate activity', 'Good for routine work'] };
}


// ══════════════════════════════════════════════════════
//  Chinese Zodiac Scoring
// ══════════════════════════════════════════════════════

function scoreChinese(y, m, d, category, form) {
  const birthYear = form?.birth_date ? parseInt(form.birth_date.split('-')[0]) : 1990;
  const birthAnimal = chineseAnimal(birthYear);

  // Day's animal (branch from day pillar)
  const dp = dayPillar(y, m, d);
  const dayAnimal = BRANCH_ANIMALS[dp.branch];

  // Compatibility score
  const bIdx = CHINESE_ANIMALS.indexOf(birthAnimal);
  const dIdx = CHINESE_ANIMALS.indexOf(dayAnimal);
  const compat = CHINESE_COMPAT[birthAnimal] ? CHINESE_COMPAT[birthAnimal][dIdx] : 0;

  // Month animal influence
  const monthAnimal = CHINESE_ANIMALS[((m + 1) % 12)];
  const monthCompat = CHINESE_COMPAT[birthAnimal] ? CHINESE_COMPAT[birthAnimal][CHINESE_ANIMALS.indexOf(monthAnimal)] : 0;

  const catMods = {
    fortune:  { compatW: 3.0, monthW: 1.5 },
    career:   { compatW: 2.5, monthW: 1.0 },
    money:    { compatW: 2.0, monthW: 2.0 },
    love:     { compatW: 3.5, monthW: 1.0 },
    health:   { compatW: 1.5, monthW: 1.5 },
    harmony:  { compatW: 2.5, monthW: 2.0 },
  };
  const cm = catMods[category] || catMods.fortune;

  const base = compat * cm.compatW + monthCompat * cm.monthW * 0.5;
  const noise = seededScore(`chinese-${y}-${m}-${d}-${category}-${birthAnimal}`, 0) * 0.25;
  const primary = clamp(base + noise, -10, 10);
  const secondary = clamp(monthCompat * 2 + seededScore(`ch2-${y}-${m}-${d}-${category}`, 0) * 0.2, -10, 10);

  const factors = [
    { label: 'Day Animal', value: dayAnimal, impact: compat > 0 ? 'helps' : compat < 0 ? 'hurts' : 'neutral' },
    { label: 'Your Animal', value: birthAnimal, impact: 'neutral' },
    { label: 'Month Animal', value: monthAnimal, impact: monthCompat > 0 ? 'helps' : monthCompat < 0 ? 'hurts' : 'neutral' },
  ];

  const helps = [], hurts = [];
  if (compat > 0) helps.push(`${dayAnimal} is a favorable companion for ${birthAnimal}`);
  if (compat < 0) hurts.push(`${dayAnimal} clashes with ${birthAnimal} energy`);
  if (monthCompat > 0) helps.push(`${monthAnimal} month supports your sign`);
  if (monthCompat < 0) hurts.push(`${monthAnimal} month adds tension`);

  const summary = `${dayAnimal} day ${compat > 0 ? 'harmonizes with' : compat < 0 ? 'challenges' : 'is neutral for'} your ${birthAnimal} nature.`;

  return { primary, secondary, factors, helps, hurts, summary, actions: primary > 2 ? ['Pursue social opportunities', 'Good for partnerships'] : primary < -2 ? ['Keep a low profile', 'Avoid confrontation'] : ['Steady progress', 'Routine favored'] };
}


// ══════════════════════════════════════════════════════
//  Numerology Scoring
// ══════════════════════════════════════════════════════

function scoreNumerology(y, m, d, category, form) {
  const lp = form?.birth_date ? lifePath(form.birth_date) : 1;
  const personalYear = reduceNumber(lp + reduceNumber(y));
  const personalMonth = reduceNumber(personalYear + m);
  const personalDay = reduceNumber(personalMonth + d);
  const universalDay = reduceNumber(y + m + d);

  // Day-number resonance
  const resonance = personalDay === lp ? 4 : personalDay === personalYear ? 3 : [1,3,5,7,9].includes(personalDay) && [1,3,5,7,9].includes(lp) ? 1 : [2,4,6,8].includes(personalDay) && [2,4,6,8].includes(lp) ? 1 : -1;

  // Universal-personal harmony
  const harmony = universalDay === personalDay ? 3 : Math.abs(universalDay - personalDay) <= 2 ? 1 : -1;

  const catMods = {
    vibration:   { resW: 1.5, harmW: 1.0 },
    money:       { resW: 1.0, harmW: 1.2 },
    relations:   { resW: 1.3, harmW: 0.8 },
    health:      { resW: 0.8, harmW: 1.0 },
    growth:      { resW: 1.0, harmW: 1.5 },
    opportunity: { resW: 1.2, harmW: 1.3 },
  };
  const cm = catMods[category] || catMods.vibration;

  const base = resonance * cm.resW + harmony * cm.harmW;
  const noise = seededScore(`num-${y}-${m}-${d}-${category}-${lp}`, 0) * 0.2;
  const primary = clamp(base + noise, -10, 10);
  const secondary = clamp(harmony * 2 + seededScore(`num2-${y}-${m}-${d}-${category}`, 0) * 0.2, -10, 10);

  const factors = [
    { label: 'Personal Day', value: String(personalDay), impact: resonance > 0 ? 'helps' : 'hurts' },
    { label: 'Universal Day', value: String(universalDay), impact: harmony > 0 ? 'helps' : 'hurts' },
    { label: 'Life Path', value: String(lp), impact: 'neutral' },
    { label: 'Personal Year', value: String(personalYear), impact: 'neutral' },
  ];

  const helps = [], hurts = [];
  if (resonance > 0) helps.push(`Personal day ${personalDay} resonates with your Life Path ${lp}`);
  if (resonance < 0) hurts.push(`Personal day ${personalDay} vibrates differently from your core`);
  if (harmony > 0) helps.push(`Universal day ${universalDay} aligns with personal energy`);
  if (harmony < 0) hurts.push(`Universal and personal energies diverge`);

  const summary = `Personal Day ${personalDay}, Universal Day ${universalDay}. ${resonance > 0 ? 'Strong resonance with your Life Path.' : 'Contrasting vibrations require adaptability.'}`;

  return { primary, secondary, factors, helps, hurts, summary, actions: primary > 2 ? ['Follow creative impulses', 'Numbers support bold action'] : primary < -2 ? ['Conserve energy', 'Review before deciding'] : ['Stay present', 'Good for planning'] };
}


// ══════════════════════════════════════════════════════
//  Kabbalistic Scoring
// ══════════════════════════════════════════════════════

function scoreKabbalistic(y, m, d, category, form) {
  const nameVal = wordValue(form?.full_name || '');
  const dayVal = dateValue(y, m, d);
  const birthVal = form?.birth_date ? dateValue(...form.birth_date.split('-').map(Number)) : 1;

  // Sefirot of the day (cycle through 10)
  const daySefirotIdx = (getJDN(y, m, d) % 10 + 10) % 10;
  const daySef = SEPHIROT[daySefirotIdx];
  const birthSefirotIdx = form?.birth_date ? (getJDN(...form.birth_date.split('-').map(Number)) % 10 + 10) % 10 : 0;

  // Path distance on Tree
  const dist = Math.abs(daySefirotIdx - birthSefirotIdx);
  const pathHarmony = dist <= 2 ? 3 : dist <= 4 ? 1 : dist <= 6 ? -1 : -3;

  // Category-sefirot affinity
  const catAffinities = {
    spiritual:  [0, 1, 2],      // Keter, Chokmah, Binah
    discipline: [4, 7],          // Gevurah, Hod
    love:       [3, 5, 6],       // Chesed, Tiferet, Netzach
    work:       [8, 9],          // Yesod, Malkhut
    healing:    [5],             // Tiferet
    balance:    [3, 4, 5],       // Chesed, Gevurah, Tiferet
  };
  const affinityBonus = (catAffinities[category] || []).includes(daySefirotIdx) ? 3 : 0;

  const base = pathHarmony + affinityBonus;
  const noise = seededScore(`kab-${y}-${m}-${d}-${category}-${birthVal}`, 0) * 0.2;
  const primary = clamp(base + noise, -10, 10);
  const secondary = clamp(affinityBonus + seededScore(`kab2-${y}-${m}-${d}-${category}`, 0) * 0.2, -10, 10);

  const factors = [
    { label: 'Day Sefirah', value: `${daySef} (${SEPHIROT_QUALITIES[daySef]})`, impact: affinityBonus > 0 ? 'helps' : 'neutral' },
    { label: 'Path Distance', value: `${dist} steps`, impact: pathHarmony > 0 ? 'helps' : 'hurts' },
    { label: 'Birth Sefirah', value: SEPHIROT[birthSefirotIdx], impact: 'neutral' },
  ];

  const helps = [], hurts = [];
  if (pathHarmony > 0) helps.push(`${daySef} is close to your birth sefirah on the Tree`);
  if (pathHarmony < 0) hurts.push(`${daySef} is distant from your birth sefirah`);
  if (affinityBonus > 0) helps.push(`${daySef} directly governs ${category}`);

  const summary = `The day resonates with ${daySef} (${SEPHIROT_QUALITIES[daySef]}). ${pathHarmony > 0 ? 'Close alignment with your soul path.' : 'Growth through stretching beyond comfort.'}`;

  return { primary, secondary, factors, helps, hurts, summary, actions: primary > 2 ? ['Meditate on ' + daySef, 'Align actions with spiritual purpose'] : primary < -2 ? ['Practice acceptance', 'Inner work favored'] : ['Contemplate balance', 'Small acts of kindness'] };
}


// ══════════════════════════════════════════════════════
//  Gematria Scoring
// ══════════════════════════════════════════════════════

function scoreGematria(y, m, d, category, form) {
  const nameVal = wordValue(form?.full_name || 'name');
  const nameReduced = reduceNumber(nameVal);
  const dayVal = dateValue(y, m, d);

  // Resonance: same reduced number = strong match
  const match = nameReduced === dayVal ? 5 : Math.abs(nameReduced - dayVal) <= 2 ? 2 : Math.abs(nameReduced - dayVal) <= 4 ? 0 : -2;

  // Date digit sum for secondary factor
  const digitSum = (d % 10) + Math.floor(d / 10);
  const digitHarmony = reduceNumber(digitSum) === reduceNumber(nameReduced) ? 3 : 0;

  const catMods = {
    resonance:      { matchW: 1.5, digitW: 0.8 },
    communication:  { matchW: 1.0, digitW: 1.2 },
    love:           { matchW: 1.3, digitW: 0.7 },
    wealth:         { matchW: 1.2, digitW: 1.0 },
    focus:          { matchW: 0.8, digitW: 1.5 },
    alignment:      { matchW: 1.4, digitW: 1.0 },
  };
  const cm = catMods[category] || catMods.resonance;

  const base = match * cm.matchW + digitHarmony * cm.digitW * 0.5;
  const noise = seededScore(`gem-${y}-${m}-${d}-${category}-${nameReduced}`, 0) * 0.2;
  const primary = clamp(base + noise, -10, 10);
  const secondary = clamp(digitHarmony + seededScore(`gem2-${y}-${m}-${d}-${category}`, 0) * 0.2, -10, 10);

  const factors = [
    { label: 'Day Number', value: String(dayVal), impact: match > 0 ? 'helps' : match < 0 ? 'hurts' : 'neutral' },
    { label: 'Name Number', value: `${nameReduced} (from ${nameVal})`, impact: 'neutral' },
    { label: 'Digit Harmony', value: match > 0 ? 'Resonant' : 'Dissonant', impact: match > 0 ? 'helps' : 'hurts' },
  ];

  const helps = [], hurts = [];
  if (match > 0) helps.push(`Day number ${dayVal} resonates with your name number ${nameReduced}`);
  if (match < 0) hurts.push(`Day number ${dayVal} is distant from your core vibration`);
  if (digitHarmony > 0) helps.push('Date digits create secondary harmony');

  const summary = `Day value ${dayVal} ${match > 0 ? 'aligns with' : match < 0 ? 'diverges from' : 'is neutral to'} your name vibration ${nameReduced}.`;

  return { primary, secondary, factors, helps, hurts, summary, actions: primary > 2 ? ['Write or speak your intentions', 'Words carry extra power today'] : primary < -2 ? ['Choose words carefully', 'Listen more than you speak'] : ['Journal reflections', 'Good for study'] };
}


// ══════════════════════════════════════════════════════
//  Persian / Islamic Scoring
// ══════════════════════════════════════════════════════

function scorePersian(y, m, d, category, form) {
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  const planetRuler = PLANET_DAY_RULERS[dayOfWeek];
  const sign = signFromDate(form?.birth_date);

  // Planetary dignity (simplified)
  const dignities = { Sun: ['Leo'], Moon: ['Cancer'], Mars: ['Aries','Scorpio'], Mercury: ['Gemini','Virgo'], Jupiter: ['Sagittarius','Pisces'], Venus: ['Taurus','Libra'], Saturn: ['Capricorn','Aquarius'] };
  const inDignity = (dignities[planetRuler] || []).includes(sign);

  // Lot of Fortune approximation
  const jdn = getJDN(y, m, d);
  const lotValue = (jdn * 3 + 7) % 12;
  const lotFavorable = lotValue < 4;
  const lotChallenging = lotValue > 9;

  // Temperament alignment
  const tempScores = { Sun: 2, Moon: 1, Mars: -1, Mercury: 0, Jupiter: 3, Venus: 2, Saturn: -2 };
  const tempBase = tempScores[planetRuler] || 0;

  const catMods = {
    influence:  { planetW: 1.5, lotW: 1.0, tempW: 0.8 },
    work:       { planetW: 1.0, lotW: 1.5, tempW: 0.5 },
    wealth:     { planetW: 0.8, lotW: 2.0, tempW: 0.5 },
    love:       { planetW: 1.2, lotW: 0.8, tempW: 1.2 },
    health:     { planetW: 0.8, lotW: 1.0, tempW: 1.5 },
    protection: { planetW: 1.0, lotW: 1.2, tempW: 1.0 },
  };
  const cm = catMods[category] || catMods.influence;

  const dignityScore = inDignity ? 3 : 0;
  const lotScore = lotFavorable ? 2 : lotChallenging ? -2 : 0;
  const base = dignityScore * cm.planetW * 0.5 + lotScore * cm.lotW + tempBase * cm.tempW * 0.5;
  const noise = seededScore(`persian-${y}-${m}-${d}-${category}-${sign}`, 0) * 0.25;
  const primary = clamp(base + noise, -10, 10);
  const secondary = clamp(lotScore * 2 + seededScore(`pers2-${y}-${m}-${d}-${category}`, 0) * 0.2, -10, 10);

  const factors = [
    { label: 'Day Ruler', value: planetRuler, impact: tempBase > 0 ? 'helps' : tempBase < 0 ? 'hurts' : 'neutral' },
    { label: 'Lot of Fortune', value: lotFavorable ? 'Favorable' : lotChallenging ? 'Challenging' : 'Neutral', impact: lotFavorable ? 'helps' : lotChallenging ? 'hurts' : 'neutral' },
    { label: 'Dignity', value: inDignity ? 'In dignity' : 'Neutral', impact: inDignity ? 'helps' : 'neutral' },
  ];

  const helps = [], hurts = [];
  if (inDignity) helps.push(`${planetRuler} rules your sign \u2014 strong alignment`);
  if (lotFavorable) helps.push('Lot of Fortune is favorably positioned');
  if (lotChallenging) hurts.push('Lot of Fortune suggests caution');
  if (tempBase < 0) hurts.push(`${planetRuler} energy can be restrictive`);
  if (tempBase > 0) helps.push(`${planetRuler} brings benevolent influence`);

  const summary = `${planetRuler} governs this day. ${inDignity ? 'Strong planetary dignity for your sign.' : 'Moderate planetary influence.'} ${lotFavorable ? 'Fortune favors action.' : lotChallenging ? 'Caution advised.' : ''}`;

  return { primary, secondary, factors, helps, hurts, summary, actions: primary > 2 ? ['Act with confidence', 'Fortune supports initiative'] : primary < -2 ? ['Seek protection through prayer', 'Avoid unnecessary risks'] : ['Proceed mindfully', 'Moderate expectations'] };
}


// ══════════════════════════════════════════════════════
//  Public API
// ══════════════════════════════════════════════════════

const SYSTEM_SCORERS = {
  bazi: scoreBaZi,
  western: scoreWestern,
  vedic: scoreVedic,
  chinese: scoreChinese,
  numerology: scoreNumerology,
  kabbalistic: scoreKabbalistic,
  gematria: scoreGematria,
  persian: scorePersian,
};

/**
 * Score a single day for a system and category.
 * @returns {{ primary: number, secondary: number, factors: Array, helps: string[], hurts: string[], summary: string, actions: string[] }}
 */
export function scoreDay(systemId, category, year, month, day, form) {
  const scorer = SYSTEM_SCORERS[systemId];
  if (!scorer) return { primary: 0, secondary: 0, factors: [], helps: [], hurts: [], summary: 'Unknown system', actions: [] };
  return scorer(year, month, day, category, form);
}

/**
 * Score all days in a month for a system and category.
 * Returns an object keyed by day number (1-31).
 */
const _cache = {};

export function scoreMonth(systemId, category, year, month, form) {
  const cacheKey = `${systemId}-${category}-${year}-${month}-${form?.birth_date || ''}-${form?.full_name || ''}`;
  if (_cache[cacheKey]) return _cache[cacheKey];

  const daysInMonth = new Date(year, month, 0).getDate();
  const scores = {};
  for (let d = 1; d <= daysInMonth; d++) {
    scores[d] = scoreDay(systemId, category, year, month, d, form);
  }

  _cache[cacheKey] = scores;

  // Keep cache from growing unbounded
  const keys = Object.keys(_cache);
  if (keys.length > 50) {
    for (let i = 0; i < 10; i++) delete _cache[keys[i]];
  }

  return scores;
}
