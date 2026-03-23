import React, { useEffect, useState } from 'react';

export function LoadingOverlay() {
  const messages = [
    'Calculating Western chart...',
    'Reading Vedic nakshatras...',
    'Consulting Chinese zodiac...',
    'Analyzing Four Pillars...',
    'Computing numerology...',
    'Mapping Kabbalistic paths...',
    'Decoding Gematria...',
    'Consulting Persian mansions...',
    'Building consensus...',
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % messages.length), 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-ov" role="status" aria-live="polite" aria-atomic="true">
      <div className="ld-orb" aria-hidden="true" />
      <p className="ld-msg" key={index}>{messages[index]}</p>
      <div className="ld-progress" aria-hidden="true">
        <div className="ld-progress-fill" style={{ width: `${((index + 1) / messages.length) * 100}%` }} />
      </div>
    </div>
  );
}
