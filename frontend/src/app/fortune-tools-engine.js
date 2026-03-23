/**
 * Fortune Tools Engine — generates personalized content for each reading tool.
 * All content is deterministic per day + birth data (seeded).
 */
import { signFromDate, reduceNumber, lifePath, seededRandom, pick } from './games-engine.js';

function seededIdx(seed, len) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return ((h % len) + len) % len;
}

function todaySeed(prefix, form) {
  const d = new Date();
  return `${prefix}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${form?.birth_date || ''}-${form?.full_name || ''}`;
}

/* ═══════════════════════════════════════════════════════
   1. DAILY HOROSCOPE
   ═══════════════════════════════════════════════════════ */
const SIGN_ICONS = {
  Aries:'\u2648', Taurus:'\u2649', Gemini:'\u264A', Cancer:'\u264B',
  Leo:'\u264C', Virgo:'\u264D', Libra:'\u264E', Scorpio:'\u264F',
  Sagittarius:'\u2650', Capricorn:'\u2651', Aquarius:'\u2652', Pisces:'\u2653',
};

const SIGN_ELEMENTS = {
  Aries:'Fire', Taurus:'Earth', Gemini:'Air', Cancer:'Water',
  Leo:'Fire', Virgo:'Earth', Libra:'Air', Scorpio:'Water',
  Sagittarius:'Fire', Capricorn:'Earth', Aquarius:'Air', Pisces:'Water',
};

/* ── Daily Horoscope templates (5 areas: general, love, career, finance, wellness) ── */
const DAILY_TEMPLATES = [
  { general: 'The stars align in your favor today. Trust your instincts and move boldly — the cosmos rewards decisive action.',
    love: 'Venus smiles on your bonds today. Express what you feel openly and watch connections deepen.',
    career: 'A surprise opportunity may appear midday. Be prepared to say yes to something unexpected.',
    finance: 'Financial clarity arrives. A decision you have been sitting on is ready to be made.',
    wellness: 'Your body craves movement. Even a short walk will shift your energy and clear mental fog.' },
  { general: 'A reflective day lies ahead. Slow down, observe, and let wisdom surface on its own.',
    love: 'Someone close will reveal a deeper truth. Listen without judgment — this brings you closer.',
    career: 'Patience outperforms ambition today. Let your work speak for itself rather than forcing outcomes.',
    finance: 'Avoid impulse spending. What feels urgent now will feel unnecessary by evening.',
    wellness: 'Drink more water and stretch — small acts of care yield large returns in how you feel.' },
  { general: 'Creative fire runs through you. Channel it into something real — a project, a conversation, an act of courage.',
    love: 'Passion rises unexpectedly. Follow the spark, not the plan — romance favors spontaneity.',
    career: 'Creative problem-solving earns recognition. Think sideways when others think straight.',
    finance: 'An idea for generating income crystalizes. Capture it before the day ends.',
    wellness: 'Energy peaks in the morning. Front-load important tasks and allow rest in the afternoon.' },
  { general: 'Inner work pays outer dividends today. Take time to reflect on what truly matters to you.',
    love: 'Old patterns in relationships surface. Heal them with awareness rather than avoidance.',
    career: 'A mentor figure appears, literally or symbolically. Accept guidance with humility.',
    finance: 'Review subscriptions and recurring expenses. There is hidden money in what you have overlooked.',
    wellness: 'Rest is productive today. Do not mistake stillness for laziness — your body is rebuilding.' },
  { general: 'Social energy is high. People gravitate toward you, and connections made today carry lasting weight.',
    love: 'Unexpected warmth from a familiar face brightens your day and stirs something deeper.',
    career: 'Teamwork yields far more than solo effort. Collaborate boldly and share credit generously.',
    finance: 'A friend or colleague mentions a financial opportunity worth exploring. Stay alert.',
    wellness: 'Fresh air and sunlight are the best medicine today. Take your thinking outdoors.' },
  { general: 'Precision and attention to detail separate you from the crowd. Today rewards the thorough.',
    love: 'A small gesture of devotion means more than grand words. Show love through action.',
    career: 'Details matter today. The one thing you almost overlooked is the key to moving forward.',
    finance: 'Double-check numbers and contracts. Accuracy protects your assets.',
    wellness: 'Pay attention to what your body tells you around noon. A minor signal now prevents a bigger issue later.' },
  { general: 'A day of quiet power. You do not need to prove anything — your presence speaks.',
    love: 'Give space where space is needed. Trust returns in time, and pressure only delays it.',
    career: 'Financial matters clarify at work. A decision you delayed is now ready for action.',
    finance: 'Savings grow best when left alone today. Resist the urge to move money around.',
    wellness: 'Your immune system needs support. Favor warm foods, early sleep, and gentleness.' },
];

/* ── Zodiac Sign Profiles (full detail: personality, professional, lover, teen, lucky attrs) ── */
const SIGN_PROFILES = {
  Aries: { dates:'Mar 21 – Apr 19', ruler:'Mars', quality:'Cardinal', traits:['Bold','Energetic','Competitive','Pioneering'],
    luckyColors:['Red','Orange'], luckyNums:[1,9,17], luckyGem:'Diamond', luckyDays:['Tuesday','Saturday'],
    personality:'Aries charges into life headfirst. You are a born leader fueled by passion and courage, always seeking the next challenge. Impatient with mediocrity, you set the pace for everyone around you.',
    professional:'In the workplace, Aries thrives in leadership roles. You are a natural starter — launching projects, rallying teams, and solving problems with decisive action. Routine bores you; give an Aries a challenge and watch them shine.',
    lover:'In love, Aries is passionate, spontaneous, and fiercely loyal. You pursue what you want with intensity and expect the same energy in return. Boredom is the only real enemy of an Aries heart.',
    teen:'As a teen, Aries is the fearless one — the first to try something new, the captain of the team, the one who speaks up when others stay silent. Channel that fire into goals and you will be unstoppable.' },
  Taurus: { dates:'Apr 20 – May 20', ruler:'Venus', quality:'Fixed', traits:['Steady','Sensual','Loyal','Patient'],
    luckyColors:['Green','Pink'], luckyNums:[2,6,24], luckyGem:'Emerald', luckyDays:['Friday','Monday'],
    personality:'Taurus builds beauty and stability wherever it goes. Your patience is legendary, your taste impeccable, and your loyalty unshakable. You value comfort, quality, and the finer things in life.',
    professional:'Taurus excels in roles that require persistence and quality. You are the one who finishes what others abandon. Finance, design, agriculture, and any field requiring steady hands and refined taste suit you perfectly.',
    lover:'In love, Taurus is devoted, sensual, and deeply affectionate. You show love through touch, gifts, and unwavering presence. You need a partner who values stability and reciprocates your generosity.',
    teen:'As a teen, Taurus is the reliable friend — always there, always consistent. You might move slower than others, but what you build lasts. Trust your pace; it is your superpower.' },
  Gemini: { dates:'May 21 – Jun 20', ruler:'Mercury', quality:'Mutable', traits:['Curious','Witty','Adaptable','Social'],
    luckyColors:['Yellow','Light Green'], luckyNums:[3,5,14], luckyGem:'Agate', luckyDays:['Wednesday'],
    personality:'Gemini dances between worlds. Your mind moves faster than most, connecting ideas others never see. You are a storyteller, a connector, and an eternal student of life.',
    professional:'Gemini thrives in communication-heavy roles — media, teaching, sales, writing. Your versatility is an asset, not a weakness. You can do many things well; the key is choosing what holds your attention.',
    lover:'In love, Gemini needs intellectual stimulation above all. You fall for minds, not just faces. Variety and conversation keep your heart engaged. A partner who can surprise you will keep you forever.',
    teen:'As a teen, Gemini is the social butterfly with a thousand interests. You might feel pulled in many directions — that is normal. Explore widely now; depth comes later.' },
  Cancer: { dates:'Jun 21 – Jul 22', ruler:'Moon', quality:'Cardinal', traits:['Nurturing','Intuitive','Protective','Emotional'],
    luckyColors:['White','Silver'], luckyNums:[2,7,21], luckyGem:'Pearl', luckyDays:['Monday','Thursday'],
    personality:'Cancer carries the ocean inside. Your emotional intelligence and fierce protectiveness make you irreplaceable. You feel everything deeply and turn that sensitivity into strength.',
    professional:'Cancer excels in nurturing professions — healthcare, counseling, cooking, education, real estate. You create environments where people feel safe and cared for. Your intuition gives you an edge in reading people.',
    lover:'In love, Cancer is deeply devoted and emotionally generous. You crave security and will give everything to protect your relationship. Vulnerability is your greatest strength in romance.',
    teen:'As a teen, Cancer is the heart of the friend group — the one everyone confides in. Your emotions run deep, and that is a gift, not a burden. Protect your energy and trust your instincts.' },
  Leo: { dates:'Jul 23 – Aug 22', ruler:'Sun', quality:'Fixed', traits:['Radiant','Generous','Dramatic','Confident'],
    luckyColors:['Gold','Orange'], luckyNums:[1,4,19], luckyGem:'Ruby', luckyDays:['Sunday'],
    personality:'Leo walks into a room and the energy shifts. Your warmth, creative fire, and generosity inspire everyone around you. You were born to lead, perform, and uplift.',
    professional:'Leo shines in creative and leadership roles — entertainment, management, fashion, education. You need an audience and recognition to do your best work. You are the one who brings the vision.',
    lover:'In love, Leo is passionate, devoted, and incredibly generous. You love grand gestures and expect to be adored in return. A partner who celebrates you will earn your lifelong loyalty.',
    teen:'As a teen, Leo is the star — whether on stage, on the field, or in the hallway. Your confidence inspires others. Use your influence to lift people up and you will build a lasting legacy.' },
  Virgo: { dates:'Aug 23 – Sep 22', ruler:'Mercury', quality:'Mutable', traits:['Analytical','Helpful','Precise','Humble'],
    luckyColors:['Navy','Grey'], luckyNums:[5,6,14], luckyGem:'Sapphire', luckyDays:['Wednesday'],
    personality:'Virgo finds perfection in the details. Your sharp mind and selfless service make the world measurably better. You notice what others miss and fix what others ignore.',
    professional:'Virgo excels in analytical and service roles — healthcare, research, editing, engineering. Your precision is your currency. You make complex systems work and hold teams to a higher standard.',
    lover:'In love, Virgo shows devotion through acts of service. You pay attention to the small things — and that is what makes you unforgettable. You need a partner who appreciates depth over flash.',
    teen:'As a teen, Virgo is the one with the plan, the notes, and the backup plan. You hold yourself to high standards — remember to extend that same grace to yourself.' },
  Libra: { dates:'Sep 23 – Oct 22', ruler:'Venus', quality:'Cardinal', traits:['Harmonious','Fair','Charming','Diplomatic'],
    luckyColors:['Pink','Blue'], luckyNums:[6,7,15], luckyGem:'Opal', luckyDays:['Friday'],
    personality:'Libra seeks balance in all things. Your grace, charm, and sense of justice draw people toward your light. You are a natural mediator and an artist of relationships.',
    professional:'Libra thrives in roles involving partnership and aesthetics — law, diplomacy, design, public relations. You see all sides and build consensus where others see conflict.',
    lover:'In love, Libra is romantic, attentive, and deeply committed to fairness. You want a true partnership — equal, beautiful, and harmonious. You give your best when you feel truly valued.',
    teen:'As a teen, Libra is the peacemaker and the social glue. You hate unfairness and will always speak up for what is right. Trust your sense of justice — it is your compass.' },
  Scorpio: { dates:'Oct 23 – Nov 21', ruler:'Pluto', quality:'Fixed', traits:['Intense','Magnetic','Perceptive','Transformative'],
    luckyColors:['Black','Dark Red'], luckyNums:[8,9,18], luckyGem:'Topaz', luckyDays:['Tuesday'],
    personality:'Scorpio sees beneath every surface. Your emotional depth and transformative power are unmatched. You do nothing halfway — when you commit, you commit completely.',
    professional:'Scorpio excels in intense, investigative roles — psychology, research, finance, medicine. You thrive where others fear to look. Your ability to uncover truth makes you invaluable.',
    lover:'In love, Scorpio is all-or-nothing. You love with searing intensity and need absolute trust. When a Scorpio loves you, there is nothing they would not do. Betrayal is the one line you will not forgive.',
    teen:'As a teen, Scorpio is the deep one — quiet power, strong emotions, and an intensity that others either admire or fear. Embrace your depth; it is your greatest weapon.' },
  Sagittarius: { dates:'Nov 22 – Dec 21', ruler:'Jupiter', quality:'Mutable', traits:['Adventurous','Philosophical','Optimistic','Free'],
    luckyColors:['Purple','Turquoise'], luckyNums:[3,9,12], luckyGem:'Turquoise', luckyDays:['Thursday'],
    personality:'Sagittarius aims for the horizon and never stops. Your optimism and hunger for truth expand every room you enter. Freedom is not a luxury for you — it is oxygen.',
    professional:'Sagittarius thrives in expansive roles — travel, education, publishing, philosophy, sports. You need space to explore and a mission larger than yourself.',
    lover:'In love, Sagittarius is adventurous, honest, and fiercely independent. You need a partner who can keep up — and who gives you room to roam. Shared adventures bond you deepest.',
    teen:'As a teen, Sagittarius is the explorer — always asking why, always pushing boundaries. Your restlessness is a sign of a mind that refuses to be small. Channel it into big goals.' },
  Capricorn: { dates:'Dec 22 – Jan 19', ruler:'Saturn', quality:'Cardinal', traits:['Ambitious','Disciplined','Wise','Resilient'],
    luckyColors:['Brown','Black'], luckyNums:[4,8,22], luckyGem:'Garnet', luckyDays:['Saturday'],
    personality:'Capricorn climbs mountains others only dream of. Your discipline and long-term vision build empires. You respect tradition, earn respect, and never take shortcuts.',
    professional:'Capricorn excels in leadership and management — business, government, finance, engineering. You build things that last. Promotion finds you because you never stop earning it.',
    lover:'In love, Capricorn is loyal, committed, and quietly romantic. You show love through actions, not words. You need a partner who respects your ambition and shares your values.',
    teen:'As a teen, Capricorn is the old soul — mature beyond your years, already planning for the future. Your discipline will take you far. Remember to enjoy the journey, not just the destination.' },
  Aquarius: { dates:'Jan 20 – Feb 18', ruler:'Uranus', quality:'Fixed', traits:['Visionary','Independent','Humanitarian','Inventive'],
    luckyColors:['Electric Blue','Silver'], luckyNums:[4,7,11], luckyGem:'Amethyst', luckyDays:['Saturday','Sunday'],
    personality:'Aquarius reimagines the future. Your originality and humanitarian spirit make you a true revolutionary. You think differently — and that is exactly what the world needs.',
    professional:'Aquarius thrives in innovation — technology, social justice, science, media. You see systems others cannot and build solutions ahead of their time. You work best with freedom and purpose.',
    lover:'In love, Aquarius needs intellectual connection and space. You love deeply but on your own terms. A partner who respects your independence while sharing your vision is your perfect match.',
    teen:'As a teen, Aquarius is the rebel with a cause — questioning norms, championing the underdog, dreaming of a better world. Your ideas are ahead of their time. Stay true to them.' },
  Pisces: { dates:'Feb 19 – Mar 20', ruler:'Neptune', quality:'Mutable', traits:['Compassionate','Dreamy','Artistic','Spiritual'],
    luckyColors:['Sea Green','Lavender'], luckyNums:[3,7,12], luckyGem:'Aquamarine', luckyDays:['Thursday','Monday'],
    personality:'Pisces flows between the seen and unseen worlds. Your empathy and creative imagination know no bounds. You feel what others cannot articulate and express what others cannot imagine.',
    professional:'Pisces excels in creative and healing roles — art, music, therapy, spirituality, film. You bring soul to everything you touch. Your intuition is a professional asset others cannot replicate.',
    lover:'In love, Pisces is the most romantic sign. You love with your entire being — body, mind, and spirit. You need a partner who can match your depth and protect your tender heart.',
    teen:'As a teen, Pisces is the dreamer and the artist — always in another world, always creating something beautiful. The world needs your sensitivity. Protect it fiercely and share it generously.' },
};

