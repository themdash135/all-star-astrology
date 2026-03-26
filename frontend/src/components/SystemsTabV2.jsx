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
  if (val >= 65) return 'var(--positive)';
  if (val >= 45) return 'var(--neutral)';
  return 'var(--negative)';
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
  return rows.slice(0, 40);
}

function SystemDetail({ sys, data, onBack }) {
  const [subtab, setSubtab] = useState('reading');
  const dataRows = useMemo(() => flattenData(data), [data]);

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

  const scores = data?.scores;
  const highlights = data?.highlights || [];
  const insights = data?.insights || [];
  const tables = data?.tables || [];

  return (
    <div className="v2-sys-overlay">
      <div className="v2-sys-overlay-inner">
        <button className="v2-sys-back" onClick={onBack}>{'\u2190'} All Systems</button>

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
                    <span key={i} className="v2-sys-hl-pill">
                      <span className="v2-sys-hl-label">{h.label}:</span> {h.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {insights.length > 0 && (
              <div>
                <div className="v2-section-label">Insights</div>
                {insights.map((ins, i) => (
                  <div key={i} className="v2-sys-insight-row">
                    <div className="v2-sys-insight-area">{ins.title || `Insight ${i + 1}`}</div>
                    <div className="v2-sys-insight-text">{ins.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subtab === 'evidence' && (
          <div className="fade-in">
            {evidence.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {evidence.map((ev, i) => (
                  <span key={i} className="v2-sys-evidence-tag">
                    {ev.feature}: {ev.value}
                  </span>
                ))}
              </div>
            ) : (
              <div className="v2-empty">No evidence items available</div>
            )}

            {tables.map((table, ti) => (
              <div key={ti} style={{ marginTop: 20 }}>
                <div className="v2-sys-table-title">{table.title || `Table ${ti + 1}`}</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="v2-sys-table">
                    <thead>
                      <tr>
                        {(table.columns || []).map((col, ci) => (
                          <th key={ci}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(table.rows || []).slice(0, 15).map((row, ri) => (
                        <tr key={ri}>
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
            {dataRows.length > 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--v2-r-lg)', padding: 16 }}>
                {dataRows.map((row, i) => (
                  <div key={i} className="v2-sys-data-row">
                    <span className="v2-sys-data-key">{row.key.replace(/_/g, ' ')}</span>
                    <span className="v2-sys-data-val">{row.value}</span>
                  </div>
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

export function SystemsTabV2({ result }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    const sys = SYSTEMS.find(s => s.id === selected);
    const data = result?.systems?.[selected];
    return <SystemDetail sys={sys} data={data} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="page fade-in">
      <div className="v2-sys-header">
        <h2 className="serif">The Eight Systems</h2>
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
          </div>
        );
      })}
    </div>
  );
}
