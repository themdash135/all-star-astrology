import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from './AdminApp.jsx';

/* ── Helpers ─────────────────────────────────────────────────────── */

function formatTimestamp(ts) {
  if (!ts) return '\u2014';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function statusBadge(status) {
  const cls =
    status === 'healthy' ? 'admin-badge--healthy' :
    status === 'review'  ? 'admin-badge--review'  :
    status === 'poor'    ? 'admin-badge--poor'     : '';
  return <span className={`admin-badge ${cls}`}>{status || 'unknown'}</span>;
}

function typeBadge(type) {
  const cls = type === 'compatibility' ? 'admin-badge--compatibility' : 'admin-badge--reading';
  return <span className={`admin-badge ${cls}`}>{type || 'unknown'}</span>;
}

function charCount(data) {
  if (data == null) return 0;
  if (typeof data === 'string') return data.length;
  return JSON.stringify(data).length;
}

const SYSTEM_NAMES = [
  'western', 'vedic', 'chinese', 'bazi',
  'numerology', 'kabbalistic', 'gematria', 'persian',
];

const COMPAT_SECTIONS = [
  { key: 'tier1_synthesis', label: 'Tier 1 Synthesis' },
  { key: 'relationship_roles', label: 'Relationship Roles' },
  { key: 'when_you_clash', label: 'When You Clash' },
  { key: 'relationship_playbook', label: 'Relationship Playbook' },
  { key: 'couple_guide', label: 'Couple Guide' },
];

/* ── Collapsible Section ─────────────────────────────────────────── */

function Section({ title, badge, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`admin-section${open ? ' admin-section--open' : ''}`}>
      <div className="admin-section__header" onClick={() => setOpen((o) => !o)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
          {title}
          {badge}
        </span>
        <span className="admin-section__arrow">{'\u25B6'}</span>
      </div>
      {open && <div className="admin-section__body">{children}</div>}
    </div>
  );
}

/* ── Data Renderer (key-value pairs from objects / lists) ────────── */

function DataBlock({ data }) {
  if (data == null) return <p style={{ color: 'var(--muted)' }}>No data</p>;
  if (typeof data === 'string') return <p style={{ whiteSpace: 'pre-wrap' }}>{data}</p>;
  if (Array.isArray(data)) {
    if (data.length === 0) return <p style={{ color: 'var(--muted)' }}>Empty list</p>;
    return (
      <ul style={{ margin: 0, paddingLeft: 'var(--sp-lg)' }}>
        {data.map((item, i) => (
          <li key={i} style={{ marginBottom: 'var(--sp-xs)' }}>
            {typeof item === 'object' ? <DataBlock data={item} /> : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) return <p style={{ color: 'var(--muted)' }}>Empty object</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--muted)', minWidth: 120, fontSize: 'var(--fs-sm)' }}>
              {k.replace(/_/g, ' ')}:
            </span>
            <span style={{ flex: 1 }}>
              {typeof v === 'object' && v !== null ? <DataBlock data={v} /> : String(v ?? '\u2014')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(data)}</span>;
}

/* ── Quality indicator for a section ─────────────────────────────── */

function QualityIndicator({ data, qualityDetails, sectionKey }) {
  const chars = charCount(data);
  const missing =
    qualityDetails?.missing_systems?.includes(sectionKey) ||
    qualityDetails?.missing_sections?.includes(sectionKey);
  const short =
    qualityDetails?.short_systems?.includes(sectionKey) ||
    qualityDetails?.short_sections?.includes(sectionKey);
  const truncated = qualityDetails?.truncated_sections?.includes(sectionKey);

  let color = 'var(--teal)';
  let label = 'ok';
  if (missing) { color = 'var(--coral)'; label = 'missing'; }
  else if (short) { color = 'var(--gold)'; label = 'short'; }
  else if (truncated) { color = 'var(--gold)'; label = 'truncated'; }

  return (
    <span style={{ fontSize: 'var(--fs-xs)', color, marginLeft: 'var(--sp-sm)' }}>
      {chars.toLocaleString()} chars {missing || short || truncated ? `(${label})` : ''}
    </span>
  );
}

/* ── Detail View ─────────────────────────────────────────────────── */

function SessionDetail({ sessionId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch(`sessions/${sessionId}`);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) {
    return (
      <div className="admin-page">
        <button className="admin-card" onClick={onBack} style={{ cursor: 'pointer', marginBottom: 'var(--sp-lg)', display: 'inline-block' }}>
          &larr; Back to Sessions
        </button>
        <p className="admin-empty">Loading session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <button className="admin-card" onClick={onBack} style={{ cursor: 'pointer', marginBottom: 'var(--sp-lg)', display: 'inline-block' }}>
          &larr; Back to Sessions
        </button>
        <p className="admin-empty">{error}</p>
        <button className="admin-card" onClick={fetchDetail} style={{ cursor: 'pointer', marginTop: 'var(--sp-md)' }}>
          Retry
        </button>
      </div>
    );
  }

  const envelope = data;
  const sessionType = envelope.type || 'unknown';
  const isCompat = sessionType === 'compatibility';
  const quality = envelope.quality || {};
  const qualityDetails = quality.details || {};
  const result = envelope.result || {};
  const meta = result.meta || {};

  return (
    <div className="admin-page">
      <button className="admin-card" onClick={onBack} style={{ cursor: 'pointer', marginBottom: 'var(--sp-lg)', display: 'inline-block' }}>
        &larr; Back to Sessions
      </button>

      <div className="admin-detail">
        {/* Metadata header */}
        <div className="admin-detail__header">
          <div className="admin-detail__meta">
            <span className="admin-detail__meta-label">Session ID</span>
            <span className="admin-detail__meta-value" style={{ fontSize: 'var(--fs-sm)', wordBreak: 'break-all' }}>
              {envelope.session_id || sessionId}
            </span>
          </div>
          <div className="admin-detail__meta">
            <span className="admin-detail__meta-label">Type</span>
            <span className="admin-detail__meta-value">{typeBadge(sessionType)}</span>
          </div>
          <div className="admin-detail__meta">
            <span className="admin-detail__meta-label">Date</span>
            <span className="admin-detail__meta-value">{formatTimestamp(envelope.timestamp)}</span>
          </div>
          <div className="admin-detail__meta">
            <span className="admin-detail__meta-label">Duration</span>
            <span className="admin-detail__meta-value">
              {envelope.duration_ms != null ? `${Math.round(envelope.duration_ms)} ms` : '\u2014'}
            </span>
          </div>
          <div className="admin-detail__meta">
            <span className="admin-detail__meta-label">Quality</span>
            <span className="admin-detail__meta-value">{statusBadge(quality.status)}</span>
          </div>
        </div>

        {/* Quality flags */}
        {quality.flags && quality.flags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-xs)' }}>
            {quality.flags.map((flag) => (
              <span key={flag} className="admin-badge admin-badge--review">
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Input summary */}
        {!isCompat && (meta.birth_location || meta.timezone || meta.birth_date) && (
          <div className="admin-detail__header">
            {meta.birth_location && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">Location</span>
                <span className="admin-detail__meta-value">{meta.birth_location}</span>
              </div>
            )}
            {meta.timezone && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">Timezone</span>
                <span className="admin-detail__meta-value">{meta.timezone}</span>
              </div>
            )}
            {meta.birth_date && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">Birth Date</span>
                <span className="admin-detail__meta-value">{meta.birth_date}</span>
              </div>
            )}
            {meta.birth_time && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">Birth Time</span>
                <span className="admin-detail__meta-value">{meta.birth_time}</span>
              </div>
            )}
          </div>
        )}

        {/* Compatibility metadata */}
        {isCompat && (
          <div className="admin-detail__header">
            {result.overall_score != null && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">Overall Score</span>
                <span className="admin-detail__meta-value">{result.overall_score}</span>
              </div>
            )}
            {result.verdict && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">Verdict</span>
                <span className="admin-detail__meta-value">{result.verdict}</span>
              </div>
            )}
            {result.intent && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">Intent</span>
                <span className="admin-detail__meta-value">{result.intent}</span>
              </div>
            )}
            {result.user_name && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">User</span>
                <span className="admin-detail__meta-value">{result.user_name}</span>
              </div>
            )}
            {result.partner_name && (
              <div className="admin-detail__meta">
                <span className="admin-detail__meta-label">Partner</span>
                <span className="admin-detail__meta-value">{result.partner_name}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Content Sections ───────────────────────────────────── */}

        {isCompat ? (
          <>
            {/* Compatibility narrative sections */}
            {COMPAT_SECTIONS.map(({ key, label }) => (
              <Section
                key={key}
                title={label}
                badge={
                  <QualityIndicator
                    data={result[key]}
                    qualityDetails={qualityDetails}
                    sectionKey={key}
                  />
                }
              >
                <DataBlock data={result[key]} />
              </Section>
            ))}

            {/* Per-system results */}
            <Section title="Per-System Results">
              {SYSTEM_NAMES.map((name) => {
                const sysData = (result.systems || {})[name];
                return (
                  <Section
                    key={name}
                    title={name.charAt(0).toUpperCase() + name.slice(1)}
                    badge={
                      <QualityIndicator
                        data={sysData}
                        qualityDetails={qualityDetails}
                        sectionKey={name}
                      />
                    }
                  >
                    {sysData ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                        {sysData.score != null && (
                          <div><strong style={{ color: 'var(--muted)' }}>Score:</strong> {sysData.score}</div>
                        )}
                        {sysData.harmony != null && (
                          <div><strong style={{ color: 'var(--muted)' }}>Harmony:</strong> {sysData.harmony}</div>
                        )}
                        {sysData.dynamic && (
                          <div><strong style={{ color: 'var(--muted)' }}>Dynamic:</strong> {sysData.dynamic}</div>
                        )}
                        {sysData.strengths && (
                          <div>
                            <strong style={{ color: 'var(--muted)' }}>Strengths:</strong>
                            <DataBlock data={sysData.strengths} />
                          </div>
                        )}
                        {sysData.challenges && (
                          <div>
                            <strong style={{ color: 'var(--muted)' }}>Challenges:</strong>
                            <DataBlock data={sysData.challenges} />
                          </div>
                        )}
                        {/* Show remaining fields */}
                        {(() => {
                          const shown = new Set(['score', 'harmony', 'dynamic', 'strengths', 'challenges']);
                          const rest = Object.fromEntries(
                            Object.entries(sysData).filter(([k]) => !shown.has(k))
                          );
                          return Object.keys(rest).length > 0 ? <DataBlock data={rest} /> : null;
                        })()}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--muted)' }}>No data for this system</p>
                    )}
                  </Section>
                );
              })}
            </Section>
          </>
        ) : (
          <>
            {/* Reading: Combined */}
            <Section
              title="Combined"
              badge={
                <QualityIndicator
                  data={result.combined}
                  qualityDetails={qualityDetails}
                  sectionKey="combined"
                />
              }
            >
              <DataBlock data={result.combined} />
            </Section>

            {/* Reading: Daily */}
            <Section
              title="Daily"
              badge={
                <QualityIndicator
                  data={result.daily}
                  qualityDetails={qualityDetails}
                  sectionKey="daily"
                />
              }
            >
              <DataBlock data={result.daily} />
            </Section>

            {/* Reading: Per-system results */}
            <Section title="Per-System Results">
              {SYSTEM_NAMES.map((name) => {
                const sysData = (result.systems || {})[name];
                return (
                  <Section
                    key={name}
                    title={name.charAt(0).toUpperCase() + name.slice(1)}
                    badge={
                      <QualityIndicator
                        data={sysData}
                        qualityDetails={qualityDetails}
                        sectionKey={name}
                      />
                    }
                  >
                    <DataBlock data={sysData} />
                  </Section>
                );
              })}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* ── List View ───────────────────────────────────────────────────── */

function SessionList({ onSelect }) {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const result = await adminFetch(`sessions?${params.toString()}`);
      setSessions(result.sessions || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  return (
    <div className="admin-page">
      <h2 className="admin-title">Sessions Inspector</h2>

      {/* Filter bar */}
      <div className="admin-filter">
        <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>Type:</label>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="reading">Reading</option>
          <option value="compatibility">Compatibility</option>
        </select>
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginLeft: 'auto' }}>
          {total} total
        </span>
      </div>

      {/* Loading */}
      {loading && <p className="admin-empty">Loading sessions...</p>}

      {/* Error */}
      {error && !loading && (
        <>
          <p className="admin-empty">{error}</p>
          <button className="admin-card" onClick={fetchSessions} style={{ cursor: 'pointer', marginTop: 'var(--sp-md)' }}>
            Retry
          </button>
        </>
      )}

      {/* Empty */}
      {!loading && !error && sessions.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__icon">{'\uD83D\uDCCB'}</span>
          <span>No sessions found</span>
        </div>
      )}

      {/* Table */}
      {!loading && !error && sessions.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Quality</th>
              <th>Flags</th>
              <th>Duration (ms)</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr
                key={s.session_id}
                onClick={() => onSelect(s.session_id)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.session_id}
                </td>
                <td>{typeBadge(s.type)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatTimestamp(s.timestamp)}</td>
                <td>{statusBadge(s.quality_status)}</td>
                <td>
                  {(s.quality_flags || []).length > 0 ? (
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--gold)' }}>
                      {s.quality_flags.length} flag{s.quality_flags.length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>{'\u2014'}</span>
                  )}
                </td>
                <td>{s.duration_ms != null ? Math.round(s.duration_ms) : '\u2014'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

export function AdminSessions({ initialSessionId }) {
  const [selectedId, setSelectedId] = useState(initialSessionId || null);

  if (selectedId) {
    return (
      <SessionDetail
        sessionId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return <SessionList onSelect={setSelectedId} />;
}