/* ── Chinese Zodiac ── */
const CHINESE_ANIMALS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const CHINESE_ELEMENTS_CYCLE = ['Metal','Water','Wood','Fire','Earth'];
const CHINESE_PROFILES = {
  Rat: { emoji:'\uD83D\uDC00', traits:['Clever','Quick-witted','Resourceful'], desc:'The Rat is charming and adaptable, with sharp instincts for opportunity.',
    qualities:'Rats are known for their sharp minds, charisma, and adaptability. They excel at reading situations and finding opportunity where others see none. Their resourcefulness and quick thinking make them natural survivors.',
    relationships:'In relationships, the Rat is devoted and protective. They are generous with those they love and fiercely loyal to their inner circle. Communication comes naturally, though they can be guarded with their deepest emotions.',
    career:'Rats thrive in fast-paced environments requiring quick decisions. They excel as entrepreneurs, writers, politicians, and strategists. Their ability to network and connect gives them an edge in any competitive field.',
    finance:'The Rat has a keen nose for money. They are excellent at spotting deals and accumulating wealth, though they can be prone to hoarding. When disciplined, Rats build impressive financial security over time.',
    luck_guidance:'Trust your instincts — your gut rarely leads you astray. Wear blue or gold to enhance your fortune. The numbers 2, 3, and 7 carry special energy for you.' },
  Ox: { emoji:'\uD83D\uDC02', traits:['Dependable','Strong','Determined'], desc:'The Ox achieves through patience and unwavering effort. Steady and reliable.',
    qualities:'The Ox embodies strength, reliability, and quiet determination. They approach every task with a methodical mindset and never cut corners. Their patience is legendary, and their word is their bond.',
    relationships:'In love, the Ox is deeply loyal and protective. They express affection through actions rather than words — providing stability and security. They seek partners who value sincerity over spontaneity.',
    career:'The Ox excels in roles requiring persistence and precision — agriculture, engineering, real estate, and management. Slow to start but unstoppable once committed, the Ox builds legacies others only dream of.',
    finance:'Financially conservative and disciplined, the Ox builds wealth steadily. They favor safe investments and long-term plans. Extravagance is rare; the Ox understands that true wealth is built brick by brick.',
    luck_guidance:'Patience is your superpower. Colors green and yellow amplify your energy. The numbers 1, 4, and 9 are especially auspicious for you.' },
  Tiger: { emoji:'\uD83D\uDC05', traits:['Brave','Competitive','Magnetic'], desc:'The Tiger commands attention with confidence and daring spirit.',
    qualities:'Tigers are natural leaders with magnetic charisma and fearless confidence. Their courage inspires others, and their competitive nature drives them to excel. Underneath the bold exterior lies a generous heart.',
    relationships:'In romance, the Tiger is passionate, protective, and intensely devoted. They need a partner who can match their energy without trying to tame them. Freedom within commitment is essential.',
    career:'Tigers thrive in leadership positions — CEOs, military officers, athletes, and performers. They need challenges to stay engaged. Routine kills the Tiger spirit; give them a mission and watch them conquer.',
    finance:'Tigers take bold financial risks that often pay off handsomely. They are generous spenders but also capable of massive earnings. Their confidence attracts opportunities that more cautious signs miss.',
    luck_guidance:'Your courage is your greatest asset. Colors blue and grey bring you fortune. Lucky numbers: 1, 3, and 4. Take bold action when your instincts say go.' },
  Rabbit: { emoji:'\uD83D\uDC07', traits:['Gentle','Elegant','Diplomatic'], desc:'The Rabbit brings grace and peace, navigating life with quiet skill.',
    qualities:'Rabbits possess refined taste, diplomatic skill, and a gentle strength often underestimated. They navigate social situations with effortless grace and avoid conflict through intelligence rather than avoidance.',
    relationships:'In love, the Rabbit is romantic, attentive, and deeply caring. They create beautiful, harmonious relationships and need a partner who appreciates subtlety and emotional depth. Security is paramount.',
    career:'Rabbits excel in artistic, diplomatic, and advisory roles. Fashion, counseling, law, and the arts suit their refined sensibilities. They thrive in elegant environments and bring peace to any workplace.',
    finance:'The Rabbit has good financial instincts and a natural aversion to unnecessary risk. They build comfortable wealth through smart, conservative choices and an eye for quality investments.',
    luck_guidance:'Your intuition is impeccable — trust it. Pink and green are your power colors. Lucky numbers: 3, 4, and 6. Surround yourself with beauty to attract abundance.' },
  Dragon: { emoji:'\uD83D\uDC09', traits:['Ambitious','Powerful','Charismatic'], desc:'The Dragon is destined for greatness, radiating energy and vision.',
    qualities:'The Dragon is the most powerful sign in the Chinese zodiac. Charismatic, ambitious, and seemingly blessed by fortune, Dragons command attention and inspire awe. Their confidence borders on supernatural.',
    relationships:'In romance, the Dragon is passionate and generous but needs a partner who can handle their intensity. They seek equals, not admirers. A strong, independent partner earns the Dragon\'s deepest devotion.',
    career:'Dragons are born for greatness — CEOs, inventors, performers, and visionaries. They create empires and inspire movements. No goal is too ambitious, and their energy is virtually limitless.',
    finance:'Financial abundance flows naturally to the Dragon. They think big, earn big, and spend big. While generosity is their nature, learning restraint transforms good fortune into lasting dynasty.',
    luck_guidance:'Your destiny is extraordinary — lean into it. Gold and red amplify your power. Lucky numbers: 1, 6, and 7. This year rewards bold vision over cautious planning.' },
  Snake: { emoji:'\uD83D\uDC0D', traits:['Wise','Intuitive','Sophisticated'], desc:'The Snake sees what others miss, moving through life with strategic grace.',
    qualities:'Snakes possess deep wisdom, sharp intuition, and sophisticated elegance. They are strategic thinkers who see several moves ahead. Their calm exterior masks a powerful inner intensity.',
    relationships:'In love, the Snake is deeply passionate beneath a composed surface. They are selective and intense — once committed, their devotion is total. They need intellectual stimulation and emotional depth in a partner.',
    career:'Snakes excel in analytical and investigative roles — science, research, psychology, philosophy, and finance. Their strategic mind makes them exceptional planners and advisors.',
    finance:'The Snake has an instinctive understanding of money and investment. They are naturally drawn to opportunities others overlook. Patient and strategic, they build wealth through timing and wisdom.',
    luck_guidance:'Trust your inner knowing — it sees what logic cannot. Colors red and yellow bring luck. Lucky numbers: 2, 8, and 9. Let silence be your strategy this year.' },
  Horse: { emoji:'\uD83D\uDC0E', traits:['Free-spirited','Energetic','Warm'], desc:'The Horse races toward freedom, full of life and infectious enthusiasm.',
    qualities:'The Horse embodies freedom, energy, and warmth. Their enthusiasm is infectious and their spirit untamable. Horses are natural adventurers who bring joy and vitality to every situation.',
    relationships:'In love, the Horse is passionate and generous but needs space. They fall quickly and love deeply. A partner who supports their independence while sharing their zest for life creates the perfect bond.',
    career:'Horses thrive in dynamic careers — travel, sports, journalism, marketing, and entertainment. They need variety and movement. Desk jobs drain the Horse; give them an open road and they flourish.',
    finance:'Horses earn well but can spend freely. Their optimism sometimes leads to financial risks. When they pair their natural earning power with a simple savings plan, financial freedom follows naturally.',
    luck_guidance:'Freedom is not a luxury for you — it is necessity. Green and purple are your lucky colors. Numbers 2, 3, and 7 guide you. Follow your restless spirit; it leads somewhere important.' },
  Goat: { emoji:'\uD83D\uDC10', traits:['Creative','Gentle','Sympathetic'], desc:'The Goat creates beauty from nothing and brings harmony to every space.',
    qualities:'Goats are gifted artists with gentle souls and rich inner worlds. Their creativity flows naturally, and their empathy creates deep bonds. They see beauty where others see nothing.',
    relationships:'In love, the Goat is tender, romantic, and deeply attached. They need emotional security and a partner who appreciates their sensitivity. In the right relationship, the Goat blossoms into their fullest self.',
    career:'Goats excel in creative and healing professions — art, music, design, therapy, and teaching. They bring humanity to any workspace and thrive when given creative freedom.',
    finance:'Goats can struggle with financial practicalities, preferring beauty over budgets. However, when their creative talents are properly monetized, they can achieve remarkable prosperity.',
    luck_guidance:'Your sensitivity is strength, not weakness. Colors brown and red enhance your fortune. Lucky numbers: 2, 7, and 8. Create something beautiful this year — it will change your life.' },
  Monkey: { emoji:'\uD83D\uDC12', traits:['Inventive','Playful','Intelligent'], desc:'The Monkey outsmarts every challenge with wit, humor, and ingenuity.',
    qualities:'Monkeys are brilliant, inventive, and endlessly entertaining. Their quick wit and playful nature mask a sharp strategic mind. They solve problems others cannot even define.',
    relationships:'In love, the Monkey is fun, charming, and surprisingly devoted to the right partner. They need intellectual stimulation and playfulness. A partner who keeps them guessing earns their heart.',
    career:'Monkeys thrive in inventive roles — technology, science, comedy, trading, and problem-solving. Their versatility makes them valuable in any field, especially those requiring creative thinking under pressure.',
    finance:'The Monkey has excellent financial instincts and can generate wealth through cleverness and timing. Their challenge is consistency — when they stick with a plan, their intelligence creates remarkable returns.',
    luck_guidance:'Your brilliance is your currency. White and blue amplify your luck. Numbers 4, 9, and 0 carry power. Use humor to disarm obstacles this year.' },
  Rooster: { emoji:'\uD83D\uDC13', traits:['Observant','Hardworking','Honest'], desc:'The Rooster is precise and forthright, earning respect through integrity.',
    qualities:'Roosters are meticulous, honest, and hardworking. Their attention to detail is unmatched, and their directness, while sometimes blunt, earns deep respect. They set high standards and live by them.',
    relationships:'In love, the Rooster is loyal, honest, and devoted. They show love through acts of service and practical care. They need a partner who values integrity and can handle their candid nature.',
    career:'Roosters excel in precision roles — accounting, surgery, military, journalism, and quality control. They bring order to chaos and hold teams to higher standards.',
    finance:'Roosters are naturally careful with money. Their meticulous nature leads to well-organized finances and strategic investments. They rarely make impulsive purchases and build steady wealth.',
    luck_guidance:'Your precision is your power. Gold and brown are your lucky colors. Numbers 5, 7, and 8 favor you. This year rewards thorough preparation over quick action.' },
  Dog: { emoji:'\uD83D\uDC15', traits:['Loyal','Honest','Protective'], desc:'The Dog is the most faithful companion, driven by justice and devotion.',
    qualities:'Dogs are loyal, honest, and fiercely protective of those they love. Their sense of justice is strong, and they will fight for what is right. Trustworthy and selfless, they are the backbone of any community.',
    relationships:'In love, the Dog is the most faithful partner of the zodiac. They are protective, caring, and deeply committed. Trust is everything — once earned, a Dog\'s loyalty is unbreakable.',
    career:'Dogs thrive in service-oriented careers — law enforcement, social work, teaching, healthcare, and advocacy. Their strong moral compass makes them natural defenders of the vulnerable.',
    finance:'Dogs are moderate with money — not extravagant, but not stingy. They prioritize security over luxury and make steady, reliable financial decisions. Generosity with family is their one splurge.',
    luck_guidance:'Your loyalty is your greatest gift. Red and green bring you fortune. Lucky numbers: 3, 4, and 9. Protect your energy this year — not everyone deserves your devotion.' },
  Pig: { emoji:'\uD83D\uDC16', traits:['Generous','Compassionate','Diligent'], desc:'The Pig lives richly and gives freely, bringing abundance wherever it goes.',
    qualities:'Pigs are warm, generous, and genuinely good-hearted. Their optimism and kindness attract abundance and goodwill. They enjoy life\'s pleasures and share them freely with those they love.',
    relationships:'In love, the Pig is romantic, generous, and deeply devoted. They give everything to their relationships and create warm, nurturing homes. They need a partner who values their big heart.',
    career:'Pigs excel in hospitality, entertainment, medicine, and social work. Their warmth and genuine care for others make them beloved in any profession. They bring humanity and joy to the workplace.',
    finance:'Pigs attract wealth naturally but can be over-generous. They enjoy spending on loved ones and quality experiences. With a simple budget, their natural abundance multiplies impressively.',
    luck_guidance:'Your generosity returns to you tenfold. Yellow and grey amplify your luck. Numbers 2, 5, and 8 are auspicious. This year rewards open-hearted action.' },
};

