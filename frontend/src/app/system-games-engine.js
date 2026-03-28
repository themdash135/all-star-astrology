/**
 * System Games Engine — client-side logic for all 27 system-level premium games.
 * Computes results from birth data + lookup tables. No API calls needed.
 */

import {
  SIGNS, SIGN_ICONS, SIGN_ELEMENTS, SIGN_MODALITIES,
  PLANETS, PLANET_SYMBOLS, PLANET_MEANINGS, HOUSE_MEANINGS,
  ELEMENT_COMPAT, LIFE_PATH_DATA,
  signFromDate, reduceNumber, lifePath, seededRandom, pick,
} from './games-engine.js';

// ══════════════════════════════════════════════════════
//  Shared Data Tables
// ══════════════════════════════════════════════════════

const HEAVENLY_STEMS = ['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'];
const EARTHLY_BRANCHES = ['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'];
const STEM_ELEMENTS = { Jia:'Wood',Yi:'Wood',Bing:'Fire',Ding:'Fire',Wu:'Earth',Ji:'Earth',Geng:'Metal',Xin:'Metal',Ren:'Water',Gui:'Water' };
const BRANCH_ANIMALS = { Zi:'Rat',Chou:'Ox',Yin:'Tiger',Mao:'Rabbit',Chen:'Dragon',Si:'Snake',Wu:'Horse',Wei:'Goat',Shen:'Monkey',You:'Rooster',Xu:'Dog',Hai:'Pig' };
const BRANCH_ELEMENTS = { Zi:'Water',Chou:'Earth',Yin:'Wood',Mao:'Wood',Chen:'Earth',Si:'Fire',Wu:'Fire',Wei:'Earth',Shen:'Metal',You:'Metal',Xu:'Earth',Hai:'Water' };
const ELEMENT_ICONS = { Wood:'\uD83C\uDF3F', Fire:'\uD83D\uDD25', Earth:'\uD83C\uDF0D', Metal:'\u2699', Water:'\uD83D\uDCA7' };
const ELEMENT_PRODUCE = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
const ELEMENT_CONTROL = { Wood:'Earth', Earth:'Water', Water:'Fire', Fire:'Metal', Metal:'Wood' };

const ELEMENT_TRAITS = {
  Wood: { strong:'Growth-oriented, visionary, and expansive', weak:'Prone to indecision and over-extension', balance:'Channel creativity into structured plans' },
  Fire: { strong:'Passionate, charismatic, and action-driven', weak:'Can burn out or become impulsive', balance:'Temper enthusiasm with patience' },
  Earth: { strong:'Stable, nurturing, and dependable', weak:'Risk of stagnation or overthinking', balance:'Stay grounded while embracing change' },
  Metal: { strong:'Disciplined, precise, and principled', weak:'Can become rigid or overly critical', balance:'Maintain standards with flexibility' },
  Water: { strong:'Intuitive, adaptive, and deeply perceptive', weak:'May absorb others\u2019 emotions or lack direction', balance:'Trust your flow while setting boundaries' },
};

const PILLAR_DOMAINS = {
  year: { name:'Year Pillar', domain:'Ancestry & Social Image', desc:'Represents your outer world, social standing, and ancestral legacy. Governs ages 0\u201316.' },
  month: { name:'Month Pillar', domain:'Career & Parents', desc:'Represents your career path, parental influence, and growth period. Governs ages 17\u201332.' },
  day: { name:'Day Pillar', domain:'Self & Spouse', desc:'The core of your identity. The Day Master reveals who you truly are and shapes your closest relationships. Governs ages 33\u201348.' },
  hour: { name:'Hour Pillar', domain:'Children & Legacy', desc:'Represents your inner desires, children, and legacy. Governs ages 49 onward.' },
};

const NAKSHATRAS = [
  { name:'Ashwini', deity:'Ashwini Kumaras', trait:'Healer', power:'swift action and healing', challenge:'impatience', style:'You charge ahead with natural courage' },
  { name:'Bharani', deity:'Yama', trait:'Creator', power:'transformation and endurance', challenge:'possessiveness', style:'You hold deep creative power' },
  { name:'Krittika', deity:'Agni', trait:'Purifier', power:'cutting through illusion', challenge:'harsh speech', style:'You burn away what is false' },
  { name:'Rohini', deity:'Brahma', trait:'Nurturer', power:'attraction and fertility', challenge:'materialism', style:'You draw beauty and abundance' },
  { name:'Mrigashira', deity:'Soma', trait:'Seeker', power:'curiosity and exploration', challenge:'restlessness', style:'You search endlessly for meaning' },
  { name:'Ardra', deity:'Rudra', trait:'Transformer', power:'intense emotional depth', challenge:'destructive tendencies', style:'You process life through storms' },
  { name:'Punarvasu', deity:'Aditi', trait:'Renewer', power:'return and restoration', challenge:'over-idealism', style:'You always find your way back' },
  { name:'Pushya', deity:'Brihaspati', trait:'Protector', power:'nourishment and wisdom', challenge:'rigidity', style:'You nurture everything you touch' },
  { name:'Ashlesha', deity:'Nagas', trait:'Mystic', power:'intuition and hypnotic charm', challenge:'manipulation', style:'You see what others hide' },
  { name:'Magha', deity:'Pitris', trait:'Ruler', power:'authority and ancestral connection', challenge:'arrogance', style:'You carry royal energy' },
  { name:'Purva Phalguni', deity:'Bhaga', trait:'Lover', power:'pleasure and partnership', challenge:'vanity', style:'You seek joy and connection' },
  { name:'Uttara Phalguni', deity:'Aryaman', trait:'Patron', power:'service and generosity', challenge:'over-giving', style:'You build lasting bonds' },
  { name:'Hasta', deity:'Savitar', trait:'Craftsman', power:'skillful manifestation', challenge:'cunning', style:'You create with your hands' },
  { name:'Chitra', deity:'Tvashtar', trait:'Architect', power:'design and beauty', challenge:'self-absorption', style:'You shape reality artistically' },
  { name:'Swati', deity:'Vayu', trait:'Independent', power:'flexibility and balance', challenge:'indecision', style:'You bend but never break' },
  { name:'Vishakha', deity:'Indra-Agni', trait:'Achiever', power:'determination and focus', challenge:'obsession', style:'You pursue goals relentlessly' },
  { name:'Anuradha', deity:'Mitra', trait:'Devotee', power:'friendship and devotion', challenge:'heartbreak', style:'You love with fierce loyalty' },
  { name:'Jyeshtha', deity:'Indra', trait:'Protector', power:'leadership in crisis', challenge:'jealousy', style:'You rise strongest under pressure' },
  { name:'Mula', deity:'Nirriti', trait:'Destroyer', power:'uprooting falsehood', challenge:'self-destruction', style:'You tear things down to rebuild' },
  { name:'Purva Ashadha', deity:'Apas', trait:'Invincible', power:'invincibility and purification', challenge:'over-confidence', style:'You carry undefeatable spirit' },
  { name:'Uttara Ashadha', deity:'Vishve Devas', trait:'Victor', power:'universal victory', challenge:'loneliness at the top', style:'Your success is inevitable' },
  { name:'Shravana', deity:'Vishnu', trait:'Listener', power:'learning through listening', challenge:'gossip', style:'You absorb wisdom deeply' },
  { name:'Dhanishtha', deity:'Vasus', trait:'Musician', power:'rhythm and wealth', challenge:'emotional detachment', style:'You move to your own beat' },
  { name:'Shatabhisha', deity:'Varuna', trait:'Healer', power:'mystical healing', challenge:'isolation', style:'You see the invisible patterns' },
  { name:'Purva Bhadrapada', deity:'Aja Ekapada', trait:'Scorcher', power:'spiritual fire', challenge:'extremism', style:'You burn with fierce purpose' },
  { name:'Uttara Bhadrapada', deity:'Ahir Budhnya', trait:'Sage', power:'deep cosmic wisdom', challenge:'withdrawal', style:'You access ancient knowledge' },
  { name:'Revati', deity:'Pushan', trait:'Shepherd', power:'guidance and safe passage', challenge:'naivety', style:'You lead others to safety' },
];

const GUNA_CATEGORIES = [
  { name:'Varna', max:1, desc:'Spiritual compatibility and ego harmony' },
  { name:'Vashya', max:2, desc:'Mutual attraction and dominance balance' },
  { name:'Tara', max:3, desc:'Destiny and health compatibility' },
  { name:'Yoni', max:4, desc:'Physical and intimate compatibility' },
  { name:'Graha Maitri', max:5, desc:'Mental wavelength and friendship' },
  { name:'Gana', max:6, desc:'Temperament and social nature' },
  { name:'Bhakut', max:7, desc:'Love, family, and financial compatibility' },
  { name:'Nadi', max:8, desc:'Health, genetics, and spiritual connection' },
];

