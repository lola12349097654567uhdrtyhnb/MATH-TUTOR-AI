import { useState, useEffect } from 'react';
import { MathText } from './Shared';

export function AiInterventionScreen({ topic, currentAction, onDismiss, isAssessment = false }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getIntervention() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/tutor/ai-intervention', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            difficulty: currentAction?.difficulty || 'medium',
            question_text: currentAction?.question_text || currentAction?.content || '',
            correct_answer: currentAction?.correct_answer || ''
          })
        });

        if (!res.ok) {
          throw new Error('Failed to load AI intervention explanation');
        }

        const data = await res.json();
        setExplanation(data.explanation);
      } catch (err) {
        console.error(err);
        setError('Could not reach the AI Tutor. Please click continue to try practicing again!');
      } finally {
        setLoading(false);
      }
    }

    getIntervention();
  }, [topic, currentAction]);

  return (
    <section className="card fade-enter-active" style={{
      border: '2px solid transparent',
      background: 'linear-gradient(rgba(17, 12, 33, 0.9), rgba(13, 10, 24, 0.95)) padding-box, linear-gradient(135deg, #a855f7, #6366f1) border-box',
      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)',
      borderRadius: '20px',
      padding: '30px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
          fontSize: '1.2rem'
        }}>
          <i className="fa-solid fa-graduation-cap"></i>
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #d8b4fe, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isAssessment ? 'AI Walkthrough & Explanation' : 'AI Tutor Intervention'}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '2px 0 0' }}>
            {isAssessment ? 'A step-by-step breakdown to learn from your mistake!' : "Let's slow down and learn this concept together!"}
          </p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '25px' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', fontWeight: 600 }}>
          {isAssessment ? 'Assessment Question' : 'Struggled Question'}
        </p>
        <p style={{ fontSize: '1.15rem', fontWeight: 500, margin: 0, color: '#f3f4f6' }}>
          <MathText content={currentAction?.question_text || currentAction?.content} />
        </p>
        {currentAction?.options && currentAction.options.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
            {currentAction.options.map(opt => (
              <span key={opt} style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: opt === currentAction.correct_answer ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
                border: opt === currentAction.correct_answer ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: opt === currentAction.correct_answer ? '#4ade80' : 'var(--muted)',
                fontSize: '0.85rem'
              }}>
                <MathText content={opt} /> {opt === currentAction.correct_answer && '✓'}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ minHeight: '150px', marginBottom: '30px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="skeleton" style={{ height: '20px', width: '40%' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '90%' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '85%' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '70%' }}></div>
          </div>
        ) : error ? (
          <div style={{ color: 'var(--warn-text)', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i> {error}
          </div>
        ) : (
          <div style={{
            color: '#e5e7eb',
            lineHeight: 1.7,
            fontSize: '1.05rem',
            whiteSpace: 'pre-wrap'
          }}>
            {explanation.split('\n').map((line, idx) => {
              if (line.trim().startsWith('Step') || line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.')) {
                return (
                  <div key={idx} style={{
                    background: 'rgba(99, 102, 241, 0.04)',
                    borderLeft: '4px solid #818cf8',
                    padding: '12px 16px',
                    borderRadius: '0 8px 8px 0',
                    margin: '16px 0'
                  }}>
                    {line}
                  </div>
                );
              }
              return <p key={idx} style={{ margin: '10px 0' }}>{line}</p>;
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={onDismiss}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            border: 'none',
            padding: '12px 28px',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          {isAssessment ? (
            <>
              <i className="fa-solid fa-arrow-left"></i> Back to Assessment Review
            </>
          ) : (
            <>
              <i className="fa-solid fa-play"></i> Let's Practice Again!
            </>
          )}
        </button>
      </div>
    </section>
  );
}
