import React, { useEffect, useRef, useState } from 'react';

import { ORACLE_HISTORY_KEY, ORACLE_HISTORY_LIMIT } from '../app/constants.js';
import {
  buildShareText,
  extractCosmicDNA,
  getDailyContent,
  getOracleTone,
  mergeOracleHistory,
  splitAnswerSentences,
} from '../app/helpers.js';
import { readStoredOracleHistory, safeSet } from '../app/storage.js';
import { apiPost } from '../app/api.js';
import { Accordion, IconChevron, IconSettings } from './common.jsx';

const STARTER_PROMPTS = [
  'What energy is around me today?',
  'What should I focus on this week?',
];

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
      const payload = await apiPost('ask', { question: trimmed, reading_data: result });
      data = payload?.answer
        ? payload
        : { answer: 'The stars are veiled tonight. Ask again when the clouds part.', areas: [], evidence: [] };
    } catch {
      data = { answer: 'The celestial connection falters. Try once more.', areas: [], evidence: [] };
    }

    setLoading(false);
    setRevealing(true);
    window.setTimeout(() => {
      setAnswer(data);
      setHistory((items) => mergeOracleHistory(
        items,
        { q: trimmed, a: data.answer, areas: data.areas || [], evidence: data.evidence || [] },
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

  const sentences = splitAnswerSentences(answer?.answer);
  const historyItems = answer ? history.slice(1) : history;
  const nearLimit = question.length >= 240;
  const daily = getDailyContent(result);
  const dna = extractCosmicDNA(result);
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
                  {STARTER_PROMPTS.map((prompt) => (
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
            <div className="oracle-answer-area glass fade-in" role="status" aria-live="polite" aria-atomic="true">
              <p className="oracle-q-echo">"{question}"</p>
              <div className="oracle-answer-text">
                {sentences.map((sentence, index) => (
                  <span key={`${sentence}-${index}`} className="oracle-sentence" style={{ animationDelay: `${index * 0.15}s` }}>
                    {sentence}{' '}
                  </span>
                ))}
              </div>

              {answer.evidence?.length > 0 && (
                <div className="oracle-evidence fade-in" style={{ animationDelay: `${sentences.length * 0.15 + 0.3}s` }}>
                  <h3 className="oracle-ev-title serif">Celestial Evidence</h3>
                  {answer.evidence.map((item, index) => {
                    const tone = getOracleTone(item.sentiment);
                    return (
                      <div key={`${item.area}-${index}`} className="oracle-ev-card glass">
                        <div className="oracle-ev-header">
                          <span className="oracle-ev-area">{item.area}</span>
                          <span className={`oracle-ev-dot oracle-ev-dot--${tone}`} />
                          <span className="oracle-ev-label">{item.label || item.sentiment}</span>
                          {item.score != null && <span className={`oracle-ev-score oracle-ev-score--${tone}`}>{item.score}%</span>}
                        </div>
                        {item.voices && <p className="oracle-ev-voices serif">{item.voices}</p>}
                        {item.leaders?.length > 0 && (
                          <div className="oracle-ev-systems-group">
                            <span className="oracle-ev-group-label">Strongest signals</span>
                            <div className="oracle-ev-chips">
                              {item.leaders.map((l, i) => (
                                <span key={i} className="oracle-ev-chip oracle-ev-chip--lead">{l.name} <span className="oracle-ev-chip-score">{l.score}</span></span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.dissenting?.length > 0 && (
                          <div className="oracle-ev-systems-group">
                            <span className="oracle-ev-group-label">Different perspective</span>
                            <div className="oracle-ev-chips">
                              {item.dissenting.map((name, i) => (
                                <span key={i} className="oracle-ev-chip oracle-ev-chip--dissent">{name}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.laggards?.length > 0 && (
                          <div className="oracle-ev-systems-group">
                            <span className="oracle-ev-group-label">Quieter voices</span>
                            <div className="oracle-ev-chips">
                              {item.laggards.map((l, i) => (
                                <span key={i} className="oracle-ev-chip oracle-ev-chip--lag">{l.name} <span className="oracle-ev-chip-score">{l.score}</span></span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="oracle-actions">
                <button type="button" className="btn-gold" onClick={handleReset}>Ask Another</button>
                <button type="button" className="btn-ghost oracle-secondary" onClick={() => submitQuestion(question)}>Retry</button>
                <button type="button" className="btn-ghost oracle-share" onClick={handleShare}>Share</button>
              </div>
              {shareFeedback && <p className="oracle-share-note" role="status">{shareFeedback}</p>}
            </div>
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
              {daily.dos.map((item, index) => <p key={index} className="dodont-item dodont-item--do">{item}</p>)}
            </div>
            <div className="dodont-col">
              <div className="dodont-hd dodont-hd--dont">DON'T</div>
              {daily.donts.map((item, index) => <p key={index} className="dodont-item dodont-item--dont">{item}</p>)}
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
      </div>
    </div>
  );
}