const CHINESE_ANIMALS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const CHINESE_ANIMAL_ICONS = { Rat:'\uD83D\uDC00',Ox:'\uD83D\uDC02',Tiger:'\uD83D\uDC05',Rabbit:'\uD83D\uDC07',Dragon:'\uD83D\uDC09',Snake:'\uD83D\uDC0D',Horse:'\uD83D\uDC0E',Goat:'\uD83D\uDC10',Monkey:'\uD83D\uDC12',Rooster:'\uD83D\uDC13',Dog:'\uD83D\uDC15',Pig:'\uD83D\uDC16' };
const CHINESE_ELEMENTS_CYCLE = ['Metal','Water','Wood','Fire','Earth'];
const CHINESE_ANIMAL_TRAITS = {
  Rat:'clever, resourceful, ambitious', Ox:'diligent, reliable, strong', Tiger:'brave, competitive, confident',
  Rabbit:'gentle, elegant, alert', Dragon:'confident, ambitious, energetic', Snake:'wise, enigmatic, intuitive',
  Horse:'animated, active, energetic', Goat:'calm, gentle, creative', Monkey:'witty, intelligent, versatile',
  Rooster:'observant, hardworking, courageous', Dog:'loyal, honest, prudent', Pig:'compassionate, generous, diligent',
};
const CHINESE_COMPAT = {
  best: { Rat:['Dragon','Monkey'],Ox:['Snake','Rooster'],Tiger:['Horse','Dog'],Rabbit:['Goat','Pig'],Dragon:['Rat','Monkey'],Snake:['Ox','Rooster'],Horse:['Tiger','Dog'],Goat:['Rabbit','Pig'],Monkey:['Rat','Dragon'],Rooster:['Ox','Snake'],Dog:['Tiger','Horse'],Pig:['Rabbit','Goat'] },
  worst: { Rat:['Horse','Goat'],Ox:['Goat','Horse'],Tiger:['Monkey','Snake'],Rabbit:['Rooster','Dragon'],Dragon:['Dog','Rabbit'],Snake:['Pig','Tiger'],Horse:['Rat','Ox'],Goat:['Ox','Rat'],Monkey:['Tiger','Pig'],Rooster:['Rabbit','Dog'],Dog:['Dragon','Rooster'],Pig:['Snake','Monkey'] },
};

const FORTUNE_POEMS = [
  { num:1, verse:'The east wind carries spring to the plum tree.', meaning:'New beginnings arrive. Act boldly.', luck:'Excellent' },
  { num:2, verse:'Clouds part to reveal the moon over still water.', meaning:'Clarity comes after confusion. Be patient.', luck:'Good' },
  { num:3, verse:'The golden carp leaps through the dragon gate.', meaning:'A great opportunity rises. Seize it.', luck:'Excellent' },
  { num:4, verse:'Frost covers the chrysanthemum at dawn.', meaning:'Endure this cold season. Warmth returns.', luck:'Moderate' },
  { num:5, verse:'Two birds share one branch in the evening rain.', meaning:'Partnership brings comfort. Lean on others.', luck:'Good' },
  { num:6, verse:'The mountain path grows steep before the temple.', meaning:'Difficulty precedes reward. Keep climbing.', luck:'Moderate' },
  { num:7, verse:'A single lantern guides the boat home.', meaning:'Follow your inner light. The way is clear.', luck:'Good' },
  { num:8, verse:'Thunder in winter wakes the sleeping seeds.', meaning:'An unexpected event sparks growth.', luck:'Very Good' },
  { num:9, verse:'The old pine stands while young trees bend.', meaning:'Your strength lies in what you have endured.', luck:'Good' },
  { num:10, verse:'Rain falls equally on the just and unjust.', meaning:'Accept what comes without judgment.', luck:'Moderate' },
  { num:11, verse:'The crane dances alone on the frozen lake.', meaning:'Solitude brings grace. Embrace independence.', luck:'Good' },
  { num:12, verse:'Fireflies gather where the stream meets the sea.', meaning:'Small efforts accumulate into something luminous.', luck:'Very Good' },
];

const SEPHIROT = [
  { name:'Keter', english:'Crown', quality:'Divine Will', desc:'The source of all creation. Your connection to the infinite.', strength:'spiritual vision', weakness:'detachment from reality' },
  { name:'Chokmah', english:'Wisdom', quality:'Inspiration', desc:'The flash of creative insight. Raw potential before form.', strength:'original thinking', weakness:'impracticality' },
  { name:'Binah', english:'Understanding', quality:'Structure', desc:'The ability to analyze and give form to ideas.', strength:'deep comprehension', weakness:'excessive criticism' },
  { name:'Chesed', english:'Mercy', quality:'Loving-kindness', desc:'Expansion, generosity, and unconditional love.', strength:'compassion', weakness:'boundary issues' },
  { name:'Gevurah', english:'Severity', quality:'Discipline', desc:'Strength, judgment, and the power to set limits.', strength:'determination', weakness:'harshness' },
  { name:'Tiferet', english:'Beauty', quality:'Harmony', desc:'The heart center. Balance between mercy and severity.', strength:'balance and integration', weakness:'self-centeredness' },
  { name:'Netzach', english:'Victory', quality:'Endurance', desc:'Emotional drive, passion, and artistic expression.', strength:'perseverance', weakness:'obsession' },
  { name:'Hod', english:'Splendor', quality:'Intellect', desc:'Communication, analysis, and mental precision.', strength:'clarity of thought', weakness:'overthinking' },
  { name:'Yesod', english:'Foundation', quality:'Connection', desc:'The bridge between the spiritual and material worlds.', strength:'intuition', weakness:'illusion' },
  { name:'Malkhut', english:'Kingdom', quality:'Manifestation', desc:'The physical realm. Where spiritual energy becomes real.', strength:'grounding', weakness:'materialism' },
];

const HEBREW_VALUES = { a:1,b:2,g:3,d:4,h:5,v:6,z:7,ch:8,t:9,y:10,k:20,l:30,m:40,n:50,s:60,aa:70,p:80,tz:90,q:100,r:200,sh:300,th:400 };
const LATIN_VALUES = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:10,k:11,l:12,m:13,n:14,o:15,p:16,q:17,r:18,s:19,t:20,u:21,v:22,w:23,x:24,y:25,z:26 };

const GEOMANTIC_FIGURES = [
  { name:'Populus', meaning:'The People', element:'Water', nature:'gathering and reflection', answer:'Wait and observe.' },
  { name:'Via', meaning:'The Way', element:'Water', nature:'journey and transition', answer:'A path opens. Walk it.' },
  { name:'Albus', meaning:'White', element:'Air', nature:'clarity and wisdom', answer:'Seek knowledge before acting.' },
  { name:'Conjunctio', meaning:'Union', element:'Air', nature:'connection and partnership', answer:'Join forces with another.' },
  { name:'Puella', meaning:'The Girl', element:'Water', nature:'beauty and harmony', answer:'Grace and charm will serve you.' },
  { name:'Amissio', meaning:'Loss', element:'Fire', nature:'release and letting go', answer:'What is lost makes room for better.' },
  { name:'Fortuna Major', meaning:'Greater Fortune', element:'Earth', nature:'success and protection', answer:'Victory is assured. Press forward.' },
  { name:'Fortuna Minor', meaning:'Lesser Fortune', element:'Fire', nature:'swift but fleeting success', answer:'Act quickly. The window closes.' },
  { name:'Rubeus', meaning:'Red', element:'Fire', nature:'passion and conflict', answer:'Temper your fire. Restraint is power.' },
  { name:'Acquisitio', meaning:'Gain', element:'Air', nature:'acquisition and growth', answer:'What you seek is coming to you.' },
  { name:'Laetitia', meaning:'Joy', element:'Fire', nature:'happiness and upward motion', answer:'Good fortune rises. Celebrate.' },
  { name:'Tristitia', meaning:'Sorrow', element:'Earth', nature:'heaviness and introspection', answer:'Go inward. The answer is beneath the surface.' },
  { name:'Carcer', meaning:'Prison', element:'Earth', nature:'restriction and stability', answer:'You are held where you need to be.' },
  { name:'Caput Draconis', meaning:'Head of Dragon', element:'Earth', nature:'beginnings and thresholds', answer:'A new chapter begins now.' },
  { name:'Cauda Draconis', meaning:'Tail of Dragon', element:'Fire', nature:'endings and release', answer:'Let go. The old chapter closes.' },
  { name:'Puer', meaning:'The Boy', element:'Air', nature:'courage and aggression', answer:'Bold action is favored. Strike now.' },
];

const PERSIAN_POEMS = [
  { verse:'From the garden of patience, roses bloom in season.', tone:'Patience', guidance:'Your waiting bears fruit. Do not rush what is unfolding.', caution:'Impatience is your only enemy now.' },
  { verse:'The nightingale sings not for the thorns but for the rose.', tone:'Devotion', guidance:'Focus on what you love, not what wounds you.', caution:'Do not let pain distract from beauty.' },
  { verse:'Even the desert knows rain, given time.', tone:'Hope', guidance:'What seems barren will nourish you. Hold faith.', caution:'Doubt can dry what would otherwise flourish.' },
  { verse:'The caravan moves slowly, but it reaches the oasis.', tone:'Perseverance', guidance:'Steady progress matters more than speed.', caution:'Shortcuts may lead you astray.' },
  { verse:'A mirror shows truth only when you dare to look.', tone:'Self-awareness', guidance:'Face what you have been avoiding. Freedom lies there.', caution:'Denial is comfortable but costly.' },
  { verse:'The moon does not compete with the sun.', tone:'Acceptance', guidance:'Shine in your own way. Comparison steals your light.', caution:'Envy will cloud your vision.' },
  { verse:'Where the falcon turns, the wind obeys.', tone:'Authority', guidance:'Command your own direction. Others will follow.', caution:'Arrogance differs from confidence.' },
  { verse:'Wine is sweetest when shared at the table of friends.', tone:'Community', guidance:'Joy multiplies in company. Gather your people.', caution:'Isolation may feel safe but it starves the soul.' },
];


// ══════════════════════════════════════════════════════
//  Shared Computation Helpers
// ══════════════════════════════════════════════════════

function getJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
}

function parseBirthDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

