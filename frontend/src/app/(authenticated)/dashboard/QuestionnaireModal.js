'use client';
import { useState } from 'react';

export default function QuestionnaireModal({ onSubmitSuccess }) {
  const [step, setStep] = useState(0); // 0 to 5 steps
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [satisfaction, setSatisfaction] = useState(null);
  
  // Section A: Look & Feel (UX)
  const [q_math_clear, setQMathClear] = useState(null);
  const [q_dark_mode, setQDarkMode] = useState(null);
  const [q_navigation, setQNavigation] = useState(null);
  const [q_bugs, setQBugs] = useState('');

  // Section B: Adaptive Learning
  const [q_adaptation, setQAdaptation] = useState(null);
  const [q_hints, setQHints] = useState(null);
  const [q_improvement, setQImprovement] = useState(null);
  const [q_best_topic, setQBestTopic] = useState('');

  // Section C: AI Explanations
  const [q_ai_walkthrough, setQAiWalkthrough] = useState(null);
  const [q_ai_tone, setQAiTone] = useState(null);
  const [q_ai_length, setQAiLength] = useState(null);
  const [q_ai_confused, setQAiConfused] = useState('');

  // Section D: Feelings & Stress
  const [q_timer_paused, setQTimerPaused] = useState(null);
  const [q_untimed, setQUntimed] = useState(null);
  const [q_confidence, setQConfidence] = useState(null);

  // Section E: Post-Assessment AI Review
  const [q_teach_me, setQTeachMe] = useState(null);
  const [q_study_plan, setQStudyPlan] = useState(null);

  const satisfactionOptions = [
    { value: 1, emoji: '😠', label: 'Very unhappy' },
    { value: 2, emoji: '🙁', label: 'Unhappy' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '🙂', label: 'Happy' },
    { value: 5, emoji: '😍', label: 'Very happy' },
  ];

  const ratingLabels = {
    1: 'Totally Disagree 👎',
    2: 'Disagree',
    3: 'Not Sure 😐',
    4: 'Agree',
    5: 'Totally Agree! 👍'
  };

  const handleNext = () => {
    setError('');
    if (step === 0) {
      if (satisfaction === null) {
        setError('Please choose a face that matches how you feel!');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!q_math_clear || !q_dark_mode || !q_navigation) {
        setError('Please answer all 3 rating questions to continue!');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!q_adaptation || !q_hints || !q_improvement) {
        setError('Please answer all 3 rating questions to continue!');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!q_ai_walkthrough || !q_ai_tone || !q_ai_length) {
        setError('Please answer all 3 rating questions to continue!');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!q_timer_paused || !q_untimed || !q_confidence) {
        setError('Please answer all 3 rating questions to continue!');
        return;
      }
      setStep(5);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!q_teach_me || !q_study_plan) {
      setError('Please answer all rating questions to submit!');
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
          q_math_clear,
          q_dark_mode,
          q_navigation,
          q_bugs,
          q_adaptation,
          q_hints,
          q_improvement,
          q_best_topic,
          q_ai_walkthrough,
          q_ai_tone,
          q_ai_length,
          q_ai_confused,
          q_timer_paused,
          q_untimed,
          q_confidence,
          q_teach_me,
          q_study_plan
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

  const renderRatingRow = (questionLabel, value, onChange) => {
    return (
      <div style={{ marginBottom: '22px' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.96rem', fontWeight: '500', color: '#e5e7eb', lineHeight: '1.4' }}>
          {questionLabel}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const active = value === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    onChange(num);
                    setError('');
                  }}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    border: active ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: active 
                      ? 'linear-gradient(135deg, #a855f7, #6366f1)' 
                      : 'rgba(255,255,255,0.03)',
                    color: active ? '#fff' : '#9ca3af',
                    fontSize: '1.15rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: active ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none'
                  }}
                  className="rating-bubble-btn"
                >
                  {num}
                </button>
              );
            })}
          </div>
          {value && (
            <span style={{
              fontSize: '0.78rem',
              color: '#a855f7',
              marginTop: '6px',
              fontWeight: '600',
              animation: 'fadeIn 0.2s'
            }}>
              {ratingLabels[value]}
            </span>
          )}
        </div>
      </div>
    );
  };

  const stepsData = [
    { title: 'Welcome! 🤩', desc: 'How happy are you with the AI Math Tutor?' },
    { title: 'Screen & Layout 🎨', desc: 'Let\'s rate the look and feel of the website!' },
    { title: 'Questions & Hints 🧠', desc: 'Did the tutor help you learn and level up?' },
    { title: 'AI Explain Buddy 🤖', desc: 'Let\'s rate the AI explanations!' },
    { title: 'Feelings & Timers 🧘', desc: 'How did practicing make you feel?' },
    { title: 'After-Test Review 📈', desc: 'The "Teach Me!" button and your study plan!' }
  ];

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(8, 10, 24, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div className="card fade-enter-active" style={{
        width: '100%',
        maxWidth: '560px',
        background: 'rgba(22, 28, 54, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        padding: '30px',
        maxHeight: '92vh',
        overflowY: 'auto',
        borderRadius: '24px',
        position: 'relative'
      }}>
        
        {/* Step Indicator & Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '6px', 
            marginBottom: '15px' 
          }}>
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                style={{
                  height: '6px',
                  width: s === step ? '32px' : '10px',
                  borderRadius: '3px',
                  background: s === step 
                    ? 'linear-gradient(90deg, #a855f7, #6366f1)' 
                    : s < step ? '#a855f7' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            ))}
          </div>
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#a855f7', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '1px' 
          }}>
            Section {stepsData[step].title}
          </span>
          <h2 className="title" style={{ 
            fontSize: '1.45rem', 
            margin: '4px 0 6px 0', 
            color: '#fff', 
            fontWeight: '800' 
          }}>
            {stepsData[step].desc}
          </h2>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }} />

        {/* Step 0: Satisfaction Emoji */}
        {step === 0 && (
          <div style={{ padding: '15px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
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
                      background: isSelected ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.02)' : 'none'
                    }}
                    className="satisfaction-row-btn"
                  >
                    <span style={{ fontSize: '2.5rem' }}>{opt.emoji}</span>
                    <span style={{ 
                      fontSize: '1.1rem', 
                      color: isSelected ? '#a855f7' : '#e5e7eb',
                      fontWeight: isSelected ? '700' : '500'
                    }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Section A (UX) */}
        {step === 1 && (
          <div>
            {renderRatingRow(
              "1. The fractions and math symbols on the screen were super clear and easy to read.", 
              q_math_clear, 
              setQMathClear
            )}
            {renderRatingRow(
              "2. The dark background was comfortable and easy on my eyes, even when studying for a while.", 
              q_dark_mode, 
              setQDarkMode
            )}
            {renderRatingRow(
              "3. It was easy to move around the app and switch between questions, hints, and the scratchpad.", 
              q_navigation, 
              setQNavigation
            )}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
                Optional: Did you experience any technical bugs, glitches, or screen lag?
              </label>
              <textarea
                value={q_bugs}
                onChange={(e) => setQBugs(e.target.value)}
                placeholder="Let us know if anything loaded slowly or broke..."
                rows={2}
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
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Section B (POMDP Learning) */}
        {step === 2 && (
          <div>
            {renderRatingRow(
              "1. The practice questions felt just right for my level—not too easy, and not super hard!", 
              q_adaptation, 
              setQAdaptation
            )}
            {renderRatingRow(
              "2. The hints actually helped me figure out questions when I got stuck.", 
              q_hints, 
              setQHints
            )}
            {renderRatingRow(
              "3. I feel like my math skills improved after practicing with the adaptive system.", 
              q_improvement, 
              setQImprovement
            )}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
                Which math topic did the system teach you best, and why?
              </label>
              <textarea
                value={q_best_topic}
                onChange={(e) => setQBestTopic(e.target.value)}
                placeholder="Fractions, algebra, geometry? Why did you like it?"
                rows={2}
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
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Section C (AI Explain) */}
        {step === 3 && (
          <div>
            {renderRatingRow(
              "1. When I got two answers wrong, the AI's step-by-step walkthrough helped me figure out my mistake.", 
              q_ai_walkthrough, 
              setQAiWalkthrough
            )}
            {renderRatingRow(
              "2. The AI tutor felt nice, encouraging, and friendly (like a real buddy helping me).", 
              q_ai_tone, 
              setQAiTone
            )}
            {renderRatingRow(
              "3. The AI's explanations were just the right length—not too long or boring!", 
              q_ai_length, 
              setQAiLength
            )}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
                Optional: Was there ever a time the AI's explanation confused you? If yes, what topic was it?
              </label>
              <textarea
                value={q_ai_confused}
                onChange={(e) => setQAiConfused(e.target.value)}
                placeholder="Let us know what part felt confusing or complicated..."
                rows={2}
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
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        )}

        {/* Step 4: Section D (Feelings & Stress) */}
        {step === 4 && (
          <div>
            {renderRatingRow(
              "1. Pausing the timer while reading the AI's help walkthrough made me feel less stressed and rushed.", 
              q_timer_paused, 
              setQTimerPaused
            )}
            {renderRatingRow(
              "2. I loved that the tests were not timed, because it let me take my time and think clearly.", 
              q_untimed, 
              setQUntimed
            )}
            {renderRatingRow(
              "3. Using this app made me feel more confident about trying hard math problems in school!", 
              q_confidence, 
              setQConfidence
            )}
          </div>
        )}

        {/* Step 5: Section E (Post-Assessment & Teach Me) */}
        {step === 5 && (
          <div>
            {renderRatingRow(
              "1. Clicking the 'Teach Me!' button after the test to see my exact mistakes was a great way to learn.", 
              q_teach_me, 
              setQTeachMe
            )}
            {renderRatingRow(
              "2. The custom study plan the AI made for me matched what I actually needed to work on.", 
              q_study_plan, 
              setQStudyPlan
            )}
          </div>
        )}

        {error && (
          <div style={{ 
            color: '#f87171', 
            fontSize: '0.85rem', 
            marginTop: '15px', 
            textAlign: 'center', 
            fontWeight: '600',
            background: 'rgba(239, 68, 68, 0.08)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.15)'
          }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ 
          marginTop: '25px', 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'space-between' 
        }}>
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Back
            </button>
          ) : (
            <div /> // Spacer
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                padding: '12px 30px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#fff',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              Continue <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '12px 30px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Submitting...' : 'Finish & Submit 🎉'}
            </button>
          )}
        </div>

      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .satisfaction-row-btn:hover {
          transform: translateY(-2px) scale(1.01) !important;
          border-color: rgba(168, 85, 247, 0.5) !important;
          background: rgba(168, 85, 247, 0.04) !important;
        }
        .rating-bubble-btn:hover {
          transform: scale(1.15) !important;
          border-color: #a855f7 !important;
        }
      `}</style>
    </div>
  );
}