function chineseAnimal(birthYear) {
  return CHINESE_ANIMALS[(birthYear - 4) % 12];
}
function chineseElement(birthYear) {
  return CHINESE_ELEMENTS_CYCLE[Math.floor(((birthYear - 4) % 10) / 2)];
}

/* ── Horoscope 2026 (yearly — sectioned) ── */
const YEARLY_2026 = {
  Aries: {
    overview: 'Mars pushes you to reinvent yourself in 2026. This is a year of bold action and personal transformation. The universe rewards decisive moves — hesitation costs more than mistakes.',
    career: 'A career breakthrough arrives mid-year when Mars activates your 10th house. Expect recognition for past efforts and a chance to step into leadership. Side projects gain traction around May. Avoid burning bridges in August when professional tensions peak.',
    finance: 'Finances improve steadily after April as Jupiter aspects your income sector. A new revenue stream emerges by summer. Investments made in the first quarter show returns by year-end. Avoid impulsive purchases during Mars retrograde in October.',
    family: 'Family dynamics shift positively as old conflicts finally resolve. A family celebration in spring brings lasting joy. Parents or older relatives need your attention in the fall. Your home environment benefits from renovation or fresh energy.',
    transits: 'Mars in your sign (Jan–Mar) fires up personal ambition. Jupiter trine your Sun in May triggers expansion. Saturn square in August tests discipline. Uranus opposition in November brings surprise breakthroughs.'
  },
  Taurus: {
    overview: 'Venus rewards patience in 2026. A relationship milestone marks the spring, and professionally, new skills open doors. This year asks you to build, not just dream — and what you build will last.',
    career: 'Your professional reputation solidifies this year. A new skill or certification pursued in Q1 opens unexpected doors by summer. A colleague becomes an important ally. Avoid overcommitting in September — quality over quantity wins.',
    finance: 'Build savings aggressively in the second half as Venus activates your financial sector. A property or long-term investment decision in spring proves wise. Unexpected expenses in July require a reserve. By December, your net worth has grown meaningfully.',
    family: 'Family bonds deepen through shared traditions and quality time. A spring gathering heals old wounds. Children or younger relatives look to you for guidance. Home improvements bring everyone closer together.',
    transits: 'Venus conjunct Jupiter in April brings abundance and love. Saturn sextile your Sun in June stabilizes career. North Node in your sign all year demands personal growth. Pluto trine in October catalyzes deep transformation.'
  },
  Gemini: {
    overview: 'Mercury keeps you buzzing all year. Communication projects thrive, and a travel opportunity transforms your perspective. 2026 is the year your ideas find their audience.',
    career: 'Your communication skills become your greatest professional asset. A writing, speaking, or media project gains traction in spring. Networking in Q2 connects you with a key mentor. Guard against scattered focus in autumn — one big win beats three half-finished projects.',
    finance: 'Multiple income streams are possible this year. A freelance or consulting opportunity in Q1 becomes recurring. Tech investments show promise. Watch spending around Mercury retrograde periods — double-check contracts before signing.',
    family: 'A sibling or close relative brings exciting news in the spring. Family travel creates lasting memories. Communication with a parent deepens. The fall is ideal for resolving any family misunderstandings through honest dialogue.',
    transits: 'Mercury conjunct Uranus in March sparks genius ideas. Jupiter enters your sign in May, beginning 12 months of major expansion. Saturn trine in July provides structure for your dreams. Neptune sextile invites spiritual growth all year.'
  },
  Cancer: {
    overview: 'The Moon guides you toward emotional freedom in 2026. Family bonds strengthen, and a career pivot brings surprising joy. Trust the process through turbulent months — your shell protects a growing pearl.',
    career: 'A career shift that felt risky becomes your best decision by mid-year. Your emotional intelligence gives you an edge in leadership or client-facing roles. A creative project gains recognition in autumn. Let intuition guide professional decisions.',
    finance: 'Financial security grows through conservative, steady action. A real estate or home-related investment pays off. Family financial planning becomes important in Q2. By year-end, you feel more financially grounded than you have in years.',
    family: 'Family is your greatest source of joy this year. A reunion or milestone celebration strengthens bonds. A family member\'s success brings shared pride. Your home becomes a sanctuary — invest in making it reflect your soul.',
    transits: 'Full Moon in Cancer (January) sets your emotional intentions. Mars trine your Sun in April energizes ambitions. Jupiter sextile in June expands your comfort zone. Saturn opposition in September tests your foundations — emerge stronger.'
  },
  Leo: {
    overview: 'The Sun amplifies your presence in 2026. Leadership roles find you, romance is electric in the summer, and financial expansion requires calculated risks. Your light shines brightest when you stop dimming it.',
    career: 'Your natural leadership draws opportunities like a magnet. A promotion or new role arrives in Q2. Creative projects gain serious attention by mid-year. Public speaking or visibility increases. Avoid ego conflicts with colleagues in August.',
    finance: 'Financial expansion requires calculated risks this year. An investment opportunity in Q1 deserves serious consideration. Luxury spending feels justified but keep reserves strong. A financial mentor appears in autumn — listen carefully.',
    family: 'Romance and family life are electric in summer. A significant relationship reaches a new milestone. Children bring unexpected joy and pride. Family gatherings become more frequent and meaningful as the year progresses.',
    transits: 'Sun conjunct Jupiter in May brings peak confidence and luck. Venus in Leo (July–Aug) ignites romance. Mars square in September tests patience. North Node aspects in November point toward your destiny path.'
  },
  Virgo: {
    overview: 'Detail-oriented Virgo excels in 2026. Health habits transform your energy, a work project gains recognition by fall, and romantic clarity arrives unexpectedly. Precision and patience are rewarded.',
    career: 'Your meticulous nature earns major recognition this year. A project you have been perfecting finally launches to acclaim by fall. A colleague values your analytical skills and includes you in a game-changing initiative. Avoid perfectionism paralysis in Q3.',
    finance: 'Financial organization yields surprising returns. A budgeting overhaul in Q1 frees capital for smart investments. A raise or bonus arrives around September. Health-related expenses decrease as your wellness efforts pay dividends.',
    family: 'Family health and routines improve together. Your organizational skills benefit the entire household. A family member asks for advice that proves transformative. Autumn brings a period of deep domestic harmony.',
    transits: 'Mercury in Virgo (Aug–Sep) sharpens your mind to a razor edge. Jupiter trine in June expands professional horizons. Saturn sextile all year provides supportive structure. Venus conjunct in October brings romantic clarity.'
  },
  Libra: {
    overview: 'Balance is your theme for 2026. Partnerships — personal and professional — redefine themselves. Creative ventures flourish. Protect your peace in busy seasons while embracing the beautiful chaos of growth.',
    career: 'Professional partnerships redefine your career trajectory. A collaboration proposed in Q1 becomes your most important project by year-end. Your diplomatic skills resolve a workplace conflict in summer. Creative ventures gain commercial traction.',
    finance: 'Joint finances and shared investments perform well. A business partnership improves your income bracket. Beauty or design-related ventures show promise. Avoid lending money to friends during Venus retrograde — boundaries protect relationships.',
    family: 'Relationships with romantic partners and close family members reach new depths. A commitment or milestone celebration brightens the spring. Family members appreciate your peacemaking skills during a tense period in autumn.',
    transits: 'Venus in Libra (September) restores your radiance. Jupiter opposition in May forces growth through partnership. Saturn square in July tests commitment — only what is real survives. Pluto sextile invites gradual power shifts.'
  },
  Scorpio: {
    overview: 'Transformation accelerates in 2026. Deep inner work unlocks outer abundance, a financial windfall is possible near autumn, and love requires radical honesty. You are shedding skin this year — let it happen.',
    career: 'Career transformation reaches a critical turning point. A role you have outgrown falls away, replaced by something that matches your evolved self. Research, investigation, or depth-work gains recognition. A powerful ally appears in Q3.',
    finance: 'A financial windfall is possible near autumn when Pluto activates your money sector. Investments in transformative industries — tech, health, energy — perform well. Debt restructuring in Q1 frees enormous energy. Trust your instincts on timing.',
    family: 'Deep emotional honesty transforms your closest relationships. A secret revealed strengthens rather than weakens a family bond. Healing generational patterns becomes possible this year. Your home undergoes meaningful change — internal or external.',
    transits: 'Pluto conjunct your ruler in January sets transformational tone. Mars in Scorpio (March) ignites personal power. Jupiter trine in August brings expansive abundance. Eclipse season in October–November accelerates destiny.'
  },
  Sagittarius: {
    overview: 'Jupiter expands your horizons in 2026. Travel, education, or spiritual pursuits open new chapters. Career momentum builds after a slow start, and love is adventurous and transformative.',
    career: 'Career momentum builds after a slow start. Q1 is preparation; Q2 is launch. A teaching, publishing, or international opportunity crystallizes by summer. Your philosophical perspective gives you an edge in leadership. Avoid overextending in autumn.',
    finance: 'Travel and education investments yield the highest returns this year. A foreign or online income stream gains traction. Generous spending is your nature, but Q3 requires disciplined saving. A financial windfall from an unexpected source arrives late in the year.',
    family: 'Family relationships benefit from your expanded worldview. Travel with family creates lifelong memories. A philosophical or spiritual conversation with a relative deepens mutual understanding. Distance from home actually strengthens bonds.',
    transits: 'Jupiter in your sign until May supercharges everything. Saturn sextile provides mature structure for wild dreams. Mars square in June tests your patience — slow down. Neptune trine all year heightens spiritual awareness.'
  },
  Capricorn: {
    overview: 'Saturn rewards your discipline in 2026. A long-term goal reaches fruition, relationships deepen through shared purpose, and health requires consistent attention. Your mountain has a summit — and you are close.',
    career: 'A long-term professional goal reaches fruition this year. The discipline you have maintained pays off in visible, tangible ways. A leadership position or major project milestone arrives in Q2. Your reputation as someone who delivers is cemented.',
    finance: 'Financial stability grows through proven, disciplined strategies. Long-term investments mature. A real estate decision made this year becomes foundational. Avoid risky ventures — your strength is steady compounding, not speculation.',
    family: 'Relationships deepen through shared purpose and mutual respect. A family business or shared project brings everyone closer. An elder\'s wisdom becomes especially valuable this year. Creating family traditions is deeply fulfilling.',
    transits: 'Saturn return energy lingers — maturity and responsibility deepen. Pluto in your sign demands continued transformation. Jupiter sextile in May opens doors. Mars conjunct in August powers ambitious action. Uranus trine in November brings welcome surprises.'
  },
  Aquarius: {
    overview: 'Uranus sparks innovation in your life throughout 2026. A bold career move pays off by midyear, friendships evolve meaningfully, and financial independence grows through unconventional means.',
    career: 'A bold career move pays off by midyear. Technology, innovation, or humanitarian work opens new paths. Your unconventional approach solves problems others cannot. A group project or community initiative gains momentum and visibility.',
    finance: 'Financial independence grows through unconventional means. Cryptocurrency, tech investments, or freelance innovation generate income. Traditional financial advice does not apply to you this year — trust your unique perspective while maintaining basic safeguards.',
    family: 'Friendships evolve to feel like family. Chosen family becomes as important as blood ties. A community you build or join provides deep belonging. Traditional family relationships benefit from your willingness to be authentically yourself.',
    transits: 'Uranus square continues to shake foundations — rebuild better. Saturn in your sign demands authentic self-expression. Jupiter conjunct in Q4 brings major expansion. Pluto sextile in August invites power through innovation.'
  },
  Pisces: {
    overview: 'Neptune heightens your creativity in 2026. Artistic projects gain recognition, emotional healing accelerates in the spring, and a financial decision in autumn sets your future course.',
    career: 'Artistic and creative projects gain significant recognition this year. Your intuitive approach solves problems that logic alone cannot. A mentorship or healing role emerges naturally. Music, art, film, or spiritual work thrives. Q2 is your peak performance period.',
    finance: 'A financial decision in autumn sets your long-term course. Creative income streams become more reliable. A spiritual or wellness-related venture shows commercial potential. Avoid unclear financial agreements — read everything twice.',
    family: 'Emotional healing within your family accelerates beautifully in the spring. Forgiveness creates space for joy. A family member\'s artistic talent blossoms with your encouragement. Your home becomes a sanctuary for creative expression.',
    transits: 'Neptune in Pisces continues your spiritual evolution. Jupiter sextile in May expands creative horizons. Saturn conjunct in September grounds your dreams in reality. Venus in Pisces (March) brings soul-level romantic connections.'
  },
};