function yearPillar(year) {
  const si = ((year - 4) % 10 + 10) % 10;
  const bi = ((year - 4) % 12 + 12) % 12;
  return { stem: HEAVENLY_STEMS[si], branch: EARTHLY_BRANCHES[bi] };
}

function dayPillar(y, m, d) {
  const jdn = getJDN(y, m, d);
  const refJdn = getJDN(2000, 1, 7); // Jan 7 2000 ≈ Jia-Zi
  const diff = jdn - refJdn;
  const si = ((diff % 10) + 10) % 10;
  const bi = ((diff % 12) + 12) % 12;
  return { stem: HEAVENLY_STEMS[si], branch: EARTHLY_BRANCHES[bi] };
}

function monthPillar(year, month, yearStemIdx) {
  const bi = ((month + 1) % 12 + 12) % 12;
  const monthStemBase = (yearStemIdx % 5) * 2;
  const si = (monthStemBase + month - 1) % 10;
  return { stem: HEAVENLY_STEMS[(si + 10) % 10], branch: EARTHLY_BRANCHES[bi] };
}

function hourPillar(hour, dayStemIdx) {
  const bi = Math.floor(((hour + 1) % 24) / 2);
  const hourStemBase = (dayStemIdx % 5) * 2;
  const si = (hourStemBase + bi) % 10;
  return { stem: HEAVENLY_STEMS[si], branch: EARTHLY_BRANCHES[bi] };
}

function computeBaZiChart(dateStr, timeStr) {
  const bd = parseBirthDate(dateStr);
  if (!bd) return null;
  const yp = yearPillar(bd.year);
  const dp = dayPillar(bd.year, bd.month, bd.day);
  const yStemIdx = HEAVENLY_STEMS.indexOf(yp.stem);
  const dStemIdx = HEAVENLY_STEMS.indexOf(dp.stem);
  const mp = monthPillar(bd.year, bd.month, yStemIdx);
  const hour = timeStr ? parseInt(timeStr.split(':')[0], 10) : 12;
  const hp = hourPillar(hour, dStemIdx);
  const pillars = { year: yp, month: mp, day: dp, hour: hp };
  const elements = { Wood:0, Fire:0, Earth:0, Metal:0, Water:0 };
  for (const p of Object.values(pillars)) {
    elements[STEM_ELEMENTS[p.stem]] = (elements[STEM_ELEMENTS[p.stem]] || 0) + 1;
    elements[BRANCH_ELEMENTS[p.branch]] = (elements[BRANCH_ELEMENTS[p.branch]] || 0) + 1;
  }
  const dayMaster = STEM_ELEMENTS[dp.stem];
  return { pillars, elements, dayMaster };
}

function chineseAnimal(year) {
  return CHINESE_ANIMALS[((year - 4) % 12 + 12) % 12];
}

function chineseElement(year) {
  return CHINESE_ELEMENTS_CYCLE[Math.floor(((year - 4) % 10) / 2)];
}

function approxNakshatra(dateStr) {
  const bd = parseBirthDate(dateStr);
  if (!bd) return NAKSHATRAS[0];
  const jdn = getJDN(bd.year, bd.month, bd.day);
  const idx = ((jdn * 7 + 13) % 27 + 27) % 27;
  return NAKSHATRAS[idx];
}

function letterValue(ch) {
  const c = ch.toLowerCase();
  return LATIN_VALUES[c] || 0;
}

function wordValue(text) {
  let total = 0;
  for (const ch of text) total += letterValue(ch);
  return total;
}

function numerologyName(name) {
  const vowels = 'aeiou';
  let soul = 0, personality = 0;
  for (const ch of name.toLowerCase()) {
    const v = letterValue(ch);
    if (vowels.includes(ch)) soul += v;
    else if (v > 0) personality += v;
  }
  return {
    destiny: reduceNumber(soul + personality),
    soul: reduceNumber(soul),
    personality: reduceNumber(personality),
  };
}


// ══════════════════════════════════════════════════════
//  Game Play Functions — organized by system
// ══════════════════════════════════════════════════════

// ── BaZi ──

function playBaZiElementBalance(result, form, inputs, dailySeed) {
  const chart = computeBaZiChart(form?.birth_date, form?.birth_time);
  if (!chart) return { error: 'Birth date required.' };
  const el = { ...chart.elements };

  // "What if" mode: boost a chosen element by 20%
  let whatIfNote = null;
  if (inputs.whatIf && el[inputs.whatIf] !== undefined) {
    const boosted = inputs.whatIf;
    const totalBefore = Object.values(el).reduce((s, v) => s + v, 0);
    const boost = Math.max(1, Math.round(totalBefore * 0.2));
    el[boosted] += boost;
    whatIfNote = `Simulating +20% ${boosted} energy (+${boost} points). See how the balance shifts.`;
  }

  const sorted = Object.entries(el).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const weakest = sorted[sorted.length - 1][0];
  const total = Object.values(el).reduce((s, v) => s + v, 0);

  const dIdx = dayIndex(dailySeed || '');
  const headlineOptions = [
    `${ELEMENT_ICONS[dominant]} ${dominant}-Dominant Chart`,
    `${ELEMENT_ICONS[dominant]} Your Chart Leads With ${dominant}`,
    `${ELEMENT_ICONS[dominant]} ${dominant} Energy Defines Your Chart`,
  ];
  const adviceOptions = [
    ELEMENT_TRAITS[dominant].balance,
    `Today, channel your ${dominant} strength by also nurturing ${weakest} energy.`,
    `Your ${dominant} core is powerful \u2014 let ${ELEMENT_PRODUCE[dominant]} activities bring flow today.`,
  ];

  const sections = [
    { title: 'Element Strengths', icon: ELEMENT_ICONS[dominant], items: sorted.filter(([, v]) => v >= 2).map(([e, v]) => ({ label: `${ELEMENT_ICONS[e]} ${e}`, value: `${Math.round((v / total) * 100)}%`, desc: ELEMENT_TRAITS[e].strong })) },
    { title: 'Areas to Develop', icon: ELEMENT_ICONS[weakest], items: sorted.filter(([, v]) => v < 2).map(([e, v]) => ({ label: `${ELEMENT_ICONS[e]} ${e}`, value: `${Math.round((v / total) * 100)}%`, desc: ELEMENT_TRAITS[e].weak })) },
    { title: 'Balance Strategy', icon: '\u2696', items: [
      { label: `Strengthen ${weakest}`, value: 'Key Focus', desc: ELEMENT_TRAITS[weakest].balance },
      { label: `${dominant} produces ${ELEMENT_PRODUCE[dominant]}`, value: 'Output', desc: `Your ${dominant} energy naturally feeds ${ELEMENT_PRODUCE[dominant]}` },
      { label: `${ELEMENT_CONTROL[dominant]} controls ${dominant}`, value: 'Check', desc: `Introduce ${ELEMENT_CONTROL[dominant]} activities to temper excess ${dominant}` },
    ] },
  ];
  if (whatIfNote) {
    sections.push({ title: 'What-If Simulation', icon: '\uD83D\uDD2C', items: [{ label: `+20% ${inputs.whatIf}`, value: 'Active', desc: whatIfNote }] });
  }
  return { type: 'identity', headline: headlineOptions[dIdx % headlineOptions.length], score: Math.round((sorted[0][1] / total) * 100), sections, strengths: [ELEMENT_TRAITS[dominant].strong], cautions: [ELEMENT_TRAITS[weakest].weak], advice: adviceOptions[dIdx % adviceOptions.length] };
}

function playBaZiFourPillars(result, form, inputs, dailySeed) {
  const chart = computeBaZiChart(form?.birth_date, form?.birth_time);
  if (!chart) return { error: 'Birth date required.' };
  const items = [];
  for (const [key, pillar] of Object.entries(chart.pillars)) {
    const info = PILLAR_DOMAINS[key];
    const animal = BRANCH_ANIMALS[pillar.branch];
    items.push({
      label: info.name,
      value: `${pillar.stem} ${pillar.branch}`,
      desc: `${info.domain} \u2014 ${STEM_ELEMENTS[pillar.stem]} ${pillar.stem} over ${animal} (${BRANCH_ELEMENTS[pillar.branch]}). ${info.desc}`,
    });
  }
  const dIdx = dayIndex(dailySeed || '');
  const adviceOptions = [
    'Understanding your Day Master is the key to reading your entire Four Pillars chart.',
    'Your Day Master is the lens through which all other pillar energies are interpreted.',
    'Start with your Day Master and trace how each pillar supports or challenges it.',
  ];
  const meaningOptions = [
    `Your Day Master is ${chart.dayMaster} ${chart.pillars.day.stem}. This is the core of your BaZi identity, shaping how you interact with every other element in your chart.`,
    `${chart.dayMaster} ${chart.pillars.day.stem} sits at the heart of your chart. Every relationship, career move, and life phase filters through this energy.`,
    `As a ${chart.dayMaster} ${chart.pillars.day.stem} Day Master, your fundamental nature is ${ELEMENT_TRAITS[chart.dayMaster].strong.toLowerCase()}.`,
  ];
  return { type: 'explorer', headline: `Day Master: ${STEM_ELEMENTS[chart.pillars.day.stem]} ${chart.pillars.day.stem}`, items, total: `Day Master Element: ${chart.dayMaster}`, meaning: meaningOptions[dIdx % meaningOptions.length], advice: adviceOptions[dIdx % adviceOptions.length] };
}

