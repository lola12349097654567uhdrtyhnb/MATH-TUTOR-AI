'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MathText } from '../tutor/components/Shared';
import { AiInterventionScreen } from '../tutor/components/AiInterventionScreen';

const MOCK_QUESTIONS_BY_TOPIC = {
  fractions: [
    { question_id: 'mock_frac_1', content: 'Simplify the fraction: 4/12', options: ['1/2', '1/3', '1/4', '2/3'], correct_answer: '1/3' },
    { question_id: 'mock_frac_2', content: 'What is 3/4 + 1/2?', options: ['4/6', '5/4', '1/2', '7/4'], correct_answer: '5/4' },
    { question_id: 'mock_frac_3', content: 'Multiply the fractions: 2/3 * 3/5', options: ['5/8', '2/5', '6/8', '1/2'], correct_answer: '2/5' },
    { question_id: 'mock_frac_4', content: 'What is 4/5 - 1/3?', options: ['3/2', '7/15', '1/2', '3/5'], correct_answer: '7/15' },
    { question_id: 'mock_frac_5', content: 'Divide the fractions: 2/3 / 4/5', options: ['5/6', '8/15', '1/2', '2/5'], correct_answer: '5/6' }
  ],
  algebra: [
    { question_id: 'mock_alg_1', content: 'Find x: 4x + 3 = 47', options: ['10', '11', '12', '13'], correct_answer: '11' },
    { question_id: 'mock_alg_2', content: 'Find the positive solution for x: x2 + x - 12 = 0', options: ['2', '3', '4', '6'], correct_answer: '3' },
    { question_id: 'mock_alg_3', content: 'Solve for x: 3x - 5 = 16', options: ['6', '7', '8', '9'], correct_answer: '7' },
    { question_id: 'mock_alg_4', content: 'Find x: 2(x + 4) = 18', options: ['4', '5', '6', '7'], correct_answer: '5' },
    { question_id: 'mock_alg_5', content: 'Solve for x: x/3 + 4 = 10', options: ['12', '15', '18', '21'], correct_answer: '18' }
  ],
  exponents: [
    { question_id: 'mock_exp_1', content: 'Simplify: x5 * x3', options: ['x2', 'x8', 'x15', 'x5/3'], correct_answer: 'x8' },
    { question_id: 'mock_exp_2', content: 'Evaluate: 23 * 22', options: ['12', '16', '32', '64'], correct_answer: '32' },
    { question_id: 'mock_exp_3', content: 'Simplify: (x3)4', options: ['x7', 'x12', 'x34', 'x1'], correct_answer: 'x12' },
    { question_id: 'mock_exp_4', content: 'Simplify: x6 / x2', options: ['x3', 'x4', 'x8', 'x12'], correct_answer: 'x4' },
    { question_id: 'mock_exp_5', content: 'Evaluate: 53', options: ['15', '25', '125', '225'], correct_answer: '125' }
  ],
  geometry: [
    { question_id: 'mock_geo_1', content: 'Find the area of a triangle with base 6 and height 4', options: ['10', '12', '24', '48'], correct_answer: '12' },
    { question_id: 'mock_geo_2', content: 'Find the volume of a rectangular prism with length 3, width 2, and height 5', options: ['10', '15', '30', '60'], correct_answer: '30' },
    { question_id: 'mock_geo_3', content: 'Find the area of a circle with radius 7 (use pi = 22/7)', options: ['44', '154', '308', '616'], correct_answer: '154' },
    { question_id: 'mock_geo_4', content: 'Find the perimeter of a rectangle with length 8 and width 5', options: ['13', '26', '40', '80'], correct_answer: '26' },
    { question_id: 'mock_geo_5', content: 'Find the surface area of a cube with side length 3', options: ['9', '27', '54', '81'], correct_answer: '54' }
  ]
};

