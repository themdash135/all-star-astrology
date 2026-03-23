/**
 * Readings Tab — config-driven quiz data, quick reads, fortune tools, recommendations.
 * All quiz content is defined here so the UI is purely data-driven.
 */

/* ── Quick Reads ── */
export const QUICK_READS = [
  { id: 'daily_insight',    title: 'Daily Insight',     subtitle: 'Your cosmic message',       icon: '\u2729', badge: 'Daily' },
  { id: 'tarot_pull',       title: 'Tarot Pull',        subtitle: 'Reveal your card',          icon: '\u2660', badge: 'Quick' },
  { id: 'numerology_today', title: 'Numerology Today',  subtitle: 'Your number speaks',        icon: '\u0023', badge: 'Daily' },
  { id: 'todays_energy',    title: "Today's Energy",    subtitle: 'Current vibration',         icon: '\u26A1', badge: 'Quick' },
];

/* ── Fortune Tools Grid (interactive reading tools) ── */
export const FORTUNE_TOOLS = [
  { id: 'matchmaking',  title: 'Match Making',       subtitle: 'Love & zodiac compatibility',            glyph: '\u2661' },
  { id: 'tarot',        title: 'Tarot Reading',      subtitle: 'Pull cards and reveal your path',        glyph: '\u2660' },
  { id: 'numerology_r', title: 'Numerology',         subtitle: 'Life path, lucky numbers & timing',      glyph: '\u0023' },
  { id: 'horoscope',    title: 'Horoscope',          subtitle: 'Daily, zodiac, love & Chinese',          glyph: '\u2609' },
  { id: 'panchang',     title: 'Panchang',           subtitle: 'Vedic daily calendar & muhurta',         glyph: '\u0950' },
  { id: 'kundli',       title: 'Kundli',             subtitle: 'Vedic birth chart & life analysis',       glyph: '\u0950' },
];

/* ── Recommendation Map (archetype → suggested fortune tool ids) ── */
export const RECOMMENDATION_MAP = {
  mystic_flame:      ['horoscope', 'tarot', 'panchang'],
  lunar_seer:        ['tarot', 'numerology_r', 'panchang'],
  earth_keeper:      ['matchmaking', 'numerology_r', 'horoscope'],
  radiant_guide:     ['numerology_r', 'horoscope', 'panchang'],
  shadow_listener:   ['tarot', 'matchmaking', 'panchang'],
  cosmic_builder:    ['horoscope', 'numerology_r', 'matchmaking'],
  the_seeker:        ['tarot', 'panchang', 'horoscope'],
  the_builder:       ['numerology_r', 'matchmaking', 'horoscope'],
  the_healer:        ['panchang', 'tarot', 'matchmaking'],
  the_transformer:   ['tarot', 'horoscope', 'numerology_r'],
  the_oracle:        ['tarot', 'panchang', 'matchmaking'],
  the_guardian:      ['matchmaking', 'panchang', 'numerology_r'],
  inner_compass:     ['numerology_r', 'panchang', 'horoscope'],
  magnetic_presence: ['horoscope', 'matchmaking', 'tarot'],
  quiet_wisdom:      ['panchang', 'tarot', 'matchmaking'],
  manifestor_force:  ['numerology_r', 'horoscope', 'matchmaking'],
  deep_intuition:    ['tarot', 'panchang', 'numerology_r'],
  harmonizer:        ['panchang', 'matchmaking', 'horoscope'],
};

