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

function shortId(id) {
  if (!id) return '—';
  if (id.length <= 16) return id;
  return id.slice(0, 14) + '...';
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
                  <td>{flag}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

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
                <td>{(session.flags || []).join(', ') || '—'}</td>
                <td>{session.fallback_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
