import React, { useState, useEffect, useCallback } from 'react';
import { AdminHealth } from './AdminHealth.jsx';
import { AdminQuality } from './AdminQuality.jsx';
import { AdminFeedback } from './AdminFeedback.jsx';
import { AdminAnalytics } from './AdminAnalytics.jsx';
import { AdminSessions } from './AdminSessions.jsx';

/**
 * Fetch helper for /api/admin/* endpoints.
 * Attaches the admin key from sessionStorage and handles 403 by clearing the key.
 */
export async function adminFetch(endpoint, options = {}) {
  const key = sessionStorage.getItem('admin-key') || '';
  const res = await fetch(`/api/admin/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'X-Backend-Key': key,
      'Content-Type': 'application/json',
    },
  });
  if (res.status === 403) {
    sessionStorage.removeItem('admin-key');
    throw new Error('Invalid admin key');
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Fetch helper for /api/feedback/* endpoints (admin-authenticated).
 */
export async function adminFeedbackFetch(endpoint, options = {}) {
  const key = sessionStorage.getItem('admin-key') || '';
  const res = await fetch(`/api/feedback/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'X-Backend-Key': key,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

const TABS = [
  { id: 'health', label: 'Health' },
  { id: 'quality', label: 'Quality' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'sessions', label: 'Sessions' },
];

export default function AdminApp() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem('admin-key'));
  const [authError, setAuthError] = useState('');
  const [adminTab, setAdminTab] = useState('health');
  const [inspectSessionId, setInspectSessionId] = useState(null);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);

  function handleInspect(sessionId) {
    setInspectSessionId(sessionId);
    setAdminTab('sessions');
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!adminKey.trim()) return;
    setAuthError('');
    sessionStorage.setItem('admin-key', adminKey.trim());
    // Validate the key by making a test request
    try {
      await adminFetch('health');
      setAuthenticated(true);
    } catch (err) {
      if (err.message === 'Invalid admin key') {
        setAuthError('Invalid admin key');
      } else {
        // Key might be valid but other error; let them through
        setAuthenticated(true);
      }
    }
  }

  // Fetch pending feedback count on mount and when tab changes
  const fetchPendingFeedback = useCallback(async () => {
    try {
      const tickets = await adminFeedbackFetch('admin');
      const pending = (tickets || []).filter((t) => (t.status || 'pending') !== 'resolved').length;
      setPendingFeedbackCount(pending);
    } catch {
      // Silently ignore - badge just won't show
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchPendingFeedback();
      // Refresh count every 60 seconds
      const interval = setInterval(fetchPendingFeedback, 60000);
      return () => clearInterval(interval);
    }
  }, [authenticated, fetchPendingFeedback]);

  function handleBackToApp() {
    window.location.hash = '';
  }

  if (!authenticated) {
    return (
      <div className="admin-gate">
        <div>
          <span className="admin-brand-star">&#9733;</span>
          <h1 className="admin-title">All Star Astrology</h1>
          <p className="admin-subtitle">Admin Panel</p>
          <form onSubmit={handleLogin}>
            <input
              className="admin-key-input"
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={(e) => { setAdminKey(e.target.value); setAuthError(''); }}
              autoFocus
            />
            {authError && <div className="admin-auth-error">{authError}</div>}
            <button className="admin-login-btn" type="submit" disabled={!adminKey.trim()} style={{ marginTop: 'var(--sp-md)' }}>
              Enter Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <div className="admin-nav__header">
          <span>Admin</span>
          <a href="#" onClick={(e) => { e.preventDefault(); handleBackToApp(); }} style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', textDecoration: 'none' }}>
            Back to App
          </a>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={adminTab === t.id ? 'active' : ''}
            onClick={() => { setAdminTab(t.id); if (t.id !== 'sessions') setInspectSessionId(null); }}
          >
            {t.label}
            {t.id === 'feedback' && pendingFeedbackCount > 0 && (
              <span className="admin-feedback-badge">{pendingFeedbackCount}</span>
            )}
          </button>
        ))}
      </nav>
      <main>
        {adminTab === 'health' && <AdminHealth />}
        {adminTab === 'quality' && <AdminQuality onInspect={handleInspect} />}
        {adminTab === 'feedback' && <AdminFeedback />}
        {adminTab === 'analytics' && <AdminAnalytics />}
        {adminTab === 'sessions' && <AdminSessions initialSessionId={inspectSessionId} />}
      </main>
    </div>
  );
}