const LUCKY_COLORS = ['Red', 'Gold', 'Blue', 'Green', 'Purple', 'Silver', 'Coral', 'Emerald', 'Amber', 'Rose'];
const LUCKY_GEMS = ['Ruby', 'Amethyst', 'Citrine', 'Emerald', 'Moonstone', 'Tiger Eye', 'Garnet', 'Sapphire', 'Opal', 'Jade'];
const LUCKY_DAYS_MAP = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* ── Exports ── */

export function getDailyHoroscope(form) {
  const sign = signFromDate(form?.birth_date);
  const icon = SIGN_ICONS[sign] || '\u2609';
  const element = SIGN_ELEMENTS[sign] || 'Fire';
  const seed = todaySeed('horoscope', form);
  const idx = seededIdx(seed, DAILY_TEMPLATES.length);
  const daily = DAILY_TEMPLATES[idx];
  const rng = seededRandom(seed);
  const luckyNums = [Math.floor(rng() * 50) + 1, Math.floor(rng() * 50) + 1, Math.floor(rng() * 50) + 1].sort((a, b) => a - b);

  return {
    sign, icon, element,
    general: daily.general,
    love: daily.love,
    career: daily.career,
    finance: daily.finance,
    wellness: daily.wellness,
    overallScore: 60 + seededIdx(seed + 'score', 35),
    luckyColors: [LUCKY_COLORS[seededIdx(seed + 'c1', LUCKY_COLORS.length)], LUCKY_COLORS[seededIdx(seed + 'c2', LUCKY_COLORS.length)]],
    luckyGem: LUCKY_GEMS[seededIdx(seed + 'gem', LUCKY_GEMS.length)],
    luckyDay: LUCKY_DAYS_MAP[seededIdx(seed + 'day', 7)],
    luckyNumbers: luckyNums,
  };
}

export function getZodiacProfile(form) {
  const sign = signFromDate(form?.birth_date);
  const icon = SIGN_ICONS[sign] || '\u2609';
  const profile = SIGN_PROFILES[sign] || SIGN_PROFILES.Aries;
  return { sign, icon, element: SIGN_ELEMENTS[sign], ...profile };
}

/* ── Chinese Horoscope Last Year / This Year Templates ── */
const CHINESE_YEAR_OUTLOOKS = {
  Rat: {
    lastYear: 'The Year of the Snake (2025) tested your adaptability. Social circles shifted, forcing you to rebuild networks. Financially steady but unspectacular — patience was the theme. Relationships deepened through honest communication.',
    thisYear: 'The Year of the Horse (2026) brings dynamic energy to the Rat. Career opportunities multiply mid-year. Romance sparks unexpectedly. Finances improve through bold networking. Your quick thinking is your greatest asset this year.'
  },
  Ox: {
    lastYear: 'The Year of the Snake (2025) rewarded your discipline with slow, steady progress. A long-term project showed first results. Relationships stabilized. Health required extra attention in the autumn months.',
    thisYear: 'The Year of the Horse (2026) challenges the Ox to move faster. Embrace flexibility — rigid plans will miss emerging opportunities. A financial breakthrough arrives by summer. Love deepens through shared adventures.'
  },
  Tiger: {
    lastYear: 'The Year of the Snake (2025) demanded strategic patience — not your natural mode. Career growth was internal rather than visible. A relationship crossroads tested your commitment. Financial decisions made last year pay off now.',
    thisYear: 'The Year of the Horse (2026) reignites the Tiger\'s fire. Leadership opportunities arrive. Romance is passionate and transformative. Financial risks taken now have strong upside. Trust your bold instincts again.'
  },
  Rabbit: {
    lastYear: 'The Year of the Snake (2025) brought quiet transformation. Intuition sharpened as old patterns fell away. A creative project gained traction. Finances were stable but unexciting. A close relationship revealed new depth.',
    thisYear: 'The Year of the Horse (2026) accelerates the Rabbit\'s pace. Social visibility increases dramatically. Career shifts favor creative pursuits. A financial opportunity arrives through an unexpected connection. Love blossoms in new environments.'
  },
  Dragon: {
    lastYear: 'The Year of the Snake (2025) was a year of deep wisdom for the Dragon. Behind-the-scenes work laid powerful foundations. A financial seed planted last year is ready to grow. Relationships required patience and humility.',
    thisYear: 'The Year of the Horse (2026) puts the Dragon back in the spotlight. Ambitious projects gain momentum. Financial abundance flows from past groundwork. Romance is dramatic and fulfilling. Your charisma is magnetic this year.'
  },
  Snake: {
    lastYear: 'The Year of the Snake (2025) was your year of power and reinvention. Transformative change reshaped career and identity. Relationships deepened or ended — no middle ground. Financial gains came through strategic timing.',
    thisYear: 'The Year of the Horse (2026) asks the Snake to sustain momentum. The changes you made last year now bear fruit. Finances continue to grow. Love requires more openness than usual. Physical vitality needs attention.'
  },
  Horse: {
    lastYear: 'The Year of the Snake (2025) slowed your gallop but sharpened your focus. Patience was difficult but necessary. Career clarity emerged from reflection. Financial discipline paid off by year-end.',
    thisYear: 'The Year of the Horse (2026) is YOUR year. Energy, opportunity, and luck converge powerfully. Career leaps are likely. Romance is electric. Finances expand significantly. Ride this wave with confidence and gratitude.'
  },
  Goat: {
    lastYear: 'The Year of the Snake (2025) nurtured your creative soul. An artistic endeavor gained recognition. Relationships brought comfort and stability. Finances were modest but sufficient. Emotional healing progressed beautifully.',
    thisYear: 'The Year of the Horse (2026) energizes the Goat\'s ambitions. Creative projects attract attention and income. A partnership — romantic or professional — transforms your trajectory. Financial growth exceeds expectations.'
  },
  Monkey: {
    lastYear: 'The Year of the Snake (2025) tested your cleverness with complex challenges. Intellectual growth was immense. A financial gamble produced mixed results. Relationships required more honesty than charm.',
    thisYear: 'The Year of the Horse (2026) brings the Monkey exciting new playgrounds. Career innovation thrives. Social connections open powerful doors. Finances benefit from your quick thinking. Love surprises you in the best way.'
  },
  Rooster: {
    lastYear: 'The Year of the Snake (2025) refined your skills and sharpened your vision. Hard work earned quiet recognition. A financial plan clicked into place. Relationships improved through direct, honest communication.',
    thisYear: 'The Year of the Horse (2026) accelerates the Rooster\'s rise. Precision and preparation meet perfect timing. Career advancement is strong. Finances grow through disciplined investment. Love rewards vulnerability.'
  },
  Dog: {
    lastYear: 'The Year of the Snake (2025) tested your loyalty and values. Standing firm on principles earned deep respect. Career progress was slow but meaningful. A relationship challenge strengthened your bond.',
    thisYear: 'The Year of the Horse (2026) brings the Dog new adventures and allies. Social circles expand joyfully. Career opportunities favor team players. Finances improve through generous collaboration. Love is warm and steady.'
  },
  Pig: {
    lastYear: 'The Year of the Snake (2025) taught the Pig important lessons about boundaries. Generosity was tested by those who took too much. Financial awareness grew. A romantic bond proved its strength through difficulty.',
    thisYear: 'The Year of the Horse (2026) restores the Pig\'s natural abundance. Joy returns to daily life. Career success comes through authentic connection. Financial prospects brighten considerably. Love is generous and reciprocated.'
  },
};

export function getChineseHoroscope(form) {
  const bd = form?.birth_date || '1990-01-01';
  const year = parseInt(bd.split('-')[0], 10);
  const animal = chineseAnimal(year);
  const element = chineseElement(year);
  const profile = CHINESE_PROFILES[animal] || CHINESE_PROFILES.Dragon;
  const yearOutlook = CHINESE_YEAR_OUTLOOKS[animal] || CHINESE_YEAR_OUTLOOKS.Dragon;
  return {
    animal, element, year,
    emoji: profile.emoji,
    traits: profile.traits,
    desc: profile.desc,
    qualities: profile.qualities,
    relationships: profile.relationships,
    career: profile.career,
    finance: profile.finance,
    luck_guidance: profile.luck_guidance,
    lastYear: yearOutlook.lastYear,
    thisYear: yearOutlook.thisYear,
  };
}

