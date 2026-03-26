// All Star Astrology — Calculation Engines (TypeScript port)
// Simplified but functional versions of the 8 Python engines.

// ── Shared utilities ──

const SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
];
const ELEMENTS: Record<string, string> = {
  Aries:"Fire",Taurus:"Earth",Gemini:"Air",Cancer:"Water",
  Leo:"Fire",Virgo:"Earth",Libra:"Air",Scorpio:"Water",
  Sagittarius:"Fire",Capricorn:"Earth",Aquarius:"Air",Pisces:"Water",
};
const MODALITIES: Record<string, string> = {
  Aries:"Cardinal",Taurus:"Fixed",Gemini:"Mutable",Cancer:"Cardinal",
  Leo:"Fixed",Virgo:"Mutable",Libra:"Cardinal",Scorpio:"Fixed",
  Sagittarius:"Mutable",Capricorn:"Cardinal",Aquarius:"Fixed",Pisces:"Mutable",
};
const PLANETS = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];

const CHINESE_ANIMALS = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
const CHINESE_ELEMENTS_CYCLE = ["Wood","Fire","Earth","Metal","Water"];
const HEAVENLY_STEMS = ["Jia","Yi","Bing","Ding","Wu","Ji","Geng","Xin","Ren","Gui"];
const EARTHLY_BRANCHES = ["Zi","Chou","Yin","Mao","Chen","Si","Wu","Wei","Shen","You","Xu","Hai"];

const NAKSHATRAS = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati",
];

const SEPHIROT = ["Keter","Chokmah","Binah","Chesed","Gevurah","Tiferet","Netzach","Hod","Yesod","Malkuth"];

const PERSIAN_MANSIONS = [
  "Al Sharatain","Al Butain","Al Thurayya","Al Dabaran","Al Haq'a","Al Han'a","Al Dhira",
  "Al Nathrah","Al Tarf","Al Jabhah","Al Zubrah","Al Sarfah","Al Awwa","Al Simak",
  "Al Ghafr","Al Zubana","Al Iklil","Al Qalb","Al Shaulah","Al Na'aim","Al Baldah",
  "Sa'd al-Dhabih","Sa'd Bula","Sa'd al-Su'ud","Sa'd al-Akhbiyah","Al Fargh al-Awwal","Al Fargh al-Thani","Batn al-Hut",
];

const NUMBER_THEMES: Record<number, string> = {
  1:"independence, initiative",2:"partnership, sensitivity",3:"expression, creativity",
  4:"structure, discipline",5:"change, movement",6:"care, responsibility",
  7:"analysis, introspection",8:"power, management",9:"completion, compassion",
  11:"intuition, inspiration",22:"master-building, scale",33:"teaching, stewardship",
};

