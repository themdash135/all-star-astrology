import React, { useState, useEffect } from 'react';

const APP_VERSION = '1.1.1';
const WHATS_NEW_KEY = 'allstar-whats-new-seen';

const UPDATES = [
  'Oracle and readings now work everywhere — no Wi-Fi or cable needed',
  'Security hardened with encrypted connections',
  'New Feedback tab — tell us what you think',
  'Faster load times with optimized backend',
];

export function WhatsNew() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(WHATS_NEW_KEY);
      if (seen !== APP_VERSION) setVisible(true);
    } catch { /* storage unavailable */ }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(WHATS_NEW_KEY, APP_VERSION); } catch {}
  };

  if (!visible) return null;

  return (
    <div className="wn-overlay" onClick={dismiss}>
      <div className="wn-card" onClick={e => e.stopPropagation()}>
        <div className="wn-glow" />
        <div className="wn-badge">NEW</div>
        <h2 className="wn-title">What's New</h2>
        <p className="wn-version">Version {APP_VERSION}</p>
        <ul className="wn-list">
          {UPDATES.map((item, i) => (
            <li key={i} className="wn-item" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="wn-dot" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="wn-btn" onClick={dismiss}>
          Got it
        </button>
      </div>
    </div>
  );
}
