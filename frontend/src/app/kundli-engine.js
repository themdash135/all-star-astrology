/**
 * Kundli Engine — Vedic astrology birth chart analysis.
 * Generates deterministic, personalized content from birth data.
 */
import { signFromDate, seededRandom } from './games-engine.js';

function seededIdx(seed, len) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return ((h % len) + len) % len;
}
function formSeed(prefix, form) {
  return `${prefix}-${form?.birth_date || ''}-${form?.birth_time || ''}-${form?.birth_location || ''}-${form?.full_name || ''}`;
}
function todaySeed(prefix, form) {
  const d = new Date();
  return `${prefix}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${form?.birth_date || ''}`;
}

/* ═══════════════════════════════════════════════════════
   VEDIC CONSTANTS
   ═══════════════════════════════════════════════════════ */
const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const RASHI_LORDS = { Aries:'Mars', Taurus:'Venus', Gemini:'Mercury', Cancer:'Moon', Leo:'Sun', Virgo:'Mercury', Libra:'Venus', Scorpio:'Mars', Sagittarius:'Jupiter', Capricorn:'Saturn', Aquarius:'Saturn', Pisces:'Jupiter' };
const RASHI_HINDI = { Aries:'Mesh', Taurus:'Vrishabh', Gemini:'Mithun', Cancer:'Kark', Leo:'Simha', Virgo:'Kanya', Libra:'Tula', Scorpio:'Vrishchik', Sagittarius:'Dhanu', Capricorn:'Makar', Aquarius:'Kumbh', Pisces:'Meen' };

const NAKSHATRAS = [
  { name:'Ashwini',           lord:'Ketu',    deity:'Ashwini Kumars',  symbol:'Horse Head',       gana:'Deva',     nadi:'Aadi',   yoni:'Male Horse',  tattva:'Earth',  guna:'Rajas',    varna:'Vaishya',   letters:['Chu','Che','Cho','La'] },
  { name:'Bharani',           lord:'Venus',   deity:'Yama',            symbol:'Yoni',             gana:'Manushya', nadi:'Aadi',   yoni:'Male Elephant',tattva:'Earth',  guna:'Rajas',    varna:'Shudra',    letters:['Li','Lu','Le','Lo'] },
  { name:'Krittika',          lord:'Sun',     deity:'Agni',            symbol:'Razor/Flame',      gana:'Rakshasa', nadi:'Aadi',   yoni:'Female Goat', tattva:'Earth',  guna:'Rajas',    varna:'Brahmin',   letters:['A','Ee','U','Ea'] },
  { name:'Rohini',            lord:'Moon',    deity:'Brahma',          symbol:'Chariot/Ox Cart',  gana:'Manushya', nadi:'Aadi',   yoni:'Male Serpent',tattva:'Earth',  guna:'Rajas',    varna:'Shudra',    letters:['O','Va','Vi','Vu'] },
  { name:'Mrigashira',        lord:'Mars',    deity:'Soma',            symbol:'Deer Head',        gana:'Deva',     nadi:'Madhya', yoni:'Female Serpent',tattva:'Earth', guna:'Tamas',    varna:'Vaishya',   letters:['Ve','Vo','Ka','Ki'] },
  { name:'Ardra',             lord:'Rahu',    deity:'Rudra',           symbol:'Teardrop',         gana:'Manushya', nadi:'Madhya', yoni:'Female Dog',  tattva:'Water',  guna:'Tamas',    varna:'Shudra',    letters:['Ku','Gha','Ng','Chh'] },
  { name:'Punarvasu',         lord:'Jupiter', deity:'Aditi',           symbol:'Bow & Quiver',     gana:'Deva',     nadi:'Madhya', yoni:'Female Cat',  tattva:'Water',  guna:'Tamas',    varna:'Vaishya',   letters:['Ke','Ko','Ha','Hi'] },
  { name:'Pushya',            lord:'Saturn',  deity:'Brihaspati',      symbol:'Lotus/Circle',     gana:'Deva',     nadi:'Madhya', yoni:'Male Goat',   tattva:'Water',  guna:'Tamas',    varna:'Kshatriya', letters:['Hu','He','Ho','Da'] },
  { name:'Ashlesha',          lord:'Mercury', deity:'Nagas',           symbol:'Coiled Serpent',   gana:'Rakshasa', nadi:'Madhya', yoni:'Male Cat',    tattva:'Water',  guna:'Sattva',   varna:'Shudra',    letters:['Di','Du','De','Do'] },
  { name:'Magha',             lord:'Ketu',    deity:'Pitris',          symbol:'Royal Throne',     gana:'Rakshasa', nadi:'Antya',  yoni:'Male Rat',    tattva:'Water',  guna:'Sattva',   varna:'Shudra',    letters:['Ma','Mi','Mu','Me'] },
  { name:'Purva Phalguni',    lord:'Venus',   deity:'Bhaga',           symbol:'Front of Bed',     gana:'Manushya', nadi:'Antya',  yoni:'Female Rat',  tattva:'Water',  guna:'Sattva',   varna:'Brahmin',   letters:['Mo','Ta','Ti','Tu'] },
  { name:'Uttara Phalguni',   lord:'Sun',     deity:'Aryaman',         symbol:'Back of Bed',      gana:'Manushya', nadi:'Antya',  yoni:'Male Cow',    tattva:'Fire',   guna:'Sattva',   varna:'Kshatriya', letters:['Te','To','Pa','Pi'] },
  { name:'Hasta',             lord:'Moon',    deity:'Savitar',         symbol:'Open Hand',        gana:'Deva',     nadi:'Antya',  yoni:'Female Buffalo',tattva:'Fire',  guna:'Rajas',    varna:'Vaishya',   letters:['Pu','Sha','Na','Tha'] },
  { name:'Chitra',            lord:'Mars',    deity:'Vishwakarma',     symbol:'Bright Jewel',     gana:'Rakshasa', nadi:'Antya',  yoni:'Female Tiger', tattva:'Fire',   guna:'Rajas',    varna:'Shudra',    letters:['Pe','Po','Ra','Ri'] },
  { name:'Swati',             lord:'Rahu',    deity:'Vayu',            symbol:'Coral/Sprout',     gana:'Deva',     nadi:'Antya',  yoni:'Male Buffalo', tattva:'Fire',   guna:'Rajas',    varna:'Shudra',    letters:['Ru','Re','Ro','Taa'] },
  { name:'Vishakha',          lord:'Jupiter', deity:'Indra-Agni',      symbol:'Triumphal Arch',   gana:'Rakshasa', nadi:'Antya',  yoni:'Male Tiger',   tattva:'Fire',  guna:'Tamas',    varna:'Brahmin',   letters:['Ti','Tu','Te','To'] },
  { name:'Anuradha',          lord:'Saturn',  deity:'Mitra',           symbol:'Lotus',            gana:'Deva',     nadi:'Aadi',   yoni:'Female Hare', tattva:'Fire',   guna:'Tamas',    varna:'Shudra',    letters:['Na','Ni','Nu','Ne'] },
  { name:'Jyeshtha',          lord:'Mercury', deity:'Indra',           symbol:'Earring/Umbrella', gana:'Rakshasa', nadi:'Aadi',   yoni:'Male Hare',   tattva:'Air',    guna:'Tamas',    varna:'Vaishya',   letters:['No','Ya','Yi','Yu'] },
  { name:'Moola',             lord:'Ketu',    deity:'Nirriti',         symbol:'Tied Roots',       gana:'Rakshasa', nadi:'Aadi',   yoni:'Male Dog',    tattva:'Air',    guna:'Sattva',   varna:'Shudra',    letters:['Ye','Yo','Bha','Bhi'] },
  { name:'Purva Ashadha',     lord:'Venus',   deity:'Apas',            symbol:'Fan/Tusk',         gana:'Manushya', nadi:'Aadi',   yoni:'Male Monkey', tattva:'Air',    guna:'Sattva',   varna:'Brahmin',   letters:['Bhu','Dha','Pha','Dha'] },
  { name:'Uttara Ashadha',    lord:'Sun',     deity:'Vishvadevas',     symbol:'Elephant Tusk',    gana:'Manushya', nadi:'Aadi',   yoni:'Male Mongoose',tattva:'Air',   guna:'Sattva',   varna:'Kshatriya', letters:['Bhe','Bho','Ja','Ji'] },
  { name:'Shravana',          lord:'Moon',    deity:'Vishnu',          symbol:'Three Footprints', gana:'Deva',     nadi:'Madhya', yoni:'Female Monkey',tattva:'Air',   guna:'Rajas',    varna:'Shudra',    letters:['Khi','Khu','Khe','Kho'] },
  { name:'Dhanishta',         lord:'Mars',    deity:'Vasus',           symbol:'Drum',             gana:'Rakshasa', nadi:'Madhya', yoni:'Female Lion',  tattva:'Ether', guna:'Rajas',    varna:'Vaishya',   letters:['Ga','Gi','Gu','Ge'] },
  { name:'Shatabhisha',       lord:'Rahu',    deity:'Varuna',          symbol:'Empty Circle',     gana:'Rakshasa', nadi:'Madhya', yoni:'Female Horse', tattva:'Ether', guna:'Rajas',    varna:'Shudra',    letters:['Go','Sa','Si','Su'] },
  { name:'Purva Bhadrapada',  lord:'Jupiter', deity:'Aja Ekapada',     symbol:'Front of Funeral Cot',gana:'Manushya',nadi:'Madhya',yoni:'Male Lion',  tattva:'Ether', guna:'Tamas',    varna:'Brahmin',   letters:['Se','So','Da','Di'] },
  { name:'Uttara Bhadrapada', lord:'Saturn',  deity:'Ahir Budhnya',    symbol:'Back of Funeral Cot',gana:'Manushya',nadi:'Madhya',yoni:'Female Cow',  tattva:'Ether', guna:'Tamas',    varna:'Kshatriya', letters:['Du','Tha','Jha','Da'] },
  { name:'Revati',            lord:'Mercury', deity:'Pushan',          symbol:'Fish/Drum',        gana:'Deva',     nadi:'Antya',  yoni:'Female Elephant',tattva:'Ether',guna:'Tamas',   varna:'Shudra',    letters:['De','Do','Cha','Chi'] },
];

