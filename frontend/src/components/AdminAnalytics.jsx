import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from './AdminApp.jsx';

const PERIODS = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
  { label: 'All', hours: null },
];

function formatTimestamp(ts) {
  if (!ts) return '\u2014';
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

function formatDetails(data) {
  if (!data || typeof data !== 'object') return '\u2014';
  const parts = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
  return parts.join(', ') || '\u2014';
}

export function AdminAnalytics() {
  const [period, setPeriod] = useState(168);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = period != null ? `analytics?hours=${period}` : 'analytics';
      const result = await adminFetch(query);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Derive summary values
  const totalEvents = data?.total_events ?? 0;
  const eventCounts = data?.event_counts || {};
  const eventCountEntries = Object.entries(eventCounts);
  const topEvent = eventCountEntries.length > 0 ? eventCountEntries[0] : null;

  const sectionViews = data?.section_views || {};
  const sectionEntries = Object.entries(sectionViews).sort((a, b) => b[1] - a[1]);

  const recent = data?.recent || [];

  if (loading) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Analytics Dashboard</h2>
        <p className="admin-empty">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Analytics Dashboard</h2>
        <p className="admin-empty">{error}</p>
        <button className="admin-card" onClick={fetchAnalytics} style={{ cursor: 'pointer', marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2 className="admin-title">Analytics Dashboard</h2>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {PERIODS.map((p) => (
          <button
            key={p.label}
            className={period === p.hours ? 'admin-login-btn' : 'admin-card'}
            style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: 'var(--fs-sm)' }}
            onClick={() => setPeriod(p.hours)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="admin-cards">
        <div className="admin-card">
          <div className="admin-card__value">{totalEvents}</div>
          <div className="admin-card__label">Total Events</div>
        </div>

        <div className="admin-card">
          <div className="admin-card__value">
            {topEvent ? `${topEvent[0]}` : '\u2014'}
          </div>
          <div className="admin-card__label">
            Top Event{topEvent ? ` (${topEvent[1]})` : ''}
          </div>
        </div>
      </div>

      {/* Event counts table */}
      <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>Event Counts</h3>

      {eventCountEntries.length === 0 ? (
        <p className="admin-empty">No events recorded</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {eventCountEntries.map(([name, count]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Section views ranking */}
      <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>Section Views</h3>

      {sectionEntries.length === 0 ? (
        <p className="admin-empty">No section views recorded</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Views</th>
            </tr>
          </thead>
          <tbody>
            {sectionEntries.map(([section, views], i) => {
              const isTop3 = i < 3;
              const isBottom3 = sectionEntries.length > 3 && i >= sectionEntries.length - 3;
              const rowStyle = isTop3
                ? { background: 'rgba(34,197,94,0.1)' }
                : isBottom3
                  ? { background: 'rgba(239,68,68,0.08)' }
                  : {};
              return (
                <tr key={section} style={rowStyle}>
                  <td>{section}</td>
                  <td>{views}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Recent events */}
      <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>Recent Events</h3>

      {recent.length === 0 ? (
        <p className="admin-empty">No recent events</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {recent.slice(0, 50).map((item, i) => (
              <tr key={i}>
                <td>{formatTimestamp(item.timestamp)}</td>
                <td>{item.event || '\u2014'}</td>
                <td>{formatDetails(item.data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
