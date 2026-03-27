import React, { useState, useEffect, useCallback } from 'react';
import { adminFeedbackFetch } from './AdminApp.jsx';

const CATEGORIES = ['all', 'error', 'feature', 'improve', 'other'];
const STATUSES = ['all', 'responded', 'pending'];

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
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
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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
        body: JSON.stringify({ ticket_id: ticketId, message: replyText.trim() }),
      });
      setReplyText('');
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
  };

  /* ── Filtering ── */
  const filtered = tickets.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    const hasResponse = t.responses && t.responses.length > 0;
    if (filterStatus === 'responded' && !hasResponse) return false;
    if (filterStatus === 'pending' && hasResponse) return false;
    return true;
  });

  /* ── Summary stats ── */
  const totalCount = tickets.length;
  const respondedCount = tickets.filter((t) => t.responses && t.responses.length > 0).length;
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
              const hasResponse = ticket.responses && ticket.responses.length > 0;
              return (
                <React.Fragment key={ticket.id}>
                  <tr
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
                    <td style={{ fontSize: 'var(--fs-sm)' }}>{ticket.email || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>{truncate(ticket.message)}</td>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatDate(ticket.created)}</td>
                    <td>
                      <span className={`admin-badge ${hasResponse ? 'admin-badge--healthy' : 'admin-badge--review'}`}>
                        {hasResponse ? 'Responded' : 'Pending'}
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
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your response..."
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
                                resize: 'vertical',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                              onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; }}
                              onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; }}
                            />
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
                              {replying ? 'Sending...' : 'Send Reply'}
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
