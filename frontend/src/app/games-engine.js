/**
 * Games Engine — client-side mini-game logic.
 * No API calls needed. All games run instantly in the browser.
 */

// ── Shared data ──

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const SIGN_ICONS = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

export const SIGN_ELEMENTS = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
};

export const SIGN_MODALITIES = {
  Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable',
  Cancer: 'Cardinal', Leo: 'Fixed', Virgo: 'Mutable',
  Libra: 'Cardinal', Scorpio: 'Fixed', Sagittarius: 'Mutable',
  Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable',
};

export const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

export const PLANET_SYMBOLS = { Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642', Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647' };

export const PLANET_MEANINGS = {
  Sun: 'identity and willpower', Moon: 'emotions and intuition', Mercury: 'communication and thought',
  Venus: 'love and beauty', Mars: 'drive and ambition', Jupiter: 'growth and fortune',
  Saturn: 'discipline and karma', Uranus: 'change and rebellion', Neptune: 'dreams and mystery', Pluto: 'transformation and rebirth',
};

export const HOUSE_MEANINGS = {
  1: 'self and appearance', 2: 'finances and values', 3: 'communication and siblings',
  4: 'home and roots', 5: 'creativity and romance', 6: 'health and daily ritual',
  7: 'partnerships and marriage', 8: 'transformation and the unseen', 9: 'travel and higher truth',
  10: 'career and destiny', 11: 'friendships and aspirations', 12: 'spirituality and hidden depths',
};

export const ELEMENT_COMPAT = {
  'Fire-Fire': 85, 'Fire-Earth': 45, 'Fire-Air': 80, 'Fire-Water': 40,
  'Earth-Fire': 45, 'Earth-Earth': 75, 'Earth-Air': 50, 'Earth-Water': 85,
  'Air-Fire': 80, 'Air-Earth': 50, 'Air-Air': 70, 'Air-Water': 55,
  'Water-Fire': 40, 'Water-Earth': 85, 'Water-Air': 55, 'Water-Water': 80,
};

const MODALITY_COMPAT = {
  'Cardinal-Cardinal': 60, 'Cardinal-Fixed': 55, 'Cardinal-Mutable': 75,
  'Fixed-Cardinal': 55, 'Fixed-Fixed': 50, 'Fixed-Mutable': 65,
  'Mutable-Cardinal': 75, 'Mutable-Fixed': 65, 'Mutable-Mutable': 70,
};

const FATE_CARDS = [
  { title: 'The Rising Star', meaning: 'A breakthrough moment is approaching. Prepare to shine.', advice: 'Take the lead on something you have been hesitating about.' },
  { title: 'The Hidden Moon', meaning: 'Something unseen is influencing your path. Trust your instincts.', advice: 'Spend time in reflection before making a big decision.' },
  { title: 'The Open Road', meaning: 'New opportunities are unfolding. Travel or movement is favored.', advice: 'Say yes to an invitation you would normally decline.' },
  { title: 'The Walled Garden', meaning: 'Protection and boundaries serve you now. Guard your energy.', advice: 'Set one firm boundary today and hold it.' },
  { title: 'The Twin Flames', meaning: 'A significant connection is deepening. Pay attention to mirrors.', advice: 'Reach out to someone who has been on your mind.' },
  { title: 'The Golden Key', meaning: 'An answer you have been seeking is closer than you think.', advice: 'Revisit a problem from a completely different angle.' },
  { title: 'The Deep Well', meaning: 'Emotional depth is available. Dive below the surface.', advice: 'Journal or meditate on what you are truly feeling.' },
  { title: 'The Lightning Bolt', meaning: 'Sudden clarity or disruption. Change arrives fast.', advice: 'Be ready to act quickly when the moment comes.' },
  { title: 'The Ancient Tree', meaning: 'Patience and rootedness bring reward. Growth takes time.', advice: 'Focus on one long-term goal instead of chasing quick wins.' },
  { title: 'The Compass Rose', meaning: 'Direction becomes clear. Follow the pull you feel.', advice: 'Write down what truly matters to you right now.' },
  { title: 'The Silver Thread', meaning: 'A pattern is connecting your recent experiences. Look for the thread.', advice: 'Notice what keeps repeating in your conversations.' },
  { title: 'The Eclipse', meaning: 'An ending makes way for a beginning. Release with grace.', advice: 'Let go of one thing that no longer serves you.' },
  { title: 'The Harvest', meaning: 'You are entering a season of reaping what was sown.', advice: 'Acknowledge your past effort \u2014 the results are coming.' },
  { title: 'The Candle Flame', meaning: 'Small, steady effort now creates lasting warmth.', advice: 'Do one small act of kindness without expecting return.' },
  { title: 'The Star Map', meaning: 'Your long-range vision is sharper than usual. Plan boldly.', advice: 'Dream three months ahead and write it down.' },
  { title: 'The Still Water', meaning: 'Calm is your power. Do not rush what needs to settle.', advice: 'Pause before responding to anything that stirs emotion.' },
  { title: 'The Iron Gate', meaning: 'A test of resolve. What you withstand now builds strength.', advice: 'Stay the course even when doubt whispers.' },
  { title: 'The Feather', meaning: 'Lightness and ease are available. Stop forcing.', advice: 'Choose the path of least resistance today.' },
  { title: 'The Mirror', meaning: 'What bothers you in others reveals something in yourself.', advice: 'Ask yourself what a recent frustration teaches you.' },
  { title: 'The Bonfire', meaning: 'Passion and community ignite together. Gather your people.', advice: 'Share an idea with someone who will fan the flame.' },
  { title: 'The Seed', meaning: 'Something planted today will grow beyond expectation.', advice: 'Start a small project with no pressure about the outcome.' },
  { title: 'The Constellation', meaning: 'The bigger picture is forming. Trust the pattern.', advice: 'Zoom out from the details and see the shape emerging.' },
  { title: 'The Chalice', meaning: 'Emotional abundance flows toward you. Receive it.', advice: 'Accept a compliment or offer without deflecting.' },
  { title: 'The Shield', meaning: 'You are more protected than you realize. Stand firm.', advice: 'Face something you have been avoiding \u2014 you are ready.' },
];

