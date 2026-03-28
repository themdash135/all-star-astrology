import { useMemo } from 'react';
import { SYSTEMS } from '../app/constants.js';
import { IconSettings } from './common.jsx';

const V2_SYSTEMS = SYSTEMS.map(s => ({ id: s.id, name: s.name, color: `var(--sys-${s.id})` }));

// key = v2/scores domain key; altKey = combined.probabilities key (fallback)
const V2_AREAS = [
  { key: 'career', altKey: 'career', label: 'Career' },
  { key: 'love', altKey: 'love', label: 'Love' },
  { key: 'health', altKey: 'health', label: 'Health' },
  { key: 'money', altKey: 'wealth', label: 'Money' },
  { key: 'creativity', altKey: 'mood', label: 'Mood' },
];

function getOverallAgreement(combined) {
  if (!combined) return { pct: 50, count: 4, total: 8 };
  const conf = combined.confidence;
  if (conf && typeof conf === 'object' && typeof conf.overall === 'number') {
    const pct = Math.round(conf.overall);
    return { pct, count: Math.max(1, Math.round((pct / 100) * 8)), total: 8 };
  }
  const probs = combined.probabilities;
  if (probs && typeof probs === 'object') {
    const areas = Object.values(probs);
    if (areas.length > 0) {
      const avgConf = areas.reduce((s, a) => s + (a?.confidence || 50), 0) / areas.length;
      const total = 8;
      const count = Math.round((avgConf / 100) * total);
      return { pct: Math.round(avgConf), count: Math.max(1, count), total };
    }
  }
  return { pct: 50, count: 4, total: 8 };
}

function getSystemConfidence(systemData) {
  if (!systemData?.scores) return 50;
  const vals = Object.values(systemData.scores);
  if (vals.length === 0) return 50;
  const avg = vals.reduce((s, v) => s + (typeof v === 'object' ? (v.value || 50) : (v || 50)), 0) / vals.length;
  return Math.round(avg);
}

function StatusLine({ temporal }) {
  const moon = temporal?.moon_phase;
  const ph = temporal?.planetary_hour;
  const dr = temporal?.day_ruler;

  return (
    <div className="v2-status-line">
      <div className="v2-status-item">
        <span className="v2-status-dot" style={{ background: 'var(--text-muted)' }} />
        {moon ? (moon.phase_name || 'Moon') : 'Moon'}
      </div>
      <div className="v2-status-item">
        <span className="v2-status-dot" style={{ background: 'var(--sys-persian)' }} />
        {ph ? `${ph.ruler}'s Hour` : 'Planetary Hour'}
      </div>
      <div className="v2-status-item">
        <span className="v2-status-dot" style={{ background: 'var(--sys-western)' }} />
        {dr ? `${dr.planet} rules ${dr.weekday}` : 'Day Ruler'}
      </div>
    </div>
  );
}

function AgreementSpectrum({ result }) {
  const { pct, count, total } = useMemo(
    () => getOverallAgreement(result?.combined),
    [result]
  );

  const dots = useMemo(() => {
    return V2_SYSTEMS.map(sys => {
      const conf = result?.systems?.[sys.id]
        ? getSystemConfidence(result.systems[sys.id])
        : 50;
      return { ...sys, conf };
    });
  }, [result]);

  const label = pct >= 70 ? 'Strong consensus' : pct >= 45 ? 'Mixed signals' : 'Systems diverge';

  return (
    <div className="v2-spectrum-section">
      <div className="v2-spectrum-label">System Agreement</div>
      <div className="v2-spectrum-bar-wrap">
        <div className="v2-spectrum-track" />
        {dots.map(d => (
          <div
            key={d.id}
            className="v2-spectrum-dot"
            style={{
              left: `${Math.max(4, Math.min(96, d.conf))}%`,
              background: d.color,
            }}
            title={`${d.name}: ${d.conf}%`}
          />
        ))}
      </div>
      <div className="v2-spectrum-labels">
        <span>Cautious</span>
        <span>Supportive</span>
      </div>
      <div className="v2-spectrum-conf">
        {count}/{total} systems align {' \u2014 '} {label} ({pct}%)
      </div>
    </div>
  );
}

