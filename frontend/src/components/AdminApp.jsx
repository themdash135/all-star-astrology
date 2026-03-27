import React, { useState } from 'react';
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
    window.location.reload();
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
  const [adminTab, setAdminTab] = useState('health');
  const [inspectSessionId, setInspectSessionId] = useState(null);

  function handleInspect(sessionId) {
    setInspectSessionId(sessionId);
    setAdminTab('sessions');
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!adminKey.trim()) return;
    sessionStorage.setItem('admin-key', adminKey.trim());
    setAuthenticated(true);
  }

  function handleBackToApp() {
    window.location.hash = '';
  }

  if (!authenticated) {
    return (
      <div className="admin-gate">
        <div>
          <h1 className="admin-title">Admin</h1>
          <p className="admin-subtitle">Enter your admin key to continue</p>
          <form onSubmit={handleLogin}>
            <input
              className="admin-key-input"
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              autoFocus
            />
            <button className="admin-login-btn" type="submit" disabled={!adminKey.trim()}>
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
