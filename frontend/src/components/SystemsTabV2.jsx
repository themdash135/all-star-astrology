import { useState, useMemo } from 'react';

const SYSTEMS = [
  { id: 'western', name: 'Western', icon: '\u2609', color: 'var(--sys-western)' },
  { id: 'vedic', name: 'Vedic', icon: '\u0950', color: 'var(--sys-vedic)' },
  { id: 'chinese', name: 'Chinese', icon: '\uD83D\uDC09', color: 'var(--sys-chinese)' },
  { id: 'bazi', name: 'BaZi', icon: '\u67F1', color: 'var(--sys-bazi)' },
  { id: 'numerology', name: 'Numerology', icon: '#', color: 'var(--sys-numerology)' },
  { id: 'kabbalistic', name: 'Kabbalistic', icon: '\u2721', color: 'var(--sys-kabbalistic)' },
  { id: 'gematria', name: 'Gematria', icon: '\u05D0', color: 'var(--sys-gematria)' },
  { id: 'persian', name: 'Persian', icon: '\u2600', color: 'var(--sys-persian)' },
];

const INSIGHT_COLORS = [
  '#7B8CDE', '#6fcf97', '#D4A574', '#cf6f6f',
  '#9B7FDB', '#5EC4C4', '#DE7BA3', '#B8A44C',
];

function getHeadline(data) {
  if (!data) return 'No data available';
  if (data.headline) return data.headline;
  if (data.summary && typeof data.summary === 'string') return data.summary;
  if (Array.isArray(data.summary) && data.summary.length > 0) return data.summary[0];
  return 'Analysis ready';
}

function getAvgScore(data) {
  if (!data?.scores) return 50;
  const vals = Object.values(data.scores);
  if (vals.length === 0) return 50;
  const avg = vals.reduce((s, v) => s + (typeof v === 'object' ? (v.value || 50) : (v || 50)), 0) / vals.length;
  return Math.round(avg);
}

function getScoreColor(val) {
  if (val >= 60) return '#6fcf97';
  if (val >= 50) return '#d4a574';
  return '#cf6f6f';
}

function getOverallLabel(avg) {
  if (avg >= 75) return 'Strong';
  if (avg >= 60) return 'Supportive';
  if (avg >= 45) return 'Mixed';
  return 'Challenging';
}

function getCombinedScore(result) {
  if (!result?.systems) return null;
  const avgs = SYSTEMS.map(s => getAvgScore(result.systems[s.id]));
  if (avgs.length === 0) return null;
  return Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length);
}

function flattenData(data, prefix) {
  const rows = [];
  if (!data || typeof data !== 'object') return rows;
  for (const [k, v] of Object.entries(data)) {
    if (v == null || k === 'id' || k === 'name') continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      rows.push(...flattenData(v, (prefix || '') + k + '.'));
    } else if (Array.isArray(v)) {
      const str = v.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(', ');
      if (str.length < 500) rows.push({ key: (prefix || '') + k, value: str });
    } else {
      rows.push({ key: (prefix || '') + k, value: String(v) });
    }
  }
  return rows.slice(0, 60);
}

/** Try to parse a JSON string value into a readable display */
function tryFormatValue(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'object' && item !== null) {
            return Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ');
          }
          return String(item);
        }).join(' | ');
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
      }
    } catch { /* not valid JSON, return as-is */ }
  }
  return val;
}

/** Group flat data rows by their prefix (before the first dot) */
function groupDataRows(rows) {
  const groups = {};
  const order = [];
  for (const row of rows) {
    const dotIdx = row.key.indexOf('.');
    const group = dotIdx > 0 ? row.key.substring(0, dotIdx) : 'General';
    const shortKey = dotIdx > 0 ? row.key.substring(dotIdx + 1) : row.key;
    if (!groups[group]) {
      groups[group] = [];
      order.push(group);
    }
    groups[group].push({ ...row, shortKey });
  }
  return { groups, order };
}

/** Group evidence items by detecting section-like patterns in feature names */
function groupEvidence(items) {
  const groups = {};
  const order = [];
  for (const item of items) {
    // Heuristic: use prefix before first space or the full feature as group
    const parts = item.feature.split(' ');
    let group = 'General';
    if (parts.length >= 2) {
      // Check for common header-like prefixes
      const upper = parts[0].toUpperCase();
      if (['planetary', 'natal', 'element', 'house', 'transit', 'pillar', 'day', 'life', 'personal', 'sefirot', 'path', 'hebrew', 'latin', 'persian', 'lot', 'mansion', 'lunar', 'chinese', 'star', 'nakshatra', 'dasha'].includes(parts[0].toLowerCase())) {
        group = parts.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      } else if (upper === upper && parts[0].length > 2) {
        group = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      }
    }
    if (!groups[group]) {
      groups[group] = [];
      order.push(group);
    }
    groups[group].push(item);
  }
  return { groups, order };
}

