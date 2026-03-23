/**
 * Match Making Engine — 8-system cosmic compatibility analysis.
 * Deterministic per birth-data pair, frontend-only (no ephemeris).
 */
import { signFromDate, reduceNumber, lifePath, seededRandom } from './games-engine.js';

/* ══════════════════════════════════════════════════════
   SHARED CONSTANTS & HELPERS
   ══════════════════════════════════════════════════════ */
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_IDX = Object.fromEntries(SIGNS.map((s, i) => [s, i]));

const SIGN_ELEMENTS = {
  Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water',
  Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water',
  Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water',
};
const SIGN_MODALITIES = {
  Aries:'Cardinal', Taurus:'Fixed', Gemini:'Mutable', Cancer:'Cardinal',
  Leo:'Fixed', Virgo:'Mutable', Libra:'Cardinal', Scorpio:'Fixed',
  Sagittarius:'Mutable', Capricorn:'Cardinal', Aquarius:'Fixed', Pisces:'Mutable',
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function sortedKey(a, b) { return [a, b].sort().join('_'); }

function parseBD(form) {
  const bd = form?.birth_date || '1990-01-01';
  const [y, m, d] = bd.split('-').map(Number);
  const bt = form?.birth_time || null;
  const loc = form?.birth_location || null;
  return { y, m, d, bd, bt, loc };
}

function julianDay(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
}

function verdictFor(score, tiers) {
  return (tiers.find(([min]) => score >= min) || tiers[tiers.length - 1])[1];
}

/* ══════════════════════════════════════════════════════
   1. WESTERN SYNASTRY
   ══════════════════════════════════════════════════════ */
const EL_COMPAT = {
  Air_Air: 75, Air_Earth: 52, Air_Fire: 88, Air_Water: 58,
  Earth_Earth: 78, Earth_Fire: 50, Earth_Water: 85,
  Fire_Fire: 82, Fire_Water: 48, Water_Water: 80,
};
const MOD_COMPAT = {
  Cardinal_Cardinal: 62, Cardinal_Fixed: 55, Cardinal_Mutable: 78,
  Fixed_Fixed: 52, Fixed_Mutable: 65, Mutable_Mutable: 72,
};
const ASPECT_BONUS = [14, 0, 10, -6, 14, -4, 6];
const ASPECT_NAME = ['Conjunction', 'Semi-sextile', 'Sextile', 'Square', 'Trine', 'Quincunx', 'Opposition'];

const EL_DETAIL = {
  Air_Air: {
    p: 'Two Air signs create an intellectually charged bond where ideas flow freely, conversation never runs dry, and curiosity is the shared currency. You understand each other\'s need for mental stimulation and social variety. The risk is living entirely in the head while the heart goes unfed. Neither of you naturally gravitates toward emotional vulnerability, so the relationship can feel exciting yet somehow weightless unless you consciously build deeper intimacy.',
    s: ['Endless intellectual stimulation and vibrant social life together', 'Mutual respect for independence and personal space', 'Shared love of novelty keeps the relationship fresh'],
    c: ['Emotions can be analyzed rather than truly felt — depth requires effort', 'Neither may want to handle the mundane, practical side of life together'],
    a: 'Schedule intentional time for emotional check-ins. Your minds connect effortlessly — the growth edge is in your hearts.',
  },
  Air_Earth: {
    p: 'Air and Earth represent mind meeting matter. One lives in ideas, possibilities, and social connection; the other in tangible results, patience, and sensory experience. This pairing can feel frustrating when Air\'s need for change clashes with Earth\'s desire for stability, or when Earth\'s methodical pace feels stifling to Air\'s restless mind. Yet the magic happens when Air helps Earth see new possibilities and Earth gives Air\'s ideas a grounded, lasting form.',
    s: ['Air brings vision and creativity that Earth can build into reality', 'Earth provides the stability and follow-through Air often lacks', 'You broaden each other\'s worldview in fundamental ways'],
    c: ['Air may feel trapped by Earth\'s routines; Earth may feel unsettled by Air\'s constant change', 'Communication styles differ sharply — abstract vs. concrete thinking'],
    a: 'Meet in the middle: plan adventures together (Air leads) and build shared rituals (Earth leads). Respect that you process the world differently.',
  },
  Air_Fire: {
    p: 'Air and Fire is one of the most dynamic and naturally exciting combinations in the zodiac. Air feeds Fire\'s flames — your enthusiasm multiplies when you are together, ideas turn into action at lightning speed, and boredom is virtually impossible. You share a yang, outward-moving energy that makes you a power couple socially and creatively. The danger is burnout: two fast-moving, high-energy forces can exhaust each other or leave important emotional and practical needs unattended.',
    s: ['Explosive creative chemistry and shared enthusiasm for life', 'You inspire each other to dream bigger and act bolder', 'Social magnetism as a couple — others are drawn to your combined energy'],
    c: ['Both can be impulsive; someone needs to be the voice of patience', 'Emotional depth may be sacrificed for excitement and novelty'],
    a: 'Channel your shared fire into meaningful projects and adventures. When tensions flare, step back before reacting — your spark is precious, so protect it from careless burns.',
  },
  Air_Water: {
    p: 'Air and Water bring together the mind and the heart in a pairing that can be deeply enriching or deeply frustrating. Water feels everything intensely and needs emotional security; Air processes through logic and needs intellectual freedom. When this works, Air helps Water articulate feelings that would otherwise remain overwhelming, and Water teaches Air that not everything meaningful can be explained. When it struggles, Water feels Air is emotionally distant, while Air feels drowned by Water\'s emotional intensity.',
    s: ['Water deepens Air\'s emotional intelligence and capacity for intimacy', 'Air gives Water clarity, perspective, and lighter moments during heavy times', 'Together you can bridge logic and intuition in powerful ways'],
    c: ['Water may feel Air is detached and emotionally unavailable', 'Air may feel overwhelmed or trapped by Water\'s emotional needs and moods'],
    a: 'Learn each other\'s emotional language. Water: not every silence means rejection. Air: not every emotion needs a solution — sometimes just being present is enough.',
  },
  Earth_Earth: {
    p: 'Two Earth signs together create a fortress of stability, loyalty, and shared values. You understand each other\'s need for security, appreciate the same comforts, and build toward long-term goals with remarkable patience. This is often a relationship that others envy for its reliability and quiet strength. The risk is stagnation — without an external catalyst, two Earth energies can settle into routines so deep that growth, passion, and spontaneity slowly evaporate.',
    s: ['Rock-solid foundation of trust, loyalty, and shared practical values', 'Natural alignment on finances, lifestyle, and long-term planning', 'Deep sensual connection rooted in physical presence and quality time'],
    c: ['Routine can harden into rigidity; neither may push for needed change', 'Emotional expression may feel inadequate — love shown through actions, rarely words'],
    a: 'Deliberately introduce novelty: travel somewhere unexpected, take a class together, surprise each other. Your stability is a gift — just make sure it stays alive.',
  },
  Earth_Fire: {
    p: 'Earth and Fire is a relationship of fundamental tension and enormous potential. Fire is passionate, impulsive, and future-oriented; Earth is patient, methodical, and present-focused. Fire may feel Earth is a wet blanket on their enthusiasm, while Earth may feel Fire is reckless and unreliable. But when these energies learn to cooperate, Fire\'s vision combined with Earth\'s execution creates something neither could achieve alone. This pairing demands mutual respect for radically different approaches to life.',
    s: ['Fire\'s passion and vision give Earth exciting goals to build toward', 'Earth\'s grounding gives Fire the stability to sustain their ambitions', 'When aligned, you are an unstoppable builder-and-visionary team'],
    c: ['Fire feels slowed down and constrained by Earth\'s caution', 'Earth feels exhausted or anxious from Fire\'s impulsiveness and risk-taking'],
    a: 'Fire: honor Earth\'s need for a plan before you leap. Earth: trust Fire\'s instincts sometimes, even when the logic is not yet clear. You need each other more than you realize.',
  },
  Earth_Water: {
    p: 'Earth and Water is one of the most naturally compatible pairings in the zodiac. Water nourishes Earth, and Earth gives Water a container to flow within. Together you create a garden — a relationship of growth, emotional depth, and mutual care. You share a yin energy that values intimacy, home, and emotional security over external excitement. The bond can feel so comfortable that it becomes insular. Both of you may avoid confrontation, letting issues build until they erupt.',
    s: ['Deep emotional understanding and natural nurturing of each other\'s needs', 'Shared love of home, comfort, family, and meaningful tradition', 'A garden that blooms — you grow more beautiful together over time'],
    c: ['Both avoid conflict, allowing resentment to build silently', 'The relationship can become too insular — you may isolate from the outside world'],
    a: 'Practice honest, direct communication even when it feels uncomfortable. Your bond is strong enough to handle truth. Also, maintain friendships and interests outside the relationship.',
  },
  Fire_Fire: {
    p: 'Two Fire signs together create a relationship that burns bright, hot, and fast. The passion is undeniable — you understand each other\'s need for excitement, recognition, and forward momentum. There is never a dull moment, and your combined enthusiasm can light up any room. The challenge is equally intense: two fires competing for oxygen means power struggles, dramatic arguments, and the risk of burning each other out. This relationship needs conscious space, mutual admiration, and a willingness to share the spotlight.',
    s: ['Unmatched passion, energy, and shared enthusiasm for life', 'You push each other to be bolder, braver, and more ambitious', 'A magnetic, exciting couple that others admire and are drawn to'],
    c: ['Power struggles and ego clashes can be explosive and destructive', 'Both want to lead — compromise feels like losing for two proud spirits'],
    a: 'Take turns being the star. Create separate arenas where each of you shines independently. When anger flares, walk away for 20 minutes before engaging — your fire cools fast when given space.',
  },
  Fire_Water: {
    p: 'Fire and Water is the classic pairing of opposites — and it carries all the intensity that implies. Fire is direct, action-oriented, and expressive; Water is subtle, intuitive, and deeply feeling. At its best, Fire warms Water\'s depths and Water tempers Fire\'s recklessness, creating steam — a powerful creative and emotional force. At its worst, Water drowns Fire\'s enthusiasm and Fire scalds Water\'s sensitivity. This relationship requires exceptional patience and a genuine desire to understand someone who experiences the world completely differently from you.',
    s: ['Profound passion and emotional intensity that neither finds elsewhere', 'Fire gives Water courage and confidence; Water gives Fire emotional wisdom', 'When balanced, you create something transformative — steam that moves mountains'],
    c: ['Fire\'s directness can wound Water\'s sensitivity deeply', 'Water\'s moodiness and need for emotional processing can exhaust Fire\'s patience'],
    a: 'Fire: slow down and listen without trying to fix. Water: say what you need directly instead of expecting Fire to intuit it. Your differences are your greatest teacher.',
  },
  Water_Water: {
    p: 'Two Water signs together create a relationship of extraordinary emotional depth. You understand each other\'s inner world intuitively, often communicating without words. The empathy between you is almost psychic, and the emotional intimacy can reach levels other pairings only dream of. The danger is drowning: two highly emotional people can amplify each other\'s moods, creating spirals of anxiety, sadness, or codependency. Without a grounding influence, this relationship can lose itself in feeling.',
    s: ['Almost telepathic emotional understanding and deep spiritual intimacy', 'Unconditional empathy — you feel truly seen and safe with each other', 'Rich inner world that you share through art, dreams, and intuitive connection'],
    c: ['Emotional amplification — one person\'s mood easily overtakes both of you', 'Tendency toward codependency, avoidance of practical responsibilities, or escapism'],
    a: 'Cultivate individual grounding practices: exercise, time in nature, separate friendships. Your emotional connection is a rare gift — protect it by maintaining your individual emotional health.',
  },
};

const ASPECT_DETAIL = [
  'The conjunction (same sign) amplifies everything — you mirror each other, for better and for worse. Shared traits create effortless understanding but also amplified blind spots.',
  'The semi-sextile creates a subtle, muted connection. You are neighbors in the zodiac but speak slightly different languages, requiring conscious effort to bridge.',
  'The sextile is one of the most harmonious aspects. Your energies flow together naturally, creating easy collaboration, friendship, and mutual support without effort.',
  'The square creates powerful friction and dynamic tension. This is a challenging aspect that forces growth — arguments are frequent but so are breakthroughs. Never boring.',
  'The trine is the most naturally harmonious aspect in astrology. Your energies support each other effortlessly, creating a sense of ease, flow, and mutual understanding that feels destined.',
  'The quincunx is the aspect of adjustment. You approach life from fundamentally different angles, creating a persistent feeling of misalignment that requires constant, conscious recalibration.',
  'The opposition creates a magnetic pull of attraction between complementary forces. You see in each other what you lack in yourself. Fascinating and frustrating in equal measure.',
];

function westernCompat(sign1, sign2) {
  const el1 = SIGN_ELEMENTS[sign1], el2 = SIGN_ELEMENTS[sign2];
  const mod1 = SIGN_MODALITIES[sign1], mod2 = SIGN_MODALITIES[sign2];
  const rawDist = (SIGN_IDX[sign1] - SIGN_IDX[sign2] + 12) % 12;
  const dist = Math.min(rawDist, 12 - rawDist);

  const elScore = EL_COMPAT[sortedKey(el1, el2)] || 60;
  const modScore = MOD_COMPAT[sortedKey(mod1, mod2)] || 60;
  const aBonus = ASPECT_BONUS[dist] || 0;
  const polBonus = (SIGN_IDX[sign1] % 2 === SIGN_IDX[sign2] % 2) ? 4 : 0;

  const raw = elScore * 0.4 + modScore * 0.25 + 60 * 0.2 + 60 * 0.15 + aBonus + polBonus;
  const score = clamp(Math.round(raw), 25, 99);

  const aspectLabel = ASPECT_NAME[dist];
  const aspectScore = clamp(60 + aBonus * 3, 25, 99);
  const elData = EL_DETAIL[sortedKey(el1, el2)] || EL_DETAIL.Fire_Fire;

  const summary = verdictFor(score, [
    [80, 'Your stars dance in powerful harmony.'],
    [65, 'A vibrant connection with magnetic pull.'],
    [50, 'Productive tension that fuels growth.'],
    [0, 'Different rhythms that teach patience.'],
  ]);

  const detail = `${sign1} (${el1}) and ${sign2} (${el2}) form a ${aspectLabel.toLowerCase()} aspect.\n\n${elData.p}\n\n${ASPECT_DETAIL[dist]}`;

  return {
    score, summary, detail,
    strengths: elData.s,
    challenges: elData.c,
    advice: elData.a,
    factors: [
      { label: 'Element Harmony', value: `${el1} + ${el2}`, score: elScore },
      { label: 'Modality Match', value: `${mod1} + ${mod2}`, score: modScore },
      { label: 'Sign Aspect', value: aspectLabel, score: aspectScore },
    ],
  };
}

/* ══════════════════════════════════════════════════════
   2. VEDIC — ASHTAKOOT MILAN
   ══════════════════════════════════════════════════════ */
const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Moola','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
];
const NAK_RASHI = [0,0,1,1,2,2,2,3,3,4,4,5,5,6,6,6,7,7,8,8,9,9,10,10,10,11,11];
const NAK_GANA = [0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
const NAK_YONI = [
  'Horse','Elephant','Goat','Snake','Snake','Dog','Cat','Goat','Cat',
  'Rat','Rat','Cow','Buffalo','Tiger','Buffalo','Tiger','Deer','Deer',
  'Dog','Monkey','Mongoose','Monkey','Lion','Horse','Lion','Cow','Elephant',
];
const YONI_ENEMIES = { Horse:'Buffalo', Buffalo:'Horse', Elephant:'Lion', Lion:'Elephant',
  Goat:'Monkey', Monkey:'Goat', Snake:'Mongoose', Mongoose:'Snake', Dog:'Deer', Deer:'Dog',
  Cat:'Rat', Rat:'Cat', Cow:'Tiger', Tiger:'Cow' };
const RASHI_LORD = [3,5,4,1,0,4,5,3,6,7,7,6];
const PLANET_FRIENDS = {
  0: { f: [1,3,6], e: [5,7] }, 1: { f: [0,4], e: [] }, 3: { f: [0,1,6], e: [4] },
  4: { f: [0,5], e: [1] }, 5: { f: [4,7], e: [0,1] }, 6: { f: [0,1,3], e: [4,5] }, 7: { f: [4,5], e: [0,1,3] },
};
const RASHI_VARNA = [2,1,0,3,2,1,0,3,2,1,0,3];
const GANA_PTS = [[6,5,1],[5,6,0],[1,0,6]];
const BHAKUT_PTS = [7,0,7,7,7,0,0,0,7,7,7,0];
const GANA_NAMES = ['Deva (Divine)','Manushya (Human)','Rakshasa (Fierce)'];

function birthNakshatra(bd) {
  const [y, m, d] = bd.split('-').map(Number);
  const start = new Date(y, 0, 1);
  const curr = new Date(y, m - 1, d);
  const doy = Math.floor((curr - start) / 86400000);
  return ((doy + y * 13) % 27 + 27) % 27;
}

function maitriScore(lord1, lord2) {
  if (lord1 === lord2) return 5;
  const f1 = PLANET_FRIENDS[lord1] || { f: [], e: [] };
  const f2 = PLANET_FRIENDS[lord2] || { f: [], e: [] };
  const r1 = f1.f.includes(lord2) ? 'F' : f1.e.includes(lord2) ? 'E' : 'N';
  const r2 = f2.f.includes(lord1) ? 'F' : f2.e.includes(lord1) ? 'E' : 'N';
  return { FF:5,FN:4,NF:4,NN:3,FE:2,EF:2,NE:1,EN:1,EE:0 }[r1 + r2] || 2;
}

function vedicCompat(p1, p2) {
  const nak1 = birthNakshatra(p1.bd), nak2 = birthNakshatra(p2.bd);
  const r1 = NAK_RASHI[nak1], r2 = NAK_RASHI[nak2];

  const varna = RASHI_VARNA[r1] >= RASHI_VARNA[r2] ? 1 : 0;
  const eGrp1 = Math.floor(r1 / 3), eGrp2 = Math.floor(r2 / 3);
  const vashya = eGrp1 === eGrp2 ? 2 : Math.abs(eGrp1 - eGrp2) <= 1 ? 1 : 0;
  const taraRem = ((nak2 - nak1 + 27) % 27) % 9;
  const tara = [3,0,3,0,3,0,3,0,3][taraRem];
  const y1 = NAK_YONI[nak1], y2 = NAK_YONI[nak2];
  const yoni = y1 === y2 ? 4 : YONI_ENEMIES[y1] === y2 ? 0 : 2;
  const maitri = maitriScore(RASHI_LORD[r1], RASHI_LORD[r2]);
  const gana = GANA_PTS[NAK_GANA[nak1]][NAK_GANA[nak2]];
  const bhakut = BHAKUT_PTS[(r2 - r1 + 12) % 12];
  const nadi = (nak1 % 3) !== (nak2 % 3) ? 8 : 0;

  const total = varna + vashya + tara + yoni + maitri + gana + bhakut + nadi;
  const score = clamp(Math.round(total / 36 * 100), 15, 99);

  const kootaNames = ['Varna','Vashya','Tara','Yoni','Graha Maitri','Gana','Bhakut','Nadi'];
  const kootaMaxes = [1,2,3,4,5,6,7,8];
  const kootaVals = [varna, vashya, tara, yoni, maitri, gana, bhakut, nadi];

  const summary = verdictFor(score, [
    [75, 'Highly auspicious \u2014 the stars bless this union.'],
    [55, 'Good compatibility with manageable doshas.'],
    [40, 'Moderate match \u2014 remedies may enhance harmony.'],
    [0, 'Challenging alignment \u2014 devotion and effort required.'],
  ]);

  // Rich detail
  const nadiNote = nadi === 0
    ? 'Nadi Dosha is present (same nadi), which traditionally indicates health and genetic concerns. Vedic remedies like Nadi Nivaran Puja are recommended.'
    : 'Nadi compatibility is favorable \u2014 different nadis indicate complementary constitutions and healthy progeny.';
  const ganaNote = gana >= 5
    ? `Your temperaments (${GANA_NAMES[NAK_GANA[nak1]]} and ${GANA_NAMES[NAK_GANA[nak2]]}) are naturally harmonious, suggesting emotional compatibility and shared values.`
    : gana >= 1
    ? `Your temperaments (${GANA_NAMES[NAK_GANA[nak1]]} and ${GANA_NAMES[NAK_GANA[nak2]]}) differ significantly. This creates passionate chemistry but also frequent misunderstandings about priorities and lifestyle.`
    : `Your temperaments (${GANA_NAMES[NAK_GANA[nak1]]} and ${GANA_NAMES[NAK_GANA[nak2]]}) are traditionally considered incompatible. This demands exceptional patience, mutual respect, and conscious effort to bridge very different worldviews.`;
  const yoniNote = yoni === 4 ? 'Your yoni animals match, indicating strong physical and intimate compatibility.'
    : yoni === 0 ? 'Your yoni animals are natural enemies, suggesting physical tension and differing needs in intimacy. Awareness and communication are essential.'
    : 'Your yoni compatibility is moderate \u2014 neither strongly aligned nor opposed in physical and intimate matters.';

  const detail = `Your Ashtakoot score is ${total} out of 36 Gunas. Nakshatra alignment: ${NAKSHATRAS[nak1]} and ${NAKSHATRAS[nak2]}.\n\n` +
    (total >= 25 ? 'This is considered a highly auspicious match in Vedic tradition. The majority of your eight compatibility dimensions align favorably, indicating natural harmony in temperament, spiritual orientation, health, and long-term prosperity. Matches above 25 Gunas have historically been regarded as blessed unions.'
    : total >= 18 ? 'This score meets the traditional threshold for an acceptable match (18+ Gunas). While not every dimension is perfectly aligned, the foundation is strong enough to build a fulfilling partnership. The areas where you score lower represent growth opportunities rather than dealbreakers.'
    : 'This alignment falls below the traditional 18-Guna threshold, indicating significant differences in key compatibility dimensions. In Vedic tradition, this does not mean the relationship is impossible \u2014 it means extra awareness, communication, and potentially traditional remedies are advisable.') +
    `\n\n${ganaNote}\n\n${nadiNote}\n\n${yoniNote}`;

  const strengths = [];
  if (bhakut === 7) strengths.push('Bhakut (sign harmony) is favorable \u2014 supports love, financial stability, and mutual respect');
  if (maitri >= 4) strengths.push('Strong Graha Maitri \u2014 your ruling planets are natural friends, creating psychological compatibility');
  if (gana >= 5) strengths.push('Temperamental harmony (Gana) \u2014 you naturally understand each other\'s emotional rhythm');
  if (nadi === 8) strengths.push('Different nadis \u2014 complementary constitutions support health and vitality together');
  if (tara === 3) strengths.push('Tara (destiny) alignment is favorable \u2014 your life paths support each other\'s growth');
  if (strengths.length === 0) strengths.push('Every relationship has hidden strengths \u2014 your differences can become your greatest teachers');

  const challenges = [];
  if (nadi === 0) challenges.push('Nadi Dosha present \u2014 same constitutional type may create health or compatibility friction');
  if (gana <= 1) challenges.push('Gana mismatch \u2014 fundamentally different temperaments require conscious bridging');
  if (bhakut === 0) challenges.push('Bhakut Dosha \u2014 sign distance creates challenges in love expression and financial harmony');
  if (yoni === 0) challenges.push('Yoni incompatibility \u2014 physical and intimate needs may frequently misalign');
  if (maitri <= 1) challenges.push('Planetary lords are unfriendly \u2014 psychological wavelengths differ, requiring patience in communication');
  if (challenges.length === 0) challenges.push('No major doshas detected \u2014 minor friction areas are normal and manageable');

  const advice = total >= 25
    ? 'This is a strong Vedic match. Honor this alignment by building shared spiritual practices and maintaining gratitude for your natural compatibility.'
    : total >= 18
    ? 'Focus your attention on the weaker kootas. Where Gana or Nadi scores are low, conscious effort and traditional remedies like mantra chanting or gemstone wearing can significantly improve harmony.'
    : 'Consider consulting a Vedic astrologer for specific remedies. Nadi Nivaran Puja, specific gemstones, and charitable acts on auspicious days can help bridge the gaps indicated by your koota scores.';

  return {
    score, summary, detail, strengths, challenges, advice,
    factors: kootaNames.map((name, i) => ({
      label: name, value: `${kootaVals[i]}/${kootaMaxes[i]}`, score: clamp(Math.round(kootaVals[i] / kootaMaxes[i] * 100), 5, 100),
    })),
  };
}

/* ══════════════════════════════════════════════════════
   3. CHINESE ZODIAC COMPATIBILITY
   ══════════════════════════════════════════════════════ */
const CN_ANIMALS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const CN_ELEMENTS = ['Metal','Water','Wood','Fire','Earth'];
const CN_EMOJIS = { Rat:'\uD83D\uDC00', Ox:'\uD83D\uDC02', Tiger:'\uD83D\uDC05', Rabbit:'\uD83D\uDC07', Dragon:'\uD83D\uDC09', Snake:'\uD83D\uDC0D',
  Horse:'\uD83D\uDC0E', Goat:'\uD83D\uDC10', Monkey:'\uD83D\uDC12', Rooster:'\uD83D\uDC13', Dog:'\uD83D\uDC15', Pig:'\uD83D\uDC16' };
const CN_SECRET_FRIENDS = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
const CN_HARM_PAIRS = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
const WX_GENERATES = [1,2,3,4,0];
const WX_CONTROLS = [2,3,4,0,1];

function cnAnimal(year) { return (year - 4 + 1200) % 12; }
function cnElement(year) { return Math.floor(((year - 4 + 1200) % 10) / 2); }

function wuXingScore(e1, e2) {
  if (e1 === e2) return 80;
  if (WX_GENERATES[e1] === e2) return 85;
  if (WX_GENERATES[e2] === e1) return 75;
  if (WX_CONTROLS[e1] === e2) return 50;
  if (WX_CONTROLS[e2] === e1) return 45;
  return 60;
}

function isPair(pairs, a, b) { return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a)); }