const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const PLANET_HINDI = { Sun:'Surya', Moon:'Chandra', Mars:'Mangal', Mercury:'Budh', Jupiter:'Guru', Venus:'Shukra', Saturn:'Shani', Rahu:'Rahu', Ketu:'Ketu' };
const PLANET_SYMBOLS = { Sun:'\u2609', Moon:'\u263D', Mars:'\u2642', Mercury:'\u263F', Jupiter:'\u2643', Venus:'\u2640', Saturn:'\u2644', Rahu:'\u260A', Ketu:'\u260B' };

const DASHA_ORDER = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const DASHA_YEARS = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };

const HOUSES = [
  '1st (Lagna/Self)', '2nd (Wealth/Speech)', '3rd (Siblings/Courage)',
  '4th (Home/Mother)', '5th (Children/Knowledge)', '6th (Enemies/Health)',
  '7th (Marriage/Partnership)', '8th (Longevity/Transformation)', '9th (Fortune/Dharma)',
  '10th (Career/Status)', '11th (Gains/Income)', '12th (Loss/Spirituality)',
];

const DIGNITIES = ['Exalted','Own Sign','Moolatrikona','Friendly','Neutral','Enemy','Debilitated'];

const GEMSTONES = {
  Sun: { stone:'Ruby', alt:'Garnet', metal:'Gold', finger:'Ring finger', day:'Sunday' },
  Moon: { stone:'Pearl', alt:'Moonstone', metal:'Silver', finger:'Little finger', day:'Monday' },
  Mars: { stone:'Red Coral', alt:'Carnelian', metal:'Gold/Copper', finger:'Ring finger', day:'Tuesday' },
  Mercury: { stone:'Emerald', alt:'Green Tourmaline', metal:'Gold', finger:'Little finger', day:'Wednesday' },
  Jupiter: { stone:'Yellow Sapphire', alt:'Citrine', metal:'Gold', finger:'Index finger', day:'Thursday' },
  Venus: { stone:'Diamond', alt:'White Sapphire', metal:'Platinum/Silver', finger:'Middle finger', day:'Friday' },
  Saturn: { stone:'Blue Sapphire', alt:'Amethyst', metal:'Iron/Silver', finger:'Middle finger', day:'Saturday' },
  Rahu: { stone:'Hessonite Garnet', alt:'Gomed', metal:'Silver/Lead', finger:'Middle finger', day:'Saturday' },
  Ketu: { stone:"Cat's Eye", alt:'Chrysoberyl', metal:'Silver', finger:'Ring finger', day:'Tuesday' },
};

const MANTRAS = {
  Sun:     'Om Hreem Suryaya Namah',
  Moon:    'Om Shreem Chandraya Namah',
  Mars:    'Om Kreem Mangalaya Namah',
  Mercury: 'Om Breem Budhaya Namah',
  Jupiter: 'Om Greem Brihaspataye Namah',
  Venus:   'Om Shreem Shukraya Namah',
  Saturn:  'Om Preem Shanaye Namah',
  Rahu:    'Om Bhram Rahuve Namah',
  Ketu:    'Om Shreem Ketave Namah',
};

const DONATIONS = {
  Sun:     { items:'Wheat, jaggery, red cloth, copper', recipient:'To a priest on Sunday morning' },
  Moon:    { items:'Rice, white cloth, milk, silver', recipient:'To a needy person on Monday' },
  Mars:    { items:'Red lentils (masoor dal), red items, copper', recipient:'To a young person on Tuesday' },
  Mercury: { items:'Green moong dal, green cloth, bronze', recipient:'To a student on Wednesday' },
  Jupiter: { items:'Turmeric, yellow cloth, chana dal, books', recipient:'To a teacher or priest on Thursday' },
  Venus:   { items:'White silk, ghee, rice, perfume', recipient:'To a woman on Friday' },
  Saturn:  { items:'Black sesame (til), mustard oil, iron, black cloth', recipient:'To an elderly or needy person on Saturday' },
  Rahu:    { items:'Coconut, blanket, blue/black cloth', recipient:'To the needy on Saturday evening' },
  Ketu:    { items:'Seven grains, blanket, sesame', recipient:'To a spiritual person on Tuesday' },
};

/* ═══════════════════════════════════════════════════════
   DERIVATION HELPERS (deterministic from form)
   ═══════════════════════════════════════════════════════ */
function deriveNakshatraIdx(form) {
  const s = formSeed('nakshatra', form);
  return seededIdx(s, 27);
}

function deriveLagna(form) {
  const s = formSeed('lagna', form);
  return RASHIS[seededIdx(s, 12)];
}

function deriveMoonSign(form) {
  const nkIdx = deriveNakshatraIdx(form);
  // Each 2.25 nakshatras = 1 sign (27/12)
  return RASHIS[Math.floor(nkIdx / 2.25) % 12];
}

function derivePlanetaryPositions(form) {
  const rng = seededRandom(formSeed('planets', form));
  const lagna = deriveLagna(form);
  const lagnaIdx = RASHIS.indexOf(lagna);
  const moonSign = deriveMoonSign(form);

  return PLANETS.map((p, i) => {
    let signIdx;
    if (p === 'Sun') {
      const sign = signFromDate(form?.birth_date);
      // Convert western to sidereal (roughly -23 degrees → sometimes previous sign)
      const wIdx = RASHIS.indexOf(sign);
      signIdx = wIdx >= 0 ? (wIdx + 11) % 12 : Math.floor(rng() * 12);
    } else if (p === 'Moon') {
      signIdx = RASHIS.indexOf(moonSign);
    } else {
      signIdx = Math.floor(rng() * 12);
    }
    const sign = RASHIS[signIdx];
    const degree = Math.floor(rng() * 30);
    const minutes = Math.floor(rng() * 60);
    const house = ((signIdx - lagnaIdx + 12) % 12) + 1;
    const nkIndex = Math.floor((signIdx * 2.25 + degree / 13.33)) % 27;
    const nakshatra = NAKSHATRAS[Math.floor(nkIndex)];
    const pada = Math.floor(rng() * 4) + 1;
    const retrograde = (p !== 'Sun' && p !== 'Moon' && p !== 'Rahu' && p !== 'Ketu') ? rng() > 0.75 : (p === 'Rahu' || p === 'Ketu');
    const dignity = DIGNITIES[seededIdx(formSeed('dignity-' + p, form), DIGNITIES.length)];

    return {
      planet: p,
      hindi: PLANET_HINDI[p],
      symbol: PLANET_SYMBOLS[p],
      sign,
      signLord: RASHI_LORDS[sign],
      degree: `${degree}\u00B0${String(minutes).padStart(2, '0')}'`,
      house,
      nakshatra: nakshatra.name,
      nakshatraLord: nakshatra.lord,
      pada,
      retrograde,
      dignity,
    };
  });
}

/* ═══════════════════════════════════════════════════════
   1. BIRTH DETAILS
   ═══════════════════════════════════════════════════════ */
