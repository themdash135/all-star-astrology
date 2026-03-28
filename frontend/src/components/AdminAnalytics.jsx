import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from './AdminApp.jsx';

const PERIODS = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
  { label: 'All', hours: null },
];

/** Map raw event names to human-readable labels */
const EVENT_LABELS = {
  reading_generated: 'Readings Generated',
  section_view: 'Section Views',
  oracle_question: 'Oracle Questions',
  oracle_ask: 'Oracle Questions',
  app_open: 'App Opens',
  app_launch: 'App Launches',
  onboarding_complete: 'Onboarding Completed',
  onboarding_start: 'Onboarding Started',
  theme_change: 'Theme Changes',
  feedback_submit: 'Feedback Submitted',
  feedback_sent: 'Feedback Sent',
  share: 'Shares',
  share_reading: 'Reading Shares',
  error: 'Errors',
  settings_open: 'Settings Opened',
  edit_birth_data: 'Birth Data Edits',
  daily_view: 'Daily Views',
  combined_view: 'Combined Views',
  game_play: 'Games Played',
};

function humanLabel(rawName) {
  return EVENT_LABELS[rawName] || rawName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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
  const totalSectionViews = sectionEntries.reduce((sum, [, v]) => sum + v, 0);
  const maxSectionViews = sectionEntries.length > 0 ? sectionEntries[0][1] : 1;

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
        <button className="admin-refresh-btn" onClick={fetchAnalytics} style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2 className="admin-title">Analytics Dashboard</h2>

      {/* Period selector — pill toggle */}
      <div className="admin-pill-group">
        {PERIODS.map((p) => (
          <button
            key={p.label}
            className={`admin-pill${period === p.hours ? ' admin-pill--active' : ''}`}
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
            {topEvent ? humanLabel(topEvent[0]) : '\u2014'}
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
              <th>Event</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {eventCountEntries.map(([name, count]) => (
              <tr key={name}>
                <td>{humanLabel(name)}</td>
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
              const pct = totalSectionViews > 0 ? ((views / totalSectionViews) * 100).toFixed(1) : '0.0';
              const barWidth = maxSectionViews > 0 ? Math.max(2, (views / maxSectionViews) * 100) : 0;
              const isTop3 = i < 3;
              const isBottom3 = sectionEntries.length > 3 && i >= sectionEntries.length - 3;
              const rowStyle = isTop3
                ? { background: 'rgba(34,197,94,0.1)' }
                : isBottom3
                  ? { background: 'rgba(239,68,68,0.08)' }
                  : {};
              return (
                <tr key={section} style={rowStyle}>
                  <td>{section} ({pct}%)</td>
                  <td>
                    <div className="admin-bar-cell">
                      <div className="admin-bar" style={{ width: `${barWidth}%`, maxWidth: '120px' }} />
                      <span className="admin-bar-count">{views}</span>
                    </div>
                  </td>
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
                <td>{humanLabel(item.event || '')}</td>
                <td>{formatDetails(item.data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