const CN_REL_DETAIL = {
  'Trine Harmony': {
    p: 'Trine animals share the same fundamental approach to life. You are part of the same elemental triangle, meaning your instincts, values, and natural rhythms align deeply. This is one of the strongest bonds in Chinese astrology \u2014 you understand each other without explanation and support each other\'s goals naturally. The ease of this connection can sometimes lead to complacency; you may take each other for granted precisely because things flow so well.',
    s: ['Deep instinctive understanding \u2014 you just "get" each other', 'Shared values and life approach create natural partnership', 'Strong mutual support during difficult times'],
    c: ['The relationship can feel too comfortable, leading to stagnation', 'Similar blind spots may go unchecked without outside perspective'],
  },
  'Same Animal': {
    p: 'Two of the same animal create a mirror relationship. You see yourself reflected in your partner \u2014 both the qualities you love and the ones you struggle with. This creates instant recognition and understanding, but also amplifies shared weaknesses. Two Rats may both be clever but also both secretive. Two Tigers are both brave but also both stubborn. The key is using your shared nature as a foundation while consciously addressing your shared vulnerabilities.',
    s: ['Instant recognition and deep mutual understanding', 'Shared strengths compound \u2014 you amplify each other\'s best qualities', 'Natural empathy for each other\'s struggles and motivations'],
    c: ['Shared weaknesses are doubled with no counterbalance', 'Competition can arise from occupying the same energetic niche'],
  },
  'Secret Friends': {
    p: 'Secret Friends is one of the most beautiful relationships in Chinese astrology. This bond operates beneath the surface \u2014 a quiet, powerful connection that others may not see or understand. You provide each other with something essential that the outside world cannot. There is a sense of private understanding and mutual protection in this pairing. Secret Friends often feel like they have known each other forever, even from the first meeting.',
    s: ['A deep, private bond that feels destined and effortless', 'You provide each other with emotional shelter and understanding', 'The connection strengthens over time rather than fading'],
    c: ['The subtlety of the bond may be undervalued \u2014 it is quiet, not dramatic', 'Others may not understand or respect the depth of your connection'],
  },
  'Direct Clash': {
    p: 'The Direct Clash is the most challenging relationship in Chinese astrology. Your animals sit directly opposite each other on the zodiac wheel, representing fundamentally opposed energies. This creates intense attraction alongside intense friction \u2014 you fascinate each other precisely because you are so different. Arguments can be explosive, and compromise feels like sacrifice rather than collaboration. However, clash relationships that survive the initial turbulence often become extraordinarily strong, because both partners are forced to grow beyond their natural limitations.',
    s: ['Powerful magnetic attraction \u2014 the chemistry is undeniable', 'Forces both partners into significant personal growth', 'If you survive the friction, the bond becomes unbreakable'],
    c: ['Fundamental disagreements on values, priorities, and lifestyle', 'Arguments can be explosive and deeply wounding', 'Requires constant conscious effort to maintain peace'],
  },
  'Harm Pair': {
    p: 'The Harm relationship creates a subtle but persistent form of friction. Unlike the Direct Clash (which is explosive), the Harm dynamic operates through slow erosion \u2014 small irritations that accumulate over time, misunderstandings that seem minor but never fully resolve, and a vague sense that something is slightly off. The good news is that Harm relationships respond very well to awareness. Once both partners understand the dynamic, they can consciously interrupt the pattern and build genuine appreciation for their differences.',
    s: ['The friction is subtle and manageable with awareness', 'Both partners develop exceptional patience and communication skills', 'Overcoming the Harm dynamic creates deep mutual respect'],
    c: ['Small irritations accumulate into larger resentments if unaddressed', 'A persistent feeling of being slightly misunderstood by your partner'],
  },
  'Neutral': {
    p: 'Your animals do not share a strong traditional bond \u2014 neither deeply harmonious nor actively conflicting. This is actually a liberating position: you are free to define the relationship on your own terms without the weight of cosmic expectation pulling you in one direction. Neutral pairings often develop into uniquely balanced partnerships because neither person feels predetermined pressure. The connection you build is entirely your own creation.',
    s: ['Freedom to define the relationship without cosmic predisposition', 'Neither strong friction nor complacency \u2014 a balanced starting point', 'Whatever bond you build is genuinely earned and personally meaningful'],
    c: ['No natural cosmic "glue" \u2014 the connection requires intentional building', 'May lack the instant recognition or excitement of strongly bonded pairs'],
  },
};