export function getYearlyHoroscope(form) {
  const sign = signFromDate(form?.birth_date);
  const icon = SIGN_ICONS[sign] || '\u2609';
  const data = YEARLY_2026[sign] || YEARLY_2026.Aries;
  return { sign, icon, ...data };
}

// Keep old getHoroscope for backward compat (unused but safe)
export function getHoroscope(form) {
  return getDailyHoroscope(form);
}

/* ═══════════════════════════════════════════════════════
   2. TAROT READING
   ═══════════════════════════════════════════════════════ */
const MAJOR_ARCANA = [
  { name:'The Fool',          num:0,  upright:'New beginnings, innocence, spontaneity', reversed:'Recklessness, naivety, foolish risk' },
  { name:'The Magician',      num:1,  upright:'Willpower, creation, resourcefulness', reversed:'Manipulation, illusions, untapped talents' },
  { name:'The High Priestess',num:2,  upright:'Intuition, sacred knowledge, the subconscious', reversed:'Secrets, disconnection from intuition' },
  { name:'The Empress',       num:3,  upright:'Abundance, fertility, nurturing', reversed:'Dependence, smothering, creative block' },
  { name:'The Emperor',       num:4,  upright:'Authority, structure, stability', reversed:'Rigidity, tyranny, lack of discipline' },
  { name:'The Hierophant',    num:5,  upright:'Tradition, spiritual guidance, conformity', reversed:'Rebellion, subversion, new approaches' },
  { name:'The Lovers',        num:6,  upright:'Love, harmony, partnership, choices', reversed:'Imbalance, misalignment, disharmony' },
  { name:'The Chariot',       num:7,  upright:'Determination, willpower, triumph', reversed:'Lack of direction, aggression' },
  { name:'Strength',          num:8,  upright:'Inner strength, courage, patience', reversed:'Self-doubt, weakness, raw emotion' },
  { name:'The Hermit',        num:9,  upright:'Solitude, soul-searching, inner guidance', reversed:'Isolation, loneliness, withdrawal' },
  { name:'Wheel of Fortune',  num:10, upright:'Change, cycles, destiny', reversed:'Bad luck, resistance to change' },
  { name:'Justice',           num:11, upright:'Fairness, truth, cause and effect', reversed:'Dishonesty, unfairness, lack of accountability' },
  { name:'The Hanged Man',    num:12, upright:'Surrender, new perspective, letting go', reversed:'Stalling, resistance, indecision' },
  { name:'Death',             num:13, upright:'Transformation, endings, transition', reversed:'Resistance to change, stagnation' },
  { name:'Temperance',        num:14, upright:'Balance, moderation, patience', reversed:'Imbalance, excess, lack of harmony' },
  { name:'The Tower',         num:15, upright:'Sudden change, revelation, upheaval', reversed:'Fear of change, averting disaster' },
  { name:'The Star',          num:16, upright:'Hope, renewal, serenity', reversed:'Despair, disconnection, lack of faith' },
  { name:'The Moon',          num:17, upright:'Illusion, intuition, the unconscious', reversed:'Confusion, fear, misinterpretation' },
  { name:'The Sun',           num:18, upright:'Joy, success, vitality', reversed:'Temporary depression, lack of success' },
  { name:'Judgement',         num:19, upright:'Rebirth, inner calling, absolution', reversed:'Self-doubt, refusal of self-examination' },
  { name:'The World',         num:20, upright:'Completion, accomplishment, travel', reversed:'Incompletion, stagnation' },
];

const SPREAD_TEMPLATES = {
  one:       ['Present Energy'],
  three:     ['Past', 'Present', 'Future'],
  love:      ['You', 'Your Partner', 'The Connection'],
  wellness:  ['Body', 'Mind', 'Spirit'],
  mind:      ['Conscious', 'Subconscious', 'Guidance'],
};