function playBaZiLuckTimeline(result, form, inputs, dailySeed) {
  const bd = parseBirthDate(form?.birth_date);
  if (!bd) return { error: 'Birth date required.' };
  const chart = computeBaZiChart(form?.birth_date, form?.birth_time);
  const startAge = 2 + (bd.month % 5);
  const periods = [];
  for (let i = 0; i < 8; i++) {
    const age = startAge + i * 10;
    const endAge = age + 9;
    const stemIdx = (HEAVENLY_STEMS.indexOf(chart.pillars.month.stem) + i) % 10;
    const branchIdx = (EARTHLY_BRANCHES.indexOf(chart.pillars.month.branch) + i) % 12;
    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];
    const element = STEM_ELEMENTS[stem];
    const supports = element === chart.dayMaster || ELEMENT_PRODUCE[element] === chart.dayMaster;
    periods.push({
      label: `${stem} ${branch}`,
      years: `Age ${age}\u2013${endAge}`,
      theme: supports ? 'Supportive Phase' : 'Growth Phase',
      element,
      desc: `${ELEMENT_ICONS[element]} ${element} energy ${supports ? 'supports' : 'challenges'} your ${chart.dayMaster} Day Master. ${supports ? 'A period of natural flow and opportunity.' : 'A period of growth through challenge and adaptation.'}`,
      rating: supports ? 'favorable' : 'challenging',
    });
  }
  const now = new Date().getFullYear();
  const age = now - bd.year;
  const currentIdx = periods.findIndex(p => { const a = parseInt(p.years.match(/\d+/)[0]); return age >= a && age < a + 10; });
  const dIdx = dayIndex(dailySeed || '');
  const adviceOptions = [
    'Each 10-year Luck Pillar brings a new elemental influence that interacts with your Day Master.',
    'Your current Luck Pillar sets the backdrop for daily decisions \u2014 work with its element, not against it.',
    'Transitions between Luck Pillars are pivotal moments. Prepare for the next phase by understanding its element.',
  ];
  return { type: 'timeline', headline: `${chart.dayMaster} Day Master \u2014 Life Phases`, periods, currentPeriod: currentIdx >= 0 ? currentIdx : 0, advice: adviceOptions[dIdx % adviceOptions.length] };
}

function playBaZiCompat(result, form, inputs, dailySeed) {
  if (!inputs.partner_date) return { error: 'Partner birth date required.' };
  const chart1 = computeBaZiChart(form?.birth_date, form?.birth_time);
  const chart2 = computeBaZiChart(inputs.partner_date);
  if (!chart1 || !chart2) return { error: 'Both birth dates required.' };
  const dm1 = chart1.dayMaster, dm2 = chart2.dayMaster;
  const produces = ELEMENT_PRODUCE[dm1] === dm2 || ELEMENT_PRODUCE[dm2] === dm1;
  const controls = ELEMENT_CONTROL[dm1] === dm2 || ELEMENT_CONTROL[dm2] === dm1;
  const same = dm1 === dm2;
  let baseScore = 55;
  if (produces) baseScore = 78;
  if (same) baseScore = 65;
  if (controls) baseScore = 42;
  const categories = [
    { name: 'Emotional Fit', score: produces ? 82 : same ? 68 : 48, desc: produces ? 'Your elements nourish each other\u2019s emotional needs' : 'You experience emotions differently \u2014 growth requires understanding' },
    { name: 'Communication', score: same ? 75 : produces ? 70 : 50, desc: same ? 'Similar elemental language creates natural understanding' : 'Different communication styles can complement or clash' },
    { name: 'Growth Potential', score: controls ? 80 : produces ? 65 : 60, desc: controls ? 'Tension drives transformation and mutual evolution' : 'Growth comes through supporting each other\u2019s strengths' },
    { name: 'Conflict Triggers', score: controls ? 35 : same ? 55 : 72, desc: controls ? 'Power dynamics need conscious management' : 'Relatively few natural friction points' },
  ];
  const dIdx = dayIndex(dailySeed || '');
  const adviceOptions = [
    `In BaZi, ${dm1} and ${dm2} ${produces ? 'form a productive cycle' : controls ? 'form a controlling cycle' : 'share elemental nature'}. The key is conscious awareness of how your elements interact.`,
    `The ${dm1}-${dm2} pairing ${produces ? 'thrives on mutual nourishment' : controls ? 'grows strongest through healthy boundaries' : 'deepens through shared understanding'}. Lean into that dynamic today.`,
    `${dm1} and ${dm2} together ${produces ? 'create a generative loop \u2014 feed it intentionally' : controls ? 'forge resilience \u2014 respect each other\u2019s power' : 'mirror each other \u2014 use that clarity wisely'}.`,
  ];
  return { type: 'compatibility', headline: `${ELEMENT_ICONS[dm1]} ${dm1} + ${ELEMENT_ICONS[dm2]} ${dm2}`, score: baseScore, scoreLabel: baseScore >= 70 ? 'Strong Harmony' : baseScore >= 50 ? 'Growth Potential' : 'Dynamic Tension', categories, bestFeature: produces ? `${dm1} and ${dm2} form a producing pair \u2014 one feeds the other` : same ? 'Same element creates instant recognition' : `${dm1} and ${dm2} challenge each other toward growth`, watchOut: controls ? `The ${ELEMENT_CONTROL[dm1] === dm2 ? dm1 : dm2} partner may unconsciously dominate` : 'Avoid taking harmony for granted', advice: adviceOptions[dIdx % adviceOptions.length] };
}

// ── Vedic ──

function playVedicGunaMatch(result, form, inputs, dailySeed) {
  if (!inputs.partner_date) return { error: 'Partner birth date required.' };
  const nak1 = approxNakshatra(form?.birth_date);
  const nak2 = approxNakshatra(inputs.partner_date);
  const rng = seededRandom(`guna-${form?.birth_date}-${inputs.partner_date}-${dailySeed || ''}`);
  const categories = GUNA_CATEGORIES.map(cat => {
    const score = Math.min(cat.max, Math.round(rng() * cat.max) + (nak1.name === nak2.name ? 1 : 0));
    return { name: cat.name, score, max: cat.max, desc: `${cat.desc}. Score: ${score}/${cat.max}` };
  });
  const total = categories.reduce((s, c) => s + c.score, 0);
  const maxTotal = 36;
  const pct = Math.round((total / maxTotal) * 100);
  return { type: 'compatibility', headline: `${nak1.name} + ${nak2.name}`, score: pct, scoreLabel: total >= 25 ? 'Excellent Match' : total >= 18 ? 'Good Match' : total >= 12 ? 'Average Match' : 'Challenging Match', categories: categories.map(c => ({ name: `${c.name} (${c.score}/${c.max})`, score: Math.round((c.score / c.max) * 100), desc: c.desc })), bestFeature: `Strongest area: ${categories.sort((a, b) => (b.score / b.max) - (a.score / a.max))[0].name}`, watchOut: `Weakest area: ${categories.sort((a, b) => (a.score / a.max) - (b.score / b.max))[0].name}`, advice: `Total Guna Score: ${total}/${maxTotal}. In Vedic tradition, 18+ is considered favorable for marriage.` };
}

function playVedicDashaTimeline(result, form, inputs, dailySeed) {
  const bd = parseBirthDate(form?.birth_date);
  if (!bd) return { error: 'Birth date required.' };
  const nak = approxNakshatra(form?.birth_date);
  const dashaLords = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
  const dashaYears = [7, 20, 6, 10, 7, 18, 16, 19, 17];
  const startIdx = NAKSHATRAS.indexOf(nak) % 9;
  const periods = [];
  let cumAge = 0;
  for (let i = 0; i < 9; i++) {
    const idx = (startIdx + i) % 9;
    const lord = dashaLords[idx];
    const years = dashaYears[idx];
    const planetMeaning = PLANET_MEANINGS[lord] || `the energy of ${lord}`;
    periods.push({
      label: `${lord} Dasha`,
      years: `Age ${cumAge}\u2013${cumAge + years}`,
      theme: `Period of ${planetMeaning}`,
      element: lord,
      desc: `${lord} governs ${planetMeaning}. This ${years}-year period shapes your ${i < 3 ? 'early life' : i < 6 ? 'mid-life' : 'later years'} significantly.`,
      rating: ['Venus', 'Jupiter', 'Mercury'].includes(lord) ? 'favorable' : ['Saturn', 'Rahu', 'Ketu'].includes(lord) ? 'challenging' : 'neutral',
    });
    cumAge += years;
  }
  const now = new Date().getFullYear();
  const age = now - bd.year;
  const currentIdx = periods.findIndex(p => { const a = parseInt(p.years.match(/\d+/)[0]); const end = parseInt(p.years.match(/\d+$/)[0]); return age >= a && age < end; });
  return { type: 'timeline', headline: `${nak.name} Nakshatra \u2014 Dasha Map`, periods, currentPeriod: currentIdx >= 0 ? currentIdx : 0, advice: `Your birth nakshatra ${nak.name} determines the starting point of your planetary periods. Each dasha lord brings its own themes and lessons.` };
}

function playVedicPrashna(result, form, inputs, dailySeed) {
  if (!inputs.question?.trim()) return { error: 'Please enter a question.' };
  const seed = `prashna-${inputs.question}-${Date.now()}-${dailySeed || ''}`;
  const rng = seededRandom(seed);
  const nak = approxNakshatra(form?.birth_date);
  const lords = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const lord = pick(lords, rng);
  const favorable = rng() > 0.4;
  return { type: 'oracle', headline: `${lord} Speaks`, verse: `The ${lord} casts its light upon your question through ${nak.name}.`, answer: favorable ? 'The signs are favorable. Conditions support your intention.' : 'The signs urge caution. Timing or approach may need adjustment.', guidance: `${lord} governs ${PLANET_MEANINGS[lord] || 'cosmic influence'}. ${favorable ? 'This energy supports your inquiry.' : 'Patience and reflection are advised.'}`, caution: favorable ? 'Do not mistake ease for certainty \u2014 remain mindful.' : 'Resistance is not rejection \u2014 it may be redirection.', timing: favorable ? 'Within the current lunar cycle' : 'After a period of reflection', actions: ['Meditate on the answer', 'Revisit in one lunar cycle', 'Consider an alternative approach'] };
}

