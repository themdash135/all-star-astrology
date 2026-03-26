import React, { useId, useState } from 'react';

export function IconHome({ active }) {
  const color = active ? 'var(--gold)' : 'var(--muted)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function IconGrid({ active }) {
  const color = active ? 'var(--gold)' : 'var(--muted)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

export function IconStar({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--gold)' : 'none'} stroke={active ? 'var(--gold)' : 'var(--muted)'} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  );
}

export function IconUser({ active }) {
  const color = active ? 'var(--gold)' : 'var(--muted)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function IconChevron({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 250ms cubic-bezier(.4,0,.2,1)' }} aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function IconOracle({ active }) {
  const color = active ? 'var(--gold)' : 'var(--muted)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="10" r="7" />
      <path d="M8.5 20h7" />
      <path d="M9.5 18h5" />
      <path d="M9 14c0 0 1 2 3 2s3-2 3-2" />
      <circle cx="12" cy="10" r="3" fill={active ? 'rgba(212,165,116,.2)' : 'none'} stroke="none" />
    </svg>
  );
}

export function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
    </svg>
  );
}

export function IconCombined({ active }) {
  const color = active ? 'var(--gold)' : 'var(--muted)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M5.6 5.6l12.8 12.8" />
      <path d="M18.4 5.6L5.6 18.4" />
    </svg>
  );
}

export function IconGames({ active }) {
  const color = active ? 'var(--gold)' : 'var(--muted)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <path d="M8 6v12" />
      <path d="M16 6v12" />
      <circle cx="8" cy="12" r="1" fill={color} stroke="none" />
      <circle cx="16" cy="10" r="1" fill={color} stroke="none" />
      <circle cx="18" cy="12" r="1" fill={color} stroke="none" />
      <circle cx="16" cy="14" r="1" fill={color} stroke="none" />
      <circle cx="14" cy="12" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function IconReadings({ active }) {
  const color = active ? 'var(--gold)' : 'var(--muted)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

export function IconFeedback({ active }) {
  const color = active ? 'var(--gold)' : 'var(--muted)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

export function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      className={`toggle ${value ? 'toggle--on' : ''}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
      aria-label={label}
    >
      <div className="toggle-knob" />
    </button>
  );
}

export function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="accordion">
      <button
        type="button"
        className="accordion-hd"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span>{title}</span>
        <IconChevron open={open} />
      </button>
      <div id={panelId} className={`accordion-bd ${open ? 'accordion-bd--open' : ''}`}>
        <div className="accordion-inner">{children}</div>
      </div>
    </div>
  );
}

export function DataCards({ block }) {
  if (!block?.rows?.length) {
    return null;
  }

  return (
    <div className="dcards-section">
      <div className="dcards-title">{block.title}</div>
      {block.rows.map((row, rowIndex) => (
        <div className="dcard glass" key={rowIndex}>
          {block.columns.map((column, columnIndex) => (
            <div className="dcard-field" key={columnIndex}>
              <span className="dcard-label">{column}</span>
              <span className="dcard-value">{String(row[columnIndex])}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
