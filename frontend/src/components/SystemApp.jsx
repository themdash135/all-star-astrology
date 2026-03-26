import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AREAS, SYSTEM_PAGES, SYSTEMS } from '../app/constants.js';
import {
  getConfidenceBadge,
  getSystemAgreement,
  getSystemInsightsByArea,
  scoreColor,
  scoreGradient,
  systemAvgScore,
} from '../app/helpers.js';
import { Accordion, DataCards, IconBack } from './common.jsx';
import { SystemCalendarTab } from './SystemCalendarTab.jsx';
import { SystemGamesTab } from './SystemGamesTab.jsx';


/* ═══════════════════════════════════════════════════════
   Helper: extract a highlight value from the data
   ═══════════════════════════════════════════════════════ */
function hl(data, ...patterns) {
  const highlights = data?.highlights;
  if (!highlights) return null;
  for (const h of highlights) {
    const label = h.label.toLowerCase();
    if (patterns.some((p) => label.includes(p))) return String(h.value);
  }
  return null;
}

/* ═══════════════════════════════════════════════════════
   Helper: extract a table from the data by title pattern
   ═══════════════════════════════════════════════════════ */
function findTable(data, ...patterns) {
  const tables = data?.tables;
  if (!tables) return null;
  for (const t of tables) {
    const title = t.title.toLowerCase();
    if (patterns.some((p) => title.includes(p))) return t;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════
   Animated circular score gauge (SVG)
   ═══════════════════════════════════════════════════════ */
function ScoreGauge({ value, color, size = 120, strokeWidth = 8, label, delay = 0 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="sa-gauge" style={{ width: size, height: size, animationDelay: `${delay}s` }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="sa-gauge-svg">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--glass-border)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="sa-gauge-ring"
          style={{ '--gauge-offset': offset, '--gauge-circ': circumference, animationDelay: `${delay + 0.3}s` }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="sa-gauge-inner">
        <span className="sa-gauge-value serif" style={{ color, fontSize: size > 80 ? '1.8rem' : '1rem' }}>{value}</span>
        {label && <span className="sa-gauge-label">{label}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Mini circular gauge for insight cards
   ═══════════════════════════════════════════════════════ */
function MiniGauge({ value, color, size = 44, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="sa-mini-gauge" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--glass-border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="sa-gauge-ring"
          style={{ '--gauge-offset': offset, '--gauge-circ': circumference, animationDelay: '0.4s' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="sa-mini-gauge-val" style={{ color, fontSize: '.72rem' }}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Floating particles background
   ═══════════════════════════════════════════════════════ */
function Particles({ color, count = 12 }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    }));
  }, [count]);

  return (
    <div className="sa-particles" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="sa-particle"
          style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            background: color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   System-specific "flavor" badge for Overview
   ═══════════════════════════════════════════════════════ */
function SystemFlavor({ data, systemId, color }) {
  switch (systemId) {
    case 'western': {
      const sun = hl(data, 'sun');
      const moon = hl(data, 'moon');
      const rising = hl(data, 'rising', 'ascendant', 'asc');
      if (!sun && !moon && !rising) return null;
      return (
        <div className="sa-flavor sa-flavor-trifecta">
          {sun && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u2609'}</span><span className="sa-flavor-lbl">Sun</span><span className="sa-flavor-val">{sun}</span></div>}
          {moon && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u263D'}</span><span className="sa-flavor-lbl">Moon</span><span className="sa-flavor-val">{moon}</span></div>}
          {rising && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u2191'}</span><span className="sa-flavor-lbl">Rising</span><span className="sa-flavor-val">{rising}</span></div>}
        </div>
      );
    }
    case 'vedic': {
      const nakshatra = hl(data, 'nakshatra', 'birth star');
      const moonSign = hl(data, 'moon', 'rashi');
      const ascendant = hl(data, 'ascendant', 'lagna');
      if (!nakshatra && !moonSign && !ascendant) return null;
      return (
        <div className="sa-flavor sa-flavor-trifecta">
          {moonSign && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u263D'}</span><span className="sa-flavor-lbl">Rashi</span><span className="sa-flavor-val">{moonSign}</span></div>}
          {nakshatra && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u2728'}</span><span className="sa-flavor-lbl">Nakshatra</span><span className="sa-flavor-val">{nakshatra}</span></div>}
          {ascendant && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u2191'}</span><span className="sa-flavor-lbl">Lagna</span><span className="sa-flavor-val">{ascendant}</span></div>}
        </div>
      );
    }
    case 'chinese': {
      const animal = hl(data, 'animal', 'zodiac', 'sign');
      const element = hl(data, 'element');
      const yin = hl(data, 'polarity', 'yin', 'yang');
      return (
        <div className="sa-flavor sa-flavor-chinese">
          {animal && (
            <div className="sa-flavor-animal-card" style={{ '--pill-color': color }}>
              <span className="sa-flavor-animal-icon">{'\uD83D\uDC09'}</span>
              <span className="sa-flavor-animal-name serif">{animal}</span>
              {element && <span className="sa-flavor-element-badge">{element}</span>}
              {yin && <span className="sa-flavor-polarity">{yin}</span>}
            </div>
          )}
        </div>
      );
    }
    case 'bazi': {
      const p = data?.pillars?.day;
      const str = data?.day_master_strength;
      if (!p) {
        const dayMaster = hl(data, 'day master', 'day stem', 'day element');
        if (!dayMaster) return null;
        return (
          <div className="sa-flavor sa-flavor-bazi">
            <div className="sa-flavor-daymaster" style={{ '--pill-color': color }}>
              <span className="sa-flavor-dm-char serif">{'\u67F1'}</span>
              <div className="sa-flavor-dm-info">
                <span className="sa-flavor-dm-label">Day Master</span>
                <span className="sa-flavor-dm-value serif">{dayMaster}</span>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="sa-flavor sa-flavor-bazi">
          <div className="sa-flavor-daymaster" style={{ '--pill-color': p.stem_color || color }}>
            <span className="sa-flavor-dm-char serif" style={{ color: p.stem_color }}>{p.stem_chinese}</span>
            <div className="sa-flavor-dm-info">
              <span className="sa-flavor-dm-label">Day Master</span>
              <span className="sa-flavor-dm-value serif">{p.stem} {p.stem_element}</span>
            </div>
          </div>
          {str && (
            <div className="sa-flavor-pill" style={{ '--pill-color': str.strong ? '#4caf50' : '#ff9800' }}>
              <span className="sa-flavor-lbl">Strength</span>
              <span className="sa-flavor-val">{str.strength_label}</span>
            </div>
          )}
        </div>
      );
    }
    case 'numerology': {
      const lifePath = hl(data, 'life path');
      const personalYear = hl(data, 'personal year');
      const personalDay = hl(data, 'personal day');
      return (
        <div className="sa-flavor sa-flavor-numerology">
          {lifePath && (
            <div className="sa-flavor-number-hero" style={{ '--pill-color': color }}>
              <span className="sa-flavor-number-big serif">{lifePath}</span>
              <span className="sa-flavor-number-label">Life Path</span>
            </div>
          )}
          <div className="sa-flavor-number-row">
            {personalYear && <div className="sa-flavor-number-sm" style={{ '--pill-color': color }}><span className="sa-flavor-number-sm-val serif">{personalYear}</span><span className="sa-flavor-number-sm-lbl">Personal Year</span></div>}
            {personalDay && <div className="sa-flavor-number-sm" style={{ '--pill-color': color }}><span className="sa-flavor-number-sm-val serif">{personalDay}</span><span className="sa-flavor-number-sm-lbl">Personal Day</span></div>}
          </div>
        </div>
      );
    }
    case 'kabbalistic': {
      const sephirah = hl(data, 'sephir', 'sefirah', 'sefirot', 'active');
      const path = hl(data, 'path', 'active path');
      if (!sephirah) return null;
      return (
        <div className="sa-flavor sa-flavor-kabbalistic">
          <div className="sa-flavor-sephirah" style={{ '--pill-color': color }}>
            <span className="sa-flavor-sephirah-glow">{'\u2721'}</span>
            <span className="sa-flavor-sephirah-name serif">{sephirah}</span>
            <span className="sa-flavor-sephirah-label">Active Sephirah</span>
          </div>
          {path && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-lbl">Path</span><span className="sa-flavor-val">{path}</span></div>}
        </div>
      );
    }
    case 'gematria': {
      const value = hl(data, 'total', 'gematria value', 'hebrew value');
      const latin = hl(data, 'latin', 'simple');
      return (
        <div className="sa-flavor sa-flavor-gematria">
          {value && (
            <div className="sa-flavor-number-hero" style={{ '--pill-color': color }}>
              <span className="sa-flavor-number-big serif">{value}</span>
              <span className="sa-flavor-number-label">Hebrew Value</span>
            </div>
          )}
          {latin && (
            <div className="sa-flavor-pill" style={{ '--pill-color': color }}>
              <span className="sa-flavor-lbl">Latin Value</span>
              <span className="sa-flavor-val">{latin}</span>
            </div>
          )}
        </div>
      );
    }
    case 'persian': {
      const day = hl(data, 'planetary day', 'ruling planet', 'day ruler');
      const mansion = hl(data, 'mansion', 'lunar mansion');
      const temperament = hl(data, 'temperament', 'mizaj');
      return (
        <div className="sa-flavor sa-flavor-persian">
          {day && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u263D'}</span><span className="sa-flavor-lbl">Ruler</span><span className="sa-flavor-val">{day}</span></div>}
          {mansion && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u2606'}</span><span className="sa-flavor-lbl">Mansion</span><span className="sa-flavor-val">{mansion}</span></div>}
          {temperament && <div className="sa-flavor-pill" style={{ '--pill-color': color }}><span className="sa-flavor-sym">{'\u2668'}</span><span className="sa-flavor-lbl">Temperament</span><span className="sa-flavor-val">{temperament}</span></div>}
        </div>
      );
    }
    default:
      return null;
  }
}


/* ═══════════════════════════════════════════════════════
   SVG Charts for chart-capable systems
   ═══════════════════════════════════════════════════════ */

/* Western natal chart wheel */
function WesternChart({ data, color }) {
  const table = findTable(data, 'planet');
  const planets = table?.rows || [];
  const signs = ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];
  const signNames = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const cx = 150, cy = 150, outerR = 140, midR = 110, innerR = 75;

  // Map planet signs to positions
  const planetPositions = planets.map((row, i) => {
    const name = row[0] || '';
    const sign = row[1] || '';
    const signIdx = signNames.findIndex(s => sign.toLowerCase().includes(s.toLowerCase()));
    const angle = signIdx >= 0 ? (signIdx * 30 + 15 + (i * 7) % 25) : (i * 45);
    const rad = (angle - 90) * (Math.PI / 180);
    return { name, sign, x: cx + innerR * 0.82 * Math.cos(rad), y: cy + innerR * 0.82 * Math.sin(rad), angle };
  });

  return (
    <div className="sa-chart-wrap">
      <svg viewBox="0 0 300 300" className="sa-chart-svg sa-chart-western">
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={color} strokeWidth="1.5" opacity="0.3" className="sa-chart-draw" />
        <circle cx={cx} cy={cy} r={midR} fill="none" stroke={color} strokeWidth="1" opacity="0.2" className="sa-chart-draw" />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={color} strokeWidth="1" opacity="0.15" className="sa-chart-draw" />

        {/* House lines */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          return (
            <line
              key={i}
              x1={cx + innerR * Math.cos(angle)}
              y1={cy + innerR * Math.sin(angle)}
              x2={cx + outerR * Math.cos(angle)}
              y2={cy + outerR * Math.sin(angle)}
              stroke={color}
              strokeWidth="0.8"
              opacity="0.2"
              className="sa-chart-draw"
            />
          );
        })}

        {/* Zodiac signs on outer ring */}
        {signs.map((s, i) => {
          const angle = (i * 30 + 15 - 90) * (Math.PI / 180);
          const sx = cx + (outerR + midR) / 2 * Math.cos(angle);
          const sy = cy + (outerR + midR) / 2 * Math.sin(angle);
          return (
            <text
              key={i} x={sx} y={sy}
              textAnchor="middle" dominantBaseline="central"
              fill={color} fontSize="12" opacity="0.6"
              className="sa-chart-text"
            >{s}</text>
          );
        })}

        {/* Planet positions */}
        {planetPositions.map((p, i) => (
          <g key={i} className="sa-chart-planet" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
            <circle cx={p.x} cy={p.y} r="12" fill={color} opacity="0.15" />
            <circle cx={p.x} cy={p.y} r="3" fill={color} opacity="0.8" />
            <text
              x={p.x} y={p.y - 16}
              textAnchor="middle"
              fill="var(--text)"
              fontSize="7"
              fontWeight="600"
              opacity="0.9"
            >{p.name.slice(0, 3)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* Vedic Kundli diamond chart (South Indian style) */
function VedicChart({ data, color }) {
  const table = findTable(data, 'planet');
  const planets = table?.rows || [];
  // South Indian chart: 12 compartments in a grid pattern
  // Layout positions for a diamond/south Indian chart
  const cells = [
    { x: 75, y: 0, w: 75, h: 75 },   // 1 - Pisces
    { x: 0, y: 0, w: 75, h: 75 },     // 2 - Aries
    { x: 0, y: 75, w: 75, h: 75 },    // 3 - Taurus
    { x: 0, y: 150, w: 75, h: 75 },   // 4 - Gemini
    { x: 75, y: 150, w: 75, h: 75 },  // 5 - Cancer
    { x: 150, y: 150, w: 75, h: 75 }, // 6 - Leo
    { x: 225, y: 150, w: 75, h: 75 }, // 7 - Virgo
    { x: 225, y: 75, w: 75, h: 75 },  // 8 - Libra
    { x: 225, y: 0, w: 75, h: 75 },   // 9 - Scorpio
    { x: 150, y: 0, w: 75, h: 75 },   // 10 - Sagittarius
    { x: 150, y: 75, w: 75, h: 75 },  // 11 - Capricorn
    { x: 75, y: 75, w: 75, h: 75 },   // 12 - Aquarius
  ];
  const siderealSigns = ['Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius'];

  // Assign planets to houses
  const housePlanets = Array.from({ length: 12 }, () => []);
  planets.forEach((row) => {
    const sign = (row[1] || '').toLowerCase();
    const idx = siderealSigns.findIndex(s => sign.includes(s.toLowerCase()));
    if (idx >= 0) housePlanets[idx].push(row[0]?.slice(0, 3) || '');
  });

  return (
    <div className="sa-chart-wrap">
      <svg viewBox="0 0 300 225" className="sa-chart-svg sa-chart-vedic">
        {cells.map((c, i) => (
          <g key={i} className="sa-chart-draw" style={{ animationDelay: `${i * 0.05}s` }}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={color} fillOpacity="0.04" stroke={color} strokeWidth="1" strokeOpacity="0.3" rx="2" />
            {/* Diagonal lines for South Indian style */}
            {(i === 0 || i === 4 || i === 6 || i === 10) && (
              <line x1={c.x} y1={c.y} x2={c.x + c.w} y2={c.y + c.h} stroke={color} strokeWidth="0.5" strokeOpacity="0.15" />
            )}
            <text x={c.x + 5} y={c.y + 12} fill={color} fontSize="7" opacity="0.5">{siderealSigns[i].slice(0, 3)}</text>
            {housePlanets[i].map((p, j) => (
              <text
                key={j}
                x={c.x + c.w / 2}
                y={c.y + 30 + j * 14}
                textAnchor="middle"
                fill="var(--text)"
                fontSize="9"
                fontWeight="600"
                className="sa-chart-text"
              >{p}</text>
            ))}
          </g>
        ))}
        {/* Center label */}
        <text x="150" y="118" textAnchor="middle" fill={color} fontSize="9" fontWeight="600" opacity="0.5">KUNDLI</text>
      </svg>
    </div>
  );
}

/* BaZi Rich Four Pillars + Element Balance + Stars + Luck Periods */
function BaZiChart({ data, color }) {
  const [baziTab, setBaziTab] = useState('pillars');
  const pillars = data?.pillars;
  const currentPillars = data?.current_pillars;
  const balance = data?.element_balance;
  const strength = data?.day_master_strength;
  const profile = data?.day_master_profile;
  const stars = data?.symbolic_stars || [];
  const luckPeriods = data?.luck_periods || [];
  const currentLuck = data?.current_luck_period;
  const interactions = data?.branch_interactions || [];
  const age = data?.age || 0;

  // Fallback to table data if enriched data not present
  if (!pillars) {
    const tbl = findTable(data, 'pillar', 'four pillar');
    const rows = tbl?.rows || [];
    const pillarLabels = ['Year', 'Month', 'Day', 'Hour'];
    const fallback = rows.length > 0
      ? rows.map((r, i) => ({ label: r[0] || pillarLabels[i], stem: r[1] || '—', branch: r[2] || '—' }))
      : pillarLabels.map((l) => ({ label: l, stem: '—', branch: '—' }));
    return (
      <div className="sa-chart-wrap">
        <div className="sa-bazi-pillars">
          {fallback.map((p, i) => (
            <div key={i} className="sa-bazi-pillar stagger" style={{ animationDelay: `${i * 0.12}s`, '--sys-color': color }}>
              <div className="sa-bazi-pillar-label">{p.label}</div>
              <div className="sa-bazi-pillar-stem serif">{p.stem}</div>
              <div className="sa-bazi-pillar-divider" style={{ background: color }} />
              <div className="sa-bazi-pillar-branch serif">{p.branch}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'pillars', label: 'Pillars' },
    { id: 'elements', label: 'Elements' },
    { id: 'profile', label: 'Day Master' },
    { id: 'stars', label: 'Stars' },
    { id: 'luck', label: 'Luck Periods' },
  ];

  return (
    <div className="bz-rich">
      {/* Sub-tabs */}
      <div className="bz-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`bz-tab${baziTab === t.id ? ' bz-tab--active' : ''}`}
            style={{ '--bz-accent': color }}
            onClick={() => setBaziTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {/* ── PILLARS TAB ── */}
      {baziTab === 'pillars' && (
        <div className="bz-section fade-in">
          {/* Natal Pillars */}
          <div className="bz-pillar-label-row">
            <span className="bz-section-badge">Natal Chart</span>
          </div>
          <div className="bz-pillars-grid">
            {['hour', 'day', 'month', 'year'].map((key, i) => {
              const p = pillars[key];
              const isDay = key === 'day';
              return (
                <div key={key} className={`bz-pillar-card stagger${isDay ? ' bz-pillar-card--dm' : ''}`} style={{ animationDelay: `${i * 0.1}s`, '--stem-color': p.stem_color, '--branch-color': p.branch_color }}>
                  <div className="bz-pillar-header">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                  <div className="bz-pillar-tg">{p.ten_god_chinese} {p.ten_god}</div>
                  <div className="bz-pillar-stem-box" style={{ borderColor: p.stem_color }}>
                    <span className="bz-pillar-chinese serif">{p.stem_chinese}</span>
                    <span className="bz-pillar-pinyin">{p.stem}</span>
                    <span className="bz-pillar-element-badge" style={{ background: p.stem_color }}>{p.stem_element} {p.stem_polarity}</span>
                  </div>
                  <div className="bz-pillar-branch-box" style={{ borderColor: p.branch_color }}>
                    <span className="bz-pillar-chinese serif">{p.branch_chinese}</span>
                    <span className="bz-pillar-pinyin">{p.branch} · {p.animal}</span>
                    <span className="bz-pillar-element-badge" style={{ background: p.branch_color }}>{p.branch_element}</span>
                  </div>
                  {/* Hidden stems */}
                  <div className="bz-hidden-stems">
                    {p.hidden_stems.map((h, hi) => (
                      <div key={hi} className="bz-hidden-stem" title={`${h.stem} — ${h.ten_god}`}>
                        <span className="bz-hs-chinese">{h.chinese}</span>
                        <span className="bz-hs-name">{h.stem}</span>
                        <span className="bz-hs-tg">{h.ten_god}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bz-pillar-nayin">{p.na_yin}</div>
                  {isDay && <div className="bz-dm-badge" style={{ background: color }}>Day Master</div>}
                </div>
              );
            })}
          </div>

          {/* Branch interactions */}
          {interactions.length > 0 && (
            <div className="bz-interactions">
              <h4 className="bz-sub-title">Branch Interactions</h4>
              <div className="bz-interaction-list">
                {interactions.map((ix, i) => (
                  <div key={i} className={`bz-interaction-pill${ix.positive ? ' bz-ix-pos' : ' bz-ix-neg'}`}>
                    <span className="bz-ix-type">{ix.chinese} {ix.label}</span>
                    <span className="bz-ix-detail">{ix.pillars} ({ix.branches})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current transit pillars */}
          {currentPillars && (
            <div className="bz-current-section">
              <div className="bz-pillar-label-row">
                <span className="bz-section-badge bz-section-badge--transit">Current Transit</span>
              </div>
              <div className="bz-pillars-grid bz-pillars-grid--sm">
                {['hour', 'day', 'month', 'year'].map((key, i) => {
                  const p = currentPillars[key];
                  return (
                    <div key={key} className="bz-transit-card stagger" style={{ animationDelay: `${i * 0.08}s`, '--stem-color': p.stem_color, '--branch-color': p.branch_color }}>
                      <div className="bz-transit-header">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                      <div className="bz-transit-chinese serif">{p.stem_chinese}{p.branch_chinese}</div>
                      <div className="bz-transit-info">{p.stem} {p.branch}</div>
                      <div className="bz-transit-tg">{p.ten_god}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ELEMENTS TAB ── */}
      {baziTab === 'elements' && balance && (
        <div className="bz-section fade-in">
          {/* Element balance bars */}
          <h4 className="bz-sub-title">Element Distribution</h4>
          <div className="bz-element-bars">
            {Object.entries(balance.percentages).map(([el, pct], i) => (
              <div key={el} className="bz-el-row stagger" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="bz-el-name">{el}</span>
                <div className="bz-el-track">
                  <div className="bz-el-fill bar-anim" style={{ width: `${pct}%`, background: balance.colors[el], animationDelay: `${i * 0.1 + 0.2}s` }} />
                </div>
                <span className="bz-el-pct" style={{ color: balance.colors[el] }}>{pct}%</span>
              </div>
            ))}
          </div>

          {/* Supporting vs Opposing */}
          {strength && (
            <div className="bz-strength-section">
              <h4 className="bz-sub-title">Day Master Strength</h4>
              <div className="bz-strength-bar-wrap">
                <div className="bz-strength-bar">
                  <div className="bz-str-fill bz-str-support" style={{ width: `${strength.support_pct}%` }}>
                    <span>{strength.support_pct}%</span>
                  </div>
                  <div className="bz-str-fill bz-str-drain" style={{ width: `${strength.drain_pct}%` }}>
                    <span>{strength.drain_pct}%</span>
                  </div>
                </div>
                <div className="bz-str-labels">
                  <span className="bz-str-label-l">Supporting</span>
                  <span className={`bz-str-verdict${strength.strong ? ' bz-str-strong' : ' bz-str-weak'}`}>{strength.strength_label}</span>
                  <span className="bz-str-label-r">Opposing</span>
                </div>
              </div>

              {/* Favorable / Unfavorable elements */}
              <div className="bz-fav-grid">
                <div className="bz-fav-col">
                  <span className="bz-fav-title">Favorable</span>
                  <div className="bz-fav-pills">
                    {strength.favorable.map((el, i) => (
                      <span key={i} className="bz-fav-pill" style={{ background: strength.favorable_colors[i] }}>{el}</span>
                    ))}
                  </div>
                </div>
                <div className="bz-fav-col">
                  <span className="bz-fav-title bz-fav-title--neg">Unfavorable</span>
                  <div className="bz-fav-pills">
                    {(strength.unfavorable || []).map((el, i) => (
                      <span key={i} className="bz-fav-pill bz-fav-pill--neg" style={{ borderColor: strength.unfavorable_colors?.[i] || '#666' }}>{el}</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="bz-strategy">{strength.strategy}</p>
            </div>
          )}
        </div>
      )}

      {/* ── DAY MASTER PROFILE TAB ── */}
      {baziTab === 'profile' && profile && (
        <div className="bz-section fade-in">
          <div className="bz-profile-hero" style={{ '--dm-color': strength?.day_master_color || color }}>
            <span className="bz-profile-chinese serif">{profile.chinese}</span>
            <h3 className="bz-profile-title serif">{profile.title}</h3>
            <span className="bz-profile-nature">{profile.nature}</span>
          </div>

          <div className="bz-profile-body">
            <p className="bz-profile-text">{profile.personality}</p>

            <div className="bz-profile-cols">
              <div className="bz-profile-list-card bz-profile-list-card--pos">
                <h5>Strengths</h5>
                <ul>{profile.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div className="bz-profile-list-card bz-profile-list-card--neg">
                <h5>Challenges</h5>
                <ul>{profile.challenges.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            </div>

            <div className="bz-profile-detail-card">
              <h5>Career Paths</h5>
              <p>{profile.career}</p>
            </div>
            <div className="bz-profile-detail-card">
              <h5>Relationships</h5>
              <p>{profile.relationships}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── STARS TAB ── */}
      {baziTab === 'stars' && (
        <div className="bz-section fade-in">
          <h4 className="bz-sub-title">Symbolic Stars</h4>
          {stars.length === 0 && <p className="bz-empty">No major symbolic stars found in your natal chart.</p>}
          <div className="bz-stars-list">
            {stars.map((star, i) => (
              <div key={i} className={`bz-star-card glass stagger${star.positive ? ' bz-star--pos' : ' bz-star--neg'}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="bz-star-header">
                  <span className="bz-star-chinese serif">{star.chinese}</span>
                  <span className="bz-star-name">{star.name}</span>
                  <span className={`bz-star-badge${star.positive ? '' : ' bz-star-badge--neg'}`}>{star.positive ? 'Auspicious' : 'Challenging'}</span>
                </div>
                <p className="bz-star-desc">{star.description}</p>
                <span className="bz-star-found">Found in: {star.found_in}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LUCK PERIODS TAB ── */}
      {baziTab === 'luck' && (
        <div className="bz-section fade-in">
          <h4 className="bz-sub-title">10-Year Luck Periods (大运 Da Yun)</h4>
          {currentLuck && (
            <div className="bz-current-luck glass" style={{ '--bz-accent': color }}>
              <span className="bz-cl-badge">Current Period (Age {age})</span>
              <div className="bz-cl-main">
                <span className="bz-cl-chinese serif">{currentLuck.chinese_name}</span>
                <span className="bz-cl-name">{currentLuck.pillar_name}</span>
                <span className="bz-cl-ages">{currentLuck.age_range} · {currentLuck.year_range}</span>
              </div>
              <div className="bz-cl-details">
                <span className="bz-cl-tg">{currentLuck.ten_god_chinese} {currentLuck.ten_god}</span>
                <span className="bz-cl-nayin">{currentLuck.na_yin}</span>
              </div>
            </div>
          )}
          <div className="bz-luck-timeline">
            {luckPeriods.map((lp, i) => {
              const isCurrent = currentLuck && lp.index === currentLuck.index;
              return (
                <div key={i} className={`bz-luck-card stagger${isCurrent ? ' bz-luck-card--current' : ''}`} style={{ animationDelay: `${i * 0.07}s`, '--stem-color': lp.stem_color, '--branch-color': lp.branch_color }}>
                  <div className="bz-luck-ages">{lp.age_range}</div>
                  <div className="bz-luck-years">{lp.year_range}</div>
                  <div className="bz-luck-pillar">
                    <span className="bz-luck-chinese serif">{lp.chinese_name}</span>
                    <span className="bz-luck-pinyin">{lp.pillar_name}</span>
                  </div>
                  <div className="bz-luck-elements">
                    <span className="bz-luck-el" style={{ background: lp.stem_color }}>{lp.stem_element}</span>
                    <span className="bz-luck-el" style={{ background: lp.branch_color }}>{lp.branch_element}</span>
                  </div>
                  <div className="bz-luck-tg">{lp.ten_god_chinese} {lp.ten_god}</div>
                  <div className="bz-luck-nayin">{lp.na_yin}</div>
                  {isCurrent && <div className="bz-luck-now-badge">NOW</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Kabbalistic Tree of Life */
function KabbalisticChart({ data, color }) {
  const activeSephirah = (hl(data, 'sephir', 'sefirah', 'sefirot', 'active') || '').toLowerCase();

  // 10 Sephirot positions on the Tree of Life
  const sephirot = [
    { name: 'Keter', x: 150, y: 20 },
    { name: 'Chokmah', x: 230, y: 60 },
    { name: 'Binah', x: 70, y: 60 },
    { name: 'Chesed', x: 230, y: 130 },
    { name: 'Gevurah', x: 70, y: 130 },
    { name: 'Tiferet', x: 150, y: 150 },
    { name: 'Netzach', x: 230, y: 210 },
    { name: 'Hod', x: 70, y: 210 },
    { name: 'Yesod', x: 150, y: 240 },
    { name: 'Malkut', x: 150, y: 290 },
  ];

  // 22 paths connecting the sephirot
  const paths = [
    [0,1],[0,2],[0,5],[1,2],[1,3],[1,5],[2,4],[2,5],
    [3,4],[3,5],[3,6],[4,5],[4,7],[5,6],[5,7],[5,8],
    [6,8],[7,8],[6,9],[7,9],[8,9],
  ];

  return (
    <div className="sa-chart-wrap">
      <svg viewBox="0 0 300 310" className="sa-chart-svg sa-chart-kabbalistic">
        {/* Paths */}
        {paths.map(([a, b], i) => (
          <line
            key={i}
            x1={sephirot[a].x} y1={sephirot[a].y}
            x2={sephirot[b].x} y2={sephirot[b].y}
            stroke={color} strokeWidth="1" opacity="0.2"
            className="sa-chart-draw"
            style={{ animationDelay: `${i * 0.04}s` }}
          />
        ))}

        {/* Sephirot nodes */}
        {sephirot.map((s, i) => {
          const isActive = activeSephirah && s.name.toLowerCase().includes(activeSephirah.toLowerCase().slice(0, 4));
          return (
            <g key={i} className={`sa-chart-sephirah ${isActive ? 'sa-chart-sephirah--active' : ''}`} style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
              {isActive && (
                <circle cx={s.x} cy={s.y} r="22" fill={color} opacity="0.15" className="sa-sephirah-glow" />
              )}
              <circle cx={s.x} cy={s.y} r="16" fill={isActive ? color : 'var(--glass-bg)'} fillOpacity={isActive ? 0.4 : 0.6} stroke={color} strokeWidth={isActive ? 2 : 1} strokeOpacity={isActive ? 1 : 0.4} />
              <text
                x={s.x} y={s.y + 1}
                textAnchor="middle" dominantBaseline="central"
                fill={isActive ? '#fff' : 'var(--text)'}
                fontSize="6"
                fontWeight={isActive ? '700' : '400'}
              >{s.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* Numerology number cards */
function NumerologyCards({ data, color }) {
  const keys = ['life path', 'expression', 'soul urge', 'personality', 'personal year', 'personal month', 'personal day', 'pinnacle', 'challenge'];
  const cards = [];
  for (const k of keys) {
    const val = hl(data, k);
    if (val) cards.push({ label: k.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), value: val });
  }
  // Also pull from highlights directly
  if (cards.length === 0 && data.highlights) {
    for (const h of data.highlights) {
      cards.push({ label: h.label, value: String(h.value) });
    }
  }

  return (
    <div className="sa-number-cards">
      {cards.map((c, i) => (
        <div key={i} className="sa-number-card glass stagger" style={{ animationDelay: `${i * 0.08}s`, '--sys-color': color }}>
          <span className="sa-number-card-value serif">{c.value}</span>
          <span className="sa-number-card-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/* Chinese animal card */
function ChineseAnimalCard({ data, color }) {
  const animal = hl(data, 'animal', 'zodiac', 'sign');
  const element = hl(data, 'element');
  const companion = hl(data, 'companion', 'ally', 'friend');
  const conflict = hl(data, 'conflict', 'clash', 'enemy');
  const lucky = hl(data, 'lucky');

  return (
    <div className="sa-chinese-card" style={{ '--sys-color': color }}>
      <div className="sa-chinese-hero glass">
        <div className="sa-chinese-icon-wrap">
          <span className="sa-chinese-icon">{'\uD83D\uDC09'}</span>
        </div>
        <div className="sa-chinese-hero-text">
          <span className="sa-chinese-animal serif">{animal || 'Unknown'}</span>
          {element && <span className="sa-chinese-element">{element} Element</span>}
        </div>
      </div>
      <div className="sa-chinese-details">
        {companion && <div className="sa-chinese-detail glass"><span className="sa-chinese-detail-label">Ally</span><span className="sa-chinese-detail-value">{companion}</span></div>}
        {conflict && <div className="sa-chinese-detail glass"><span className="sa-chinese-detail-label">Conflict</span><span className="sa-chinese-detail-value">{conflict}</span></div>}
        {lucky && <div className="sa-chinese-detail glass"><span className="sa-chinese-detail-label">Lucky</span><span className="sa-chinese-detail-value">{lucky}</span></div>}
      </div>
    </div>
  );
}

/* Gematria number breakdown */
function GematriaBreakdown({ data, color }) {
  const hebrewVal = hl(data, 'hebrew', 'total');
  const latinVal = hl(data, 'latin', 'simple');
  const bridgeVal = hl(data, 'bridge');
  const reducedVal = hl(data, 'reduced', 'digital root');

  const items = [
    { label: 'Hebrew Gematria', value: hebrewVal, icon: '\u05D0' },
    { label: 'Latin Gematria', value: latinVal, icon: 'A' },
    { label: 'Bridge Number', value: bridgeVal, icon: '\u2194' },
    { label: 'Reduced', value: reducedVal, icon: '\u221E' },
  ].filter(i => i.value);

  return (
    <div className="sa-gematria-grid">
      {items.map((item, i) => (
        <div key={i} className="sa-gematria-item glass stagger" style={{ animationDelay: `${i * 0.1}s`, '--sys-color': color }}>
          <span className="sa-gematria-item-icon">{item.icon}</span>
          <span className="sa-gematria-item-value serif">{item.value}</span>
          <span className="sa-gematria-item-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* Persian planetary card */
function PersianCard({ data, color }) {
  const ruler = hl(data, 'planetary day', 'ruling planet', 'day ruler');
  const mansion = hl(data, 'mansion', 'lunar mansion');
  const lot = hl(data, 'lot', 'arabic part');
  const temperament = hl(data, 'temperament', 'mizaj');

  return (
    <div className="sa-persian-layout">
      {ruler && (
        <div className="sa-persian-ruler glass" style={{ '--sys-color': color }}>
          <div className="sa-persian-ruler-circle">
            <span className="sa-persian-ruler-icon">{'\u2609'}</span>
          </div>
          <div className="sa-persian-ruler-text">
            <span className="sa-persian-ruler-label">Planetary Ruler</span>
            <span className="sa-persian-ruler-value serif">{ruler}</span>
          </div>
        </div>
      )}
      <div className="sa-persian-grid">
        {mansion && <div className="sa-persian-cell glass" style={{ '--sys-color': color }}><span className="sa-persian-cell-icon">{'\u2606'}</span><span className="sa-persian-cell-label">Mansion</span><span className="sa-persian-cell-value">{mansion}</span></div>}
        {lot && <div className="sa-persian-cell glass" style={{ '--sys-color': color }}><span className="sa-persian-cell-icon">{'\u2316'}</span><span className="sa-persian-cell-label">Lot</span><span className="sa-persian-cell-value">{lot}</span></div>}
        {temperament && <div className="sa-persian-cell glass" style={{ '--sys-color': color }}><span className="sa-persian-cell-icon">{'\u2668'}</span><span className="sa-persian-cell-label">Temperament</span><span className="sa-persian-cell-value">{temperament}</span></div>}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   Main SystemApp Component
   ═══════════════════════════════════════════════════════ */
export function SystemApp({ systemId, result, onBack, form }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));
  const containerRef = useRef(null);

  const systemMeta = SYSTEMS.find((s) => s.id === systemId);
  const data = result?.systems?.[systemId];

  useEffect(() => {
    setVisited((prev) => new Set(prev).add(pageIndex));
    // Reset scroll position when changing pages
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    const scrollArea = containerRef.current?.closest('.scroll-area');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  }, [pageIndex]);

  useEffect(() => {
    setPageIndex(0);
    setVisited(new Set([0]));
  }, [systemId]);

  if (!data || !systemMeta) {
    return (
      <div className="sysapp fade-in">
        <SystemAppHeader systemMeta={systemMeta} onBack={onBack} pageIndex={0} />
        <div className="sysapp-body"><p className="empty-msg">No data available for this system.</p></div>
      </div>
    );
  }

  return (
    <div className="sysapp fade-in" style={{ '--sys-color': systemMeta.color }}>
      <SystemAppHeader systemMeta={systemMeta} onBack={onBack} pageIndex={pageIndex} />
      <div className="sysapp-pages-indicator">
        {SYSTEM_PAGES.map((name, i) => (
          <button
            type="button"
            key={name}
            className={`sysapp-page-dot ${i === pageIndex ? 'sysapp-page-dot--active' : ''}`}
            onClick={() => setPageIndex(i)}
            aria-label={name}
          >
            <span className="sysapp-page-dot-label">{name}</span>
          </button>
        ))}
      </div>
      <div
        className="sysapp-active-page"
        ref={containerRef}
      >
        {pageIndex === 0 && <OverviewPage data={data} systemMeta={systemMeta} result={result} systemId={systemId} />}
        {pageIndex === 1 && <DetailsPage data={data} systemMeta={systemMeta} />}
        {pageIndex === 2 && <SystemCalendarTab systemId={systemId} form={form} />}
        {pageIndex === 3 && <SystemGamesTab systemId={systemId} result={result} form={form} />}
      </div>
    </div>
  );
}

function SystemAppHeader({ systemMeta, onBack, pageIndex }) {
  return (
    <div className="sysapp-header" style={{ '--sys-color': systemMeta?.color || 'var(--gold)' }}>
      <button type="button" className="back-btn" onClick={onBack} aria-label="Back to Systems">
        <IconBack />
      </button>
      <span className="sysapp-header-icon">{systemMeta?.icon}</span>
      <div className="sysapp-header-text">
        <h2 className="serif sysapp-header-name">{systemMeta?.name || 'System'}</h2>
        <span className="sysapp-header-page">{SYSTEM_PAGES[pageIndex]}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Page 1: Overview — the "wow" moment
   ══════════════════════════════════════════════════════ */
function OverviewPage({ data, systemMeta, result, systemId }) {
  const average = systemAvgScore(result, systemId);
  const agreement = getSystemAgreement(result, systemId);
  const badge = getConfidenceBadge(agreement.agreeing, agreement.total);
  const scores = data.scores || {};

  return (
    <div className="sysapp-content sa-overview">
      {/* Floating particles */}
      <Particles color={systemMeta.color} count={16} />

      {/* Hero: icon + gauge + name */}
      <div className="sa-hero" style={{ '--sys-color': systemMeta.color }}>
        <div className="sa-hero-icon-wrap">
          <div className="sa-hero-glow" />
          <span className="sa-hero-icon">{systemMeta.icon}</span>
        </div>
        <h3 className="serif sa-hero-name">{data.name || systemMeta.name}</h3>
        <p className="sa-hero-desc">{systemMeta.desc}</p>

        {average != null && (
          <ScoreGauge value={average} color={scoreColor(average)} size={130} strokeWidth={10} label="Overall" />
        )}
      </div>

      {/* System-specific flavor */}
      <SystemFlavor data={data} systemId={systemId} color={systemMeta.color} />

      {/* Agreement badge */}
      <div className="sa-agreement glass stagger" style={{ animationDelay: '0.2s' }}>
        <div className="sa-agreement-gauge">
          <MiniGauge value={Math.round((agreement.agreeing / Math.max(agreement.total, 1)) * 100)} color={badge.color} size={50} strokeWidth={4} />
        </div>
        <div className="sa-agreement-info">
          <span className="sa-agreement-label" style={{ color: badge.color }}>{badge.text}</span>
          <span className="sa-agreement-sub">
            Agrees with {agreement.agreeing} of {agreement.total} other systems
          </span>
        </div>
      </div>

      {/* Headline */}
      {data.headline && (
        <div className="sa-headline stagger" style={{ animationDelay: '0.25s' }}>
          <h3 className="serif sa-headline-text">{data.headline}</h3>
        </div>
      )}

      {/* Area scores with animated bars */}
      <div className="sa-scores">
        {AREAS.map((area, idx) => {
          const info = scores[area.key];
          if (!info) return null;
          const value = Math.round(info.value);
          return (
            <div className="sa-score-row glass stagger" key={area.key} style={{ animationDelay: `${0.3 + idx * 0.08}s` }}>
              <div className="sa-score-left">
                <span className="sa-score-icon">{area.icon}</span>
                <span className="sa-score-label">{area.label}</span>
              </div>
              <div className="sa-score-bar-track">
                <div
                  className="sa-score-bar bar-anim"
                  style={{ width: `${value}%`, background: scoreGradient(value), animationDelay: `${0.5 + idx * 0.1}s` }}
                />
              </div>
              <span className="sa-score-pct serif" style={{ color: scoreColor(value) }}>{value}%</span>
              <span className="sa-score-sentiment">{info.label || ''}</span>
            </div>
          );
        })}
      </div>

      {/* Summary preview */}
      {data.summary?.length > 0 && (
        <div className="sa-summary-preview stagger" style={{ animationDelay: '0.7s' }}>
          <p>{data.summary[0]}</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Page 2: Details — deep dive with charts
   ══════════════════════════════════════════════════════ */
function DetailsPage({ data, systemMeta }) {
  const sysId = systemMeta.id;
  const color = systemMeta.color;

  // Select the right chart/visualization component
  const renderVisualization = () => {
    switch (sysId) {
      case 'western': return <WesternChart data={data} color={color} />;
      case 'vedic': return <VedicChart data={data} color={color} />;
      case 'bazi': return <BaZiChart data={data} color={color} />;
      case 'kabbalistic': return <KabbalisticChart data={data} color={color} />;
      case 'numerology': return <NumerologyCards data={data} color={color} />;
      case 'chinese': return <ChineseAnimalCard data={data} color={color} />;
      case 'gematria': return <GematriaBreakdown data={data} color={color} />;
      case 'persian': return <PersianCard data={data} color={color} />;
      default: return null;
    }
  };

  return (
    <div className="sysapp-content sa-details">
      <div className="sa-section-header stagger">
        <h3 className="serif">{systemMeta.name} Details</h3>
        {systemMeta.hasChart && <span className="sa-badge sa-badge-chart">Chart</span>}
      </div>

      {/* Chart / Visualization */}
      {renderVisualization()}

      {/* Highlights as rich cards */}
      {data.highlights?.length > 0 && (
        <div className="sa-highlight-grid">
          {data.highlights.map((h, i) => (
            <div className="sa-highlight-card glass stagger" key={i} style={{ animationDelay: `${i * 0.06}s`, '--sys-color': color }}>
              <div className="sa-highlight-accent" />
              <span className="sa-highlight-label">{h.label}</span>
              <span className="sa-highlight-value">{String(h.value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Full summary */}
      {data.summary?.length > 0 && (
        <div className="sa-full-summary">
          {data.summary.map((p, i) => <p key={i} className="stagger" style={{ animationDelay: `${0.3 + i * 0.05}s` }}>{p}</p>)}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Page 3: Insights — actionable and engaging
   ══════════════════════════════════════════════════════ */
function InsightsPage({ data, systemMeta, result, systemId }) {
  const areaInsights = getSystemInsightsByArea(result, systemId);
  const color = systemMeta.color;

  // Find the best insight for a pull-quote
  const bestInsight = areaInsights.length > 0
    ? areaInsights.reduce((best, cur) => cur.value > best.value ? cur : best, areaInsights[0])
    : null;

  return (
    <div className="sysapp-content sa-insights">
      <div className="sa-section-header stagger">
        <h3 className="serif">{systemMeta.name} Insights</h3>
      </div>

      {/* Pull quote for strongest area */}
      {bestInsight && (
        <div className="sa-pull-quote stagger" style={{ '--sys-color': color, animationDelay: '0.1s' }}>
          <div className="sa-pull-quote-bar" />
          <div className="sa-pull-quote-content">
            <span className="sa-pull-quote-icon">{bestInsight.icon}</span>
            <div className="sa-pull-quote-text">
              <span className="sa-pull-quote-area serif">{bestInsight.label} leads at {bestInsight.value}%</span>
              <span className="sa-pull-quote-sentiment">{bestInsight.sentiment}</span>
            </div>
            <MiniGauge value={bestInsight.value} color={scoreColor(bestInsight.value)} />
          </div>
        </div>
      )}

      {/* Per-area insight cards with mini gauges */}
      {areaInsights.length > 0 && (
        <div className="sa-insight-list">
          {areaInsights.map((ins, i) => {
            const c = scoreColor(ins.value);
            return (
              <div className="sa-insight-card glass stagger" key={ins.area} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                <div className="sa-insight-left">
                  <MiniGauge value={ins.value} color={c} />
                </div>
                <div className="sa-insight-mid">
                  <div className="sa-insight-top-row">
                    <span className="sa-insight-icon">{ins.icon}</span>
                    <span className="sa-insight-area">{ins.label}</span>
                  </div>
                  <p className="sa-insight-sentiment">{ins.sentiment}</p>
                </div>
                <div className="sa-insight-right">
                  <span className="sa-insight-pct serif" style={{ color: c }}>{ins.value}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "What this means for you" section */}
      {areaInsights.length > 0 && (
        <div className="sa-action-section stagger" style={{ animationDelay: '0.5s' }}>
          <h4 className="sa-action-title serif">What This Means For You</h4>
          <div className="sa-action-bullets">
            {areaInsights.slice(0, 3).map((ins) => (
              <div key={ins.area} className="sa-action-bullet">
                <span className="sa-action-dot" style={{ background: scoreColor(ins.value) }} />
                <span className="sa-action-text">
                  {ins.value >= 65
                    ? `Your ${ins.label.toLowerCase()} energy is strong — lean into it.`
                    : ins.value >= 45
                    ? `${ins.label} shows mixed signals — stay adaptable.`
                    : `${ins.label} needs patience — don't force outcomes.`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nested insights from backend */}
      {data.insights?.length > 0 && (
        <div className="sa-insights-accordions">
          {data.insights.map((insight, i) => (
            <Accordion key={i} title={insight.title}>
              <p className="ins-text">{insight.text}</p>
            </Accordion>
          ))}
        </div>
      )}

      {areaInsights.length === 0 && (!data.insights || data.insights.length === 0) && (
        <p className="empty-msg">No insights available. Generate a reading to see personalized takeaways.</p>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════════════
   Page 4: Data — the nerd screen (legacy, kept for reference)
   ══════════════════════════════════════════════════════ */
function DataPage({ data, systemMeta }) {
  const color = systemMeta.color;

  return (
    <div className="sysapp-content sa-data">
      {/* System badge header */}
      <div className="sa-data-header stagger">
        <div className="sa-data-system-badge" style={{ '--sys-color': color }}>
          <span className="sa-data-badge-icon">{systemMeta.icon}</span>
          <span className="sa-data-badge-name serif">{systemMeta.name}</span>
        </div>
        <span className="sa-badge sa-badge-data">Raw Data</span>
      </div>

      {/* Score breakdown with mini bar charts */}
      {data.scores && Object.keys(data.scores).length > 0 && (
        <div className="sa-data-scores stagger" style={{ animationDelay: '0.1s' }}>
          <h4 className="sa-data-subtitle serif">Score Breakdown</h4>
          {AREAS.map((area, idx) => {
            const info = data.scores[area.key];
            if (!info) return null;
            const value = Math.round(info.value);
            return (
              <div className="sa-data-score-row" key={area.key} style={{ animationDelay: `${0.15 + idx * 0.06}s` }}>
                <div className="sa-data-score-meta">
                  <span className="sa-data-score-icon">{area.icon}</span>
                  <span className="sa-data-score-name">{area.label}</span>
                </div>
                <div className="sa-data-score-bar-wrap">
                  <div className="sa-data-score-bar bar-anim" style={{ width: `${value}%`, background: scoreGradient(value), animationDelay: `${0.3 + idx * 0.08}s` }} />
                </div>
                <span className="sa-data-score-pct serif" style={{ color: scoreColor(value) }}>{value}%</span>
                <span className="sa-data-score-label">{info.label || '—'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Data tables with enhanced styling */}
      {data.tables?.length > 0 ? (
        <div className="sa-data-tables">
          {data.tables.map((table, i) => (
            <div key={i} className="sa-data-table-wrap stagger" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
              <DataCards block={table} />
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-msg">No detailed data tables available for this system.</p>
      )}

      {/* Methodology note */}
      <div className="sa-data-methodology stagger" style={{ animationDelay: '0.6s' }}>
        <span className="sa-data-meth-icon">{'\u2139'}</span>
        <p className="sa-data-meth-text">
          Calculated using {systemMeta.name === 'Western' ? 'tropical zodiac with Placidus houses'
            : systemMeta.name === 'Vedic' ? 'sidereal zodiac with Lahiri ayanamsa'
            : systemMeta.name === 'Chinese' ? 'traditional lunar calendar and Wu Xing elements'
            : systemMeta.name === 'BaZi' ? 'Four Pillars stem-branch combinations'
            : systemMeta.name === 'Numerology' ? 'Pythagorean reduction method'
            : systemMeta.name === 'Kabbalistic' ? 'Tree of Life sefirot mapping and path analysis'
            : systemMeta.name === 'Gematria' ? 'Hebrew and Latin gematria correspondence tables'
            : 'Persian/Arabic astrological traditions'}.
          Scores represent an aggregate energy reading for the current period.
        </p>
      </div>
    </div>
  );
}
