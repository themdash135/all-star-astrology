import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminFeedbackFetch } from './AdminApp.jsx';

const CATEGORIES = ['all', 'error', 'feature', 'improve', 'other'];
const STATUSES = ['all', 'responded', 'pending'];

const CANNED_REPLIES = [
  "Thanks for reporting \u2014 we're looking into it.",
  "This has been fixed in the latest update.",
  "Thanks for the suggestion \u2014 we've added it to our roadmap.",
];

function formatDate(iso) {
  if (!iso) return '\u2014';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function timeAgo(iso) {
  if (!iso) return '\u2014';
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    const diffMo = Math.floor(diffDay / 30);
    return `${diffMo}mo ago`;
  } catch { return iso; }
}

/** True when a pending ticket is older than 3 days */
function isStale(ticket) {
  if ((ticket.status || 'pending') === 'resolved') return false;
  if (!ticket.created) return false;
  const ageMs = Date.now() - new Date(ticket.created).getTime();
  return ageMs > 3 * 24 * 60 * 60 * 1000;
}

function truncate(str, max = 80) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export function AdminFeedback() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const replyRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminFeedbackFetch('admin');
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleReply = async (ticketId) => {
    if (!replyText.trim() || replying) return;
    try {
      setReplying(true);
      await adminFeedbackFetch('respond', {
        method: 'POST',
        body: JSON.stringify({ ticket_id: ticketId, message: replyText.trim(), status: replyStatus }),
      });
      setReplyText('');
      setReplyStatus('in_progress');
      await fetchTickets();
    } catch (err) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setReplyText('');
    setReplyStatus('in_progress');
  };

  /* ── Textarea auto-expand ── */
  const autoExpand = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    const minH = parseFloat(getComputedStyle(el).lineHeight || 20) * 3;
    const maxH = parseFloat(getComputedStyle(el).lineHeight || 20) * 8;
    el.style.height = Math.min(Math.max(el.scrollHeight, minH), maxH) + 'px';
  };

  /* ── Export filtered tickets as JSON ── */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-tickets-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ── Filtering ── */
  const filtered = tickets.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    const status = t.status || 'pending';
    if (filterStatus === 'responded' && status !== 'resolved') return false;
    if (filterStatus === 'pending' && status === 'resolved') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!(t.message || '').toLowerCase().includes(q) && !(t.email || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* ── Summary stats ── */
  const totalCount = tickets.length;
  const respondedCount = tickets.filter((t) => t.status === 'resolved').length;
  const pendingCount = totalCount - respondedCount;

  /* ── Loading / Error ── */
  if (loading && tickets.length === 0) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Feedback</h2>
        <div className="admin-empty">Loading tickets...</div>
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">Feedback</h2>
        <div className="admin-empty">
          <div className="admin-empty__icon">!</div>
          <div>{error}</div>
          <button className="admin-login-btn" style={{ width: 'auto', marginTop: 'var(--sp-md)' }} onClick={fetchTickets}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2 className="admin-title">Feedback</h2>

      {error && (
        <div style={{ color: 'var(--coral)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-md)' }}>
          {error}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="admin-cards">
        <div className={`admin-card ${pendingCount > 0 ? 'admin-card--warn' : 'admin-card--ok'}`}>
          <span className="admin-card__label">Total</span>
          <span className="admin-card__value">{totalCount}</span>
        </div>
        <div className={`admin-card ${pendingCount > 0 ? 'admin-card--warn' : 'admin-card--ok'}`}>
          <span className="admin-card__label">Pending</span>
          <span className="admin-card__value">{pendingCount}</span>
        </div>
        <div className="admin-card admin-card--ok">
          <span className="admin-card__label">Responded</span>
          <span className="admin-card__value">{respondedCount}</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="admin-filter">
        <input
          type="text"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-search-input"
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button className="admin-export-btn" onClick={exportJSON} title="Export filtered tickets as JSON">
          Export JSON
        </button>
      </div>

      {/* ── Ticket table ── */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__icon">--</div>
          <div>No tickets match the current filters</div>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>From</th>
              <th>Message</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticket) => {
              const isExpanded = expandedId === ticket.id;
              const status = ticket.status || 'pending';
              const stale = isStale(ticket);
              const rowClass = [
                ticket.category === 'error' ? 'admin-row--error' :
                ticket.category === 'improve' ? 'admin-row--improve' : '',
                stale ? 'admin-row--stale' : '',
              ].filter(Boolean).join(' ');
              return (
                <React.Fragment key={ticket.id}>
                  <tr
                    className={rowClass}
                    onClick={() => toggleRow(ticket.id)}
                    style={{ cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,.035)' : undefined }}
                  >
                    <td style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)' }}>{ticket.id.slice(0, 8)}</td>
                    <td>
                      <span className={`admin-badge ${
                        ticket.category === 'error' ? 'admin-badge--poor' :
                        ticket.category === 'feature' ? 'admin-badge--reading' :
                        ticket.category === 'improve' ? 'admin-badge--review' :
                        'admin-badge--healthy'
                      }`}>
                        {ticket.category}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--fs-sm)' }}>{ticket.email || '\u2014'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>{truncate(ticket.message)}</td>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', whiteSpace: 'nowrap' }} title={formatDate(ticket.created)}>{timeAgo(ticket.created)}</td>
                    <td>
                      <span className={`admin-badge ${
                        status === 'resolved' ? 'admin-badge--healthy' : status === 'in_progress' ? 'admin-badge--review' : 'admin-badge--poor'
                      }`}>
                        {status === 'resolved' ? 'Fixed' : status === 'in_progress' ? 'Reviewing' : 'Pending'}
                      </span>
                    </td>
                  </tr>

                  {/* ── Expanded ticket detail ── */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div style={{
                          padding: 'var(--sp-lg)',
                          background: 'rgba(255,255,255,.02)',
                          borderTop: '1px solid var(--glass-border)',
                        }}>
                          {/* Full message */}
                          <div style={{ marginBottom: 'var(--sp-lg)' }}>
                            <div style={{
                              fontSize: 'var(--fs-xs)', color: 'var(--muted)', textTransform: 'uppercase',
                              letterSpacing: '.04em', marginBottom: 'var(--sp-xs)',
                            }}>
                              Full Message
                            </div>
                            <div style={{
                              fontSize: 'var(--fs-base)', color: 'var(--text)',
                              lineHeight: 1.6, whiteSpace: 'pre-wrap',
                            }}>
                              {ticket.message}
                            </div>
                          </div>

                          {/* Previous responses */}
                          {ticket.responses && ticket.responses.length > 0 && (
                            <div style={{ marginBottom: 'var(--sp-lg)' }}>
                              <div style={{
                                fontSize: 'var(--fs-xs)', color: 'var(--muted)', textTransform: 'uppercase',
                                letterSpacing: '.04em', marginBottom: 'var(--sp-sm)',
                              }}>
                                Responses ({ticket.responses.length})
                              </div>
                              {ticket.responses.map((resp, i) => (
                                <div key={i} style={{
                                  padding: 'var(--sp-md)',
                                  background: 'rgba(91,168,157,.06)',
                                  border: '1px solid rgba(91,168,157,.15)',
                                  borderRadius: 'var(--r-sm)',
                                  marginBottom: 'var(--sp-sm)',
                                }}>
                                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                    {resp.message}
                                  </div>
                                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 'var(--sp-xs)' }}>
                                    {formatDate(resp.created)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply form */}
                          <div>
                            <div style={{
                              fontSize: 'var(--fs-xs)', color: 'var(--muted)', textTransform: 'uppercase',
                              letterSpacing: '.04em', marginBottom: 'var(--sp-xs)',
                            }}>
                              Reply
                            </div>
                            {/* Canned quick-reply chips */}
                            <div className="admin-canned-row">
                              {CANNED_REPLIES.map((msg, i) => (
                                <button
                                  key={i}
                                  className="admin-canned-chip"
                                  onClick={() => {
                                    setReplyText(msg);
                                    setTimeout(() => { if (replyRef.current) autoExpand(replyRef.current); }, 0);
                                  }}
                                >
                                  {msg}
                                </button>
                              ))}
                            </div>
                            <textarea
                              ref={replyRef}
                              value={replyText}
                              onChange={(e) => {
                                setReplyText(e.target.value);
                                autoExpand(e.target);
                              }}
                              onInput={(e) => autoExpand(e.target)}
                              placeholder={status === 'resolved' ? 'Send a follow-up message...' : 'Tell the user what was fixed or what you are reviewing...'}
                              rows={3}
                              style={{
                                width: '100%',
                                padding: 'var(--sp-sm) var(--sp-md)',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--r-sm)',
                                color: 'var(--text)',
                                fontFamily: 'var(--sans)',
                                fontSize: 'var(--fs-sm)',
                                resize: 'none',
                                outline: 'none',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                              }}
                              onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; }}
                              onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; }}
                            />
                            <select
                              value={replyStatus}
                              onChange={(e) => setReplyStatus(e.target.value)}
                              style={{
                                marginTop: 'var(--sp-sm)',
                                width: '100%',
                                padding: 'var(--sp-xs) var(--sp-md)',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--r-sm)',
                                color: 'var(--text)',
                              }}
                            >
                              <option value="in_progress">Reviewing</option>
                              <option value="resolved">Fixed and notify user</option>
                            </select>
                            <button
                              onClick={() => handleReply(ticket.id)}
                              disabled={!replyText.trim() || replying}
                              style={{
                                marginTop: 'var(--sp-sm)',
                                padding: 'var(--sp-xs) var(--sp-lg)',
                                border: 'none',
                                borderRadius: 'var(--r-sm)',
                                background: 'linear-gradient(135deg, var(--gold), #e8d5a8)',
                                color: '#080D1A',
                                fontFamily: 'var(--sans)',
                                fontSize: 'var(--fs-sm)',
                                fontWeight: 600,
                                cursor: !replyText.trim() || replying ? 'not-allowed' : 'pointer',
                                opacity: !replyText.trim() || replying ? 0.5 : 1,
                                transition: 'opacity .15s, transform .15s',
                              }}
                            >
                              {replying ? 'Sending...' : replyStatus === 'resolved' ? 'Send Fix Update' : 'Send Review Update'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