function DataGroup({ label, rows, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  return (
    <div className="v2-sys-data-group">
      <button className="v2-sys-data-group-header" onClick={() => setOpen(!open)}>
        <span className="v2-sys-data-group-label">{label.replace(/_/g, ' ')}</span>
        <span className="v2-sys-data-group-chevron">{open ? '\u25B4' : '\u25BE'}</span>
      </button>
      {open && (
        <div className="v2-sys-data-group-body">
          {rows.map((row, i) => (
            <div key={i} className={`v2-sys-data-row ${i % 2 === 1 ? 'v2-zebra' : ''}`}>
              <span className="v2-sys-data-key">{(row.shortKey || row.key).replace(/_/g, ' ')}</span>
              <span className="v2-sys-data-val">{tryFormatValue(row.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemDetail({ sys, data, onBack, onNav, navLabel, onAskOracle }) {
  const [subtab, setSubtab] = useState('reading');
  const dataRows = useMemo(() => flattenData(data), [data]);
  const dataGrouped = useMemo(() => groupDataRows(dataRows), [dataRows]);

  const evidence = useMemo(() => {
    const items = [];
    if (!data) return items;
    const walk = (obj, depth) => {
      if (depth > 3 || !obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string' && v.length > 5 && v.length < 200 && !k.startsWith('_') && k !== 'id' && k !== 'name') {
          items.push({ feature: k.replace(/_/g, ' '), value: v });
        }
        if (typeof v === 'object' && !Array.isArray(v)) walk(v, depth + 1);
      }
    };
    walk(data, 0);
    return items.slice(0, 24);
  }, [data]);

  const evidenceGrouped = useMemo(() => groupEvidence(evidence), [evidence]);

  const scores = data?.scores;
  const highlights = data?.highlights || [];
  const insights = data?.insights || [];
  const tables = data?.tables || [];

  const avgScore = getAvgScore(data);
  const overallLabel = getOverallLabel(avgScore);

  return (
    <div className="v2-sys-overlay">
      <div className="v2-sys-overlay-inner">
        <div className="v2-sys-detail-topbar">
          <button className="v2-sys-back" onClick={onBack}>{'\u2190'} All Systems</button>
          {navLabel && (
            <span className="v2-sys-swipe-hint">{'\u2190'} swipe between systems {'\u2192'}</span>
          )}
        </div>

        <div className="v2-sys-detail-header">
          <div className="v2-sys-detail-icon" style={{ color: sys.color }}>{sys.icon}</div>
          <div className="v2-sys-detail-name serif">{sys.name}</div>
          <div className="v2-sys-detail-headline">{getHeadline(data)}</div>
        </div>

        <div className="v2-sys-tabs">
          {['Reading', 'Evidence', 'Data'].map(t => (
            <button
              key={t}
              className={`v2-sys-tab ${subtab === t.toLowerCase() ? 'active' : ''}`}
              onClick={() => setSubtab(t.toLowerCase())}
            >
              {t}
            </button>
          ))}
        </div>

        {subtab === 'reading' && (
          <div className="fade-in">
            {/* Today's Takeaway card */}
            <div className="v2-sys-takeaway" style={{ borderColor: getScoreColor(avgScore) }}>
              <span className="v2-sys-takeaway-icon">{'\u2726'}</span>
              <span className="v2-sys-takeaway-text">
                Today's {sys.name} outlook: <strong style={{ color: getScoreColor(avgScore) }}>{overallLabel}</strong>
              </span>
            </div>

            {scores && typeof scores === 'object' && (
              <div style={{ marginBottom: 24 }}>
                <div className="v2-section-label">Domain Scores</div>
                {Object.entries(scores).map(([k, v]) => {
                  const val = typeof v === 'object' ? (v.value || 0) : (v || 0);
                  const color = getScoreColor(val);
                  return (
                    <div key={k} className="v2-sys-score-row">
                      <span className="v2-sys-score-label">{k}</span>
                      <div className="v2-sys-score-bar">
                        <div className="v2-sys-score-fill" style={{ width: `${Math.min(100, val)}%`, background: color }} />
                      </div>
                      <span className="v2-sys-score-val" style={{ color }}>{Math.round(val)}%</span>
                    </div>
                  );
                })}
              </div>
            )}

            {highlights.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div className="v2-section-label">Highlights</div>
                <div className="v2-sys-highlights">
                  {highlights.map((h, i) => (
                    <span key={i} className={`v2-sys-hl-pill${i < 3 ? ' v2-sys-hl-primary' : ''}`}>
                      <span className="v2-sys-hl-label">{h.label}:</span> {h.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {insights.length > 0 && (
              <div>
                <div className="v2-section-label">Insights</div>
                {insights.map((ins, i) => {
                  const borderColor = INSIGHT_COLORS[i % INSIGHT_COLORS.length];
                  return (
                    <div key={i} className="v2-sys-insight-row v2-sys-insight-bordered" style={{ '--insight-color': borderColor }}>
                      <div className="v2-sys-insight-area">{ins.title || `Insight ${i + 1}`}</div>
                      <div className="v2-sys-insight-text">{ins.text}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ask the Oracle CTA */}
            {onAskOracle && (
              <div style={{ marginTop: 32, textAlign: 'center' }}>
                <button className="v2-sys-ask-oracle" onClick={() => onAskOracle(sys.id, sys.name)}>
                  Ask about your {sys.name} reading {'\u2192'}
                </button>
              </div>
            )}
          </div>
        )}

        {subtab === 'evidence' && (
          <div className="fade-in">
            {evidence.length > 0 ? (
              <div>
                {evidenceGrouped.order.map((group, gi) => (
                  <div key={group} style={{ marginBottom: 16 }}>
                    {evidenceGrouped.order.length > 1 && (
                      <div className="v2-sys-ev-group-label">{group}</div>
                    )}
                    <div className="v2-sys-ev-table-wrap">
                      <table className="v2-sys-table v2-sys-ev-table">
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evidenceGrouped.groups[group].map((ev, i) => (
                            <tr key={i} className={i % 2 === 1 ? 'v2-zebra' : ''}>
                              <td className="v2-sys-ev-feature">{ev.feature}</td>
                              <td>{ev.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="v2-empty">No evidence items available</div>
            )}

            {tables.map((table, ti) => (
              <div key={ti} style={{ marginTop: 20 }}>
                <div className="v2-sys-table-title">{table.title || `Table ${ti + 1}`}</div>
                <div className="v2-sys-ev-table-wrap">
                  <table className="v2-sys-table v2-sys-ev-table">
                    <thead>
                      <tr>
                        {(table.columns || []).map((col, ci) => (
                          <th key={ci}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(table.rows || []).slice(0, 15).map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 1 ? 'v2-zebra' : ''}>
                          {(Array.isArray(row) ? row : Object.values(row)).map((cell, ci) => (
                            <td key={ci}>{String(cell ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {subtab === 'data' && (
          <div className="fade-in">
            <div className="v2-sys-data-header">
              <div className="v2-sys-data-title">Raw Chart Data</div>
              <div className="v2-sys-data-subtitle">Technical details from the {sys.name} engine</div>
            </div>
            {dataRows.length > 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--v2-r-lg)', padding: 16 }}>
                {dataGrouped.order.map((group, gi) => (
                  <DataGroup
                    key={group}
                    label={group}
                    rows={dataGrouped.groups[group]}
                    defaultOpen={gi < 3}
                  />
                ))}
              </div>
            ) : (
              <div className="v2-empty">No raw data available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SystemsTabV2({ result, onAskOracle }) {
  const [selected, setSelected] = useState(null);
  const overallScore = useMemo(() => getCombinedScore(result), [result]);

  if (selected) {
    const sys = SYSTEMS.find(s => s.id === selected);
    const data = result?.systems?.[selected];
    return (
      <SystemDetail
        sys={sys}
        data={data}
        onBack={() => setSelected(null)}
        navLabel
        onAskOracle={onAskOracle}
      />
    );
  }

  return (
    <div className="page fade-in">
      <div className="v2-sys-header">
        <h2 className="serif">The Eight Systems</h2>
        {overallScore != null && (
          <div className="v2-sys-overall">
            Overall Alignment: <span className="v2-sys-overall-val" style={{ color: getScoreColor(overallScore) }}>{overallScore}%</span>
          </div>
        )}
        <div className="v2-sys-header-sub">Tap any system to explore its full reading</div>
      </div>

      {SYSTEMS.map(sys => {
        const data = result?.systems?.[sys.id];
        const avg = getAvgScore(data);
        const color = getScoreColor(avg);
        return (
          <div key={sys.id} className="v2-sys-row" onClick={() => setSelected(sys.id)}>
            <div className="v2-sys-icon" style={{ color: sys.color }}>{sys.icon}</div>
            <div className="v2-sys-info">
              <div className="v2-sys-name">{sys.name}</div>
              <div className="v2-sys-headline">{getHeadline(data)}</div>
            </div>
            <div className="v2-sys-score-bar-mini">
              <div className="v2-sys-score-fill-mini" style={{ width: `${avg}%`, background: color }} />
            </div>
            <span className="v2-sys-score-num" style={{ color }}>{avg}%</span>
            <span className="v2-sys-chevron">{'\u203A'}</span>
          </div>
        );
      })}
    </div>
  );
}