export default function AssessmentResults() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pre'); // 'pre' or 'post'
  
  // live AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Modal / Slide-out state for AI Intervention Help
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [penalizing, setPenalizing] = useState({});

  useEffect(() => {
    async function loadResults() {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/auth/session', {
        headers: { 'x-user-id': userHeader }
      });
      
      if (res.ok) {
        const seshData = await res.json();
        setData(seshData);
      }
      setLoading(false);
    }
    loadResults();
  }, []);

  // Fetch live AI study feedback analysis from Gemini when active tab or data changes
  useEffect(() => {
    if (!data) return;

    async function fetchAiAnalysis() {
      setLoadingAnalysis(true);
      const scoreObj = activeTab === 'pre' ? data.pre_assessment?.score : data.post_assessment?.score;
      const targetTopics = data.target_topics || [];

      try {
        const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
        const res = await fetch('/api/assessment/ai-analysis', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userHeader
          },
          body: JSON.stringify({
            pre_score: scoreObj,
            target_topics: targetTopics,
            type: activeTab
          })
        });

        if (res.ok) {
          const result = await res.json();
          setAiAnalysis(result.analysis);
        } else {
          setAiAnalysis("Could not load customized AI analysis. Try practicing in standard mode to build your skills!");
        }
      } catch (err) {
        setAiAnalysis("Could not load customized AI analysis. Try practicing in standard mode to build your skills!");
      } finally {
        setLoadingAnalysis(false);
      }
    }

    fetchAiAnalysis();
  }, [activeTab, data]);

  if (loading) {
    return <div style={{textAlign: 'center', padding: '100px'}}><i className="fa-solid fa-spinner fa-spin fa-3x" style={{color: 'var(--primary)'}}></i></div>;
  }

  const preCompleted = data?.pre_assessment?.completed;
  const postCompleted = data?.post_assessment?.completed;

  if (!data || (!preCompleted && !postCompleted)) {
    return (
      <div className="container" style={{textAlign: 'center', padding: '50px'}}>
        <h2 style={{color: 'var(--warn-text)'}}>Assessment Results Not Available Yet</h2>
        <p style={{color: 'var(--muted)', marginTop: '10px'}}>Please complete your Pre-Assessment first!</p>
        <Link href="/dashboard" className="btn btn-primary" style={{marginTop: '20px'}}>Back to Student Hub</Link>
      </div>
    );
  }

  const { target_topics = [], pre_assessment, post_assessment } = data;

  const calculateTotal = (scoreObj) => {
    if (!scoreObj) return { correct: 0, total: 0 };
    let correct = 0;
    let total = 0;
    Object.values(scoreObj).forEach(t => {
      correct += t.correct || 0;
      total += t.total || 0;
    });
    return { correct, total };
  };

  const preTotal = calculateTotal(pre_assessment?.score);
  const postTotal = calculateTotal(post_assessment?.score);

  const handleRequestAiHelp = async (question, topic) => {
    const qId = question.question_id;
    setPenalizing(prev => ({ ...prev, [qId]: true }));
    
    try {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/tutor/penalize-mastery', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userHeader
        },
        body: JSON.stringify({ topic, question_id: qId })
      });

      if (res.ok) {
        setSelectedIntervention({
          type: 'ai_intervention',
          difficulty: question.difficulty || 'medium',
          topic,
          question_id: qId,
          question_text: question.content,
          correct_answer: question.correct_answer,
          options: question.options || []
        });
      }
    } catch (err) {
      console.error('Failed to deduct BKT mastery for help request', err);
    } finally {
      setPenalizing(prev => ({ ...prev, [qId]: false }));
    }
  };

  const currentAssessment = activeTab === 'pre' ? pre_assessment : post_assessment;
  const currentTotal = activeTab === 'pre' ? preTotal : postTotal;

  // DYNAMIC RETROACTIVE QUESTION RECONSTRUCTION (If they completed assessment before the logging feature)
  const getDisplayResponses = () => {
    if (currentAssessment?.responses && currentAssessment.responses.length > 0) {
      return currentAssessment.responses;
    }

    // Reconstruct list based on score by topic
    const reconstructed = [];
    const scores = currentAssessment?.score || {};

    target_topics.forEach(topic => {
      const topicScore = scores[topic] || { correct: 0, total: 5 };
      const correctCount = topicScore.correct || 0;
      const totalCount = topicScore.total || 5;

      const pool = MOCK_QUESTIONS_BY_TOPIC[topic] || [];
      pool.forEach((q, idx) => {
        if (idx >= totalCount) return;

        const isCorrect = idx < correctCount;
        const studentAns = isCorrect 
          ? q.correct_answer 
          : q.options.find(o => o !== q.correct_answer) || 'None';

        reconstructed.push({
          question_id: q.question_id,
          content: q.content,
          options: q.options,
          student_answer: studentAns,
          correct_answer: q.correct_answer,
          is_correct: isCorrect,
          subject: topic,
          difficulty: 'medium'
        });
      });
    });

    return reconstructed;
  };

  const displayResponses = getDisplayResponses();

  return (
    <div className="container">
      {selectedIntervention ? (
        <div style={{ marginTop: '20px' }}>
          <AiInterventionScreen 
            topic={selectedIntervention.topic} 
            currentAction={selectedIntervention} 
            onDismiss={() => setSelectedIntervention(null)} 
            isAssessment={true}
          />
        </div>
      ) : (
        <>
          <header className="page-header" style={{textAlign: 'center'}}>
            <h1 className="title">Personalized Assessment Insights</h1>
            <p className="subtitle">Drill down into your pre and post assessment performance & learn from your struggles!</p>
          </header>

          <main>
            {/* Quick Assessment Metrics Grid */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div 
                className={`card ${activeTab === 'pre' ? 'selected-card' : ''}`} 
                style={{ 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  border: activeTab === 'pre' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: activeTab === 'pre' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                }}
                onClick={() => setActiveTab('pre')}
              >
                <h3 style={{ margin: 0, color: 'var(--muted)' }}>Pre-Assessment</h3>
                {preCompleted ? (
                  <>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '15px 0', color: 'var(--warn-text)' }}>
                      {Math.round((preTotal.correct / Math.max(preTotal.total, 1)) * 100)}%
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{preTotal.correct} / {preTotal.total} Correct</p>
                  </>
                ) : (
                  <p style={{ color: 'var(--muted)', marginTop: '20px' }}>Not taken yet</p>
                )}
              </div>

              <div 
                className={`card ${activeTab === 'post' ? 'selected-card' : ''}`} 
                style={{ 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  border: activeTab === 'post' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: activeTab === 'post' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                }}
                onClick={() => setActiveTab('post')}
              >
                <h3 style={{ margin: 0, color: 'var(--muted)' }}>Post-Assessment</h3>
                {postCompleted ? (
                  <>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '15px 0', color: '#2ed573' }}>
                      {Math.round((postTotal.correct / Math.max(postTotal.total, 1)) * 100)}%
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{postTotal.correct} / {postTotal.total} Correct</p>
                  </>
                ) : (
                  <p style={{ color: 'var(--muted)', marginTop: '20px' }}>Not taken yet</p>
                )}
              </div>
            </div>

            {/* Personalized AI Tutor Commentary Box powered by Gemini */}
            <div className="card fade-enter-active" style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              marginBottom: '30px',
              padding: '25px'
            }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px', color: 'var(--primary)' }}>
                <i className="fa-solid fa-wand-magic-sparkles"></i> AI Tutor Mathematical Critique & Study Plan
              </h2>
              {loadingAnalysis ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
                  <i className="fa-solid fa-spinner fa-spin"></i> Generating personalized review...
                </div>
              ) : (
                <p style={{ color: '#d1d5db', lineHeight: 1.6, margin: 0, fontSize: '1.02rem', whiteSpace: 'pre-wrap' }}>
                  {aiAnalysis}
                </p>
              )}
            </div>

            {/* Detailed Question Review List */}
            <div className="card" style={{ padding: '25px' }}>
              <h2 className="section-title" style={{ marginBottom: '20px' }}>
                <i className="fa-solid fa-list-check" style={{ marginRight: '8px' }}></i> 
                {activeTab === 'pre' ? 'Pre-Assessment' : 'Post-Assessment'} Questions Breakdown
              </h2>

              {displayResponses.length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '30px' }}>
                  Detailed question history not available.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {displayResponses.map((resp, i) => (
                    <div key={i} style={{
                      border: resp.is_correct ? '1px solid rgba(46, 213, 115, 0.15)' : '1px solid rgba(255, 71, 87, 0.15)',
                      borderRadius: '12px',
                      background: resp.is_correct ? 'rgba(46, 213, 115, 0.02)' : 'rgba(255, 71, 87, 0.02)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 600, 
                          textTransform: 'uppercase', 
                          color: resp.is_correct ? '#2ed573' : '#ff4757',
                          background: resp.is_correct ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          {resp.is_correct ? 'Correct' : 'Struggled'}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                          Topic: <strong>{resp.subject}</strong>
                        </span>
                      </div>

                      <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0, color: '#f3f4f6' }}>
                        <MathText content={resp.content} />
                      </p>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {resp.options?.map(opt => (
                          <span key={opt} style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: opt === resp.correct_answer ? 'rgba(46, 213, 115, 0.15)' : opt === resp.student_answer ? 'rgba(255, 71, 87, 0.15)' : 'rgba(255,255,255,0.03)',
                            border: opt === resp.correct_answer ? '1px solid rgba(46, 213, 115, 0.3)' : opt === resp.student_answer ? '1px solid rgba(255, 71, 87, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                            color: opt === resp.correct_answer ? '#2ed573' : opt === resp.student_answer ? '#ff4757' : 'var(--muted)',
                            fontSize: '0.85rem'
                          }}>
                            <MathText content={opt} />
                          </span>
                        ))}
                      </div>

                      {!resp.is_correct && (
                        <div style={{ 
                          marginTop: '10px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <div style={{ color: 'var(--muted)', fontSize: '0.82rem', maxWidth: '60%' }}>
                            <i className="fa-solid fa-circle-info" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
                            Want to understand your mistake? Let the AI Tutor teach you this concept step-by-step!
                          </div>
                          <button
                            className="btn"
                            disabled={penalizing[resp.question_id]}
                            onClick={() => handleRequestAiHelp(resp, resp.subject)}
                            style={{
                              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                              border: 'none',
                              color: '#fff',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {penalizing[resp.question_id] ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fa-solid fa-wand-magic-sparkles"></i>
                            )}
                            Teach Me!
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{textAlign: 'center', marginTop: '40px'}}>
              <Link href="/dashboard" className="btn btn-primary" style={{fontSize: '1.1rem', padding: '14px 35px'}}>
                <i className="fa-solid fa-house"></i> Return to Student Hub
              </Link>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