export const LIFE_PATH_DATA = {
  1: { trait: 'The Leader', teaser: 'You are driven by independence and originality. Your path is about pioneering new ground.', premium: 'Life Path 1 carries the energy of creation and self-determination. You thrive when you trust your own vision rather than following the crowd.' },
  2: { trait: 'The Diplomat', teaser: 'You are guided by harmony and partnership. Your path is about connection and sensitivity.', premium: 'Life Path 2 is the frequency of cooperation and emotional intelligence. You sense what others miss and mediate naturally.' },
  3: { trait: 'The Creative', teaser: 'You are fueled by expression and joy. Your path is about bringing ideas to life.', premium: 'Life Path 3 vibrates with creative fire and social magnetism. You communicate in ways that move people.' },
  4: { trait: 'The Builder', teaser: 'You are grounded by structure and dedication. Your path is about creating lasting foundations.', premium: 'Life Path 4 carries the blueprint energy \u2014 you see how things should be built and have the patience to do it right.' },
  5: { trait: 'The Adventurer', teaser: 'You are moved by freedom and experience. Your path is about embracing change.', premium: 'Life Path 5 is the frequency of movement and sensory experience. You need variety or you wither.' },
  6: { trait: 'The Nurturer', teaser: 'You are called by love and responsibility. Your path is about service and beauty.', premium: 'Life Path 6 resonates with home, family, and aesthetic harmony. You feel responsible for others\u2019 wellbeing.' },
  7: { trait: 'The Seeker', teaser: 'You are drawn to truth and inner knowing. Your path is about wisdom and solitude.', premium: 'Life Path 7 is the frequency of the mystic and analyst. You need time alone to process and go deep.' },
  8: { trait: 'The Powerhouse', teaser: 'You are shaped by ambition and material mastery. Your path is about wielding influence wisely.', premium: 'Life Path 8 carries the energy of authority and abundance. You are here to learn the responsible use of power.' },
  9: { trait: 'The Humanitarian', teaser: 'You are inspired by compassion and vision. Your path is about serving the greater good.', premium: 'Life Path 9 vibrates with completion and universal love. You see the big picture and feel drawn to causes larger than yourself.' },
  11: { trait: 'The Visionary', teaser: 'You carry heightened intuition and spiritual sensitivity. Your path is about illumination.', premium: 'Master Number 11 amplifies spiritual voltage. You receive insights others miss but may struggle with the intensity.' },
  22: { trait: 'The Master Builder', teaser: 'You hold the power to manifest extraordinary visions into reality.', premium: 'Master Number 22 combines the vision of 11 with the practical power of 4. You are capable of building things that outlast you.' },
  33: { trait: 'The Master Teacher', teaser: 'You embody selfless service and spiritual wisdom. Your path is about uplifting others.', premium: 'Master Number 33 is the rarest vibration \u2014 the teacher who teaches by example. You radiate compassion.' },
};


// ── Helpers (exported for system games) ──