function playVedicNakshatra(result, form, inputs, dailySeed) {
  if (!form?.birth_date) return { error: 'Birth date required.' };
  const nak = approxNakshatra(form.birth_date);
  const sections = [
    { title: 'Core Identity', icon: '\u2606', items: [
      { label: 'Nakshatra', value: nak.name, desc: `Ruled by ${nak.deity}` },
      { label: 'Archetype', value: nak.trait, desc: nak.style },
    ] },
    { title: 'Strengths', icon: '\u2728', items: [
      { label: 'Sacred Power', value: nak.power, desc: `Your nakshatra grants the power of ${nak.power}` },
    ] },
    { title: 'Shadow & Growth', icon: '\u263D', items: [
      { label: 'Challenge', value: nak.challenge, desc: `Growth comes through transcending ${nak.challenge}` },
    ] },
  ];
  return { type: 'identity', headline: `${nak.name} \u2014 ${nak.trait}`, score: null, sections, strengths: [nak.power, nak.style], cautions: [nak.challenge], advice: `As a ${nak.name} native ruled by ${nak.deity}, your soul\u2019s purpose is expressed through ${nak.power}. Embrace this gift while remaining aware of the tendency toward ${nak.challenge}.` };
}

// ── Western ──

function playWesternSynastry(result, form, inputs, dailySeed) {
  if (!inputs.partner_date) return { error: 'Partner birth date required.' };
  const sign1 = signFromDate(form?.birth_date);
  const sign2 = signFromDate(inputs.partner_date);
  const elem1 = SIGN_ELEMENTS[sign1], elem2 = SIGN_ELEMENTS[sign2];
  const mod1 = SIGN_MODALITIES[sign1], mod2 = SIGN_MODALITIES[sign2];
  const eScore = ELEMENT_COMPAT[`${elem1}-${elem2}`] || 50;
  const sameElem = elem1 === elem2;
  const categories = [
    { name: 'Attraction', score: eScore + (sameElem ? 5 : -5), desc: `${elem1} and ${elem2} ${sameElem ? 'recognize each other instantly' : 'create magnetic polarity'}` },
    { name: 'Communication', score: mod1 === mod2 ? 72 : 58, desc: `${mod1} meets ${mod2} \u2014 ${mod1 === mod2 ? 'similar rhythms' : 'complementary pacing'}` },
    { name: 'Emotional Bond', score: Math.min(95, eScore + 10), desc: `The ${elem1}\u2013${elem2} connection shapes emotional depth` },
    { name: 'Long-term Stability', score: Math.round((eScore + (mod1 === mod2 ? 70 : 55)) / 2), desc: 'How the pairing weathers time and growth' },
    { name: 'Conflict Chemistry', score: 100 - eScore, desc: eScore > 70 ? 'Low friction, high ease' : 'Dynamic tension fuels growth' },
  ];
  const avg = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);
  const dIdx = dayIndex(dailySeed || '');
  const adviceOptions = [
    `${sign1} (${elem1}/${mod1}) and ${sign2} (${elem2}/${mod2}) create a ${avg >= 70 ? 'naturally harmonious' : 'growth-oriented'} dynamic. The key aspects to nurture are ${categories[0].name.toLowerCase()} and ${categories[1].name.toLowerCase()}.`,
    `The ${sign1}-${sign2} connection is shaped by ${elem1} meeting ${elem2}. ${sameElem ? 'Shared elements deepen understanding but watch for echo-chamber tendencies.' : 'Different elements create the spark that keeps the relationship alive.'}`,
    `Today the stars highlight the ${categories[dIdx % categories.length].name.toLowerCase()} dimension of your ${sign1}-${sign2} bond. Give it attention.`,
  ];
  return { type: 'compatibility', headline: `${SIGN_ICONS[sign1]} ${sign1} + ${SIGN_ICONS[sign2]} ${sign2}`, score: Math.min(95, Math.max(20, avg)), scoreLabel: avg >= 70 ? 'Strong Chemistry' : avg >= 55 ? 'Solid Potential' : 'Dynamic Pairing', categories, bestFeature: categories.sort((a, b) => b.score - a.score)[0].name, watchOut: categories.sort((a, b) => a.score - b.score)[0].name + ' needs attention', advice: adviceOptions[dIdx % adviceOptions.length] };
}

function playWesternNatalChallenge(result, form, inputs, dailySeed) {
  if (!form?.birth_date) return { error: 'Birth date required.' };
  const sign = signFromDate(form.birth_date);
  const rng = seededRandom(`natal-${form.birth_date}-${dailySeed || ''}`);
  const moonSign = SIGNS[Math.floor(rng() * 12)];
  const rising = SIGNS[Math.floor(rng() * 12)];
  const strongPlanet = pick(PLANETS, rng);
  const strongHouse = Math.floor(rng() * 12) + 1;
  const items = [
    { label: 'Sun Sign', value: `${SIGN_ICONS[sign]} ${sign}`, desc: `Your core identity and ego expression. ${SIGN_ELEMENTS[sign]} element, ${SIGN_MODALITIES[sign]} modality.` },
    { label: 'Moon Sign', value: `${SIGN_ICONS[moonSign]} ${moonSign}`, desc: `Your emotional inner world. ${SIGN_ELEMENTS[moonSign]} element shapes how you feel and nurture.` },
    { label: 'Rising Sign', value: `${SIGN_ICONS[rising]} ${rising}`, desc: `Your outward persona and first impression. ${SIGN_ELEMENTS[rising]} energy is what others see first.` },
    { label: 'Dominant Planet', value: `${PLANET_SYMBOLS[strongPlanet]} ${strongPlanet}`, desc: `${strongPlanet} governs ${PLANET_MEANINGS[strongPlanet]} in your chart.` },
    { label: 'Power House', value: `House ${strongHouse}`, desc: `The ${strongHouse}th house of ${HOUSE_MEANINGS[strongHouse]} is your strongest life area.` },
  ];
  const dIdx = dayIndex(dailySeed || '');
  const adviceOptions = [
    `Focus on your ${strongHouse}th house (${HOUSE_MEANINGS[strongHouse]}) \u2014 this is where your chart concentrates the most energy.`,
    `With ${strongPlanet} dominant, today is ideal for activities related to ${PLANET_MEANINGS[strongPlanet]}.`,
    `Your Big Three (${sign}/${moonSign}/${rising}) suggests leading with your ${SIGN_ELEMENTS[rising]} Rising energy today.`,
  ];
  const meaningOptions = [
    `Your Sun in ${sign} gives you ${SIGN_ELEMENTS[sign]} core energy, your Moon in ${moonSign} shapes your emotional world, and ${rising} Rising is how the world first perceives you.`,
    `The ${sign} Sun drives your identity, while ${moonSign} Moon reveals what you need emotionally. ${rising} Rising is your social armor.`,
    `Three elements converge: ${SIGN_ELEMENTS[sign]} will, ${SIGN_ELEMENTS[moonSign]} feeling, and ${SIGN_ELEMENTS[rising]} presentation. Notice which leads today.`,
  ];
  return { type: 'explorer', headline: `${SIGN_ICONS[sign]} ${sign} Sun \u2014 Chart Map`, items, total: `Big Three: ${sign} / ${moonSign} / ${rising}`, meaning: meaningOptions[dIdx % meaningOptions.length], advice: adviceOptions[dIdx % adviceOptions.length] };
}

function playWesternTransit(result, form, inputs, dailySeed) {
  if (!form?.birth_date) return { error: 'Birth date required.' };
  const sign = signFromDate(form.birth_date);
  const rng = seededRandom(`transit-${form.birth_date}-${dailySeed || new Date().toISOString().slice(0, 10)}`);
  const areas = ['Love', 'Career', 'Mood', 'Opportunity', 'Challenge'];
  const periods = areas.map(area => {
    const planet = pick(PLANETS, rng);
    const rating = rng() > 0.5 ? 'favorable' : rng() > 0.3 ? 'neutral' : 'challenging';
    return { label: area, years: `${planet} transit`, theme: `${PLANET_SYMBOLS[planet]} ${planet} influences ${area.toLowerCase()}`, element: planet, desc: `${planet} is currently activating your ${area.toLowerCase()} zone. ${rating === 'favorable' ? 'Energy flows naturally.' : rating === 'neutral' ? 'Steady conditions.' : 'Friction creates growth.'}`, rating };
  });
  const dIdx = dayIndex(dailySeed || '');
  const adviceOptions = [
    'Transit influences change as planets move through your chart. Check back regularly for updated cosmic weather.',
    'Today\u2019s planetary weather is unique. Notice which transit area resonates most with your current situation.',
    'Transits are invitations, not commands. Use them as lenses to focus your awareness today.',
  ];
  return { type: 'timeline', headline: `Current Transits for ${SIGN_ICONS[sign]} ${sign}`, periods, currentPeriod: 0, advice: adviceOptions[dIdx % adviceOptions.length] };
}