/* ── Detailed single-card reading paragraphs (2 paragraphs per card, upright + reversed) ── */
const SINGLE_CARD_READINGS = {
  'The Fool': {
    upright: 'The Fool appears to tell you that a new chapter is about to begin. You stand at the edge of something unknown, and the universe invites you to leap with faith. This is not the time for caution or overthinking — your innocence and openness are your greatest strengths right now. Trust that the path will reveal itself as you walk it.\n\nThis card carries the energy of pure potential. Every great journey begins with a single step into the unknown, and The Fool reminds you that freedom comes from releasing the need to control every outcome. Embrace spontaneity, say yes to unexpected invitations, and let your childlike curiosity guide your decisions today.',
    reversed: 'The Fool reversed warns against reckless behavior or naivety. You may be rushing into something without proper consideration, or ignoring red flags that others can clearly see. This is not a call to freeze — it is a call to pause and look before you leap. The difference between courage and foolishness is awareness.\n\nThere may also be a fear of starting something new holding you back. The reversed Fool can indicate that you are playing it too safe, letting anxiety prevent you from taking a necessary risk. Find the middle ground between blind faith and paralyzing caution. Prepare, then move forward with confidence.'
  },
  'The Magician': {
    upright: 'The Magician tells you that everything you need is already in your hands. This card represents the power of focused intention, creativity, and willpower. You have the tools, skills, and resources to manifest exactly what you desire — the question is whether you believe it. Now is the time to act with purpose and channel your energy into a single, clear goal.\n\nThe Magician also speaks to alignment between your thoughts, words, and actions. When these three forces work together, you become unstoppable. This is a day for making things happen rather than waiting for things to happen to you. Set your intention, take the first step, and watch the universe conspire in your favor.',
    reversed: 'The Magician reversed suggests that your talents may be scattered or misdirected. You have the ability, but something is preventing you from channeling it effectively — perhaps self-doubt, distraction, or a lack of clear direction. It is also possible that someone around you is using manipulation or deception to influence your decisions.\n\nThis card invites you to reconnect with your authentic power. Strip away anything that dilutes your focus. If you have been procrastinating on a creative project or letting others define your path, The Magician reversed is your wake-up call. Reclaim your agency and remember: you are the creator of your reality, not a spectator.'
  },
  'The High Priestess': {
    upright: 'The High Priestess appears when your intuition is trying to tell you something important. This card represents the deep, quiet knowing that lives beneath conscious thought. Pay attention to dreams, gut feelings, and subtle signs — the answers you seek are not found through logic alone. Something hidden is about to be revealed, but only to those patient enough to listen.\n\nThis is a time for stillness and reflection rather than action. The High Priestess guards the threshold between the seen and unseen worlds, and she invites you to trust the mystery. Not everything needs to be understood right now. Some truths unfold in their own time. Honor your inner wisdom and let it guide you through this period of uncertainty.',
    reversed: 'The High Priestess reversed indicates that you may be ignoring your intuition or feeling disconnected from your inner voice. External noise — opinions, expectations, information overload — is drowning out the subtle guidance your soul is offering. You may also be keeping secrets from yourself, avoiding truths that feel uncomfortable but necessary.\n\nThis card asks you to create space for silence and self-reflection. Turn off the noise, sit with your thoughts, and ask yourself what you truly feel beneath the surface. The answers are there — you have simply been too busy or too afraid to hear them. Trust your inner knowing; it has never led you astray.'
  },
  'The Empress': {
    upright: 'The Empress radiates abundance, creativity, and nurturing energy. This card tells you that you are entering a period of growth and fertility — whether that means a creative project, a relationship, or a new phase of self-love. The universe is generous right now, and your job is to receive. Allow beauty, pleasure, and comfort into your life without guilt.\n\nThe Empress also reminds you of the power of nurturing — both yourself and others. When you tend to your own well-being, you create a foundation from which everything else can flourish. This is a time to connect with nature, indulge your senses, and trust that abundance is your natural state.',
    reversed: 'The Empress reversed suggests a block in your creative or nurturing energy. You may be neglecting self-care, feeling uninspired, or giving too much to others while running on empty yourself. There is a difference between generosity and depletion — this card asks you to examine which one you are practicing.\n\nIt may also indicate codependency or smothering in relationships. Love should empower, not control. If you have been overextending yourself or seeking validation through caretaking, The Empress reversed invites you to redirect that energy inward. Fill your own cup first. Creativity and abundance return when you honor your own needs.'
  },
  'The Emperor': {
    upright: 'The Emperor brings structure, authority, and stability to your reading. This card represents the power of discipline and organization — it tells you that now is the time to take charge of your life with clear boundaries and decisive action. Whether in career, relationships, or personal goals, The Emperor asks you to lead with confidence and build something lasting.\n\nThis card also speaks to the importance of creating order from chaos. If any area of your life feels scattered or unstable, The Emperor provides the energy to establish firm foundations. Make plans, set rules, and hold yourself accountable. True power comes not from force, but from the quiet authority of someone who knows their worth and acts accordingly.',
    reversed: 'The Emperor reversed warns of rigidity, control issues, or an abuse of authority — either your own or someone else\'s. You may be clinging too tightly to rules and structures that no longer serve you, or you may be in a situation where someone is exerting unhealthy dominance. Flexibility is not weakness; it is wisdom.\n\nAlternatively, this card may indicate a lack of discipline or structure in your life. Without healthy boundaries, everything feels chaotic. The Emperor reversed invites you to find the balance between control and surrender — firm enough to maintain direction, flexible enough to adapt when life demands it.'
  },
  'The Hierophant': {
    upright: 'The Hierophant represents tradition, spiritual guidance, and shared wisdom. This card appears when you benefit from established systems — whether that is a mentor, a spiritual practice, or an institution that provides structure for growth. There is wisdom in what has come before, and right now, learning from others serves you better than reinventing the wheel.\n\nThis is also a card of education and commitment. A formal study, certification, or ceremonial milestone may be approaching. The Hierophant asks you to honor your values and the communities that uphold them. Sometimes the most revolutionary act is to deepen your roots rather than pull them up.',
    reversed: 'The Hierophant reversed signals a time to question convention and forge your own spiritual or philosophical path. Rules that once provided comfort may now feel like chains. This card encourages independent thinking and the courage to challenge traditions that no longer align with who you are becoming.\n\nIt may also indicate feeling restricted by bureaucracy, dogma, or authority figures. The reversed Hierophant asks: whose rules are you following, and why? If the answer does not resonate with your soul, it is time to write new ones. True wisdom is not inherited — it is discovered through personal experience and honest inquiry.'
  },
  'The Lovers': {
    upright: 'The Lovers card speaks of deep connection, harmony, and meaningful choices. This is not only about romantic love — it is about alignment between your heart and your values. A significant choice is before you, and The Lovers asks you to choose with integrity and passion. When head and heart agree, the right path becomes unmistakable.\n\nIn relationships, this card signifies a deepening of bonds through honesty and vulnerability. If single, it may herald a meeting of souls. If partnered, it invites renewed intimacy and mutual growth. The Lovers reminds you that the most powerful relationships are built on shared values, not just attraction.',
    reversed: 'The Lovers reversed indicates misalignment — between partners, between your values and your actions, or between what you want and what you are choosing. A relationship may be experiencing disharmony, or you may be avoiding a difficult choice by pretending it does not exist. Avoidance only deepens the rift.\n\nThis card asks for radical honesty. What are you sacrificing to keep the peace? What choice are you avoiding because the truth feels too uncomfortable? The Lovers reversed is not a death sentence for any relationship — it is an invitation to realign. Address the disconnect now, before it becomes a chasm.'
  },
  'The Chariot': {
    upright: 'The Chariot signals victory through sheer determination and willpower. You are being called to take the reins and drive forward with confidence. Obstacles may appear, but this card assures you that your focus and discipline will carry you through. Success is not a matter of luck right now — it is a matter of will.\n\nThis card also represents the mastery of opposing forces. You may be juggling competing priorities or emotions, but The Chariot says you can hold them both and still move forward. Channel your ambition, stay disciplined, and trust that momentum is building. The finish line is closer than you think.',
    reversed: 'The Chariot reversed suggests a loss of direction or control. You may feel pulled in too many directions, unable to gain traction on any single goal. Aggression or force will not solve this — the answer lies in stepping back, reassessing your priorities, and choosing one clear direction to commit to.\n\nThis card may also indicate that external circumstances are blocking your progress. Rather than fighting harder, consider whether you need a different strategy altogether. The Chariot reversed reminds you that true victory sometimes requires surrender — not of the goal, but of the approach that is not working.'
  },
  'Strength': {
    upright: 'Strength is not about brute force — it is about inner resolve, compassion, and quiet courage. This card appears when you need to face a challenge with patience rather than aggression. You have more power than you realize, and it comes from your ability to remain calm under pressure, to lead with love, and to tame your own inner beasts.\n\nThis is a time to trust your emotional resilience. Whatever you are facing, Strength tells you that gentleness is more effective than force. Approach difficult conversations with empathy. Meet your fears with curiosity instead of panic. Your capacity to endure and transform difficulty into wisdom is your greatest gift right now.',
    reversed: 'Strength reversed suggests self-doubt, emotional exhaustion, or a loss of confidence. You may be feeling overwhelmed by a situation that once felt manageable, or you may be suppressing emotions rather than processing them. Raw, unacknowledged feelings have a way of erupting at the worst possible moment.\n\nThis card invites you to be honest about where you are struggling. Asking for help is not weakness — it is the truest form of strength. If you have been pushing through on sheer willpower alone, your reserves may be depleted. Rest, reconnect with what gives you courage, and remember: you have survived everything that has come before this.'
  },
  'The Hermit': {
    upright: 'The Hermit calls you inward. This is a time for solitude, soul-searching, and deep personal reflection. The answers you seek will not be found in the opinions of others or the noise of the outside world — they live within you, waiting to be discovered in stillness. Withdraw temporarily to gain clarity.\n\nThe Hermit also represents the wisdom that comes from experience. You may be entering a phase where you serve as a guide for others, sharing the insights you have earned through your own journey. But first, honor your need for quiet contemplation. The lamp The Hermit carries illuminates one step at a time — trust that is enough.',
    reversed: 'The Hermit reversed warns against excessive isolation or withdrawal from the world. While solitude can be healing, too much of it becomes avoidance. You may be hiding from a situation that requires your engagement, or refusing help when you clearly need it. Connection is not a distraction — it is often the medicine.\n\nAlternatively, this card may indicate that a period of introspection is ending and it is time to rejoin the world with the wisdom you have gained. Do not stay in the cave longer than necessary. The insights you have gathered in solitude are meant to be lived and shared, not hoarded.'
  },
  'Wheel of Fortune': {
    upright: 'The Wheel of Fortune reminds you that change is the only constant. A shift is coming — and it favors you. Cycles are turning in your direction, bringing new opportunities, unexpected luck, and the chance to ride a wave of positive momentum. This is the universe telling you that what goes around comes around, and your good deeds are returning.\n\nThis card also asks you to embrace impermanence. Nothing lasts forever — neither hardship nor ease. The Wheel teaches you to enjoy the highs without clinging and to endure the lows without despair. Trust the rhythm of your life. You are exactly where you are supposed to be in the grand cycle of things.',
    reversed: 'The Wheel of Fortune reversed signals a downturn or a feeling of being stuck in an unfavorable cycle. Bad luck, setbacks, or delays may be testing your patience. But remember — the wheel always turns. This difficult phase is temporary, even though it may not feel that way right now.\n\nThis card invites you to examine what you can control versus what you cannot. Resisting change only prolongs suffering. Instead, ask yourself what this period is teaching you. The Wheel reversed often precedes a major breakthrough — the darkest hour is just before dawn. Hold steady and trust the turn.'
  },
  'Justice': {
    upright: 'Justice speaks of truth, fairness, and the law of cause and effect. The decisions you have made — good and bad — are now producing their consequences. This is not punishment; it is balance. If you have acted with integrity, rewards are coming. If not, this card invites accountability as the first step toward correction.\n\nA legal matter, negotiation, or important decision may be at hand. Justice asks you to weigh all sides carefully, act honestly, and trust that the truth will prevail. This is not the time for shortcuts or half-truths. Clarity and fairness serve you better than cleverness.',
    reversed: 'Justice reversed suggests that something feels unfair or unbalanced. You may be experiencing the consequences of past decisions, avoiding accountability, or dealing with a situation where dishonesty is at play. The truth is being obscured, either by others or by your own unwillingness to see it.\n\nThis card asks for radical self-honesty. Are you taking responsibility for your part in the situation? Are you being treated fairly, or are you tolerating injustice? Justice reversed does not mean that fairness is impossible — it means that someone needs to fight for it. That someone might be you.'
  },
  'The Hanged Man': {
    upright: 'The Hanged Man asks you to surrender — not in defeat, but in wisdom. Sometimes the most powerful thing you can do is stop trying to force an outcome and let the universe work on your behalf. A shift in perspective is needed, and it can only come through letting go of your current way of seeing things.\n\nThis card represents the sacred pause. You may feel suspended or stuck, but this is not stagnation — it is incubation. Something is developing beneath the surface that cannot be rushed. Trust the wait. The Hanged Man promises that what you release now creates space for something far more aligned.',
    reversed: 'The Hanged Man reversed indicates resistance to necessary change or an unwillingness to see things from a different angle. You may be stalling, making excuses, or clinging to a situation that has clearly run its course. The discomfort you feel is the universe pushing you toward growth you are resisting.\n\nAlternatively, this card can signal the end of a waiting period. If you have been in limbo, movement is finally possible — but only if you release whatever you have been holding onto too tightly. The Hanged Man reversed says: stop overthinking, stop delaying, and trust the process enough to let go.'
  },
  'Death': {
    upright: 'Death does not predict physical death — it heralds profound transformation. Something in your life is ending, and while endings can be painful, they are necessary for new growth. This card asks you to release what no longer serves you — relationships, habits, beliefs, or identities that have outlived their purpose.\n\nThe Death card is ultimately about rebirth. The caterpillar must dissolve entirely before the butterfly can emerge. Whatever is falling away right now is making room for something more authentic and alive. Grieve what you must, but do not cling. The next chapter of your life is waiting on the other side of this transformation.',
    reversed: 'Death reversed suggests resistance to a necessary ending. You may be holding onto something — a relationship, a job, an old version of yourself — that has clearly reached its natural conclusion. Fear of the unknown keeps you in a place that no longer fits, and the longer you resist, the more painful the eventual release becomes.\n\nThis card also warns against stagnation. When we refuse to let things die naturally, we create a kind of living death — existing without growing. Death reversed invites you to find the courage to close the chapter. What awaits on the other side is worth the temporary grief of letting go.'
  },
  'Temperance': {
    upright: 'Temperance brings a message of balance, patience, and harmony. This card appears when moderation is your greatest ally. Avoid extremes in all areas of life — whether it is work versus rest, giving versus receiving, or passion versus caution. The middle path holds the answers you seek.\n\nTemperance also speaks to the art of blending different aspects of your life into a cohesive whole. You may be integrating new knowledge with old wisdom, or finding balance between competing priorities. Trust the process of gradual refinement. Like an alchemist turning lead into gold, you are transforming your experiences into something precious — one measured step at a time.',
    reversed: 'Temperance reversed warns of imbalance, excess, or a lack of moderation. You may be overindulging in one area while neglecting another, or pushing yourself too hard without adequate rest. The harmony you seek cannot be found through extremes — it requires conscious calibration.\n\nThis card may also indicate inner conflict or a clash between opposing desires. You want two things that seem incompatible, and the tension is creating stress. Temperance reversed asks you to stop forcing resolution and instead find the third option — the creative synthesis that honors both sides. Balance is not about choosing one over the other; it is about finding the space where both can coexist.'
  },
  'The Tower': {
    upright: 'The Tower represents sudden upheaval, revelation, and the destruction of false structures. This card can feel alarming, but its purpose is liberation. Whatever is crumbling was built on unstable foundations, and the universe is clearing the ground for something real and lasting. You cannot build truth on top of illusion.\n\nThe Tower moment is intense but brief. It strips away pretense, denial, and complacency in one dramatic flash. What remains after the lightning strikes is authentic and worth rebuilding upon. Breathe through the chaos, let the old structure fall, and trust that the clearing creates space for something far more solid.',
    reversed: 'The Tower reversed suggests that you are either narrowly avoiding a crisis or resisting a necessary destruction. You may be propping up a situation that should be allowed to collapse, or you may have already weathered the worst and are now in the rebuilding phase. Either way, the ground beneath you is shifting.\n\nIf you are avoiding the Tower moment, this card warns that delay only increases the eventual impact. If the crisis has already passed, take heart — the worst is behind you. Now begins the slow, meaningful work of rebuilding on honest foundations. What emerges will be stronger than what fell.'
  },
  'The Star': {
    upright: 'The Star shines as a beacon of hope, renewal, and serenity after difficulty. If you have been through a challenging period, this card assures you that healing is underway and better days are coming. The universe has not forgotten you — in fact, it is pouring its blessings upon you right now. Open your heart to receive them.\n\nThe Star also represents inspiration and a renewed sense of purpose. You may feel a deep connection to your higher self, your creativity, or your spiritual path. This is a time to dream big and trust that your vision will manifest. The Star does not promise instant results — it promises that your faith is well-placed and your path is illuminated.',
    reversed: 'The Star reversed indicates a loss of hope, faith, or inspiration. You may be feeling disconnected from your purpose, questioning whether your efforts will ever bear fruit. Despair has a way of clouding the view, making the future seem bleaker than it actually is. This card gently reminds you that the star is still there — you have simply lost sight of it temporarily.\n\nReconnect with whatever restores your faith — nature, music, prayer, art, or simply the company of someone who believes in you. The Star reversed is not a permanent condition; it is a temporary fog. The light returns when you choose to look for it, even in small ways.'
  },
  'The Moon': {
    upright: 'The Moon illuminates the realm of illusion, intuition, and the unconscious mind. Things are not as they seem right now, and this card urges you to trust your instincts over appearances. Dreams, hunches, and unexplained feelings carry important messages. Do not dismiss what cannot be rationally explained.\n\nThe Moon also represents the shadow self — the parts of you that operate below conscious awareness. Fears, anxieties, and old wounds may be surfacing for healing. Rather than running from these shadows, face them with compassion. The Moon promises that what you discover in the darkness will ultimately set you free.',
    reversed: 'The Moon reversed signals that confusion is clearing and truth is emerging. If you have been uncertain about a situation, clarity is on its way. Secrets are revealed, illusions dissolve, and what was hidden comes into the light. This is a relief, even if the truth is not exactly what you hoped for.\n\nThis card may also indicate that you have been allowing fear to control your decisions. The reversed Moon asks you to release anxiety and trust what you can see rather than what you imagine. Most of what you worry about will never happen. Step out of the shadows and into the clarity that awaits you.'
  },
  'The Sun': {
    upright: 'The Sun is the most joyful card in the entire tarot deck. It brings warmth, success, vitality, and pure, uncomplicated happiness. Whatever you are working toward is blessed with positive energy. Confidence is high, outcomes are favorable, and the light of truth illuminates your path with unmistakable clarity.\n\nThe Sun also represents authenticity and the joy that comes from living as your true self. Children embody Sun energy — playful, honest, and radiantly alive. This card invites you to reconnect with that childlike joy. Celebrate your achievements, share your light generously, and know that you deserve every bit of the happiness flowing toward you.',
    reversed: 'The Sun reversed suggests that joy is present but partially obscured. You may be struggling to see the positive in your situation, or self-doubt is dimming your natural radiance. The good news is that The Sun reversed still carries powerful positive energy — it just requires a shift in perspective to access it fully.\n\nThis card may also indicate temporary delays in achieving your goals. Success is still coming, but perhaps not on the timeline you expected. Do not let impatience steal your joy. The Sun reversed asks you to find happiness in the present moment rather than deferring it until some future condition is met.'
  },
  'Judgement': {
    upright: 'Judgement calls you to a higher purpose. This card represents rebirth, spiritual awakening, and the moment when you answer your true calling. A major life decision is before you — one that asks you to evaluate your past honestly, release what no longer aligns, and step boldly into the next version of yourself.\n\nThis is a card of self-evaluation without self-punishment. Look at your life with clear eyes. What are you proud of? What would you do differently? Judgement does not condemn — it liberates through awareness. When you accept your whole story — light and shadow — you gain the power to write a new chapter with wisdom and purpose.',
    reversed: 'Judgement reversed suggests that you are avoiding a necessary self-evaluation or ignoring a calling that grows louder with each passing day. You may be haunted by past mistakes, unable to forgive yourself, or refusing to learn the lessons your experiences are trying to teach you.\n\nThis card asks: what are you afraid to face? Self-doubt and guilt serve no one — least of all you. Judgement reversed invites you to stop punishing yourself for being human and start using your experience as fuel for transformation. The calling does not go away because you ignore it; it simply grows more insistent.'
  },
  'The World': {
    upright: 'The World represents completion, accomplishment, and the successful end of a major life cycle. You have arrived. Whatever journey you have been on — a project, a relationship chapter, a period of growth — is reaching its fulfillment. Take a moment to celebrate how far you have come before the next cycle begins.\n\nThis card also symbolizes wholeness and integration. All the pieces of your life are coming together in a way that finally makes sense. Travel, expansion, and a sense of cosmic belonging characterize this period. The World tells you that you are exactly where you are meant to be — and the universe is applauding.',
    reversed: 'The World reversed indicates that a journey is almost complete but something is preventing final closure. You may be rushing to finish when patience is needed, or leaving loose ends that require attention before you can truly move on. Completion requires thoroughness, not just speed.\n\nThis card may also suggest a fear of endings. Finishing something means starting something new, and the unknown can feel daunting. The World reversed gently reminds you that holding onto a completed cycle prevents the next one from beginning. Close the chapter with grace. What comes next is even more extraordinary.'
  },
};

