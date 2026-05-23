'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function StudentDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const student = searchParams.get('student');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState('fractions');

  useEffect(() => {
    async function fetchDetail() {
      if (!student) return;
      try {
        setLoading(true);
        const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
        const res = await fetch(`/api/instructor/student-detail?student=${student}`, {
          headers: { 'x-user-id': userHeader }
        });
        if (res.ok) {
          const detailData = await res.json();
          setData(detailData);
          // Set active topic to the first target topic if available
          if (detailData.target_topics && detailData.target_topics.length > 0) {
            setActiveTopic(detailData.target_topics[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [student]);

  if (loading) return <div className="container">Loading detailed student metrics...</div>;
  if (!data) return <div className="container">Student not found or unauthorized.</div>;

  const currentStats = data.topic_stats[activeTopic] || {
    total_questions: 0,
    correct_questions: 0,
    accuracy: 0,
    average_response_time: 0,
    difficulty: { easy: { served: 0, correct: 0 }, medium: { served: 0, correct: 0 }, hard: { served: 0, correct: 0 } },
    struggles: [],
    interventions_count: 0,
    mastery: 0,
    graduated: false
  };

  const getDifficultyPercent = (diff) => {
    const served = currentStats.difficulty[diff]?.served || 0;
    if (served === 0) return 0;
    return Math.round(((currentStats.difficulty[diff]?.correct || 0) / served) * 100);
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="title">{data.username}'s Learning Insights</h1>
          <p className="subtitle">Real-time deep curriculum diagnostic and AI intervention logs.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => router.push('/instructor/assessments')}>
          <i className="fa-solid fa-arrow-left"></i> Back to Assessments
        </button>
      </header>

      {/* Student Profile Overview Row */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', padding: '24px', marginBottom: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ margin: '0 0 10px', color: 'var(--primary)' }}>Learning Profile</h3>
          <p style={{ margin: '5px 0', fontSize: '0.95rem' }}><strong>Target Topics:</strong> {data.target_topics.join(', ') || 'None selected'}</p>
          <p style={{ margin: '5px 0', fontSize: '0.95rem' }}><strong>Math Confidence:</strong> {data.profile?.confidence || 'Not configured'}</p>
          <p style={{ margin: '5px 0', fontSize: '0.95rem' }}><strong>Preferred Pace:</strong> {data.profile?.pace || 'Not configured'}</p>
        </div>
        <div style={{ flex: '1 1 300px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
          <h3 style={{ margin: '0 0 10px', color: '#10b981' }}>Current Course Status</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            {data.target_topics.map(topic => (
              <span key={topic} style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: data.topic_stats[topic]?.graduated ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: data.topic_stats[topic]?.graduated ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                color: data.topic_stats[topic]?.graduated ? '#34d399' : 'var(--muted)',
                fontSize: '0.85rem',
                textTransform: 'capitalize'
              }}>
                {topic}: {data.topic_stats[topic]?.graduated ? 'Graduated 🎉' : `Mastery ${Math.round(data.topic_stats[topic]?.mastery * 100)}%`}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Questionnaire Feedback Card if available */}
      {data.evaluation_questionnaire && (
        <div className="card" style={{
          marginBottom: '30px',
          padding: '24px',
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
          boxShadow: '0 10px 30px rgba(168, 85, 247, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>
                {data.evaluation_questionnaire.satisfaction === 5 ? '😍' :
                 data.evaluation_questionnaire.satisfaction === 4 ? '🙂' :
                 data.evaluation_questionnaire.satisfaction === 3 ? '😐' :
                 data.evaluation_questionnaire.satisfaction === 2 ? '🙁' : '😠'}
              </span>
              <div>
                <h3 style={{ margin: 0, color: '#a855f7', fontSize: '1.2rem' }}>System Feedback Submitted</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Submitted on: {new Date(data.evaluation_questionnaire.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', background: data.evaluation_questionnaire.q1_ai_helpful === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: data.evaluation_questionnaire.q1_ai_helpful === 'Yes' ? '#34d399' : '#f87171' }}>
                AI Helpful: {data.evaluation_questionnaire.q1_ai_helpful}
              </span>
              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', background: data.evaluation_questionnaire.q2_difficulty_appropriate === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: data.evaluation_questionnaire.q2_difficulty_appropriate === 'Yes' ? '#34d399' : '#f87171' }}>
                Difficulty OK: {data.evaluation_questionnaire.q2_difficulty_appropriate}
              </span>
              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', background: data.evaluation_questionnaire.q3_recommend === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: data.evaluation_questionnaire.q3_recommend === 'Yes' ? '#34d399' : '#f87171' }}>
                Recommend: {data.evaluation_questionnaire.q3_recommend}
              </span>
            </div>
          </div>
          {data.evaluation_questionnaire.feedback_text ? (
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderLeft: '4px solid #a855f7',
              padding: '14px 18px',
              borderRadius: '0 10px 10px 0',
              fontStyle: 'italic',
              color: '#f3f4f6',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              "{data.evaluation_questionnaire.feedback_text}"
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No written suggestions provided.</p>
          )}
        </div>
      )}

      {/* Topic Switcher Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
        {data.target_topics.map(topic => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: activeTopic === topic ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
              background: activeTopic === topic ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease'
            }}
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="grid" style={{ marginBottom: '30px' }}>
        {/* Core metrics column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Key Indicators Card */}
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '24px' }}>
            <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ margin: '0 0 5px', color: 'var(--muted)', fontSize: '0.9rem' }}>Subject Mastery</p>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                {Math.round(currentStats.mastery * 100)}%
              </h3>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 5px', color: 'var(--muted)', fontSize: '0.9rem' }}>Total Questions</p>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: '#38bdf8' }}>
                {currentStats.total_questions}
              </h3>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
              <p style={{ margin: '0 0 5px', color: 'var(--muted)', fontSize: '0.9rem' }}>Accuracy Rate</p>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: '#4ade80' }}>
                {currentStats.accuracy}%
              </h3>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
              <p style={{ margin: '0 0 5px', color: 'var(--muted)', fontSize: '0.9rem' }}>AI Interventions</p>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: '#ec4899' }}>
                {currentStats.interventions_count}
              </h3>
            </div>
          </div>

          {/* Difficulty Breakdown Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 className="section-title" style={{ margin: '0 0 20px', fontSize: '1.2rem' }}>Difficulty Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {['easy', 'medium', 'hard'].map(diff => {
                const info = currentStats.difficulty[diff] || { served: 0, correct: 0 };
                const pct = getDifficultyPercent(diff);
                return (
                  <div key={diff}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{diff}</span>
                      <span style={{ color: 'var(--muted)' }}>
                        {info.correct}/{info.served} correct ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: '4px',
                        background: diff === 'easy' ? '#22c55e' : diff === 'medium' ? '#eab308' : '#ef4444',
                        boxShadow: '0 0 8px rgba(255,255,255,0.1)'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Struggles and intervention logs */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="section-title" style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Concept Struggles & Wrong Answers</h3>
          <p className="section-note" style={{ margin: 0 }}>Most recent questions this student got wrong and what specific answer they chose.</p>

          {currentStats.struggles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <i className="fa-solid fa-face-smile" style={{ fontSize: '2.5rem', color: '#10b981', marginBottom: '10px' }}></i>
              <p style={{ margin: 0, color: 'var(--muted)' }}>Perfect performance! No recorded struggles for this topic.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {currentStats.struggles.map((struggle, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    background: struggle.difficulty === 'easy' ? 'rgba(34, 197, 94, 0.15)' : struggle.difficulty === 'medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: struggle.difficulty === 'easy' ? '#4ade80' : struggle.difficulty === 'medium' ? '#facc15' : '#f87171'
                  }}>
                    {struggle.difficulty}
                  </span>
                  
                  <p style={{ margin: '0 0 10px', paddingRight: '60px', fontWeight: 500, fontSize: '0.95rem' }}>
                    {struggle.question_text}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.08)', padding: '4px 8px', borderRadius: '4px' }}>
                      <strong>Chose:</strong> {struggle.student_answer}
                    </span>
                    {struggle.correct_answer && struggle.correct_answer !== 'N/A' && (
                      <span style={{ color: '#4ade80', background: 'rgba(34, 197, 94, 0.08)', padding: '4px 8px', borderRadius: '4px' }}>
                        <strong>Correct:</strong> {struggle.correct_answer}
                      </span>
                    )}
                    {struggle.is_upload && (
                      <span style={{ color: '#facc15', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        <i className="fa-solid fa-file-signature"></i> Scratchpad Math Error
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentDetail() {
  return (
    <Suspense fallback={<div className="container">Loading insights...</div>}>
      <StudentDetailContent />
    </Suspense>
  );
}