function chineseCompat(p1, p2) {
  const a1 = cnAnimal(p1.y), a2 = cnAnimal(p2.y);
  const e1 = cnElement(p1.y), e2 = cnElement(p2.y);
  const animal1 = CN_ANIMALS[a1], animal2 = CN_ANIMALS[a2];
  const elem1 = CN_ELEMENTS[e1], elem2 = CN_ELEMENTS[e2];

  let base = 60, relation = 'Neutral';
  if (a1 % 4 === a2 % 4 && a1 !== a2) { base += 18; relation = 'Trine Harmony'; }
  else if (a1 === a2) { base += 10; relation = 'Same Animal'; }
  else if (isPair(CN_SECRET_FRIENDS, a1, a2)) { base += 12; relation = 'Secret Friends'; }
  else if (Math.abs(a1 - a2) === 6) { base -= 18; relation = 'Direct Clash'; }
  else if (isPair(CN_HARM_PAIRS, a1, a2)) { base -= 12; relation = 'Harm Pair'; }

  const wxScore = wuXingScore(e1, e2);
  const elBonus = Math.round((wxScore - 60) * 0.3);
  base += elBonus;
  const score = clamp(base, 20, 99);

  const relData = CN_REL_DETAIL[relation] || CN_REL_DETAIL.Neutral;
  const wxRel = e1 === e2 ? 'same element \u2014 you share a fundamental energetic quality'
    : WX_GENERATES[e1] === e2 ? `${elem1} generates ${elem2} \u2014 a nurturing, supportive flow`
    : WX_GENERATES[e2] === e1 ? `${elem2} generates ${elem1} \u2014 you are nourished by your partner\'s energy`
    : WX_CONTROLS[e1] === e2 ? `${elem1} controls ${elem2} \u2014 a dominating dynamic that requires balance`
    : WX_CONTROLS[e2] === e1 ? `${elem2} controls ${elem1} \u2014 you may feel constrained by your partner\'s energy`
    : 'a neutral elemental relationship with room for both independence and connection';

  const summary = verdictFor(score, [
    [78, `${animal1} and ${animal2} share profound celestial harmony.`],
    [60, `${animal1} and ${animal2} complement each other naturally.`],
    [45, `${animal1} and ${animal2} create dynamic energy together.`],
    [0, `${animal1} and ${animal2} face cosmic friction to overcome.`],
  ]);
  const detail = `${CN_EMOJIS[animal1]} ${animal1} (${elem1}) meets ${CN_EMOJIS[animal2]} ${animal2} (${elem2}). Relationship type: ${relation}.\n\n${relData.p}\n\nElementally, you share ${wxRel}. In Chinese philosophy, the elemental relationship shapes how your energies interact in daily life \u2014 whether one partner naturally supports, challenges, or balances the other.`;

  return {
    score, summary, detail,
    strengths: relData.s,
    challenges: relData.c,
    advice: relation === 'Direct Clash'
      ? 'Patience is not optional \u2014 it is the price of admission. Create clear boundaries, respect each other\'s territory, and never argue when either of you is tired or hungry.'
      : relation === 'Harm Pair'
      ? 'Address small frustrations immediately rather than letting them accumulate. A weekly check-in where you share one appreciation and one request works wonders.'
      : 'Honor your natural dynamic and build on its strengths. Whether your bond is easy or challenging, the Chinese zodiac teaches that awareness transforms destiny.',
    factors: [
      { label: 'Animal Bond', value: relation, score: clamp(Math.round((base - elBonus) / 78 * 100), 10, 99) },
      { label: 'Element Cycle', value: `${elem1} + ${elem2}`, score: wxScore },
      { label: 'Trine Group', value: a1 % 4 === a2 % 4 ? 'Aligned' : 'Different', score: a1 % 4 === a2 % 4 ? 88 : 50 },
    ],
  };
}