export function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return function next() {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

export function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

export function signFromDate(dateStr) {
  if (!dateStr) return 'Aries';
  const [, m, d] = dateStr.split('-').map(Number);
  const cutoffs = [
    [1,20,'Capricorn'],[2,19,'Aquarius'],[3,20,'Pisces'],[4,20,'Aries'],
    [5,21,'Taurus'],[6,21,'Gemini'],[7,22,'Cancer'],[8,23,'Leo'],
    [9,23,'Virgo'],[10,23,'Libra'],[11,22,'Scorpio'],[12,22,'Sagittarius'],
  ];
  for (const [cm, cd, sign] of cutoffs) {
    if (m === cm && d <= cd) return sign;
    if (m < cm) return sign;
  }
  return 'Capricorn';
}

export function reduceNumber(n) {
  const masters = [11, 22, 33];
  while (n > 9 && !masters.includes(n)) {
    n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

export function lifePath(dateStr) {
  const digits = dateStr.replace(/\D/g, '').split('').map(Number);
  return reduceNumber(digits.reduce((s, d) => s + d, 0));
}


// ── Game implementations ──

export function playDice() {
  const seed = `dice-${Date.now()}-${Math.random()}`;
  const rng = seededRandom(seed);
  const sign = pick(SIGNS, rng);
  const planet = pick(PLANETS, rng);
  const house = Math.floor(rng() * 12) + 1;

  return {
    game_id: 'dice',
    sign, sign_icon: SIGN_ICONS[sign],
    planet, planet_symbol: PLANET_SYMBOLS[planet],
    house,
    element: SIGN_ELEMENTS[sign],
    planet_meaning: PLANET_MEANINGS[planet],
    house_meaning: HOUSE_MEANINGS[house],
    teaser: `The cosmos points to ${PLANET_MEANINGS[planet]} expressed through ${sign} in the realm of ${HOUSE_MEANINGS[house]}.`,
    premium_text: `${planet} in ${sign} in the ${house}th house reveals a powerful alignment. The ${SIGN_ELEMENTS[sign]} element charges ${planet}\u2019s energy around ${PLANET_MEANINGS[planet]}, directing it toward ${HOUSE_MEANINGS[house]}. Pay attention to synchronicities in this area.`,
    cta_label: 'View Full Western Analysis',
    cta_system: 'combined-systems',
  };
}

export function playFate() {
  const seed = `fate-${Date.now()}-${Math.random()}`;
  const rng = seededRandom(seed);
  const card = pick(FATE_CARDS, rng);

  return {
    game_id: 'fate',
    card_title: card.title,
    card_meaning: card.meaning,
    card_advice: card.advice,
    teaser: `"${card.title}" \u2014 ${card.meaning}`,
    premium_text: `The full reading for "${card.title}": ${card.meaning} Guidance: ${card.advice} This card appears when a turning point is near. Consider how this connects to what occupies your mind. The cosmos does not send messages by accident.`,
    cta_label: 'Ask the Oracle',
    cta_system: 'oracle',
  };
}

export function playCompatibility(date1, date2) {
  if (!date1 || !date2) return { error: 'Two birth dates are required.' };

  const sign1 = signFromDate(date1);
  const sign2 = signFromDate(date2);
  const elem1 = SIGN_ELEMENTS[sign1];
  const elem2 = SIGN_ELEMENTS[sign2];
  const mod1 = SIGN_MODALITIES[sign1];
  const mod2 = SIGN_MODALITIES[sign2];

  const elemScore = ELEMENT_COMPAT[`${elem1}-${elem2}`] || 50;
  const modScore = MODALITY_COMPAT[`${mod1}-${mod2}`] || 60;

  const idx1 = SIGNS.indexOf(sign1);
  const idx2 = SIGNS.indexOf(sign2);
  const dist = Math.min(Math.abs(idx1 - idx2), 12 - Math.abs(idx1 - idx2));
  const distBonus = { 0: 10, 6: 8, 4: 5, 3: -3, 1: -5 }[dist] || 0;

  const raw = (elemScore * 0.5) + (modScore * 0.3) + (50 + distBonus) * 0.2;
  const score = Math.max(10, Math.min(95, Math.round(raw)));

  const vibe = score >= 75 ? 'strong natural harmony' : score >= 60 ? 'solid compatibility with growth potential' : score >= 45 ? 'interesting tension that can spark or challenge' : 'very different energies requiring conscious effort';

  return {
    game_id: 'compatibility',
    sign_1: sign1, sign_1_icon: SIGN_ICONS[sign1],
    sign_2: sign2, sign_2_icon: SIGN_ICONS[sign2],
    elem_1: elem1, elem_2: elem2,
    score, vibe,
    teaser: `${sign1} + ${sign2} = ${score}% compatibility. This pairing shows ${vibe}.`,
    premium_text: `Full breakdown: ${sign1} (${elem1}/${mod1}) and ${sign2} (${elem2}/${mod2}). Element match: ${elemScore}%. Modality match: ${modScore}%. For a complete picture including Moon, Venus, Mars, and all 8 systems, run a full combined reading.`,
    cta_label: 'View Full Combined Analysis',
    cta_system: 'combined-systems',
  };
}

export function playNumerology(birthDate) {
  if (!birthDate) return { error: 'Birth date is required.' };

  const lp = lifePath(birthDate);
  const info = LIFE_PATH_DATA[lp] || LIFE_PATH_DATA[reduceNumber(lp)] || LIFE_PATH_DATA[1];

  return {
    game_id: 'numerology',
    life_path: lp,
    trait: info.trait,
    teaser: `Life Path ${lp}: ${info.trait}. ${info.teaser}`,
    premium_text: info.premium,
    cta_label: 'View Full Numerology System',
    cta_system: 'combined-systems',
  };
}
