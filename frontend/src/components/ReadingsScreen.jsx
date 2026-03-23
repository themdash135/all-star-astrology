import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { QUIZZES, QUICK_READS, FORTUNE_TOOLS, getQuickReadContent } from '../app/readings-config.js';
import { getDailyHoroscope, getZodiacProfile, getChineseHoroscope, getYearlyHoroscope, getSignCompatibility, ALL_SIGNS, getTarotReading, getNumerology, getPanchang } from '../app/fortune-tools-engine.js';
import { getKundliBirthDetails, getKundliChart, getKundliPlanets, getKundliFavorable, getKundliDasha, getKundliLifeReport, getKundliDosha, getKundliRemedies, getKundliNakshatra, getKundliBiorhythm } from '../app/kundli-engine.js';
import { getFullCompatibility } from '../app/matchmaking-engine.js';
import { signFromDate } from '../app/games-engine.js';
import { safeGet, safeSet } from '../app/storage.js';
import { IconBack } from './common.jsx';

const QUIZ_RESULTS_KEY = 'allstar-quiz-results';

function useScrollTop() {
  useEffect(() => {
    const el = document.querySelector('.scroll-area');
    if (el) el.scrollTop = 0;
  }, []);
}

function loadQuizResults() {
  try { return JSON.parse(safeGet(QUIZ_RESULTS_KEY) || '{}'); } catch { return {}; }
}
function saveQuizResult(quizId, archetype) {
  const all = loadQuizResults();
  all[quizId] = archetype;
  safeSet(QUIZ_RESULTS_KEY, JSON.stringify(all));
}

/* ═══════════════════════════════════════════════════════
   ReadingsScreen — main export
   ═══════════════════════════════════════════════════════ */
