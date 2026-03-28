import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminFetch } from './AdminApp.jsx';

const AUTO_REFRESH_SECONDS = 30;

function formatTimestamp(ts) {
  if (!ts) return '\u2014';
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
    if (value <= 0) return 'admin-card--ok';
    if (value <= warnThreshold) return 'admin-card--warn';
    return 'admin-card--bad';
  }
  if (value >= okThreshold) return 'admin-card--ok';
  if (value >= warnThreshold) return 'admin-card--warn';
  return 'admin-card--bad';
}

/** Color-code response time: <500ms green, 500-2000ms amber, >2000ms red */
function responseTimeVariant(ms) {
  if (ms == null) return '';
  if (ms < 500) return 'admin-card--fast';
  if (ms <= 2000) return 'admin-card--moderate';
  return 'admin-card--slow';
}

export function AdminHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [expandedErrors, setExpandedErrors] = useState({});
  const countdownRef = useRef(null);
  const tickRef = useRef(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch('health');
      setData(result);
      setBackendOnline(true);
      setLastUpdated(Date.now());
      setSecondsAgo(0);
      setCountdown(AUTO_REFRESH_SECONDS);
    } catch (err) {
      setBackendOnline(false);
      setError(err.message || 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchHealth();
          return AUTO_REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [fetchHealth]);

  // Update "seconds ago" ticker
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (lastUpdated) {
        setSecondsAgo(Math.round((Date.now() - lastUpdated) / 1000));
      }
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [lastUpdated]);

  function toggleErrorExpanded(index) {
    setExpandedErrors((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  if (loading && !data) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Health Dashboard</h2>
        <p className="admin-empty">Loading...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="admin-page">
        <div className="admin-status-bar">
          <div className="admin-status-dot admin-status-dot--offline" />
          <span className="admin-status-text admin-status-text--offline">Offline</span>
        </div>
        <h2 className="admin-title">Health Dashboard</h2>
        <p className="admin-empty">{error}</p>
        <button className="admin-refresh-btn" onClick={fetchHealth} style={{ marginTop: '1rem' }}>
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
      {/* Backend status indicator */}
      <div className="admin-status-bar">
        <div className={`admin-status-dot admin-status-dot--${backendOnline ? 'online' : 'offline'}`} />
        <span className={`admin-status-text admin-status-text--${backendOnline ? 'online' : 'offline'}`}>
          {backendOnline ? 'Online' : 'Offline'}
        </span>
        {lastUpdated && (
          <span className="admin-last-updated">
            Last updated: {secondsAgo}s ago
          </span>
        )}
        <span className="admin-countdown">
          Next refresh in {countdown}s
        </span>
      </div>

      {/* Header with refresh */}
      <div className="admin-header-row">
        <h2 className="admin-title" style={{ margin: 0 }}>Health Dashboard</h2>
        <button className="admin-refresh-btn" onClick={fetchHealth} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

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

        <div className={`admin-card ${responseTimeVariant(avgMs != null ? Math.round(avgMs) : null)}`}>
          <div className="admin-card__value">
            {avgMs != null ? Math.round(avgMs) : '\u2014'}
          </div>
          <div className="admin-card__label">Avg Response (ms)</div>
        </div>

        <div className={`admin-card ${responseTimeVariant(slowestMs != null ? Math.round(slowestMs) : null)}`}>
          <div className="admin-card__value">
            {slowestMs != null ? Math.round(slowestMs) : '\u2014'}
          </div>
          <div className="admin-card__label">Slowest Response (ms)</div>
        </div>

        <div className={`admin-card ${cardVariant(successRate7d != null ? successRate7d * 100 : null, 95, 80, false)}`}>
          <div className="admin-card__value">
            {successRate7d != null ? `${(successRate7d * 100).toFixed(1)}%` : '\u2014'}
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
            {recentErrors.map((err, i) => {
              const isExpanded = !!expandedErrors[i];
              const errorText = err.error || '\u2014';
              const isLong = errorText.length > 80;
              return (
                <tr
                  key={i}
                  className={isLong ? 'admin-error-row' : ''}
                  onClick={isLong ? () => toggleErrorExpanded(i) : undefined}
                >
                  <td>{formatTimestamp(err.timestamp)}</td>
                  <td>{err.endpoint || '\u2014'}</td>
                  <td>
                    <div className={`admin-error-text ${isExpanded ? 'admin-error-text--expanded' : isLong ? 'admin-error-text--truncated' : ''}`}>
                      {errorText}
                    </div>
                    {isLong && !isExpanded && (
                      <span className="admin-expand-hint">click to expand</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