/* ── Quizzes ── */
export const QUIZZES = [
  {
    quizId: 'energy_type',
    title: 'Discover Your Energy Type',
    subtitle: 'Reveal your natural energetic signature.',
    durationLabel: '3 min',
    icon: '\u2604',
    gradient: 'linear-gradient(135deg, #7B8CDE 0%, #D4A574 100%)',
    questions: [
      {
        id: 'q1', text: 'How do you tend to experience magic in your life?',
        options: [
          { id: 'a', text: 'Through the beauty and energy of nature',        weights: { earth_keeper: 2, radiant_guide: 1 } },
          { id: 'b', text: 'Through gut feelings and intuitive insights',    weights: { lunar_seer: 2, shadow_listener: 1 } },
          { id: 'c', text: 'Through intentional rituals and practices',      weights: { mystic_flame: 2, cosmic_builder: 1 } },
          { id: 'd', text: 'Through healing and guiding others',             weights: { radiant_guide: 2, earth_keeper: 1 } },
        ],
      },
      {
        id: 'q2', text: 'When do you feel most powerful?',
        options: [
          { id: 'a', text: 'Under the moonlight, in stillness',             weights: { lunar_seer: 2, shadow_listener: 1 } },
          { id: 'b', text: 'When I ignite a room with my energy',           weights: { mystic_flame: 2, radiant_guide: 1 } },
          { id: 'c', text: 'When building something that lasts',            weights: { cosmic_builder: 2, earth_keeper: 1 } },
          { id: 'd', text: 'When nurturing those around me',                weights: { earth_keeper: 2, radiant_guide: 1 } },
        ],
      },
      {
        id: 'q3', text: 'Which element calls to you?',
        options: [
          { id: 'a', text: 'Fire — passion, transformation',                weights: { mystic_flame: 3 } },
          { id: 'b', text: 'Water — depth, emotion, intuition',             weights: { lunar_seer: 3 } },
          { id: 'c', text: 'Earth — stability, abundance, patience',        weights: { earth_keeper: 3 } },
          { id: 'd', text: 'Air — communication, ideas, connection',        weights: { radiant_guide: 2, cosmic_builder: 1 } },
        ],
      },
      {
        id: 'q4', text: 'What time of day resonates most with your spirit?',
        options: [
          { id: 'a', text: 'Dawn — new beginnings',                         weights: { radiant_guide: 2, earth_keeper: 1 } },
          { id: 'b', text: 'Noon — full power and clarity',                 weights: { mystic_flame: 2, cosmic_builder: 1 } },
          { id: 'c', text: 'Dusk — mystery and transition',                 weights: { shadow_listener: 2, lunar_seer: 1 } },
          { id: 'd', text: 'Midnight — silence and revelation',             weights: { lunar_seer: 2, shadow_listener: 1 } },
        ],
      },
      {
        id: 'q5', text: 'How do you handle a challenge?',
        options: [
          { id: 'a', text: 'Confront it head-on with fierce determination', weights: { mystic_flame: 2, cosmic_builder: 1 } },
          { id: 'b', text: 'Sit quietly until the answer reveals itself',   weights: { lunar_seer: 2, shadow_listener: 1 } },
          { id: 'c', text: 'Break it into parts and build a plan',          weights: { cosmic_builder: 2, earth_keeper: 1 } },
          { id: 'd', text: 'Lean on my community for strength',             weights: { radiant_guide: 2, earth_keeper: 1 } },
        ],
      },
      {
        id: 'q6', text: 'What draws you to astrology?',
        options: [
          { id: 'a', text: 'Understanding hidden patterns in my life',      weights: { shadow_listener: 2, lunar_seer: 1 } },
          { id: 'b', text: 'Finding my purpose and direction',              weights: { cosmic_builder: 2, radiant_guide: 1 } },
          { id: 'c', text: 'Connecting with something greater than myself', weights: { earth_keeper: 2, mystic_flame: 1 } },
          { id: 'd', text: 'Helping others find their path',                weights: { radiant_guide: 2, earth_keeper: 1 } },
        ],
      },
      {
        id: 'q7', text: 'In a group, you are usually the one who\u2026',
        options: [
          { id: 'a', text: 'Observes everything from a quiet corner',       weights: { shadow_listener: 2, lunar_seer: 1 } },
          { id: 'b', text: 'Energizes the group with enthusiasm',           weights: { mystic_flame: 2, radiant_guide: 1 } },
          { id: 'c', text: 'Keeps things organized and on track',           weights: { cosmic_builder: 2, earth_keeper: 1 } },
          { id: 'd', text: 'Listens deeply and offers wisdom',              weights: { radiant_guide: 2, lunar_seer: 1 } },
        ],
      },
      {
        id: 'q8', text: 'Which symbol speaks to your soul?',
        options: [
          { id: 'a', text: 'The flame — untamed and bright',                weights: { mystic_flame: 3 } },
          { id: 'b', text: 'The moon — wise and cyclical',                  weights: { lunar_seer: 3 } },
          { id: 'c', text: 'The tree — rooted and growing',                 weights: { earth_keeper: 3 } },
          { id: 'd', text: 'The star — guiding and luminous',               weights: { radiant_guide: 2, cosmic_builder: 1 } },
        ],
      },
    ],
    results: {
      mystic_flame: {
        title: 'Mystic Flame',
        teaser: 'You carry the fire of transformation. Your energy burns bright, catalyzing change in yourself and everyone around you.',
        strengths: ['Passionate intensity', 'Fearless transformation', 'Magnetic willpower'],
        recommendedTools: ['horoscope', 'tarot', 'panchang'],
      },
      lunar_seer: {
        title: 'Lunar Seer',
        teaser: 'You are deeply attuned to emotion, intuition, and hidden currents beneath the surface. The moon is your compass.',
        strengths: ['Intuitive perception', 'Emotional depth', 'Quiet inner knowing'],
        recommendedTools: ['tarot', 'numerology_r', 'panchang'],
      },
      earth_keeper: {
        title: 'Earth Keeper',
        teaser: 'You draw strength from the ground beneath your feet. Stability, patience, and nurturing are your gifts.',
        strengths: ['Grounded resilience', 'Nurturing presence', 'Abundant patience'],
        recommendedTools: ['matchmaking', 'numerology_r', 'horoscope'],
      },
      radiant_guide: {
        title: 'Radiant Guide',
        teaser: 'Others are drawn to your warmth and clarity. You light the way forward with compassion and vision.',
        strengths: ['Natural leadership', 'Compassionate clarity', 'Uplifting energy'],
        recommendedTools: ['numerology_r', 'horoscope', 'panchang'],
      },
      shadow_listener: {
        title: 'Shadow Listener',
        teaser: 'You see what others miss. The hidden, the unspoken, the unseen — these are your realm of power.',
        strengths: ['Pattern recognition', 'Depth perception', 'Fearless truth-seeking'],
        recommendedTools: ['tarot', 'matchmaking', 'panchang'],
      },
      cosmic_builder: {
        title: 'Cosmic Builder',
        teaser: 'You transform vision into reality with patience and precision. The universe channels through your hands.',
        strengths: ['Strategic vision', 'Manifesting ability', 'Unwavering focus'],
        recommendedTools: ['horoscope', 'numerology_r', 'matchmaking'],
      },
    },
  },

  {
    quizId: 'life_path',
    title: 'What Path Are You On?',
    subtitle: 'Uncover your life direction and purpose.',
    durationLabel: '3 min',
    icon: '\u269B',
    gradient: 'linear-gradient(135deg, #5BA89D 0%, #7B8CDE 100%)',
    questions: [
      {
        id: 'q1', text: 'When facing a crossroads, you tend to\u2026',
        options: [
          { id: 'a', text: 'Follow my curiosity into the unknown',          weights: { the_seeker: 2, the_transformer: 1 } },
          { id: 'b', text: 'Choose the option that creates lasting value',   weights: { the_builder: 2, the_guardian: 1 } },
          { id: 'c', text: 'Listen to what my heart says others need',       weights: { the_healer: 2, the_oracle: 1 } },
          { id: 'd', text: 'Seek the path that leads to deeper truth',       weights: { the_oracle: 2, the_seeker: 1 } },
        ],
      },
      {
        id: 'q2', text: 'What gives your life the most meaning?',
        options: [
          { id: 'a', text: 'Exploring new ideas and possibilities',          weights: { the_seeker: 2, the_transformer: 1 } },
          { id: 'b', text: 'Building something that outlasts me',            weights: { the_builder: 2, the_guardian: 1 } },
          { id: 'c', text: 'Healing wounds — my own or others',             weights: { the_healer: 2, the_oracle: 1 } },
          { id: 'd', text: 'Protecting those who cannot protect themselves', weights: { the_guardian: 2, the_builder: 1 } },
        ],
      },
      {
        id: 'q3', text: 'When things fall apart, your instinct is to\u2026',
        options: [
          { id: 'a', text: 'Find the lesson and transform through it',      weights: { the_transformer: 3 } },
          { id: 'b', text: 'Hold steady and rebuild piece by piece',         weights: { the_builder: 2, the_guardian: 1 } },
          { id: 'c', text: 'Feel deeply, then heal what was broken',         weights: { the_healer: 3 } },
          { id: 'd', text: 'Search for the hidden meaning behind it',        weights: { the_oracle: 2, the_seeker: 1 } },
        ],
      },
      {
        id: 'q4', text: 'Which word resonates most right now?',
        options: [
          { id: 'a', text: 'Discovery',                                      weights: { the_seeker: 3 } },
          { id: 'b', text: 'Purpose',                                        weights: { the_builder: 2, the_guardian: 1 } },
          { id: 'c', text: 'Renewal',                                        weights: { the_transformer: 2, the_healer: 1 } },
          { id: 'd', text: 'Wisdom',                                         weights: { the_oracle: 3 } },
        ],
      },
      {
        id: 'q5', text: 'In your ideal life, people know you as\u2026',
        options: [
          { id: 'a', text: 'The adventurer who never stops exploring',       weights: { the_seeker: 2, the_transformer: 1 } },
          { id: 'b', text: 'The rock everyone leans on',                     weights: { the_guardian: 2, the_builder: 1 } },
          { id: 'c', text: 'The one who sees the truth others can\'t',       weights: { the_oracle: 2, the_healer: 1 } },
          { id: 'd', text: 'The person who turns pain into growth',          weights: { the_transformer: 2, the_healer: 1 } },
        ],
      },
      {
        id: 'q6', text: 'How do you relate to change?',
        options: [
          { id: 'a', text: 'I chase it — change is where I come alive',     weights: { the_seeker: 2, the_transformer: 1 } },
          { id: 'b', text: 'I shape it with intention and discipline',       weights: { the_builder: 2, the_guardian: 1 } },
          { id: 'c', text: 'I surrender to it and trust the process',        weights: { the_healer: 2, the_oracle: 1 } },
          { id: 'd', text: 'I stand firm and protect what matters most',     weights: { the_guardian: 3 } },
        ],
      },
      {
        id: 'q7', text: 'What is your relationship with uncertainty?',
        options: [
          { id: 'a', text: 'It excites me — that\'s where truth hides',     weights: { the_seeker: 2, the_oracle: 1 } },
          { id: 'b', text: 'I tolerate it, but prefer a clear plan',        weights: { the_builder: 2, the_guardian: 1 } },
          { id: 'c', text: 'I find peace even in the unknown',              weights: { the_healer: 2, the_transformer: 1 } },
          { id: 'd', text: 'I use it as fuel for reinvention',              weights: { the_transformer: 3 } },
        ],
      },
      {
        id: 'q8', text: 'What season reflects your current chapter?',
        options: [
          { id: 'a', text: 'Spring — beginnings and possibility',           weights: { the_seeker: 2, the_healer: 1 } },
          { id: 'b', text: 'Summer — full energy and creation',             weights: { the_builder: 2, the_transformer: 1 } },
          { id: 'c', text: 'Autumn — harvest and letting go',               weights: { the_transformer: 2, the_oracle: 1 } },
          { id: 'd', text: 'Winter — reflection and deep knowing',          weights: { the_oracle: 2, the_guardian: 1 } },
        ],
      },
    ],
    results: {
      the_seeker: {
        title: 'The Seeker',
        teaser: 'You walk the path of endless discovery. Your spirit is restless in the most beautiful way — always reaching for the next horizon.',
        strengths: ['Boundless curiosity', 'Fearless exploration', 'Open-minded vision'],
        recommendedTools: ['tarot', 'panchang', 'horoscope'],
      },
      the_builder: {
        title: 'The Builder',
        teaser: 'Your path is one of creation and legacy. You shape the world with intention, leaving something real in your wake.',
        strengths: ['Strategic vision', 'Disciplined focus', 'Legacy-driven action'],
        recommendedTools: ['numerology_r', 'matchmaking', 'horoscope'],
      },
      the_healer: {
        title: 'The Healer',
        teaser: 'Your path leads through the wounds of the world. You mend what is broken and bring wholeness wherever you go.',
        strengths: ['Empathic depth', 'Restorative presence', 'Gentle courage'],
        recommendedTools: ['panchang', 'tarot', 'matchmaking'],
      },
      the_transformer: {
        title: 'The Transformer',
        teaser: 'You walk through fire and emerge renewed. Your path is one of constant evolution — nothing stays the same around you.',
        strengths: ['Radical adaptability', 'Alchemical power', 'Fearless rebirth'],
        recommendedTools: ['tarot', 'horoscope', 'numerology_r'],
      },
      the_oracle: {
        title: 'The Oracle',
        teaser: 'Your path is one of deep knowing. Wisdom flows through you like a river — quiet, powerful, and ancient.',
        strengths: ['Prophetic insight', 'Timeless wisdom', 'Unshakable clarity'],
        recommendedTools: ['tarot', 'panchang', 'matchmaking'],
      },
      the_guardian: {
        title: 'The Guardian',
        teaser: 'You stand between chaos and those you love. Your path is one of fierce protection and unwavering duty.',
        strengths: ['Steadfast loyalty', 'Protective strength', 'Moral clarity'],
        recommendedTools: ['matchmaking', 'panchang', 'numerology_r'],
      },
    },
  },

  {
    quizId: 'hidden_strength',
    title: 'Unlock Your Hidden Strength',
    subtitle: 'Discover the power others see in you.',
    durationLabel: '3 min',
    icon: '\u2728',
    gradient: 'linear-gradient(135deg, #D4A574 0%, #F87171 100%)',
    questions: [
      {
        id: 'q1', text: 'When life gets hard, you\u2026',
        options: [
          { id: 'a', text: 'Go inward and trust my instincts',              weights: { deep_intuition: 2, quiet_wisdom: 1 } },
          { id: 'b', text: 'Rally the people around me',                    weights: { magnetic_presence: 2, harmonizer: 1 } },
          { id: 'c', text: 'Push through with sheer willpower',             weights: { manifestor_force: 2, inner_compass: 1 } },
          { id: 'd', text: 'Find the calm center and wait',                 weights: { quiet_wisdom: 2, deep_intuition: 1 } },
        ],
      },
      {
        id: 'q2', text: 'Others often say you have a gift for\u2026',
        options: [
          { id: 'a', text: 'Knowing what people need before they say it',   weights: { deep_intuition: 2, harmonizer: 1 } },
          { id: 'b', text: 'Making everyone feel welcome and seen',         weights: { harmonizer: 2, magnetic_presence: 1 } },
          { id: 'c', text: 'Turning dreams into reality',                   weights: { manifestor_force: 2, inner_compass: 1 } },
          { id: 'd', text: 'Staying calm when chaos erupts',                weights: { quiet_wisdom: 2, inner_compass: 1 } },
        ],
      },
      {
        id: 'q3', text: 'What form of power feels most natural to you?',
        options: [
          { id: 'a', text: 'Knowing the right direction without a map',     weights: { inner_compass: 3 } },
          { id: 'b', text: 'Drawing people in and inspiring them',          weights: { magnetic_presence: 3 } },
          { id: 'c', text: 'Seeing beneath the surface of things',          weights: { deep_intuition: 2, quiet_wisdom: 1 } },
          { id: 'd', text: 'Bringing peace to conflict',                    weights: { harmonizer: 3 } },
        ],
      },
      {
        id: 'q4', text: 'After recovering from difficulty, you usually feel\u2026',
        options: [
          { id: 'a', text: 'Sharper and more decisive than before',         weights: { inner_compass: 2, manifestor_force: 1 } },
          { id: 'b', text: 'More connected to my deeper self',              weights: { deep_intuition: 2, quiet_wisdom: 1 } },
          { id: 'c', text: 'Grateful and ready to help others',             weights: { harmonizer: 2, magnetic_presence: 1 } },
          { id: 'd', text: 'Stronger, like nothing can stop me',            weights: { manifestor_force: 3 } },
        ],
      },
      {
        id: 'q5', text: 'Which phrase feels truest about you?',
        options: [
          { id: 'a', text: '"I know things before I can explain them"',     weights: { deep_intuition: 3 } },
          { id: 'b', text: '"People feel different around me"',             weights: { magnetic_presence: 2, harmonizer: 1 } },
          { id: 'c', text: '"I always find a way"',                         weights: { manifestor_force: 2, inner_compass: 1 } },
          { id: 'd', text: '"I see things others overlook"',                weights: { quiet_wisdom: 3 } },
        ],
      },
      {
        id: 'q6', text: 'When you walk into a room, you tend to\u2026',
        options: [
          { id: 'a', text: 'Read the energy immediately',                   weights: { deep_intuition: 2, quiet_wisdom: 1 } },
          { id: 'b', text: 'Become the center of attention naturally',      weights: { magnetic_presence: 3 } },
          { id: 'c', text: 'Quietly assess and find my place',              weights: { inner_compass: 2, quiet_wisdom: 1 } },
          { id: 'd', text: 'Make sure everyone feels comfortable',          weights: { harmonizer: 2, magnetic_presence: 1 } },
        ],
      },
      {
        id: 'q7', text: 'Your greatest strength is probably\u2026',
        options: [
          { id: 'a', text: 'My inner compass — I always find north',        weights: { inner_compass: 3 } },
          { id: 'b', text: 'My presence — people remember meeting me',      weights: { magnetic_presence: 2, manifestor_force: 1 } },
          { id: 'c', text: 'My patience — I outlast every storm',           weights: { quiet_wisdom: 2, harmonizer: 1 } },
          { id: 'd', text: 'My drive — I make things happen',               weights: { manifestor_force: 3 } },
        ],
      },
      {
        id: 'q8', text: 'If you could master one ability, it would be\u2026',
        options: [
          { id: 'a', text: 'Reading anyone\u2019s true intentions',         weights: { deep_intuition: 2, quiet_wisdom: 1 } },
          { id: 'b', text: 'Manifesting anything I set my mind to',         weights: { manifestor_force: 2, inner_compass: 1 } },
          { id: 'c', text: 'Healing any relationship or conflict',          weights: { harmonizer: 3 } },
          { id: 'd', text: 'Always knowing the right path forward',         weights: { inner_compass: 2, quiet_wisdom: 1 } },
        ],
      },
    ],
    results: {
      inner_compass: {
        title: 'Inner Compass',
        teaser: 'Your hidden strength is an unfailing sense of direction. Even when the world is lost, you know the way.',
        strengths: ['Unerring instinct', 'Self-trust under pressure', 'Natural navigation'],
        recommendedTools: ['numerology_r', 'panchang', 'horoscope'],
      },
      magnetic_presence: {
        title: 'Magnetic Presence',
        teaser: 'You carry an energy that draws people in without effort. Your presence changes rooms and opens doors.',
        strengths: ['Natural charisma', 'Inspiring aura', 'Effortless influence'],
        recommendedTools: ['horoscope', 'matchmaking', 'tarot'],
      },
      quiet_wisdom: {
        title: 'Quiet Wisdom',
        teaser: 'Your power lies in what you see that others don\'t. You are the still water that runs deep.',
        strengths: ['Observational mastery', 'Patient insight', 'Timeless perspective'],
        recommendedTools: ['panchang', 'tarot', 'matchmaking'],
      },
      manifestor_force: {
        title: 'Manifestor Force',
        teaser: 'When you decide something will happen, the universe moves. Your willpower is your greatest gift.',
        strengths: ['Unstoppable drive', 'Reality-bending focus', 'Iron determination'],
        recommendedTools: ['numerology_r', 'horoscope', 'matchmaking'],
      },
      deep_intuition: {
        title: 'Deep Intuition',
        teaser: 'You feel truths before they surface. Your intuition is a sixth sense that has never failed you.',
        strengths: ['Psychic sensitivity', 'Emotional intelligence', 'Precognitive instinct'],
        recommendedTools: ['tarot', 'panchang', 'numerology_r'],
      },
      harmonizer: {
        title: 'Harmonizer',
        teaser: 'You are the bridge between opposing forces. Where there is conflict, you bring balance and peace.',
        strengths: ['Diplomatic grace', 'Unifying energy', 'Emotional equilibrium'],
        recommendedTools: ['panchang', 'matchmaking', 'horoscope'],
      },
    },
  },
];