/* ══════════════════════════════════════════════════════
   4. BAZI (FOUR PILLARS) — with optional hour pillar
   ══════════════════════════════════════════════════════ */
const STEMS = ['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'];
const BRANCHES = ['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'];
const STEM_EL = [2,2,3,3,4,4,0,0,1,1];
const BRANCH_EL = [1,4,2,2,4,3,3,4,0,0,4,1];
const COMBOS = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];

function dayStemBranch(y, m, d) {
  const jdn = julianDay(y, m, d);
  return { stem: ((jdn + 9) % 10 + 10) % 10, branch: ((jdn + 9) % 12 + 12) % 12 };
}
function yearStemBranch(y) {
  return { stem: ((y - 4) % 10 + 10) % 10, branch: ((y - 4) % 12 + 12) % 12 };
}
function hourBranch(timeStr) {
  if (!timeStr) return -1;
  const [h] = timeStr.split(':').map(Number);
  if (isNaN(h)) return -1;
  return Math.floor(((h + 1) % 24) / 2);
}
function hourStem(dayStem, hBranch) {
  if (hBranch < 0) return -1;
  const base = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8][dayStem];
  return (base + hBranch) % 10;
}

const WX_REL = {
  same: { label: 'Same Element', desc: 'Your Day Masters share the same element, meaning your core nature, decision-making style, and fundamental energy are deeply similar. You intuitively understand what drives each other. The risk is that you share the same blind spots and may lack the complementary energy needed for balance.' },
  generates: { label: 'Generating', desc: 'One Day Master\'s element naturally nourishes the other. This creates a supportive, nurturing dynamic where one partner strengthens and fuels the other\'s energy. It is a beautiful flow, though the "giver" should ensure they are also receiving nourishment in return.' },
  generated: { label: 'Being Generated', desc: 'Your element is nourished by your partner\'s fundamental energy. You feel supported and strengthened by their presence. Be mindful of reciprocity \u2014 ensure your partner also feels cared for, not just cast in the role of provider.' },
  controls: { label: 'Controlling', desc: 'Your Day Master\'s element dominates your partner\'s. This can manifest as one partner naturally taking charge, setting the agenda, or unintentionally overwhelming the other. Awareness of this dynamic is essential to prevent it from becoming an unhealthy power imbalance.' },
  controlled: { label: 'Being Controlled', desc: 'Your partner\'s element has a natural authority over yours. You may sometimes feel constrained, overruled, or overshadowed. This dynamic is not inherently negative \u2014 structure and guidance have value \u2014 but it must be balanced with mutual respect and equal voice.' },
  neutral: { label: 'Neutral', desc: 'Your Day Master elements have no direct generating or controlling relationship. This gives you a clean slate \u2014 neither predisposed toward friction nor toward effortless flow. The relationship you create is defined by your choices rather than elemental destiny.' },
};

function getWxRel(e1, e2) {
  if (e1 === e2) return WX_REL.same;
  if (WX_GENERATES[e1] === e2) return WX_REL.generates;
  if (WX_GENERATES[e2] === e1) return WX_REL.generated;
  if (WX_CONTROLS[e1] === e2) return WX_REL.controls;
  if (WX_CONTROLS[e2] === e1) return WX_REL.controlled;
  return WX_REL.neutral;
}

