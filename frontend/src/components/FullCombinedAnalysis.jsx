import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AREAS, SYSTEMS, CITIES } from '../app/constants.js';
import { scoreColor, scoreGradient } from '../app/helpers.js';
import { apiPost } from '../app/api.js';
import { IconBack } from './common.jsx';

/* ─── Scroll-triggered reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Constants ─── */
const SYS_POSITIONS = SYSTEMS.map((_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
  return { x: 50 + 38 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) };
});

const SENTIMENT_LABEL = {
  'strong positive': 'Thriving',
  'positive': 'Favorable',
  'mixed': 'Mixed Signals',
  'challenging': 'Needs Attention',
};

const SENTIMENT_ICON = {
  'strong positive': '◈',
  'positive': '◇',
  'mixed': '◬',
  'challenging': '◭',
};

/* ─── Main Component ─── */
export function FullCombinedAnalysis({ result, form, onBack }) {
  const [phase, setPhase] = useState(0);       // 0=converging, 1=ring, 2=content
  const [ringValue, setRingValue] = useState(0);
  const [constellationDrawn, setConstellationDrawn] = useState(false);

  const combined = result?.combined || {};
  const probabilities = combined.probabilities || {};
  const confidence = combined.confidence || {};
  const highlights = combined.highlights || [];
  const insights = combined.insights || [];
  const tables = combined.tables || [];

  // Overall score = average of 5 areas
  const overallScore = useMemo(() => {
    const vals = AREAS.map(a => probabilities[a.key]?.value).filter(v => v != null);
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  }, [probabilities]);

  const overallConfidence = confidence.overall || 0;

  // Build agreeing-system edges for constellation
  const constellationEdges = useMemo(() => {
    const edges = [];
    const sysMap = {};
    SYSTEMS.forEach((s, i) => { sysMap[s.name] = i; sysMap[s.name + ' Astrology'] = i; sysMap[s.id] = i; });

    for (const area of AREAS) {
      const info = probabilities[area.key];
      if (!info?.agreeing_systems) continue;
      const indices = info.agreeing_systems.map(name => {
        // Try exact, then fuzzy
        if (sysMap[name] != null) return sysMap[name];
        const lower = name.toLowerCase();
        const found = SYSTEMS.findIndex(s => lower.includes(s.id) || lower.includes(s.name.toLowerCase()));
        return found >= 0 ? found : null;
      }).filter(i => i != null);

      for (let a = 0; a < indices.length; a++) {
        for (let b = a + 1; b < indices.length; b++) {
          const key = `${Math.min(indices[a], indices[b])}-${Math.max(indices[a], indices[b])}`;
          const existing = edges.find(e => e.key === key);
          if (existing) { existing.weight++; } else { edges.push({ key, a: indices[a], b: indices[b], weight: 1 }); }
        }
      }
    }
    return edges;
  }, [probabilities]);

  // Per-system average scores
  const systemScores = useMemo(() => {
    return SYSTEMS.map(sys => {
      const sysData = result?.systems?.[sys.id];
      const sd = sysData?.scores || sysData?.probabilities;
      if (!sd) return { ...sys, avg: 50 };
      const vals = AREAS.map(a => sd[a.key]?.value).filter(v => v != null);
      const avg = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 50;
      return { ...sys, avg, headline: sysData.headline || '' };
    });
  }, [result]);

  // Phase sequencing
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2400);   // convergence done
    const t2 = setTimeout(() => setPhase(2), 3200);   // ring starts
    const t3 = setTimeout(() => setConstellationDrawn(true), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Animate ring fill
  useEffect(() => {
    if (phase < 2) return;
    let frame;
    let start;
    const duration = 1800;
    function tick(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setRingValue(Math.round(eased * overallScore));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, overallScore]);

  // Sentiment color for area
  function sentimentColor(sentiment) {
    if (sentiment === 'strong positive') return 'var(--positive, #4ADE80)';
    if (sentiment === 'positive') return 'var(--teal)';
    if (sentiment === 'mixed') return 'var(--gold)';
    return 'var(--coral)';
  }

  return (
    <div className="fca2-page">
      <button type="button" className="fca2-back" onClick={onBack} aria-label="Back">
        <IconBack /> <span>Back</span>
      </button>

      {/* ═══ HERO: Convergence Animation ═══ */}
      <section className={`fca2-hero ${phase >= 1 ? 'fca2-hero--converged' : ''}`}>
        <div className="fca2-hero-bg" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="fca2-star" style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 23 + 7) % 100}%`,
              animationDelay: `${i * 0.2}s`,
              fontSize: `${3 + (i % 4) * 2}px`,
            }}>✦</span>
          ))}
        </div>

        {/* 8 system orbs that converge */}
        <div className="fca2-orbit-ring">
          {SYSTEMS.map((sys, i) => (
            <div
              key={sys.id}
              className={`fca2-orb ${phase >= 1 ? 'fca2-orb--merged' : ''}`}
              style={{
                '--orb-color': sys.color,
                '--orb-angle': `${(i / 8) * 360 - 90}deg`,
                '--orb-delay': `${i * 0.08}s`,
                '--orb-x': `${SYS_POSITIONS[i].x}%`,
                '--orb-y': `${SYS_POSITIONS[i].y}%`,
              }}
            >
              <span className="fca2-orb-icon">{sys.icon}</span>
              <span className="fca2-orb-trail" aria-hidden="true" />
            </div>
          ))}
          {/* Center nexus */}
          <div className={`fca2-nexus ${phase >= 1 ? 'fca2-nexus--active' : ''}`}>
            <div className="fca2-nexus-core" />
            <div className="fca2-nexus-pulse" />
            <div className="fca2-nexus-pulse fca2-nexus-pulse--2" />
          </div>
        </div>

        <div className={`fca2-hero-text ${phase >= 1 ? 'fca2-hero-text--visible' : ''}`}>
          <p className="fca2-kicker">NEURO-SYMBOLIC AI ENGINE</p>
          <h1 className="fca2-title serif">Your Cosmic<br/>Intelligence Report</h1>
          <p className="fca2-subtitle">8 ancient traditions. One unified truth.</p>
        </div>
      </section>

      {/* ═══ SCORE NEXUS ═══ */}
      <section className={`fca2-score-section ${phase >= 2 ? 'fca2-reveal' : 'fca2-hidden'}`}>
        <div className="fca2-ring-wrap">
          <svg className="fca2-ring-svg" viewBox="0 0 200 200">
            {/* Glow filter */}
            <defs>
              <filter id="ringGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--gold)" />
                <stop offset="50%" stopColor="var(--teal)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle cx="100" cy="100" r="85" fill="none" stroke="var(--glass-border)" strokeWidth="6" opacity="0.3" />
            {/* Tick marks */}
            {Array.from({ length: 40 }).map((_, i) => {
              const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
              const r1 = 78, r2 = 82;
              return <line key={i} x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)} x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)} stroke="var(--muted)" strokeWidth="0.5" opacity="0.3" />;
            })}
            {/* Animated fill arc */}
            <circle cx="100" cy="100" r="85" fill="none" stroke="url(#ringGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${ringValue * 5.34} 534`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: 'url(#ringGlow)' }}
            />
          </svg>
          <div className="fca2-ring-center">
            <span className="fca2-ring-score serif">{ringValue}</span>
            <span className="fca2-ring-pct">%</span>
            <span className="fca2-ring-label">ALIGNMENT</span>
          </div>
        </div>
        {combined.headline && <h2 className="fca2-headline serif">{combined.headline}</h2>}
        <div className="fca2-confidence-badge">
          <span className="fca2-conf-dot" style={{ background: overallConfidence >= 70 ? 'var(--positive)' : overallConfidence >= 45 ? 'var(--gold)' : 'var(--coral)' }} />
          <span>{overallConfidence}% System Confidence</span>
        </div>
        {combined.summary?.[0] && <p className="fca2-summary-text">{combined.summary[0]}</p>}
        <div className="fca2-engine-tag">
          <span className="fca2-engine-dot" />
          Powered by Neuro-Symbolic AI · 8 Systems Converged
        </div>
      </section>

      {/* ═══ NEURAL CONSTELLATION ═══ */}
      <ConstellationSection
        systemScores={systemScores}
        edges={constellationEdges}
        drawn={constellationDrawn}
        overallScore={overallScore}
      />

      {/* ═══ LIFE AREA DEEP DIVES ═══ */}
      <section className="fca2-areas-section">
        <SectionHeader icon="◈" title="Life Area Intelligence" subtitle="What the cosmos is telling you right now, in plain English" />
        {AREAS.map((area, i) => (
          <AreaCard
            key={area.key}
            area={area}
            info={probabilities[area.key]}
            confidence={confidence[area.key]}
            systems={result?.systems}
            narrative={combined.area_narratives?.[area.key]}
            index={i}
          />
        ))}
      </section>

      {/* ═══ SYSTEM VOICES ═══ */}
      <section className="fca2-voices-section">
        <SectionHeader icon="⟡" title="Eight Ancient Voices" subtitle="Each tradition speaks — together they form one truth" />
        <div className="fca2-voices-grid">
          {systemScores.map((sys, i) => (
            <SystemVoiceCard key={sys.id} sys={sys} result={result} index={i} />
          ))}
        </div>
      </section>

      {/* ═══ LOVE & COMPATIBILITY ═══ */}
      <LoveCompatibilitySection form={form} />

      {/* ═══ DATA MATRIX HEATMAP ═══ */}
      <HeatmapSection systems={result?.systems} />

      {/* ═══ HIGHLIGHTS & INSIGHTS ═══ */}
      {(highlights.length > 0 || insights.length > 0) && (
        <InsightsSection highlights={highlights} insights={insights} />
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="fca2-footer">
        <div className="fca2-footer-line" />
        <div className="fca2-engine-badge-lg">
          <span className="fca2-badge-orbit" aria-hidden="true">
            {['◈', '◇', '◬', '✦'].map((c, i) => (
              <span key={i} className="fca2-badge-particle" style={{ '--bp-delay': `${i * 0.7}s`, '--bp-angle': `${i * 90}deg` }}>{c}</span>
            ))}
          </span>
          <span className="fca2-badge-text">NEURO-SYMBOLIC AI ENGINE</span>
          <span className="fca2-badge-sub">All Star Astrology · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ icon, title, subtitle }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`fca2-section-hd ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <span className="fca2-section-icon">{icon}</span>
      <h2 className="fca2-section-title serif">{title}</h2>
      {subtitle && <p className="fca2-section-sub">{subtitle}</p>}
      <div className="fca2-section-line" />
    </div>
  );
}

/* ─── Neural Constellation ─── */
function ConstellationSection({ systemScores, edges, drawn, overallScore }) {
  const [ref, visible] = useReveal(0.2);

  return (
    <section ref={ref} className={`fca2-constellation ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <SectionHeader icon="⬡" title="Neural Constellation" subtitle="How your 8 systems connect and reinforce each other" />
      <div className="fca2-constellation-wrap">
        <svg viewBox="0 0 100 100" className="fca2-constellation-svg">
          <defs>
            <filter id="edgeGlow">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Edges */}
          {drawn && edges.map((edge, i) => {
            const pa = SYS_POSITIONS[edge.a];
            const pb = SYS_POSITIONS[edge.b];
            return (
              <line key={edge.key}
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke="var(--gold)" strokeWidth={0.3 + edge.weight * 0.3}
                opacity={0.15 + edge.weight * 0.12}
                filter="url(#edgeGlow)"
                className="fca2-edge-line"
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            );
          })}
          {/* Nodes */}
          {systemScores.map((sys, i) => {
            const pos = SYS_POSITIONS[i];
            const size = 2.5 + (sys.avg / 100) * 3;
            return (
              <g key={sys.id} className="fca2-node" style={{ animationDelay: `${i * 0.1}s` }}>
                <circle cx={pos.x} cy={pos.y} r={size + 1.5} fill="none" stroke={sys.color} strokeWidth="0.3" opacity="0.3" className="fca2-node-ring" />
                <circle cx={pos.x} cy={pos.y} r={size} fill={sys.color} opacity="0.85" className="fca2-node-core" />
                <text x={pos.x} y={pos.y + 0.8} textAnchor="middle" fontSize="3" fill="white" className="fca2-node-icon">{sys.icon}</text>
                <text x={pos.x} y={pos.y + size + 4} textAnchor="middle" fontSize="2.2" fill="var(--muted)" fontWeight="500">{sys.name}</text>
                <text x={pos.x} y={pos.y + size + 6.5} textAnchor="middle" fontSize="2" fill={sys.color} fontWeight="700">{sys.avg}%</text>
              </g>
            );
          })}
          {/* Center */}
          <circle cx="50" cy="50" r="14" fill="rgba(10,10,15,0.85)" stroke="var(--gold)" strokeWidth="0.6" />
          <circle cx="50" cy="50" r="14" fill="none" stroke="var(--gold)" strokeWidth="0.3" opacity="0.4" className="fca2-center-pulse" />
          <text x="50" y="49" textAnchor="middle" fontSize="10" fill="#FFFFFF" fontWeight="700" fontFamily="var(--serif)" dominantBaseline="central">{overallScore}%</text>
          <text x="50" y="58" textAnchor="middle" fontSize="2.8" fill="var(--gold)" letterSpacing="0.8" fontWeight="600">UNIFIED</text>
        </svg>
        <p className="fca2-constellation-legend">Node size = system strength · Lines = agreement between systems</p>
      </div>
    </section>
  );
}

