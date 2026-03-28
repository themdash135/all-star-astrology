import React from 'react';

export function SplashScreen({ onStart, onRestore }) {
  return (
    <div className="screen splash">
      <div className="splash-bg" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            className="bg-star"
            style={{
              left: `${(index * 37 + 13) % 100}%`,
              top: `${(index * 53 + 7) % 100}%`,
              animationDelay: `${(index * 0.7) % 4}s`,
              width: `${1.5 + (index % 3)}px`,
              height: `${1.5 + (index % 3)}px`,
            }}
          />
        ))}
      </div>

      <svg className="constellation" viewBox="0 0 200 200" fill="none" aria-hidden="true">
        <line x1="38" y1="52" x2="92" y2="26" stroke="rgba(212,165,116,.2)" strokeWidth="1" className="cline" style={{ animationDelay: '.2s' }} />
        <line x1="92" y1="26" x2="158" y2="62" stroke="rgba(123,140,222,.18)" strokeWidth="1" className="cline" style={{ animationDelay: '.5s' }} />
        <line x1="38" y1="52" x2="72" y2="98" stroke="rgba(123,140,222,.18)" strokeWidth="1" className="cline" style={{ animationDelay: '.7s' }} />
        <line x1="72" y1="98" x2="138" y2="118" stroke="rgba(212,165,116,.2)" strokeWidth="1" className="cline" style={{ animationDelay: '1s' }} />
        <line x1="158" y1="62" x2="138" y2="118" stroke="rgba(212,165,116,.2)" strokeWidth="1" className="cline" style={{ animationDelay: '1.2s' }} />
        <line x1="72" y1="98" x2="52" y2="148" stroke="rgba(123,140,222,.18)" strokeWidth="1" className="cline" style={{ animationDelay: '1.4s' }} />
        <line x1="52" y1="148" x2="118" y2="158" stroke="rgba(212,165,116,.2)" strokeWidth="1" className="cline" style={{ animationDelay: '1.6s' }} />
        <line x1="138" y1="118" x2="118" y2="158" stroke="rgba(123,140,222,.18)" strokeWidth="1" className="cline" style={{ animationDelay: '1.8s' }} />
        <circle cx="38" cy="52" r="3" fill="#D4A574" className="star-dot" style={{ animationDelay: '0s' }} />
        <circle cx="92" cy="26" r="3.5" fill="#7B8CDE" className="star-dot" style={{ animationDelay: '.3s' }} />
        <circle cx="158" cy="62" r="2.5" fill="#D4A574" className="star-dot" style={{ animationDelay: '.6s' }} />
        <circle cx="72" cy="98" r="3" fill="#7B8CDE" className="star-dot" style={{ animationDelay: '.8s' }} />
        <circle cx="138" cy="118" r="3" fill="#D4A574" className="star-dot" style={{ animationDelay: '1.1s' }} />
        <circle cx="52" cy="148" r="2.5" fill="#7B8CDE" className="star-dot" style={{ animationDelay: '1.3s' }} />
        <circle cx="118" cy="158" r="3" fill="#D4A574" className="star-dot" style={{ animationDelay: '1.5s' }} />
      </svg>

      <div className="splash-orb" aria-hidden="true" />

      <div className="splash-text">
        <h1>All Star Astrology</h1>
        <p>Where 8 ancient traditions align</p>
      </div>

      <div className="splash-actions">
        <button type="button" className="btn-gold" onClick={onStart}>Begin Your Journey</button>
        <button type="button" className="splash-link" onClick={onRestore}>Restore my reading</button>
      </div>
    </div>
  );
}