/* ── Quick Read Content Generator ── */
const TAROT_CARDS = [
  { name: 'The Fool',          meaning: 'New beginnings, spontaneity, and a leap of faith await you.' },
  { name: 'The Magician',      meaning: 'You have all the tools you need. Channel your will into action.' },
  { name: 'The High Priestess',meaning: 'Trust your intuition. The answers lie within, not without.' },
  { name: 'The Empress',       meaning: 'Abundance and creative energy flow toward you today.' },
  { name: 'The Emperor',       meaning: 'Structure and authority serve you well. Lead with confidence.' },
  { name: 'The Hierophant',    meaning: 'Seek wisdom in tradition. A teacher or guide appears.' },
  { name: 'The Lovers',        meaning: 'A meaningful choice in love or values presents itself.' },
  { name: 'The Chariot',       meaning: 'Willpower and determination carry you to victory.' },
  { name: 'Strength',          meaning: 'Quiet courage and inner resolve will see you through.' },
  { name: 'The Hermit',        meaning: 'Solitude brings clarity. Retreat to find your truth.' },
  { name: 'Wheel of Fortune',  meaning: 'Fate turns in your favor. Embrace the change.' },
  { name: 'Justice',           meaning: 'Fairness prevails. What you put out returns to you.' },
  { name: 'The Hanged Man',    meaning: 'Pause and surrender. A new perspective is forming.' },
  { name: 'Death',             meaning: 'An ending clears the way for powerful transformation.' },
  { name: 'Temperance',        meaning: 'Balance and patience bring the harmony you seek.' },
  { name: 'The Tower',         meaning: 'A sudden shift clears what no longer serves you.' },
  { name: 'The Star',          meaning: 'Hope and healing pour down upon you. Wish boldly.' },
  { name: 'The Moon',          meaning: 'Trust the mystery. Not everything is as it seems.' },
  { name: 'The Sun',           meaning: 'Joy, success, and radiant energy surround you today.' },
  { name: 'Judgement',         meaning: 'A moment of reckoning and rebirth is here.' },
  { name: 'The World',         meaning: 'Completion, fulfillment, and a new cycle dawning.' },
];

