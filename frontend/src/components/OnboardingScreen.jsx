import React, { useState } from 'react';

import { CITIES } from '../app/constants.js';
import { transliterate } from '../app/helpers.js';

export function OnboardingScreen({ form, setForm, onSubmit, loading, error, theme, setTheme }) {
  const [step, setStep] = useState(1);
  const [hebManual, setHebManual] = useState(false);
  const [cityFocus, setCityFocus] = useState(false);

  const filtered = form.birth_location.length >= 2
    ? CITIES.filter((city) => city.toLowerCase().includes(form.birth_location.toLowerCase())).slice(0, 5)
    : [];

  function handleName(value) {
    setForm((current) => {
      const next = { ...current, full_name: value };
      if (!hebManual) {
        next.hebrew_name = transliterate(value);
      }
      return next;
    });
  }

  const canGo = step === 1 ? form.birth_date !== ''
    : step === 2 ? form.birth_time !== ''
      : step === 3 ? form.birth_location.trim() !== ''
        : true;

  function go() {
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    onSubmit();
  }

  return (
    <div className="screen ob-screen">
      <div className="ob-dots" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className={`ob-dot ${index <= step ? 'ob-dot--active' : ''} ${index === step ? 'ob-dot--current' : ''}`} />
        ))}
      </div>

      <div className="ob-body" key={step}>
        {step === 1 && (
          <>
            <h2 className="ob-q serif">When were you born?</h2>
            <input
              type="date"
              className="ob-inp"
              aria-label="Birth date"
              value={form.birth_date}
              onChange={(event) => setForm((current) => ({ ...current, birth_date: event.target.value }))}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="ob-q serif">What time?</h2>
            <input
              type="time"
              step="60"
              className="ob-inp"
              aria-label="Birth time"
              value={form.birth_time}
              onChange={(event) => setForm((current) => ({ ...current, birth_time: event.target.value }))}
            />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="ob-q serif">Where were you born?</h2>
            <div className="ac-wrap">
              <input
                type="text"
                className="ob-inp"
                aria-label="Birth location"
                placeholder="City, State / Country"
                value={form.birth_location}
                onChange={(event) => setForm((current) => ({ ...current, birth_location: event.target.value }))}
                onFocus={() => setCityFocus(true)}
                onBlur={() => setTimeout(() => setCityFocus(false), 200)}
              />
              {cityFocus && filtered.length > 0 && (
                <div className="ac-list glass" role="listbox" aria-label="Suggested cities">
                  {filtered.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className="ac-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setForm((current) => ({ ...current, birth_location: city }));
                        setCityFocus(false);
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="ob-q serif">What's your name?</h2>
            <input
              type="text"
              className="ob-inp"
              aria-label="Full name"
              placeholder="Your full name"
              value={form.full_name}
              onChange={(event) => handleName(event.target.value)}
            />
            <label className="ob-sublabel" htmlFor="hebrew-name">Hebrew name (optional)</label>
            <input
              id="hebrew-name"
              type="text"
              className="ob-inp ob-inp--sm"
              aria-label="Hebrew name"
              placeholder="Auto-filled from above"
              dir="rtl"
              value={form.hebrew_name}
              onChange={(event) => {
                setHebManual(true);
                setForm((current) => ({ ...current, hebrew_name: event.target.value }));
              }}
            />
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="ob-q serif">Choose your vibe</h2>
            <div className="theme-picker">
              <button type="button" className={`theme-card glass ${theme === 'dark' ? 'theme-card--active' : ''}`} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
                <div className="tp-preview tp-preview--dark" aria-hidden="true">
                  <div className="tp-bar" />
                  <div className="tp-bar tp-bar--short" />
                  <div className="tp-row">
                    <div className="tp-dot" />
                    <div className="tp-dot tp-dot--accent" />
                    <div className="tp-dot" />
                  </div>
                </div>
                <span className="tp-label">Dark</span>
                <span className="tp-desc">Deep space</span>
              </button>
              <button type="button" className={`theme-card glass ${theme === 'light' ? 'theme-card--active' : ''}`} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
                <div className="tp-preview tp-preview--light" aria-hidden="true">
                  <div className="tp-bar" />
                  <div className="tp-bar tp-bar--short" />
                  <div className="tp-row">
                    <div className="tp-dot" />
                    <div className="tp-dot tp-dot--accent" />
                    <div className="tp-dot" />
                  </div>
                </div>
                <span className="tp-label">Light</span>
                <span className="tp-desc">Warm parchment</span>
              </button>
            </div>
          </>
        )}

        {error && <div className="ob-err" role="alert">{error}</div>}
      </div>

      <div className="ob-foot">
        {step > 1 && <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <button type="button" className="btn-gold" disabled={!canGo || loading} onClick={go}>
          {loading ? 'Reading the stars...' : step === 5 ? 'Generate My Reading' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