export function ReadingsScreen({ form, onSystemTap }) {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeRead, setActiveRead] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [quizResults, setQuizResults] = useState(loadQuizResults);

  if (activeQuiz) {
    return (
      <QuizFlow
        quiz={activeQuiz}
        onBack={() => setActiveQuiz(null)}
        onComplete={(archetype) => {
          saveQuizResult(activeQuiz.quizId, archetype);
          setQuizResults((prev) => ({ ...prev, [activeQuiz.quizId]: archetype }));
        }}
      />
    );
  }

  if (activeRead) {
    return <QuickReadDetail readId={activeRead} form={form} onBack={() => setActiveRead(null)} />;
  }

  if (activeTool) {
    return <FortuneToolDetail toolId={activeTool} form={form} onBack={() => setActiveTool(null)} />;
  }

  return (
    <div className="rdg-page fade-in">
      {/* Hero Quizzes */}
      <section className="rdg-section rdg-hero">
        <h2 className="rdg-section-title serif">Personalized Quizzes</h2>
        <p className="rdg-section-sub">Discover who you truly are</p>
        <div className="rdg-quiz-stack">
          {QUIZZES.map((q, i) => {
            const done = !!quizResults[q.quizId];
            const result = done ? q.results[quizResults[q.quizId]] : null;
            return (
              <button
                type="button"
                key={q.quizId}
                className={`rdg-quiz-card${done ? ' rdg-quiz-card--done' : ''}`}
                style={{ '--q-grad': q.gradient, animationDelay: `${i * 0.1}s` }}
                onClick={() => setActiveQuiz(q)}
              >
                <div className="rdg-quiz-shimmer" />
                <div className="rdg-quiz-content">
                  <span className="rdg-quiz-icon">{q.icon}</span>
                  <div className="rdg-quiz-text">
                    <span className="rdg-quiz-title serif">{q.title}</span>
                    <span className="rdg-quiz-sub">{done ? `You are: ${result?.title}` : q.subtitle}</span>
                  </div>
                  <div className="rdg-quiz-meta">
                    <span className="rdg-quiz-dur">{q.durationLabel}</span>
                    <span className="rdg-quiz-cta">{done ? 'Retake' : 'Start'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Reads */}
      <section className="rdg-section">
        <h2 className="rdg-section-title serif">Quick Reads</h2>
        <p className="rdg-section-sub">Daily insights in seconds</p>
        <div className="rdg-qr-row">
          {QUICK_READS.map((qr, i) => (
            <button
              type="button"
              key={qr.id}
              className="rdg-qr-card"
              style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              onClick={() => setActiveRead(qr.id)}
            >
              <span className="rdg-qr-badge">{qr.badge}</span>
              <span className="rdg-qr-icon">{qr.icon}</span>
              <span className="rdg-qr-title">{qr.title}</span>
              <span className="rdg-qr-sub">{qr.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Fortune Tools — 3-col grid like reference app */}
      <section className="rdg-section">
        <h2 className="rdg-section-title serif">Fortune-Telling Tools</h2>
        <p className="rdg-section-sub">Interactive readings and insights</p>
        <div className="rdg-tools-grid">
          {FORTUNE_TOOLS.map((t, i) => (
            <button
              type="button"
              key={t.id}
              className="rdg-tool-card"
              style={{ animationDelay: `${0.5 + i * 0.06}s` }}
              onClick={() => setActiveTool(t.id)}
            >
              <span className="rdg-tool-glyph">{t.glyph}</span>
              <span className="rdg-tool-title">{t.title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <Recommendations quizResults={quizResults} onToolTap={setActiveTool} />

      <div style={{ height: 32 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Recommendations strip
   ═══════════════════════════════════════════════════════ */
function Recommendations({ quizResults, onToolTap }) {
  const recs = useMemo(() => {
    const items = [];
    const seen = new Set();
    for (const quiz of QUIZZES) {
      const archetype = quizResults[quiz.quizId];
      if (!archetype) continue;
      const res = quiz.results[archetype];
      if (!res?.recommendedTools) continue;
      for (const toolId of res.recommendedTools) {
        if (seen.has(toolId)) continue;
        seen.add(toolId);
        const tool = FORTUNE_TOOLS.find((t) => t.id === toolId);
        if (tool) items.push({ ...tool, reason: `Based on your ${res.title} result` });
      }
    }
    return items.slice(0, 4);
  }, [quizResults]);

  if (recs.length === 0) return null;

  return (
    <section className="rdg-section rdg-recs fade-in">
      <h2 className="rdg-section-title serif">Recommended for You</h2>
      <div className="rdg-recs-row">
        {recs.map((r) => (
          <button type="button" key={r.id} className="rdg-rec-card" onClick={() => onToolTap?.(r.id)}>
            <span className="rdg-rec-glyph">{r.glyph}</span>
            <span className="rdg-rec-title">{r.title}</span>
            <span className="rdg-rec-reason">{r.reason}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Quick Read Detail
   ═══════════════════════════════════════════════════════ */
function QuickReadDetail({ readId, form, onBack }) {
  useScrollTop();
  const content = useMemo(() => getQuickReadContent(readId, form), [readId, form]);
  const meta = QUICK_READS.find((q) => q.id === readId);

  return (
    <div className="rdg-read-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="rdg-read-card glass">
        <span className="rdg-read-icon">{meta?.icon}</span>
        <h2 className="rdg-read-title serif">{content.title}</h2>
        {content.extra && <span className="rdg-read-extra">{content.extra}</span>}
        <p className="rdg-read-body">{content.body}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Fortune Tool Detail — dispatches to the right tool view
   ═══════════════════════════════════════════════════════ */
function FortuneToolDetail({ toolId, form, onBack }) {
  switch (toolId) {
    case 'matchmaking':  return <MatchMakingView form={form} onBack={onBack} />;
    case 'horoscope':    return <HoroscopeView form={form} onBack={onBack} />;
    case 'tarot':        return <TarotView form={form} onBack={onBack} />;
    case 'numerology_r': return <NumerologyView form={form} onBack={onBack} />;
    case 'panchang':     return <PanchangView form={form} onBack={onBack} />;
    case 'kundli':       return <KundliView form={form} onBack={onBack} />;
    default:             return <div className="ft-page fade-in"><button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button><p className="empty-msg">Coming soon.</p></div>;
  }
}

/* ── Horoscope ── */
function HoroscopeView({ form, onBack }) {
  useScrollTop();
  const [subPage, setSubPage] = useState(null);

  const HORO_ITEMS = [
    { id: 'daily',       label: 'Daily Horoscope',    icon: '\u2609', chevron: true },
    { id: 'zodiac',      label: 'Zodiac Sign',        icon: '\u2648', chevron: true },
    { id: 'love_compat', label: 'Love Compatibility', icon: '\u2661', chevron: true },
    { id: 'chinese',     label: 'Chinese Horoscope',  icon: '\uD83D\uDC09', chevron: true },
    { id: 'yearly',      label: 'Horoscope 2026',     icon: '\u2605', chevron: true },
  ];

  if (subPage === 'daily')       return <DailyHoroscopePage form={form} onBack={() => setSubPage(null)} />;
  if (subPage === 'zodiac')      return <ZodiacSignPage form={form} onBack={() => setSubPage(null)} />;
  if (subPage === 'love_compat') return <MatchMakingView form={form} onBack={() => setSubPage(null)} />;
  if (subPage === 'chinese')     return <ChineseHoroscopePage form={form} onBack={() => setSubPage(null)} />;
  if (subPage === 'yearly')      return <YearlyHoroscopePage form={form} onBack={() => setSubPage(null)} />;

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Horoscope</h1>
      <div className="ft-menu">
        {HORO_ITEMS.map((item) => (
          <button type="button" key={item.id} className="ft-menu-row" onClick={() => setSubPage(item.id)}>
            <span className="ft-menu-icon">{item.icon}</span>
            <span className="ft-menu-label">{item.label}</span>
            <span className="ft-menu-chevron">{'\u203A'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Daily Horoscope (auto-shows sign, 5 areas) ── */
function DailyHoroscopePage({ form, onBack }) {
  useScrollTop();
  const data = useMemo(() => getDailyHoroscope(form), [form]);

  const AREA_ICONS = { general: '\u2609', love: '\u2661', career: '\u2605', finance: '\u25C6', wellness: '\u2726' };
  const areas = [
    { key: 'general',  label: 'General' },
    { key: 'love',     label: 'Love' },
    { key: 'career',   label: 'Career' },
    { key: 'finance',  label: 'Finance' },
    { key: 'wellness', label: 'Wellness' },
  ];

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="ft-hero">
        <span className="ft-hero-icon">{data.icon}</span>
        <h1 className="ft-hero-title serif">{data.sign}</h1>
        <p className="ft-hero-sub">{data.element} Element {'\u00B7'} Today's Score</p>
      </div>
      <div className="ft-score-ring">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold)" strokeWidth="6"
            strokeDasharray={`${data.overallScore * 2.64} 264`} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
        </svg>
        <span className="ft-score-val serif">{data.overallScore}%</span>
      </div>

      <div className="ft-areas">
        {areas.map(({ key, label }) => (
          <div key={key} className="ft-area-row">
            <span className="ft-area-icon-label">
              <span className="ft-area-icon">{AREA_ICONS[key]}</span>
              <span className="ft-area-label">{label}</span>
            </span>
            <span className="ft-area-val">{data[key]}</span>
          </div>
        ))}
      </div>

      <div className="ft-lucky-grid">
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Colors</span><span className="ft-lucky-val">{data.luckyColors.join(', ')}</span></div>
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Gemstone</span><span className="ft-lucky-val">{data.luckyGem}</span></div>
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Day</span><span className="ft-lucky-val">{data.luckyDay}</span></div>
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Numbers</span><span className="ft-lucky-val">{data.luckyNumbers.join(', ')}</span></div>
      </div>
    </div>
  );
}

/* ── Zodiac Sign Profile (auto-shows user's sign with detail tabs) ── */
function ZodiacSignPage({ form, onBack }) {
  useScrollTop();
  const data = useMemo(() => getZodiacProfile(form), [form]);
  const [tab, setTab] = useState('personality');

  const tabs = [
    { id: 'personality',  label: 'Personality' },
    { id: 'professional', label: 'Professional' },
    { id: 'lover',        label: 'Lover' },
    { id: 'teen',         label: 'Teen' },
  ];

  const tabContent = {
    personality: data.personality,
    professional: data.professional,
    lover: data.lover,
    teen: data.teen,
  };

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="ft-hero">
        <span className="ft-hero-icon">{data.icon}</span>
        <h1 className="ft-hero-title serif">{data.sign}</h1>
        <p className="ft-hero-sub">{data.dates} {'\u00B7'} {data.element} {'\u00B7'} {data.ruler}</p>
      </div>

      <div className="ft-traits">
        {data.traits.map((t) => (
          <span key={t} className="ft-trait-pill">{t}</span>
        ))}
      </div>

      <div className="ft-lucky-grid">
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Colors</span><span className="ft-lucky-val">{data.luckyColors?.join(', ')}</span></div>
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Numbers</span><span className="ft-lucky-val">{data.luckyNums?.join(', ')}</span></div>
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Gemstone</span><span className="ft-lucky-val">{data.luckyGem}</span></div>
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Days</span><span className="ft-lucky-val">{data.luckyDays?.join(', ')}</span></div>
      </div>

      <div className="ft-zodiac-tabs">
        {tabs.map((t) => (
          <button type="button" key={t.id} className={`ft-zodiac-tab${tab === t.id ? ' ft-zodiac-tab--on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="ft-body fade-in" key={tab}>
        <p className="ft-reading-text">{tabContent[tab]}</p>
      </div>
    </div>
  );
}

/* ── Chinese Horoscope ── */
function ChineseHoroscopePage({ form, onBack }) {
  useScrollTop();
  const data = useMemo(() => getChineseHoroscope(form), [form]);
  const [yearTab, setYearTab] = useState('thisYear');

  const sections = [
    { key: 'qualities', label: 'Qualities', icon: '\u2728' },
    { key: 'relationships', label: 'Relationships', icon: '\u2764\uFE0F' },
    { key: 'career', label: 'Career', icon: '\uD83D\uDCBC' },
    { key: 'finance', label: 'Finance', icon: '\uD83D\uDCB0' },
    { key: 'luck_guidance', label: 'Luck & Guidance', icon: '\uD83C\uDF1F' },
  ];

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="ft-hero">
        <span className="ft-hero-icon">{data.emoji}</span>
        <h1 className="ft-hero-title serif">{data.element} {data.animal}</h1>
        <p className="ft-hero-sub">Born {data.year}</p>
      </div>

      <div className="ft-traits">
        {data.traits.map((t) => (
          <span key={t} className="ft-trait-pill">{t}</span>
        ))}
      </div>

      <p className="ft-reading-text">{data.desc}</p>

      {/* Last Year / This Year tabs */}
      <div className="ft-tabs" style={{ marginTop: 16 }}>
        <button type="button" className={`ft-tab${yearTab === 'lastYear' ? ' ft-tab--on' : ''}`} onClick={() => setYearTab('lastYear')}>
          Last Year (2025)
        </button>
        <button type="button" className={`ft-tab${yearTab === 'thisYear' ? ' ft-tab--on' : ''}`} onClick={() => setYearTab('thisYear')}>
          This Year (2026)
        </button>
      </div>

      <div className="ft-cn-section-card" style={{ marginTop: 12 }}>
        <p className="ft-cn-section-text">{yearTab === 'lastYear' ? data.lastYear : data.thisYear}</p>
      </div>

      {/* The (Animal) Sign — detailed sections */}
      <h2 className="ft-sub-title serif" style={{ marginTop: 20 }}>The {data.animal} Sign</h2>

      {sections.map((s) => (
        <div key={s.key} className="ft-cn-section-card">
          <h3 className="ft-cn-section-title">{s.icon} {s.label}</h3>
          <p className="ft-cn-section-text">{data[s.key]}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Horoscope 2026 ── */
function YearlyHoroscopePage({ form, onBack }) {
  useScrollTop();
  const data = useMemo(() => getYearlyHoroscope(form), [form]);

  const sections = [
    { key: 'overview', label: `What's in Store for ${data.sign} in 2026`, icon: '\u2B50' },
    { key: 'career', label: 'Career & Professional Life', icon: '\uD83D\uDCBC' },
    { key: 'finance', label: 'Finance & Wealth', icon: '\uD83D\uDCB0' },
    { key: 'family', label: 'Family Life', icon: '\uD83C\uDFE0' },
    { key: 'transits', label: 'Major Planetary Transits', icon: '\uD83E\uDE90' },
  ];

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="ft-hero">
        <span className="ft-hero-icon">{data.icon}</span>
        <h1 className="ft-hero-title serif">{data.sign} in 2026</h1>
        <p className="ft-hero-sub">Your Yearly Forecast</p>
      </div>

      {sections.map((s) => (
        <div key={s.key} className="ft-year-section">
          <h3 className="ft-year-section-title">{s.icon} {s.label}</h3>
          <p className="ft-year-section-text">{data[s.key]}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Tarot ── */
const TAROT_SPREADS = [
  { id: 'one', label: 'One Card Reading', icon: '\uD83C\uDCCF', desc: 'A single card answer to your question' },
  { id: 'three', label: 'Three Card Reading', icon: '\uD83C\uDCA1', desc: 'Past, Present & Future' },
  { id: 'love', label: 'Love Tarot', icon: '\u2764\uFE0F', desc: 'You, Your Partner & The Connection' },
  { id: 'wellness', label: 'Wellness Tarot', icon: '\uD83C\uDF3F', desc: 'Body, Mind & Spirit' },
  { id: 'mind', label: 'State of Mind', icon: '\uD83E\uDDE0', desc: 'Conscious, Subconscious & Guidance' },
];

function TarotView({ form, onBack }) {
  useScrollTop();
  const [spread, setSpread] = useState(null);

  if (!spread) {
    return (
      <div className="ft-page fade-in">
        <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
        <h1 className="ft-title serif">Tarot Reading</h1>
        <p className="ft-hero-sub" style={{ marginBottom: 12 }}>Choose your reading</p>
        <div className="ft-menu">
          {TAROT_SPREADS.map((s) => (
            <button type="button" key={s.id} className="ft-menu-row" onClick={() => setSpread(s.id)}>
              <span className="ft-menu-icon">{s.icon}</span>
              <div style={{ flex: 1 }}>
                <span className="ft-menu-label">{s.label}</span>
                <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', marginTop: 2 }}>{s.desc}</span>
              </div>
              <span className="ft-menu-chevron">{'\u203A'}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (spread === 'one') {
    return <SingleCardReading form={form} onBack={() => setSpread(null)} />;
  }

  return <ThreeCardReading form={form} spreadType={spread} onBack={() => setSpread(null)} />;
}

/* Single Card — tap to flip, then "Show My Reading" */
function SingleCardReading({ form, onBack }) {
  useScrollTop();
  const data = useMemo(() => getTarotReading(form, 'one'), [form]);
  const card = data.cards[0];
  const [flipped, setFlipped] = useState(false);
  const [showReading, setShowReading] = useState(false);

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">One Card Reading</h1>

      {!showReading ? (
        <>
          <p className="ft-hero-sub" style={{ textAlign: 'center', margin: '16px 0' }}>
            {flipped ? `You drew: ${card.name}` : 'Focus on your question, then tap the card'}
          </p>

          <div className="ft-flip-container" onClick={() => { if (!flipped) setFlipped(true); }}>
            <div className={`ft-flip-inner${flipped ? ' ft-flipped' : ''}`}>
              <div className="ft-flip-front">
                <div className="ft-card-back">
                  <span className="ft-card-back-star">{'\u2726'}</span>
                  <span className="ft-card-back-label serif">Tap to Reveal</span>
                </div>
              </div>
              <div className="ft-flip-back">
                <div className="ft-tarot-card glass" style={{ margin: 0, width: '100%' }}>
                  <span className={`ft-tarot-glyph${card.isReversed ? ' ft-tarot-reversed' : ''}`}>{'\u2660'}</span>
                  <span className="ft-tarot-name serif">{card.name}</span>
                  <span className="ft-tarot-orient">{card.orientation}</span>
                  <p className="ft-tarot-meaning">{card.meaning}</p>
                </div>
              </div>
            </div>
          </div>

          {flipped && (
            <button type="button" className="ft-action-btn" style={{ marginTop: 20 }} onClick={() => setShowReading(true)}>
              Show My Reading
            </button>
          )}
        </>
      ) : (
        <div className="fade-in">
          <div className="ft-tarot-card glass" style={{ marginBottom: 16 }}>
            <span className={`ft-tarot-glyph${card.isReversed ? ' ft-tarot-reversed' : ''}`}>{'\u2660'}</span>
            <span className="ft-tarot-name serif">{card.name}</span>
            <span className="ft-tarot-orient">{card.orientation}</span>
          </div>

          <h3 className="ft-sub-title serif">Your Reading</h3>
          {card.detailedReading.split('\n').filter(Boolean).map((p, i) => (
            <p key={i} className="ft-reading-text">{p}</p>
          ))}

          <div className="ft-summary glass" style={{ marginTop: 16 }}>
            <h3 className="ft-summary-title serif">Summary</h3>
            <p className="ft-summary-text">{data.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* Three Card — question input, sequential card reveals (used for three, love, wellness, mind) */
function ThreeCardReading({ form, spreadType = 'three', onBack }) {
  useScrollTop();
  const [question, setQuestion] = useState('');
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState([false, false, false]);
  const [showFull, setShowFull] = useState(false);
  const data = useMemo(() => getTarotReading(form, spreadType), [form, spreadType]);
  const spreadInfo = TAROT_SPREADS.find((s) => s.id === spreadType);
  const allRevealed = revealed.every(Boolean);

  function revealNext() {
    const idx = revealed.indexOf(false);
    if (idx === -1) return;
    setRevealed((prev) => { const next = [...prev]; next[idx] = true; return next; });
  }

  if (!started) {
    return (
      <div className="ft-page fade-in">
        <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
        <h1 className="ft-title serif">{spreadInfo?.label || 'Card Reading'}</h1>
        <p className="ft-hero-sub" style={{ margin: '12px 0' }}>{spreadInfo?.desc}</p>
        <h3 className="ft-sub-title serif">What is your question?</h3>
        <textarea className="ft-input" rows={3} placeholder="Type your question here..." value={question}
          onChange={(e) => setQuestion(e.target.value)} style={{ width: '100%', resize: 'none', marginBottom: 12 }} />
        <button type="button" className="ft-action-btn" onClick={() => setStarted(true)} disabled={!question.trim()}>
          Next
        </button>
      </div>
    );
  }

  if (!showFull) {
    return (
      <div className="ft-page fade-in">
        <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
        <h1 className="ft-title serif">{spreadInfo?.label || 'Card Reading'}</h1>
        <p className="ft-hero-sub" style={{ textAlign: 'center', margin: '8px 0 16px' }}>Tap each card to reveal</p>

        <div className="ft-three-cards">
          {data.cards.map((c, i) => (
            <div key={i} className="ft-flip-container ft-flip-sm" onClick={() => { if (!revealed[i] && (i === 0 || revealed[i - 1])) revealNext(); }}>
              <div className={`ft-flip-inner${revealed[i] ? ' ft-flipped' : ''}`}>
                <div className="ft-flip-front">
                  <div className="ft-card-back ft-card-back-sm">
                    <span className="ft-card-back-label serif">{c.position}</span>
                  </div>
                </div>
                <div className="ft-flip-back">
                  <div className="ft-tarot-card glass ft-tarot-card-sm">
                    <span className="ft-tarot-pos">{c.position}</span>
                    <span className={`ft-tarot-glyph${c.isReversed ? ' ft-tarot-reversed' : ''}`} style={{ fontSize: '1.2rem' }}>{'\u2660'}</span>
                    <span className="ft-tarot-name serif" style={{ fontSize: '.72rem' }}>{c.name}</span>
                    <span className="ft-tarot-orient" style={{ fontSize: '.6rem' }}>{c.orientation}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {allRevealed && (
          <button type="button" className="ft-action-btn fade-in" style={{ marginTop: 20 }} onClick={() => setShowFull(true)}>
            Show My Reading
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Your {spreadInfo?.label || 'Reading'}</h1>
      <p className="ft-hero-sub" style={{ margin: '4px 0 16px', fontStyle: 'italic' }}>"{question}"</p>

      {data.cards.map((c, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div className="ft-tarot-card glass">
            <span className="ft-tarot-pos">{c.position}</span>
            <span className={`ft-tarot-glyph${c.isReversed ? ' ft-tarot-reversed' : ''}`}>{'\u2660'}</span>
            <span className="ft-tarot-name serif">{c.name}</span>
            <span className="ft-tarot-orient">{c.orientation}</span>
          </div>
          {c.detailedReading.split('\n').filter(Boolean).map((p, pi) => (
            <p key={pi} className="ft-reading-text">{p}</p>
          ))}
        </div>
      ))}

      <div className="ft-summary glass">
        <h3 className="ft-summary-title serif">Reading Summary</h3>
        <p className="ft-summary-text">{data.summary}</p>
      </div>
    </div>
  );
}

/* ── Match Making (8-System Compatibility) ── */
const PARTNER_KEY = 'allstar-partner-info';
const SIGN_ICONS_MM = {
  Aries:'\u2648',Taurus:'\u2649',Gemini:'\u264A',Cancer:'\u264B',Leo:'\u264C',Virgo:'\u264D',
  Libra:'\u264E',Scorpio:'\u264F',Sagittarius:'\u2650',Capricorn:'\u2651',Aquarius:'\u2652',Pisces:'\u2653',
};

function MatchMakingView({ form, onBack }) {
  useScrollTop();
  const [partnerName, setPartnerName] = useState('');
  const [partnerDate, setPartnerDate] = useState('');
  const [partnerTime, setPartnerTime] = useState('');
  const [partnerLocation, setPartnerLocation] = useState('');
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(safeGet(PARTNER_KEY) || 'null');
      if (saved?.birth_date) {
        setPartnerName(saved.full_name || '');
        setPartnerDate(saved.birth_date || '');
        setPartnerTime(saved.birth_time || '');
        setPartnerLocation(saved.birth_location || '');
        setResult(getFullCompatibility(form, saved));
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  function doAnalyze() {
    if (!partnerDate) return;
    const pf = { full_name: partnerName.trim(), birth_date: partnerDate, birth_time: partnerTime || null, birth_location: partnerLocation.trim() || null };
    safeSet(PARTNER_KEY, JSON.stringify(pf));
    setResult(getFullCompatibility(form, pf));
    setExpanded(null);
  }

  function changePartner() {
    setResult(null);
    setExpanded(null);
  }

  if (!loaded) return null;

  if (result) {
    const { overall, systems, userSign, partnerSign } = result;
    return (
      <div className="ft-page fade-in">
        <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>

        <div className="mm-hero">
          <div className="mm-person">
            <span className="mm-icon">{SIGN_ICONS_MM[userSign]}</span>
            <span className="mm-name serif">{form?.full_name || 'You'}</span>
            <span className="mm-sign">{userSign}</span>
          </div>
          <div className="ft-match-score-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold)" strokeWidth="6"
                strokeDasharray={`${overall.score * 2.64} 264`} strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
            </svg>
            <span className="ft-score-val serif">{overall.score}%</span>
          </div>
          <div className="mm-person">
            <span className="mm-icon">{SIGN_ICONS_MM[partnerSign]}</span>
            <span className="mm-name serif">{partnerName || 'Partner'}</span>
            <span className="mm-sign">{partnerSign}</span>
          </div>
        </div>

        <p className="mm-verdict serif">{overall.verdict}</p>
        <p className="mm-summary">{overall.summary}</p>

        <h3 className="ft-sub-title serif" style={{ marginTop: 20 }}>8-System Analysis</h3>
        <div className="mm-systems">
          {systems.map((sys) => (
            <div key={sys.id}
              className={`mm-sys-card glass${expanded === sys.id ? ' mm-sys-expanded' : ''}`}
              onClick={() => setExpanded(expanded === sys.id ? null : sys.id)}>
              <div className="mm-sys-header">
                <span className="mm-sys-icon">{sys.icon}</span>
                <div className="mm-sys-info">
                  <span className="mm-sys-name">{sys.name}</span>
                  <span className="mm-sys-summary">{sys.summary}</span>
                </div>
                <span className="mm-sys-score serif">{sys.score}%</span>
              </div>
              {expanded === sys.id && (
                <div className="mm-sys-detail fade-in" onClick={(e) => e.stopPropagation()}>
                  {sys.factors.map((f, i) => (
                    <div key={i} className="mm-factor">
                      <span className="mm-factor-label">{f.label}</span>
                      <span className="mm-factor-value">{f.value}</span>
                      <div className="mm-factor-bar"><div className="mm-factor-fill" style={{ width: `${f.score}%` }} /></div>
                    </div>
                  ))}
                  <p className="mm-sys-desc">{sys.detail}</p>
                  {sys.strengths?.length > 0 && (
                    <div className="mm-sca-group">
                      <h4 className="mm-sca-title mm-sca-title--good">Strengths</h4>
                      {sys.strengths.map((s, i) => <p key={i} className="mm-sca-item mm-sca-item--good">{s}</p>)}
                    </div>
                  )}
                  {sys.challenges?.length > 0 && (
                    <div className="mm-sca-group">
                      <h4 className="mm-sca-title mm-sca-title--warn">Challenges</h4>
                      {sys.challenges.map((c, i) => <p key={i} className="mm-sca-item mm-sca-item--warn">{c}</p>)}
                    </div>
                  )}
                  {sys.advice && (
                    <div className="mm-sca-group">
                      <h4 className="mm-sca-title mm-sca-title--advice">Advice</h4>
                      <p className="mm-sca-item mm-sca-item--advice">{sys.advice}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button type="button" className="ft-action-btn" onClick={changePartner} style={{ marginTop: 20 }}>
          Try Another Partner
        </button>
      </div>
    );
  }

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="mm-form-header">
        <span className="mm-form-glyph">{'\u2661'}</span>
        <h1 className="ft-title serif">Match Making</h1>
        <p className="ft-hero-sub">8-System Cosmic Compatibility</p>
      </div>

      <h3 className="ft-sub-title serif">Partner's Name</h3>
      <input className="mm-input" type="text" placeholder="Enter name (optional)" value={partnerName}
        onChange={(e) => setPartnerName(e.target.value)} />

      <h3 className="ft-sub-title serif">Partner's Date of Birth</h3>
      <input className="mm-input" type="date" value={partnerDate}
        onChange={(e) => setPartnerDate(e.target.value)} />

      <h3 className="ft-sub-title serif">Partner's Birth Time <span className="mm-optional">(optional)</span></h3>
      <input className="mm-input" type="time" value={partnerTime}
        onChange={(e) => setPartnerTime(e.target.value)} />
      <p className="mm-hint">Unlocks BaZi Hour Pillar for deeper compatibility</p>

      <h3 className="ft-sub-title serif">Partner's Birth Location <span className="mm-optional">(optional)</span></h3>
      <input className="mm-input" type="text" placeholder="e.g. New York, NY" value={partnerLocation}
        onChange={(e) => setPartnerLocation(e.target.value)} />

      <button type="button" className="ft-action-btn" onClick={doAnalyze} disabled={!partnerDate} style={{ marginTop: 20 }}>
        Analyze Compatibility
      </button>
    </div>
  );
}

/* ── Numerology ── */
function NumerologyView({ form, onBack }) {
  useScrollTop();
  const [tab, setTab] = useState('daily');
  const data = useMemo(() => getNumerology(form), [form]);
  const tabs = ['daily', 'profile'];

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="ft-hero">
        <span className="ft-hero-icon ft-num-icon serif">{data.lifePath}</span>
        <h1 className="ft-hero-title serif">Hi {form?.full_name || 'Stargazer'}</h1>
        <p className="ft-hero-sub">Life Path {data.lifePath} {'\u00B7'} {data.lifePathTitle}</p>
      </div>

      <div className="ft-tabs">
        {tabs.map((t) => (
          <button type="button" key={t} className={`ft-tab${tab === t ? ' ft-tab--on' : ''}`} onClick={() => setTab(t)}>
            {t === 'daily' ? 'Daily' : 'Profile'}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        <div className="ft-body fade-in">
          <p className="ft-reading-text">{data.dailyMessage}</p>
          <div className="ft-num-grid">
            <div className="ft-num-cell glass"><span className="ft-num-cell-label">Personal Day</span><span className="ft-num-cell-val serif">{data.personalDay}</span></div>
            <div className="ft-num-cell glass"><span className="ft-num-cell-label">Personal Month</span><span className="ft-num-cell-val serif">{data.personalMonth}</span></div>
            <div className="ft-num-cell glass"><span className="ft-num-cell-label">Personal Year</span><span className="ft-num-cell-val serif">{data.personalYear}</span></div>
            <div className="ft-num-cell glass"><span className="ft-num-cell-label">Universal Day</span><span className="ft-num-cell-val serif">{data.universalDay}</span></div>
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="ft-body fade-in">
          <p className="ft-reading-text">{data.lifePathDesc}</p>
          <div className="ft-num-cell glass" style={{ marginBottom: 12 }}>
            <span className="ft-num-cell-label">Expression Number</span>
            <span className="ft-num-cell-val serif">{data.expressionNum}</span>
          </div>
        </div>
      )}

      <div className="ft-lucky-grid">
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Numbers</span><span className="ft-lucky-val">{data.luckyNumbers.join(', ')}</span></div>
        <div className="ft-lucky-item"><span className="ft-lucky-label">Lucky Color</span><span className="ft-lucky-val">{data.luckyColor}</span></div>
      </div>
    </div>
  );
}

/* ── Panchang ── */
function PanchangView({ form, onBack }) {
  useScrollTop();
  const data = useMemo(() => getPanchang(form), [form]);

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Panchang</h1>
      <p className="ft-date-label">{data.date}</p>

      <div className="ft-panch-vara glass">
        <span className="ft-panch-vara-sym">{data.vara.symbol}</span>
        <div className="ft-panch-vara-info">
          <span className="ft-panch-vara-name serif">{data.vara.name}</span>
          <span className="ft-panch-vara-eng">{data.vara.eng} &middot; Ruled by {data.vara.lord}</span>
        </div>
      </div>

      <h3 className="ft-sub-title serif">Panchangam (Five Limbs)</h3>
      <div className="ft-panch-grid">
        <div className="ft-panch-cell glass">
          <span className="ft-panch-cell-label">Tithi</span>
          <span className="ft-panch-cell-val serif">{data.paksha} {data.tithi}</span>
          <span className={`ft-panch-cell-note ft-panch-cell-note--${data.tithiQuality === 'Auspicious' ? 'good' : data.tithiQuality === 'Use Caution' ? 'warn' : 'neutral'}`}>{data.tithiQuality}</span>
        </div>
        <div className="ft-panch-cell glass">
          <span className="ft-panch-cell-label">Nakshatra</span>
          <span className="ft-panch-cell-val serif">{data.nakshatra}</span>
          <span className="ft-panch-cell-note">Lord: {data.nakshatraLord}</span>
        </div>
        <div className="ft-panch-cell glass">
          <span className="ft-panch-cell-label">Yoga</span>
          <span className="ft-panch-cell-val serif">{data.yoga}</span>
        </div>
        <div className="ft-panch-cell glass">
          <span className="ft-panch-cell-label">Karana</span>
          <span className="ft-panch-cell-val serif">{data.karana}</span>
        </div>
      </div>

      <div className="ft-panch-row">
        <div className="ft-panch-item glass">
          <span className="ft-panch-icon">{data.moonIcon}</span>
          <span className="ft-panch-label">Moon Phase</span>
          <span className="ft-panch-val serif">{data.moonPhase}</span>
        </div>
        <div className="ft-panch-item glass">
          <span className="ft-panch-icon">{'\u2600'}</span>
          <span className="ft-panch-label">Sunrise</span>
          <span className="ft-panch-val serif">{data.sunrise}</span>
        </div>
        <div className="ft-panch-item glass">
          <span className="ft-panch-icon">{'\uD83C\uDF05'}</span>
          <span className="ft-panch-label">Sunset</span>
          <span className="ft-panch-val serif">{data.sunset}</span>
        </div>
      </div>

      <div className="ft-panch-rahu glass">
        <span className="ft-panch-rahu-label">{'\u26A0'} Rahu Kaal</span>
        <span className="ft-panch-rahu-val">{data.rahuKaal.start} &mdash; {data.rahuKaal.end}</span>
        <span className="ft-panch-rahu-note">Avoid starting new ventures during this period</span>
      </div>

      <h3 className="ft-sub-title serif">Auspicious Activities</h3>
      <div className="ft-list">
        {data.goodActivities.map((a, i) => (
          <div key={i} className="ft-list-row ft-list-good"><span className="ft-list-dot" /><span>{a}</span></div>
        ))}
      </div>

      <h3 className="ft-sub-title serif">Avoid Today</h3>
      <div className="ft-list">
        {data.avoidActivities.map((a, i) => (
          <div key={i} className="ft-list-row ft-list-warn"><span className="ft-list-dot" /><span>{a}</span></div>
        ))}
      </div>

      <div className="ft-panch-hint glass">
        <span className="ft-panch-hint-icon">{'\uD83E\uDED4'}</span>
        <span className="ft-panch-hint-text">{data.festivalHint}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Quiz Flow — intro → questions → reveal → result
   ═══════════════════════════════════════════════════════ */
function QuizFlow({ quiz, onBack, onComplete }) {
  useScrollTop();
  const [phase, setPhase] = useState('intro');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [archetype, setArchetype] = useState(null);
  const [revealPct, setRevealPct] = useState(0);
  const timerRef = useRef(null);

  const question = quiz.questions[qIdx];
  const total = quiz.questions.length;

  function handleAnswer(optId) {
    if (selectedOpt) return;
    setSelectedOpt(optId);
    const updated = { ...answers, [question.id]: optId };
    setAnswers(updated);

    setTimeout(() => {
      setSelectedOpt(null);
      if (qIdx < total - 1) {
        setQIdx(qIdx + 1);
      } else {
        const winner = (() => {
          const scores = {};
          for (const q of quiz.questions) {
            const chosen = updated[q.id];
            if (!chosen) continue;
            const opt = q.options.find((o) => o.id === chosen);
            if (!opt) continue;
            for (const [arch, w] of Object.entries(opt.weights)) {
              scores[arch] = (scores[arch] || 0) + w;
            }
          }
          let best = null, bestScore = -1;
          for (const [arch, s] of Object.entries(scores)) {
            if (s > bestScore) { best = arch; bestScore = s; }
          }
          return best;
        })();
        setArchetype(winner);
        setPhase('reveal');
        let pct = 0;
        timerRef.current = setInterval(() => {
          pct += 2;
          setRevealPct(pct);
          if (pct >= 100) {
            clearInterval(timerRef.current);
            setTimeout(() => { onComplete(winner); setPhase('result'); }, 400);
          }
        }, 30);
      }
    }, 500);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const resultData = archetype ? quiz.results[archetype] : null;

  if (phase === 'intro') {
    return (
      <div className="qz-page fade-in">
        <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
        <div className="qz-intro">
          <span className="qz-intro-icon">{quiz.icon}</span>
          <h1 className="qz-intro-title serif">{quiz.title}</h1>
          <p className="qz-intro-sub">{quiz.subtitle}</p>
          <p className="qz-intro-meta">{total} questions {'\u00B7'} {quiz.durationLabel}</p>
          <button type="button" className="qz-start-btn" onClick={() => setPhase('question')}>Begin</button>
        </div>
      </div>
    );
  }

  if (phase === 'question') {
    return (
      <div className="qz-page fade-in" key={`q-${qIdx}`}>
        <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
        <div className="qz-progress"><div className="qz-progress-fill" style={{ width: `${((qIdx) / total) * 100}%` }} /></div>
        <span className="qz-progress-label">{qIdx + 1} / {total}</span>
        <div className="qz-question fade-in" key={question.id}>
          <h2 className="qz-q-text serif">{question.text}</h2>
          <div className="qz-options">
            {question.options.map((opt) => (
              <button type="button" key={opt.id} className={`qz-option${selectedOpt === opt.id ? ' qz-option--selected' : ''}`} onClick={() => handleAnswer(opt.id)}>{opt.text}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'reveal') {
    return (
      <div className="qz-page qz-reveal-page">
        <div className="qz-reveal-orb">
          <svg viewBox="0 0 120 120" className="qz-reveal-ring">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--glass-border)" strokeWidth="4" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--gold)" strokeWidth="4"
              strokeDasharray={`${revealPct * 3.39} 339`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.05s linear' }} />
          </svg>
          <span className="qz-reveal-pct">{revealPct}%</span>
        </div>
        <p className="qz-reveal-text">Analyzing your cosmic signature{'\u2026'}</p>
      </div>
    );
  }

  if (phase === 'result' && resultData) {
    return (
      <div className="qz-page qz-result-page fade-in">
        <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
        <div className="qz-result-hero">
          <span className="qz-result-icon">{quiz.icon}</span>
          <h1 className="qz-result-title serif">{resultData.title}</h1>
          <p className="qz-result-teaser">{resultData.teaser}</p>
        </div>
        <div className="qz-result-strengths">
          <h3 className="qz-result-sh serif">Your Strengths</h3>
          {resultData.strengths.map((s, i) => (
            <div key={i} className="qz-strength-row" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>
              <span className="qz-strength-dot" /><span>{s}</span>
            </div>
          ))}
        </div>
        {resultData.recommendedTools?.length > 0 && (
          <div className="qz-result-tools">
            <h3 className="qz-result-sh serif">Explore Related Tools</h3>
            <div className="qz-rec-tools">
              {resultData.recommendedTools.map((tid) => {
                const tool = FORTUNE_TOOLS.find((t) => t.id === tid);
                const label = tool?.title || tid;
                const glyph = tool?.glyph || '\u2726';
                return (
                  <button type="button" key={tid} className="qz-rec-tool-btn" onClick={() => onBack()}>
                    <span className="qz-rec-tool-glyph">{glyph}</span><span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <button type="button" className="qz-done-btn" onClick={onBack}>Back to Readings</button>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════
   KUNDLI VIEW
   ═══════════════════════════════════════════════════════ */
const KUNDLI_SECTIONS = [
  { id: 'birth',     label: 'Birth Details',       icon: '\uD83D\uDCC4' },
  { id: 'chart',     label: 'Horoscope Chart',     icon: '\uD83D\uDD2E' },
  { id: 'planets',   label: 'Planetary Details',   icon: '\uD83E\uDE90' },
  { id: 'favorable', label: 'Favorable For You',   icon: '\u2728' },
  { id: 'dasha',     label: 'Vimshottari Dasha',   icon: '\u23F3' },
  { id: 'life',      label: 'Life Report',         icon: '\uD83D\uDCD6' },
  { id: 'dosha',     label: 'Kundli Dosha',        icon: '\u26A0\uFE0F' },
  { id: 'remedies',  label: 'Remedies',            icon: '\uD83D\uDC8E' },
  { id: 'nakshatra', label: 'Nakshatra Prediction',icon: '\u2B50' },
  { id: 'biorhythm', label: 'Biorhythm Status',    icon: '\uD83D\uDCC8' },
];

function KundliView({ form, onBack }) {
  useScrollTop();
  const [section, setSection] = useState(null);
  const details = useMemo(() => getKundliBirthDetails(form), [form]);

  if (section) {
    return <KundliSection sectionId={section} form={form} onBack={() => setSection(null)} />;
  }

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="ft-hero">
        <span className="ft-hero-icon">{'\u0950'}</span>
        <h1 className="ft-hero-title serif">Kundli</h1>
        <p className="ft-hero-sub">{details.name}</p>
        <p style={{ fontSize: '.72rem', color: 'var(--muted)', margin: '2px 0' }}>{details.birthDate} &middot; {details.birthTime} &middot; {details.birthPlace}</p>
      </div>

      <div className="kd-grid">
        {KUNDLI_SECTIONS.map((s, i) => (
          <button type="button" key={s.id} className="kd-grid-btn glass" onClick={() => setSection(s.id)}
            style={{ animationDelay: `${i * 0.04}s` }}>
            <span className="kd-grid-icon">{s.icon}</span>
            <span className="kd-grid-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function KundliSection({ sectionId, form, onBack }) {
  useScrollTop();
  switch (sectionId) {
    case 'birth':     return <KdBirthDetails form={form} onBack={onBack} />;
    case 'chart':     return <KdChart form={form} onBack={onBack} />;
    case 'planets':   return <KdPlanets form={form} onBack={onBack} />;
    case 'favorable': return <KdFavorable form={form} onBack={onBack} />;
    case 'dasha':     return <KdDasha form={form} onBack={onBack} />;
    case 'life':      return <KdLifeReport form={form} onBack={onBack} />;
    case 'dosha':     return <KdDosha form={form} onBack={onBack} />;
    case 'remedies':  return <KdRemedies form={form} onBack={onBack} />;
    case 'nakshatra': return <KdNakshatra form={form} onBack={onBack} />;
    case 'biorhythm': return <KdBiorhythm form={form} onBack={onBack} />;
    default: return null;
  }
}

/* ── Birth Details ── */
function KdBirthDetails({ form, onBack }) {
  useScrollTop();
  const d = useMemo(() => getKundliBirthDetails(form), [form]);
  const rows = [
    ['Name', d.name], ['Date of Birth', d.birthDate], ['Time of Birth', d.birthTime],
    ['Place of Birth', d.birthPlace], ['Day', d.dayOfWeek],
    ['Ascendant (Lagna)', `${d.lagna} (${d.lagnaHindi}) ${d.lagnaDegree}`],
    ['Lagna Lord', d.lagnaLord], ['Moon Sign (Rashi)', `${d.moonSign} (${d.moonSignHindi})`],
    ['Sun Sign (Vedic)', `${d.sunSign} (${d.sunSignHindi})`],
    ['Nakshatra', `${d.nakshatra} (Pada ${d.pada})`], ['Nakshatra Lord', d.nakshatraLord],
    ['Tithi', d.tithi], ['Yoga', d.yoga], ['Karana', d.karana],
    ['Sunrise', d.sunrise], ['Sunset', d.sunset], ['Ayanamsa (Lahiri)', d.ayanamsa],
  ];
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Birth Details</h1>
      <div className="kd-table">
        {rows.map(([label, val]) => (
          <div key={label} className="kd-row">
            <span className="kd-row-label">{label}</span>
            <span className="kd-row-val">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horoscope Chart (South Indian style) ── */
function KdChart({ form, onBack }) {
  useScrollTop();
  const chart = useMemo(() => getKundliChart(form), [form]);
  const [chartType, setChartType] = useState('lagna');
  // South Indian layout: fixed sign positions in a 4x4 grid (outer ring)
  // Positions: [row,col] → sign index mapping for South Indian
  const SI_MAP = [
    [11, 0, 1, 2],
    [10, -1, -1, 3],
    [9, -1, -1, 4],
    [8, 7, 6, 5],
  ];

  function cellContent(signIdx) {
    if (signIdx < 0) return null; // center cells
    const house = chart.houses[((signIdx - chart.lagnaIdx + 12) % 12) + 1];
    if (!house) return null;
    const houseNum = ((signIdx - chart.lagnaIdx + 12) % 12) + 1;
    return (
      <div className="kd-chart-cell glass">
        <span className="kd-chart-sign">{house.sign.substring(0, 3)}</span>
        {houseNum === 1 && <span className="kd-chart-asc">Asc</span>}
        <div className="kd-chart-planets">
          {house.planets.map((p) => (
            <span key={p.planet} className={`kd-chart-planet${p.retrograde ? ' kd-retro' : ''}`}>
              {p.symbol}{p.retrograde ? 'R' : ''}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Horoscope Chart</h1>
      <p className="ft-hero-sub" style={{ marginBottom: 12 }}>South Indian Style &middot; Lagna: {chart.lagna}</p>

      <div className="kd-chart-grid">
        {SI_MAP.map((row, ri) => row.map((signIdx, ci) => (
          <div key={`${ri}-${ci}`} className={`kd-chart-slot${signIdx < 0 ? ' kd-chart-center' : ''}`}>
            {signIdx >= 0 ? cellContent(signIdx) : (
              <div className="kd-chart-center-label">
                <span className="serif" style={{ fontSize: '.72rem', color: 'var(--gold)' }}>Rashi</span>
                <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>Chart</span>
              </div>
            )}
          </div>
        )))}
      </div>

      <h3 className="ft-sub-title serif" style={{ marginTop: 16 }}>Houses</h3>
      <div className="kd-houses-list">
        {Object.entries(chart.houses).map(([num, h]) => (
          <div key={num} className="kd-house-row">
            <span className="kd-house-num">{num}</span>
            <span className="kd-house-sign">{h.sign}</span>
            <span className="kd-house-planets">{h.planets.map((p) => p.symbol + (p.retrograde ? 'R' : '')).join(' ') || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Planetary Details ── */
function KdPlanets({ form, onBack }) {
  useScrollTop();
  const planets = useMemo(() => getKundliPlanets(form), [form]);
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Planetary Details</h1>
      <div className="kd-planet-cards">
        {planets.map((p) => (
          <div key={p.planet} className="kd-planet-card glass">
            <div className="kd-planet-header">
              <span className="kd-planet-sym">{p.symbol}</span>
              <div>
                <span className="kd-planet-name serif">{p.planet} <span style={{ color: 'var(--muted)', fontSize: '.72rem' }}>({p.hindi})</span></span>
                {p.retrograde && <span className="kd-retro-badge">R Retrograde</span>}
              </div>
            </div>
            <div className="kd-planet-grid">
              <div className="kd-pfield"><span className="kd-pf-label">Sign</span><span className="kd-pf-val">{p.sign}</span></div>
              <div className="kd-pfield"><span className="kd-pf-label">Degree</span><span className="kd-pf-val">{p.degree}</span></div>
              <div className="kd-pfield"><span className="kd-pf-label">House</span><span className="kd-pf-val">{p.house}</span></div>
              <div className="kd-pfield"><span className="kd-pf-label">Sign Lord</span><span className="kd-pf-val">{p.signLord}</span></div>
              <div className="kd-pfield"><span className="kd-pf-label">Nakshatra</span><span className="kd-pf-val">{p.nakshatra}</span></div>
              <div className="kd-pfield"><span className="kd-pf-label">Nak. Lord</span><span className="kd-pf-val">{p.nakshatraLord}</span></div>
              <div className="kd-pfield"><span className="kd-pf-label">Pada</span><span className="kd-pf-val">{p.pada}</span></div>
              <div className="kd-pfield"><span className="kd-pf-label">Dignity</span><span className="kd-pf-val">{p.dignity}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Favorable For You ── */
function KdFavorable({ form, onBack }) {
  useScrollTop();
  const f = useMemo(() => getKundliFavorable(form), [form]);
  const items = [
    ['\uD83D\uDD22', 'Lucky Numbers', f.luckyNumbers.join(', ')],
    ['\uD83C\uDFA8', 'Lucky Colors', f.luckyColors.join(', ')],
    ['\uD83D\uDCC5', 'Lucky Days', f.luckyDays.join(', ')],
    ['\uD83D\uDC8E', 'Primary Gemstone', f.luckyGemstone],
    ['\uD83D\uDC8E', 'Secondary Gemstone', f.secondaryGemstone],
    ['\u2699\uFE0F', 'Lucky Metal', f.luckyMetal],
    ['\uD83E\uDDED', 'Lucky Direction', f.luckyDirection],
    ['\uD83D\uDE4F', 'Deity', f.deity],
    ['\uD83D\uDD49', 'Mantra', f.mantra],
    ['\uD83D\uDCBC', 'Professions', f.professions.join(', ')],
    ['\u2705', 'Friendly Planets', f.friendlyPlanets.join(', ')],
    ['\u274C', 'Unfriendly Planets', f.unfriendlyPlanets.join(', ')],
    ['\uD83D\uDD24', 'Lucky Letters', f.luckyLetters.join(', ')],
  ];
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Favorable For You</h1>
      <div className="kd-fav-grid">
        {items.map(([icon, label, val]) => (
          <div key={label} className="kd-fav-card glass">
            <span className="kd-fav-icon">{icon}</span>
            <span className="kd-fav-label">{label}</span>
            <span className="kd-fav-val">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Vimshottari Dasha ── */
function KdDasha({ form, onBack }) {
  useScrollTop();
  const d = useMemo(() => getKundliDasha(form), [form]);
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Vimshottari Dasha</h1>

      <div className="kd-dasha-current glass">
        <span style={{ fontSize: '.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Currently Running</span>
        <span className="serif" style={{ fontSize: '1rem', color: 'var(--gold)', margin: '4px 0' }}>
          {d.currentMaha.planet} Mahadasha &middot; {d.currentAntar.planet} Antardasha
        </span>
        <span style={{ fontSize: '.72rem', color: 'var(--text)' }}>
          Maha: {d.currentMaha.startLabel} – {d.currentMaha.endLabel}
        </span>
        <span style={{ fontSize: '.72rem', color: 'var(--text)' }}>
          Antar: {d.currentAntar.startLabel} – {d.currentAntar.endLabel}
        </span>
      </div>

      <h3 className="ft-sub-title serif" style={{ marginTop: 16 }}>Mahadasha Timeline</h3>
      <div className="kd-dasha-list">
        {d.mahadashas.map((m, i) => (
          <div key={i}>
            <button type="button" className={`kd-dasha-row${m.isCurrent ? ' kd-dasha-current-row' : ''}`}
              onClick={() => setExpanded(expanded === i ? null : i)}>
              <span className="kd-dasha-planet">{m.symbol} {m.planet} <span style={{ color: 'var(--muted)', fontSize: '.68rem' }}>({m.hindi})</span></span>
              <span className="kd-dasha-years">{m.years} yrs</span>
              <span className="kd-dasha-dates">{m.startLabel} – {m.endLabel}</span>
              <span className="kd-dasha-chevron">{expanded === i ? '\u25B2' : '\u25BC'}</span>
            </button>
            {expanded === i && m.isCurrent && (
              <div className="kd-antar-list fade-in">
                <span style={{ fontSize: '.68rem', color: 'var(--muted)', padding: '4px 8px', display: 'block' }}>Antardashas within {m.planet} Mahadasha:</span>
                {d.antardashas.map((a, ai) => (
                  <div key={ai} className={`kd-antar-row${a.isCurrent ? ' kd-dasha-current-row' : ''}`}>
                    <span>{a.symbol} {a.planet}</span>
                    <span style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{a.startLabel} – {a.endLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 12 }}>
        Birth Nakshatra: {d.birthNakshatra} &middot; Starting Dasha: {d.startingDasha} &middot; Balance at birth: {d.balanceAtBirth}
      </p>
    </div>
  );
}

/* ── Life Report ── */
function KdLifeReport({ form, onBack }) {
  useScrollTop();
  const report = useMemo(() => getKundliLifeReport(form), [form]);
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Life Report</h1>
      {report.sections.map((s) => (
        <div key={s.title} className="ft-cn-section-card">
          <h3 className="ft-cn-section-title">{s.icon} {s.title}</h3>
          <p className="ft-cn-section-text">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Kundli Dosha ── */
function KdDosha({ form, onBack }) {
  useScrollTop();
  const data = useMemo(() => getKundliDosha(form), [form]);
  const severityColor = { High: 'var(--coral)', Medium: '#FBBF24', Low: 'var(--teal)', None: 'var(--muted)' };
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Kundli Dosha</h1>
      {data.doshas.map((d) => (
        <div key={d.name} className="kd-dosha-card glass">
          <div className="kd-dosha-header">
            <span className="serif" style={{ fontSize: '.88rem', color: 'var(--text)', fontWeight: 700 }}>{d.name}</span>
            <span className="kd-dosha-badge" style={{ background: d.present ? severityColor[d.severity] : 'var(--teal)' }}>
              {d.present ? d.severity : 'Not Present'}
            </span>
          </div>
          <p className="kd-dosha-text">{d.description}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Remedies ── */
function KdRemedies({ form, onBack }) {
  useScrollTop();
  const r = useMemo(() => getKundliRemedies(form), [form]);
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Remedies</h1>

      <h3 className="ft-sub-title serif">Gemstone Recommendations</h3>
      {r.gemstoneRemedies.map((g) => (
        <div key={g.planet} className="kd-remedy-card glass">
          <span className="kd-remedy-badge">{g.type}</span>
          <span className="serif" style={{ fontSize: '.88rem', color: 'var(--gold)' }}>{g.stone} <span style={{ color: 'var(--muted)', fontSize: '.72rem' }}>for {g.planet}</span></span>
          <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Alternative: {g.alt}</span>
          <p className="kd-remedy-text">{g.instruction}</p>
        </div>
      ))}

      <h3 className="ft-sub-title serif">Mantra Remedies</h3>
      {r.mantraRemedies.map((m) => (
        <div key={m.planet} className="kd-remedy-card glass">
          <span className="serif" style={{ fontSize: '.88rem', color: 'var(--gold)' }}>{m.planet} ({m.hindi})</span>
          <span style={{ fontSize: '.82rem', color: 'var(--text)', fontStyle: 'italic', margin: '4px 0' }}>{m.mantra}</span>
          <p className="kd-remedy-text">{m.instruction}</p>
          <span style={{ fontSize: '.68rem', color: 'var(--muted)' }}>Recommended: {m.count}</span>
        </div>
      ))}

      <h3 className="ft-sub-title serif">Donations</h3>
      {r.donationRemedies.map((d) => (
        <div key={d.planet} className="kd-remedy-card glass">
          <span className="serif" style={{ fontSize: '.88rem', color: 'var(--gold)' }}>{d.planet}</span>
          <p className="kd-remedy-text">Items: {d.items}</p>
          <p className="kd-remedy-text">{d.recipient}</p>
        </div>
      ))}

      {r.fastingRemedies.length > 0 && (
        <>
          <h3 className="ft-sub-title serif">Fasting Remedies</h3>
          {r.fastingRemedies.map((f) => (
            <div key={f.planet} className="kd-remedy-card glass">
              <span className="serif" style={{ fontSize: '.88rem', color: 'var(--gold)' }}>{f.planet} — {f.day}</span>
              <p className="kd-remedy-text">{f.instruction}</p>
            </div>
          ))}
        </>
      )}

      {r.doshaRemedies.length > 0 && (
        <>
          <h3 className="ft-sub-title serif">Dosha-Specific Remedies</h3>
          {r.doshaRemedies.map((d) => (
            <div key={d.dosha} className="kd-remedy-card glass">
              <span className="serif" style={{ fontSize: '.88rem', color: 'var(--coral)' }}>{d.dosha}</span>
              <p className="kd-remedy-text">{d.remedy}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ── Nakshatra Prediction ── */
function KdNakshatra({ form, onBack }) {
  useScrollTop();
  const n = useMemo(() => getKundliNakshatra(form), [form]);
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <div className="ft-hero">
        <span className="ft-hero-icon">{'\u2B50'}</span>
        <h1 className="ft-hero-title serif">{n.name}</h1>
        <p className="ft-hero-sub">Pada {n.pada} &middot; Lord: {n.lord} &middot; Deity: {n.deity}</p>
      </div>

      <div className="kd-nk-meta">
        {[['Symbol', n.symbol], ['Gana', n.gana], ['Nadi', n.nadi], ['Tattva', n.tattva], ['Guna', n.guna], ['Varna', n.varna], ['Yoni', n.yoni]].map(([l, v]) => (
          <div key={l} className="kd-nk-meta-item glass">
            <span className="kd-nk-meta-label">{l}</span>
            <span className="kd-nk-meta-val">{v}</span>
          </div>
        ))}
      </div>

      <div className="ft-cn-section-card">
        <h3 className="ft-cn-section-title">{'\uD83D\uDC64'} Personality</h3>
        <p className="ft-cn-section-text">{n.personality}</p>
      </div>

      <h3 className="ft-sub-title serif">Strengths</h3>
      <div className="ft-traits" style={{ marginBottom: 12 }}>
        {n.strengths.map((s) => <span key={s} className="ft-trait-pill">{s}</span>)}
      </div>
      <h3 className="ft-sub-title serif">Weaknesses</h3>
      <div className="ft-traits" style={{ marginBottom: 12 }}>
        {n.weaknesses.map((w) => <span key={w} className="ft-trait-pill" style={{ borderColor: 'rgba(248,113,113,.3)', background: 'rgba(248,113,113,.08)', color: 'var(--coral)' }}>{w}</span>)}
      </div>

      <div className="ft-cn-section-card">
        <h3 className="ft-cn-section-title">{'\uD83D\uDCBC'} Career</h3>
        <p className="ft-cn-section-text">{n.career}</p>
      </div>
      <div className="ft-cn-section-card">
        <h3 className="ft-cn-section-title">{'\uD83C\uDF3F'} Health</h3>
        <p className="ft-cn-section-text">{n.health}</p>
      </div>
      <div className="ft-cn-section-card">
        <h3 className="ft-cn-section-title">{'\u2764\uFE0F'} Relationship</h3>
        <p className="ft-cn-section-text">{n.relationship}</p>
      </div>

      <div className="ft-cn-section-card">
        <h3 className="ft-cn-section-title">{'\uD83D\uDD22'} Pada {n.pada} Details</h3>
        <p className="ft-cn-section-text">{n.padaDescription}</p>
      </div>

      <h3 className="ft-sub-title serif">Compatibility</h3>
      <div className="ft-list">
        {n.compatibleNakshatras.map((c) => (
          <div key={c} className="ft-list-row ft-list-good"><span className="ft-list-dot" /><span>Compatible: {c}</span></div>
        ))}
        {n.avoidNakshatras.map((a) => (
          <div key={a} className="ft-list-row ft-list-warn"><span className="ft-list-dot" /><span>Challenging: {a}</span></div>
        ))}
      </div>

      <p style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 8 }}>Lucky Letters: {n.letters.join(', ')}</p>
    </div>
  );
}

/* ── Biorhythm Status ── */
function KdBiorhythm({ form, onBack }) {
  useScrollTop();
  const b = useMemo(() => getKundliBiorhythm(form), [form]);
  return (
    <div className="ft-page fade-in">
      <button type="button" className="rdg-back" onClick={onBack}><IconBack /> <span>Back</span></button>
      <h1 className="ft-title serif">Biorhythm Status</h1>
      <p className="ft-hero-sub" style={{ marginBottom: 16 }}>Day {b.daysSinceBirth.toLocaleString()} since birth</p>

      <div className="kd-bio-cards">
        {b.cycles.map((c) => (
          <div key={c.name} className="kd-bio-card glass">
            <div className="kd-bio-header">
              <span className="kd-bio-dot" style={{ background: c.color }} />
              <span className="serif" style={{ fontSize: '.88rem', color: 'var(--text)' }}>{c.name}</span>
              <span className="kd-bio-pct" style={{ color: c.value >= 0 ? 'var(--teal)' : 'var(--coral)' }}>{c.value}%</span>
            </div>
            <div className="kd-bio-bar">
              <div className="kd-bio-bar-bg">
                <div className="kd-bio-bar-zero" />
                <div className="kd-bio-bar-fill" style={{
                  background: c.color,
                  width: `${Math.abs(c.value) / 2}%`,
                  [c.value >= 0 ? 'left' : 'right']: '50%',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{c.desc} &middot; {c.period}-day cycle</span>
              <span style={{ fontSize: '.68rem', color: 'var(--muted)' }}>Next critical: {c.nextCritical}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="kd-bio-overall glass" style={{ marginTop: 16 }}>
        <span style={{ fontSize: '.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Overall Score</span>
        <span className="serif" style={{ fontSize: '1.6rem', color: b.overall >= 0 ? 'var(--gold)' : 'var(--coral)' }}>{b.overall}%</span>
      </div>

      <h3 className="ft-sub-title serif" style={{ marginTop: 16 }}>Weekly Forecast</h3>
      <div className="kd-bio-week">
        {b.weekForecast.map((d, i) => (
          <div key={i} className="kd-bio-day">
            <span className="kd-bio-day-label">{d.dayLabel}</span>
            <div className="kd-bio-day-bars">
              <div className="kd-bio-mini-bar" style={{ background: '#F87171', height: `${Math.max(4, Math.abs(d.physical) / 2)}px` }} />
              <div className="kd-bio-mini-bar" style={{ background: '#60A5FA', height: `${Math.max(4, Math.abs(d.emotional) / 2)}px` }} />
              <div className="kd-bio-mini-bar" style={{ background: '#FBBF24', height: `${Math.max(4, Math.abs(d.intellectual) / 2)}px` }} />
            </div>
            <span className="kd-bio-day-score" style={{ color: d.overall >= 0 ? 'var(--teal)' : 'var(--coral)' }}>{d.overall}%</span>
          </div>
        ))}
      </div>

      <h3 className="ft-sub-title serif" style={{ marginTop: 16 }}>Best Days This Week</h3>
      <div className="ft-list">
        <div className="ft-list-row ft-list-good"><span className="ft-list-dot" /><span>Physical activity: {b.bestDays.physical}</span></div>
        <div className="ft-list-row ft-list-good"><span className="ft-list-dot" /><span>Emotional decisions: {b.bestDays.emotional}</span></div>
        <div className="ft-list-row ft-list-good"><span className="ft-list-dot" /><span>Mental clarity: {b.bestDays.intellectual}</span></div>
      </div>
    </div>
  );
}
