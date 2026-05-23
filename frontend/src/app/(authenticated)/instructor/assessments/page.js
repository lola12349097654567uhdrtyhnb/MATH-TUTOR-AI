'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InstructorAssessments() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    async function fetchData() {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/instructor/assessments', {
        headers: { 'x-user-id': userHeader }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="container">Loading assessment data...</div>;

  const feedbacks = results.filter(r => r.evaluation_questionnaire);

  // Calculate aggregates
  const avgSatisfaction = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.evaluation_questionnaire.satisfaction, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  const q1YesRate = feedbacks.length > 0
    ? Math.round((feedbacks.filter(f => f.evaluation_questionnaire.q1_ai_helpful === 'Yes').length / feedbacks.length) * 100)
    : 0;

  const q2YesRate = feedbacks.length > 0
    ? Math.round((feedbacks.filter(f => f.evaluation_questionnaire.q2_difficulty_appropriate === 'Yes').length / feedbacks.length) * 100)
    : 0;

  const q3YesRate = feedbacks.length > 0
    ? Math.round((feedbacks.filter(f => f.evaluation_questionnaire.q3_recommend === 'Yes').length / feedbacks.length) * 100)
    : 0;

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="title">Assessment & Feedback Portal</h1>
        <p className="subtitle">Track pre/post test gains alongside student satisfaction and qualitative reviews.</p>
      </header>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveTab('performance')}
          style={{
            padding: '12px 24px',
            border: 'none',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'performance' ? '#a855f7' : '#9ca3af',
            borderBottom: activeTab === 'performance' ? '2px solid #a855f7' : '2px solid transparent',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          <i className="fa-solid fa-chart-simple" style={{ marginRight: '8px' }}></i> Assessment Performance
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          style={{
            padding: '12px 24px',
            border: 'none',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            background: 'transparent',
            color: activeTab === 'feedback' ? '#a855f7' : '#9ca3af',
            borderBottom: activeTab === 'feedback' ? '2px solid #a855f7' : '2px solid transparent',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          <i className="fa-solid fa-comments" style={{ marginRight: '8px' }}></i> Student Feedbacks ({feedbacks.length})
        </button>
      </div>

      {activeTab === 'performance' ? (
        <div className="card" style={{padding: '0', overflow: 'hidden'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead style={{background: 'var(--highlight)', borderBottom: '1px solid var(--border)'}}>
              <tr>
                <th style={{padding: '16px 24px'}}>Student</th>
                <th style={{padding: '16px 24px'}}>Pre-Test</th>
                <th style={{padding: '16px 24px'}}>Post-Test</th>
                <th style={{padding: '16px 24px'}}>Improvement (Delta)</th>
                <th style={{padding: '16px 24px'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, i) => (
                <tr key={i} style={{borderBottom: '1px solid var(--border)'}}>
                  <td style={{padding: '16px 24px', fontWeight: 600}}>
                    <Link href={`/instructor/student-detail?student=${res.username}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-chart-line" style={{ fontSize: '0.9rem', opacity: 0.8 }}></i>
                      {res.username}
                    </Link>
                  </td>
                  <td style={{padding: '16px 24px'}}>
                    {res.pre_completed ? `${res.pre_score}%` : <span style={{color: 'var(--muted)'}}>Not Started</span>}
                  </td>
                  <td style={{padding: '16px 24px'}}>
                    {res.post_completed ? `${res.post_score}%` : <span style={{color: 'var(--muted)'}}>{res.pre_completed ? 'In Progress' : 'Pending'}</span>}
                  </td>
                  <td style={{padding: '16px 24px'}}>
                    {res.delta !== null ? (
                      <span style={{
                        fontWeight: 700, 
                        color: res.delta >= 0 ? 'var(--success-text)' : 'var(--warn-text)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <i className={`fa-solid ${res.delta >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                        {res.delta > 0 ? `+${res.delta}` : res.delta}%
                      </span>
                    ) : '--'}
                  </td>
                  <td style={{padding: '16px 24px'}}>
                    {res.delta !== null ? (
                      res.delta > 0 ? (
                        <span className="status success show" style={{display: 'inline-block', margin: 0, padding: '4px 12px'}}>Improved!</span>
                      ) : res.delta === 0 ? (
                        <span className="status show" style={{display: 'inline-block', margin: 0, padding: '4px 12px', background: 'var(--highlight)', color: 'var(--text)'}}>No Change</span>
                      ) : (
                        <span className="status warn show" style={{display: 'inline-block', margin: 0, padding: '4px 12px'}}>Needs Review</span>
                      )
                    ) : (
                      <span style={{color: 'var(--muted)', fontSize: '0.9rem'}}>Pending Completion</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          {feedbacks.length === 0 ? (
            <div className="card" style={{textAlign: 'center', padding: '60px'}}>
              <i className="fa-solid fa-comments-dashed" style={{fontSize: '3rem', color: 'var(--muted)', marginBottom: '16px'}}></i>
              <h3>No submitted questionnaire feedback yet</h3>
              <p style={{color: 'var(--muted)'}}>Once students complete their post-assessment and submit evaluations, they will appear here.</p>
            </div>
          ) : (
            <>
              {/* Aggregates Dashboard */}
              <div className="grid" style={{marginBottom: '30px'}}>
                <div className="card" style={{textAlign: 'center', padding: '20px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.15)'}}>
                  <h3 style={{color: 'var(--muted)', margin: '0 0 8px', fontSize: '0.95rem'}}>Class Satisfaction</h3>
                  <p style={{fontSize: '2.5rem', fontWeight: 700, margin: '0 0 4px', color: '#a855f7'}}>{avgSatisfaction} <span style={{fontSize: '1.2rem', color: 'var(--muted)'}}>/ 5</span></p>
                  <div style={{color: '#a855f7', fontSize: '1rem'}}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`fa-${Math.round(Number(avgSatisfaction)) > i ? 'solid' : 'regular'} fa-star`} style={{marginRight: '2px'}}></i>
                    ))}
                  </div>
                </div>
                <div className="card" style={{textAlign: 'center', padding: '20px'}}>
                  <h3 style={{color: 'var(--muted)', margin: '0 0 8px', fontSize: '0.95rem'}}>AI Helpful Rate</h3>
                  <p style={{fontSize: '2.5rem', fontWeight: 700, margin: '0 0 4px', color: '#10b981'}}>{q1YesRate}%</p>
                  <p style={{color: 'var(--muted)', fontSize: '0.8rem', margin: 0}}>of students selected "Yes"</p>
                </div>
                <div className="card" style={{textAlign: 'center', padding: '20px'}}>
                  <h3 style={{color: 'var(--muted)', margin: '0 0 8px', fontSize: '0.95rem'}}>Appropriate Pace</h3>
                  <p style={{fontSize: '2.5rem', fontWeight: 700, margin: '0 0 4px', color: '#38bdf8'}}>{q2YesRate}%</p>
                  <p style={{color: 'var(--muted)', fontSize: '0.8rem', margin: 0}}>of students selected "Yes"</p>
                </div>
                <div className="card" style={{textAlign: 'center', padding: '20px'}}>
                  <h3 style={{color: 'var(--muted)', margin: '0 0 8px', fontSize: '0.95rem'}}>Recommendation Rate</h3>
                  <p style={{fontSize: '2.5rem', fontWeight: 700, margin: '0 0 4px', color: '#ec4899'}}>{q3YesRate}%</p>
                  <p style={{color: 'var(--muted)', fontSize: '0.8rem', margin: 0}}>would recommend the site</p>
                </div>
              </div>

              {/* Feed of Cards */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {feedbacks.map((res, i) => (
                  <div key={i} className="card card-hoverable" style={{
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(20, 24, 45, 0.4)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2.2rem' }}>
                          {res.evaluation_questionnaire.satisfaction === 5 ? '😍' :
                           res.evaluation_questionnaire.satisfaction === 4 ? '🙂' :
                           res.evaluation_questionnaire.satisfaction === 3 ? '😐' :
                           res.evaluation_questionnaire.satisfaction === 2 ? '🙁' : '😠'}
                        </span>
                        <div>
                          <Link href={`/instructor/student-detail?student=${res.username}`} style={{ fontSize: '1.15rem', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-user-circle" style={{opacity: 0.8}}></i>
                            {res.username}
                          </Link>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                            Pre: {res.pre_score !== null ? `${res.pre_score}%` : '--'} | Post: {res.post_score !== null ? `${res.post_score}%` : '--'} ({res.delta !== null ? (res.delta >= 0 ? `+${res.delta}` : res.delta) : '0'}% gain)
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', background: res.evaluation_questionnaire.q1_ai_helpful === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: res.evaluation_questionnaire.q1_ai_helpful === 'Yes' ? '#34d399' : '#f87171' }}>
                          AI Helpful: {res.evaluation_questionnaire.q1_ai_helpful}
                        </span>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', background: res.evaluation_questionnaire.q2_difficulty_appropriate === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: res.evaluation_questionnaire.q2_difficulty_appropriate === 'Yes' ? '#34d399' : '#f87171' }}>
                          Difficulty OK: {res.evaluation_questionnaire.q2_difficulty_appropriate}
                        </span>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', background: res.evaluation_questionnaire.q3_recommend === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: res.evaluation_questionnaire.q3_recommend === 'Yes' ? '#34d399' : '#f87171' }}>
                          Recommend: {res.evaluation_questionnaire.q3_recommend}
                        </span>
                      </div>
                    </div>
                    {res.evaluation_questionnaire.feedback_text ? (
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
                        "{res.evaluation_questionnaire.feedback_text}"
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No written suggestions provided.</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