function baziCompat(p1, p2) {
  const day1 = dayStemBranch(p1.y, p1.m, p1.d), day2 = dayStemBranch(p2.y, p2.m, p2.d);
  const yr1 = yearStemBranch(p1.y), yr2 = yearStemBranch(p2.y);
  const dmEl1 = STEM_EL[day1.stem], dmEl2 = STEM_EL[day2.stem];
  const dmScore = wuXingScore(dmEl1, dmEl2);

  let branchRel = 'Neutral', branchScore = 60;
  const b1 = day1.branch, b2 = day2.branch;
  if (isPair(COMBOS, b1, b2)) { branchRel = 'Six Harmony'; branchScore = 90; }
  else if ((b1 + 6) % 12 === b2 || (b2 + 6) % 12 === b1) { branchRel = 'Six Clash'; branchScore = 25; }
  else if (b1 === b2) { branchRel = 'Self Penalty'; branchScore = 50; }

  let yrRel = 'Neutral', yrScore = 60;
  const yb1 = yr1.branch, yb2 = yr2.branch;
  if (isPair(COMBOS, yb1, yb2)) { yrRel = 'Six Harmony'; yrScore = 88; }
  else if ((yb1 + 6) % 12 === yb2 || (yb2 + 6) % 12 === yb1) { yrRel = 'Six Clash'; yrScore = 30; }

  // Hour pillar if birth time available
  let hourNote = '';
  const factors = [
    { label: 'Day Master', value: `${CN_ELEMENTS[dmEl1]} + ${CN_ELEMENTS[dmEl2]}`, score: dmScore },
    { label: 'Day Branch', value: branchRel, score: branchScore },
    { label: 'Year Branch', value: yrRel, score: yrScore },
  ];
  const hb1 = hourBranch(p1.bt), hb2 = hourBranch(p2.bt);
  let hourScore = -1;
  if (hb1 >= 0 && hb2 >= 0) {
    let hRel = 'Neutral'; hourScore = 60;
    if (isPair(COMBOS, hb1, hb2)) { hRel = 'Six Harmony'; hourScore = 88; }
    else if ((hb1 + 6) % 12 === hb2 || (hb2 + 6) % 12 === hb1) { hRel = 'Six Clash'; hourScore = 30; }
    else if (hb1 === hb2) { hRel = 'Same Hour'; hourScore = 70; }
    factors.push({ label: 'Hour Pillar', value: `${BRANCHES[hb1]} + ${BRANCHES[hb2]} (${hRel})`, score: hourScore });
    hourNote = `\n\nHour Pillar (${BRANCHES[hb1]} and ${BRANCHES[hb2]}): The hour pillar represents your innermost self and private desires. Your hour branches form a ${hRel.toLowerCase()} relationship, ` +
      (hourScore >= 70 ? 'suggesting your private selves are naturally compatible \u2014 what you each need in intimate moments aligns well.' : 'indicating your inner emotional needs may differ, requiring extra understanding in private life.');
  } else {
    hourNote = '\n\nBirth time was not provided for both partners. Adding birth time unlocks the Hour Pillar \u2014 the most intimate layer of BaZi compatibility, revealing how your private selves interact.';
  }

  const weights = hourScore >= 0 ? [0.35, 0.25, 0.2, 0.2] : [0.4, 0.35, 0.25];
  const scores = hourScore >= 0 ? [dmScore, branchScore, yrScore, hourScore] : [dmScore, branchScore, yrScore];
  const score = clamp(Math.round(scores.reduce((s, v, i) => s + v * weights[i], 0)), 20, 99);

  const wxRel = getWxRel(dmEl1, dmEl2);

  const summary = verdictFor(score, [
    [75, 'Your Four Pillars create a powerful union of energies.'],
    [55, 'A balanced BaZi pairing with complementary pillars.'],
    [40, 'Your pillars create tension that drives transformation.'],
    [0, 'Opposing pillar energies that demand mutual flexibility.'],
  ]);

  const branchDetail = branchRel === 'Six Harmony'
    ? 'Your day branches form a Six Harmony (Liu He) \u2014 one of the most favorable branch interactions in BaZi. This indicates natural domestic compatibility and smooth day-to-day life together.'
    : branchRel === 'Six Clash'
    ? 'Your day branches form a Six Clash (Liu Chong) \u2014 the most challenging branch interaction. Daily life together may feel like a constant negotiation. This demands exceptional communication and willingness to compromise.'
    : branchRel === 'Self Penalty'
    ? 'Your day branches are identical, creating a Self Penalty (Zi Xing). While you understand each other deeply, you also magnify each other\'s weaknesses and may struggle with repeating the same patterns.'
    : 'Your day branches have a neutral interaction \u2014 neither strongly harmonious nor conflicting in daily life.';

  const detail = `Day Master: ${STEMS[day1.stem]} ${CN_ELEMENTS[dmEl1]} meets ${STEMS[day2.stem]} ${CN_ELEMENTS[dmEl2]}. ${wxRel.label} relationship.\n\n${wxRel.desc}\n\n${branchDetail}${hourNote}`;

  const strengths = [];
  if (dmScore >= 75) strengths.push('Day Master elements support and nourish each other naturally');
  if (branchScore >= 80) strengths.push('Day branch Six Harmony creates smooth daily domestic life');
  if (yrScore >= 80) strengths.push('Year branch harmony \u2014 your social and family lives align well');
  if (hourScore >= 70) strengths.push('Hour pillar compatibility \u2014 your private, intimate selves resonate');
  if (strengths.length === 0) strengths.push('BaZi challenges create opportunities for profound personal growth through partnership');

  const challenges = [];
  if (dmScore <= 50) challenges.push(`${wxRel.label} Day Master dynamic \u2014 one element may dominate, creating power imbalance`);
  if (branchScore <= 30) challenges.push('Day branch Six Clash \u2014 daily friction in routines, preferences, and lifestyle');
  if (yrScore <= 35) challenges.push('Year branch clash \u2014 family backgrounds or social circles may conflict');
  if (hourScore >= 0 && hourScore <= 35) challenges.push('Hour pillar clash \u2014 your private emotional needs may frequently misalign');
  if (challenges.length === 0) challenges.push('No major pillar clashes detected \u2014 minor friction areas are manageable with awareness');

  return {
    score, summary, detail, strengths, challenges,
    advice: hourScore < 0
      ? 'For the most accurate BaZi reading, provide both partners\' birth times. The Hour Pillar reveals your deepest compatibility layer. Focus on balancing your Day Master elements through conscious give-and-take.'
      : 'Pay attention to the pillar that scored lowest \u2014 that is where conscious effort will yield the greatest improvement. BaZi teaches that awareness of elemental dynamics is the first step to mastering them.',
    factors,
  };
}

/* ══════════════════════════════════════════════════════
   5. NUMEROLOGY COMPATIBILITY
   ══════════════════════════════════════════════════════ */
const LP_COMPAT = {
  '1_1':72,'1_2':58,'1_3':85,'1_4':52,'1_5':82,'1_6':62,'1_7':78,'1_8':72,'1_9':68,
  '2_2':76,'2_3':72,'2_4':82,'2_5':45,'2_6':90,'2_7':55,'2_8':58,'2_9':68,
  '3_3':70,'3_4':48,'3_5':88,'3_6':78,'3_7':58,'3_8':52,'3_9':82,
  '4_4':65,'4_5':42,'4_6':82,'4_7':72,'4_8':88,'4_9':52,
  '5_5':68,'5_6':48,'5_7':82,'5_8':58,'5_9':78,
  '6_6':78,'6_7':52,'6_8':58,'6_9':92,
  '7_7':72,'7_8':52,'7_9':62,
  '8_8':68,'8_9':55,
  '9_9':72,
};
const LP_TITLES = {
  1:'Leader', 2:'Diplomat', 3:'Creative', 4:'Builder', 5:'Adventurer',
  6:'Nurturer', 7:'Seeker', 8:'Powerhouse', 9:'Humanitarian',
  11:'Illuminator', 22:'Master Builder', 33:'Master Teacher',
};
const LP_DESC = {
  1: 'Independent, ambitious, and pioneering. Needs autonomy and respect for their drive.',
  2: 'Sensitive, cooperative, and diplomatic. Thrives on partnership and emotional connection.',
  3: 'Expressive, joyful, and creative. Needs outlets for imagination and social energy.',
  4: 'Disciplined, reliable, and grounded. Values stability, order, and tangible results.',
  5: 'Restless, adventurous, and freedom-loving. Needs variety, travel, and sensory experience.',
  6: 'Nurturing, responsible, and family-oriented. Lives to love, serve, and create harmony.',
  7: 'Introspective, analytical, and spiritual. Needs solitude, depth, and intellectual stimulation.',
  8: 'Ambitious, authoritative, and material. Driven by achievement, status, and financial mastery.',
  9: 'Compassionate, idealistic, and generous. Motivated by humanitarian vision and universal love.',
  11: 'Visionary and spiritually gifted. Carries the sensitivity of 2 amplified by intuitive power.',
  22: 'A master manifestor who turns grand visions into reality. Carries 4\'s discipline at cosmic scale.',
  33: 'The master teacher and healer. Carries 6\'s nurturing at a selfless, universal level.',
};