const DAILY_INSIGHTS = [
  'The stars align in your favor today. Trust the process and let your inner light guide you.',
  'A quiet moment of reflection will reveal something important about your next step.',
  'Your energy is magnetic today. Others will be drawn to your warmth and clarity.',
  'The universe is rearranging things in your favor. What feels like chaos is actually alignment.',
  'Pay attention to synchronicities today — they are messages from the cosmos.',
  'Your intuition is especially sharp right now. Trust what you feel, even if you can\'t explain it.',
  'Today carries the energy of new beginnings. Plant a seed of intention.',
  'A challenge today is actually a doorway. Walk through it with courage.',
  'The moon whispers that rest and receptivity will serve you better than action today.',
  'Your soul is calling you toward something bigger. Listen carefully.',
];

const ENERGY_TYPES = [
  { type: 'Creative Fire',    desc: 'Your creative channels are wide open. Express, build, and make today.' },
  { type: 'Grounded Earth',   desc: 'Stability and patience are your superpowers right now. Stay rooted.' },
  { type: 'Flowing Water',    desc: 'Go with the flow today. Adaptability is your greatest asset.' },
  { type: 'Swift Air',        desc: 'Communication and connection flow easily. Share your ideas freely.' },
  { type: 'Electric Storm',   desc: 'High energy and sudden insight mark this day. Channel it wisely.' },
  { type: 'Gentle Moon',      desc: 'Nurturing energy surrounds you. Care for yourself and others.' },
  { type: 'Golden Sun',       desc: 'Confidence and warmth radiate from you. Step into the spotlight.' },
];

