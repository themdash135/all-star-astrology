import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from './AdminApp.jsx';

function formatDate(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

function formatShortDate(ts) {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

function shortId(id) {
  if (!id) return '—';
  if (id.length <= 16) return id;
  return id.slice(0, 14) + '...';
}

/** Map a flag name to a badge CSS class */
function flagBadgeClass(flag) {
  if (!flag) return 'admin-badge--flag-default';
  const f = flag.toLowerCase();
  if (f.includes('missing')) return 'admin-badge--flag-missing';
  if (f.includes('short'))   return 'admin-badge--flag-short';
  if (f.includes('truncat')) return 'admin-badge--flag-truncated';
  if (f.includes('fallback')) return 'admin-badge--flag-fallback';
  return 'admin-badge--flag-default';
}

/** Fallback count CSS class */
function fallbackClass(count) {
  if (count === 0 || count == null) return 'admin-fallback--zero';
  if (count <= 2) return 'admin-fallback--warn';
  return 'admin-fallback--bad';
}

export function AdminQuality({ onInspect }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchQuality = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch('quality?limit=50');
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load quality data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuality();
  }, [fetchQuality]);

  const filteredSessions = useMemo(() => {
    if (!data?.sessions) return [];
    return data.sessions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      return true;
    });
  }, [data, statusFilter, typeFilter]);

  /** Compute the date range of the displayed sessions */
  const dateRange = useMemo(() => {
    if (filteredSessions.length === 0) return null;
    const dates = filteredSessions
      .map((s) => s.created)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((t) => !isNaN(t));
    if (dates.length === 0) return null;
    const earliest = formatShortDate(new Date(Math.min(...dates)));
    const latest = formatShortDate(new Date(Math.max(...dates)));
    if (!earliest || !latest) return null;
    return earliest === latest
      ? `Showing sessions from ${earliest}`
      : `Showing sessions from ${earliest} to ${latest}`;
  }, [filteredSessions]);

  if (loading) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Quality Monitor</h2>
        <p className="admin-empty">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Quality Monitor</h2>
        <p className="admin-empty">{error}</p>
        <button className="admin-card" onClick={fetchQuality} style={{ cursor: 'pointer', marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const counts = data?.status_counts || {};
  const healthy = counts.healthy ?? 0;
  const review = counts.review ?? 0;
  const poor = counts.poor ?? 0;
  const totalReviewed = data?.total_reviewed ?? 0;
  const topFlags = data?.top_flags || {};
  const flagEntries = Object.entries(topFlags).sort((a, b) => b[1] - a[1]);

  return (
    <div className="admin-page">
      <h2 className="admin-title">Quality Monitor</h2>

      {/* Summary cards */}
      <div className="admin-cards">
        <div className="admin-card admin-card--ok">
          <div className="admin-card__value">{healthy}</div>
          <div className="admin-card__label">Healthy</div>
        </div>

        <div className="admin-card admin-card--warn">
          <div className="admin-card__value">{review}</div>
          <div className="admin-card__label">Review</div>
        </div>

        <div className="admin-card admin-card--bad">
          <div className="admin-card__value">{poor}</div>
          <div className="admin-card__label">Poor</div>
        </div>

        <div className="admin-card">
          <div className="admin-card__value">{totalReviewed}</div>
          <div className="admin-card__label">Total Reviewed</div>
        </div>
      </div>

      {/* Top flags */}
      {flagEntries.length > 0 && (
        <>
          <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>Top Flags</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Flag</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {flagEntries.map(([flag, count]) => (
                  <tr key={flag}>
                    <td>
                      <span className={`admin-badge ${flagBadgeClass(flag)}`}>
                        {flag.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Date range hint */}
      {dateRange && <p className="admin-date-range">{dateRange}</p>}

      {/* Filters */}
      <div className="admin-filter">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="healthy">Healthy</option>
          <option value="review">Review</option>
          <option value="poor">Poor</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="reading">Reading</option>
          <option value="compatibility">Compatibility</option>
        </select>
      </div>

      {/* Sessions table */}
      {filteredSessions.length === 0 ? (
        <p className="admin-empty">No sessions match the current filters</p>
      ) : (
        <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Fallback Count</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session) => (
              <tr
                key={session.id}
                onClick={() => onInspect && onInspect(session.id)}
                style={{ cursor: onInspect ? 'pointer' : 'default' }}
              >
                <td title={session.id}>{shortId(session.id)}</td>
                <td>
                  <span className={`admin-badge admin-badge--${session.type || 'reading'}`}>
                    {session.type || 'reading'}
                  </span>
                </td>
                <td>{formatDate(session.created)}</td>
                <td>
                  <span className={`admin-badge admin-badge--${session.status || 'healthy'}`}>
                    {session.status || 'healthy'}
                  </span>
                </td>
                <td>
                  {(session.flags || []).length > 0 ? (
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {session.flags.map((flag) => (
                        <span key={flag} className={`admin-badge ${flagBadgeClass(flag)}`}>
                          {flag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </td>
                <td>
                  <span className={fallbackClass(session.fallback_count ?? 0)}>
                    {session.fallback_count ?? 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