function numerologyCompat(userForm, partnerForm) {
  const lp1 = lifePath(userForm?.birth_date || '1990-01-01');
  const lp2 = lifePath(partnerForm?.birth_date || '1990-01-01');
  const r1 = lp1 > 9 ? reduceNumber(lp1 % 10 + Math.floor(lp1 / 10)) : lp1;
  const r2 = lp2 > 9 ? reduceNumber(lp2 % 10 + Math.floor(lp2 / 10)) : lp2;
  const key = [Math.min(r1, r2), Math.max(r1, r2)].join('_');
  const baseScore = LP_COMPAT[key] || 60;

  const nameVal = (s) => (s || '').toUpperCase().split('').reduce((a, c) => { const v = c.charCodeAt(0) - 64; return a + (v >= 1 && v <= 26 ? v : 0); }, 0);
  const exp1 = reduceNumber(nameVal(userForm?.full_name));
  const exp2 = reduceNumber(nameVal(partnerForm?.full_name));
  const expKey = [Math.min(exp1 || 1, exp2 || 1), Math.max(exp1 || 1, exp2 || 1)].join('_');
  const expScore = LP_COMPAT[expKey] || 60;

  const hasNames = !!(userForm?.full_name && partnerForm?.full_name);
  const score = hasNames ? clamp(Math.round(baseScore * 0.6 + expScore * 0.4), 20, 99) : clamp(baseScore, 20, 99);

  const t1 = LP_TITLES[lp1] || LP_TITLES[r1] || 'Unknown', t2 = LP_TITLES[lp2] || LP_TITLES[r2] || 'Unknown';
  const d1 = LP_DESC[lp1] || LP_DESC[r1] || '', d2 = LP_DESC[lp2] || LP_DESC[r2] || '';

  const summary = verdictFor(score, [
    [80, `The ${t1} and the ${t2} vibrate in beautiful resonance.`],
    [60, `${t1} energy complements ${t2} energy nicely.`],
    [45, `The ${t1} and ${t2} paths create stimulating contrast.`],
    [0, 'Different numerical vibrations that require conscious bridging.'],
  ]);

  const detail = `Life Path ${lp1} (The ${t1}) meets Life Path ${lp2} (The ${t2}).\n\n` +
    `The ${t1}: ${d1}\n\nThe ${t2}: ${d2}\n\n` +
    (baseScore >= 80 ? `These two life paths are deeply aligned. The ${t1} and the ${t2} share complementary core values and naturally support each other\'s growth trajectory. Conversations flow easily, goals align naturally, and both partners feel understood at a fundamental level.`
    : baseScore >= 60 ? `The ${t1} and the ${t2} have enough common ground to build a strong partnership, with enough difference to keep things interesting. Where one is strong, the other may be developing \u2014 creating a natural mentoring dynamic that benefits both.`
    : `The ${t1} and the ${t2} operate on different frequencies. What motivates and energizes one may puzzle or frustrate the other. This is not a barrier to love, but it does require both partners to actively learn each other\'s language and respect fundamentally different life orientations.`) +
    (hasNames ? `\n\nExpression numbers ${exp1} (${LP_TITLES[exp1] || ''}) and ${exp2} (${LP_TITLES[exp2] || ''}) reveal how you express yourselves outwardly. ${expScore >= 70 ? 'Your external personas complement each other well.' : 'Your outward expression styles differ, which can create misunderstandings about intent.'}` : '');

  const strengths = [];
  if (baseScore >= 75) strengths.push(`Life Paths ${lp1} and ${lp2} are naturally complementary \u2014 shared values and mutual understanding`);
  if (r1 + r2 === 10 || r1 === r2) strengths.push('Your numbers create a complete or mirrored vibration together');
  strengths.push(`The ${t1} brings ${r1 <= 3 ? 'initiative and creative energy' : r1 <= 6 ? 'stability and nurturing' : 'depth and vision'}`);
  strengths.push(`The ${t2} contributes ${r2 <= 3 ? 'drive and expressiveness' : r2 <= 6 ? 'reliability and heart' : 'wisdom and ambition'}`);

  const challenges = [];
  if (baseScore < 55) challenges.push(`Life Paths ${lp1} and ${lp2} have fundamentally different priorities and rhythms`);
  if (Math.abs(r1 - r2) >= 5) challenges.push('Wide numerical gap means very different natural inclinations and energy levels');
  challenges.push(r1 % 2 !== r2 % 2 ? 'One of you leads with action, the other with reflection \u2014 timing conflicts are likely' : 'Similar pacing can lead to stagnation without external stimulation');

  const factors = [{ label: 'Life Path', value: `${lp1} + ${lp2}`, score: baseScore }];
  if (hasNames) factors.push({ label: 'Expression', value: `${exp1} + ${exp2}`, score: expScore });
  factors.push({ label: 'Vibration', value: score >= 70 ? 'Harmonic' : score >= 50 ? 'Stimulating' : 'Discordant', score });

  return {
    score, summary, detail, strengths, challenges,
    advice: baseScore >= 70
      ? 'Your numerical alignment is strong. Focus on maintaining individual growth so your shared vibration stays dynamic rather than static.'
      : 'Bridge the gap by creating shared rituals that honor both paths. The number that is most different from yours holds a lesson you need \u2014 lean into it rather than resisting.',
    factors,
  };
}

/* ══════════════════════════════════════════════════════
   6. KABBALISTIC COMPATIBILITY
   ══════════════════════════════════════════════════════ */
const SEFIROT = ['Keter','Chokmah','Binah','Chesed','Gevurah','Tiferet','Netzach','Hod','Yesod'];
const SEF_MEANING = ['Crown \u2014 divine will','Wisdom \u2014 the first flash of insight','Understanding \u2014 form and structure','Mercy \u2014 boundless love','Severity \u2014 discipline and judgment','Beauty \u2014 harmony and balance','Eternity \u2014 endurance and desire','Splendor \u2014 intellect and communication','Foundation \u2014 connection and intimacy'];
const PILLAR = [2,0,1,0,1,2,0,1,2];
const TREE_PATHS = [[0,1],[0,2],[1,2],[1,3],[1,5],[2,4],[2,5],[3,4],[3,5],[3,6],[4,5],[4,7],[5,6],[5,7],[5,8],[6,7],[6,8],[7,8]];

function kabbalisticCompat(userForm, partnerForm) {
  const bd1 = userForm?.birth_date || '1990-01-01', bd2 = partnerForm?.birth_date || '1990-01-01';
  const num1 = reduceNumber(bd1.replace(/\D/g, '').split('').reduce((s, d) => s + +d, 0));
  const num2 = reduceNumber(bd2.replace(/\D/g, '').split('').reduce((s, d) => s + +d, 0));
  const s1 = (num1 - 1) % 9, s2 = (num2 - 1) % 9;

  const samePillar = PILLAR[s1] === PILLAR[s2];
  const connected = TREE_PATHS.some(([a, b]) => (a === s1 && b === s2) || (a === s2 && b === s1));
  const same = s1 === s2;

  let base = 55, relation = 'Distant';
  if (same) { base = 82; relation = 'Mirror Bond'; }
  else if (connected) { base = 78; relation = 'Path Connected'; }
  else if (samePillar) { base = 70; relation = 'Same Pillar'; }
  else { base = 50; relation = 'Cross-Pillar'; }

  const hn1 = userForm?.hebrew_name, hn2 = partnerForm?.hebrew_name;
  let nameBonus = 0;
  if (hn1 && hn2) {
    const v1 = reduceNumber(hn1.split('').reduce((s, c) => s + c.charCodeAt(0), 0));
    const v2 = reduceNumber(hn2.split('').reduce((s, c) => s + c.charCodeAt(0), 0));
    nameBonus = v1 === v2 ? 8 : Math.abs(v1 - v2) <= 2 ? 4 : 0;
  }
  const score = clamp(base + nameBonus, 20, 99);
  const pillarNames = ['Mercy (Right)','Severity (Left)','Balance (Middle)'];

  const summary = verdictFor(score, [
    [78, 'Your souls walk adjacent paths on the Tree of Life.'],
    [60, 'A meaningful connection through the Kabbalistic tree.'],
    [45, 'Different branches of the Tree \u2014 growth through polarity.'],
    [0, 'Distant sefirot that illuminate through contrast.'],
  ]);

  const detail = `${SEFIROT[s1]} (${SEF_MEANING[s1]}) meets ${SEFIROT[s2]} (${SEF_MEANING[s2]}). Relationship on the Tree: ${relation}.\n\n` +
    (same ? `You both resonate with ${SEFIROT[s1]}, the sefirah of ${SEF_MEANING[s1].split(' \u2014 ')[1]}. This mirror bond means you see yourself reflected in your partner with startling clarity. You share the same spiritual gifts and the same spiritual challenges. The relationship is intensely validating but also confronting \u2014 your partner mirrors back everything you love and everything you avoid about yourself.`
    : connected ? `A direct path on the Tree of Life connects ${SEFIROT[s1]} and ${SEFIROT[s2]}, signifying a natural channel for spiritual energy between you. In Kabbalistic tradition, connected sefirot share divine light directly. Your souls are equipped to teach each other profound lessons about the qualities each sefirah represents \u2014 ${SEF_MEANING[s1].split(' \u2014 ')[1]} meeting ${SEF_MEANING[s2].split(' \u2014 ')[1]}.`
    : samePillar ? `Both of you stand on the ${pillarNames[PILLAR[s1]]} pillar of the Tree, sharing a fundamental orientation toward ${PILLAR[s1] === 0 ? 'expansion, generosity, and creative force' : PILLAR[s1] === 1 ? 'structure, discipline, and discernment' : 'balance, integration, and divine harmony'}. While your specific sefirot differ, your underlying approach to spiritual growth is aligned.`
    : `Your sefirot sit on different pillars \u2014 ${pillarNames[PILLAR[s1]]} and ${pillarNames[PILLAR[s2]]}. This creates a dynamic polarity: one of you leans toward ${PILLAR[s1] === 0 ? 'expansion' : PILLAR[s1] === 1 ? 'structure' : 'balance'} while the other gravitates toward ${PILLAR[s2] === 0 ? 'expansion' : PILLAR[s2] === 1 ? 'structure' : 'balance'}. Together, you encompass more of the Tree than either could alone.`);

  const strengths = [];
  if (same) strengths.push('Mirror bond \u2014 instant, deep recognition of each other\'s spiritual essence');
  if (connected) strengths.push('Direct path on the Tree \u2014 spiritual energy flows naturally between you');
  if (samePillar) strengths.push('Shared pillar orientation \u2014 your fundamental values and approach to life align');
  strengths.push(`${SEFIROT[s1]} brings the energy of ${SEF_MEANING[s1].split(' \u2014 ')[1]}`);
  strengths.push(`${SEFIROT[s2]} contributes the quality of ${SEF_MEANING[s2].split(' \u2014 ')[1]}`);

  const challenges = [];
  if (same) challenges.push('Mirror bonds amplify shared weaknesses as much as shared strengths');
  if (!connected && !samePillar) challenges.push('No direct path between your sefirot \u2014 spiritual connection requires conscious bridge-building');
  if (PILLAR[s1] !== PILLAR[s2]) challenges.push(`Different pillars mean different fundamental orientations \u2014 what feels natural to one may feel foreign to the other`);
  if (challenges.length === 0) challenges.push('Strong Tree alignment can create spiritual complacency \u2014 continue growing individually');

  return {
    score, summary, detail, strengths, challenges,
    advice: 'Study each other\'s sefirah. Understanding your partner\'s position on the Tree reveals what they are here to learn and teach. The Kabbalistic path is about integrating all qualities \u2014 your partner helps you access parts of the Tree you cannot reach alone.',
    factors: [
      { label: 'Sefirot', value: `${SEFIROT[s1]} + ${SEFIROT[s2]}`, score: same ? 88 : connected ? 78 : 50 },
      { label: 'Tree Relation', value: relation, score: base },
      { label: 'Pillar Alignment', value: samePillar ? 'Aligned' : 'Cross', score: samePillar ? 80 : 45 },
    ],
  };
}