function playWesternHousePower(result, form, inputs, dailySeed) {
  if (!form?.birth_date) return { error: 'Birth date required.' };
  const rng = seededRandom(`houses-${form.birth_date}-${dailySeed || ''}`);
  const houses = [];
  for (let i = 1; i <= 12; i++) {
    houses.push({ house: i, meaning: HOUSE_MEANINGS[i], score: Math.round(rng() * 60 + 30) });
  }
  houses.sort((a, b) => b.score - a.score);
  const top3 = houses.slice(0, 3);
  const bottom3 = houses.slice(-3);
  const sections = [
    { title: 'Strongest Houses', icon: '\u2B50', items: top3.map(h => ({ label: `House ${h.house}`, value: `${h.score}%`, desc: `${h.meaning} \u2014 this area of life is naturally empowered in your chart` })) },
    { title: 'Growth Areas', icon: '\uD83C\uDF31', items: bottom3.map(h => ({ label: `House ${h.house}`, value: `${h.score}%`, desc: `${h.meaning} \u2014 conscious effort here brings disproportionate reward` })) },
  ];
  const dIdx = dayIndex(dailySeed || '');
  const adviceOptions = [
    `Your strongest life area is the ${top3[0].house}th house of ${top3[0].meaning}. Lean into this natural strength while developing your growth areas.`,
    `Today, the ${top3[0].house}th house of ${top3[0].meaning} is especially activated. Direct your focus there for maximum impact.`,
    `Balance is key: your ${top3[0].meaning} house leads, but growth lives in your ${bottom3[0].meaning} house. Give both attention today.`,
  ];
  return { type: 'identity', headline: `Power House: ${top3[0].meaning}`, score: top3[0].score, sections, strengths: top3.map(h => `House ${h.house}: ${h.meaning}`), cautions: bottom3.map(h => `House ${h.house}: ${h.meaning} needs attention`), advice: adviceOptions[dIdx % adviceOptions.length] };
}

// ── Chinese ──

function playChineseCompatMatrix(result, form, inputs, dailySeed) {
  if (!inputs.partner_date) return { error: 'Partner birth date required.' };
  const bd1 = parseBirthDate(form?.birth_date);
  const bd2 = parseBirthDate(inputs.partner_date);
  if (!bd1 || !bd2) return { error: 'Both birth dates required.' };
  const a1 = chineseAnimal(bd1.year), a2 = chineseAnimal(bd2.year);
  const e1 = chineseElement(bd1.year), e2 = chineseElement(bd2.year);
  const isBest = CHINESE_COMPAT.best[a1]?.includes(a2);
  const isWorst = CHINESE_COMPAT.worst[a1]?.includes(a2);
  const cRng = seededRandom(`cn-compat-${form?.birth_date}-${inputs.partner_date}-${dailySeed || ''}`);
  const score = isBest ? 85 + Math.round(cRng() * 10) : isWorst ? 25 + Math.round(cRng() * 15) : 50 + Math.round(cRng() * 20);
  const categories = [
    { name: 'Harmony', score: isBest ? 88 : isWorst ? 30 : 60, desc: isBest ? 'Natural allies in the zodiac' : isWorst ? 'Opposite energies create friction' : 'Neutral pairing with room to grow' },
    { name: 'Passion', score: isWorst ? 75 : isBest ? 70 : 55, desc: isWorst ? 'Opposites attract intensely' : 'Steady warm connection' },
    { name: 'Communication', score: isBest ? 80 : 55, desc: `${a1} (${CHINESE_ANIMAL_TRAITS[a1]}) meets ${a2} (${CHINESE_ANIMAL_TRAITS[a2]})` },
    { name: 'Longevity', score: isBest ? 85 : isWorst ? 40 : 60, desc: isBest ? 'Built to last' : 'Requires conscious effort' },
  ];
  return { type: 'compatibility', headline: `${CHINESE_ANIMAL_ICONS[a1]} ${a1} + ${CHINESE_ANIMAL_ICONS[a2]} ${a2}`, score, scoreLabel: isBest ? 'Heavenly Match' : isWorst ? 'Dynamic Opposites' : 'Compatible Pair', categories, bestFeature: `${a1} brings ${CHINESE_ANIMAL_TRAITS[a1].split(',')[0].trim()}, ${a2} brings ${CHINESE_ANIMAL_TRAITS[a2].split(',')[0].trim()}`, watchOut: isWorst ? `${a1} and ${a2} traditionally clash \u2014 conscious effort needed` : 'Don\u2019t take harmony for granted', advice: `${e1} ${a1} and ${e2} ${a2}: ${isBest ? 'a classically blessed pairing in Chinese astrology' : isWorst ? 'a challenging but potentially transformative bond' : 'a pairing with solid potential when nurtured'}.` };
}

function playChineseFortuneStick(result, form, inputs, dailySeed) {
  if (!inputs.question?.trim()) return { error: 'Please enter a question.' };
  const seed = `fortune-${inputs.question}-${Date.now()}-${dailySeed || ''}`;
  const rng = seededRandom(seed);
  const poem = pick(FORTUNE_POEMS, rng);
  const bd = parseBirthDate(form?.birth_date);
  const animal = bd ? chineseAnimal(bd.year) : 'Dragon';
  return { type: 'oracle', headline: `Stick #${poem.num} \u2014 ${poem.luck}`, verse: poem.verse, answer: poem.meaning, guidance: `The ${animal} energy in your chart adds ${CHINESE_ANIMAL_TRAITS[animal].split(',')[0].trim()} to this reading. ${poem.meaning}`, caution: poem.luck === 'Moderate' ? 'Proceed with awareness. Not all doors are meant to open now.' : poem.luck === 'Excellent' ? 'Fortune favors you, but do not become complacent.' : 'Steady effort will shift conditions in your favor.', timing: poem.luck === 'Excellent' ? 'Immediate' : poem.luck === 'Very Good' ? 'Within days' : 'Within one lunar month', actions: ['Reflect on the verse', 'Take one aligned action today', 'Return for another drawing later'] };
}

function playChineseYearChallenge(result, form, inputs, dailySeed) {
  const bd = parseBirthDate(form?.birth_date);
  if (!bd) return { error: 'Birth date required.' };
  const userAnimal = chineseAnimal(bd.year);
  const userElem = chineseElement(bd.year);
  const now = new Date().getFullYear();
  const periods = [];
  for (let offset = -1; offset <= 5; offset++) {
    const yr = now + offset;
    const yrAnimal = chineseAnimal(yr);
    const yrElem = chineseElement(yr);
    const isBest = CHINESE_COMPAT.best[userAnimal]?.includes(yrAnimal);
    const isWorst = CHINESE_COMPAT.worst[userAnimal]?.includes(yrAnimal);
    const same = userAnimal === yrAnimal;
    periods.push({
      label: `${yr} \u2014 ${CHINESE_ANIMAL_ICONS[yrAnimal]} ${yrElem} ${yrAnimal}`,
      years: String(yr),
      theme: same ? 'Ben Ming Nian (Birth Year)' : isBest ? 'Highly Favorable' : isWorst ? 'Challenging' : 'Neutral',
      element: yrElem,
      desc: same ? 'Your zodiac year returns. Tradition advises caution and wearing red for protection.' : isBest ? `The ${yrAnimal} strongly supports your ${userAnimal} energy this year.` : isWorst ? `The ${yrAnimal} opposes your ${userAnimal}. Practice patience and flexibility.` : `A steady year. ${yrAnimal} and ${userAnimal} coexist without strong pull.`,
      rating: same ? 'challenging' : isBest ? 'favorable' : isWorst ? 'challenging' : 'neutral',
    });
  }
  const currentIdx = 1;
  return { type: 'timeline', headline: `${CHINESE_ANIMAL_ICONS[userAnimal]} ${userElem} ${userAnimal} \u2014 Year Forecast`, periods, currentPeriod: currentIdx, advice: `As a ${userElem} ${userAnimal}, your fortune shifts with each year\u2019s animal energy. Allied years bring ease; opposing years build resilience.` };
}

// ── Numerology ──

function playNumDeepDecoder(result, form, inputs, dailySeed) {
  if (!form?.birth_date) return { error: 'Birth date required.' };
  const lp = lifePath(form.birth_date);
  const lpData = LIFE_PATH_DATA[lp] || LIFE_PATH_DATA[reduceNumber(lp)] || LIFE_PATH_DATA[1];
  const name = form?.full_name || 'User';
  const nameNums = numerologyName(name);
  const bd = parseBirthDate(form.birth_date);
  const birthdayNum = reduceNumber(bd.day);
  const sections = [
    { title: 'Life Path', icon: '\uD83D\uDCA0', items: [{ label: 'Number', value: String(lp), desc: `${lpData.trait}: ${lpData.teaser}` }] },
    { title: 'Destiny Number', icon: '\u2728', items: [{ label: 'Number', value: String(nameNums.destiny), desc: `Your name vibrates at ${nameNums.destiny}. This shapes your life\u2019s mission and outward expression.` }] },
    { title: 'Soul Urge', icon: '\u2764', items: [{ label: 'Number', value: String(nameNums.soul), desc: `Your inner desire and heart\u2019s true motivation resonates at ${nameNums.soul}.` }] },
    { title: 'Personality', icon: '\uD83C\uDF1F', items: [{ label: 'Number', value: String(nameNums.personality), desc: `How others perceive you. Your outer mask vibrates at ${nameNums.personality}.` }] },
    { title: 'Birthday Number', icon: '\uD83C\uDF82', items: [{ label: 'Number', value: String(birthdayNum), desc: `Born on the ${bd.day}th: this number adds a special talent or gift to your profile.` }] },
  ];
  return { type: 'identity', headline: `Life Path ${lp}: ${lpData.trait}`, score: null, sections, strengths: [lpData.teaser], cautions: ['Avoid over-identifying with a single number \u2014 your full code tells the complete story'], advice: `Your core code is ${lp}-${nameNums.destiny}-${nameNums.soul}-${nameNums.personality}-${birthdayNum}. Together these five numbers paint your complete numerological portrait.` };
}

