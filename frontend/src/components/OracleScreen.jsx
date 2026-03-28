import React, { useEffect, useRef, useState } from 'react';

import { ORACLE_HISTORY_KEY, ORACLE_HISTORY_LIMIT } from '../app/constants.js';
import {
  buildShareText,
  extractCosmicDNA,
  getDailyContent,
  mergeOracleHistory,
} from '../app/helpers.js';
import { readStoredOracleHistory, safeSet } from '../app/storage.js';
import { apiPost } from '../app/api.js';
import { Accordion, IconChevron, IconSettings } from './common.jsx';

const ALL_STARTER_PROMPTS = [
  'What energy is around me today?',
  'What should I focus on this week?',
  'Is this a good time for a big decision?',
  'What\'s blocking my growth right now?',
  'How can I improve my relationships?',
];

function pickStarterPrompts(count = 4) {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = [...ALL_STARTER_PROMPTS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) + 7) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// ── Premium staged-reveal result ─────────────────────────────────

function OracleResult({ answer, question, reducedMotion, onReset, onRetry, onShare, shareFeedback }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setStage(5);
      return;
    }
    setStage(1);
    const timers = [
      setTimeout(() => setStage(2), 400),
      setTimeout(() => setStage(3), 900),
      setTimeout(() => setStage(4), 1500),
      setTimeout(() => setStage(5), 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [answer, reducedMotion]);

  const answerParts = (answer.answer || '').split('\n\n').filter(Boolean);
  const confidence = answer.confidence ?? answer.aggregation?.confidence ?? 0;
  const confidenceLabel = answer.confidence_label || answer.aggregation?.confidence_label || 'Medium';
  const tone = answer.tone || 'guided';
  const signals = answer.system_signals || [];
  const personalInsight = answer.personal_insight;
  const conflictNote = answer.conflict_note;
  const topSystems = answer.top_systems || [];
  const agreement = answer.system_agreement || {};

  const confClass = confidenceLabel === 'High' ? 'or-conf--high' : confidenceLabel === 'Low' ? 'or-conf--low' : 'or-conf--med';
  const toneClass = tone === 'firm' ? 'or-tone--firm' : tone === 'exploratory' ? 'or-tone--explore' : '';

  return (
    <div className="or-result fade-in" role="status" aria-live="polite" aria-atomic="true">
      {/* Glow backdrop */}
      <div className="or-glow" aria-hidden="true" />

      {/* Stage 1: Full answer */}
      <div className={`or-answer ${toneClass} ${stage >= 1 ? 'or-visible' : 'or-hidden'}`}>
        <p className="oracle-q-echo">"{question}"</p>
        {answerParts.map((p, i) => (
          <p key={i} className="or-answer-text serif">{p}</p>
        ))}
      </div>

      {/* Stage 2: Confidence badge */}
      <div className={`or-confidence ${confClass} ${stage >= 2 ? 'or-visible' : 'or-hidden'}`}>
        <span className="or-conf-dot" />
        <span className="or-conf-label">{confidenceLabel} Confidence</span>
        <span className="or-conf-val">{Math.round(confidence * 100)}%</span>
      </div>

      {/* Stage 3: System reasoning cards */}
      {signals.length > 0 && (
        <div className={`or-systems ${stage >= 3 ? 'or-visible' : 'or-hidden'}`}>
          <h3 className="or-section-title">System Reasoning</h3>

          {/* Agreement summary */}
          {Object.keys(agreement).length > 0 && (
            <div className="or-agreement">
              {Object.entries(agreement).map(([option, count]) => (
                <span key={option} className="or-agree-chip">
                  <strong>{count}</strong> {count === 1 ? 'system' : 'systems'} favor <em>{option}</em>
                </span>
              ))}
            </div>
          )}

          <div className="or-cards">
            {signals.map((sig, i) => {
              const sentClass = sig.sentiment === 'supports' ? 'or-card--supports' : sig.sentiment === 'cautions' ? 'or-card--cautions' : 'or-card--neutral';
              return (
                <div
                  key={sig.system_id || i}
                  className={`or-card ${sentClass}`}
                  style={reducedMotion ? {} : { animationDelay: `${1.0 + i * 0.12}s` }}
                >
                  <div className="or-card-hd">
                    <span className="or-card-name">{sig.name}</span>
                    <span className="or-card-sent">{sig.sentiment}</span>
                  </div>
                  <p className="or-card-reason">{sig.reason}</p>
                  {sig.evidence?.length > 0 && (
                    <div className="or-card-evidence">
                      {sig.evidence.slice(0, 2).map((ev, j) => (
                        <span key={j} className="or-ev-tag">{ev.feature}: {ev.value}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage 4: Conflict note (if systems disagree) */}
      {conflictNote && (
        <div className={`or-conflict ${stage >= 4 ? 'or-visible' : 'or-hidden'}`}>
          <span className="or-conflict-icon">~</span>
          <p className="or-conflict-text">{conflictNote}</p>
        </div>
      )}

      {/* Stage 5: Personal insight (last, highlighted) */}
      {personalInsight && (
        <div className={`or-insight ${stage >= 5 ? 'or-visible' : 'or-hidden'}`}>
          <p className="or-insight-text">{personalInsight}</p>
        </div>
      )}


      {/* Actions */}
      <div className={`oracle-actions ${stage >= 5 ? 'or-visible' : 'or-hidden'}`}>
        <button type="button" className="btn-gold" onClick={onReset}>Ask Another</button>
        <button type="button" className="btn-ghost oracle-secondary" onClick={onRetry}>Retry</button>
        <button type="button" className="btn-ghost oracle-share" onClick={onShare}>Share</button>
      </div>
      {shareFeedback && <p className="oracle-share-note" role="status">{shareFeedback}</p>}
    </div>
  );
}


export function OracleScreen({ result, reducedMotion, onOpenSettings }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [history, setHistory] = useState(() => readStoredOracleHistory());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const shareFeedbackTimeoutRef = useRef(null);

  useEffect(() => {
    safeSet(ORACLE_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => () => {
    if (shareFeedbackTimeoutRef.current) {
      window.clearTimeout(shareFeedbackTimeoutRef.current);
    }
  }, []);

  if (!result) {
    return <div className="page fade-in"><p className="empty-msg">Generate a reading first.</p></div>;
  }

  async function submitQuestion(rawQuestion = question) {
    const trimmed = rawQuestion.trim();
    if (!trimmed || loading || revealing) {
      return;
    }

    setLoading(true);
    setAnswer(null);
    setQuestion(trimmed);

    let data;
    try {
      const pastQuestions = history.slice(0, 10).map((item) => item.q);
      const payload = await apiPost('ask', {
        question: trimmed,
        reading_data: result,
        question_history: pastQuestions,
      });
      data = payload?.answer
        ? payload
        : { answer: 'The stars are veiled tonight. Ask again when the clouds part.', areas: [], evidence: [] };
    } catch (err) {
      console.warn('[Oracle] API error:', err);
      data = { answer: 'The celestial connection falters. Try once more.', areas: [], evidence: [] };
    }

    setLoading(false);
    setRevealing(true);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    window.setTimeout(() => {
      setAnswer(data);
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
      setHistory((items) => mergeOracleHistory(
        items,
        {
          q: trimmed,
          a: data.answer,
          areas: data.areas || [],
          evidence: data.evidence || [],
          system_signals: data.system_signals || [],
          confidence: data.confidence ?? 0,
          confidence_label: data.confidence_label || 'Medium',
          tone: data.tone || 'guided',
          personal_insight: data.personal_insight || null,
          conflict_note: data.conflict_note || null,
          system_agreement: data.system_agreement || {},
          top_systems: data.top_systems || [],
        },
        ORACLE_HISTORY_LIMIT,
      ));
      setRevealing(false);
    }, reducedMotion ? 0 : 2500);
  }

  function handleAsk() {
    return submitQuestion(question);
  }

  function handleReset() {
    setQuestion('');
    setAnswer(null);
    setRevealing(false);
    setLoading(false);
    setShareFeedback('');
  }

  function showShareFeedback(message) {
    setShareFeedback(message);
    if (shareFeedbackTimeoutRef.current) {
      window.clearTimeout(shareFeedbackTimeoutRef.current);
    }
    shareFeedbackTimeoutRef.current = window.setTimeout(() => {
      setShareFeedback('');
      shareFeedbackTimeoutRef.current = null;
    }, 2200);
  }

  function handleClearDraft() {
    setQuestion('');
    setShareFeedback('');
  }

  function handleOpenHistory(item) {
    setQuestion(item.q);
    setAnswer({
      answer: item.a,
      areas: item.areas || [],
      evidence: item.evidence || [],
      system_signals: item.system_signals || [],
      confidence: item.confidence ?? 0,
      confidence_label: item.confidence_label || 'Medium',
      tone: item.tone || 'guided',
      personal_insight: item.personal_insight || null,
      conflict_note: item.conflict_note || null,
      system_agreement: item.system_agreement || {},
      top_systems: item.top_systems || [],
    });
    setRevealing(false);
    setLoading(false);
    setShareFeedback('');
    setHistory((items) => mergeOracleHistory(items, item, ORACLE_HISTORY_LIMIT));
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function handleClearHistory() {
    if (!window.confirm('Clear your saved Oracle history?')) {
      return;
    }
    setHistory([]);
  }

  async function handleShare() {
    if (!answer?.answer) {
      return;
    }

    const shareText = buildShareText(question, answer.answer);

    try {
      if (window.navigator?.share) {
        await window.navigator.share({
          title: 'All Star Astrology',
          text: shareText,
        });
        showShareFeedback('Shared');
        return;
      }

      if (window.navigator?.clipboard?.writeText) {
        await window.navigator.clipboard.writeText(shareText);
        showShareFeedback('Copied to clipboard');
        return;
      }
      showShareFeedback('Sharing is unavailable on this device');
    } catch {
      showShareFeedback('Share was cancelled');
    }
  }

  const historyItems = answer ? history.slice(1) : history;
  const nearLimit = question.length >= 240;
  const daily = getDailyContent(result);
  const dna = extractCosmicDNA(result);
  const [starterPrompts] = useState(() => pickStarterPrompts(4));
  const sortedAreas = Object.entries(result?.combined?.probabilities || {}).sort((left, right) => right[1].value - left[1].value);
  const focusLabel = daily.focus?.label || daily.focus?.area || sortedAreas[0]?.[0] || '';
  const cautionLabel = daily.caution?.label || daily.caution?.area || sortedAreas[sortedAreas.length - 1]?.[0] || '';

  function humanizeArea(value) {
    if (!value) {
      return '';
    }

    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return (
    <div className="oracle-screen fade-in">
      <div className={`oracle-particles ${revealing ? 'oracle-particles--active' : ''}`} aria-hidden="true">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            className="oracle-particle"
            style={{
              left: `${(index * 37 + 13) % 100}%`,
              top: `${(index * 53 + 7) % 100}%`,
              animationDelay: `${(index * 0.7) % 5}s`,
              animationDuration: `${4 + (index % 3)}s`,
              width: `${1.5 + (index % 3)}px`,
              height: `${1.5 + (index % 3)}px`,
            }}
          />
        ))}
      </div>

      <div className="oracle-top">
        <div className="oracle-header">
          <p className="oracle-kicker">Your daily oracle</p>
          {onOpenSettings && (
            <button type="button" className="oracle-settings-btn" onClick={onOpenSettings} aria-label="Settings">
              <IconSettings />
            </button>
          )}
        </div>

        <div className="oracle-stage">
          <div className={`oracle-orb ${revealing || loading ? 'oracle-orb--active' : ''}`} aria-hidden="true" />

          {!answer && !revealing && (
            <div className={`oracle-input-area ${loading ? 'oracle-input-area--loading' : ''} fade-in`}>
              <p className="oracle-prompt serif">Speak your question into the cosmos...</p>
              <div className="oracle-input-wrap">
                <input
                  type="text"
                  className="oracle-input"
                  aria-label="Ask the oracle"
                  placeholder="Ask anything..."
                  value={question}
                  maxLength={280}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleAsk()}
                  disabled={loading}
                />
              </div>
              <div className="oracle-input-meta">
                <span className={`oracle-charcount ${nearLimit ? 'oracle-charcount--warn' : ''}`}>{question.length}/280</span>
              </div>
              <button type="button" className="btn-gold oracle-cta" onClick={handleAsk} disabled={loading || !question.trim()}>
                {loading ? 'Consulting the stars...' : 'Ask the Stars'}
              </button>
              <div className="oracle-suggestions">
                <span className="oracle-suggestions-label">Try:</span>
                <div className="oracle-suggestions-row">
                  {starterPrompts.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      className="oracle-chip glass"
                      onClick={() => submitQuestion(prompt)}
                      disabled={loading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              {question && (
                <button type="button" className="btn-ghost oracle-clear" onClick={handleClearDraft} disabled={loading}>
                  Clear draft
                </button>
              )}
            </div>
          )}

          {revealing && (
            <div className="oracle-revealing fade-in" role="status" aria-live="polite" aria-atomic="true">
              <p className="oracle-reveal-text serif">The stars are speaking...</p>
            </div>
          )}

          {answer && !revealing && (
            <OracleResult
              answer={answer}
              question={question}
              reducedMotion={reducedMotion}
              onReset={handleReset}
              onRetry={() => submitQuestion(question)}
              onShare={handleShare}
              shareFeedback={shareFeedback}
            />
          )}
        </div>

        <section className="oracle-daily">
          <h3 className="oracle-daily-title serif">Today's Cosmic Advice</h3>
          {daily.message && <p className="oracle-daily-message serif">{daily.message}</p>}
          {(focusLabel || cautionLabel) && (
            <div className="oracle-summary-pills" aria-label="Daily focus summary">
              {focusLabel && (
                <div className="oracle-summary-pill oracle-summary-pill--focus">
                  <span className="oracle-summary-pill-label">Focus</span>
                  <span className="oracle-summary-pill-value">{humanizeArea(focusLabel)}</span>
                </div>
              )}
              {cautionLabel && (
                <div className="oracle-summary-pill oracle-summary-pill--caution">
                  <span className="oracle-summary-pill-label">Go Gently</span>
                  <span className="oracle-summary-pill-value">{humanizeArea(cautionLabel)}</span>
                </div>
              )}
            </div>
          )}
          <p className="oracle-daily-note">
            {daily.source === 'backend'
              ? 'Built from your current chart and today\'s live system scores.'
              : 'Using a quick summary from your saved reading. Regenerate your reading for the newest daily guidance.'}
          </p>
        </section>

        <section className="dodont glass oracle-dodont-box">
          <h3 className="oracle-dodont-title serif">Do & Don't</h3>
          <div className="dodont-cols">
            <div className="dodont-col">
              <div className="dodont-hd dodont-hd--do">DO</div>
              {(daily.dos || []).map((item, index) => <p key={index} className="dodont-item dodont-item--do">{item}</p>)}
            </div>
            <div className="dodont-col">
              <div className="dodont-hd dodont-hd--dont">DON'T</div>
              {(daily.donts || []).map((item, index) => <p key={index} className="dodont-item dodont-item--dont">{item}</p>)}
            </div>
          </div>
        </section>

        {dna.length > 0 && (
          <section className="dna-section">
            <h3 className="section-hd serif">Your Cosmic DNA</h3>
            <div className="dna-scroll">
              {dna.map((item, index) => (
                <div key={index} className="dna-pill glass">
                  <span className="dna-sym">{item.sym}</span>
                  <span className="dna-val">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Questions (collapsible) */}
        {!answer && !revealing && historyItems.length > 0 && (
          <div className="v2-oracle-history">
            <button type="button" className="v2-oracle-hist-toggle" onClick={() => setHistoryOpen(!historyOpen)}>
              {historyOpen ? '\u25BC' : '\u25B6'} Recent Questions ({historyItems.length})
            </button>
            {historyOpen && historyItems.slice(0, 10).map((item, index) => (
              <div key={index} className="v2-oracle-hist-item" onClick={() => handleOpenHistory(item)}>
                <div className="v2-oracle-hist-q">{item.q}</div>
                <div className="v2-oracle-hist-a">{item.a}</div>
              </div>
            ))}
            {historyOpen && historyItems.length > 0 && (
              <button type="button" className="btn-ghost" style={{ marginTop: 8, fontSize: '.78rem' }} onClick={handleClearHistory}>
                Clear History
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