function ScoreDotPlot({ result, scores }) {
  const rows = useMemo(() => {
    const items = [];
    // Try v2/scores first, but only if it has real data (non-empty systems)
    if (scores?.scores) {
      const hasRealData = Object.values(scores.scores).some(
        s => s.systems && Object.keys(s.systems).length > 0
      );
      if (hasRealData) {
        for (const area of V2_AREAS) {
          const s = scores.scores[area.key];
          if (!s) continue;
          const score = typeof s.score === 'number' ? s.score : 0;
          const display = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
          const pos = ((score + 3) / 6) * 100;
          const color = score >= 0.5 ? 'var(--positive)' : score >= -0.5 ? 'var(--neutral)' : 'var(--negative)';
          const sysCount = s.systems ? Object.keys(s.systems).length : 8;
          const agreeCount = s.systems
            ? Object.values(s.systems).filter(x => x.favorable > 0.5).length
            : Math.round((s.favorable || 0.5) * 8);
          items.push({ ...area, score, display, pos, color, agree: `${agreeCount}/${sysCount}` });
        }
      }
    }
    // Fallback to combined probabilities
    if (items.length === 0 && result?.combined?.probabilities) {
      const probs = result.combined.probabilities;
      for (const area of V2_AREAS) {
        const p = probs[area.altKey || area.key];
        if (!p) continue;
        const val = typeof p.value === 'number' ? p.value : 50;
        const score = (val / 100) * 6 - 3;
        const display = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
        const pos = val;
        const color = val >= 60 ? 'var(--positive)' : val >= 45 ? 'var(--neutral)' : 'var(--negative)';
        const agree = Array.isArray(p.agreeing_systems) ? `${p.agreeing_systems.length}/8` : '';
        items.push({ ...area, score, display, pos, color, agree });
      }
    }
    return items;
  }, [result, scores]);

  if (rows.length === 0) return null;

  return (
    <div className="v2-dotplot-section">
      <div className="v2-section-label">Life Area Scores</div>
      {rows.map(r => (
        <div key={r.key} className="v2-dotplot-row">
          <span className="v2-dotplot-label">{r.label}</span>
          <div className="v2-dotplot-track">
            <div className="v2-dotplot-line" />
            <div className="v2-dotplot-center" />
            <div
              className="v2-dotplot-dot"
              style={{
                left: `${Math.max(4, Math.min(96, r.pos))}%`,
                background: r.color,
              }}
            />
          </div>
          <span className="v2-dotplot-value" style={{ color: r.color }}>{r.display}</span>
          <span className="v2-dotplot-agree">{r.agree}</span>
        </div>
      ))}
    </div>
  );
}

export function TodayTab({ result, temporal, scores, onOpenSettings, onAnalysis }) {
  const daily = result?.daily;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const focusArea = daily?.focus;
  const cautionArea = daily?.caution;
  const anchor = daily?.anchor;

  return (
    <div className="page fade-in">
      <div className="v2-today-header">
        <StatusLine temporal={temporal} />
        {onOpenSettings && (
          <button type="button" className="oracle-settings-btn" onClick={onOpenSettings} aria-label="Settings">
            <IconSettings />
          </button>
        )}
      </div>

      <div className="v2-today-date serif">{dateStr}</div>
      <div className="v2-today-sub">{"Today\u2019s reading across eight astrological traditions"}</div>

      <AgreementSpectrum result={result} />

      <ScoreDotPlot result={result} scores={scores} />

      {daily && (
        <>
          <div className="v2-daily-quote serif">
            {typeof daily.message === 'string' ? daily.message : 'The stars speak.'}
          </div>

          <div className="v2-daily-meta">
            {focusArea && typeof focusArea === 'object' && (
              <>Focus: <strong>{focusArea.label || focusArea.area || 'Unknown'}</strong> ({focusArea.score || focusArea.value || ''}%). </>
            )}
            {focusArea && typeof focusArea === 'string' && (
              <>Focus: <strong>{focusArea}</strong>. </>
            )}
            {cautionArea && typeof cautionArea === 'object' && (
              <>Handle <strong>{cautionArea.label || cautionArea.area || ''}</strong> gently. </>
            )}
            {cautionArea && typeof cautionArea === 'string' && (
              <>Handle <strong>{cautionArea}</strong> gently. </>
            )}
            {anchor && typeof anchor === 'object' && (
              <>Anchor: {anchor.label} {'\u2014'} {anchor.value}.</>
            )}
            {anchor && typeof anchor === 'string' && anchor}
          </div>
        </>
      )}

      {onAnalysis && result?.combined && (
        <button type="button" className="fca2-today-cta" onClick={onAnalysis}>
          <span className="fca2-today-cta-icon">◈</span>
          <span className="fca2-today-cta-text">
            <strong>View Full Cosmic Intelligence Report</strong>
            <span>8 systems converged · Neuro-Symbolic AI</span>
          </span>
          <span className="fca2-today-cta-arrow">→</span>
        </button>
      )}

      {daily && (Array.isArray(daily.dos) || Array.isArray(daily.donts)) && (
        <div className="v2-dodont">
          <div className="v2-dodont-col do">
            <h4>Do</h4>
            {(daily.dos || []).map((d, i) => (
              <div key={i} className="v2-dodont-item">{d}</div>
            ))}
          </div>
          <div className="v2-dodont-col dont">
            <h4>{"Don\u2019t"}</h4>
            {(daily.donts || []).map((d, i) => (
              <div key={i} className="v2-dodont-item">{d}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