function playNumRelationship(result, form, inputs, dailySeed) {
  if (!inputs.partner_date) return { error: 'Partner birth date required.' };
  const lp1 = lifePath(form?.birth_date);
  const lp2 = lifePath(inputs.partner_date);
  const name1 = form?.full_name || 'You';
  const name2 = inputs.partner_name || 'Partner';
  const n1 = numerologyName(name1);
  const n2 = numerologyName(name2);
  const same = lp1 === lp2;
  const compatible = Math.abs(lp1 - lp2) <= 2 || same;
  const score = same ? 80 : compatible ? 70 : 55;
  const categories = [
    { name: 'Life Path Harmony', score: same ? 85 : compatible ? 72 : 50, desc: `${lp1} and ${lp2}: ${same ? 'identical paths create deep understanding' : compatible ? 'neighboring numbers share wavelength' : 'different paths bring complementary gifts'}` },
    { name: 'Destiny Alignment', score: n1.destiny === n2.destiny ? 88 : 55, desc: `Destiny ${n1.destiny} meets ${n2.destiny}` },
    { name: 'Soul Connection', score: n1.soul === n2.soul ? 90 : Math.abs(n1.soul - n2.soul) <= 2 ? 70 : 50, desc: `Soul urge ${n1.soul} and ${n2.soul}` },
    { name: 'Communication', score: n1.personality === n2.personality ? 82 : 58, desc: `Personality ${n1.personality} and ${n2.personality}` },
  ];
  return { type: 'compatibility', headline: `Life Path ${lp1} + ${lp2}`, score, scoreLabel: score >= 75 ? 'Natural Harmony' : score >= 60 ? 'Growth Partnership' : 'Complementary Differences', categories, bestFeature: same ? 'Identical Life Paths create instant recognition' : `${lp1} and ${lp2} bring complementary strengths`, watchOut: same ? 'Too much similarity can create blind spots' : 'Honor your different approaches to life', advice: `When Life Path ${lp1} meets ${lp2}, the relationship becomes a classroom for ${same ? 'deepening what you already share' : 'expanding into new dimensions'}.` };
}

function playNumYearTimeline(result, form, inputs, dailySeed) {
  const bd = parseBirthDate(form?.birth_date);
  if (!bd) return { error: 'Birth date required.' };
  const now = new Date().getFullYear();
  const periods = [];
  const themes = { 1:'New Beginnings', 2:'Partnership', 3:'Expression', 4:'Foundation', 5:'Change', 6:'Responsibility', 7:'Reflection', 8:'Power', 9:'Completion' };
  for (let offset = -2; offset <= 6; offset++) {
    const yr = now + offset;
    const py = reduceNumber(bd.month + bd.day + reduceNumber(yr));
    const finalPy = py > 9 ? reduceNumber(py) : py;
    periods.push({
      label: `${yr} \u2014 Personal Year ${finalPy}`,
      years: String(yr),
      theme: themes[finalPy] || `Year ${finalPy}`,
      element: String(finalPy),
      desc: `Personal Year ${finalPy}: A year of ${(themes[finalPy] || 'growth').toLowerCase()}. ${finalPy === 1 ? 'Plant seeds for a new 9-year cycle.' : finalPy === 9 ? 'Release what no longer serves you.' : `Focus on ${(themes[finalPy] || '').toLowerCase()} to align with the year\u2019s energy.`}`,
      rating: [1, 3, 5, 8].includes(finalPy) ? 'favorable' : finalPy === 9 ? 'challenging' : 'neutral',
    });
  }
  return { type: 'timeline', headline: `9-Year Cycle Map`, periods, currentPeriod: 2, advice: 'Numerology runs in 9-year cycles. Each Personal Year carries a distinct theme. Aligning your actions with the year\u2019s energy creates flow.' };
}

// ── Kabbalistic ──

function playKabTreeJourney(result, form, inputs, dailySeed) {
  if (!form?.birth_date) return { error: 'Birth date required.' };
  const rng = seededRandom(`tree-${form.birth_date}-${dailySeed || ''}`);
  const items = SEPHIROT.map((s, i) => {
    const strength = Math.round(rng() * 60 + 30);
    return { label: `${s.name} (${s.english})`, value: `${strength}%`, desc: `${s.quality}: ${s.desc}` };
  });
  const strongest = items.sort((a, b) => parseInt(b.value) - parseInt(a.value))[0];
  return { type: 'explorer', headline: `Tree of Life Profile`, items, total: `Strongest Sephirah: ${strongest.label}`, meaning: `Your Tree of Life is anchored in ${strongest.label.split(' (')[0]}. This sephirah\u2019s quality of ${SEPHIROT.find(s => strongest.label.startsWith(s.name))?.quality} is your spiritual center of gravity.`, advice: 'The Tree of Life is a map of consciousness. Each sephirah represents a different quality of being. Balance comes from developing all ten.' };
}

function playKabSephirotBalance(result, form, inputs, dailySeed) {
  if (!form?.birth_date) return { error: 'Birth date required.' };
  const rng = seededRandom(`sephirot-${form.birth_date}-${dailySeed || ''}`);
  const scored = SEPHIROT.map(s => ({ ...s, score: Math.round(rng() * 60 + 30) }));
  scored.sort((a, b) => b.score - a.score);
  const sections = [
    { title: 'Spiritual Strengths', icon: '\u2721', items: scored.slice(0, 3).map(s => ({ label: `${s.name} \u2014 ${s.english}`, value: `${s.score}%`, desc: `${s.quality}: ${s.strength}` })) },
    { title: 'Growth Edges', icon: '\uD83C\uDF31', items: scored.slice(-3).map(s => ({ label: `${s.name} \u2014 ${s.english}`, value: `${s.score}%`, desc: `${s.quality}: Address the tendency toward ${s.weakness}` })) },
  ];
  return { type: 'identity', headline: `Anchored in ${scored[0].name}`, score: scored[0].score, sections, strengths: scored.slice(0, 3).map(s => s.strength), cautions: scored.slice(-3).map(s => s.weakness), advice: `Your consciousness is most developed in ${scored[0].name} (${scored[0].english}) and least in ${scored[scored.length - 1].name} (${scored[scored.length - 1].english}). The path to wholeness runs between them.` };
}

function playKabPathCompat(result, form, inputs, dailySeed) {
  if (!inputs.partner_date) return { error: 'Partner birth date required.' };
  const rng1 = seededRandom(`sephirot-${form?.birth_date}-${dailySeed || ''}`);
  const rng2 = seededRandom(`sephirot-${inputs.partner_date}-${dailySeed || ''}`);
  const scores1 = SEPHIROT.map(s => ({ name: s.name, english: s.english, score: Math.round(rng1() * 60 + 30) }));
  const scores2 = SEPHIROT.map(s => ({ name: s.name, english: s.english, score: Math.round(rng2() * 60 + 30) }));
  const categories = SEPHIROT.slice(0, 5).map((s, i) => {
    const diff = Math.abs(scores1[i].score - scores2[i].score);
    const harmony = Math.max(20, 100 - diff * 2);
    return { name: `${s.name} (${s.english})`, score: harmony, desc: diff < 15 ? 'Strong alignment in this quality' : 'Complementary differences here' };
  });
  const avg = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);
  return { type: 'compatibility', headline: `Tree of Life Compatibility`, score: avg, scoreLabel: avg >= 70 ? 'Deep Resonance' : avg >= 50 ? 'Complementary Paths' : 'Growth Pairing', categories, bestFeature: categories.sort((a, b) => b.score - a.score)[0].name, watchOut: categories.sort((a, b) => a.score - b.score)[0].name, advice: 'On the Tree of Life, compatibility is measured not by sameness but by how well two souls complete each other\u2019s missing qualities.' };
}

// ── Gematria ──

function playGemWordDecoder(result, form, inputs, dailySeed) {
  const text = inputs.text?.trim();
  if (!text) return { error: 'Enter a word or name.' };
  const total = wordValue(text);
  const reduced = reduceNumber(total);
  const items = [];
  for (const ch of text) {
    const v = letterValue(ch);
    if (v > 0) items.push({ label: ch.toUpperCase(), value: String(v), desc: `Letter ${ch.toUpperCase()} = ${v}` });
  }
  return { type: 'explorer', headline: `"${text}" = ${total}`, items, total: `Full Value: ${total} \u2192 Reduced: ${reduced}`, meaning: `The word "${text}" carries the vibration of ${total} (reduced to ${reduced}). ${LIFE_PATH_DATA[reduced] ? LIFE_PATH_DATA[reduced].teaser : `This number resonates with the energy of ${reduced}.`}`, advice: 'In Gematria, every word is also a number, and every number carries meaning. Words with the same value share a hidden connection.' };
}