/* ─── Area Deep Dive Card ─── */
function AreaCard({ area, info, confidence: conf, systems, narrative, index }) {
  const [ref, visible] = useReveal(0.15);
  const [showData, setShowData] = useState(false);
  if (!info) return null;

  const value = Math.round(info.value);
  const sentiment = info.sentiment || 'mixed';
  const sLabel = SENTIMENT_LABEL[sentiment] || sentiment;
  const sIcon = SENTIMENT_ICON[sentiment] || '◇';

  // Per-system scores for this area
  const sysScores = SYSTEMS.map(sys => {
    const sd = systems?.[sys.id];
    const bucket = sd?.scores || sd?.probabilities;
    const v = bucket?.[area.key]?.value;
    return { ...sys, value: v != null ? Math.round(v) : null };
  }).filter(s => s.value != null).sort((a, b) => b.value - a.value);

  return (
    <div ref={ref} className={`fca2-area-card glass ${visible ? 'fca2-area-reveal' : 'fca2-hidden'}`} style={{ '--area-delay': `${index * 0.12}s` }}>
      {/* Header */}
      <div className="fca2-area-header">
        <div className="fca2-area-icon-wrap" style={{ '--area-color': scoreColor(value) }}>
          <span className="fca2-area-icon">{area.icon}</span>
        </div>
        <div className="fca2-area-info">
          <span className="fca2-area-name">{area.label}</span>
          <span className="fca2-area-sentiment" style={{ color: sentimentColor(sentiment) }}>{sIcon} {sLabel}</span>
        </div>
        <div className="fca2-area-score-col">
          <span className="fca2-area-score serif" style={{ color: scoreColor(value) }}>{value}%</span>
          {conf != null && <span className="fca2-area-conf">{Math.round(conf)}% agree</span>}
        </div>
      </div>

      {/* Animated bar */}
      <div className="fca2-area-bar">
        <div className="fca2-area-bar-fill" style={{ width: visible ? `${value}%` : '0%', background: scoreGradient(value), transitionDelay: `${index * 0.12 + 0.3}s` }} />
        <div className="fca2-area-bar-glow" style={{ left: visible ? `${value}%` : '0%', background: scoreColor(value), transitionDelay: `${index * 0.12 + 0.3}s` }} />
      </div>

      {/* Plain English Narrative (always visible — this is the main content) */}
      {narrative && (
        <div className="fca2-area-narrative">
          <p className="fca2-area-story">{narrative}</p>
        </div>
      )}

      {/* Data toggle */}
      <div className="fca2-area-data-toggle" onClick={() => setShowData(!showData)} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') setShowData(!showData); }}>
        <span className="fca2-area-data-label">{showData ? 'Hide' : 'View'} System Breakdown</span>
        <span className={`fca2-area-chevron ${showData ? 'fca2-area-chevron--open' : ''}`}>›</span>
      </div>

      {showData && (
        <div className="fca2-area-expanded fade-in">
          <div className="fca2-area-sys-bars">
            {sysScores.map((sys, i) => (
              <div key={sys.id} className="fca2-sys-bar-row" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="fca2-sys-bar-icon" style={{ color: sys.color }}>{sys.icon}</span>
                <span className="fca2-sys-bar-name">{sys.name}</span>
                <div className="fca2-sys-bar-track">
                  <div className="fca2-sys-bar-fill" style={{ width: `${sys.value}%`, background: sys.color, animationDelay: `${i * 0.08}s` }} />
                </div>
                <span className="fca2-sys-bar-val" style={{ color: sys.color }}>{sys.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function sentimentColor(sentiment) {
  if (sentiment === 'strong positive') return 'var(--positive, #4ADE80)';
  if (sentiment === 'positive') return 'var(--teal)';
  if (sentiment === 'mixed') return 'var(--gold)';
  return 'var(--coral)';
}

/* ─── System Voice Card ─── */
function SystemVoiceCard({ sys, result, index }) {
  const [ref, visible] = useReveal(0.1);
  const [open, setOpen] = useState(false);
  const sysData = result?.systems?.[sys.id];
  const sysHighlights = sysData?.highlights || [];
  const headline = sysData?.headline || sys.headline || '';

  return (
    <div ref={ref} className={`fca2-voice-card glass ${visible ? 'fca2-voice-reveal' : 'fca2-hidden'}`} style={{ '--voice-delay': `${index * 0.08}s`, '--sys-color': sys.color }}>
      <div className="fca2-voice-header" onClick={() => setOpen(!open)} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') setOpen(!open); }}>
        <div className="fca2-voice-icon" style={{ background: sys.color }}>{sys.icon}</div>
        <div className="fca2-voice-info">
          <span className="fca2-voice-name">{sys.name}</span>
          <span className="fca2-voice-desc">{sys.desc}</span>
        </div>
        <span className="fca2-voice-score serif" style={{ color: sys.color }}>{sys.avg}%</span>
        <span className={`fca2-voice-chevron ${open ? 'fca2-voice-chevron--open' : ''}`}>›</span>
      </div>
      {headline && <p className="fca2-voice-headline">{headline}</p>}
      {/* Score bar */}
      <div className="fca2-voice-bar">
        <div className="fca2-voice-bar-fill" style={{ width: visible ? `${sys.avg}%` : '0%', background: sys.color }} />
      </div>
      {open && sysHighlights.length > 0 && (
        <div className="fca2-voice-details fade-in">
          <div className="fca2-voice-pills">
            {sysHighlights.slice(0, 6).map((h, i) => (
              <span key={i} className="fca2-voice-pill">{h.label}: {String(h.value)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Heatmap ─── */
function HeatmapSection({ systems: sysData }) {
  const [ref, visible] = useReveal(0.1);

  const matrix = SYSTEMS.map(sys => {
    const sd = sysData?.[sys.id];
    return {
      ...sys,
      scores: AREAS.map(a => {
        const bucket = sd?.scores || sd?.probabilities;
        const v = bucket?.[a.key]?.value;
        return v != null ? Math.round(v) : null;
      }),
    };
  });

  return (
    <section ref={ref} className={`fca2-heatmap-section ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <SectionHeader icon="▦" title="System × Area Matrix" subtitle="Every score from every tradition at a glance" />
      <div className="fca2-heatmap-scroll">
        <table className="fca2-heatmap">
          <thead>
            <tr>
              <th className="fca2-hm-corner"></th>
              {AREAS.map(a => <th key={a.key} className="fca2-hm-col-hd">{a.icon}<br/>{a.label}</th>)}
              <th className="fca2-hm-col-hd">Avg</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((sys, ri) => {
              const avg = sys.scores.filter(v => v != null);
              const avgVal = avg.length ? Math.round(avg.reduce((s, v) => s + v, 0) / avg.length) : 0;
              return (
                <tr key={sys.id} className="fca2-hm-row" style={{ animationDelay: visible ? `${ri * 0.06}s` : '0s' }}>
                  <td className="fca2-hm-sys">
                    <span style={{ color: sys.color }}>{sys.icon}</span> {sys.name}
                  </td>
                  {sys.scores.map((v, ci) => (
                    <td key={ci} className="fca2-hm-cell" style={{ '--cell-hue': cellHue(v), '--cell-opacity': v != null ? 0.12 + (v / 100) * 0.35 : 0 }}>
                      {v != null ? v : '—'}
                    </td>
                  ))}
                  <td className="fca2-hm-cell fca2-hm-avg" style={{ color: scoreColor(avgVal) }}>{avgVal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function cellHue(value) {
  if (value == null) return '0';
  if (value >= 70) return '152';   // green
  if (value >= 55) return '45';    // gold
  if (value >= 40) return '35';    // amber
  return '0';                       // red
}

/* ─── Highlights & Insights ─── */
function InsightsSection({ highlights, insights }) {
  const [ref, visible] = useReveal(0.1);
  const [openInsight, setOpenInsight] = useState(null);

  return (
    <section ref={ref} className={`fca2-insights-section ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <SectionHeader icon="❖" title="Key Insights" subtitle="The most important signals from your chart" />
      {highlights.length > 0 && (
        <div className="fca2-highlights">
          {highlights.map((h, i) => (
            <div key={i} className="fca2-highlight glass" style={{ animationDelay: visible ? `${i * 0.1}s` : '0s' }}>
              <span className="fca2-hl-label">{h.label}</span>
              <span className="fca2-hl-value">{String(h.value)}</span>
            </div>
          ))}
        </div>
      )}
      {insights.length > 0 && (
        <div className="fca2-insights-list">
          {insights.map((ins, i) => (
            <div key={i} className="fca2-insight glass" onClick={() => setOpenInsight(openInsight === i ? null : i)} role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') setOpenInsight(openInsight === i ? null : i); }}>
              <div className="fca2-insight-hd">
                <span className="fca2-insight-title">{ins.title}</span>
                <span className={`fca2-insight-chevron ${openInsight === i ? 'fca2-insight-chevron--open' : ''}`}>›</span>
              </div>
              {openInsight === i && <p className="fca2-insight-text fade-in">{ins.text}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════
   LOVE & COMPATIBILITY SECTION
   ═══════════════════════════════════════════════════════════════ */

const LC_STORAGE_KEY = 'allstar-compat-partner';
const LC_RESULT_KEY = 'allstar-compat-result';
const LC_INTENT_KEY = 'allstar-compat-intent';
const SETTINGS_PARTNER_KEY = 'allstar-partner-info';
const INTENT_OPTIONS = [
  { value: 'dating', label: 'Dating', icon: '\u2728' },
  { value: 'serious', label: 'Serious', icon: '\u2764' },
  { value: 'marriage', label: 'Marriage', icon: '\uD83D\uDC8D' },
  { value: 'healing', label: 'Healing', icon: '\uD83E\uDE79' },
];

const PARTNER_BLANK = { birth_date: '', birth_time: '', birth_location: '', full_name: '' };

function _loadPartnerFromSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_PARTNER_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && p.birth_date && p.birth_time && p.birth_location) return p;
    return null;
  } catch { return null; }
}

function LoveCompatibilitySection({ form }) {
  const [ref, visible] = useReveal(0.1);
  const [mode, setMode] = useState('gate'); // gate | form | loading | results | skipped
  const [partner, setPartner] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LC_STORAGE_KEY)) || PARTNER_BLANK; } catch { return PARTNER_BLANK; }
  });
  const [compatData, setCompatData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LC_RESULT_KEY)) || null; } catch { return null; }
  });
  const [error, setError] = useState('');
  const [intent, setIntent] = useState(() => {
    try { return localStorage.getItem(LC_INTENT_KEY) || 'serious'; } catch { return 'serious'; }
  });
  const autoTriggered = useRef(false);

  // Auto-show cached results OR auto-trigger from settings partner
  useEffect(() => {
    if (compatData && partner.birth_date) {
      setMode('results');
      return;
    }
    // If no cached results, check if partner exists in Settings and auto-analyze
    if (!autoTriggered.current) {
      const settingsPartner = _loadPartnerFromSettings();
      if (settingsPartner) {
        autoTriggered.current = true;
        setPartner(settingsPartner);
        setMode('auto-loading');
      }
    }
  }, []);

  const runCompatibility = useCallback(async (partnerData) => {
    const p = partnerData || partner;
    if (!p.birth_date || !p.birth_time || !p.birth_location) {
      setError('Birth date, time, and location are required.');
      return;
    }
    setError('');
    setMode('loading');
    try {
      const body = {
        user: {
          birth_date: form.birth_date,
          birth_time: form.birth_time,
          birth_location: form.birth_location,
          full_name: form.full_name || '',
          hebrew_name: form.hebrew_name || '',
        },
        partner: {
          birth_date: p.birth_date,
          birth_time: p.birth_time,
          birth_location: p.birth_location,
          full_name: p.full_name || '',
          hebrew_name: '',
        },
        intent,
      };
      const result = await apiPost('compatibility', body);
      setCompatData(result);
      localStorage.setItem(LC_STORAGE_KEY, JSON.stringify(p));
      localStorage.setItem(LC_RESULT_KEY, JSON.stringify(result));
      setMode('results');
    } catch (err) {
      setError(err.message || 'Compatibility analysis failed.');
      setMode('form');
    }
  }, [form, partner, intent]);

  const handleSubmit = useCallback(() => runCompatibility(), [runCompatibility]);

  const handleIntentChange = useCallback((newIntent) => {
    setIntent(newIntent);
    localStorage.setItem(LC_INTENT_KEY, newIntent);
    // Clear cached results — will re-fetch with new intent on next submit
    setCompatData(null);
    localStorage.removeItem(LC_RESULT_KEY);
    // Auto re-run if we had results and have partner data
    if (partner.birth_date && partner.birth_time && partner.birth_location) {
      setMode('loading');
      // Small delay to let state settle
      setTimeout(() => runCompatibility(), 50);
    } else {
      setMode('form');
    }
  }, [partner, runCompatibility]);

  // Auto-trigger when partner loaded from settings
  useEffect(() => {
    if (mode !== 'auto-loading') return;
    const settingsPartner = _loadPartnerFromSettings();
    if (settingsPartner) {
      runCompatibility(settingsPartner);
    } else {
      setMode('gate');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleRedo = () => {
    setCompatData(null);
    localStorage.removeItem(LC_RESULT_KEY);
    setMode('form');
  };

  return (
    <section ref={ref} className={`lc-section ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <SectionHeader icon="&#x2661;" title="Love & Compatibility" subtitle="How you and your partner align across all 8 systems" />

      {mode === 'gate' && (
        <div className="lc-gate">
          <span className="lc-gate-icon">&#x2661;</span>
          <div className="lc-gate-title">Unlock Your Love Blueprint</div>
          <p className="lc-gate-sub">
            Enter your partner's birth data to reveal personality profiles, compatibility scores,
            and relationship advice from all 8 astrological traditions.
          </p>
          <div className="lc-gate-actions">
            <button className="lc-btn-primary" onClick={() => setMode('form')}>Add Partner</button>
            <button className="lc-btn-skip" onClick={() => setMode('skipped')}>I prefer not to include a partner</button>
          </div>
        </div>
      )}

      {mode === 'skipped' && (
        <div className="lc-gate">
          <span className="lc-gate-icon" style={{ opacity: 0.4 }}>&#x2661;</span>
          <p className="lc-gate-sub" style={{ marginBottom: 12 }}>
            No problem. You can add a partner anytime to unlock detailed love compatibility analysis.
          </p>
          <button className="lc-btn-skip" onClick={() => setMode('gate')}>Change my mind</button>
        </div>
      )}

      {mode === 'form' && (
        <PartnerForm
          partner={partner}
          setPartner={setPartner}
          onSubmit={handleSubmit}
          onCancel={() => setMode('gate')}
          error={error}
        />
      )}

      {(mode === 'loading' || mode === 'auto-loading') && (
        <div className="lc-loading">
          <span className="lc-loading-icon">&#x2661;</span>
          <p className="lc-loading-text">Analyzing cosmic compatibility across 8 systems...</p>
        </div>
      )}

      {mode === 'results' && compatData && (
        <LoveResults data={compatData} onRedo={handleRedo} intent={intent} onIntentChange={handleIntentChange} />
      )}
    </section>
  );
}

/* ─── Partner Entry Form ─── */
function PartnerForm({ partner, setPartner, onSubmit, onCancel, error }) {
  const update = (key, val) => setPartner(p => ({ ...p, [key]: val }));
  return (
    <div className="lc-form-overlay">
      <div className="lc-form-title">Partner's Birth Data</div>
      <div className="lc-form-grid">
        <div className="lc-field">
          <label>Name (optional)</label>
          <input type="text" placeholder="Partner's name" value={partner.full_name}
            onChange={e => update('full_name', e.target.value)} maxLength={80} />
        </div>
        <div className="lc-field">
          <label>Birth Date *</label>
          <input type="date" value={partner.birth_date}
            onChange={e => update('birth_date', e.target.value)} />
        </div>
        <div className="lc-field">
          <label>Birth Time *</label>
          <input type="time" value={partner.birth_time}
            onChange={e => update('birth_time', e.target.value)} />
        </div>
        <div className="lc-field">
          <label>Birth Location *</label>
          <input type="text" list="lc-cities" placeholder="City, State or Country"
            value={partner.birth_location}
            onChange={e => update('birth_location', e.target.value)} maxLength={160} />
          <datalist id="lc-cities">
            {CITIES.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>
      {error && <p style={{ color: 'var(--coral)', fontSize: '.7rem', textAlign: 'center', marginTop: 10 }}>{error}</p>}
      <div className="lc-form-actions">
        <button className="lc-btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="lc-btn-primary" onClick={onSubmit}>Analyze Compatibility</button>
      </div>
    </div>
  );
}

/* ─── Intent Mode Selector ─── */
function IntentSelector({ value, onChange }) {
  return (
    <div className="lc-intent-bar">
      {INTENT_OPTIONS.map(opt => (
        <button
          key={opt.value}
          className={`lc-intent-pill${value === opt.value ? ' lc-intent-pill--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          <span className="lc-intent-pill-icon">{opt.icon}</span>
          <span className="lc-intent-pill-label">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Love Results Display ─── */
function LoveResults({ data, onRedo, intent, onIntentChange }) {
  const guide = data.couple_guide || {};
  const playbook = data.relationship_playbook || {};
  const synthesis = data.tier1_synthesis || {};
  const roles = data.relationship_roles || {};
  const clash = data.when_you_clash || {};
  const systems = data.systems || {};
  const TIER1 = ['western', 'vedic', 'bazi'];
  const TIER2 = ['chinese', 'kabbalistic', 'numerology'];
  const TIER3 = ['persian', 'gematria'];
  const userName = data.user_name || 'You';
  const partnerName = data.partner_name || 'Partner';

  return (
    <div className="lc-results">
      {/* Intent selector */}
      <IntentSelector value={intent} onChange={onIntentChange} />

      {/* Verdict — no scores, just the coaching headline */}
      <div className="lc-verdict-card">
        <div className="lc-verdict-title serif">{data.verdict}</div>
        <p className="lc-verdict-prose">{data.verdict_prose}</p>
      </div>

      {/* Who You Are / Who They Are */}
      <GuideSection icon="&#x2605;" title={`Who ${userName} Is`} items={guide.who_you_are} />
      <GuideSection icon="&#x263D;" title={`Who ${partnerName} Is`} items={guide.who_they_are} />

      {/* How You Clash */}
      <GuideSection icon="&#x26A1;" title="Where You'll Clash" items={guide.how_you_clash} accent="caution" />

      {/* How to Make Each Other Happy */}
      <GuideSection icon="&#x2764;" title={`How to Make ${partnerName} Happy`} items={guide.how_to_make_them_happy} accent="positive" />
      <GuideSection icon="&#x2764;" title={`How ${partnerName} Can Make ${userName} Happy`} items={guide.how_they_make_you_happy} accent="positive" />

      {/* Living Together */}
      <GuideSection icon="&#x2302;" title="Your Guide to Co-Existing" items={guide.living_together} />

      {/* ═══ TIER 1 — Deep Compatibility Analysis ═══ */}
      <div className="lc-tier-section">
        <div className="lc-tier-header">
          <span className="lc-tier-badge lc-tier-badge--1">TIER 1</span>
          <span className="lc-tier-label serif">Deep Compatibility Analysis</span>
          <span className="lc-tier-sub">The core relationship dynamic from your strongest traditions</span>
        </div>
        {TIER1.map((sysId, i) => {
          const sys = systems[sysId];
          if (!sys) return null;
          return <TierOneCard key={sysId} sys={sys} index={i} userName={userName} partnerName={partnerName} />;
        })}
      </div>

      {/* ═══ COMBINED INSIGHT — Tier 1 Synthesis ═══ */}
      <Tier1Synthesis synthesis={synthesis} />

      {/* ═══ RELATIONSHIP ROLES & DYNAMICS ═══ */}
      <RelationshipRoles roles={roles} userName={userName} partnerName={partnerName} />

      {/* ═══ WHEN YOU CLASH ═══ */}
      <WhenYouClash clash={clash} userName={userName} partnerName={partnerName} />

      {/* ═══ TIER 2 — Supporting Insights ═══ */}
      <div className="lc-tier-section">
        <div className="lc-tier-header">
          <span className="lc-tier-badge lc-tier-badge--2">TIER 2</span>
          <span className="lc-tier-label serif">Supporting Insights</span>
          <span className="lc-tier-sub">Personality and energy layers that reinforce or contrast the core reading</span>
        </div>
        {TIER2.map((sysId, i) => {
          const sys = systems[sysId];
          if (!sys) return null;
          return <TierTwoCard key={sysId} sys={sys} index={i} />;
        })}
      </div>

      {/* ═══ TIER 3 — Symbolic Layer ═══ */}
      <div className="lc-tier-section">
        <div className="lc-tier-header">
          <span className="lc-tier-badge lc-tier-badge--3">TIER 3</span>
          <span className="lc-tier-label serif">Symbolic Layer</span>
          <span className="lc-tier-sub">Short, intuitive impressions from the symbolic traditions</span>
        </div>
        <div className="lc-tier3-row">
          {TIER3.map((sysId, i) => {
            const sys = systems[sysId];
            if (!sys) return null;
            return <TierThreeCard key={sysId} sys={sys} index={i} />;
          })}
        </div>
      </div>

      {/* ═══ RELATIONSHIP PLAYBOOK ═══ */}
      <RelationshipPlaybook playbook={playbook} userName={userName} partnerName={partnerName} />

      <button className="lc-redo-btn" onClick={onRedo}>Change Partner</button>
    </div>
  );
}

/* ─── Guide Section (narrative block) ─── */
function GuideSection({ icon, title, items, accent }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="cg-section">
      <div className={`cg-section-header serif ${accent || ''}`}>{icon} {title}</div>
      {items.map((item, i) => <p key={i} className="cg-item">{item}</p>)}
    </div>
  );
}

/* ─── Helpers: text truncation and dedup ─── */
function _truncate(text, max = 400) {
  if (!text || text.length <= max) return text || '';
  const cut = text.lastIndexOf('.', max);
  return (cut > max * 0.6 ? text.slice(0, cut + 1) : text.slice(0, max)) + '...';
}
function _filterNoSignal(items) {
  return (items || []).filter(s => s && s !== 'No specific signals detected.' && s.length > 3);
}

/* ─── Tier 1: Deep Analysis Card (expanded, ~8 sentences of guidance) ─── */
function TierOneCard({ sys, index, userName, partnerName }) {
  const [ref, visible] = useReveal(0.1);
  const [open, setOpen] = useState(true);

  if (!sys) return null;
  const strengths = _filterNoSignal(sys.strengths);
  const challenges = _filterNoSignal(sys.challenges);
  const dynamic = _truncate(sys.dynamic, 500);
  const advice = _truncate(sys.advice, 600);

  return (
    <div ref={ref} className={`lc-t1-card ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}
      style={{ '--lc-sys-color': sys.color || '#888', '--lc-delay': `${index * 0.1}s` }}>
      <div className="lc-t1-header" onClick={() => setOpen(!open)} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') setOpen(!open); }}>
        <div className="lc-t1-icon" style={{ background: sys.color || '#888' }}>{sys.icon || '?'}</div>
        <div className="lc-t1-info">
          <span className="lc-t1-name serif">{sys.label || 'System'}</span>
          {sys.relationship_type && <span className="lc-t1-rel-type">{sys.relationship_type}</span>}
        </div>
        <span className={`lc-t1-chevron ${open ? 'lc-t1-chevron--open' : ''}`}>&#x203A;</span>
      </div>

      {open && (
        <div className="lc-t1-body fade-in">
          {dynamic && <div className="lc-t1-dynamic">{dynamic}</div>}

          {strengths.length > 0 && (
            <div className="lc-t1-block">
              <div className="lc-t1-block-title">What Works Between You</div>
              {strengths.slice(0, 4).map((s, i) => <p key={i} className="lc-t1-item lc-t1-item--positive">{_truncate(s, 200)}</p>)}
            </div>
          )}

          {challenges.length > 0 && (
            <div className="lc-t1-block">
              <div className="lc-t1-block-title lc-t1-block-title--caution">Where to Be Careful</div>
              {challenges.slice(0, 3).map((c, i) => <p key={i} className="lc-t1-item lc-t1-item--caution">{_truncate(c, 200)}</p>)}
            </div>
          )}

          {advice && (
            <div className="lc-t1-advice">
              <div className="lc-t1-advice-label">How to Thrive Together</div>
              <p className="lc-t1-advice-text">{advice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Tier 2: Supporting Insight Card (~4 sentences) ─── */
function TierTwoCard({ sys, index }) {
  const [ref, visible] = useReveal(0.1);

  if (!sys) return null;
  const strengths = _filterNoSignal(sys.strengths);
  const challenges = _filterNoSignal(sys.challenges);
  const dynamic = _truncate(sys.dynamic, 250);

  // Pick the first strength/challenge that doesn't duplicate the dynamic
  const topStrength = strengths.find(s => !dynamic.includes(s.slice(0, 30))) || strengths[0];
  const topChallenge = challenges.find(c => !dynamic.includes(c.slice(0, 30))) || challenges[0];

  return (
    <div ref={ref} className={`lc-t2-card ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}
      style={{ '--lc-sys-color': sys.color || '#888', '--lc-delay': `${index * 0.08}s` }}>
      <div className="lc-t2-header">
        <div className="lc-t2-icon" style={{ background: sys.color || '#888' }}>{sys.icon || '?'}</div>
        <span className="lc-t2-name serif">{sys.label || 'System'}</span>
        {sys.relationship_type && <span className="lc-t2-rel-type">{sys.relationship_type}</span>}
      </div>
      {dynamic && <p className="lc-t2-dynamic">{dynamic}</p>}
      {topStrength && (
        <p className="lc-t2-insight lc-t2-insight--positive">{_truncate(topStrength, 150)}</p>
      )}
      {topChallenge && (
        <p className="lc-t2-insight lc-t2-insight--caution">{_truncate(topChallenge, 150)}</p>
      )}
    </div>
  );
}

/* ─── Tier 3: Symbolic Layer Card (~2 sentences) ─── */
function TierThreeCard({ sys, index }) {
  const [ref, visible] = useReveal(0.1);

  if (!sys) return null;
  const dynamic = _truncate(sys.dynamic, 180);

  return (
    <div ref={ref} className={`lc-t3-card ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}
      style={{ '--lc-sys-color': sys.color || '#888', '--lc-delay': `${index * 0.08}s` }}>
      <div className="lc-t3-header">
        <span className="lc-t3-icon" style={{ color: sys.color || '#888' }}>{sys.icon || '?'}</span>
        <span className="lc-t3-name">{sys.label || 'System'}</span>
      </div>
      {dynamic ? <p className="lc-t3-text">{dynamic}</p> : <p className="lc-t3-text" style={{ opacity: 0.5 }}>Symbolic layer data unavailable for this pairing.</p>}
    </div>
  );
}

/* ─── Tier 1 Synthesis (combined insight narrative) ─── */
function Tier1Synthesis({ synthesis }) {
  const [ref, visible] = useReveal(0.1);
  if (!synthesis?.narrative) return null;

  const paragraphs = synthesis.narrative.split('\n\n').filter(p => p.trim());

  return (
    <div ref={ref} className={`lc-synthesis ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <div className="lc-synthesis-header">
        <span className="lc-synthesis-icon">&#x2726;</span>
        <span className="lc-synthesis-title serif">The Full Picture</span>
        <span className="lc-synthesis-sub">What all three core traditions reveal when they speak as one</span>
      </div>
      <div className="lc-synthesis-body">
        {paragraphs.map((p, i) => (
          <p key={i} className="lc-synthesis-para">{p}</p>
        ))}
      </div>
    </div>
  );
}

/* ─── Relationship Roles & Dynamics ─── */
function RelationshipRoles({ roles, userName, partnerName }) {
  const [ref, visible] = useReveal(0.1);
  if (!roles?.narrative) return null;

  return (
    <div ref={ref} className={`lc-roles ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <div className="lc-roles-header">
        <span className="lc-roles-header-icon">&#x2694;</span>
        <span className="lc-roles-title serif">Relationship Roles &amp; Dynamics</span>
      </div>
      <div className="lc-roles-badges">
        <div className="lc-roles-badge">
          <span className="lc-roles-name">{userName || 'You'}</span>
          <span className="lc-roles-label serif">{roles.user_role}</span>
          {roles.user_nuance && (
            <span className="lc-roles-nuance">+ traits of {roles.user_nuance}</span>
          )}
        </div>
        <span className="lc-roles-link">&#x21C4;</span>
        <div className="lc-roles-badge">
          <span className="lc-roles-name">{partnerName || 'Partner'}</span>
          <span className="lc-roles-label serif">{roles.partner_role}</span>
          {roles.partner_nuance && (
            <span className="lc-roles-nuance">+ traits of {roles.partner_nuance}</span>
          )}
        </div>
      </div>
      <p className="lc-roles-narrative">{roles.narrative}</p>
    </div>
  );
}

/* ─── When You Clash (conflict dynamics) ─── */
function WhenYouClash({ clash, userName, partnerName }) {
  const [ref, visible] = useReveal(0.1);
  if (!clash?.narrative) return null;

  return (
    <div ref={ref} className={`lc-clash ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <div className="lc-clash-header">
        <span className="lc-clash-icon">&#x26A0;</span>
        <span className="lc-clash-title serif">When You Clash</span>
        <span className="lc-clash-sub">How conflict plays out between you — and how to stop it</span>
      </div>
      <p className="lc-clash-narrative">{clash.narrative}</p>
    </div>
  );
}

/* ─── Relationship Playbook (final coaching section) ─── */
function RelationshipPlaybook({ playbook, userName, partnerName }) {
  const [ref, visible] = useReveal(0.1);
  const pb = playbook || {};

  if (!pb.what_works && !pb.daily_behaviors?.length) return null;

  return (
    <div ref={ref} className={`lc-playbook ${visible ? 'fca2-reveal' : 'fca2-hidden'}`}>
      <div className="lc-playbook-header">
        <span className="lc-playbook-icon">&#x1F3AF;</span>
        <span className="lc-playbook-title serif">Your Relationship Playbook</span>
        <span className="lc-playbook-sub">Final instructions — not analysis. Follow these.</span>
      </div>

      {pb.what_works && (
        <div className="lc-pb-section">
          <div className="lc-pb-label lc-pb-label--positive">What Makes This Relationship Work</div>
          <p className="lc-pb-text">{_truncate(pb.what_works, 400)}</p>
        </div>
      )}

      {pb.what_breaks && (
        <div className="lc-pb-section">
          <div className="lc-pb-label lc-pb-label--caution">What Will Break It If Ignored</div>
          <p className="lc-pb-text">{_truncate(pb.what_breaks, 400)}</p>
        </div>
      )}

      {pb.daily_behaviors?.length > 0 && (
        <div className="lc-pb-section">
          <div className="lc-pb-label">Top 3 Daily Behaviors</div>
          <div className="lc-pb-behaviors">
            {pb.daily_behaviors.slice(0, 3).map((b, i) => (
              <div key={i} className="lc-pb-behavior">
                <span className="lc-pb-num">{i + 1}</span>
                <p className="lc-pb-behavior-text">{_truncate(b, 300)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pb.top_mistake && (
        <div className="lc-pb-section lc-pb-mistake">
          <div className="lc-pb-label lc-pb-label--danger">The #1 Mistake to Avoid</div>
          <p className="lc-pb-text">{_truncate(pb.top_mistake, 350)}</p>
        </div>
      )}

      {pb.long_term && (
        <div className="lc-pb-section">
          <div className="lc-pb-label lc-pb-label--peace">Long-Term Peace &amp; Happiness</div>
          <p className="lc-pb-text">{_truncate(pb.long_term, 400)}</p>
        </div>
      )}
    </div>
  );
}
