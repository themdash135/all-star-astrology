import React, { useEffect, useRef, useState } from 'react';

import { CITIES } from '../app/constants.js';
import { safeGet, safeSet } from '../app/storage.js';
import { transliterate } from '../app/helpers.js';

const PARTNER_KEY = 'allstar-partner-info';
const LC_STORAGE_KEY = 'allstar-compat-partner';
const TOTAL_STEPS = 6;
const STEP_TITLES = {
  1: 'Birth Date',
  2: 'Birth Time',
  3: 'Birth Location',
  4: 'Your Name',
  5: 'Partner Info',
  6: 'Theme',
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i);

function daysInMonth(month, year) {
  if (!month) return 31;
  return new Date(year || 2000, month, 0).getDate();
}

function parseDateStr(str) {
  if (!str) return { month: '', day: '', year: '' };
  const [y, m, d] = str.split('-');
  return { year: y || '', month: m ? String(Number(m)) : '', day: d ? String(Number(d)) : '' };
}

function buildDateStr(month, day, year) {
  if (!month || !day || !year) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function DateSelect({ value, onChange, label }) {
  const initial = parseDateStr(value);
  const [parts, setParts] = useState(initial);
  const maxDay = daysInMonth(Number(parts.month), Number(parts.year));
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const update = (field, val) => {
    const next = { ...parts, [field]: val };
    if (field === 'month' && Number(next.day) > daysInMonth(Number(val), Number(next.year))) {
      next.day = '';
    }
    setParts(next);
    const dateStr = buildDateStr(next.month, next.day, next.year);
    if (dateStr) onChange(dateStr);
  };

  return (
    <div className="ob-date-row" aria-label={label}>
      <select
        className="ob-inp ob-sel"
        value={parts.month}
        onChange={(e) => update('month', e.target.value)}
        aria-label="Month"
      >
        <option value="" disabled>Month</option>
        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
      </select>
      <select
        className="ob-inp ob-sel ob-sel--narrow"
        value={parts.day}
        onChange={(e) => update('day', e.target.value)}
        aria-label="Day"
      >
        <option value="" disabled>Day</option>
        {days.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <select
        className="ob-inp ob-sel"
        value={parts.year}
        onChange={(e) => update('year', e.target.value)}
        aria-label="Year"
      >
        <option value="" disabled>Year</option>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

const _GPLACES_KEY = 'AIzaSyCewcS7wNiDXGyWrjqjkHfyZoY0I3OhzfY';

function useLocationSearch(inputValue) {
  const [geoResults, setGeoResults] = useState([]);
  const geoTimer = useRef(null);
  const query = inputValue.trim();

  useEffect(() => {
    if (query.length < 3) { setGeoResults([]); return; }
    clearTimeout(geoTimer.current);
    geoTimer.current = setTimeout(() => {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment|geocode&key=${_GPLACES_KEY}`;
      // Google Places Autocomplete doesn't support browser CORS directly,
      // so we proxy through the backend
      fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}`)
        .then(r => r.ok ? r.json() : { predictions: [] })
        .then(data => {
          setGeoResults((data.predictions || []).map(p => ({
            label: p.description || '',
            value: p.description || '',
          })));
        })
        .catch(() => setGeoResults([]));
    }, 350);
    return () => clearTimeout(geoTimer.current);
  }, [query]);

  const filtered = geoResults.slice(0, 6);

  return { filtered, setGeoResults };
}

export function OnboardingScreen({ form, setForm, onSubmit, onCancel, loading, error, theme, setTheme }) {
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
      const normalized = {
        full_name: (partner.full_name || '').trim(),
        birth_date: (partner.birth_date || '').trim(),
        birth_time: (partner.birth_time || '').trim(),
        birth_location: (partner.birth_location || '').trim(),
        birth_location_display: (partner.birth_location || '').trim(),
        birth_location_confirmed: Boolean((partner.birth_location || '').trim()),
      };
      const serialized = JSON.stringify(normalized);
      safeSet(PARTNER_KEY, serialized);
      safeSet(LC_STORAGE_KEY, serialized);
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

  function skipPartner() {
    setStep(6);
  }

  function useEstimatedBirthTime() {
    setForm((current) => ({ ...current, birth_time: current.birth_time || '12:00' }));
  }

  const savedPartnerSummary = partner.full_name?.trim()
    ? partner.full_name.trim()
    : partner.birth_date
      ? `Partner born ${partner.birth_date}`
      : 'No partner added yet';

  return (
    <div className="screen ob-screen">
      {onCancel && (
        <button type="button" className="ob-cancel" onClick={onCancel}>&#x2190; Cancel</button>
      )}
      <div className="ob-dots" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((index) => (
          <div key={index} className={`ob-dot ${index <= step ? 'ob-dot--active' : ''} ${index === step ? 'ob-dot--current' : ''}`} />
        ))}
      </div>

      <div className="ob-body" key={step}>
        <p className="ob-hint" style={{ marginBottom: 12 }}>Step {step} of {TOTAL_STEPS} · {STEP_TITLES[step]}</p>
        {step === 1 && (
          <>
            <h2 className="ob-q serif">When were you born?</h2>
            <p className="ob-hint">Your birth date anchors every system in the app, so we ask for it first.</p>
            <DateSelect
              value={form.birth_date}
              onChange={(v) => setForm((current) => ({ ...current, birth_date: v }))}
              label="Birth date"
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="ob-q serif">What time were you born?</h2>
            <p className="ob-hint">Exact time improves accuracy for Vedic, BaZi & Western charts. If you do not know it, you can use noon and update it later.</p>
            <input
              type="time"
              step="60"
              className="ob-inp"
              aria-label="Birth time"
              value={form.birth_time}
              onChange={(event) => setForm((current) => ({ ...current, birth_time: event.target.value }))}
            />
            <button type="button" className="btn-ghost" onClick={useEstimatedBirthTime} style={{ width: '100%', marginTop: 10 }}>
              I don&apos;t know my time, use 12:00 PM
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="ob-q serif">What hospital were you born in?</h2>
            <p className="ob-hint">Hospital, city, or address — for precise BaZi & Vedic calculations</p>
            <div className="ac-wrap">
              <input
                type="text"
                className="ob-inp"
                aria-label="Birth location"
                placeholder="e.g. Mount Sinai Hospital, New York"
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
            <label className="ob-sublabel" htmlFor="hebrew-name">Hebrew name (optional — used for Kabbalistic & Gematria readings)</label>
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
            <p className="ob-hint">Optional — for compatibility insights. You can skip this now and add a partner later.</p>
            {(partner.full_name || partner.birth_date || partner.birth_location) && (
              <div className="glass" style={{ padding: 12, marginBottom: 12 }}>
                <div className="prof-group-title" style={{ marginBottom: 6 }}>Saved partner info</div>
                <p className="ob-hint" style={{ margin: 0 }}>{savedPartnerSummary}</p>
              </div>
            )}
            <input
              type="text"
              className="ob-inp"
              aria-label="Partner's name"
              placeholder="Partner's name"
              value={partner.full_name}
              onChange={(e) => setPartner(p => ({ ...p, full_name: e.target.value }))}
            />
            <label className="ob-sublabel">Partner's date of birth</label>
            <DateSelect
              value={partner.birth_date}
              onChange={(v) => setPartner(p => ({ ...p, birth_date: v }))}
              label="Partner's birth date"
            />
            <label className="ob-sublabel">Partner's birth time (optional)</label>
            <input
              type="time"
              step="60"
              className="ob-inp"
              aria-label="Partner's birth time"
              placeholder="Birth time (optional)"
              value={partner.birth_time}
              onChange={(e) => setPartner(p => ({ ...p, birth_time: e.target.value }))}
            />
            <label className="ob-sublabel">Partner's birth location</label>
            <p className="ob-hint">Hospital name gives more accuracy for BaZi & Vedic calculations</p>
            <div className="ac-wrap">
              <input
                type="text"
                className="ob-inp"
                aria-label="Partner's birth location"
                placeholder="e.g. Mount Sinai Hospital, New York"
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
            <p className="ob-hint" style={{ marginBottom: 12 }}>
              You&apos;re ready to generate your reading. Your birth profile is saved{partner.birth_date ? ', and your partner info will be reused automatically in compatibility screens.' : '.'}
            </p>
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
        {step === 5 && (
          <button type="button" className="btn-ghost" onClick={skipPartner}>Skip for now</button>
        )}
        <button type="button" className="btn-gold" disabled={!canGo || loading} onClick={go}>
          {loading ? 'Reading the stars...' : step === TOTAL_STEPS ? 'Generate My Reading' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