function playGemHiddenLink(result, form, inputs, dailySeed) {
  const t1 = inputs.text?.trim(), t2 = inputs.text2?.trim();
  if (!t1 || !t2) return { error: 'Enter both words or names.' };
  const v1 = wordValue(t1), v2 = wordValue(t2);
  const r1 = reduceNumber(v1), r2 = reduceNumber(v2);
  const sameReduced = r1 === r2;
  const diff = Math.abs(v1 - v2);
  const categories = [
    { name: 'Direct Value Link', score: v1 === v2 ? 100 : Math.max(10, 100 - diff), desc: `"${t1}" = ${v1}, "${t2}" = ${v2}. ${v1 === v2 ? 'Identical vibration!' : `Difference of ${diff}`}` },
    { name: 'Reduced Harmony', score: sameReduced ? 90 : Math.max(20, 80 - Math.abs(r1 - r2) * 10), desc: `Reduced: ${r1} and ${r2}. ${sameReduced ? 'Same core frequency!' : 'Different root vibrations'}` },
    { name: 'Hidden Bridge', score: sameReduced ? 85 : diff < 10 ? 75 : 45, desc: sameReduced ? `Both words reduce to ${r1} \u2014 a deep hidden connection` : 'The bridge between these words is their contrast' },
  ];
  const avg = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);
  return { type: 'compatibility', headline: `"${t1}" \u2194 "${t2}"`, score: avg, scoreLabel: sameReduced ? 'Hidden Connection Found' : avg >= 60 ? 'Resonant Pair' : 'Contrasting Energies', categories, bestFeature: sameReduced ? `Both words share the root vibration of ${r1}` : 'Their difference creates dynamic meaning', watchOut: 'Gematria connections are symbolic, not literal', advice: `"${t1}" (${v1}\u2192${r1}) and "${t2}" (${v2}\u2192${r2}): ${sameReduced ? 'these words are numerically linked at the deepest level' : 'their different values highlight complementary meanings'}.` };
}

function playGemSoulName(result, form, inputs, dailySeed) {
  const name = form?.full_name?.trim();
  if (!name) return { error: 'Full name required in your profile.' };
  const total = wordValue(name);
  const reduced = reduceNumber(total);
  const nameNums = numerologyName(name);
  const sections = [
    { title: 'Name Value', icon: '\u05D0', items: [{ label: 'Full Gematria', value: String(total), desc: `Your name "${name}" resonates at ${total}, reduced to ${reduced}` }] },
    { title: 'Soul Components', icon: '\u2728', items: [
      { label: 'Soul Number (vowels)', value: String(nameNums.soul), desc: 'Your inner desire and spiritual motivation' },
      { label: 'Outer Number (consonants)', value: String(nameNums.personality), desc: 'How the world experiences your name\u2019s energy' },
    ] },
    { title: 'Name Archetype', icon: '\uD83D\uDD2E', items: [{ label: 'Core Vibration', value: LIFE_PATH_DATA[reduced]?.trait || `Number ${reduced}`, desc: LIFE_PATH_DATA[reduced]?.teaser || `Your name carries the energy of ${reduced}` }] },
  ];
  return { type: 'identity', headline: `"${name}" = ${total}`, score: null, sections, strengths: [LIFE_PATH_DATA[reduced]?.teaser || `Name vibration of ${reduced}`], cautions: ['Names carry energy \u2014 consider how yours shapes perception'], advice: `Your name\u2019s total value of ${total} (root ${reduced}) places you in the archetype of ${LIFE_PATH_DATA[reduced]?.trait || `Number ${reduced}`}. This vibration colors every interaction where your name is spoken.` };
}

// ── Persian ──

function playPersianGeomancy(result, form, inputs, dailySeed) {
  if (!inputs.question?.trim()) return { error: 'Please enter a question.' };
  const seed = `geo-${inputs.question}-${Date.now()}-${dailySeed || ''}`;
  const rng = seededRandom(seed);
  const figure = pick(GEOMANTIC_FIGURES, rng);
  const house = Math.floor(rng() * 12) + 1;
  return { type: 'oracle', headline: `${figure.name} \u2014 ${figure.meaning}`, verse: `The sand reveals ${figure.name} in the ${house}th house of ${HOUSE_MEANINGS[house]}.`, answer: figure.answer, guidance: `${figure.name} (${figure.element} element) speaks of ${figure.nature}. In the house of ${HOUSE_MEANINGS[house]}, this figure directs your attention to matters of ${HOUSE_MEANINGS[house]}.`, caution: 'Geomancy reveals tendencies, not certainties. Your free will shapes the final outcome.', timing: figure.element === 'Fire' ? 'Soon \u2014 days' : figure.element === 'Air' ? 'Weeks' : figure.element === 'Water' ? 'Gradual unfolding' : 'In due time', actions: ['Sit with the figure\u2019s message', 'Take one action aligned with the guidance', 'Revisit if circumstances change significantly'] };
}

function playPersianAstrolabe(result, form, inputs, dailySeed) {
  if (!form?.birth_date) return { error: 'Birth date required.' };
  const sign = signFromDate(form.birth_date);
  const bd = parseBirthDate(form.birth_date);
  const dayOfWeek = new Date(bd.year, bd.month - 1, bd.day).getDay();
  const dayPlanets = ['Moon','Mars','Mercury','Jupiter','Venus','Saturn','Sun'];
  const ruler = dayPlanets[dayOfWeek];
  const rng = seededRandom(`astrolabe-${form.birth_date}-${dailySeed || ''}`);
  const mansion = Math.floor(rng() * 28) + 1;
  const lot = Math.floor(rng() * 12) + 1;
  const items = [
    { label: 'Sun Position', value: `${SIGN_ICONS[sign]} ${sign}`, desc: `Your solar placement in the celestial sphere` },
    { label: 'Planetary Ruler', value: `${PLANET_SYMBOLS[ruler]} ${ruler}`, desc: `Born on the day of ${ruler} \u2014 governs ${PLANET_MEANINGS[ruler]}` },
    { label: 'Lunar Mansion', value: `Mansion ${mansion}`, desc: `The ${mansion}th mansion of the Moon influences your emotional and spiritual rhythm` },
    { label: 'Lot of Fortune', value: `House ${lot}`, desc: `Your fortune flows through the ${lot}th house of ${HOUSE_MEANINGS[lot]}` },
    { label: 'Temperament', value: SIGN_ELEMENTS[sign], desc: `${SIGN_ELEMENTS[sign]} temperament shapes your constitution and approach to life` },
  ];
  return { type: 'explorer', headline: `${PLANET_SYMBOLS[ruler]} ${ruler} \u2014 Born Under ${sign}`, items, total: `Ruling Planet: ${ruler} (${PLANET_MEANINGS[ruler]})`, meaning: `The astrolabe places you under ${ruler}\u2019s governance with ${sign} solar energy. Your Lot of Fortune in the ${lot}th house points to ${HOUSE_MEANINGS[lot]} as a key area for material blessings.`, advice: `Align your actions with ${ruler}\u2019s day (${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek]}) for maximum resonance.` };
}

function playPersianFal(result, form, inputs, dailySeed) {
  if (!inputs.question?.trim()) return { error: 'Please enter a question.' };
  const seed = `fal-${inputs.question}-${Date.now()}-${dailySeed || ''}`;
  const rng = seededRandom(seed);
  const poem = pick(PERSIAN_POEMS, rng);
  return { type: 'oracle', headline: `${poem.tone}`, verse: poem.verse, answer: poem.guidance, guidance: poem.guidance, caution: poem.caution, timing: 'The verse speaks in its own time', actions: ['Read the verse aloud three times', 'Carry its wisdom through the day', 'Return when a new question arises'] };
}


// ══════════════════════════════════════════════════════
//  Daily Seed Helper
// ══════════════════════════════════════════════════════

/** Compute a numeric day-index from a date string (YYYY-MM-DD). */
function dayIndex(dailySeed) {
  let h = 0;
  for (let i = 0; i < dailySeed.length; i++) {
    h = ((h << 5) - h + dailySeed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}


// ══════════════════════════════════════════════════════
//  Main Dispatcher
// ══════════════════════════════════════════════════════

const PLAY_FUNCTIONS = {
  'bazi-element-balance': playBaZiElementBalance,
  'bazi-four-pillars': playBaZiFourPillars,
  'bazi-luck-timeline': playBaZiLuckTimeline,
  'bazi-compatibility': playBaZiCompat,
  'vedic-guna-match': playVedicGunaMatch,
  'vedic-dasha-timeline': playVedicDashaTimeline,
  'vedic-prashna': playVedicPrashna,
  'vedic-nakshatra': playVedicNakshatra,
  'western-synastry': playWesternSynastry,
  'western-natal-challenge': playWesternNatalChallenge,
  'western-transit': playWesternTransit,
  'western-house-power': playWesternHousePower,
  'chinese-compat-matrix': playChineseCompatMatrix,
  'chinese-fortune-stick': playChineseFortuneStick,
  'chinese-year-challenge': playChineseYearChallenge,
  'num-deep-decoder': playNumDeepDecoder,
  'num-relationship': playNumRelationship,
  'num-year-timeline': playNumYearTimeline,
  'kab-tree-journey': playKabTreeJourney,
  'kab-sephirot-balance': playKabSephirotBalance,
  'kab-path-compat': playKabPathCompat,
  'gem-word-decoder': playGemWordDecoder,
  'gem-hidden-link': playGemHiddenLink,
  'gem-soul-name': playGemSoulName,
  'persian-geomancy': playPersianGeomancy,
  'persian-astrolabe': playPersianAstrolabe,
  'persian-fal': playPersianFal,
};

/**
 * Main entry point.
 * @param {string} gameId
 * @param {object} result - full reading result
 * @param {object} form - birth data form
 * @param {object} inputs - per-game inputs (partner_date, question, text, etc.)
 * @param {string} [seed] - optional daily seed; defaults to today's date (YYYY-MM-DD)
 */
export function playSystemGame(gameId, result, form, inputs, seed) {
  const fn = PLAY_FUNCTIONS[gameId];
  if (!fn) return { error: `Unknown game: ${gameId}` };
  const dailySeed = seed || new Date().toISOString().slice(0, 10);
  return fn(result, form, inputs || {}, dailySeed);
}
