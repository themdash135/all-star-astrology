import React, { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';

const WHATS_NEW_KEY = 'allstar-whats-new-seen';
const FALLBACK_BUILD = import.meta.env.VITE_APP_VERSION || 'dev-build';

const UPDATES = [
  'Oracle and readings now work everywhere — no Wi-Fi or cable needed',
  'Security hardened with encrypted connections',
  'New Feedback tab — tell us what you think',
  'Faster load times with optimized backend',
];

export function WhatsNew() {
  const [visible, setVisible] = useState(false);
  const [buildId, setBuildId] = useState(FALLBACK_BUILD);

  useEffect(() => {
    let cancelled = false;

    async function checkVisibility() {
      let nextBuildId = FALLBACK_BUILD;
      try {
        const info = await CapApp.getInfo();
        nextBuildId = [info.version, info.build].filter(Boolean).join(' ') || FALLBACK_BUILD;
      } catch {}

      if (cancelled) return;
      setBuildId(nextBuildId);

      try {
        const seen = localStorage.getItem(WHATS_NEW_KEY);
        if (seen !== nextBuildId) setVisible(true);
      } catch {}
    }

    checkVisibility();
    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(WHATS_NEW_KEY, buildId); } catch {}
  };

  if (!visible) return null;

  return (
    <div className="wn-overlay" onClick={dismiss}>
      <div className="wn-card" onClick={e => e.stopPropagation()}>
        <div className="wn-glow" />
        <div className="wn-badge">NEW</div>
        <h2 className="wn-title">What's New</h2>
        <p className="wn-version">Build {buildId}</p>
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