function clamp(v: number, lo = 5, hi = 95): number {
  return Math.max(lo, Math.min(hi, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function reduceNumber(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((a, c) => a + parseInt(c), 0);
  }
  return n;
}

function digitSum(s: string): number {
  return s.split("").filter(c => c >= "0" && c <= "9").reduce((a, c) => a + parseInt(c), 0);
}

const PYTH: Record<string, number> = {
  a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8,
};

function pythagoreanValue(name: string): number {
  return name.toLowerCase().split("").reduce((a, c) => a + (PYTH[c] || 0), 0);
}

interface Highlight { label: string; value: string | number }
interface Insight { title: string; text: string }
interface TableBlock { title: string; columns: string[]; rows: (string | number)[][] }
interface ScoreEntry { value: number; label: string }
interface SystemResult {
  name: string;
  headline: string;
  scores: Record<string, ScoreEntry>;
  highlights: Highlight[];
  insights: Insight[];
  tables: TableBlock[];
  summary: string[];
}

function scoreLabel(v: number): string {
  if (v >= 75) return "Strongly favorable";
  if (v >= 60) return "Favorable";
  if (v >= 45) return "Neutral";
  if (v >= 30) return "Challenging";
  return "Strongly challenging";
}

function makeScores(base: Record<string, number>): Record<string, ScoreEntry> {
  const out: Record<string, ScoreEntry> = {};
  for (const [k, v] of Object.entries(base)) {
    const c = clamp(Math.round(v));
    out[k] = { value: c, label: scoreLabel(c) };
  }
  return out;
}

// ── Context builder ──

interface Context {
  birthDate: Date;
  birthTime: string;
  birthLocation: string;
  fullName: string;
  hebrewName: string;
  dayOfYear: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  nowDate: Date;
  seed: number;
  rand: () => number;
  age: number;
}

export function buildContext(body: {
  birth_date: string;
  birth_time: string;
  birth_location: string;
  full_name?: string;
  hebrew_name?: string;
}): Context {
  const bd = new Date(body.birth_date + "T12:00:00Z");
  const parts = body.birth_time.split(":");
  const hour = parseInt(parts[0]) || 0;
  const minute = parseInt(parts[1]) || 0;
  const now = new Date();
  const dayOfYear = Math.floor((bd.getTime() - new Date(bd.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = hashStr(body.birth_date + body.birth_time + body.birth_location + now.toISOString().slice(0, 10));
  const age = now.getFullYear() - bd.getFullYear();

  return {
    birthDate: bd,
    birthTime: body.birth_time,
    birthLocation: body.birth_location,
    fullName: body.full_name?.trim() || "",
    hebrewName: body.hebrew_name?.trim() || "",
    dayOfYear,
    year: bd.getFullYear(),
    month: bd.getMonth() + 1,
    day: bd.getDate(),
    hour, minute,
    nowDate: now,
    seed,
    rand: seededRand(seed),
    age,
  };
}

// ── 1. Western ──

function sunSign(month: number, day: number): string {
  const dates = [20,19,21,20,21,21,23,23,23,23,22,22];
  const idx = month - 1;
  return day < dates[idx] ? SIGNS[(idx + 11) % 12] : SIGNS[idx];
}

function moonSign(seed: number): string {
  return SIGNS[seed % 12];
}

function risingSign(hour: number, sunIdx: number): string {
  return SIGNS[(sunIdx + Math.floor(hour / 2)) % 12];
}

export function calculateWestern(ctx: Context): SystemResult {
  const sun = sunSign(ctx.month, ctx.day);
  const sunIdx = SIGNS.indexOf(sun);
  const moon = moonSign(ctx.seed);
  const rising = risingSign(ctx.hour, sunIdx);
  const element = ELEMENTS[sun];
  const modality = MODALITIES[sun];
  const r = ctx.rand;

  const base = {
    love: 50 + (r() - 0.5) * 40,
    career: 50 + (r() - 0.5) * 40,
    health: 50 + (r() - 0.5) * 35,
    wealth: 50 + (r() - 0.5) * 38,
    mood: 50 + (r() - 0.5) * 36,
  };
  if (element === "Fire") { base.career += 8; base.mood += 5; }
  if (element === "Water") { base.love += 10; base.mood += 3; }
  if (element === "Earth") { base.wealth += 9; base.health += 4; }
  if (element === "Air") { base.career += 6; base.love += 4; }

  return {
    name: "Western Astrology",
    headline: `${sun} Sun, ${moon} Moon, ${rising} Rising — ${element} energy leads today`,
    scores: makeScores(base),
    highlights: [
      { label: "Sun Sign", value: sun },
      { label: "Moon Sign", value: moon },
      { label: "Rising Sign", value: rising },
      { label: "Element", value: element },
      { label: "Modality", value: modality },
      { label: "Dominant Energy", value: `${element} ${modality}` },
    ],
    insights: [
      { title: `${sun} Sun Energy`, text: `Your ${sun} Sun places you in the ${element} element family. Today's transits amplify your natural ${modality.toLowerCase()} tendencies.` },
      { title: `${moon} Moon Emotional Tone`, text: `With the Moon in ${moon}, your emotional currents run through ${ELEMENTS[moon]} channels. Honor this by ${ELEMENTS[moon] === "Water" ? "trusting your intuition" : ELEMENTS[moon] === "Fire" ? "following your passion" : ELEMENTS[moon] === "Earth" ? "staying grounded" : "communicating openly"}.` },
      { title: `${rising} Rising Presence`, text: `Your ${rising} ascendant shapes how others perceive you. The ${ELEMENTS[rising]} quality of this sign colors your first impressions and social approach.` },
    ],
    tables: [{
      title: "Planetary Overview",
      columns: ["Planet", "Sign", "Status"],
      rows: PLANETS.map((p, i) => [p, SIGNS[(sunIdx + i * 3 + Math.floor(r() * 3)) % 12], r() > 0.8 ? "Retrograde" : "Direct"]),
    }],
    summary: [
      `Your ${sun} Sun anchored in ${element} energy creates a ${modality.toLowerCase()} approach to life. The ${moon} Moon adds emotional depth through ${ELEMENTS[moon]} sensitivity.`,
      `Today's planetary alignments suggest focusing on ${base.career > base.love ? "career momentum" : "heart connections"} while keeping ${base.health < 50 ? "health awareness" : "your strong vitality"} in mind.`,
    ],
  };
}

// ── 2. Vedic ──

export function calculateVedic(ctx: Context): SystemResult {
  const ayanamsa = 23.85;
  const tropicalDeg = ((ctx.month - 1) * 30 + ctx.day) % 360;
  const siderealDeg = (tropicalDeg - ayanamsa + 360) % 360;
  const siderealSign = SIGNS[Math.floor(siderealDeg / 30) % 12];
  const nakIdx = Math.floor((siderealDeg / (360 / 27))) % 27;
  const nakshatra = NAKSHATRAS[nakIdx];
  const r = ctx.rand;

  const base = {
    love: 50 + (r() - 0.5) * 38,
    career: 50 + (r() - 0.5) * 42,
    health: 50 + (r() - 0.5) * 34,
    wealth: 50 + (r() - 0.5) * 40,
    mood: 50 + (r() - 0.5) * 36,
  };

  const dashaLords = ["Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury","Ketu","Venus"];
  const currentDasha = dashaLords[ctx.seed % dashaLords.length];

  return {
    name: "Vedic Astrology",
    headline: `Sidereal ${siderealSign} — ${nakshatra} nakshatra guides your path`,
    scores: makeScores(base),
    highlights: [
      { label: "Sidereal Sign", value: siderealSign },
      { label: "Nakshatra", value: nakshatra },
      { label: "Nakshatra Pada", value: (nakIdx % 4) + 1 },
      { label: "Current Dasha Lord", value: currentDasha },
      { label: "Ayanamsa", value: `${ayanamsa}°` },
    ],
    insights: [
      { title: `${siderealSign} Sidereal Influence`, text: `In the Vedic framework, your sidereal placement in ${siderealSign} emphasizes ${ELEMENTS[siderealSign]} qualities with a karmic undertone unique to Jyotish readings.` },
      { title: `${nakshatra} Nakshatra`, text: `Born under ${nakshatra}, you carry its specific deity and shakti energy. This lunar mansion shapes your deepest instincts and life purpose.` },
      { title: `${currentDasha} Dasha Period`, text: `Your current ${currentDasha} dasha period influences the themes you're experiencing. This planetary period sets the backdrop for all transits.` },
    ],
    tables: [{
      title: "Panchang Details",
      columns: ["Element", "Value"],
      rows: [
        ["Tithi", `${(ctx.dayOfYear % 30) + 1}`],
        ["Nakshatra", nakshatra],
        ["Yoga", `${(ctx.dayOfYear % 27) + 1}`],
        ["Karana", `${(ctx.dayOfYear % 11) + 1}`],
        ["Dasha Lord", currentDasha],
      ],
    }],
    summary: [
      `Your Vedic chart places you in sidereal ${siderealSign} under the ${nakshatra} nakshatra. The current ${currentDasha} dasha period adds its own flavor to your daily experience.`,
      `The Vedic system sees deeper karmic patterns than Western astrology. Today's panchang readings suggest ${base.career > 55 ? "favorable conditions for action" : "a time for reflection and patience"}.`,
    ],
  };
}

// ── 3. Chinese ──

export function calculateChinese(ctx: Context): SystemResult {
  const animalIdx = (ctx.year - 4) % 12;
  const animal = CHINESE_ANIMALS[animalIdx];
  const elementIdx = Math.floor(((ctx.year - 4) % 10) / 2);
  const cElement = CHINESE_ELEMENTS_CYCLE[elementIdx];
  const yinYang = ctx.year % 2 === 0 ? "Yang" : "Yin";
  const r = ctx.rand;

  const currentAnimal = CHINESE_ANIMALS[(new Date().getFullYear() - 4) % 12];
  const compatibility = animalIdx === ((new Date().getFullYear() - 4) % 12) ? "same" :
    Math.abs(animalIdx - ((new Date().getFullYear() - 4) % 12)) === 6 ? "clash" : "neutral";

  const base = {
    love: 50 + (r() - 0.5) * 38,
    career: 50 + (r() - 0.5) * 40,
    health: 50 + (r() - 0.5) * 36,
    wealth: 50 + (r() - 0.5) * 42,
    mood: 50 + (r() - 0.5) * 34,
  };
  if (compatibility === "clash") { base.mood -= 10; base.career -= 5; }
  if (cElement === "Fire") base.career += 6;
  if (cElement === "Water") base.love += 7;
  if (cElement === "Metal") base.wealth += 8;

  return {
    name: "Chinese Astrology",
    headline: `${yinYang} ${cElement} ${animal} — ${compatibility === "clash" ? "challenging clash year" : "cosmic alignment with " + currentAnimal + " year"}`,
    scores: makeScores(base),
    highlights: [
      { label: "Animal Sign", value: animal },
      { label: "Element", value: cElement },
      { label: "Yin/Yang", value: yinYang },
      { label: "Current Year Animal", value: currentAnimal },
      { label: "Year Compatibility", value: compatibility },
    ],
    insights: [
      { title: `${animal} Nature`, text: `The ${animal} carries ${cElement} energy in a ${yinYang} expression. This shapes your fundamental approach to relationships, career, and personal growth.` },
      { title: `${cElement} Element Influence`, text: `${cElement} element governs your constitutional energy. In Chinese metaphysics, this determines which seasons and activities most support your wellbeing.` },
      { title: `${currentAnimal} Year Dynamics`, text: `This ${currentAnimal} year creates a ${compatibility} dynamic with your natal ${animal}. ${compatibility === "clash" ? "Navigate with extra awareness" : "The energy flows naturally"}.` },
    ],
    tables: [{
      title: "Chinese Zodiac Profile",
      columns: ["Attribute", "Value"],
      rows: [
        ["Birth Animal", animal],
        ["Birth Element", cElement],
        ["Polarity", yinYang],
        ["Lucky Numbers", `${(animalIdx + 1)}, ${(animalIdx + 4) % 10}, ${(animalIdx + 7) % 10}`],
        ["Lucky Colors", cElement === "Fire" ? "Red, Purple" : cElement === "Water" ? "Blue, Black" : cElement === "Wood" ? "Green, Teal" : cElement === "Metal" ? "White, Gold" : "Yellow, Brown"],
      ],
    }],
    summary: [
      `As a ${yinYang} ${cElement} ${animal}, you embody ${cElement.toLowerCase()} qualities with ${yinYang.toLowerCase()} expression. The ${currentAnimal} year creates ${compatibility} energy for your sign.`,
      `Chinese astrology emphasizes cycles and flow. Today's lunar energy suggests ${base.wealth > 55 ? "favorable financial currents" : "conservative financial positioning"}.`,
    ],
  };
}

// ── 4. BaZi ──

export function calculateBazi(ctx: Context): SystemResult {
  const yearStem = HEAVENLY_STEMS[(ctx.year - 4) % 10];
  const yearBranch = EARTHLY_BRANCHES[(ctx.year - 4) % 12];
  const monthStem = HEAVENLY_STEMS[(ctx.year * 12 + ctx.month + 3) % 10];
  const monthBranch = EARTHLY_BRANCHES[(ctx.month + 1) % 12];
  const dayIdx = Math.floor((ctx.birthDate.getTime() / 86400000) + 0.5) % 60;
  const dayStem = HEAVENLY_STEMS[dayIdx % 10];
  const dayBranch = EARTHLY_BRANCHES[dayIdx % 12];
  const hourBranch = EARTHLY_BRANCHES[Math.floor((ctx.hour + 1) / 2) % 12];
  const hourStem = HEAVENLY_STEMS[(dayIdx * 2 + Math.floor(ctx.hour / 2)) % 10];
  const dayMaster = dayStem;
  const r = ctx.rand;

  const fiveElements = ["Wood","Fire","Earth","Metal","Water"];
  const dayMasterElement = fiveElements[HEAVENLY_STEMS.indexOf(dayStem) % 5];

  const base = {
    love: 50 + (r() - 0.5) * 40,
    career: 50 + (r() - 0.5) * 42,
    health: 50 + (r() - 0.5) * 36,
    wealth: 50 + (r() - 0.5) * 44,
    mood: 50 + (r() - 0.5) * 38,
  };

  return {
    name: "BaZi / Four Pillars",
    headline: `Day Master: ${dayMaster} (${dayMasterElement}) — Four Pillars reveal your destiny structure`,
    scores: makeScores(base),
    highlights: [
      { label: "Day Master", value: `${dayMaster} (${dayMasterElement})` },
      { label: "Day Stem", value: dayStem },
      { label: "Year Pillar", value: `${yearStem} ${yearBranch}` },
      { label: "Month Pillar", value: `${monthStem} ${monthBranch}` },
      { label: "Day Pillar", value: `${dayStem} ${dayBranch}` },
      { label: "Hour Pillar", value: `${hourStem} ${hourBranch}` },
    ],
    insights: [
      { title: `${dayMasterElement} Day Master`, text: `Your ${dayMaster} Day Master carries ${dayMasterElement} energy. This is the core of your BaZi chart — it defines how you interact with every other element in your Four Pillars.` },
      { title: "Pillar Balance", text: `The interaction between your four pillars (Year, Month, Day, Hour) creates a unique elemental balance that shapes your strengths, challenges, and timing for major life decisions.` },
      { title: "Current Luck Pillar", text: `Your current 10-year luck pillar modifies how you experience daily transits. The pillar's element either supports or challenges your Day Master.` },
    ],
    tables: [{
      title: "Four Pillars Chart",
      columns: ["Pillar", "Heavenly Stem", "Earthly Branch"],
      rows: [
        ["Year", yearStem, yearBranch],
        ["Month", monthStem, monthBranch],
        ["Day", dayStem, dayBranch],
        ["Hour", hourStem, hourBranch],
      ],
    }],
    summary: [
      `Your Four Pillars chart centers on the ${dayMaster} Day Master with ${dayMasterElement} energy. The interplay of stems and branches across all four pillars creates your unique destiny structure.`,
      `BaZi analysis shows ${base.career > base.love ? "stronger career energy" : "stronger relationship energy"} in today's pillar interactions.`,
    ],
  };
}

// ── 5. Numerology ──

export function calculateNumerology(ctx: Context): SystemResult {
  const dateStr = `${ctx.year}${String(ctx.month).padStart(2,"0")}${String(ctx.day).padStart(2,"0")}`;
  const lifePath = reduceNumber(digitSum(dateStr));
  const birthdayNum = reduceNumber(ctx.day);
  const attitudeNum = reduceNumber(ctx.month + ctx.day);
  const personalYear = reduceNumber(digitSum(`${new Date().getFullYear()}${String(ctx.month).padStart(2,"0")}${String(ctx.day).padStart(2,"0")}`));
  const personalMonth = reduceNumber(personalYear + (new Date().getMonth() + 1));
  const personalDay = reduceNumber(personalMonth + new Date().getDate());

  let expressionNum = 0;
  if (ctx.fullName) {
    expressionNum = reduceNumber(pythagoreanValue(ctx.fullName));
  }

  const theme = NUMBER_THEMES[lifePath] || "unique path";
  const r = ctx.rand;

  const base = {
    love: 50 + (r() - 0.5) * 36,
    career: 50 + (r() - 0.5) * 40,
    health: 50 + (r() - 0.5) * 32,
    wealth: 50 + (r() - 0.5) * 38,
    mood: 50 + (r() - 0.5) * 34,
  };
  if (personalDay >= 7) base.mood += 8;
  if (lifePath === 8) base.wealth += 10;
  if (lifePath === 2 || lifePath === 6) base.love += 8;

  return {
    name: "Numerology",
    headline: `Life Path ${lifePath} — ${theme}`,
    scores: makeScores(base),
    highlights: [
      { label: "Life Path", value: lifePath },
      { label: "Birthday Number", value: birthdayNum },
      { label: "Attitude Number", value: attitudeNum },
      { label: "Personal Year", value: personalYear },
      { label: "Personal Month", value: personalMonth },
      { label: "Personal Day", value: personalDay },
      ...(expressionNum ? [{ label: "Expression Number", value: expressionNum }] : []),
    ],
    insights: [
      { title: `Life Path ${lifePath}`, text: `Your Life Path number ${lifePath} speaks to ${theme}. This is the overarching theme of your life journey and colors every experience.` },
      { title: `Personal Year ${personalYear}`, text: `You're in a ${personalYear} Personal Year — a cycle of ${NUMBER_THEMES[personalYear] || "transformation"}. This sets the annual backdrop for all your numerological transits.` },
      { title: `Personal Day ${personalDay}`, text: `Today's Personal Day number ${personalDay} focuses energy on ${NUMBER_THEMES[personalDay] || "flow and adaptation"}. Use this for daily planning and intention setting.` },
    ],
    tables: [{
      title: "Number Profile",
      columns: ["Number Type", "Value", "Theme"],
      rows: [
        ["Life Path", lifePath, NUMBER_THEMES[lifePath] || "—"],
        ["Birthday", birthdayNum, NUMBER_THEMES[birthdayNum] || "—"],
        ["Attitude", attitudeNum, NUMBER_THEMES[attitudeNum] || "—"],
        ["Personal Year", personalYear, NUMBER_THEMES[personalYear] || "—"],
        ["Personal Month", personalMonth, NUMBER_THEMES[personalMonth] || "—"],
        ["Personal Day", personalDay, NUMBER_THEMES[personalDay] || "—"],
      ],
    }],
    summary: [
      `Your Life Path ${lifePath} places you on a journey of ${theme}. Combined with your ${personalYear} Personal Year, this creates today's numerological landscape.`,
      `The numbers suggest ${base.career > base.love ? "professional energy is stronger" : "relational energy takes the lead"} today.`,
    ],
  };
}

// ── 6. Kabbalistic ──

export function calculateKabbalistic(ctx: Context): SystemResult {
  const nameVal = ctx.fullName ? pythagoreanValue(ctx.fullName) : ctx.seed;
  const sephIdx = nameVal % 10;
  const activeSephirah = SEPHIROT[sephIdx];
  const pathNumber = reduceNumber(nameVal + ctx.dayOfYear);
  const r = ctx.rand;

  const base = {
    love: 50 + (r() - 0.5) * 36,
    career: 50 + (r() - 0.5) * 38,
    health: 50 + (r() - 0.5) * 34,
    wealth: 50 + (r() - 0.5) * 36,
    mood: 50 + (r() - 0.5) * 40,
  };
  if (sephIdx <= 2) base.mood += 8;
  if (sephIdx >= 7) base.wealth += 6;

  return {
    name: "Kabbalistic",
    headline: `${activeSephirah} illuminated — Tree of Life path ${pathNumber}`,
    scores: makeScores(base),
    highlights: [
      { label: "Active Sephirah", value: activeSephirah },
      { label: "Path Number", value: pathNumber },
      { label: "Tree Position", value: `${sephIdx + 1} of 10` },
      { label: "Spiritual Cycle", value: `Phase ${(ctx.dayOfYear % 7) + 1}` },
    ],
    insights: [
      { title: `${activeSephirah} Energy`, text: `${activeSephirah} is active in your Kabbalistic chart today. This sephirah on the Tree of Life represents ${sephIdx < 3 ? "divine wisdom and higher consciousness" : sephIdx < 6 ? "emotional and ethical balance" : "manifestation and earthly action"}.` },
      { title: "Path of the Day", text: `Path ${pathNumber} connects different aspects of your spiritual architecture. Today's path invites ${pathNumber <= 5 ? "inner reflection" : "outward expression"}.` },
    ],
    tables: [{
      title: "Tree of Life Profile",
      columns: ["Sephirah", "Position", "Active"],
      rows: SEPHIROT.map((s, i) => [s, `${i + 1}`, i === sephIdx ? "Active" : "—"]),
    }],
    summary: [
      `The Kabbalistic system highlights ${activeSephirah} as your active sephirah today, sitting at position ${sephIdx + 1} on the Tree of Life.`,
      `This framework adds a spiritual dimension to your reading, suggesting ${base.mood > 55 ? "inner harmony supports outward action" : "deeper contemplation before action"}.`,
    ],
  };
}

// ── 7. Gematria ──

export function calculateGematria(ctx: Context): SystemResult {
  const hebMap: Record<string, number> = {a:1,b:2,g:3,d:4,h:5,v:6,z:7,ch:8,t:9,y:10,k:20,l:30,m:40,n:50,s:60,e:70,p:80,tz:90,q:100,r:200,sh:300,th:400};
  const name = (ctx.hebrewName || ctx.fullName || "star").toLowerCase();
  let hebVal = 0;
  for (let i = 0; i < name.length; i++) {
    const di = name.slice(i, i + 2);
    if (hebMap[di]) { hebVal += hebMap[di]; i++; }
    else if (hebMap[name[i]]) hebVal += hebMap[name[i]];
  }
  const latVal = pythagoreanValue(name);
  const bridgeNum = reduceNumber(hebVal + latVal);
  const r = ctx.rand;

  const base = {
    love: 50 + (r() - 0.5) * 34,
    career: 50 + (r() - 0.5) * 36,
    health: 50 + (r() - 0.5) * 32,
    wealth: 50 + (r() - 0.5) * 38,
    mood: 50 + (r() - 0.5) * 36,
  };
  if (bridgeNum >= 7) base.mood += 6;

  return {
    name: "Gematria",
    headline: `Sacred value ${hebVal} — Bridge number ${bridgeNum} connects letter and meaning`,
    scores: makeScores(base),
    highlights: [
      { label: "Hebrew Value", value: hebVal },
      { label: "Latin Value", value: latVal },
      { label: "Bridge Number", value: bridgeNum },
      { label: "Reduced Hebrew", value: reduceNumber(hebVal) },
    ],
    insights: [
      { title: "Hebrew Gematria", text: `Your name carries a Hebrew gematria value of ${hebVal}. In this tradition, words with the same numerical value share a hidden spiritual connection.` },
      { title: `Bridge Number ${bridgeNum}`, text: `The bridge number ${bridgeNum} connects your Hebrew and Latin name values, creating a unique resonance point. This number suggests ${NUMBER_THEMES[bridgeNum] || "hidden connections"}.` },
    ],
    tables: [{
      title: "Gematria Breakdown",
      columns: ["System", "Value", "Reduced"],
      rows: [
        ["Hebrew", hebVal, reduceNumber(hebVal)],
        ["Latin/Pythagorean", latVal, reduceNumber(latVal)],
        ["Bridge", hebVal + latVal, bridgeNum],
      ],
    }],
    summary: [
      `Your gematria profile shows a Hebrew value of ${hebVal} and Latin value of ${latVal}, meeting at bridge number ${bridgeNum}.`,
      `The sacred letter analysis adds a layer of meaning that connects language, number, and spiritual resonance.`,
    ],
  };
}

// ── 8. Persian ──

export function calculatePersian(ctx: Context): SystemResult {
  const dayPlanets = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
  const dayOfWeek = ctx.nowDate.getDay();
  const planetaryDay = dayPlanets[dayOfWeek];
  const mansionIdx = Math.floor(ctx.dayOfYear * 28 / 365) % 28;
  const mansion = PERSIAN_MANSIONS[mansionIdx];
  const r = ctx.rand;

  const temperaments = ["Sanguine","Choleric","Melancholic","Phlegmatic"];
  const tempIdx = (ctx.month + ctx.day) % 4;
  const temperament = temperaments[tempIdx];

  const base = {
    love: 50 + (r() - 0.5) * 38,
    career: 50 + (r() - 0.5) * 40,
    health: 50 + (r() - 0.5) * 36,
    wealth: 50 + (r() - 0.5) * 38,
    mood: 50 + (r() - 0.5) * 36,
  };
  if (planetaryDay === "Venus") base.love += 8;
  if (planetaryDay === "Jupiter") base.wealth += 8;
  if (planetaryDay === "Mars") base.career += 6;

  return {
    name: "Persian Astrology",
    headline: `${planetaryDay} day — ${mansion} mansion governs the sky`,
    scores: makeScores(base),
    highlights: [
      { label: "Planetary Day", value: planetaryDay },
      { label: "Lunar Mansion", value: mansion },
      { label: "Temperament", value: temperament },
      { label: "Mansion Index", value: mansionIdx + 1 },
    ],
    insights: [
      { title: `${planetaryDay} Day Ruler`, text: `Today falls under ${planetaryDay}'s rulership in the Persian system. This planetary day lord colors all activities and decisions with its specific energy.` },
      { title: `${mansion} Mansion`, text: `The ${mansion} lunar mansion is active. In Persian/Arabic astrology, each of the 28 mansions carries distinct guidance for daily life, relationships, and endeavors.` },
      { title: `${temperament} Temperament`, text: `Your birth data suggests a ${temperament.toLowerCase()} temperament. This classical medical-astrological framework informs wellness approaches and emotional patterns.` },
    ],
    tables: [{
      title: "Persian Profile",
      columns: ["Attribute", "Value"],
      rows: [
        ["Planetary Day", planetaryDay],
        ["Lunar Mansion", mansion],
        ["Temperament", temperament],
        ["Planetary Hour", dayPlanets[(dayOfWeek + ctx.hour) % 7]],
      ],
    }],
    summary: [
      `The Persian system places today under ${planetaryDay}'s rule with the ${mansion} mansion overhead. Your ${temperament.toLowerCase()} temperament colors how you absorb these cosmic influences.`,
      `This ancient framework blends Babylonian, Greek, and Islamic astronomical traditions into practical daily guidance.`,
    ],
  };
}

// ── Combined ──

export function calculateCombined(systems: Record<string, SystemResult>): Record<string, unknown> {
  const areas = ["love","career","health","wealth","mood"];
  const areaLabels: Record<string, string> = { love:"Love", career:"Career", health:"Health", wealth:"Wealth", mood:"Mood" };
  const sysKeys = Object.keys(systems);
  const probabilities: Record<string, unknown> = {};

  for (const area of areas) {
    const values: { name: string; value: number }[] = [];
    for (const sk of sysKeys) {
      const v = systems[sk]?.scores?.[area]?.value;
      if (v != null) values.push({ name: systems[sk].name, value: v });
    }
    if (!values.length) continue;
    const avg = values.reduce((a, b) => a + b.value, 0) / values.length;
    const agreeing = values.filter(v => Math.abs(v.value - avg) < 15);
    const confidence = Math.round((agreeing.length / values.length) * 100);
    const sorted = [...values].sort((a, b) => b.value - a.value);

    probabilities[area] = {
      value: round2(avg),
      label: scoreLabel(Math.round(avg)),
      confidence,
      sentiment: avg >= 65 ? "strong positive" : avg >= 55 ? "positive" : avg >= 45 ? "mixed" : avg >= 35 ? "challenging" : "strong challenging",
      agreeing_systems: agreeing.map(v => v.name),
      leaders: sorted.slice(0, 3).map(v => ({ name: v.name, value: round2(v.value) })),
    };
  }

  const allHighlights = sysKeys.flatMap(k => (systems[k].highlights || []).slice(0, 2));
  const topInsights = sysKeys.flatMap(k => (systems[k].insights || []).slice(0, 1));

  const avgScores = areas.map(a => {
    const p = probabilities[a] as { value: number } | undefined;
    return p ? p.value : 50;
  });
  const overallAvg = Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length);

  return {
    headline: `Overall cosmic energy at ${overallAvg}% across 8 systems`,
    summary: [
      `Across all eight divination systems, your combined reading shows ${overallAvg >= 60 ? "favorable" : overallAvg >= 45 ? "mixed" : "challenging"} energy today. The systems ${Object.values(probabilities).some((p: any) => p.confidence > 70) ? "show strong agreement" : "present diverse perspectives"} on your current chart.`,
      `The combined analysis weighs each system equally, creating a consensus view that no single tradition can provide alone.`,
    ],
    probabilities,
    highlights: allHighlights.slice(0, 10),
    insights: topInsights,
    tables: [],
  };
}

// ── Daily Content ──

export function calculateDaily(systems: Record<string, SystemResult>, combined: Record<string, unknown>): Record<string, unknown> {
  const probs = combined.probabilities as Record<string, { value: number; sentiment: string }>;
  const sorted = Object.entries(probs).sort((a, b) => (b[1] as any).value - (a[1] as any).value);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const today = new Date();

  const messages = [
    `The cosmos align to highlight your ${top?.[0] || "inner"} energy today. Trust the currents and move with intention.`,
    `Today's celestial tapestry weaves ${top?.[0] || "cosmic"} threads into your day. Let the stars guide, not dictate.`,
    `Eight ancient systems converge: your strongest energy flows through ${top?.[0] || "life"} channels today.`,
  ];
  const message = messages[today.getDate() % messages.length];

  const doTemplates: Record<string, string[]> = {
    love: ["Open your heart to meaningful connections","Express affection without hesitation","Listen deeply in conversations today"],
    career: ["Push forward on your most important project","Speak up — your ideas carry weight","Take initiative on something you've been planning"],
    health: ["Move your body — your energy supports it","Prioritize rest and recovery today","Listen to what your body needs"],
    wealth: ["Review your financial plans with fresh eyes","Trust your instincts on money decisions","Plant seeds for long-term abundance"],
    mood: ["Follow your creative impulses","Share your positive energy generously","Trust your emotional compass today"],
  };
  const dontTemplates: Record<string, string[]> = {
    love: ["Avoid the difficult conversation — timing is off","Don't force connections that aren't flowing","Skip the comparison game"],
    career: ["Don't commit to major career pivots today","Avoid workplace confrontations","Hold off on risky proposals"],
    health: ["Don't push through exhaustion","Avoid overcommitting your energy","Skip the late night"],
    wealth: ["Avoid major financial commitments","Don't lend money impulsively","Hold off on impulse purchases"],
    mood: ["Don't make big decisions on today's emotions","Avoid energy-draining situations","Don't suppress your feelings"],
  };

  const dos: string[] = [];
  const donts: string[] = [];
  for (const [area, info] of sorted) {
    if ((info as any).value >= 55 && dos.length < 3) {
      const opts = doTemplates[area] || [];
      dos.push(opts[today.getDate() % opts.length] || `Lean into ${area} energy`);
    }
  }
  for (const [area, info] of [...sorted].reverse()) {
    if ((info as any).value < 48 && donts.length < 3) {
      const opts = dontTemplates[area] || [];
      donts.push(opts[today.getDate() % opts.length] || `Be cautious with ${area}`);
    }
  }
  while (dos.length < 3) dos.push(["Stay open to opportunities","Practice gratitude","Connect with something grounding"][dos.length]);
  while (donts.length < 3) donts.push(["Don't overthink","Avoid comparisons","Don't neglect basics"][donts.length]);

  return {
    date: today.toISOString().slice(0, 10),
    date_label: today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    message,
    dos: dos.slice(0, 3),
    donts: donts.slice(0, 3),
    focus: top?.[0] || "balance",
    caution: bottom?.[0] || "patience",
    anchor: `${Math.round((top?.[1] as any)?.value || 50)}% ${top?.[0] || "cosmic"} energy`,
  };
}

// ── Oracle ──

export function composeOracleResponse(question: string, readingData: Record<string, unknown>): Record<string, unknown> {
  const q = question.toLowerCase();
  const areas: string[] = [];
  if (/love|heart|relation|partner|romance|dating|marriage/.test(q)) areas.push("love");
  if (/career|work|job|business|money|wealth|financ/.test(q)) areas.push("career");
  if (/health|body|fitness|energy|wellness|sick/.test(q)) areas.push("health");
  if (/mood|emotion|feel|happy|sad|anxious|stress/.test(q)) areas.push("mood");
  if (/wealth|money|rich|invest|save/.test(q)) areas.push("wealth");
  if (!areas.length) areas.push("love", "career", "mood");

  const combined = readingData?.combined as Record<string, unknown> | undefined;
  const probs = (combined?.probabilities || {}) as Record<string, { value: number; sentiment: string; agreeing_systems?: string[] }>;

  const evidence: { area: string; sentiment: string; agree: string; systems: string }[] = [];
  for (const area of areas) {
    const info = probs[area];
    if (info) {
      evidence.push({
        area,
        sentiment: info.sentiment || "mixed",
        agree: `${info.agreeing_systems?.length || 0} of 8 systems agree`,
        systems: (info.agreeing_systems || []).join(", "),
      });
    }
  }

  const templates = [
    `The stars speak clearly on this matter. What you seek is not hidden — it waits for you to recognize what is already unfolding.`,
    `The celestial patterns reveal a path forward. Trust what you feel, even when the mind hesitates.`,
    `Eight systems converge on your question, and their answer echoes through time: patience and intention will carry you.`,
    `The cosmos does not answer in certainties — it reveals in whispers. Listen to what resonates most deeply within you.`,
    `Your chart holds the answer you're seeking. The stars suggest the time is approaching, but readiness matters more than timing.`,
  ];
  const seed = hashStr(question + new Date().toISOString().slice(0, 10));
  const answer = templates[seed % templates.length];

  return {
    answer,
    areas,
    evidence,
    confidence: 0.35,
    confidence_label: "Medium",
    tone: "guided",
    personal_insight: null,
    conflict_note: null,
    system_agreement: {},
    top_systems: [],
    system_signals: [],
  };
}
