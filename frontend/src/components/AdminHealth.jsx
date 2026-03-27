import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from './AdminApp.jsx';

function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

function cardVariant(value, okThreshold, warnThreshold, invert) {
  if (value == null) return '';
  if (invert) {
    // Lower is better (e.g. errors): 0 is ok, low is warn, high is bad
    if (value <= 0) return 'admin-card--ok';
    if (value <= warnThreshold) return 'admin-card--warn';
    return 'admin-card--bad';
  }
  // Higher is better (e.g. success rate)
  if (value >= okThreshold) return 'admin-card--ok';
  if (value >= warnThreshold) return 'admin-card--warn';
  return 'admin-card--bad';
}

export function AdminHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch('health');
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Health Dashboard</h2>
        <p className="admin-empty">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Health Dashboard</h2>
        <p className="admin-empty">{error}</p>
        <button className="admin-card" onClick={fetchHealth} style={{ cursor: 'pointer', marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const h24 = data?.last_24h || {};
  const h7d = data?.last_7d || {};

  const totalGen24 = h24.total_generations ?? 0;
  const totalGen7d = h7d.total_generations ?? 0;
  const errors24 = h24.errors ?? 0;
  const errors7d = h7d.errors ?? 0;
  const avgMs = h24.avg_duration_ms;
  const slowestMs = h24.slowest_duration_ms;
  const successRate7d = h7d.success_rate;

  const recentErrors = h24.recent_errors || [];

  return (
    <div className="admin-page">
      <h2 className="admin-title">Health Dashboard</h2>

      <div className="admin-cards">
        <div className={`admin-card ${cardVariant(totalGen24, 10, 1, false)}`}>
          <div className="admin-card__value">{totalGen24}</div>
          <div className="admin-card__label">Generations (24h)</div>
        </div>

        <div className="admin-card">
          <div className="admin-card__value">{totalGen7d}</div>
          <div className="admin-card__label">Generations (7d)</div>
        </div>

        <div className={`admin-card ${cardVariant(errors24, 0, 1, true)}`}>
          <div className="admin-card__value">{errors24}</div>
          <div className="admin-card__label">Errors (24h)</div>
        </div>

        <div className={`admin-card ${cardVariant(errors7d, 0, 3, true)}`}>
          <div className="admin-card__value">{errors7d}</div>
          <div className="admin-card__label">Errors (7d)</div>
        </div>

        <div className="admin-card">
          <div className="admin-card__value">
            {avgMs != null ? Math.round(avgMs) : '—'}
          </div>
          <div className="admin-card__label">Avg Response (ms)</div>
        </div>

        <div className="admin-card">
          <div className="admin-card__value">
            {slowestMs != null ? Math.round(slowestMs) : '—'}
          </div>
          <div className="admin-card__label">Slowest Response (ms)</div>
        </div>

        <div className={`admin-card ${cardVariant(successRate7d != null ? successRate7d * 100 : null, 95, 80, false)}`}>
          <div className="admin-card__value">
            {successRate7d != null ? `${(successRate7d * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="admin-card__label">Success Rate (7d)</div>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>Recent Failures (24h)</h3>

      {recentErrors.length === 0 ? (
        <p className="admin-empty">No errors in the last 24 hours</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Endpoint</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {recentErrors.map((err, i) => (
              <tr key={i}>
                <td>{formatTimestamp(err.timestamp)}</td>
                <td>{err.endpoint || '—'}</td>
                <td>{err.error || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
