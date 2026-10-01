import React, { useState, useEffect } from 'react';
import requestService from '../services/requestService';
import { Sparkles, Send, X, RefreshCw, AlertCircle, CheckCircle2, Clock, User, Mail } from 'lucide-react';

const TONES = [
  { id: 'PROFESSIONAL', label: 'Professional', desc: 'Courteous & clear business tone' },
  { id: 'URGENT', label: 'Urgent', desc: 'Direct escalation with immediate action required' },
  { id: 'FRIENDLY', label: 'Friendly', desc: 'Supportive & collaborative check-in' },
  { id: 'FORMAL', label: 'Formal', desc: 'Strict accounting & compliance reminder' },
];

export default function AiEmailModal({ request, isOpen, onClose, onSent }) {
  const [tone, setTone] = useState('PROFESSIONAL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [provider, setProvider] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Draft email on open or tone change
  const generateDraft = async (selectedTone = tone) => {
    if (!request) return;
    setLoading(true);
    setError('');
    try {
      const data = await requestService.draftAiEmail(request.id, selectedTone);
      setSubject(data.subject || `Urgent Notice: Task #${request.id} - ${request.title}`);
      setBody(data.body || '');
      setProvider(data.aiProvider || 'Gemini 2.5 Flash');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate AI email draft');
      // Fallback draft
      setSubject(`Notice: Task #${request.id} Deadline Follow-up [${request.title}]`);
      setBody(
        `Dear ${request.assignee},\n\nThis is a follow-up regarding your assigned accounting task "${request.title}" for client "${request.clientName}".\nDeadline: ${new Date(request.dueDateTime).toLocaleString()}.\n\nPlease update the task status in the portal once completed.\n\nBest regards,\nAccounting Supervision`
      );
      setProvider('Heuristic Fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && request) {
      setSuccess('');
      setError('');
      generateDraft(tone);
    }
  }, [isOpen, request]);

  const handleToneChange = (newTone) => {
    setTone(newTone);
    generateDraft(newTone);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message body cannot be empty.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await requestService.sendAiDraft(request.id, subject, body);
      setSuccess(res.message || 'AI Email Reminder dispatched successfully!');
      setTimeout(() => {
        if (onSent) onSent(res);
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to dispatch email');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !request) return null;

  const isOverdue =
    (request.status === 'OPEN' || request.status === 'IN_PROGRESS') &&
    request.dueDateTime &&
    new Date(request.dueDateTime) < new Date();

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content ai-email-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header ai-modal-header">
          <div className="ai-header-title-group">
            <div className="ai-avatar-icon">
              <Sparkles size={22} className="sparkle-anim" />
            </div>
            <div>
              <h3 className="ai-modal-title">Gemini AI Email Drafter & Dispatcher</h3>
              <p className="ai-modal-subtitle">
                Context-aware reminder generator • Dispatches email to {request.assigneeEmail || request.assignee} & CCs Accountant
              </p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Task Context Card */}
          <div className="ai-task-context-card">
            <div className="ai-context-main">
              <span className="ai-context-label">Task #{request.id}</span>
              <strong className="ai-context-title">{request.title}</strong>
              <span className="ai-context-client">Client: <strong>{request.clientName}</strong></span>
            </div>
            <div className="ai-context-meta">
              <span>
                <User size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Assignee: <strong>{request.assignee}</strong> ({request.assigneeEmail || 'No email'})
              </span>
              <span>
                <Clock size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Deadline: {new Date(request.dueDateTime).toLocaleString()}
              </span>
              {isOverdue ? (
                <span className="badge-overdue">⚠️ OVERDUE</span>
              ) : (
                <span className="badge-normal">On Track</span>
              )}
            </div>
          </div>

          {/* Tone Selector */}
          <div className="ai-tone-section">
            <div className="ai-field-header">
              <label className="ai-field-label">Select Generation Tone:</label>
              {provider && <span className="ai-provider-badge">Powered by {provider}</span>}
            </div>
            <div className="ai-tone-grid">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`ai-tone-btn ${tone === t.id ? 'ai-tone-btn-active' : ''}`}
                  onClick={() => handleToneChange(t.id)}
                  disabled={loading}
                >
                  <span className="ai-tone-label">{t.label}</span>
                  <span className="ai-tone-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email Subject */}
          <div className="ai-field-group">
            <div className="ai-field-header">
              <label className="ai-field-label">Email Subject:</label>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => generateDraft(tone)}
                disabled={loading}
              >
                <RefreshCw size={11} className={loading ? 'spin' : ''} />
                {loading ? 'Regenerating...' : 'Regenerate Draft'}
              </button>
            </div>
            <input
              type="text"
              className="ai-subject-input form-group input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email Subject Line"
              disabled={loading}
            />
          </div>

          {/* Email Body */}
          <div className="ai-field-group">
            <label className="ai-field-label">Email Message Content:</label>
            <textarea
              rows={8}
              className="ai-body-textarea form-group textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Generating AI personalized email body..."
              disabled={loading}
            />
            <span className="ai-field-tip">
              💡 You can freely edit the drafted message above before sending. The recipient will receive this formatted email directly.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-send-ai"
            onClick={handleSend}
            disabled={sending || loading}
          >
            {sending ? (
              <>
                <RefreshCw size={14} className="spin" style={{ marginRight: '6px' }} />
                Dispatching Email...
              </>
            ) : (
              <>
                <Send size={14} style={{ marginRight: '6px' }} />
                Send AI Reminder Email Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
