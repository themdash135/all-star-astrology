import React, { useMemo, useState } from 'react';

import { CALENDAR_SYSTEMS, DAY_LABELS, MONTH_NAMES, formatScore, scoreToBg, scoreToColor } from '../app/calendar-config.js';
import { scoreDay, scoreMonth } from '../app/calendar-engine.js';
import { IconBack } from './common.jsx';

/* ═══════════════════════════════════════════════════════
   SystemCalendarTab — month-based calendar inside each system.
   Category tabs, color-coded day cells with dual scores,
   day detail modal.
   ═══════════════════════════════════════════════════════ */
export function SystemCalendarTab({ systemId, form }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [activeCat, setActiveCat] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const calSys = CALENDAR_SYSTEMS[systemId];
  if (!calSys) return <p className="empty-msg">No calendar for this system.</p>;

  const category = calSys.categories[activeCat];

  // Compute all day scores for the month
  const monthScores = useMemo(
    () => scoreMonth(systemId, category.key, year, month, form),
    [systemId, category.key, year, month, form],
  );

  // Build the month grid (weeks starting Monday)
  const grid = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    // getDay: 0=Sun — already Sunday-start
    const firstDayIdx = new Date(year, month - 1, 1).getDay();

    // Previous month trailing days
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevDays = new Date(prevYear, prevMonth, 0).getDate();

    const cells = [];
    // Leading blanks from previous month
    for (let i = firstDayIdx - 1; i >= 0; i--) {
      cells.push({ day: prevDays - i, inMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, inMonth: true });
    }
    // Trailing days to fill last row
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        cells.push({ day: i, inMonth: false });
      }
    }

    // Split into weeks
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  }

  const isToday = (d) => d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  // Selected day detail
  const detail = selectedDay ? scoreDay(systemId, category.key, year, month, selectedDay, form) : null;

  return (
    <div className="cal-page">
      {/* Month selector */}
      <div className="cal-month-bar">
        <button type="button" className="cal-month-arrow" onClick={prevMonth} aria-label="Previous month">{'\u2039'}</button>
        <span className="cal-month-label serif">{MONTH_NAMES[month - 1]} {year}</span>
        <button type="button" className="cal-month-arrow" onClick={nextMonth} aria-label="Next month">{'\u203A'}</button>
      </div>

      {/* Category tabs */}
      <div className="cal-cat-bar">
        {calSys.categories.map((cat, i) => (
          <button
            type="button"
            key={cat.key}
            className={`cal-cat-tab ${i === activeCat ? 'cal-cat-tab--active' : ''}`}
            onClick={() => { setActiveCat(i); setSelectedDay(null); }}
          >
            <span className="cal-cat-icon">{cat.icon}</span>
            <span className="cal-cat-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: '#22C55E' }} />Strong</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: '#64748B' }} />Neutral</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{ background: '#EF4444' }} />Weak</span>
      </div>

      {/* Day grid */}
      <div className="cal-grid">
        {/* Header row */}
        <div className="cal-header-row">
          {DAY_LABELS.map((label) => (
            <div key={label} className="cal-header-cell">{label}</div>
          ))}
        </div>

        {/* Week rows */}
        {grid.map((week, wi) => (
          <div key={wi} className="cal-week-row">
            {week.map((cell, ci) => {
              if (!cell.inMonth) {
                return (
                  <div key={ci} className="cal-cell cal-cell--outside">
                    <span className="cal-cell-day">{cell.day}</span>
                  </div>
                );
              }
              const sc = monthScores[cell.day];
              const bg = sc ? scoreToBg(sc.primary) : 'transparent';
              const color = sc ? scoreToColor(sc.primary) : 'var(--muted)';
              const secColor = sc ? scoreToColor(sc.secondary) : 'var(--muted)';
              const todayClass = isToday(cell.day) ? ' cal-cell--today' : '';
              const selectedClass = selectedDay === cell.day ? ' cal-cell--selected' : '';

              return (
                <button
                  type="button"
                  key={ci}
                  className={`cal-cell${todayClass}${selectedClass}`}
                  style={{ background: bg }}
                  onClick={() => setSelectedDay(cell.day)}
                >
                  <span className="cal-cell-day">{cell.day}</span>
                  {sc && (
                    <div className="cal-cell-scores">
                      <span className="cal-cell-primary" style={{ color }}>{formatScore(sc.primary)}</span>
                      <span className="cal-cell-secondary" style={{ color: secColor }}>{formatScore(sc.secondary)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Day detail modal */}
      {selectedDay && detail && (
        <div className="cal-detail fade-in">
          <div className="cal-detail-header">
            <div className="cal-detail-date">
              <span className="cal-detail-day serif">{selectedDay}</span>
              <span className="cal-detail-month">{MONTH_NAMES[month - 1]} {year}</span>
            </div>
            <div className="cal-detail-scores-hero">
              <span className="cal-detail-primary serif" style={{ color: scoreToColor(detail.primary) }}>{formatScore(detail.primary)}</span>
              <span className="cal-detail-secondary" style={{ color: scoreToColor(detail.secondary) }}>{formatScore(detail.secondary)}</span>
            </div>
            <button type="button" className="cal-detail-close" onClick={() => setSelectedDay(null)} aria-label="Close">{'\u2715'}</button>
          </div>

          <div className="cal-detail-cat">
            <span className="cal-detail-cat-icon">{category.icon}</span>
            <span className="cal-detail-cat-name">{category.label}</span>
            <span className="cal-detail-cat-desc">{category.desc}</span>
          </div>

          {/* Summary */}
          <p className="cal-detail-summary">{detail.summary}</p>

          {/* Factors */}
          {detail.factors?.length > 0 && (
            <div className="cal-detail-factors">
              <h4 className="cal-detail-section-title serif">Score Breakdown</h4>
              {detail.factors.map((f, i) => (
                <div key={i} className={`cal-factor cal-factor--${f.impact}`}>
                  <span className="cal-factor-label">{f.label}</span>
                  <span className="cal-factor-value">{f.value}</span>
                  <span className={`cal-factor-badge cal-factor-badge--${f.impact}`}>
                    {f.impact === 'helps' ? '\u25B2' : f.impact === 'hurts' ? '\u25BC' : '\u25C6'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Helps & Hurts */}
          <div className="cal-detail-hh">
            {detail.helps?.length > 0 && (
              <div className="cal-detail-helps">
                <h4 className="cal-detail-section-title serif cal-section-helps">What Helps</h4>
                {detail.helps.map((h, i) => (
                  <div key={i} className="cal-hh-row cal-hh-help">
                    <span className="cal-hh-dot" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
            {detail.hurts?.length > 0 && (
              <div className="cal-detail-hurts">
                <h4 className="cal-detail-section-title serif cal-section-hurts">What Challenges</h4>
                {detail.hurts.map((h, i) => (
                  <div key={i} className="cal-hh-row cal-hh-hurt">
                    <span className="cal-hh-dot" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {detail.actions?.length > 0 && (
            <div className="cal-detail-actions">
              <h4 className="cal-detail-section-title serif">Suggested Actions</h4>
              {detail.actions.map((a, i) => (
                <div key={i} className="cal-action-row">
                  <span className="cal-action-dot" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
