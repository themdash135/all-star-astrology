import React, { useEffect, useState } from 'react';

import { SYSTEM_GAMES, INPUT_LABELS, GAME_TYPE_LABELS } from '../app/system-games-config.js';
import { playSystemGame } from '../app/system-games-engine.js';
import { IconBack } from './common.jsx';

const REVEAL_MS = 2800;

/* ═══════════════════════════════════════════════════════
   SystemGamesTab — Games page inside each system detail view.
   Shows a card grid of available games, collects inputs,
   plays a reveal animation, and renders typed results.
   ═══════════════════════════════════════════════════════ */
export function SystemGamesTab({ systemId, result, form }) {
  const [activeGame, setActiveGame] = useState(null);
  const [inputs, setInputs] = useState({});
  const [revealing, setRevealing] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [error, setError] = useState('');

  const games = SYSTEM_GAMES[systemId] || [];

  // Reset when system changes
  useEffect(() => {
    setActiveGame(null);
    setGameResult(null);
    setPendingResult(null);
    setError('');
    setInputs({});
    setRevealing(false);
  }, [systemId]);

  function openGame(game) {
    const defaults = {};
    for (const key of game.inputs) {
      if (key === 'partner_date') defaults[key] = '';
      else if (key === 'partner_name') defaults[key] = '';
      else if (key === 'question') defaults[key] = '';
      else if (key === 'text') defaults[key] = form?.full_name || '';
      else if (key === 'text2') defaults[key] = '';
      else defaults[key] = '';
    }
    setInputs(defaults);
    setActiveGame(game);
    setGameResult(null);
    setPendingResult(null);
    setError('');
    setRevealing(false);
  }

  function goBack() {
    setActiveGame(null);
    setGameResult(null);
    setPendingResult(null);
    setError('');
    setInputs({});
    setRevealing(false);
  }

  function play() {
    if (revealing) return;
    setError('');
    setGameResult(null);

    const data = playSystemGame(activeGame.id, result, form, inputs);
    if (data.error) {
      setError(data.error);
      return;
    }
    setPendingResult(data);
    setRevealing(true);
  }

  // Reveal timer
  useEffect(() => {
    if (!revealing || !pendingResult) return;
    const timer = setTimeout(() => {
      setGameResult(pendingResult);
      setPendingResult(null);
      setRevealing(false);
    }, REVEAL_MS);
    return () => clearTimeout(timer);
  }, [revealing, pendingResult]);

  const canPlay = activeGame
    ? activeGame.inputs.length === 0 || activeGame.inputs.every((k) => {
        const v = inputs[k];
        return v && v.trim && v.trim().length > 0;
      })
    : false;

  // ── Card grid (no active game) ──
  if (!activeGame) {
    return (
      <div className="sg-page fade-in">
        <div className="sg-intro">
          <h3 className="sg-intro-title serif">Mystic Games</h3>
          <p className="sg-intro-sub">Explore {games.length} interactive experiences</p>
        </div>
        <div className="sg-grid">
          {games.map((game, i) => (
            <button
              type="button"
              key={game.id}
              className="sg-card glass stagger"
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => openGame(game)}
            >
              <div className="sg-card-glow" aria-hidden="true" />
              <span className="sg-card-icon">{game.icon}</span>
              <span className="sg-card-title serif">{game.title}</span>
              <span className="sg-card-sub">{game.subtitle}</span>
              <div className="sg-card-meta">
                <span className="sg-card-type">{GAME_TYPE_LABELS[game.gameType]}</span>
                <span className="sg-card-dur">{game.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Active game ──
  const needsInputs = activeGame.inputs.length > 0 && !gameResult && !revealing;

  return (
    <div className="sg-page fade-in">
      <div className="sg-back-row">
        <button type="button" className="sg-back" onClick={goBack} aria-label="Back to games">
          <IconBack />
        </button>
        <span className="sg-back-label serif">{activeGame.title}</span>
      </div>

      {/* Ritual header */}
      <div className="sg-ritual-header">
        <span className="sg-ritual-icon">{activeGame.icon}</span>
        <h3 className="sg-ritual-title serif">{activeGame.title}</h3>
        <p className="sg-ritual-sub">{activeGame.subtitle}</p>
      </div>

      {/* Reveal animation */}
      {revealing && pendingResult && (
        <div className="sg-reveal-stage">
          <MysticReveal type={pendingResult.type} headline={pendingResult.headline} />
        </div>
      )}

      {/* Input form */}
      {!gameResult && !revealing && (
        <div className="sg-play-area">
          {needsInputs && (
            <div className="sg-inputs">
              {activeGame.inputs.map((key) => (
                <div key={key} className="sg-input-group">
                  <label className="sg-input-label" htmlFor={`sg-${key}`}>{INPUT_LABELS[key] || key}</label>
                  {key.includes('date') ? (
                    <input
                      id={`sg-${key}`}
                      type="date"
                      className="sg-input"
                      value={inputs[key] || ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      id={`sg-${key}`}
                      type="text"
                      className="sg-input"
                      placeholder={INPUT_LABELS[key] || ''}
                      value={inputs[key] || ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <button type="button" className="sg-action-btn" onClick={play} disabled={!canPlay}>
            <span className="sg-action-text">Begin</span>
          </button>
          {error && <p className="sg-error">{error}</p>}
        </div>
      )}

      {/* Result */}
      {gameResult && !revealing && (
        <div className="sg-result fade-in">
          {gameResult.type === 'identity' && <IdentityResult data={gameResult} />}
          {gameResult.type === 'compatibility' && <CompatibilityResult data={gameResult} />}
          {gameResult.type === 'timeline' && <TimelineResult data={gameResult} />}
          {gameResult.type === 'oracle' && <OracleResult data={gameResult} />}
          {gameResult.type === 'explorer' && <ExplorerResult data={gameResult} />}

          <button type="button" className="sg-again" onClick={() => { setGameResult(null); setError(''); }}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   Reveal Animation — mystic orb with pulsing headline
   ═══════════════════════════════════════════════════════ */
function MysticReveal({ type, headline }) {
  const typeLabel = GAME_TYPE_LABELS[type] || 'Reading';
  return (
    <div className="sg-mystic-reveal">
      <div className="sg-reveal-orb">
        <div className="sg-reveal-ring sg-reveal-ring-1" />
        <div className="sg-reveal-ring sg-reveal-ring-2" />
        <div className="sg-reveal-ring sg-reveal-ring-3" />
        <div className="sg-reveal-core" />
      </div>
      <p className="sg-reveal-type">{typeLabel}</p>
      <p className="sg-reveal-headline serif">{headline || 'The stars align\u2026'}</p>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   Result: Identity — sections of items with strengths/cautions
   ═══════════════════════════════════════════════════════ */
function IdentityResult({ data }) {
  return (
    <div className="sg-identity">
      <h3 className="sg-result-headline serif">{data.headline}</h3>

      {data.sections?.map((section, si) => (
        <div key={si} className="sg-section glass stagger" style={{ animationDelay: `${si * 0.1}s` }}>
          <div className="sg-section-header">
            <span className="sg-section-icon">{section.icon}</span>
            <h4 className="sg-section-title serif">{section.title}</h4>
          </div>
          <div className="sg-section-items">
            {section.items.map((item, ii) => (
              <div key={ii} className="sg-item">
                <div className="sg-item-top">
                  <span className="sg-item-label">{item.label}</span>
                  <span className="sg-item-value serif">{item.value}</span>
                </div>
                {item.desc && <p className="sg-item-desc">{item.desc}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.strengths?.length > 0 && (
        <div className="sg-traits glass stagger" style={{ animationDelay: '0.4s' }}>
          <h4 className="sg-traits-title serif">Strengths</h4>
          {data.strengths.map((s, i) => (
            <div key={i} className="sg-trait sg-trait-strength">
              <span className="sg-trait-dot" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}

      {data.cautions?.length > 0 && (
        <div className="sg-traits glass stagger" style={{ animationDelay: '0.5s' }}>
          <h4 className="sg-traits-title serif">Watch Out For</h4>
          {data.cautions.map((c, i) => (
            <div key={i} className="sg-trait sg-trait-caution">
              <span className="sg-trait-dot" />
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}

      {data.advice && (
        <div className="sg-advice glass stagger" style={{ animationDelay: '0.6s' }}>
          <p className="sg-advice-text">{data.advice}</p>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   Result: Compatibility — score ring + category bars
   ═══════════════════════════════════════════════════════ */
function CompatibilityResult({ data }) {
  const scoreColor = data.score >= 70 ? '#4ADE80' : data.score >= 50 ? '#60A5FA' : data.score >= 35 ? '#FBBF24' : '#F87171';

  return (
    <div className="sg-compat">
      <h3 className="sg-result-headline serif">{data.headline}</h3>

      {/* Score ring */}
      <div className="sg-compat-ring">
        <svg viewBox="0 0 120 120" className="sg-compat-ring-svg">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(data.score / 100) * 327} 327`}
            transform="rotate(-90 60 60)"
            className="sg-compat-ring-fill"
          />
        </svg>
        <div className="sg-compat-ring-inner">
          <span className="sg-compat-score serif" style={{ color: scoreColor }}>{data.score}%</span>
          <span className="sg-compat-label">{data.scoreLabel}</span>
        </div>
      </div>

      {/* Categories */}
      {data.categories?.map((cat, i) => (
        <div key={i} className="sg-cat glass stagger" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
          <div className="sg-cat-top">
            <span className="sg-cat-name">{cat.name}</span>
            <span className="sg-cat-score serif">{cat.score}%</span>
          </div>
          <div className="sg-cat-bar-track">
            <div className="sg-cat-bar" style={{ width: `${cat.score}%`, background: cat.score >= 70 ? '#4ADE80' : cat.score >= 50 ? '#60A5FA' : '#FBBF24' }} />
          </div>
          {cat.desc && <p className="sg-cat-desc">{cat.desc}</p>}
        </div>
      ))}

      {/* Best feature & watch out */}
      {data.bestFeature && (
        <div className="sg-callout sg-callout-good glass stagger" style={{ animationDelay: '0.5s' }}>
          <span className="sg-callout-icon">{'\u2728'}</span>
          <p>{data.bestFeature}</p>
        </div>
      )}
      {data.watchOut && (
        <div className="sg-callout sg-callout-warn glass stagger" style={{ animationDelay: '0.55s' }}>
          <span className="sg-callout-icon">{'\u26A0'}</span>
          <p>{data.watchOut}</p>
        </div>
      )}

      {data.advice && (
        <div className="sg-advice glass stagger" style={{ animationDelay: '0.6s' }}>
          <p className="sg-advice-text">{data.advice}</p>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   Result: Timeline — vertical timeline of periods
   ═══════════════════════════════════════════════════════ */
function TimelineResult({ data }) {
  return (
    <div className="sg-timeline">
      <h3 className="sg-result-headline serif">{data.headline}</h3>

      <div className="sg-tl-track">
        {data.periods?.map((p, i) => {
          const isCurrent = i === data.currentPeriod;
          const ratingClass = p.rating === 'favorable' ? 'sg-tl-fav' : p.rating === 'challenging' ? 'sg-tl-chal' : 'sg-tl-neut';
          return (
            <div
              key={i}
              className={`sg-tl-node ${ratingClass} ${isCurrent ? 'sg-tl-current' : ''} stagger`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="sg-tl-dot" />
              <div className="sg-tl-line" />
              <div className="sg-tl-content glass">
                <div className="sg-tl-header">
                  <span className="sg-tl-label serif">{p.label}</span>
                  <span className="sg-tl-years">{p.years}</span>
                </div>
                <span className="sg-tl-theme">{p.theme}</span>
                {p.desc && <p className="sg-tl-desc">{p.desc}</p>}
                {isCurrent && <span className="sg-tl-badge">You Are Here</span>}
              </div>
            </div>
          );
        })}
      </div>

      {data.advice && (
        <div className="sg-advice glass stagger" style={{ animationDelay: '0.8s' }}>
          <p className="sg-advice-text">{data.advice}</p>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   Result: Oracle — poetic verse + guidance
   ═══════════════════════════════════════════════════════ */
function OracleResult({ data }) {
  return (
    <div className="sg-oracle">
      <h3 className="sg-result-headline serif">{data.headline}</h3>

      <div className="sg-oracle-verse glass stagger">
        <p className="sg-oracle-verse-text serif">{data.verse}</p>
      </div>

      <div className="sg-oracle-answer glass stagger" style={{ animationDelay: '0.15s' }}>
        <h4 className="sg-oracle-label serif">The Answer</h4>
        <p>{data.answer}</p>
      </div>

      {data.guidance && (
        <div className="sg-oracle-guidance glass stagger" style={{ animationDelay: '0.25s' }}>
          <h4 className="sg-oracle-label serif">Guidance</h4>
          <p>{data.guidance}</p>
        </div>
      )}

      {data.caution && (
        <div className="sg-oracle-caution glass stagger" style={{ animationDelay: '0.35s' }}>
          <h4 className="sg-oracle-label serif">Caution</h4>
          <p>{data.caution}</p>
        </div>
      )}

      {data.timing && (
        <div className="sg-oracle-timing stagger" style={{ animationDelay: '0.4s' }}>
          <span className="sg-oracle-timing-label">Timing:</span>
          <span className="sg-oracle-timing-val serif">{data.timing}</span>
        </div>
      )}

      {data.actions?.length > 0 && (
        <div className="sg-oracle-actions glass stagger" style={{ animationDelay: '0.5s' }}>
          <h4 className="sg-oracle-label serif">Suggested Actions</h4>
          {data.actions.map((a, i) => (
            <div key={i} className="sg-oracle-action">
              <span className="sg-oracle-action-dot" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   Result: Explorer — items list with meaning
   ═══════════════════════════════════════════════════════ */
function ExplorerResult({ data }) {
  return (
    <div className="sg-explorer">
      <h3 className="sg-result-headline serif">{data.headline}</h3>

      {data.items?.map((item, i) => (
        <div key={i} className="sg-exp-item glass stagger" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="sg-exp-top">
            <span className="sg-exp-label">{item.label}</span>
            <span className="sg-exp-value serif">{item.value}</span>
          </div>
          {item.desc && <p className="sg-exp-desc">{item.desc}</p>}
        </div>
      ))}

      {data.total && (
        <div className="sg-exp-total glass stagger" style={{ animationDelay: '0.4s' }}>
          <span className="sg-exp-total-label serif">{data.total}</span>
        </div>
      )}

      {data.meaning && (
        <div className="sg-exp-meaning glass stagger" style={{ animationDelay: '0.5s' }}>
          <p>{data.meaning}</p>
        </div>
      )}

      {data.advice && (
        <div className="sg-advice glass stagger" style={{ animationDelay: '0.6s' }}>
          <p className="sg-advice-text">{data.advice}</p>
        </div>
      )}
    </div>
  );
}