/* ══════════════════════════════════════════════════════
   7. GEMATRIA COMPATIBILITY
   ══════════════════════════════════════════════════════ */
function nameGematria(name) {
  if (!name) return 0;
  return name.toUpperCase().split('').reduce((s, c) => { const v = c.charCodeAt(0) - 64; return s + (v >= 1 && v <= 26 ? v : 0); }, 0);
}

function gematriaCompat(userForm, partnerForm) {
  const name1 = userForm?.full_name || '', name2 = partnerForm?.full_name || '';
  const g1 = nameGematria(name1), g2 = nameGematria(name2);
  const r1 = g1 ? reduceNumber(g1) : 0, r2 = g2 ? reduceNumber(g2) : 0;
  const combined = g1 && g2 ? reduceNumber(g1 + g2) : 0;
  const hasNames = name1.length > 0 && name2.length > 0;

  let base = 55, resonance = 'Unknown';
  if (!hasNames) { resonance = 'Names required'; base = 50; }
  else if (r1 === r2) { resonance = 'Perfect Resonance'; base = 88; }
  else if (Math.abs(r1 - r2) === 1 || Math.abs(r1 - r2) === 8) { resonance = 'Harmonic Neighbors'; base = 78; }
  else if ((r1 + r2) === 10 || (r1 + r2) === 9) { resonance = 'Complementary Vibration'; base = 75; }
  else if (r1 + r2 <= 5) { resonance = 'Low-Frequency Bond'; base = 62; }
  else { resonance = 'Distant Vibration'; base = 52; }

  const masterBonus = ([11,22,33].includes(g1 % 100) || [11,22,33].includes(g2 % 100)) ? 5 : 0;
  const combBonus = [7,9,11,22].includes(combined) ? 6 : [1,3,6].includes(combined) ? 3 : 0;
  const score = clamp(base + masterBonus + combBonus, 20, 99);

  const summary = verdictFor(score, [
    [78, 'Your names vibrate in profound numerical harmony.'],
    [60, 'A meaningful resonance echoes between your name values.'],
    [45, 'Your name vibrations create interesting numerical tension.'],
    [0, 'Different vibrational frequencies that expand each other.'],
  ]);

  const detail = hasNames
    ? `"${name1}" carries a gematria value of ${g1}, reducing to root number ${r1}. "${name2}" carries ${g2}, reducing to ${r2}. Combined vibration: ${g1 + g2} \u2192 ${combined}.\n\nResonance type: ${resonance}.\n\n` +
      (resonance === 'Perfect Resonance' ? 'Your names reduce to the same root number, creating one of the most powerful gematria alignments possible. When your names are spoken together, they create a unified vibrational field. In tradition, this suggests that your souls carry similar missions and your combined energy amplifies rather than dilutes.'
      : resonance === 'Harmonic Neighbors' ? 'Your root numbers sit adjacent on the numerical scale, creating a natural harmonic \u2014 like neighboring notes that form a pleasing interval. Your names support and uplift each other without competing for the same vibrational space.'
      : resonance === 'Complementary Vibration' ? 'Your root numbers sum to a complete number (9 or 10), suggesting that together you form a whole that neither achieves alone. This is the gematria of complementary partnership \u2014 what one name lacks, the other provides.'
      : 'Your name vibrations carry distinctly different frequencies. In gematria, this is neither good nor bad \u2014 it simply means your combined sound creates a complex chord rather than a simple harmony. Complex chords are the foundation of the most interesting music.') +
      `\n\nCombined number ${combined}${[7,9,11,22].includes(combined) ? ' is considered highly spiritual and auspicious' : [1,3,6].includes(combined) ? ' carries positive creative energy' : ' is neutral \u2014 its meaning depends on how you use it together'}.`
    : 'Enter both names for a complete Gematria compatibility analysis. In gematria, the numerical values encoded in your names reveal hidden vibrational bonds \u2014 resonances that operate beneath conscious awareness, shaping how your energies interact every time your names are spoken together.';

  const strengths = hasNames ? [
    r1 === r2 ? 'Same root number \u2014 your names carry identical core vibrations' : `Root numbers ${r1} and ${r2} \u2014 ${Math.abs(r1 - r2) <= 2 ? 'close vibrations create natural affinity' : 'different vibrations create rich harmonic complexity'}`,
    `Combined vibration ${combined} ${combBonus > 0 ? 'carries auspicious energy' : 'is a unique frequency you create together'}`,
    masterBonus > 0 ? 'Master number detected in one or both names \u2014 heightened spiritual potential' : 'Your combined gematria creates a frequency unique to your partnership',
  ] : ['Full analysis requires both names to be entered'];

  const challenges = hasNames ? [
    Math.abs(r1 - r2) >= 4 ? 'Wide gap between root numbers creates vibrational dissonance \u2014 requires effort to harmonize' : 'Minor numerical differences are easily bridged through shared intention',
    base < 65 ? 'Your name vibrations do not naturally resonate \u2014 conscious attunement through shared mantras or affirmations may help' : 'No major gematria challenges detected',
  ] : ['Cannot assess challenges without both names'];

  const factors = hasNames
    ? [{ label: 'Name Roots', value: `${r1} + ${r2}`, score: r1 === r2 ? 90 : Math.abs(r1 - r2) <= 2 ? 70 : 45 },
       { label: 'Resonance', value: resonance, score: base },
       { label: 'Combined', value: `${combined}`, score: clamp(50 + combBonus * 5, 30, 95) }]
    : [{ label: 'Status', value: 'Names needed', score: 50 }];

  return {
    score, summary, detail, strengths, challenges,
    advice: hasNames
      ? 'Try speaking both names together aloud. Gematria teaches that the vibration of a name has real energetic impact. If you adopt pet names or shared mantras, choose ones whose gematria harmonizes with your combined root.'
      : 'Provide both partners\' names to unlock this analysis. The name your parents gave you carries a vibrational blueprint that shapes every relationship.',
    factors,
  };
}

/* ══════════════════════════════════════════════════════
   8. PERSIAN COMPATIBILITY
   ══════════════════════════════════════════════════════ */
const TEMPERAMENTS = ['Sanguine','Choleric','Melancholic','Phlegmatic'];
const TEMP_QUALITIES = { Sanguine:'Hot & Wet', Choleric:'Hot & Dry', Melancholic:'Cold & Dry', Phlegmatic:'Cold & Wet' };
const TEMP_DESC = {
  Sanguine: 'Optimistic, social, energetic, and warm. The life of the party. Needs variety, connection, and positive energy.',
  Choleric: 'Ambitious, decisive, passionate, and intense. A natural leader. Needs challenge, achievement, and respect.',
  Melancholic: 'Thoughtful, detail-oriented, deep, and loyal. A perfectionist. Needs order, meaning, and quiet depth.',
  Phlegmatic: 'Calm, patient, diplomatic, and steady. A peacemaker. Needs stability, harmony, and gentle affection.',
};
const TEMP_PAIR_DETAIL = {
  '0_0': 'Two Sanguines together create a whirlwind of social energy, laughter, and spontaneity. You light up every room you enter as a couple. The challenge is depth \u2014 neither of you naturally gravitates toward difficult emotional conversations, and commitments can feel slippery when both partners prefer keeping things light.',
  '0_1': 'Sanguine and Choleric share the quality of heat \u2014 both are energetic, outward-moving, and action-oriented. This pairing is dynamic and productive. The friction comes from Choleric\'s need for control meeting Sanguine\'s need for freedom. When balanced, you are an unstoppable force.',
  '0_2': 'Sanguine and Melancholic are temperamental opposites. One is light, social, and spontaneous; the other is deep, reserved, and methodical. This can be deeply enriching or deeply frustrating. At best, Sanguine brings joy to Melancholic\'s heaviness, and Melancholic gives Sanguine the depth they secretly crave.',
  '0_3': 'Sanguine and Phlegmatic share the quality of wetness \u2014 both are adaptable, relationship-oriented, and emotionally responsive. This is one of the most harmonious temperamental pairings. Sanguine brings excitement and energy; Phlegmatic provides calm stability. Together you create a warm, welcoming partnership.',
  '1_1': 'Two Cholerics together create a power couple \u2014 ambitious, driven, and larger than life. The energy is electric, but so are the arguments. Both need to lead, both need to win, and compromise feels like defeat. If you can channel your combined fire toward shared goals rather than against each other, you are world-changers.',
  '1_2': 'Choleric and Melancholic share the quality of dryness \u2014 both are practical, results-oriented, and unsentimental. This pairing is efficient and productive. Where it struggles is in emotional warmth: neither naturally leads with feelings, so the relationship can feel businesslike unless both consciously cultivate tenderness.',
  '1_3': 'Choleric and Phlegmatic are temperamental opposites. Fire meets Water. The Choleric pushes, drives, and demands; the Phlegmatic absorbs, calms, and deflects. This can work beautifully if Choleric learns patience and Phlegmatic learns assertiveness. Without that growth, it becomes a dynamic of dominance and resentment.',
  '2_2': 'Two Melancholics create a relationship of extraordinary depth, loyalty, and intellectual richness. You understand each other\'s need for perfection, meaning, and quiet time. The risk is mutual withdrawal \u2014 two inward-turning temperaments can create an isolated, overly serious world that lacks joy and spontaneity.',
  '2_3': 'Melancholic and Phlegmatic share the quality of coldness \u2014 both are introverted, thoughtful, and gentle. This pairing is quiet but profoundly loyal. You create a peaceful sanctuary together. The challenge is energy: neither naturally initiates change, so the relationship may stagnate without conscious injection of novelty.',
  '3_3': 'Two Phlegmatics create the most peaceful, harmonious partnership of any temperamental pairing. Conflict is rare, patience is abundant, and loyalty runs deep. The danger is inertia: with no fire or air to stir things up, the relationship can settle into a comfortable numbness where neither person grows.',
};