export function getTarotReading(form, spreadType = 'one') {
  const seed = todaySeed(`tarot-${spreadType}`, form);
  const rng = seededRandom(seed);
  const positions = SPREAD_TEMPLATES[spreadType] || SPREAD_TEMPLATES.one;
  const usedIdxs = new Set();
  const cards = positions.map((pos) => {
    let idx;
    do { idx = Math.floor(rng() * MAJOR_ARCANA.length); } while (usedIdxs.has(idx));
    usedIdxs.add(idx);
    const isReversed = rng() > 0.65;
    const card = MAJOR_ARCANA[idx];
    const detail = SINGLE_CARD_READINGS[card.name];
    return {
      position: pos,
      name: card.name,
      num: card.num,
      isReversed,
      meaning: isReversed ? card.reversed : card.upright,
      orientation: isReversed ? 'Reversed' : 'Upright',
      detailedReading: detail ? (isReversed ? detail.reversed : detail.upright) : '',
    };
  });

  const summaries = [
    'The cards reveal a moment of transformation. Trust the process unfolding before you.',
    'Balance is the key message. Align your actions with your deeper values.',
    'A period of growth begins now. What you plant today shapes your tomorrow.',
    'The universe mirrors your inner state. Shift within, and the outer world follows.',
    'Hidden strengths come to light. You are more ready than you realize.',
    'Let go of what no longer serves you. Space creates possibility.',
  ];

  return {
    spreadType,
    cards,
    summary: summaries[seededIdx(seed + 'sum', summaries.length)],
  };
}

/* ═══════════════════════════════════════════════════════
   3. LOVE COMPATIBILITY
   ═══════════════════════════════════════════════════════ */
const COMPAT_MATRIX = {
  Fire_Fire: { score: 82, desc: 'Explosive passion meets fierce independence. You ignite each other.' },
  Fire_Earth: { score: 58, desc: 'Fire warms Earth, but too much burns. Balance ambition with patience.' },
  Fire_Air:  { score: 88, desc: 'Air fans the flames. Together, you are unstoppable visionaries.' },
  Fire_Water: { score: 52, desc: 'Steam rises from this union. Emotional depth meets raw energy.' },
  Earth_Earth: { score: 78, desc: 'Rock-solid stability. You build lasting foundations together.' },
  Earth_Air: { score: 55, desc: 'Grounding ideas vs. chasing them. Teach each other what matters.' },
  Earth_Water: { score: 85, desc: 'A garden that blooms. Water nurtures what Earth provides.' },
  Air_Air:   { score: 75, desc: 'Intellectual equals. Your conversations could change the world.' },
  Air_Water:  { score: 60, desc: 'Head meets heart. Beautiful when balanced, stormy when not.' },
  Water_Water: { score: 80, desc: 'Deep emotional currents connect you. Almost telepathic understanding.' },
};

function compatKey(el1, el2) {
  const sorted = [el1, el2].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

export function getLoveCompatibility(birthDate1, birthDate2) {
  const sign1 = signFromDate(birthDate1);
  const sign2 = signFromDate(birthDate2);
  const el1 = SIGN_ELEMENTS[sign1] || 'Fire';
  const el2 = SIGN_ELEMENTS[sign2] || 'Fire';
  const key = compatKey(el1, el2);
  const base = COMPAT_MATRIX[key] || { score: 65, desc: 'A unique pairing with hidden potential.' };

  const seed = `compat-${birthDate1}-${birthDate2}`;
  const rng = seededRandom(seed);
  const jitter = Math.floor(rng() * 10) - 5;
  const score = Math.max(30, Math.min(99, base.score + jitter));

  const areas = {
    romance:       Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    communication: Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    trust:         Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    values:        Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    growth:        Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
  };

  const advice = [
    'Celebrate your differences as much as your similarities.',
    'Communication is the bridge between your two worlds.',
    'Give each other space to grow independently.',
    'Shared rituals strengthen your bond over time.',
    'When conflict arises, lead with curiosity, not blame.',
  ];

  return {
    sign1, sign2,
    icon1: SIGN_ICONS[sign1], icon2: SIGN_ICONS[sign2],
    el1, el2,
    score,
    description: base.desc,
    areas,
    advice: advice[seededIdx(seed + 'adv', advice.length)],
  };
}

export function getSignCompatibility(userSign, partnerSign, partnerGender) {
  const el1 = SIGN_ELEMENTS[userSign] || 'Fire';
  const el2 = SIGN_ELEMENTS[partnerSign] || 'Fire';
  const key = compatKey(el1, el2);
  const base = COMPAT_MATRIX[key] || { score: 65, desc: 'A unique pairing with hidden potential.' };

  const seed = `signcompat-${userSign}-${partnerSign}-${partnerGender}`;
  const rng = seededRandom(seed);
  const jitter = Math.floor(rng() * 10) - 5;
  const score = Math.max(30, Math.min(99, base.score + jitter));

  const areas = {
    romance:       Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    communication: Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    trust:         Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    values:        Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    intimacy:      Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
    growth:        Math.max(30, Math.min(99, score + Math.floor(rng() * 16) - 8)),
  };

  const SIGN_PAIR_DETAILS = [
    `${userSign} and ${partnerSign} create a dynamic where ${el1.toLowerCase()} energy meets ${el2.toLowerCase()} energy. ${base.desc}`,
    `When ${userSign} connects with ${partnerSign}, the ${el1.toLowerCase()}-${el2.toLowerCase()} interplay creates a rich and layered bond.`,
    `The ${userSign}-${partnerSign} connection is shaped by ${el1.toLowerCase()} meeting ${el2.toLowerCase()} — a pairing that teaches both partners something essential.`,
  ];

  const strengths = [
    `${userSign} brings ${el1 === 'Fire' ? 'passion and initiative' : el1 === 'Earth' ? 'stability and groundedness' : el1 === 'Air' ? 'ideas and communication' : 'emotional depth and intuition'}.`,
    `${partnerSign} contributes ${el2 === 'Fire' ? 'energy and courage' : el2 === 'Earth' ? 'patience and reliability' : el2 === 'Air' ? 'curiosity and adaptability' : 'sensitivity and empathy'}.`,
    'Together, you balance each other in ways neither could achieve alone.',
  ];

  const challenges = [
    el1 === el2 ? 'Too much similarity can lead to stagnation. Seek novelty together.' :
    `${el1} and ${el2} can clash when one moves too fast and the other needs time.`,
    'Respecting each other\'s communication style is critical for long-term harmony.',
  ];

  const advice = [
    'Celebrate your differences as much as your similarities.',
    'Communication is the bridge between your two worlds.',
    'Give each other space to grow independently.',
    'Shared rituals strengthen your bond over time.',
    'When conflict arises, lead with curiosity, not blame.',
  ];

  return {
    userSign, partnerSign, partnerGender,
    userIcon: SIGN_ICONS[userSign], partnerIcon: SIGN_ICONS[partnerSign],
    el1, el2,
    score,
    description: SIGN_PAIR_DETAILS[seededIdx(seed + 'desc', SIGN_PAIR_DETAILS.length)],
    areas,
    strengths,
    challenges,
    advice: advice[seededIdx(seed + 'adv', advice.length)],
  };
}

export const ALL_SIGNS = Object.keys(SIGN_ICONS);

/* ═══════════════════════════════════════════════════════
   4. NUMEROLOGY READING
   ═══════════════════════════════════════════════════════ */
const LP_DATA = {
  1: { title: 'The Leader', desc: 'Independence, ambition, and pioneering spirit define your path.' },
  2: { title: 'The Diplomat', desc: 'Cooperation, sensitivity, and harmony are your gifts.' },
  3: { title: 'The Creative', desc: 'Expression, joy, and artistic vision light your way.' },
  4: { title: 'The Builder', desc: 'Stability, discipline, and hard work are your foundation.' },
  5: { title: 'The Adventurer', desc: 'Freedom, change, and sensory experience drive you forward.' },
  6: { title: 'The Nurturer', desc: 'Love, responsibility, and domestic harmony center your life.' },
  7: { title: 'The Seeker', desc: 'Wisdom, introspection, and spiritual depth define your journey.' },
  8: { title: 'The Powerhouse', desc: 'Achievement, authority, and material mastery are your domain.' },
  9: { title: 'The Humanitarian', desc: 'Compassion, generosity, and global vision guide your soul.' },
  11: { title: 'The Illuminator', desc: 'Spiritual insight, inspiration, and visionary leadership.' },
  22: { title: 'The Master Builder', desc: 'Turning the grandest visions into tangible reality.' },
  33: { title: 'The Master Teacher', desc: 'Selfless service, compassion, and uplifting humanity.' },
};

export function getNumerology(form) {
  const bd = form?.birth_date || '1990-01-01';
  const lp = lifePath(bd);
  const lpInfo = LP_DATA[lp] || LP_DATA[1];

  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
  const personalYear = reduceNumber(lp + reduceNumber(y));
  const personalMonth = reduceNumber(personalYear + m);
  const personalDay = reduceNumber(personalMonth + d);
  const universalDay = reduceNumber(y + m + d);

  // Name numerology
  const name = form?.full_name || 'Unknown';
  const nameValue = name.toUpperCase().split('').reduce((s, c) => {
    const code = c.charCodeAt(0) - 64;
    return s + (code >= 1 && code <= 26 ? code : 0);
  }, 0);
  const expressionNum = reduceNumber(nameValue);

  const seed = todaySeed('numerology', form);
  const rng = seededRandom(seed);
  const luckyNums = [Math.floor(rng() * 50) + 1, Math.floor(rng() * 50) + 1, Math.floor(rng() * 50) + 1].sort((a, b) => a - b);
  const luckyColor = LUCKY_COLORS[Math.floor(rng() * LUCKY_COLORS.length)];

  const dailyMessages = [
    'Your personal day energy favors bold decisions and fresh starts.',
    'Cooperation and listening are your superpowers today.',
    'Creative energy flows freely. Express yourself without reservation.',
    'Build on what you started. Discipline brings breakthroughs.',
    'Embrace change today. What feels uncertain is actually freeing.',
    'Nurture your close relationships. Small acts of love ripple outward.',
    'Turn inward. Meditation and quiet reflection bring answers.',
    'Financial and career energy peaks. Step into your authority.',
    'Let something go. Release creates space for what is coming.',
  ];

  return {
    lifePath: lp,
    lifePathTitle: lpInfo.title,
    lifePathDesc: lpInfo.desc,
    personalYear,
    personalMonth,
    personalDay,
    universalDay,
    expressionNum,
    luckyNumbers: luckyNums,
    luckyColor,
    dailyMessage: dailyMessages[(personalDay - 1) % dailyMessages.length],
  };
}

/* ═══════════════════════════════════════════════════════
   5. BIRTH CHART SUMMARY
   ═══════════════════════════════════════════════════════ */
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const PLANET_SYMBOLS = { Sun:'\u2609', Moon:'\u263D', Mercury:'\u263F', Venus:'\u2640', Mars:'\u2642', Jupiter:'\u2643', Saturn:'\u2644' };
const SIGNS = Object.keys(SIGN_ICONS);
const HOUSES = ['Identity', 'Finances', 'Communication', 'Home', 'Creativity', 'Health', 'Partnerships', 'Transformation', 'Philosophy', 'Career', 'Community', 'Spirituality'];

export function getBirthChart(form) {
  const sunSign = signFromDate(form?.birth_date);
  const seed = `chart-${form?.birth_date || ''}-${form?.birth_time || ''}-${form?.full_name || ''}`;
  const rng = seededRandom(seed);

  const placements = PLANETS.map((p) => {
    const sign = p === 'Sun' ? sunSign : SIGNS[Math.floor(rng() * SIGNS.length)];
    const house = Math.floor(rng() * 12) + 1;
    return {
      planet: p,
      symbol: PLANET_SYMBOLS[p],
      sign,
      signIcon: SIGN_ICONS[sign],
      house,
      houseLabel: HOUSES[house - 1],
    };
  });

  const rising = SIGNS[Math.floor(rng() * SIGNS.length)];
  const dominantElement = SIGN_ELEMENTS[sunSign];

  const summaries = [
    `With ${sunSign} energy at your core, you radiate ${SIGN_ELEMENTS[sunSign].toLowerCase()} qualities. Your chart reveals a soul built for growth and deep experience.`,
    `Your ${sunSign} Sun anchors a chart rich in ${dominantElement.toLowerCase()} energy. The planetary placements suggest a life of purpose, learning, and transformation.`,
    `Born under ${sunSign}, your chart weaves together ambition and intuition. The cosmos shaped you for meaningful impact.`,
  ];

  return {
    sunSign,
    sunIcon: SIGN_ICONS[sunSign],
    rising,
    risingIcon: SIGN_ICONS[rising],
    moonSign: placements.find((p) => p.planet === 'Moon')?.sign || 'Cancer',
    moonIcon: SIGN_ICONS[placements.find((p) => p.planet === 'Moon')?.sign || 'Cancer'],
    placements,
    dominantElement,
    summary: summaries[seededIdx(seed, summaries.length)],
  };
}

/* ═══════════════════════════════════════════════════════
   6. COSMIC ALMANAC (Panchang-style daily info)
   ═══════════════════════════════════════════════════════ */
const MOON_PHASES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
const MOON_ICONS = ['\uD83C\uDF11', '\uD83C\uDF12', '\uD83C\uDF13', '\uD83C\uDF14', '\uD83C\uDF15', '\uD83C\uDF16', '\uD83C\uDF17', '\uD83C\uDF18'];
const PLANETARY_RULERS = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Sun'];
const RULER_SYMBOLS = ['\u263D', '\u2642', '\u263F', '\u2643', '\u2640', '\u2644', '\u2609'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const AUSPICIOUS = [
  'Starting new ventures', 'Financial transactions', 'Spiritual practice', 'Travel',
  'Creative work', 'Learning and study', 'Healing and rest', 'Social gatherings',
  'Signing contracts', 'Planting seeds (literal or figurative)',
];
const CAUTION = [
  'Avoid major confrontations', 'Not ideal for risky investments', 'Delay irreversible decisions',
  'Be mindful of miscommunication', 'Guard against impulsive spending', 'Avoid overcommitting',
];

export function getCosmicAlmanac(form) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const dayName = DAY_NAMES[dayOfWeek];
  const rulerIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sun rules Sunday
  const planetaryRuler = PLANETARY_RULERS[rulerIdx];
  const rulerSymbol = RULER_SYMBOLS[rulerIdx];

  // Approximate moon phase (29.5 day cycle)
  const ref = new Date(2000, 0, 6); // known new moon
  const daysSince = Math.floor((today - ref) / 86400000);
  const lunation = ((daysSince % 29.5) + 29.5) % 29.5;
  const phaseIdx = Math.floor(lunation / 3.69) % 8;

  const seed = todaySeed('almanac', form);
  const rng = seededRandom(seed);

  // Pick 3 auspicious, 2 caution
  const ausp = [];
  const auspCopy = [...AUSPICIOUS];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rng() * auspCopy.length);
    ausp.push(auspCopy.splice(idx, 1)[0]);
  }
  const caut = [];
  const cautCopy = [...CAUTION];
  for (let i = 0; i < 2; i++) {
    const idx = Math.floor(rng() * cautCopy.length);
    caut.push(cautCopy.splice(idx, 1)[0]);
  }

  // Planetary hours (simplified)
  const hourPlanets = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const startIdx = [6, 2, 5, 1, 4, 0, 3][dayOfWeek]; // chaldean order start
  const hours = [];
  for (let i = 0; i < 12; i++) {
    const p = hourPlanets[(startIdx + i) % 7];
    const h = 6 + i; // 6am start
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
    hours.push({ time: label, planet: p, symbol: RULER_SYMBOLS[PLANETARY_RULERS.indexOf(p)] || '\u2726' });
  }

  return {
    date: today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    dayName,
    planetaryRuler,
    rulerSymbol,
    moonPhase: MOON_PHASES[phaseIdx],
    moonIcon: MOON_ICONS[phaseIdx],
    auspicious: ausp,
    caution: caut,
    planetaryHours: hours,
  };
}