function seededIdx(seed, len) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return ((h % len) + len) % len;
}

export function getQuickReadContent(readId, form) {
  const today = new Date();
  const seed = `${readId}-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${form?.birth_date || ''}`;

  switch (readId) {
    case 'daily_insight': {
      const idx = seededIdx(seed, DAILY_INSIGHTS.length);
      return { title: 'Daily Insight', body: DAILY_INSIGHTS[idx] };
    }
    case 'tarot_pull': {
      const idx = seededIdx(seed, TAROT_CARDS.length);
      const card = TAROT_CARDS[idx];
      return { title: card.name, body: card.meaning, extra: `Card ${idx + 1} of 21` };
    }
    case 'numerology_today': {
      const dayNum = ((today.getDate() + today.getMonth() + 1 + today.getFullYear()) % 9) + 1;
      const msgs = [
        'Leadership and new beginnings.',
        'Partnership and cooperation.',
        'Expression and creativity.',
        'Structure and foundation.',
        'Change and freedom.',
        'Responsibility and love.',
        'Reflection and inner wisdom.',
        'Abundance and power.',
        'Completion and release.',
      ];
      return { title: `Universal Day ${dayNum}`, body: msgs[dayNum - 1], extra: `Number vibration: ${dayNum}` };
    }
    case 'todays_energy': {
      const idx = seededIdx(seed, ENERGY_TYPES.length);
      const e = ENERGY_TYPES[idx];
      return { title: e.type, body: e.desc };
    }
    default:
      return { title: 'Reading', body: 'Content coming soon.' };
  }
}
