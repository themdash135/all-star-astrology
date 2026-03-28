import React, { useEffect, useState } from 'react';

import { playDice, playFate, playCompatibility, playNumerology } from '../app/games-engine.js';
import { safeGet } from '../app/storage.js';
import { IconBack } from './common.jsx';

const PARTNER_KEY = 'allstar-partner-info';

const GAMES = [
  {
    game_id: 'dice',
    title: 'Astrology Dice',
    subtitle: 'Cast the cosmic bones',
    icon: '\u2684',
    inputs: [],
    action: 'Cast the Dice',
    ritual: 'The dice tumble through the astral plane\u2026',
  },
  {
    game_id: 'fate',
    title: 'Fate Draw',
    subtitle: 'Reveal your hidden card',
    icon: '\u2735',
    inputs: [],
    action: 'Draw Your Card',
    ritual: 'The veil between worlds thins\u2026',
  },
  {
    game_id: 'compatibility',
    title: 'Soul Match',
    subtitle: 'Two flames, one reading',
    icon: '\u2661',
    inputs: ['birth_date_1', 'birth_date_2'],
    action: 'Read the Bond',
    ritual: 'The threads of fate intertwine\u2026',
  },
  {
    game_id: 'numerology',
    title: 'Life Path',
    subtitle: 'Your number speaks',
    icon: '\u2727',
    inputs: ['birth_date'],
    action: 'Reveal My Number',
    ritual: 'The numbers align in the darkness\u2026',
  },
];

const INPUT_LABELS = {
  birth_date: 'Date of Birth',
  birth_date_1: 'First Soul',
  birth_date_2: 'Second Soul',
};

const PLAY_FNS = {
  dice: () => playDice(),
  fate: () => playFate(),
  compatibility: (inputs) => playCompatibility(inputs.birth_date_1, inputs.birth_date_2),
  numerology: (inputs) => playNumerology(inputs.birth_date),
};

const REVEAL_MS = 3400;

