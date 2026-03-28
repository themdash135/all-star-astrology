import React, { useState, useEffect } from 'react';
import { apiPost, apiGet } from '../app/api.js';
import { getOrCreateFeedbackUserKey, readStoredForm } from '../app/storage.js';

const CATEGORIES = [
  { id: 'error', label: 'Error', icon: '\u{26a0}\u{fe0f}' },
  { id: 'feature', label: 'Feature', icon: '\u{1f4a1}' },
  { id: 'improve', label: 'Improve', icon: '\u{2728}' },
  { id: 'other', label: 'Other', icon: '\u{1f4ac}' },
];

export function FeedbackScreen() {
  const [category, setCategory] = useState('error');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [lastTicketId, setLastTicketId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Get user identity from onboarding form
  const form = readStoredForm();
  const userName = form?.full_name || 'User';
  const userKey = getOrCreateFeedbackUserKey();

  // Check for responses
  const loadTickets = () => {
    if (!userKey) return;
    setLoadingTickets(true);
    apiGet(`feedback/check?user_id=${encodeURIComponent(userKey)}&email=${encodeURIComponent(userKey)}`)
      .then(data => setTickets(data.tickets || []))
      .catch(() => {})
      .finally(() => setLoadingTickets(false));
  };

  useEffect(() => {
    loadTickets();
  }, [userKey, confirmed]);

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSubmitError('');

    try {
      const response = await apiPost('feedback/submit', {
        user_id: userKey,
        email: userKey,
        category,
        message: message.trim(),
        name: userName,
        contact: '',
      });
      setLastTicketId(response.ticket_id || '');
      setConfirmed(true);
      setMessage('');
      loadTickets();
    } catch (err) {
      setSubmitError(err?.message || 'Could not send feedback. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = tickets.filter(t => t.has_response).length;

  // Confirmation screen
  if (confirmed) {
    return (
      <div className="lg-feedback">
        <div className="lg-fb-confirm">
          <div className="lg-fb-confirm-glow" />
          <div className="lg-fb-confirm-icon">{'\u{2705}'}</div>
          <h2 className="lg-fb-confirm-title">Thank You, {userName.split(' ')[0]}!</h2>
          <p className="lg-fb-confirm-text">
            Your message was sent to the admin team{lastTicketId ? ` as ticket #${lastTicketId}` : ''}. We&apos;ll confirm here when it has been fixed.
          </p>
          <button
            type="button"
            className="lg-fb-send"
            onClick={() => setConfirmed(false)}
          >
            Send More Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg-feedback">
      <div className="lg-fb-header">
        <div className="lg-fb-glow" />
        <h2 className="lg-fb-title">Feedback</h2>
        <p className="lg-fb-sub">Help shape the future of All Star Astrology</p>
        <p className="ob-hint" style={{ marginTop: 8, marginBottom: 0 }}>
          We read every message. If your feedback leads to a change, we'll let you know right here.
        </p>
      </div>

      {/* Admin responses */}
      {unreadCount > 0 && (
        <div className="lg-fb-responses">
          {tickets.filter(t => t.has_response).map(t => (
            <div key={t.id} className="lg-fb-response-card">
              <div className="lg-fb-response-header">
                <span className="lg-fb-response-badge">{t.status === 'resolved' ? 'Fixed' : 'Update'}</span>
                <span className="lg-fb-response-cat">{t.category}</span>
              </div>
              <p className="lg-fb-response-your">You reported: {t.message}</p>
              {t.responses.map((r, i) => (
                <div key={i} className="lg-fb-response-reply">
                  <span className="lg-fb-response-dot" />
                  <p>{r.message}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="lg-fb-cats">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`lg-fb-pill ${category === cat.id ? 'lg-fb-pill--on' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            <span className="lg-fb-pill-icon">{cat.icon}</span>
            <span className="lg-fb-pill-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Message */}
      <div className="lg-fb-glass">
        <textarea
          className="lg-fb-input"
          placeholder={
            category === 'error' ? 'What went wrong? What did you see?'
            : category === 'feature' ? 'What feature would you like to see?'
            : category === 'improve' ? 'What could work better?'
            : 'Tell us what\'s on your mind...'
          }
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 1000))}
          rows={6}
        />
        <div className="lg-fb-count">{message.length}<span>/1000</span></div>
      </div>

      {submitError && <div className="ob-err" role="alert" style={{ marginBottom: 8 }}>{submitError}</div>}

      <button
        type="button"
        className={`lg-fb-send`}
        onClick={handleSubmit}
        disabled={!message.trim() || sending}
      >
        <span>{sending ? 'Sending...' : 'Send Feedback'}</span>
      </button>

      {tickets.length > 0 && (
        <button
          type="button"
          onClick={loadTickets}
          disabled={loadingTickets}
          style={{
            width: '100%', marginTop: 12, padding: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: '.8rem', textDecoration: 'underline',
            opacity: loadingTickets ? 0.5 : 0.7,
          }}
        >
          {loadingTickets ? 'Refreshing...' : 'Refresh ticket status'}
        </button>
      )}

      {/* Past tickets without responses */}
      {tickets.filter(t => !t.has_response).length > 0 && (
        <div className="lg-fb-history">
          <h3 className="lg-fb-history-title">Your Submissions</h3>
          {tickets.filter(t => !t.has_response).map(t => (
            <div key={t.id} className="lg-fb-history-item">
              <span className="lg-fb-history-cat">{t.category}</span>
              <span className="lg-fb-history-msg">{t.message}</span>
              <span className="lg-fb-history-status">{t.status === 'in_progress' ? 'Reviewing' : 'Pending'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
