import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import { AREAS, CITIES, SYSTEMS, ORACLE_HISTORY_KEY } from '../app/constants.js';
import { safeGet, safeSet } from '../app/storage.js';
import {
  areaExplanation,
  extractCosmicDNA,
  getDailyContent,
  getSystemAgreement,
  getSystemVotes,
  scoreColor,
  scoreGradient,
  systemAvgScore,
} from '../app/helpers.js';
import {
  Accordion,
  DataCards,
  IconBack,
  IconChevron,
  IconCombined,
  IconGames,
  IconGrid,
  IconOracle,
  IconReadings,
  IconFeedback,
  IconStar,
  IconUser,
  Toggle,
} from './common.jsx';

export function HomeContent({ result, form, onTabChange }) {
  const [expanded, setExpanded] = useState(null);

  const probabilities = result?.combined?.probabilities || {};
  const firstName = form.full_name ? form.full_name.split(' ')[0] : '';
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const greeting = firstName ? `Good ${timeOfDay}, ${firstName}` : `Good ${timeOfDay}`;
  const daily = getDailyContent(result);
  const today = daily.dateLabel || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const cosmicMessage = daily.message;
  const { dos, donts } = daily;
  const dna = extractCosmicDNA(result);

  return (
    <div className="page fade-in">
      <div className="home-top stagger" style={{ animationDelay: '0s' }}>
        <h1 className="serif home-greeting">{greeting}</h1>
        <p className="home-date">{today}</p>
      </div>

      {cosmicMessage && (
        <div className="cosmic-msg stagger" style={{ animationDelay: '.1s' }}>
          <p>{cosmicMessage}</p>
        </div>
      )}

      <div className="home-scores">
        {AREAS.map((area, index) => {
          const info = probabilities[area.key];
          if (!info) {
            return null;
          }

          const value = Math.round(info.value);
          const isOpen = expanded === area.key;
          const votes = getSystemVotes(result, area.key);
          const confidence = info.confidence != null ? Math.round(info.confidence) : null;
          const agreeing = info.agreeing_systems?.length || 0;

          return (
            <div
              key={area.key}
              className={`hsc glass stagger ${isOpen ? 'hsc--open' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              style={{ animationDelay: `${0.15 + index * 0.06}s` }}
              onClick={() => setExpanded(isOpen ? null : area.key)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setExpanded(isOpen ? null : area.key);
                }
              }}
            >
              <div className="hsc-top">
                <span className="hsc-icon">{area.icon}</span>
                <span className="hsc-label">{area.label}</span>
                <span className="hsc-pct serif" style={{ color: scoreColor(value) }}>{value}%</span>
              </div>
              <div className="hsc-bar">
                <div className="hsc-bar-fill bar-anim" style={{ width: `${value}%`, background: scoreGradient(value), animationDelay: `${0.15 + index * 0.06 + 0.2}s` }} />
              </div>
              {isOpen && (
                <div className="hsc-expand fade-in">
                  <p className="hsc-explain">{areaExplanation(result, area.key)}</p>
                  <div className="hsc-meta">
                    <span className="hsc-agree">{agreeing} of 8 aligned{confidence != null && ` · ${confidence}% agreement`}</span>
                  </div>
                  <div className="hsc-votes" aria-label={`${area.label} system votes`}>
                    {votes.map((vote) => (
                      <div key={vote.id} className={`vote-dot vote-dot--${vote.sentiment}`} title={`${vote.name}: ${vote.value}%`} />
                    ))}
                  </div>
                  <button type="button" className="hsc-link" onClick={(event) => { event.stopPropagation(); onTabChange('combined'); }}>
                    See breakdown →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dodont glass stagger" style={{ animationDelay: '.5s' }}>
        <h3 className="dodont-title serif">Today's Cosmic Advice</h3>
        <p className="dodont-note">
          {daily.source === 'backend'
            ? 'Derived from your current chart and today\'s live system scores.'
            : 'Using a quick summary from your saved reading. Regenerate your reading for the newest daily guidance.'}
        </p>
        <div className="dodont-cols">
          <div className="dodont-col">
            <div className="dodont-hd dodont-hd--do">DO</div>
            {dos.map((item, index) => <p key={index} className="dodont-item dodont-item--do">{item}</p>)}
          </div>
          <div className="dodont-col">
            <div className="dodont-hd dodont-hd--dont">DON'T</div>
            {donts.map((item, index) => <p key={index} className="dodont-item dodont-item--dont">{item}</p>)}
          </div>
        </div>
      </div>

      {dna.length > 0 && (
        <div className="dna-section stagger" style={{ animationDelay: '.6s' }}>
          <h3 className="section-hd serif">Your Cosmic DNA</h3>
          <div className="dna-scroll">
            {dna.map((item, index) => (
              <div key={index} className="dna-pill glass">
                <span className="dna-sym">{item.sym}</span>
                <span className="dna-val">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SystemsContent({ result, onSystemTap, embedded }) {
  const Wrapper = embedded ? React.Fragment : ({ children }) => <div className="page fade-in">{children}</div>;
  return (
    <Wrapper>
      {!embedded && <h1 className="sys-hub-title serif">Your 8 Systems</h1>}
      {!embedded && <p className="sys-hub-sub">Each system is its own tool. Tap to explore — swipe through Overview, Details, Insights, and Data.</p>}
      <div className="sys-grid">
        {SYSTEMS.map((system, index) => {
          const average = systemAvgScore(result, system.id);
          const agreement = getSystemAgreement(result, system.id);
          return (
            <button type="button" key={system.id} className="sys-tile glass stagger" style={{ animationDelay: `${index * 0.05}s` }} onClick={() => onSystemTap(system.id)}>
              <span className="sys-tile-icon">{system.icon}</span>
              <span className="sys-tile-name">{system.name}</span>
              {average != null && <span className="sys-tile-avg" style={{ color: scoreColor(average) }}>{average}%</span>}
              <span className={`sys-tile-agreement sys-tile-agreement--${agreement.level}`}>
                {agreement.level === 'unknown' ? '—' : `${agreement.agreeing}/8 aligned`}
              </span>
            </button>
          );
        })}
      </div>
    </Wrapper>
  );
}

export function SystemDetail({ data, onBack }) {
  if (!data) {
    return <div className="page fade-in"><p className="empty-msg">No data available.</p></div>;
  }

  const scores = data.scores || {};
  const summaryShort = (data.summary || []).slice(0, 2);

  return (
    <div className="detail fade-in">
      <div className="detail-hd">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Back to tabs"><IconBack /></button>
        <h2 className="serif">{data.name}</h2>
      </div>
      <div className="detail-bd">
        {data.headline && <h3 className="detail-hl serif">{data.headline}</h3>}

        {Object.keys(scores).length > 0 && (
          <div className="d-scores">
            {AREAS.map((area, index) => {
              const info = scores[area.key];
              if (!info) {
                return null;
              }

              const value = Math.round(info.value);
              return (
                <div className="mscore glass stagger" style={{ animationDelay: `${index * 0.05}s` }} key={area.key}>
                  <div className="mscore-top">
                    <span className="mscore-icon">{area.icon}</span>
                    <span>{area.label}</span>
                    <span className="mscore-pct serif" style={{ color: scoreColor(value) }}>{value}%</span>
                  </div>
                  <div className="mscore-bar"><div className="bar-anim" style={{ width: `${value}%`, background: scoreGradient(value), animationDelay: `${index * 0.05 + .15}s` }} /></div>
                  <div className="mscore-lbl">{info.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {summaryShort.length > 0 && (
          <div className="d-summary">{summaryShort.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        )}

        {data.highlights?.length > 0 && (
          <Accordion title="Key Highlights">
            <div className="pills">
              {data.highlights.map((highlight, index) => (
                <div className="pill glass" key={index}>
                  <span className="pill-l">{highlight.label}</span>
                  <span className="pill-v">{String(highlight.value)}</span>
                </div>
              ))}
            </div>
          </Accordion>
        )}

        {data.insights?.length > 0 && (
          <Accordion title="Insights">
            <div className="insights-list">
              {data.insights.map((insight, index) => (
                <Accordion key={index} title={insight.title}>
                  <p className="ins-text">{insight.text}</p>
                </Accordion>
              ))}
            </div>
          </Accordion>
        )}

        {data.tables?.length > 0 && (
          <Accordion title="Detailed Data">
            {data.tables.map((table, index) => <DataCards key={index} block={table} />)}
          </Accordion>
        )}
      </div>
    </div>
  );
}

function buildAreaExplanation(areaKey, areaLabel, info) {
  if (!info) return '';
  const total = 8;
  const agreeCount = info.agreeing_systems?.length || 0;
  const disagreeCount = total - agreeCount;
  const sentiment = info.sentiment || 'mixed';
  const score = Math.round(info.value);
  const confidence = info.confidence != null ? Math.round(info.confidence) : null;
  const leaders = info.leaders || [];
  const laggards = info.laggards || [];
  const agreeNames = info.agreeing_systems || [];

  const sentimentWord = sentiment.includes('positive') ? 'positive' : sentiment.includes('challenging') ? 'cautious' : 'mixed';
  const majority = agreeCount >= 5;

  let opening;
  if (majority) {
    opening = `${agreeCount} of the ${total} systems lean ${sentimentWord} on ${areaLabel.toLowerCase()}, suggesting a meaningful pattern rather than random chance.`;
  } else if (agreeCount >= 3) {
    opening = `The systems are split on ${areaLabel.toLowerCase()} — ${agreeCount} of ${total} lean ${sentimentWord}, while the rest see it differently.`;
  } else {
    opening = `Only ${agreeCount} of ${total} systems align on ${areaLabel.toLowerCase()}, signaling genuine uncertainty across traditions.`;
  }

  let strengthLine = '';
  if (leaders.length > 0) {
    const topNames = leaders.slice(0, 3).map((l) => l.name).join(', ');
    strengthLine = ` The strongest signals come from ${topNames}.`;
  }

  let cautionLine = '';
  if (laggards.length > 0 && disagreeCount > 0) {
    const lowNames = laggards.slice(0, 2).map((l) => l.name).join(' and ');
    cautionLine = ` ${lowNames} ${disagreeCount > 1 ? 'offer' : 'offers'} a different perspective, suggesting areas to stay mindful about.`;
  }

  let closingLine;
  if (score >= 70) {
    closingLine = `Overall, ${areaLabel.toLowerCase()} looks very promising right now.`;
  } else if (score >= 55) {
    closingLine = `Overall, the outlook for ${areaLabel.toLowerCase()} is supportive — lean into it with intention.`;
  } else if (score >= 45) {
    closingLine = `The picture is nuanced — stay open and attentive to how ${areaLabel.toLowerCase()} unfolds.`;
  } else {
    closingLine = `This is a period for patience and care around ${areaLabel.toLowerCase()}.`;
  }

  return `This score blends your birth chart with current planetary transits — it reflects your overall alignment, not just today. ${opening}${strengthLine}${cautionLine} ${closingLine}`;
}

export function CombinedContent({ data, embedded }) {
  const [activeArea, setActiveArea] = useState(null);

  if (!data) {
    return embedded ? null : <div className="page fade-in"><p className="empty-msg">Generate a reading first.</p></div>;
  }

  const probabilities = data.probabilities || {};
  const shortSummary = (data.summary || []).slice(0, 1).join('');
  const activeInfo = activeArea ? probabilities[activeArea] : null;
  const activeAreaDef = activeArea ? AREAS.find((a) => a.key === activeArea) : null;

  const content = (
    <>
      {data.headline && <p className="comb-hl serif">{data.headline}</p>}
      {shortSummary && <p className="comb-sum">{shortSummary}</p>}

      <div className="comb-scores">
        {AREAS.map((area, index) => {
          const info = probabilities[area.key];
          if (!info) {
            return null;
          }

          const value = Math.round(info.value);
          const confidence = info.confidence != null ? Math.round(info.confidence) : null;
          return (
            <div
              className="csc glass stagger"
              style={{ animationDelay: `${index * 0.06}s`, cursor: 'pointer' }}
              key={area.key}
              role="button"
              tabIndex={0}
              onClick={() => setActiveArea(area.key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveArea(area.key); } }}
            >
              <div className="csc-top">
                <span className="csc-icon">{area.icon}</span>
                <span className="csc-label">{area.label}</span>
                <span className="csc-pct serif" style={{ color: scoreColor(value) }}>{value}%</span>
              </div>
              <div className="csc-bar"><div className="bar-anim" style={{ width: `${value}%`, background: scoreGradient(value), animationDelay: `${index * 0.06 + .2}s` }} /></div>
              {confidence != null && <div className="csc-conf">Agreement: {confidence}%</div>}
              {info.agreeing_systems && <div className="csc-sys">{info.agreeing_systems.join(' · ')}</div>}
            </div>
          );
        })}
      </div>

      <Accordion title="Advanced Details">
        {data.highlights?.length > 0 && (
          <div className="adv-block">
            <div className="dcards-title">Highlights</div>
            <div className="pills">
              {data.highlights.map((highlight, index) => (
                <div className="pill glass" key={index}>
                  <span className="pill-l">{highlight.label}</span>
                  <span className="pill-v">{String(highlight.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.insights?.length > 0 && (
          <div className="adv-block">
            <div className="dcards-title">Insights</div>
            {data.insights.map((insight, index) => (
              <Accordion key={index} title={insight.title}><p className="ins-text">{insight.text}</p></Accordion>
            ))}
          </div>
        )}
        {data.tables?.map((table, index) => <DataCards key={index} block={table} />)}
      </Accordion>
    </>
  );

  const modal = activeArea && activeInfo && activeAreaDef ? ReactDOM.createPortal(
    <div className="area-modal-overlay" onClick={() => setActiveArea(null)} role="presentation">
      <div className="area-modal fade-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${activeAreaDef.label} breakdown`}>
        <div className="area-modal-header">
          <span className="area-modal-icon">{activeAreaDef.icon}</span>
          <h3 className="area-modal-title serif">{activeAreaDef.label}</h3>
          <span className="area-modal-score serif" style={{ color: scoreColor(Math.round(activeInfo.value)) }}>{Math.round(activeInfo.value)}%</span>
        </div>
        <div className="area-modal-bar">
          <div className="area-modal-bar-fill" style={{ width: `${Math.round(activeInfo.value)}%`, background: scoreGradient(Math.round(activeInfo.value)) }} />
        </div>
        <p className="area-modal-explain">{buildAreaExplanation(activeArea, activeAreaDef.label, activeInfo)}</p>
        {activeInfo.agreeing_systems?.length > 0 && (
          <div className="area-modal-systems">
            <span className="area-modal-systems-label">Systems aligned:</span>
            <span className="area-modal-systems-list">{activeInfo.agreeing_systems.join(' · ')}</span>
          </div>
        )}
        {activeInfo.confidence != null && (
          <div className="area-modal-conf">Agreement: {Math.round(activeInfo.confidence)}%</div>
        )}
        <button type="button" className="btn-gold area-modal-close" onClick={() => setActiveArea(null)}>Close</button>
      </div>
    </div>,
    document.body,
  ) : null;

  if (embedded) return <>{content}{modal}</>;

  return (
    <div className="page fade-in">
      <h1 className="pg-title serif">Combined Analysis</h1>
      {content}
      {modal}
    </div>
  );
}

const PRIVACY_SECTIONS = [
  {
    title: 'What we collect',
    copy: 'We store the birth details and profile information you enter so the app can generate your readings and reopen them later on this device.',
  },
  {
    title: 'How it is used',
    copy: 'Your data is used to calculate astrology, numerology, and combined reading results. Oracle questions are sent with your saved reading context so the app can answer from your chart.',
  },
  {
    title: 'What we share',
    copy: 'We do not sell your personal data. Data only leaves the device when the app calls the reading or oracle APIs needed to generate your results.',
  },
  {
    title: 'Your controls',
    copy: 'You can edit your birth data at any time or use Reset All Data to remove saved profile details, readings, theme settings, motion preferences, and Oracle history from this device.',
  },
];

const TERMS_SECTIONS = [
  {
    title: 'Use of the app',
    copy: 'All Star Astrology is for personal reflection, entertainment, and wellness-style insight. You may use the app for your own readings and chart exploration.',
  },
  {
    title: 'Not professional advice',
    copy: 'The app does not provide medical, legal, financial, or mental health advice. Do not use astrology content as a substitute for licensed professional guidance.',
  },
  {
    title: 'Content expectations',
    copy: 'Astrology systems can disagree. The app combines multiple traditions into weighted summaries, so readings should be treated as interpretive guidance rather than guaranteed outcomes.',
  },
  {
    title: 'Future subscriptions',
    copy: 'When paid plans go live, billing, renewal, cancellation, upgrade, and downgrade terms will be managed through the Apple App Store or Google Play and reflected in this screen.',
  },
];

const SUBSCRIPTION_ACTIONS = [
  {
    title: 'Subscribe',
    copy: 'Start a paid plan when store billing is connected.',
  },
  {
    title: 'Upgrade',
    copy: 'Move to a higher tier without leaving the app.',
  },
  {
    title: 'Downgrade',
    copy: 'Step down to a lighter plan at the next billing point.',
  },
  {
    title: 'Cancel',
    copy: 'Turn off auto-renew and keep access through the active billing period.',
  },
];

function ProfilePanel({ title, onBack, children }) {
  return (
    <div className="detail fade-in">
      <div className="detail-hd">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Back to You">
          <IconBack />
        </button>
        <h2 className="serif">{title}</h2>
      </div>
      <div className="profile-panel-body">
        {children}
      </div>
    </div>
  );
}

const PARTNER_KEY = 'allstar-partner-info';

function PartnerInfoSection() {
  const [editing, setEditing] = useState(false);
  const raw = safeGet(PARTNER_KEY);
  const saved = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
  const [name, setName] = useState(saved?.full_name || '');
  const [date, setDate] = useState(saved?.birth_date || '');
  const [time, setTime] = useState(saved?.birth_time || '');
  const [location, setLocation] = useState(saved?.birth_location || '');
  const [locDisplay, setLocDisplay] = useState(saved?.birth_location_display || saved?.birth_location || '');
  const [geoResults, setGeoResults] = useState([]);
  const [geoFocus, setGeoFocus] = useState(false);
  const geoTimer = useRef(null);

  const locQuery = locDisplay.trim().toLowerCase();
  const locCityMatches = locQuery.length >= 2
    ? CITIES.filter(c => c.toLowerCase().includes(locQuery)).slice(0, 6)
    : [];
  useEffect(() => {
    if (locQuery.length < 3) { setGeoResults([]); return; }
    clearTimeout(geoTimer.current);
    geoTimer.current = setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locDisplay)}&limit=6&lang=en`)
        .then(r => r.ok ? r.json() : { features: [] })
        .then(data => {
          setGeoResults((data.features || []).map(f => {
            const p = f.properties || {};
            const nm = p.name || '';
            const city = p.city || p.town || p.village || '';
            const state = p.state || '';
            const country = p.country || '';
            const label = (nm && nm !== city
              ? [nm, city, state, country]
              : [city, state, country]
            ).filter(Boolean).join(', ').slice(0, 80);
            return { label, value: label };
          }));
        })
        .catch(() => setGeoResults([]));
    }, 350);
    return () => clearTimeout(geoTimer.current);
  }, [locQuery]);
  const partnerFiltered = [...locCityMatches.map(c => ({ label: c, value: c })), ...geoResults.filter(g => !locCityMatches.some(c => g.label.includes(c)))];

  function selectGeoResult(item) {
    setLocation(item.value);
    setLocDisplay(item.label);
    setGeoResults([]);
    setGeoFocus(false);
  }

  function save() {
    if (!date) return;
    safeSet(PARTNER_KEY, JSON.stringify({
      full_name: name.trim(),
      birth_date: date,
      birth_time: time || null,
      birth_location: location.trim() || null,
      birth_location_display: locDisplay.trim() || null,
    }));
    setEditing(false);
  }
  function clear() {
    safeSet(PARTNER_KEY, '');
    setName(''); setDate(''); setTime(''); setLocation(''); setLocDisplay('');
    setEditing(false);
  }

  const dateStr = saved?.birth_date ? new Date(`${saved.birth_date}T12:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set';
  const displayLoc = saved?.birth_location_display || saved?.birth_location || 'Not set';

  return (
    <div className="prof-group" style={{ marginTop: 24 }}>
      <div className="prof-group-title">Partner Info</div>
      {!editing ? (
        <div className="prof-rows glass">
          <div className="prow"><span className="prow-l">Name</span><span>{saved?.full_name || 'Not set'}</span></div>
          <div className="prow"><span className="prow-l">Birth Date</span><span>{dateStr}</span></div>
          <div className="prow"><span className="prow-l">Birth Time</span><span>{saved?.birth_time || 'Not set'}</span></div>
          <div className="prow"><span className="prow-l">Birth Location</span><span>{displayLoc}</span></div>
          <button type="button" className="prow prow--btn" onClick={() => setEditing(true)}>
            <span>{saved?.birth_date ? 'Edit Partner Info' : 'Add Partner Info'}</span><IconChevron />
          </button>
        </div>
      ) : (
        <div className="prof-rows glass" style={{ padding: 14 }}>
          <label className="mm-field-label">Name (optional)</label>
          <input className="mm-input" type="text" placeholder="Partner's name" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="mm-field-label">Date of Birth</label>
          <input className="mm-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <label className="mm-field-label">Birth Time (optional)</label>
          <input className="mm-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <label className="mm-field-label">Where were they born?</label>
          <div style={{ position: 'relative' }}>
            <input className="mm-input" type="text" placeholder="Where were they born (Hospital name preferred)?" value={locDisplay}
              onChange={(e) => { setLocDisplay(e.target.value); setLocation(e.target.value); }}
              onFocus={() => setGeoFocus(true)}
              onBlur={() => setTimeout(() => setGeoFocus(false), 200)} />
            {geoFocus && partnerFiltered.length > 0 && (
              <div className="partner-geo-dropdown">
                {partnerFiltered.map((item, i) => (
                  <button type="button" key={i} className="partner-geo-item" onMouseDown={() => selectGeoResult(item)}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn-gold" style={{ flex: 1 }} onClick={save} disabled={!date}>Save</button>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
          </div>
          {saved?.birth_date && <button type="button" className="btn-danger" style={{ marginTop: 10, width: '100%' }} onClick={clear}>Remove Partner</button>}
        </div>
      )}
    </div>
  );
}

function PatternDashboard() {
  const history = useMemo(() => {
    try { return JSON.parse(safeGet(ORACLE_HISTORY_KEY)) || []; } catch { return []; }
  }, []);

  const patterns = useMemo(() => {
    if (!history || history.length < 2) return [];
    const detected = [];

    const domains = {};
    history.forEach(h => {
      const q = (h.q || '').toLowerCase();
      if (q.includes('love') || q.includes('relationship') || q.includes('partner')) domains.love = (domains.love || 0) + 1;
      if (q.includes('career') || q.includes('job') || q.includes('work') || q.includes('business')) domains.career = (domains.career || 0) + 1;
      if (q.includes('health') || q.includes('energy') || q.includes('body')) domains.health = (domains.health || 0) + 1;
      if (q.includes('money') || q.includes('invest') || q.includes('financial') || q.includes('save')) domains.wealth = (domains.wealth || 0) + 1;
      if (q.includes('feel') || q.includes('lost') || q.includes('anxious') || q.includes('mood')) domains.emotional = (domains.emotional || 0) + 1;
    });

    const topDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
    if (topDomain && topDomain[1] >= 2) {
      detected.push({
        name: 'Domain Focus',
        desc: `You've asked ${topDomain[1]} questions about ${topDomain[0]}. This area is clearly on your mind.`,
      });
    }

    const timingWords = history.filter(h => /(when|timing|right time|should i wait|how long)/i.test(h.q));
    if (timingWords.length >= 2) {
      detected.push({
        name: 'Timing Seeker',
        desc: `${timingWords.length} of your questions focus on timing. You're looking for the right moment.`,
      });
    }

    const confs = history.filter(h => h.confidence != null).map(h => h.confidence);
    if (confs.length >= 3) {
      const recent = confs.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const trend = recent > 0.7 ? 'rising' : recent < 0.4 ? 'falling' : 'steady';
      detected.push({
        name: `Confidence ${trend.charAt(0).toUpperCase() + trend.slice(1)}`,
        desc: `Your recent answers average ${Math.round(recent * 100)}% confidence. The stars are ${trend === 'rising' ? 'speaking clearly' : trend === 'falling' ? 'uncertain' : 'steady'}.`,
      });
    }

    const binaryCount = history.filter(h => /\bor\b|should i/i.test(h.q)).length;
    if (binaryCount >= 2) {
      detected.push({
        name: 'Decision Maker',
        desc: `${binaryCount} questions ask for a choice. You're actively weighing options.`,
      });
    }

    return detected;
  }, [history]);

  if (patterns.length === 0) {
    return <div className="v2-empty">Ask more Oracle questions to reveal your patterns.</div>;
  }

  return (
    <div className="v2-pattern-section">
      {patterns.map((p, i) => (
        <div key={i} className="v2-pattern-card">
          <div className="v2-pattern-name">{p.name}</div>
          <div className="v2-pattern-desc">{p.desc}</div>
        </div>
      ))}
    </div>
  );
}

export function ProfileContent({ form, result, onEdit, onReset, theme, setTheme, motionSetting, setMotionSetting, onBack }) {
  const [notifications, setNotifications] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [panel, setPanel] = useState('main');

  const birthString = form.birth_date
    ? new Date(`${form.birth_date}T12:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not set';
  const dna = extractCosmicDNA(result);

  if (panel === 'privacy') {
    return (
      <ProfilePanel title="Privacy Policy" onBack={() => setPanel('main')}>
        <div className="legal-stack">
          {PRIVACY_SECTIONS.map((section) => (
            <div key={section.title} className="legal-card glass">
              <h3 className="legal-title serif">{section.title}</h3>
              <p className="legal-copy">{section.copy}</p>
            </div>
          ))}
        </div>
      </ProfilePanel>
    );
  }

  if (panel === 'terms') {
    return (
      <ProfilePanel title="Terms of Use" onBack={() => setPanel('main')}>
        <div className="legal-stack">
          {TERMS_SECTIONS.map((section) => (
            <div key={section.title} className="legal-card glass">
              <h3 className="legal-title serif">{section.title}</h3>
              <p className="legal-copy">{section.copy}</p>
            </div>
          ))}
        </div>
      </ProfilePanel>
    );
  }

  if (panel === 'subscription') {
    return (
      <ProfilePanel title="Manage Subscription" onBack={() => setPanel('main')}>
        <div className="subscription-status glass">
          <h3 className="subscription-status-title serif">Subscription controls live here</h3>
          <p className="subscription-status-copy">
            Store billing is not connected yet. This screen is ready for subscribe, upgrade, downgrade, and cancel flows once the Apple App Store and Google Play subscriptions are wired in.
          </p>
        </div>
        <div className="subscription-grid">
          {SUBSCRIPTION_ACTIONS.map((action) => (
            <div key={action.title} className="subscription-card glass">
              <div className="subscription-card-title">{action.title}</div>
              <p className="subscription-card-copy">{action.copy}</p>
              <span className="subscription-badge">Waiting for store billing hookup</span>
            </div>
          ))}
        </div>
      </ProfilePanel>
    );
  }

  return (
    <div className="page fade-in">
      {onBack && (
        <div className="settings-header">
          <button type="button" className="back-btn" onClick={onBack} aria-label="Back">
            <IconBack />
          </button>
          <h1 className="pg-title serif" style={{ margin: 0 }}>Settings</h1>
        </div>
      )}
      {!onBack && <h1 className="pg-title serif">You</h1>}

      <div className="prof-card glass">
        <div className="prof-av">{form.full_name ? form.full_name[0].toUpperCase() : '\u2605'}</div>
        <div className="prof-name serif">{form.full_name || 'Stargazer'}</div>
        {form.hebrew_name && <div className="prof-heb" dir="rtl">{form.hebrew_name}</div>}
      </div>

      {dna.length > 0 && (
        <div className="prof-group">
          <div className="prof-group-title">Your Signs</div>
          <div className="prof-signs glass">
            {dna.map((sign, index) => (
              <div className="sign-row" key={index}>
                <span className="sign-sym">{sign.sym}</span>
                <span className="sign-label">{sign.label}</span>
                <span className="sign-value">{sign.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="prof-group">
        <div className="prof-group-title">Your Patterns</div>
        <div className="prof-rows glass" style={{ padding: '10px 14px' }}>
          <PatternDashboard />
        </div>
      </div>

      <div className="prof-group">
        <div className="prof-group-title">Birth Data</div>
        <div className="prof-rows glass">
          <div className="prow"><span className="prow-l">Birth Date</span><span>{birthString}</span></div>
          <div className="prow"><span className="prow-l">Birth Time</span><span>{form.birth_time || 'Not set'}</span></div>
          <div className="prow"><span className="prow-l">Location</span><span>{form.birth_location || 'Not set'}</span></div>
          {result?.meta?.timezone && <div className="prow"><span className="prow-l">Timezone</span><span>{result.meta.timezone}</span></div>}
        </div>
      </div>

      <button type="button" className="btn-gold prof-edit" onClick={onEdit}>Edit Birth Data</button>

      <PartnerInfoSection />

      <div className="prof-group" style={{ marginTop: 24 }}>
        <div className="prof-group-title">Settings</div>
        <div className="prof-rows glass">
          <div className="prow">
            <span>Theme</span>
            <div className="prow-theme">
              <button type="button" className={`prow-theme-btn ${theme === 'light' ? 'prow-theme-btn--on' : ''}`} onClick={() => setTheme('light')}>Light</button>
              <button type="button" className={`prow-theme-btn ${theme === 'dark' ? 'prow-theme-btn--on' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
            </div>
          </div>
          <div className="prow">
            <span>Motion</span>
            <div className="segmented" role="group" aria-label="Animation preference">
              <button type="button" className={`segmented-btn ${motionSetting === 'system' ? 'segmented-btn--on' : ''}`} onClick={() => setMotionSetting('system')}>System</button>
              <button type="button" className={`segmented-btn ${motionSetting === 'reduce' ? 'segmented-btn--on' : ''}`} onClick={() => setMotionSetting('reduce')}>Reduced</button>
              <button type="button" className={`segmented-btn ${motionSetting === 'full' ? 'segmented-btn--on' : ''}`} onClick={() => setMotionSetting('full')}>Full</button>
            </div>
          </div>
          <div className="prow"><span>Notifications</span><Toggle value={notifications} onChange={setNotifications} label="Toggle notifications" /></div>
        </div>
      </div>

      <div className="prof-group" style={{ marginTop: 16 }}>
        <div className="prof-group-title">About</div>
        <div className="prof-rows glass">
          <button type="button" className="prow prow--btn" onClick={() => setShowAbout(!showAbout)} aria-expanded={showAbout}>
            <span>About All Star Astrology</span><IconChevron open={showAbout} />
          </button>
          {showAbout && (
            <div className="prow-about">
              Combines eight ancient and modern systems - Western, Vedic, Chinese, BaZi, Numerology, Kabbalistic, Gematria, and Persian - into unified readings with weighted consensus analysis.
            </div>
          )}
          <button type="button" className="prow prow--btn" onClick={() => setPanel('privacy')}><span>Privacy Policy</span><IconChevron /></button>
          <button type="button" className="prow prow--btn" onClick={() => setPanel('terms')}><span>Terms of Use</span><IconChevron /></button>
          <button type="button" className="prow prow--btn" onClick={() => setPanel('subscription')}><span>Manage Subscription</span><IconChevron /></button>
          <div className="prow-note">
            Rate This App and Share with Friends will be added when the App Store and Google Play builds are live.
          </div>
        </div>
      </div>

      <button type="button" className="btn-danger" onClick={onReset}>Reset All Data</button>
      <div className="prof-ver">All Star Astrology v1.1.0</div>
    </div>
  );
}

export function CombinedSystemsContent({ result, onSystemTap }) {
  const combined = result?.combined;

  return (
    <div className="page fade-in">
      <h1 className="pg-title serif">Combined Systems</h1>

      <SystemsContent result={result} onSystemTap={onSystemTap} embedded />

      {combined && (
        <div className="cs-combined-section">
          <h2 className="cs-combined-title serif">Combined Analysis</h2>
          <CombinedContent data={combined} embedded />
        </div>
      )}
    </div>
  );
}

export function GamesPlaceholder() {
  return (
    <div className="page fade-in placeholder-screen">
      <h1 className="pg-title serif">Games</h1>
      <div className="placeholder-card glass">
        <span className="placeholder-icon">&#x1F3AE;</span>
        <p className="placeholder-text">Celestial games are coming soon.</p>
        <p className="placeholder-sub">Daily challenges, cosmic garden, and more.</p>
      </div>
    </div>
  );
}

export function ReadingsPlaceholder() {
  return (
    <div className="page fade-in placeholder-screen">
      <h1 className="pg-title serif">Readings</h1>
      <div className="placeholder-card glass">
        <span className="placeholder-icon">&#x1F4D6;</span>
        <p className="placeholder-text">Your reading history will live here.</p>
        <p className="placeholder-sub">Past readings, trends, and time-based insights.</p>
      </div>
    </div>
  );
}

export function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'today', label: 'Today', Icon: IconStar },
    { id: 'systems', label: 'Systems', Icon: IconGrid },
    { id: 'oracle', label: 'Oracle', Icon: IconOracle },
    { id: 'games', label: 'Games', Icon: IconGames },
    { id: 'readings', label: 'Readings', Icon: IconReadings },
    { id: 'feedback', label: 'Feedback', Icon: IconFeedback },
  ];

  return (
    <nav className="bnav" aria-label="Primary navigation">
      {tabs.map((tab) => (
        <button type="button" key={tab.id} className={`bnav-tab ${active === tab.id ? 'bnav-tab--on' : ''}`} onClick={() => onChange(tab.id)} aria-label={tab.label} aria-current={active === tab.id ? 'page' : undefined}>
          <tab.Icon active={active === tab.id} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