export function GamesScreen({ form, onNavigate }) {
  const [activeGame, setActiveGame] = useState(null);
  const [inputs, setInputs] = useState({});
  const [revealing, setRevealing] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function openGame(game) {
    // Read user DOB from form prop, fall back to stored form
    let userDate = form?.birth_date || '';
    if (!userDate) {
      try {
        const sf = JSON.parse(safeGet('allstar-form') || 'null');
        if (sf?.birth_date) userDate = sf.birth_date;
      } catch { /* ignore */ }
    }

    // Read partner DOB from stored partner info
    let partnerDate = '';
    try {
      const saved = JSON.parse(safeGet(PARTNER_KEY) || 'null');
      if (saved?.birth_date) partnerDate = saved.birth_date;
    } catch { /* ignore */ }

    const defaults = {};
    for (const key of game.inputs) {
      if (key === 'birth_date' || key === 'birth_date_1') {
        defaults[key] = userDate;
      } else if (key === 'birth_date_2') {
        defaults[key] = partnerDate;
      } else {
        defaults[key] = '';
      }
    }
    setInputs(defaults);
    setActiveGame(game);
    setResult(null);
    setPendingResult(null);
    setError('');

    // Auto-play if all inputs are filled (e.g. partner already saved)
    const allFilled = game.inputs.length === 0 || game.inputs.every((k) => defaults[k]?.trim());
    if (allFilled && game.inputs.length > 0) {
      const fn = PLAY_FNS[game.game_id];
      const data = fn(defaults);
      if (!data.error) {
        setPendingResult(data);
        setRevealing(true);
        return;
      }
    }
    setRevealing(false);
  }

  function goBack() {
    setActiveGame(null);
    setResult(null);
    setPendingResult(null);
    setError('');
    setInputs({});
    setRevealing(false);
  }

  function playGame() {
    if (revealing) return;
    setError('');
    setResult(null);

    const fn = PLAY_FNS[activeGame.game_id];
    const data = fn(inputs);
    if (data.error) {
      setError(data.error);
      return;
    }
    setPendingResult(data);
    setRevealing(true);
  }

  useEffect(() => {
    if (!revealing || !pendingResult) return;
    const timer = setTimeout(() => {
      setResult(pendingResult);
      setPendingResult(null);
      setRevealing(false);
    }, REVEAL_MS);
    return () => clearTimeout(timer);
  }, [revealing, pendingResult]);

  function handleCta() {
    if (!result?.cta_system || !onNavigate) return;
    onNavigate(result.cta_system);
  }

  // ── Hub view ──
  if (!activeGame) {
    return (
      <div className="gm-page fade-in">
        <div className="gm-hub-header">
          <div className="gm-sigil" aria-hidden="true">&#x2726;</div>
          <h1 className="gm-hub-title serif">Mystic Games</h1>
          <p className="gm-hub-sub">Choose your ritual</p>
        </div>
        <div className="gm-grid">
          {GAMES.map((game, i) => (
            <button
              type="button"
              key={game.game_id}
              className="gm-card stagger"
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => openGame(game)}
            >
              <div className="gm-card-glow" aria-hidden="true" />
              <span className="gm-card-icon">{game.icon}</span>
              <span className="gm-card-title serif">{game.title}</span>
              <span className="gm-card-sub">{game.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Active game ──
  const needsInputs = activeGame.inputs.length > 0 && !result && !revealing;
  const canPlay = activeGame.inputs.length === 0 || activeGame.inputs.every((k) => inputs[k]?.trim());

  return (
    <div className="gm-page fade-in">
      <div className="gm-back-row">
        <button type="button" className="gm-back" onClick={goBack} aria-label="Back">
          <IconBack />
        </button>
      </div>

      {/* Ritual header */}
      <div className="gm-ritual-header">
        <span className="gm-ritual-icon">{activeGame.icon}</span>
        <h2 className="gm-ritual-title serif">{activeGame.title}</h2>
      </div>

      {/* Game-specific reveal animation */}
      {revealing && pendingResult && (
        <div className="gm-reveal-stage">
          {pendingResult.game_id === 'dice' && <DiceReveal data={pendingResult} />}
          {pendingResult.game_id === 'fate' && <CardReveal data={pendingResult} />}
          {pendingResult.game_id === 'compatibility' && <CompatReveal data={pendingResult} />}
          {pendingResult.game_id === 'numerology' && <NumReveal data={pendingResult} />}
          <p className="gm-reveal-text serif">{activeGame.ritual}</p>
        </div>
      )}

      {/* Input form */}
      {!result && !revealing && (
        <div className="gm-play-area">
          {needsInputs && (
            <div className="gm-inputs">
              {activeGame.inputs.map((key) => (
                <div key={key} className="gm-input-group">
                  <label className="gm-input-label" htmlFor={`gm-${key}`}>{INPUT_LABELS[key]}</label>
                  <input
                    id={`gm-${key}`}
                    type="date"
                    className="gm-input"
                    value={inputs[key] || ''}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}
          <button type="button" className="gm-action-btn" onClick={playGame} disabled={!canPlay}>
            <span className="gm-action-text">{activeGame.action}</span>
          </button>
          {error && <p className="gm-error">{error}</p>}
        </div>
      )}

      {/* Result */}
      {result && !revealing && (
        <div className="gm-result fade-in">
          {result.game_id === 'dice' && <DiceResult data={result} />}
          {result.game_id === 'fate' && <FateResult data={result} />}
          {result.game_id === 'compatibility' && <CompatResult data={result} />}
          {result.game_id === 'numerology' && <NumResult data={result} />}

          <div className="gm-teaser">
            <p>{result.teaser}</p>
          </div>

          {result.premium_text && (
            <div className="gm-deep-reading glass">
              <div className="gm-deep-header">
                <span className="gm-deep-title serif">The Deeper Reading</span>
              </div>
              <p className="gm-deep-text">{result.premium_text}</p>
            </div>
          )}

          {result.cta_label && (
            <button type="button" className="gm-action-btn gm-cta" onClick={handleCta}>
              <span className="gm-action-text">{result.cta_label}</span>
            </button>
          )}

          <button type="button" className="gm-again" onClick={goBack}>
            &#x2726; Back to Games
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  Reveal Animations — cinematic per-game experiences
// ══════════════════════════════════════════════════════

function DiceReveal({ data }) {
  const dice = [
    { sym: data.sign_icon, faces: ['\u263D', '\u2726', '\u25C7', '\u2605', '\u2729'] },
    { sym: data.planet_symbol, faces: ['\u2726', '\u2606', '\u25C8', '\u2727', '\u2605'] },
    { sym: String(data.house), faces: ['\u2726', '\u263D', '\u2605', '\u25C7', '\u2727'] },
  ];
  return (
    <div className="dice-scene">
      <div className="dice-table">
        {dice.map((d, i) => (
          <div key={i} className="dice-wrapper">
            <div className={`dice-cube dice-tumble-${i}`}>
              <div className="dice-face dice-front serif">{d.sym}</div>
              <div className="dice-face dice-back serif">{d.faces[0]}</div>
              <div className="dice-face dice-right serif">{d.faces[1]}</div>
              <div className="dice-face dice-left serif">{d.faces[2]}</div>
              <div className="dice-face dice-top serif">{d.faces[3]}</div>
              <div className="dice-face dice-bottom serif">{d.faces[4]}</div>
            </div>
            <div className={`dice-shadow dice-shadow-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CardReveal({ data }) {
  return (
    <div className="card-scene">
      <div className="card-stack">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`stack-card stack-card-${i}`}>
            <div className="stack-card-inner">
              <div className="card-back-design">
                <span className="card-back-star" aria-hidden="true">{'\u2726'}</span>
                <span className="card-back-ring" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card-hero">
        <div className="card-hero-inner">
          <div className="card-hero-back">
            <div className="card-back-design">
              <span className="card-back-star" aria-hidden="true">{'\u2726'}</span>
              <span className="card-back-ring" aria-hidden="true" />
            </div>
          </div>
          <div className="card-hero-front">
            <span className="card-hero-sigil" aria-hidden="true">{'\u2726'}</span>
            <h3 className="card-hero-title serif">{data.card_title}</h3>
            <span className="card-hero-line" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompatReveal({ data }) {
  return (
    <div className="compat-scene">
      <div className="compat-ring-track" aria-hidden="true" />
      <div className="compat-ring-track compat-ring-track-2" aria-hidden="true" />
      <div className="compat-orb compat-orb-1">
        <span className="compat-orb-sign serif">{data.sign_1_icon}</span>
      </div>
      <div className="compat-orb compat-orb-2">
        <span className="compat-orb-sign serif">{data.sign_2_icon}</span>
      </div>
      <div className="compat-burst" aria-hidden="true" />
    </div>
  );
}

function NumReveal({ data }) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const reel = [...digits, ...digits, ...digits, data.life_path];
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSpinning(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const itemH = 80;
  const offset = spinning ? -((reel.length - 1) * itemH) : 0;

  return (
    <div className="num-scene">
      <div className="num-machine">
        <div className="num-window">
          <div className="num-reel" style={{ transform: `translateY(${offset}px)` }}>
            {reel.map((n, i) => (
              <div key={i} className="num-digit serif">{n}</div>
            ))}
          </div>
        </div>
        <div className="num-shine-top" aria-hidden="true" />
        <div className="num-shine-bot" aria-hidden="true" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  Result cards — static display after reveal
// ══════════════════════════════════════════════════════

function DiceResult({ data }) {
  return (
    <div className="gm-dice">
      <div className="gm-dice-row">
        {[
          { label: 'Sign', value: data.sign_icon, name: data.sign },
          { label: 'Planet', value: data.planet_symbol, name: data.planet },
          { label: 'House', value: data.house, name: `${data.house_meaning}` },
        ].map((die, i) => (
          <div key={die.label} className="gm-die stagger" style={{ animationDelay: `${i * 0.15}s` }}>
            <span className="gm-die-label">{die.label}</span>
            <span className="gm-die-face serif">{die.value}</span>
            <span className="gm-die-name">{die.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FateResult({ data }) {
  return (
    <div className="gm-fate">
      <div className="gm-fate-card">
        <div className="gm-fate-border" aria-hidden="true" />
        <div className="gm-fate-inner">
          <div className="gm-fate-star" aria-hidden="true">&#x2726;</div>
          <h3 className="gm-fate-title serif">{data.card_title}</h3>
          <p className="gm-fate-meaning">{data.card_meaning}</p>
          <div className="gm-fate-divider" aria-hidden="true" />
          <p className="gm-fate-advice"><em>Guidance:</em> {data.card_advice}</p>
        </div>
      </div>
    </div>
  );
}

function CompatResult({ data }) {
  return (
    <div className="gm-compat">
      <div className="gm-compat-duo">
        <div className="gm-compat-soul">
          <span className="gm-compat-icon serif">{data.sign_1_icon}</span>
          <span className="gm-compat-name">{data.sign_1}</span>
        </div>
        <div className="gm-compat-bond">
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="none" stroke="var(--gold)" strokeWidth="1" opacity=".4" />
            <circle cx="20" cy="20" r="12" fill="none" stroke="var(--gold)" strokeWidth="1" opacity=".6" />
            <circle cx="20" cy="20" r="6" fill="var(--gold)" opacity=".15" />
          </svg>
        </div>
        <div className="gm-compat-soul">
          <span className="gm-compat-icon serif">{data.sign_2_icon}</span>
          <span className="gm-compat-name">{data.sign_2}</span>
        </div>
      </div>
      <div className="gm-compat-ring">
        <span className="gm-compat-score serif">{data.score}%</span>
        <span className="gm-compat-label">{data.vibe}</span>
      </div>
    </div>
  );
}

function NumResult({ data }) {
  return (
    <div className="gm-num">
      <div className="gm-num-circle">
        <span className="gm-num-number serif">{data.life_path}</span>
      </div>
      <span className="gm-num-trait serif">{data.trait}</span>
    </div>
  );
}