export function getKundliBirthDetails(form) {
  const lagna = deriveLagna(form);
  const moonSign = deriveMoonSign(form);
  const nkIdx = deriveNakshatraIdx(form);
  const nk = NAKSHATRAS[nkIdx];
  const pada = seededIdx(formSeed('pada', form), 4) + 1;
  const sunSign = signFromDate(form?.birth_date);
  // Sidereal sun roughly 1 sign behind western
  const siderealSunIdx = (RASHIS.indexOf(sunSign) + 11) % 12;
  const siderealSun = RASHIS[siderealSunIdx];
  const rng = seededRandom(formSeed('birthdetails', form));
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const bd = form?.birth_date || '1990-01-01';
  const dayOfWeek = days[new Date(bd).getDay()];
  const tithis = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima','Amavasya'];
  const yogas = ['Vishkumbha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyan','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
  const karanas = ['Bava','Balava','Kaulava','Taitila','Garija','Vanija','Vishti','Shakuni','Chatushpada','Nagava','Kimstughna'];
  const lagnaD = Math.floor(rng() * 30);
  const lagnaM = Math.floor(rng() * 60);
  const sunrise = `${5 + Math.floor(rng() * 2)}:${String(Math.floor(rng() * 60)).padStart(2, '0')} AM`;
  const sunset = `${5 + Math.floor(rng() * 2)}:${String(Math.floor(rng() * 60)).padStart(2, '0')} PM`;

  return {
    name: form?.full_name || 'User',
    birthDate: form?.birth_date || '',
    birthTime: form?.birth_time || '',
    birthPlace: form?.birth_location || '',
    dayOfWeek,
    lagna,
    lagnaHindi: RASHI_HINDI[lagna],
    lagnaLord: RASHI_LORDS[lagna],
    lagnaDegree: `${lagnaD}\u00B0${String(lagnaM).padStart(2, '0')}'`,
    moonSign,
    moonSignHindi: RASHI_HINDI[moonSign],
    sunSign: siderealSun,
    sunSignHindi: RASHI_HINDI[siderealSun],
    nakshatra: nk.name,
    nakshatraLord: nk.lord,
    pada,
    tithi: tithis[seededIdx(formSeed('tithi', form), tithis.length)],
    yoga: yogas[seededIdx(formSeed('yoga', form), yogas.length)],
    karana: karanas[seededIdx(formSeed('karana', form), karanas.length)],
    sunrise,
    sunset,
    ayanamsa: `23\u00B0${44 + Math.floor(rng() * 4)}'${String(Math.floor(rng() * 60)).padStart(2, '0')}"`,
  };
}

/* ═══════════════════════════════════════════════════════
   2. HOROSCOPE CHART
   ═══════════════════════════════════════════════════════ */
export function getKundliChart(form) {
  const lagna = deriveLagna(form);
  const lagnaIdx = RASHIS.indexOf(lagna);
  const planets = derivePlanetaryPositions(form);
  // Build houses: house number → [planets in that house]
  const houses = {};
  for (let h = 1; h <= 12; h++) houses[h] = { sign: RASHIS[(lagnaIdx + h - 1) % 12], planets: [] };
  planets.forEach((p) => { if (houses[p.house]) houses[p.house].planets.push(p); });
  return { lagna, lagnaIdx, houses, planets };
}

/* ═══════════════════════════════════════════════════════
   3. PLANETARY DETAILS
   ═══════════════════════════════════════════════════════ */
export function getKundliPlanets(form) {
  return derivePlanetaryPositions(form);
}

/* ═══════════════════════════════════════════════════════
   4. FAVORABLE FOR YOU
   ═══════════════════════════════════════════════════════ */
export function getKundliFavorable(form) {
  const lagna = deriveLagna(form);
  const lagnaLord = RASHI_LORDS[lagna];
  const moonSign = deriveMoonSign(form);
  const rng = seededRandom(formSeed('favorable', form));
  const colors = ['Red','Orange','Yellow','Green','Blue','White','Cream','Pink','Purple','Gold','Silver','Turquoise'];
  const directions = ['North','South','East','West','North-East','North-West','South-East','South-West'];
  const metals = ['Gold','Silver','Copper','Iron','Bronze','Platinum'];
  const deities = ['Lord Shiva','Lord Vishnu','Goddess Lakshmi','Lord Ganesha','Lord Hanuman','Goddess Durga','Goddess Saraswati','Lord Krishna','Lord Surya','Goddess Parvati'];
  const professions = [
    ['Teaching','Education','Philosophy','Law','Consulting'],
    ['Medicine','Healthcare','Nursing','Psychology','Counseling'],
    ['Technology','Engineering','Science','Research','Innovation'],
    ['Finance','Banking','Accounting','Real Estate','Investment'],
    ['Arts','Music','Design','Fashion','Entertainment'],
    ['Administration','Government','Politics','Management','Leadership'],
    ['Writing','Media','Journalism','Communication','Marketing'],
    ['Spirituality','Healing','Wellness','Yoga','Alternative Medicine'],
  ];

  const ln = [Math.floor(rng() * 9) + 1, Math.floor(rng() * 9) + 1, Math.floor(rng() * 9) + 1].sort((a, b) => a - b);
  const gem = GEMSTONES[lagnaLord] || GEMSTONES.Jupiter;
  const moonLord = RASHI_LORDS[moonSign];
  const gem2 = GEMSTONES[moonLord] || GEMSTONES.Moon;
  const profSet = professions[seededIdx(formSeed('prof', form), professions.length)];

  const friendly = [];
  const unfriendly = [];
  PLANETS.slice(0, 7).forEach((p) => {
    if (rng() > 0.5) friendly.push(p); else unfriendly.push(p);
  });
  if (friendly.length === 0) friendly.push('Jupiter');
  if (unfriendly.length === 0) unfriendly.push('Saturn');

  return {
    lagnaLord,
    moonSign,
    moonSignLord: moonLord,
    luckyNumbers: ln,
    luckyColors: [colors[Math.floor(rng() * colors.length)], colors[Math.floor(rng() * colors.length)]],
    luckyDays: [GEMSTONES[lagnaLord]?.day, GEMSTONES[moonLord]?.day].filter(Boolean),
    luckyGemstone: gem.stone,
    luckyGemstoneAlt: gem.alt,
    secondaryGemstone: gem2.stone,
    luckyMetal: metals[Math.floor(rng() * metals.length)],
    luckyDirection: directions[Math.floor(rng() * directions.length)],
    deity: deities[seededIdx(formSeed('deity', form), deities.length)],
    mantra: MANTRAS[lagnaLord],
    professions: profSet.slice(0, 3),
    friendlyPlanets: friendly.slice(0, 3),
    unfriendlyPlanets: unfriendly.slice(0, 2),
    luckyLetters: NAKSHATRAS[deriveNakshatraIdx(form)].letters,
  };
}

/* ═══════════════════════════════════════════════════════
   5. VIMSHOTTARI DASHA
   ═══════════════════════════════════════════════════════ */
export function getKundliDasha(form) {
  const nkIdx = deriveNakshatraIdx(form);
  const nk = NAKSHATRAS[nkIdx];
  const startingPlanet = nk.lord;
  const startIdx = DASHA_ORDER.indexOf(startingPlanet);
  const bd = new Date(form?.birth_date || '1990-01-01');
  const rng = seededRandom(formSeed('dasha-bal', form));
  const balanceYears = rng() * DASHA_YEARS[startingPlanet];

  // Build mahadasha timeline
  let cursor = new Date(bd);
  // First dasha starts with remaining balance
  const mahadashas = [];
  for (let i = 0; i < 9; i++) {
    const idx = (startIdx + i) % 9;
    const planet = DASHA_ORDER[idx];
    const years = i === 0 ? balanceYears : DASHA_YEARS[planet];
    const start = new Date(cursor);
    cursor = new Date(cursor.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
    const end = new Date(cursor);
    mahadashas.push({ planet, hindi: PLANET_HINDI[planet], symbol: PLANET_SYMBOLS[planet], years: DASHA_YEARS[planet], start, end, effectiveYears: years });
  }

  // Identify current mahadasha
  const now = new Date();
  let currentMaha = mahadashas.find((m) => now >= m.start && now < m.end) || mahadashas[mahadashas.length - 1];

  // Build antardashas for current mahadasha
  const antardashas = [];
  const mahaStartIdx = DASHA_ORDER.indexOf(currentMaha.planet);
  let adCursor = new Date(currentMaha.start);
  for (let i = 0; i < 9; i++) {
    const idx = (mahaStartIdx + i) % 9;
    const planet = DASHA_ORDER[idx];
    const fraction = DASHA_YEARS[planet] / 120;
    const adYears = currentMaha.effectiveYears * fraction;
    const start = new Date(adCursor);
    adCursor = new Date(adCursor.getTime() + adYears * 365.25 * 24 * 60 * 60 * 1000);
    const end = new Date(adCursor);
    antardashas.push({ planet, hindi: PLANET_HINDI[planet], symbol: PLANET_SYMBOLS[planet], start, end });
  }
  const currentAntar = antardashas.find((a) => now >= a.start && now < a.end) || antardashas[0];

  const fmtDate = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return {
    birthNakshatra: nk.name,
    startingDasha: startingPlanet,
    balanceAtBirth: `${Math.floor(balanceYears)} years, ${Math.floor((balanceYears % 1) * 12)} months`,
    mahadashas: mahadashas.map((m) => ({
      ...m, startLabel: fmtDate(m.start), endLabel: fmtDate(m.end),
      isCurrent: m === currentMaha,
    })),
    currentMaha: { planet: currentMaha.planet, hindi: currentMaha.hindi, startLabel: fmtDate(currentMaha.start), endLabel: fmtDate(currentMaha.end) },
    antardashas: antardashas.map((a) => ({
      ...a, startLabel: fmtDate(a.start), endLabel: fmtDate(a.end),
      isCurrent: a === currentAntar,
    })),
    currentAntar: { planet: currentAntar.planet, hindi: currentAntar.hindi, startLabel: fmtDate(currentAntar.start), endLabel: fmtDate(currentAntar.end) },
  };
}

/* ═══════════════════════════════════════════════════════
   6. LIFE REPORT
   ═══════════════════════════════════════════════════════ */
const LIFE_REPORT_TEMPLATES = {
  personality: [
    'With {lagna} rising, you project an aura of {lagnaQuality}. Your Lagna lord {lagnaLord} in the {lordHouse} house gives you a natural inclination toward self-improvement and personal expression. People perceive you as {perception}.',
    'Your {lagna} ascendant makes you naturally {lagnaQuality}. The placement of {lagnaLord} in your chart suggests a personality that evolves significantly through life experiences, becoming more refined and purposeful with age.',
  ],
  career: [
    'Your 10th house analysis indicates strong potential in {professions}. {planet10} influences on your career house suggest {careerDesc}. The period between ages {ageRange} may bring significant professional milestones.',
    'Professional success comes through {professions}. Your Dasamsa chart indicates a career path that gains momentum in your middle years. {lagnaLord} as your ruling planet ensures that determination drives your professional journey.',
  ],
  finance: [
    'Your 2nd house of wealth shows {financeDesc}. Income through the 11th house is supported by {planet11}, suggesting multiple revenue streams are possible. Financial stability improves notably after age {finAge}.',
    'Wealth accumulation follows a gradual upward curve in your chart. {planet2} in your wealth sector indicates {financeDesc}. Smart investments and disciplined saving will serve you far better than speculation.',
  ],
  marriage: [
    'Your 7th house in {sign7} with lord {lord7} indicates a partner who is {partnerDesc}. The Navamsa chart suggests a deeply meaningful bond that strengthens over time. Marriage timing favors the {marriageAge} age range.',
    'Relationships are a significant area of growth in your chart. The 7th lord {lord7} indicates attraction toward partners who are {partnerDesc}. Emotional maturity enhances your relationship outcomes considerably.',
  ],
  health: [
    'Your 6th house configuration suggests attention to {healthArea}. The placement of Mars and Saturn in your chart indicates that consistent exercise and stress management are essential for your long-term vitality.',
    'Health is generally strong with your chart configuration, though {healthArea} may require periodic attention. Preventive care and a balanced lifestyle are your best allies. Vitality peaks when you maintain consistent routines.',
  ],
  education: [
    'Your 5th house of intellect is well-supported, indicating strong academic abilities especially in {eduField}. Jupiter\'s aspect on your education houses favors higher learning and specialized knowledge.',
    'Education and learning are prominent themes in your chart. Your intellectual curiosity spans {eduField} and related disciplines. Formal education combined with self-study creates your strongest knowledge foundation.',
  ],
};

export function getKundliLifeReport(form) {
  const lagna = deriveLagna(form);
  const lagnaLord = RASHI_LORDS[lagna];
  const planets = derivePlanetaryPositions(form);
  const rng = seededRandom(formSeed('lifereport', form));
  const lagnaIdx = RASHIS.indexOf(lagna);

  const lagnaQualities = { Aries:'bold confidence and initiative', Taurus:'stability and quiet strength', Gemini:'intellectual curiosity and adaptability', Cancer:'emotional depth and nurturing energy', Leo:'radiant charisma and natural authority', Virgo:'precision and analytical sharpness', Libra:'grace, charm, and diplomatic skill', Scorpio:'magnetic intensity and transformative power', Sagittarius:'optimistic vision and adventurous spirit', Capricorn:'disciplined ambition and quiet authority', Aquarius:'innovative thinking and humanitarian ideals', Pisces:'compassionate intuition and creative depth' };
  const perceptions = ['confident and driven','warm and approachable','intelligent and versatile','protective and caring','charismatic and generous','thoughtful and precise','balanced and fair','intense and perceptive','adventurous and philosophical','ambitious and reliable','unique and forward-thinking','empathetic and creative'];
  const healthAreas = ['digestive health and stress management','respiratory wellness and immunity','cardiovascular fitness and nervous system','joint health and bone density','hormonal balance and emotional wellness','skin health and allergies'];
  const eduFields = ['science, technology, and analytical subjects','humanities, arts, and creative disciplines','business, economics, and finance','medicine, psychology, and healing sciences','law, philosophy, and social sciences','engineering, mathematics, and problem-solving'];
  const partnerDescs = ['intelligent, communicative, and emotionally mature','steady, loyal, and deeply committed','creative, passionate, and independent','nurturing, sensitive, and family-oriented','ambitious, practical, and status-conscious','spiritual, intuitive, and deeply empathetic'];
  const profSets = ['leadership, entrepreneurship, and management','creative arts, design, and entertainment','healthcare, counseling, and education','technology, research, and innovation','finance, law, and consulting','media, communication, and public relations'];
  const careerDescs = ['a career that rises through consistent effort and strategic positioning','professional recognition arriving through a combination of talent and perseverance','leadership opportunities that emerge from your natural problem-solving ability','career advancement through expertise and specialized knowledge'];

  const sign7 = RASHIS[(lagnaIdx + 6) % 12];
  const lord7 = RASHI_LORDS[sign7];
  const lordHouse = (planets.find((p) => p.planet === lagnaLord)?.house) || 1;

  function fillTemplate(templates, extraReplacements = {}) {
    const tpl = templates[seededIdx(formSeed('tpl-' + templates[0].substring(0, 10), form), templates.length)];
    let text = tpl;
    const replacements = {
      '{lagna}': lagna,
      '{lagnaLord}': lagnaLord,
      '{lagnaQuality}': lagnaQualities[lagna] || 'natural strength',
      '{perception}': perceptions[RASHIS.indexOf(lagna)] || 'confident',
      '{lordHouse}': ordinal(lordHouse),
      '{sign7}': sign7,
      '{lord7}': lord7,
      '{professions}': profSets[seededIdx(formSeed('prof-lr', form), profSets.length)],
      '{planet10}': (planets.find((p) => p.house === 10)?.planet) || 'Saturn',
      '{planet11}': (planets.find((p) => p.house === 11)?.planet) || 'Jupiter',
      '{planet2}': (planets.find((p) => p.house === 2)?.planet) || 'Venus',
      '{careerDesc}': careerDescs[Math.floor(rng() * careerDescs.length)],
      '{ageRange}': `${28 + Math.floor(rng() * 10)}-${40 + Math.floor(rng() * 10)}`,
      '{financeDesc}': rng() > 0.5 ? 'steady wealth accumulation through disciplined effort' : 'fluctuating income that stabilizes in your middle years',
      '{finAge}': `${30 + Math.floor(rng() * 8)}`,
      '{partnerDesc}': partnerDescs[seededIdx(formSeed('partner-lr', form), partnerDescs.length)],
      '{marriageAge}': `${24 + Math.floor(rng() * 8)}-${30 + Math.floor(rng() * 6)}`,
      '{healthArea}': healthAreas[seededIdx(formSeed('health-lr', form), healthAreas.length)],
      '{eduField}': eduFields[seededIdx(formSeed('edu-lr', form), eduFields.length)],
      ...extraReplacements,
    };
    Object.entries(replacements).forEach(([k, v]) => { text = text.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v); });
    return text;
  }

  function ordinal(n) { const s = ['th','st','nd','rd']; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  return {
    sections: [
      { title: 'Personality & Appearance', icon: '\uD83D\uDC64', text: fillTemplate(LIFE_REPORT_TEMPLATES.personality) },
      { title: 'Career & Profession', icon: '\uD83D\uDCBC', text: fillTemplate(LIFE_REPORT_TEMPLATES.career) },
      { title: 'Finance & Wealth', icon: '\uD83D\uDCB0', text: fillTemplate(LIFE_REPORT_TEMPLATES.finance) },
      { title: 'Marriage & Relationships', icon: '\uD83D\uDC8D', text: fillTemplate(LIFE_REPORT_TEMPLATES.marriage) },
      { title: 'Health & Wellness', icon: '\uD83C\uDF3F', text: fillTemplate(LIFE_REPORT_TEMPLATES.health) },
      { title: 'Education & Learning', icon: '\uD83D\uDCDA', text: fillTemplate(LIFE_REPORT_TEMPLATES.education) },
    ],
  };
}

/* ═══════════════════════════════════════════════════════
   7. KUNDLI DOSHA
   ═══════════════════════════════════════════════════════ */
export function getKundliDosha(form) {
  const planets = derivePlanetaryPositions(form);
  const rng = seededRandom(formSeed('dosha', form));
  const mars = planets.find((p) => p.planet === 'Mars');
  const rahu = planets.find((p) => p.planet === 'Rahu');
  const ketu = planets.find((p) => p.planet === 'Ketu');
  const sun = planets.find((p) => p.planet === 'Sun');
  const moon = planets.find((p) => p.planet === 'Moon');
  const jupiter = planets.find((p) => p.planet === 'Jupiter');
  const saturn = planets.find((p) => p.planet === 'Saturn');
  const moonSign = deriveMoonSign(form);

  const manglikHouses = [1, 2, 4, 7, 8, 12];
  const isManglik = manglikHouses.includes(mars?.house);
  const manglikSeverity = isManglik ? (mars?.house === 7 || mars?.house === 8 ? 'High' : 'Medium') : 'None';
  const manglikCancelled = isManglik && (mars?.sign === 'Aries' || mars?.sign === 'Scorpio' || mars?.sign === 'Capricorn');

  // Kaal Sarp: all planets between Rahu-Ketu
  const rahuH = rahu?.house || 1;
  const ketuH = ketu?.house || 7;
  const otherPlanets = planets.filter((p) => p.planet !== 'Rahu' && p.planet !== 'Ketu');
  let allOneSide = true;
  otherPlanets.forEach((p) => {
    const h = p.house;
    const between = rahuH < ketuH ? (h > rahuH && h < ketuH) : (h > rahuH || h < ketuH);
    if (!between) allOneSide = false;
  });
  const hasKaalSarp = allOneSide && Math.abs(rahuH - ketuH) >= 5;
  const kaalSarpTypes = ['Anant','Kulik','Vasuki','Shankhpal','Padma','Mahapadma','Takshak','Karkotak','Shankhachud','Ghatak','Vishdhar','Sheshnag'];
  const kaalSarpType = kaalSarpTypes[(rahuH - 1) % 12];

  // Sadesati
  const moonIdx = RASHIS.indexOf(moonSign);
  const saturnIdx = RASHIS.indexOf(saturn?.sign || 'Capricorn');
  const satFromMoon = ((saturnIdx - moonIdx + 12) % 12) + 1;
  const hasSadesati = satFromMoon === 12 || satFromMoon === 1 || satFromMoon === 2;
  const sadesatiPhase = satFromMoon === 12 ? 'Rising (12th from Moon)' : satFromMoon === 1 ? 'Peak (over Moon)' : satFromMoon === 2 ? 'Setting (2nd from Moon)' : 'Not Active';

  // Pitra Dosha
  const hasPitraDosha = (sun?.house === rahu?.house) || rng() < 0.2;

  // Guru Chandal
  const hasGuruChandal = jupiter?.house === rahu?.house;

  // Kemdrum
  const moonH = moon?.house || 1;
  const adjHouses = [(moonH % 12) + 1, ((moonH - 2 + 12) % 12) + 1];
  const hasKemdrum = !planets.some((p) => p.planet !== 'Moon' && p.planet !== 'Rahu' && p.planet !== 'Ketu' && adjHouses.includes(p.house));

  return {
    doshas: [
      {
        name: 'Manglik Dosha',
        present: isManglik,
        severity: manglikSeverity,
        cancelled: manglikCancelled,
        description: isManglik
          ? `Mars is placed in the ${mars.house}${mars.house === 1 ? 'st' : mars.house === 2 ? 'nd' : 'th'} house from Lagna, creating Manglik Dosha. ${manglikCancelled ? 'However, this dosha is cancelled as Mars is in its own or exalted sign.' : 'This primarily affects marriage and partnership areas of life.'} Severity: ${manglikSeverity}.`
          : 'Mars is not placed in a Manglik-creating house. No Manglik Dosha is present in your chart.',
      },
      {
        name: 'Kaal Sarp Dosha',
        present: hasKaalSarp,
        severity: hasKaalSarp ? 'Medium' : 'None',
        description: hasKaalSarp
          ? `${kaalSarpType} Kaal Sarp Dosha is present. All planets are hemmed between Rahu (House ${rahuH}) and Ketu (House ${ketuH}). This can create periodic life challenges that ultimately lead to spiritual growth and transformation.`
          : 'No Kaal Sarp Dosha detected. Planets are distributed on both sides of the Rahu-Ketu axis.',
      },
      {
        name: 'Sadesati (Saturn Transit)',
        present: hasSadesati,
        severity: hasSadesati ? (satFromMoon === 1 ? 'High' : 'Medium') : 'None',
        description: hasSadesati
          ? `Sadesati is currently active in the ${sadesatiPhase} phase. Saturn is transiting ${satFromMoon === 12 ? 'the 12th house' : satFromMoon === 1 ? 'over your Moon sign' : 'the 2nd house'} from your Moon in ${moonSign}. This 2.5-year phase brings karmic lessons and inner growth.`
          : `Sadesati is not currently active. Saturn is in a neutral position relative to your Moon in ${moonSign}. Enjoy this period of relative ease.`,
      },
      {
        name: 'Pitra Dosha',
        present: hasPitraDosha,
        severity: hasPitraDosha ? 'Low' : 'None',
        description: hasPitraDosha
          ? 'Pitra Dosha is indicated in your chart, suggesting ancestral karmic patterns that may influence certain life areas. Performing Pitra Shanti rituals and honoring ancestors can significantly mitigate this influence.'
          : 'No significant Pitra Dosha detected. Your ancestral karma supports your current life path.',
      },
      {
        name: 'Guru Chandal Dosha',
        present: hasGuruChandal,
        severity: hasGuruChandal ? 'Medium' : 'None',
        description: hasGuruChandal
          ? 'Jupiter and Rahu share the same house, forming Guru Chandal Dosha. This can create confusion in matters of wisdom and ethics. Strengthening Jupiter through mantras and gemstones is recommended.'
          : 'Jupiter and Rahu are well-separated in your chart. No Guru Chandal Dosha is present.',
      },
      {
        name: 'Kemdrum Dosha',
        present: hasKemdrum,
        severity: hasKemdrum ? 'Low' : 'None',
        description: hasKemdrum
          ? 'Moon has no planetary support in adjacent houses, forming Kemdrum Dosha. This may create periodic feelings of isolation or emotional fluctuation. However, aspects or conjunctions from other planets may cancel this effect.'
          : 'Moon is well-supported by planets in adjacent houses. No Kemdrum Dosha.',
      },
    ],
  };
}

/* ═══════════════════════════════════════════════════════
   8. REMEDIES
   ═══════════════════════════════════════════════════════ */
export function getKundliRemedies(form) {
  const lagna = deriveLagna(form);
  const lagnaLord = RASHI_LORDS[lagna];
  const moonSign = deriveMoonSign(form);
  const moonLord = RASHI_LORDS[moonSign];
  const doshas = getKundliDosha(form).doshas.filter((d) => d.present);
  const planets = derivePlanetaryPositions(form);
  const weakPlanets = planets.filter((p) => p.dignity === 'Debilitated' || p.dignity === 'Enemy');

  const gem = GEMSTONES[lagnaLord];
  const gem2 = GEMSTONES[moonLord];

  const gemstoneRemedies = [
    { planet: lagnaLord, ...gem, type: 'Primary', instruction: `Wear on ${gem.finger} in ${gem.metal} on a ${gem.day} during Shukla Paksha. Chant "${MANTRAS[lagnaLord]}" 108 times before wearing.` },
    { planet: moonLord, ...gem2, type: 'Secondary', instruction: `Wear on ${gem2.finger} in ${gem2.metal} on a ${gem2.day}. This strengthens your Moon sign lord and emotional well-being.` },
  ];

  const mantraRemedies = [lagnaLord, moonLord, ...(weakPlanets.slice(0, 2).map((p) => p.planet))].filter((v, i, a) => a.indexOf(v) === i).map((p) => ({
    planet: p, hindi: PLANET_HINDI[p], mantra: MANTRAS[p],
    instruction: `Chant ${MANTRAS[p]} 108 times daily, preferably on ${GEMSTONES[p]?.day || 'any day'}. Face ${p === 'Sun' ? 'East' : p === 'Moon' ? 'North-West' : 'North'} during chanting.`,
    count: p === 'Saturn' ? '23,000 times in 40 days' : p === 'Rahu' ? '18,000 times in 40 days' : '11,000 times in 40 days',
  }));

  const donationRemedies = [lagnaLord, ...(weakPlanets.slice(0, 2).map((p) => p.planet))].filter((v, i, a) => a.indexOf(v) === i).map((p) => ({
    planet: p, ...DONATIONS[p],
  }));

  const fastingRemedies = weakPlanets.slice(0, 2).map((p) => ({
    planet: p.planet, day: GEMSTONES[p.planet]?.day || 'Saturday',
    instruction: `Fast on ${GEMSTONES[p.planet]?.day || 'Saturday'} to pacify ${p.planet}. Consume only fruits and milk until sunset.`,
  }));

  const doshaRemedies = doshas.map((d) => {
    if (d.name === 'Manglik Dosha') return { dosha: d.name, remedy: 'Perform Mangal Shanti Puja. Chant Hanuman Chalisa on Tuesdays. Donate red items on Tuesdays. Kumbh Vivah (symbolic marriage) can be performed before actual marriage.' };
    if (d.name === 'Kaal Sarp Dosha') return { dosha: d.name, remedy: 'Perform Kaal Sarp Shanti Puja, ideally at Trimbakeshwar or Mahakaleshwar temple. Chant Maha Mrityunjaya Mantra 108 times daily. Keep a silver Nag (serpent) in your prayer room.' };
    if (d.name === 'Sadesati (Saturn Transit)') return { dosha: d.name, remedy: 'Chant "Om Preem Shanaye Namah" 108 times daily. Light a sesame oil lamp on Saturdays. Donate black items on Saturday evenings. Wear an iron ring on the middle finger.' };
    if (d.name === 'Pitra Dosha') return { dosha: d.name, remedy: 'Perform Pind Daan and Tarpan for ancestors. Offer water to the Sun every morning. Feed Brahmins on Amavasya (new moon). Plant a Peepal tree and water it regularly.' };
    if (d.name === 'Guru Chandal Dosha') return { dosha: d.name, remedy: 'Chant Jupiter mantra daily. Wear Yellow Sapphire after consulting an astrologer. Respect teachers and elders. Donate turmeric and yellow items on Thursdays.' };
    return { dosha: d.name, remedy: 'Perform general Navagraha Shanti Puja. Maintain a daily meditation practice. Chant the mantra of the afflicted planet.' };
  });

  return { gemstoneRemedies, mantraRemedies, donationRemedies, fastingRemedies, doshaRemedies };
}

/* ═══════════════════════════════════════════════════════
   9. NAKSHATRA PREDICTION
   ═══════════════════════════════════════════════════════ */
const NAKSHATRA_PREDICTIONS = {
  Ashwini: { personality:'Ashwini natives are quick, dynamic, and pioneering. You possess natural healing abilities and a restless energy that drives you to act swiftly. Independence is your hallmark, and you rarely wait for permission to begin.', strengths:['Quick decision-making','Natural healing ability','Pioneering spirit','Physical vitality'], weaknesses:['Impatience','Impulsiveness','Restlessness','Difficulty completing tasks'], career:'Healthcare, emergency services, sports, military, transportation, horse-related fields, and entrepreneurship suit you best. Your speed and decisiveness are professional assets.', health:'Head and brain region require attention. Migraines and stress-related conditions are possible. Active lifestyle is essential for your well-being.', relationship:'You seek a partner who matches your energy and respects your independence. Quick to fall in love but equally quick to lose interest if unchallenged.' },
  Bharani: { personality:'Bharani natives carry immense creative and transformative energy. You understand the cycles of life deeply — creation, sustenance, and dissolution. Intensity defines your approach to everything.', strengths:['Creative power','Resilience','Loyalty','Depth of emotion'], weaknesses:['Possessiveness','Extremism','Jealousy','Difficulty with moderation'], career:'Arts, entertainment, fertility/reproductive medicine, psychology, finance, hospitality, and any field involving transformation or regeneration.', health:'Reproductive system and lower abdomen need attention. Maintain hormonal balance through diet and lifestyle choices.', relationship:'Deeply passionate and loyal in love. You give everything to relationships but expect absolute devotion in return. Superficial connections leave you unsatisfied.' },
  Krittika: { personality:'Krittika natives are sharp, purifying, and truth-seeking. Like the fire that is your element, you burn away falsehood and illuminate truth. Your critical thinking is unmatched.', strengths:['Sharp intellect','Truthfulness','Purifying nature','Determination'], weaknesses:['Harsh speech','Critical nature','Stubbornness','Difficulty forgiving'], career:'Military, surgery, cooking/culinary arts, fire-related fields, criticism and editorial work, law enforcement, and quality assurance.', health:'Digestive system and metabolism need monitoring. Fire-related ailments and fevers may occur periodically. Stay hydrated and cool.', relationship:'You value honesty above all in relationships. A partner who can handle your directness and match your intensity creates the strongest bond.' },
  Rohini: { personality:'Rohini natives are the most creative and materially blessed of all nakshatras. Beauty, luxury, and sensuality define your nature. You have an extraordinary ability to attract and manifest abundance.', strengths:['Creativity','Beauty appreciation','Material success','Charm'], weaknesses:['Materialism','Possessiveness','Indulgence','Jealousy'], career:'Arts, fashion, beauty, agriculture, real estate, luxury goods, music, and any field where aesthetics matter. You naturally create beautiful things.', health:'Throat, neck, and reproductive organs are sensitive areas. Maintain a balanced diet and avoid excessive indulgence in rich foods.', relationship:'Deeply romantic and sensual. You create beautiful relationship experiences and need a partner who appreciates beauty and comfort as much as you do.' },
  Mrigashira: { personality:'Mrigashira natives are eternal seekers — always searching for something just beyond the horizon. Curiosity and gentleness define your nature. You are intellectually restless but emotionally gentle.', strengths:['Curiosity','Gentleness','Adaptability','Research ability'], weaknesses:['Restlessness','Indecisiveness','Suspicion','Fickleness'], career:'Research, writing, travel, education, marketing, textiles, and any field requiring investigation and communication. Your seeking nature is an asset.', health:'Nervous system and eyes require attention. Mental restlessness can manifest as physical tension. Meditation and grounding practices are essential.', relationship:'You seek intellectual companionship and variety. A partner who keeps you mentally stimulated and shares your love of exploration creates lasting happiness.' },
  Ardra: { personality:'Ardra natives are deeply transformative souls. Like the storm that clears the air, you bring necessary destruction before creation. Emotional intensity and intellectual power combine uniquely in you.', strengths:['Transformative power','Deep intellect','Emotional depth','Resilience'], weaknesses:['Destructive tendencies','Emotional storms','Arrogance','Criticism'], career:'Technology, research, pharmaceuticals, psychology, politics, investigative work, and any field requiring deep analytical ability and willingness to challenge the status quo.', health:'Respiratory system and allergies need attention. Emotional health directly impacts physical well-being. Regular emotional release practices are important.', relationship:'Your intensity can be overwhelming but deeply rewarding for the right partner. You need someone who understands your emotional depth and does not fear your storms.' },
  Punarvasu: { personality:'Punarvasu natives embody renewal, optimism, and the ability to bounce back from any setback. Your nature is generous, philosophical, and deeply nurturing. You believe in second chances — for yourself and others.', strengths:['Resilience','Optimism','Generosity','Philosophical mind'], weaknesses:['Over-optimism','Lack of discipline','Inconsistency','Complacency'], career:'Teaching, counseling, publishing, travel, hospitality, and spiritual or philosophical work. Your natural optimism and wisdom attract people seeking guidance.', health:'Liver, ears, and respiratory system need attention. Overindulgence can create health issues. Moderation in diet and lifestyle supports longevity.', relationship:'You create warm, nurturing relationships and recover quickly from disappointments. A partner who shares your optimistic outlook and values growth creates the ideal union.' },
  Pushya: { personality:'Pushya is considered the most auspicious of all nakshatras. Natives are deeply nurturing, wise, and selfless. You possess a natural authority born from genuine care for others.', strengths:['Nurturing nature','Wisdom','Selflessness','Natural authority'], weaknesses:['Over-attachment','Possessiveness','Rigidity','Self-sacrifice'], career:'Education, counseling, politics, religious leadership, dairy and food industries, and any service-oriented profession. Your nurturing nature makes you a natural mentor.', health:'Chest, lungs, and stomach area need attention. Emotional eating patterns may develop under stress. Self-care routines are essential despite your tendency to prioritize others.', relationship:'Deeply devoted and protective in love. You create a safe haven for your partner and family. A partner who appreciates your care without taking advantage of it is ideal.' },
  Ashlesha: { personality:'Ashlesha natives possess extraordinary intuition and psychological insight. Like the serpent that is your symbol, you see beneath surfaces and understand hidden motivations. Your mind is sharp, strategic, and deeply perceptive.', strengths:['Psychological insight','Strategic thinking','Intuition','Magnetic personality'], weaknesses:['Manipulation','Suspicion','Secretiveness','Possessiveness'], career:'Psychology, research, detective work, politics, medicine, astrology, and occult sciences. Your ability to see hidden truths is a rare professional asset.', health:'Nervous system and digestive tract are sensitive areas. Stress and anxiety can create chronic conditions. Relaxation and trust-building practices are therapeutic.', relationship:'You need deep, psychologically intimate relationships. Surface connections feel meaningless. A partner who can match your depth and earn your trust creates a transformative bond.' },
  Magha: { personality:'Magha natives carry royal energy and ancestral power. You are born with natural authority, dignity, and a strong connection to tradition and lineage. Leadership comes to you organically.', strengths:['Natural authority','Dignity','Ancestral connection','Leadership'], weaknesses:['Arrogance','Attachment to status','Rigidity','Vanity'], career:'Government, administration, archaeology, history, family business, politics, and any field where tradition and authority intersect. You lead with inherited wisdom.', health:'Heart and spine require attention. Maintain cardiovascular fitness and posture awareness. Stress affects your vital organs more than most.', relationship:'You seek a partner who respects tradition, family values, and your natural authority. Relationships built on mutual respect and shared heritage thrive.' },
  'Purva Phalguni': { personality:'Purva Phalguni natives are creative, pleasure-seeking, and deeply artistic. You bring joy, beauty, and celebration wherever you go. Life is meant to be enjoyed, and you embody this philosophy completely.', strengths:['Creativity','Joy','Artistic talent','Generosity'], weaknesses:['Indulgence','Laziness','Vanity','Difficulty with hardship'], career:'Entertainment, arts, music, event management, luxury goods, hospitality, and creative entrepreneurship. You create experiences that people remember.', health:'Reproductive organs and lower back need attention. Overindulgence in pleasure can create health issues. Balance enjoyment with discipline for optimal health.', relationship:'Deeply romantic and generous in love. You create beautiful, joyful relationships. A partner who appreciates celebration and beauty matches your energy perfectly.' },
  'Uttara Phalguni': { personality:'Uttara Phalguni natives are helpful, stable, and socially responsible. You combine the creative energy of the previous nakshatra with practical, reliable commitment. People depend on you — and you deliver.', strengths:['Reliability','Helpfulness','Social responsibility','Stability'], weaknesses:['Over-commitment','Resentment from over-giving','Stubbornness','Need for recognition'], career:'Social work, government service, management, counseling, HR, and any role requiring reliable leadership and genuine care for others welfare.', health:'Stomach, intestines, and nervous system need monitoring. Stress from over-commitment manifests physically. Learn to say no and prioritize rest.', relationship:'You seek stable, committed partnerships based on mutual support and shared purpose. Your reliability makes you an exceptional long-term partner.' },
  Hasta: { personality:'Hasta natives are skilled, dexterous, and cleverly resourceful. Your hands — literally and metaphorically — are your greatest tools. You craft, heal, and create with remarkable skill.', strengths:['Manual dexterity','Resourcefulness','Humor','Practical wisdom'], weaknesses:['Cunning','Restlessness','Over-thinking','Control issues'], career:'Craftsmanship, surgery, mechanics, art, comedy, magic, and any field requiring skilled hands and quick thinking. Your versatility is extraordinary.', health:'Hands, arms, and nervous system need attention. Repetitive strain and anxiety-related conditions are possible. Hand care and stress management are priorities.', relationship:'You use humor and practical gestures to express love. A partner who appreciates your cleverness and does not mistake your playfulness for lack of depth is ideal.' },
  Chitra: { personality:'Chitra natives are artistic visionaries with an extraordinary eye for beauty and design. You see the world as raw material for creation. Your aesthetic sensibility influences everything you touch.', strengths:['Artistic vision','Beauty creation','Charisma','Determination'], weaknesses:['Vanity','Self-absorption','Criticism of others','Restlessness'], career:'Architecture, design, jewelry, fashion, photography, film, and any field where visual beauty and creative vision are paramount. You are a natural artist.', health:'Kidneys, lower abdomen, and skin need attention. Beauty routines may become obsessive. Balance external care with internal wellness practices.', relationship:'You seek a beautiful, aesthetically pleasing relationship. Appearances matter to you, but underneath, you need genuine admiration and creative partnership.' },
  Swati: { personality:'Swati natives are independent, flexible, and gifted communicators. Like the wind that is your symbol, you cannot be contained. Freedom, trade, and movement define your life journey.', strengths:['Independence','Flexibility','Communication skill','Business acumen'], weaknesses:['Restlessness','Indecisiveness','Superficiality','Difficulty with commitment'], career:'Business, trade, travel, communication, diplomacy, and any field requiring flexibility and interpersonal skill. You are a natural negotiator and entrepreneur.', health:'Kidneys, bladder, and skin require attention. Allergies and imbalances from irregular routines are possible. Consistent daily habits support your health significantly.', relationship:'You need a partner who respects your independence and does not try to restrict your movement. Freedom within commitment is your relationship ideal.' },
  Vishakha: { personality:'Vishakha natives are relentlessly goal-oriented and powerful. Once you set your sights on a target, nothing can deter you. Your determination and competitive spirit are legendary.', strengths:['Determination','Goal-orientation','Competitive spirit','Leadership'], weaknesses:['Obsessiveness','Jealousy','Ruthlessness','Difficulty relaxing'], career:'Business leadership, politics, sports, military, research, and any field where single-minded focus and competitive drive create success. You are built to win.', health:'Reproductive system, kidneys, and bladder need attention. The intensity of your nature can create stress-related conditions. Balance ambition with relaxation.', relationship:'You need a partner who supports your ambitions and can match your intensity. Relationships where both partners push each other to grow thrive.' },
  Anuradha: { personality:'Anuradha natives are devoted, organized, and deeply spiritual. You possess an extraordinary ability to create friendship and loyalty wherever you go. Your devotion to those you love is absolute.', strengths:['Devotion','Organization','Friendship','Spiritual depth'], weaknesses:['Emotional sensitivity','Jealousy','Possessiveness','Difficulty with authority'], career:'Diplomacy, counseling, music, management, and organizational roles. You build institutions and communities through your natural ability to unite people.', health:'Stomach, bladder, and reproductive system need attention. Emotional stress directly impacts physical health. Spiritual practices serve as powerful healing tools for you.', relationship:'Deeply devoted and loyal in love. You seek soulmate connections with spiritual depth. A partner who shares your devotion and spiritual values creates lifelong happiness.' },
  Jyeshtha: { personality:'Jyeshtha natives carry the energy of the eldest, the protector, and the chief. You naturally assume responsibility and authority. Your protective instincts are strong, and your courage is undeniable.', strengths:['Protective nature','Courage','Authority','Resourcefulness'], weaknesses:['Jealousy','Controlling nature','Arrogance','Vindictiveness'], career:'Military, police, management, protection services, politics, and any leadership role requiring courage and decisive authority. You protect what matters.', health:'Neck, colon, and reproductive organs need attention. Chronic conditions may develop from accumulated stress. Regular detoxification practices support longevity.', relationship:'You take the protective role in relationships seriously. A partner who respects your authority while maintaining their own strength creates the best balance.' },
  Moola: { personality:'Moola natives are transformative seekers who go to the root of everything. You are drawn to fundamental truths and are willing to destroy illusions to find them. Your journey involves deep, sometimes painful, transformation.', strengths:['Deep seeking','Transformation','Root-cause analysis','Spiritual power'], weaknesses:['Destructiveness','Nihilism','Harshness','Instability'], career:'Research, medicine, herbalism, philosophy, investigation, and any field requiring the ability to dig deep and uncover fundamental truths. You are a natural researcher.', health:'Hips, thighs, and sciatic nerve need attention. Root-level healing (getting to the cause, not treating symptoms) works best for you. Alternative medicine resonates strongly.', relationship:'You need relationships that are real, raw, and transformative. Superficial connections feel painful. A partner who welcomes deep truth and mutual transformation is essential.' },
  'Purva Ashadha': { personality:'Purva Ashadha natives are invincible in spirit. You possess an unshakable belief in your ability to triumph, and this confidence often becomes a self-fulfilling prophecy. Victory defines you.', strengths:['Invincibility','Confidence','Philosophical mind','Persuasion'], weaknesses:['Overconfidence','Inflexibility','Superiority complex','Impatience'], career:'Law, philosophy, motivational work, water-related industries, media, and any field where persuasion and unwavering confidence create success.', health:'Thighs, hips, and circulatory system need attention. Over-exertion from your relentless drive can create physical strain. Pace yourself for longevity.', relationship:'You need a partner who matches your ambition and philosophical depth. Relationships where both partners inspire each other to reach higher ground thrive.' },
  'Uttara Ashadha': { personality:'Uttara Ashadha natives achieve lasting, universal victory. Unlike temporary success, your achievements stand the test of time. You are principled, patient, and deeply committed to doing things right.', strengths:['Lasting achievement','Principle','Patience','Universal appeal'], weaknesses:['Rigidity','Loneliness','Workaholism','Inflexibility'], career:'Government, judiciary, management, research, and any field where long-term thinking and principled action create enduring results. You build legacies.', health:'Knees, bones, and skin need attention. Joint health requires proactive care. Your tendency toward workaholism can deplete your physical reserves over time.', relationship:'You seek a principled, committed partnership built on shared values and long-term vision. You are not interested in fleeting connections — only lasting bonds.' },
  Shravana: { personality:'Shravana natives are extraordinary listeners and learners. You absorb knowledge from every conversation, every experience, and every sound. Your wisdom comes from your unmatched ability to listen.', strengths:['Listening ability','Learning','Knowledge accumulation','Patience'], weaknesses:['Gossip tendency','Over-sensitivity to sound','Rigidity','Jealousy'], career:'Education, counseling, music, media, journalism, and telecommunications. Any field where listening, learning, and communicating knowledge creates value.', health:'Ears, knees, and nervous system need attention. Sound healing and music therapy are particularly beneficial for your constitution. Protect your hearing.', relationship:'You need a partner who communicates openly and listens as deeply as you do. Relationships built on genuine dialogue and mutual understanding fulfill you most.' },
  Dhanishta: { personality:'Dhanishta natives are wealthy, musical, and socially gifted. Your rhythm — in music, in life, in relationships — is natural and captivating. Abundance seems to follow you wherever you go.', strengths:['Musical talent','Wealth attraction','Social charm','Adaptability'], weaknesses:['Argumentative','Self-absorption','Material focus','Aggressive under stress'], career:'Music, dance, real estate, sports, military, and any field where rhythm, timing, and social skill create success. You have natural star quality.', health:'Limbs, ankles, and circulatory system need attention. Physical activity — especially rhythmic exercise like dance or martial arts — is essential for your well-being.', relationship:'You bring rhythm and fun to relationships. A partner who appreciates your social nature and shares your love of music and celebration creates the ideal match.' },
  Shatabhisha: { personality:'Shatabhisha natives are mysterious, healing, and fiercely independent. Often called the "hundred healers," you possess natural therapeutic abilities and a deep understanding of hidden knowledge.', strengths:['Healing ability','Independence','Mystery','Scientific mind'], weaknesses:['Secretiveness','Eccentricity','Isolation','Harsh speech'], career:'Medicine, pharmaceuticals, technology, research, astrology, and healing arts. Your analytical mind and therapeutic abilities make you invaluable in healthcare and science.', health:'Calves, ankles, and circulatory system need attention. Your healing ability should also be directed inward. Isolation can create mental health challenges — stay connected.', relationship:'You need a partner who respects your privacy and independence while providing warmth and emotional safety. Deep trust is earned slowly but lasts forever.' },
  'Purva Bhadrapada': { personality:'Purva Bhadrapada natives are intense, transformative, and spiritually powerful. You walk between worlds — the material and the spiritual — and your depth of understanding is rare and valuable.', strengths:['Spiritual power','Intensity','Transformation','Philosophical depth'], weaknesses:['Extremism','Cynicism','Isolation','Unpredictability'], career:'Philosophy, spirituality, research, occult sciences, psychology, and any field requiring depth, transformation, and the ability to confront uncomfortable truths.', health:'Ankles, feet, and liver need attention. Spiritual practices are not optional for you — they are essential for physical and mental balance. Meditation is medicine.', relationship:'You need a spiritually aware partner who understands your intensity. Surface relationships feel suffocating. A deep, transformative partnership fulfills your soul.' },
  'Uttara Bhadrapada': { personality:'Uttara Bhadrapada natives are wise, controlled, and deeply compassionate. You possess a rare combination of emotional depth and rational control. Your wisdom comes from understanding both suffering and joy.', strengths:['Wisdom','Emotional control','Compassion','Endurance'], weaknesses:['Laziness','Emotional suppression','Detachment','Withdrawal'], career:'Counseling, charity, spiritual leadership, research, and any field requiring wisdom, patience, and genuine compassion. You are a natural sage and healer.', health:'Feet, lymphatic system, and sleep quality need attention. You are prone to lethargy and need to maintain active routines. Quality rest is essential but so is regular movement.', relationship:'You seek a wise, patient partner who shares your depth of compassion. Relationships grow slowly but become profoundly meaningful over time.' },
  Revati: { personality:'Revati natives are gentle, creative, and spiritually refined. As the last nakshatra, you carry the accumulated wisdom of all that came before. Your compassion is universal and your creativity is boundless.', strengths:['Creativity','Compassion','Spiritual refinement','Nurturing'], weaknesses:['Over-sensitivity','Victim mentality','Escapism','Dependency'], career:'Arts, music, film, spiritual work, travel, and any field where creativity, compassion, and universal understanding create value. You are a natural artist and healer.', health:'Feet, lymphatic system, and immune system need attention. Water-based therapies and creative expression are powerful healing tools for your constitution.', relationship:'You seek a soulful, compassionate partnership. You love deeply and need a partner who protects your gentle heart while encouraging your creative expression.' },
};

export function getKundliNakshatra(form) {
  const nkIdx = deriveNakshatraIdx(form);
  const nk = NAKSHATRAS[nkIdx];
  const pada = seededIdx(formSeed('pada', form), 4) + 1;
  const pred = NAKSHATRA_PREDICTIONS[nk.name] || NAKSHATRA_PREDICTIONS.Ashwini;
  const padaDescriptions = [
    `Pada 1 (Navamsa: ${RASHIS[(nkIdx * 4) % 12]}) — Emphasizes the initiating, leadership qualities of this nakshatra. Strong drive and ambition color your expression.`,
    `Pada 2 (Navamsa: ${RASHIS[(nkIdx * 4 + 1) % 12]}) — Highlights the material and practical dimensions. Financial awareness and groundedness are emphasized.`,
    `Pada 3 (Navamsa: ${RASHIS[(nkIdx * 4 + 2) % 12]}) — Amplifies communication, learning, and social connection. Intellectual versatility is your strength.`,
    `Pada 4 (Navamsa: ${RASHIS[(nkIdx * 4 + 3) % 12]}) — Deepens emotional and intuitive qualities. Spiritual awareness and emotional intelligence are heightened.`,
  ];
  return {
    ...nk,
    pada,
    padaDescription: padaDescriptions[pada - 1],
    ...pred,
    compatibleNakshatras: [NAKSHATRAS[(nkIdx + 4) % 27].name, NAKSHATRAS[(nkIdx + 9) % 27].name, NAKSHATRAS[(nkIdx + 13) % 27].name],
    avoidNakshatras: [NAKSHATRAS[(nkIdx + 6) % 27].name, NAKSHATRAS[(nkIdx + 15) % 27].name],
  };
}

/* ═══════════════════════════════════════════════════════
   10. BIORHYTHM STATUS
   ═══════════════════════════════════════════════════════ */
export function getKundliBiorhythm(form) {
  const bd = new Date(form?.birth_date || '1990-01-01');
  const now = new Date();
  const days = Math.floor((now - bd) / (24 * 60 * 60 * 1000));

  const physical   = Math.sin((2 * Math.PI * days) / 23);
  const emotional  = Math.sin((2 * Math.PI * days) / 28);
  const intellectual = Math.sin((2 * Math.PI * days) / 33);

  function pct(v) { return Math.round(v * 100); }
  function descriptor(v) {
    const p = Math.round(v * 100);
    if (p >= 75)  return 'Peak';
    if (p >= 50)  return 'High';
    if (p >= 25)  return 'Moderate';
    if (p > 0)    return 'Low';
    if (p === 0)  return 'Critical';
    if (p > -50)  return 'Recharging';
    return 'Recovery';
  }

  function nextCritical(cycleDays) {
    const current = days % cycleDays;
    const half = cycleDays / 2;
    const nextZero = current < half ? half - current : cycleDays - current;
    const d = new Date(now);
    d.setDate(d.getDate() + Math.ceil(nextZero));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Weekly forecast: next 7 days
  const weekForecast = [];
  for (let i = 0; i < 7; i++) {
    const d = days + i;
    const phys = Math.round(Math.sin((2 * Math.PI * d) / 23) * 100);
    const emo = Math.round(Math.sin((2 * Math.PI * d) / 28) * 100);
    const intel = Math.round(Math.sin((2 * Math.PI * d) / 33) * 100);
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    weekForecast.push({
      dayLabel: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      physical: phys, emotional: emo, intellectual: intel,
      overall: Math.round((phys + emo + intel) / 3),
    });
  }

  // Best days
  const bestPhysical = weekForecast.reduce((best, d) => d.physical > best.physical ? d : best, weekForecast[0]);
  const bestEmotional = weekForecast.reduce((best, d) => d.emotional > best.emotional ? d : best, weekForecast[0]);
  const bestIntellectual = weekForecast.reduce((best, d) => d.intellectual > best.intellectual ? d : best, weekForecast[0]);

  return {
    daysSinceBirth: days,
    cycles: [
      { name: 'Physical', period: 23, value: pct(physical), desc: descriptor(physical), color: '#F87171', nextCritical: nextCritical(23) },
      { name: 'Emotional', period: 28, value: pct(emotional), desc: descriptor(emotional), color: '#60A5FA', nextCritical: nextCritical(28) },
      { name: 'Intellectual', period: 33, value: pct(intellectual), desc: descriptor(intellectual), color: '#FBBF24', nextCritical: nextCritical(33) },
    ],
    overall: Math.round((pct(physical) + pct(emotional) + pct(intellectual)) / 3),
    weekForecast,
    bestDays: {
      physical: bestPhysical.dayLabel,
      emotional: bestEmotional.dayLabel,
      intellectual: bestIntellectual.dayLabel,
    },
  };
}
