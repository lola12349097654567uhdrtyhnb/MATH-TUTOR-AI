'use client';
import { useState } from 'react';

export default function QuestionnaireModal({ onSubmitSuccess }) {
  const [satisfaction, setSatisfaction] = useState(null);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const satisfactionOptions = [
    { value: 1, emoji: '😠', label: 'Very unhappy' },
    { value: 2, emoji: '🙁', label: 'Unhappy' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '🙂', label: 'Happy' },
    { value: 5, emoji: '😍', label: 'Very happy' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (satisfaction === null) {
      setError('Please select how satisfied you are!');
      return;
    }
    if (!q1 || !q2 || !q3) {
      setError('Please answer all Yes or No questions!');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const response = await fetch('/api/assessment/submit-questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userHeader,
        },
        body: JSON.stringify({
          satisfaction,
          q1_ai_helpful: q1,
          q2_difficulty_appropriate: q2,
          q3_recommend: q3,
          feedback_text: feedback,
        }),
      });

      if (response.ok) {
        onSubmitSuccess();
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 15, 30, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="card fade-enter-active" style={{
        width: '100%',
        maxWidth: '550px',
        background: 'rgba(20, 24, 45, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        padding: '35px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎓</div>
          <h2 className="title" style={{ fontSize: '1.75rem', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Website Questionnaire
          </h2>
          <p className="subtitle" style={{ fontSize: '0.95rem' }}>
            Congratulations on finishing! Please help us improve by rating your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Question 1: Satisfaction rating */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', fontSize: '1rem', color: '#f3f4f6', textAlign: 'center' }}>
              How satisfied are you with the AI Math Tutor?
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '15px 0' }}>
              {satisfactionOptions.map((opt) => {
                const isSelected = satisfaction === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSatisfaction(opt.value);
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    className="satisfaction-btn"
                  >
                    <span style={{
                      fontSize: isSelected ? '3.2rem' : '2.4rem',
                      filter: isSelected ? 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.6))' : 'grayscale(35%)',
                      opacity: isSelected ? 1 : 0.7,
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.15)' : 'none'
                    }}>
                      {opt.emoji}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      marginTop: '6px',
                      color: isSelected ? '#a855f7' : '#9ca3af',
                      fontWeight: isSelected ? '700' : '400',
                      transition: 'color 0.2s'
                    }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />

          {/* Yes/No Question 1 */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '500', color: '#e5e7eb', fontSize: '0.95rem', maxWidth: '65%' }}>
              Did the AI Interventions help you understand your mistakes?
            </span>
            <div style={{ display: 'inline-flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '20px' }}>
              {['Yes', 'No'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setQ1(val);
                    setError('');
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    background: q1 === val ? (val === 'Yes' ? '#10b981' : '#ef4444') : 'transparent',
                    color: q1 === val ? '#fff' : '#9ca3af',
                    transition: 'all 0.2s'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Yes/No Question 2 */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '500', color: '#e5e7eb', fontSize: '0.95rem', maxWidth: '65%' }}>
              Was the difficulty level appropriate for your skill level?
            </span>
            <div style={{ display: 'inline-flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '20px' }}>
              {['Yes', 'No'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setQ2(val);
                    setError('');
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    background: q2 === val ? (val === 'Yes' ? '#10b981' : '#ef4444') : 'transparent',
                    color: q2 === val ? '#fff' : '#9ca3af',
                    transition: 'all 0.2s'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Yes/No Question 3 */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '500', color: '#e5e7eb', fontSize: '0.95rem', maxWidth: '65%' }}>
              Would you recommend this tutoring website to other students?
            </span>
            <div style={{ display: 'inline-flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '20px' }}>
              {['Yes', 'No'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setQ3(val);
                    setError('');
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    background: q3 === val ? (val === 'Yes' ? '#10b981' : '#ef4444') : 'transparent',
                    color: q3 === val ? '#fff' : '#9ca3af',
                    transition: 'all 0.2s'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />

          {/* Open Feedback */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.95rem', color: '#e5e7eb' }}>
              Do you have any suggestions or comments? (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you liked, what you struggled with, or what we can do better..."
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#a855f7'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
            />
          </div>

          {error && (
            <div style={{ color: '#ff4d4d', fontSize: '0.9rem', marginBottom: '15px', textAlign: 'center', fontWeight: '500' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1.1rem',
              fontWeight: '700',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              border: 'none',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i> Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .satisfaction-btn:hover {
          transform: scale(1.18) !important;
        }
      `}</style>
    </div>
  );
}