const DAY_RULERS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
const RULER_FRIENDS = { Sun:[1,4], Moon:[0,3], Mars:[4,0], Mercury:[1,5], Jupiter:[0,2,3], Venus:[3,6], Saturn:[5,4] };

function temperament(m) {
  if (m >= 3 && m <= 5) return 0;
  if (m >= 6 && m <= 8) return 1;
  if (m >= 9 && m <= 11) return 2;
  return 3;
}

const TEMP_COMPAT = {
  '0_0':72, '0_1':68, '0_2':52, '0_3':82,
  '1_1':65, '1_2':62, '1_3':48,
  '2_2':70, '2_3':68,
  '3_3':74,
};

function persianCompat(p1, p2) {
  const t1 = temperament(p1.m), t2 = temperament(p2.m);
  const tKey = [Math.min(t1, t2), Math.max(t1, t2)].join('_');
  const tempScore = TEMP_COMPAT[tKey] || 60;

  const dow1 = new Date(p1.y, p1.m - 1, p1.d).getDay();
  const dow2 = new Date(p2.y, p2.m - 1, p2.d).getDay();
  let rulerScore = 55;
  if (dow1 === dow2) rulerScore = 80;
  else if ((RULER_FRIENDS[DAY_RULERS[dow1]] || []).includes(dow2)) rulerScore = 75;
  else if ((RULER_FRIENDS[DAY_RULERS[dow2]] || []).includes(dow1)) rulerScore = 72;

  const doy1 = Math.floor((new Date(p1.y, p1.m - 1, p1.d) - new Date(p1.y, 0, 1)) / 86400000);
  const doy2 = Math.floor((new Date(p2.y, p2.m - 1, p2.d) - new Date(p2.y, 0, 1)) / 86400000);
  const mansionDist = Math.min(Math.abs((doy1 % 28) - (doy2 % 28)), 28 - Math.abs((doy1 % 28) - (doy2 % 28)));
  const mansionScore = mansionDist <= 3 ? 82 : mansionDist <= 7 ? 68 : mansionDist <= 14 ? 55 : 45;

  const score = clamp(Math.round(tempScore * 0.4 + rulerScore * 0.3 + mansionScore * 0.3), 20, 99);
  const pairDetail = TEMP_PAIR_DETAIL[tKey] || 'Your temperaments create a unique dynamic worth exploring with awareness and patience.';
  const t1Name = TEMPERAMENTS[t1], t2Name = TEMPERAMENTS[t2];

  const summary = verdictFor(score, [
    [75, 'Your temperaments blend like perfume \u2014 rich and intoxicating.'],
    [58, 'A well-tempered pairing with natural balance.'],
    [42, 'Your humors create a dynamic interplay of opposites.'],
    [0, 'Contrasting temperaments that challenge and transform.'],
  ]);

  const detail = `${t1Name} (${TEMP_QUALITIES[t1Name]}) meets ${t2Name} (${TEMP_QUALITIES[t2Name]}).\n\n` +
    `${TEMP_DESC[t1Name]}\n\n${TEMP_DESC[t2Name]}\n\n${pairDetail}\n\n` +
    `Planetary rulers: ${DAY_RULERS[dow1]} (your birth day) and ${DAY_RULERS[dow2]} (partner\'s birth day). ${rulerScore >= 75 ? 'Your planetary rulers are natural allies, adding another layer of cosmic support.' : rulerScore >= 60 ? 'Your rulers have a neutral relationship \u2014 neither helping nor hindering.' : 'Your planetary rulers are not natural allies \u2014 patience and understanding bridge this gap.'}`;

  const strengths = [];
  if (t1 === t2) strengths.push('Same temperament \u2014 you instinctively understand each other\'s pace and needs');
  if (tempScore >= 75) strengths.push('Shared humoral qualities create natural ease and comfort together');
  strengths.push(`${t1Name} brings ${t1 === 0 ? 'warmth, optimism, and social energy' : t1 === 1 ? 'passion, drive, and decisive action' : t1 === 2 ? 'depth, loyalty, and attention to detail' : 'patience, diplomacy, and steadfast calm'}`);
  if (t1 !== t2) strengths.push(`${t2Name} contributes ${t2 === 0 ? 'lightness, joy, and adaptability' : t2 === 1 ? 'ambition, courage, and leadership' : t2 === 2 ? 'thoughtfulness, precision, and devotion' : 'stability, peace, and emotional steadiness'}`);

  const challenges = [];
  if (tempScore < 55) challenges.push('Opposite temperaments \u2014 what energizes one may drain the other');
  if (t1 === 1 && t2 === 3 || t1 === 3 && t2 === 1) challenges.push('Fire and Water temperaments \u2014 one pushes while the other retreats, creating a frustrating loop');
  if (t1 === 0 && t2 === 2 || t1 === 2 && t2 === 0) challenges.push('The lightest and heaviest temperaments \u2014 bridging this requires genuine effort from both sides');
  if (challenges.length === 0) challenges.push('Compatible temperaments may lack the friction needed for growth \u2014 introduce gentle challenges');

  return {
    score, summary, detail, strengths, challenges,
    advice: tempScore >= 70
      ? 'Your temperaments align well. Persian medicine teaches that maintaining balance requires attending to diet, rest, and emotional rhythm together. Build shared wellness rituals.'
      : 'Persian tradition recommends balancing opposing temperaments through food, environment, and activities. The Choleric benefits from Water; the Phlegmatic from Fire. Seek activities that bring both of you toward the center.',
    factors: [
      { label: 'Temperament', value: `${t1Name} + ${t2Name}`, score: tempScore },
      { label: 'Planetary Ruler', value: `${DAY_RULERS[dow1]} + ${DAY_RULERS[dow2]}`, score: rulerScore },
      { label: 'Lunar Mansion', value: `Distance: ${mansionDist}`, score: mansionScore },
    ],
  };
}

/* ══════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════ */
const SYSTEM_WEIGHTS = { western:0.15, vedic:0.20, chinese:0.12, bazi:0.12, numerology:0.12, kabbalistic:0.10, gematria:0.09, persian:0.10 };

export function getFullCompatibility(userForm, partnerForm) {
  const userSign = signFromDate(userForm?.birth_date);
  const partnerSign = signFromDate(partnerForm?.birth_date);
  const p1 = parseBD(userForm), p2 = parseBD(partnerForm);

  const results = {
    western: westernCompat(userSign, partnerSign),
    vedic: vedicCompat(p1, p2),
    chinese: chineseCompat(p1, p2),
    bazi: baziCompat(p1, p2),
    numerology: numerologyCompat(userForm, partnerForm),
    kabbalistic: kabbalisticCompat(userForm, partnerForm),
    gematria: gematriaCompat(userForm, partnerForm),
    persian: persianCompat(p1, p2),
  };

  const systems = [
    { id: 'western', name: 'Western Astrology', icon: '\u2609', ...results.western },
    { id: 'vedic', name: 'Vedic (Ashtakoot)', icon: '\u0950', ...results.vedic },
    { id: 'chinese', name: 'Chinese Zodiac', icon: '\uD83C\uDF8E', ...results.chinese },
    { id: 'bazi', name: 'BaZi \u00B7 Four Pillars', icon: '\u4E94', ...results.bazi },
    { id: 'numerology', name: 'Numerology', icon: '#', ...results.numerology },
    { id: 'kabbalistic', name: 'Kabbalistic', icon: '\u2721', ...results.kabbalistic },
    { id: 'gematria', name: 'Gematria', icon: '\u05D0', ...results.gematria },
    { id: 'persian', name: 'Persian', icon: '\u066D', ...results.persian },
  ];

  let wSum = 0;
  for (const s of systems) wSum += s.score * (SYSTEM_WEIGHTS[s.id] || 0.125);
  const overall = clamp(Math.round(wSum), 20, 99);

  const VERDICTS = [
    [82, 'Celestial Union', `${userSign} and ${partnerSign} share a rare and luminous cosmic alignment across all eight traditions.`],
    [70, 'Harmonious Match', `${userSign} and ${partnerSign} resonate with deep natural chemistry. The majority of traditions affirm this bond.`],
    [58, 'Promising Bond', `${userSign} and ${partnerSign} hold strong potential. Some systems sing in harmony while others offer growth lessons.`],
    [46, 'Growth Partnership', `The ${userSign}-${partnerSign} connection is one of transformation. Your differences are doorways to becoming better versions of yourselves.`],
    [34, 'Cosmic Tension', `${userSign} and ${partnerSign} face significant cosmic friction across multiple systems. This is a relationship that demands conscious work \u2014 and rewards it generously.`],
    [0,  'Opposite Forces', `${userSign} and ${partnerSign} carry very different energies across most traditions. This bond requires exceptional patience, devotion, and willingness to grow.`],
  ];
  const [, verdict, overallSummary] = VERDICTS.find(([min]) => overall >= min) || VERDICTS[VERDICTS.length - 1];

  return { overall: { score: overall, verdict, summary: overallSummary }, systems, userSign, partnerSign };
}
