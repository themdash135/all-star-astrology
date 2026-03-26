import React, { useEffect, useRef, useState } from 'react';

import { CITIES } from '../app/constants.js';
import { safeGet, safeSet } from '../app/storage.js';
import { transliterate } from '../app/helpers.js';

const PARTNER_KEY = 'allstar-partner-info';
const TOTAL_STEPS = 6;

function useLocationSearch(inputValue) {
  const [geoResults, setGeoResults] = useState([]);
  const geoTimer = useRef(null);
  const query = inputValue.trim().toLowerCase();

  const cityMatches = query.length >= 2
    ? CITIES.filter((c) => c.toLowerCase().includes(query)).slice(0, 6)
    : [];

  useEffect(() => {
    if (query.length < 3) { setGeoResults([]); return; }
    clearTimeout(geoTimer.current);
    geoTimer.current = setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(inputValue)}&limit=6&lang=en`)
        .then(r => r.ok ? r.json() : { features: [] })
        .then(data => {
          setGeoResults((data.features || []).map(f => {
            const p = f.properties || {};
            const name = p.name || '';
            const city = p.city || p.town || p.village || '';
            const state = p.state || '';
            const country = p.country || '';
            const label = (name && name !== city
              ? [name, city, state, country]
              : [city, state, country]
            ).filter(Boolean).join(', ').slice(0, 80);
            return { label, value: label };
          }));
        })
        .catch(() => setGeoResults([]));
    }, 350);
    return () => clearTimeout(geoTimer.current);
  }, [query]);

  const filtered = [
    ...cityMatches.map(c => ({ label: c, value: c })),
    ...geoResults.filter(g => !cityMatches.some(c => g.label.includes(c))),
  ];

  return { filtered, setGeoResults };
}

export function OnboardingScreen({ form, setForm, onSubmit, loading, error, theme, setTheme }) {
  const [step, setStep] = useState(1);
  const [hebManual, setHebManual] = useState(false);
  const [cityFocus, setCityFocus] = useState(false);
  const [partnerCityFocus, setPartnerCityFocus] = useState(false);

  // Partner state
  const [partner, setPartner] = useState(() => {
    const raw = safeGet(PARTNER_KEY);
    if (raw) try { return JSON.parse(raw); } catch {}
    return { full_name: '', birth_date: '', birth_time: '', birth_location: '' };
  });

  // Location search for user (step 3)
  const userLoc = useLocationSearch(form.birth_location);
  // Location search for partner (step 5)
  const partnerLoc = useLocationSearch(partner.birth_location);

  function handleName(value) {
    setForm((current) => {
      const next = { ...current, full_name: value };
      if (!hebManual) {
        next.hebrew_name = transliterate(value);
      }
      return next;
    });
  }

  function savePartner() {
    if (partner.birth_date || partner.full_name) {
      safeSet(PARTNER_KEY, JSON.stringify(partner));
    }
  }

  const canGo = step === 1 ? form.birth_date !== ''
    : step === 2 ? form.birth_time !== ''
      : step === 3 ? form.birth_location.trim() !== ''
        : true;

  function go() {
    if (step === 5) savePartner();
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    onSubmit();
  }

  return (
    <div className="screen ob-screen">
      <div className="ob-dots" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((index) => (
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
            <p className="ob-hint">City, hospital, or address — for precise BaZi & Vedic calculations</p>
            <div className="ac-wrap">
              <input
                type="text"
                className="ob-inp"
                aria-label="Birth location"
                placeholder="e.g. Chicago, IL or Mount Sinai Hospital"
                value={form.birth_location}
                onChange={(event) => setForm((current) => ({ ...current, birth_location: event.target.value }))}
                onFocus={() => setCityFocus(true)}
                onBlur={() => setTimeout(() => setCityFocus(false), 250)}
              />
              {cityFocus && userLoc.filtered.length > 0 && (
                <div className="ac-list glass" role="listbox" aria-label="Suggested locations">
                  {userLoc.filtered.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="ac-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setForm((current) => ({ ...current, birth_location: item.value }));
                        setCityFocus(false);
                        userLoc.setGeoResults([]);
                      }}
                    >
                      {item.label}
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
            <h2 className="ob-q serif">Add your partner</h2>
            <p className="ob-hint">Optional — for compatibility insights</p>
            <input
              type="text"
              className="ob-inp"
              aria-label="Partner's name"
              placeholder="Partner's name"
              value={partner.full_name}
              onChange={(e) => setPartner(p => ({ ...p, full_name: e.target.value }))}
            />
            <input
              type="date"
              className="ob-inp"
              aria-label="Partner's birth date"
              value={partner.birth_date}
              onChange={(e) => setPartner(p => ({ ...p, birth_date: e.target.value }))}
            />
            <input
              type="time"
              step="60"
              className="ob-inp"
              aria-label="Partner's birth time"
              placeholder="Birth time (optional)"
              value={partner.birth_time}
              onChange={(e) => setPartner(p => ({ ...p, birth_time: e.target.value }))}
            />
            <div className="ac-wrap">
              <input
                type="text"
                className="ob-inp"
                aria-label="Partner's birth location"
                placeholder="Where were they born (Hospital name preferred)?"
                value={partner.birth_location}
                onChange={(e) => setPartner(p => ({ ...p, birth_location: e.target.value }))}
                onFocus={() => setPartnerCityFocus(true)}
                onBlur={() => setTimeout(() => setPartnerCityFocus(false), 250)}
              />
              {partnerCityFocus && partnerLoc.filtered.length > 0 && (
                <div className="ac-list glass" role="listbox" aria-label="Suggested partner locations">
                  {partnerLoc.filtered.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="ac-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setPartner(p => ({ ...p, birth_location: item.value }));
                        setPartnerCityFocus(false);
                        partnerLoc.setGeoResults([]);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {step === 6 && (
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
        {step === 5 && !partner.full_name && !partner.birth_date && (
          <button type="button" className="btn-ghost" onClick={() => setStep(step + 1)}>Skip</button>
        )}
        <button type="button" className="btn-gold" disabled={!canGo || loading} onClick={go}>
          {loading ? 'Reading the stars...' : step === TOTAL_STEPS ? 'Generate My Reading' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