/* ═══════════════════════════════════════════════════════
   7. PANCHANG (Hindu Calendar / Daily Vedic Almanac)
   ═══════════════════════════════════════════════════════ */
const TITHIS = [
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima',
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Amavasya',
];
const YOGAS = [
  'Vishkumbha','Preeti','Ayushman','Saubhagya','Shobhana',
  'Atiganda','Sukarma','Dhriti','Shoola','Ganda',
  'Vriddhi','Dhruva','Vyaghata','Harshana','Vajra',
  'Siddhi','Vyatipata','Variyan','Parigha','Shiva',
  'Siddha','Sadhya','Shubha','Shukla','Brahma',
  'Indra','Vaidhriti',
];
const KARANAS = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti','Shakuni','Chatushpada','Naga','Kimstughna'];
const VARAS = [
  { name:'Ravivara',     eng:'Sunday',    lord:'Sun',     symbol:'\u2609' },
  { name:'Somavara',     eng:'Monday',    lord:'Moon',    symbol:'\u263D' },
  { name:'Mangalavara',  eng:'Tuesday',   lord:'Mars',    symbol:'\u2642' },
  { name:'Budhavara',    eng:'Wednesday', lord:'Mercury', symbol:'\u263F' },
  { name:'Guruvara',     eng:'Thursday',  lord:'Jupiter', symbol:'\u2643' },
  { name:'Shukravara',   eng:'Friday',    lord:'Venus',   symbol:'\u2640' },
  { name:'Shanivara',    eng:'Saturday',  lord:'Saturn',  symbol:'\u2644' },
];
const RAHU_KAAL = [
  { start:'4:30 PM', end:'6:00 PM' },
  { start:'7:30 AM', end:'9:00 AM' },
  { start:'3:00 PM', end:'4:30 PM' },
  { start:'12:00 PM', end:'1:30 PM' },
  { start:'1:30 PM', end:'3:00 PM' },
  { start:'10:30 AM', end:'12:00 PM' },
  { start:'9:00 AM', end:'10:30 AM' },
];
const NAKS_PANCHANG = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu',
  'Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta',
  'Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Moola',
  'Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati',
];
const NAK_LORDS = {
  Ashwini:'Ketu', Bharani:'Venus', Krittika:'Sun', Rohini:'Moon',
  Mrigashira:'Mars', Ardra:'Rahu', Punarvasu:'Jupiter', Pushya:'Saturn',
  Ashlesha:'Mercury', Magha:'Ketu', 'Purva Phalguni':'Venus',
  'Uttara Phalguni':'Sun', Hasta:'Moon', Chitra:'Mars', Swati:'Rahu',
  Vishakha:'Jupiter', Anuradha:'Saturn', Jyeshtha:'Mercury', Moola:'Ketu',
  'Purva Ashadha':'Venus', 'Uttara Ashadha':'Sun', Shravana:'Moon',
  Dhanishta:'Mars', Shatabhisha:'Rahu', 'Purva Bhadrapada':'Jupiter',
  'Uttara Bhadrapada':'Saturn', Revati:'Mercury',
};
const PANCH_GOOD = [
  'Starting new ventures','Spiritual practice & meditation','Travel & journeys',
  'Financial investments','Marriage & engagement ceremonies','Housewarming (Griha Pravesh)',
  'Beginning education','Signing contracts','Charity & donations',
  'Starting a business','Buying property','Naming ceremonies',
  'Wearing new clothes or jewelry','Agriculture & planting','Medical treatments',
];
const PANCH_AVOID = [
  'Starting important journeys','Major financial decisions','Signing legal documents',
  'New business launches','Confrontations & arguments','Irreversible commitments',
  'Surgery (unless emergency)','Lending money','Starting construction',
  'Making large purchases','Important meetings','Beginning new relationships',
];
const FESTIVAL_HINTS = [
  'Ekadashi fasting day \u2014 ideal for spiritual observances',
  'Auspicious for Lakshmi Puja \u2014 invite prosperity',
  'Favorable for Ganesha worship \u2014 remove obstacles',
  'Good day for Hanuman Chalisa \u2014 build courage and strength',
  'Shiva worship day \u2014 auspicious for meditation',
  'Favorable for Saraswati Puja \u2014 enhance knowledge',
  'Good day for Durga worship \u2014 cultivate inner power',
  'Auspicious for ancestral prayers (Pitru Tarpan)',
];

export function getPanchang(form) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const vara = VARAS[dayOfWeek];

  const refNewMoon = new Date(2000, 0, 6);
  const daysSince = Math.floor((today - refNewMoon) / 86400000);
  const lunation = ((daysSince % 29.53) + 29.53) % 29.53;
  const tithiIdx = Math.floor(lunation / (29.53 / 30)) % 30;
  const paksha = tithiIdx < 15 ? 'Shukla' : 'Krishna';
  const tithi = TITHIS[tithiIdx];

  const nakIdx = Math.floor(((daysSince % 27.3) + 27.3) % 27.3) % 27;
  const nakshatra = NAKS_PANCHANG[nakIdx];
  const nakshatraLord = NAK_LORDS[nakshatra] || 'Unknown';

  const yogaIdx = Math.floor(((daysSince * 0.97 + 5) % 27 + 27) % 27);
  const yoga = YOGAS[yogaIdx];

  const karanaIdx = Math.floor((lunation / (29.53 / 60)) % 11);
  const karana = KARANAS[karanaIdx];

  const rahuKaal = RAHU_KAAL[dayOfWeek];

  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const sunriseH = 6 + Math.round(Math.cos((dayOfYear - 172) * 2 * Math.PI / 365) * 0.75 * 10) / 10;
  const sunsetH = 18 - Math.round(Math.cos((dayOfYear - 172) * 2 * Math.PI / 365) * 0.75 * 10) / 10;
  const fmtTime = (h) => {
    const hr = Math.floor(h);
    const mn = Math.round((h - hr) * 60);
    const ampm = hr < 12 ? 'AM' : 'PM';
    return `${hr > 12 ? hr - 12 : hr}:${String(mn).padStart(2, '0')} ${ampm}`;
  };

  const seed = todaySeed('panchang', form);
  const rng = seededRandom(seed);

  const goodActivities = [];
  const goodCopy = [...PANCH_GOOD];
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * goodCopy.length);
    goodActivities.push(goodCopy.splice(idx, 1)[0]);
  }
  const avoidActivities = [];
  const avoidCopy = [...PANCH_AVOID];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rng() * avoidCopy.length);
    avoidActivities.push(avoidCopy.splice(idx, 1)[0]);
  }

  const festivalHint = FESTIVAL_HINTS[seededIdx(seed + 'fest', FESTIVAL_HINTS.length)];

  const auspiciousTithis = ['Panchami','Dashami','Ekadashi','Purnima'];
  const inauspiciousTithis = ['Chaturthi','Ashtami','Chaturdashi','Amavasya'];
  const tithiQuality = auspiciousTithis.includes(tithi) ? 'Auspicious'
    : inauspiciousTithis.includes(tithi) ? 'Use Caution' : 'Neutral';

  const phaseIdx = Math.floor(lunation / 3.69) % 8;

  return {
    date: today.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    vara,
    tithi,
    tithiNum: tithiIdx + 1,
    paksha,
    tithiQuality,
    nakshatra,
    nakshatraLord,
    yoga,
    karana,
    moonPhase: MOON_PHASES[phaseIdx],
    moonIcon: MOON_ICONS[phaseIdx],
    rahuKaal,
    sunrise: fmtTime(sunriseH),
    sunset: fmtTime(sunsetH),
    goodActivities,
    avoidActivities,
    festivalHint,
  };
}
