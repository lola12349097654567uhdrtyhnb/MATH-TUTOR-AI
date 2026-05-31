'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ResearchConsole() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [selectedCohortFilter, setSelectedCohortFilter] = useState('all'); // 'all', 'A', 'B', 'unassigned'

  async function loadData() {
    try {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/instructor/research-exporter', {
        headers: { 'x-user-id': userHeader }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load thesis data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignCohort = async (username, cohort) => {
    setUpdatingUser(username);
    try {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/instructor/research-exporter', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userHeader
        },
        body: JSON.stringify({ username, cohort })
      });
      if (res.ok) {
        // Reload data to calculate updated summaries
        await loadData();
      }
    } catch (err) {
      console.error('Failed to update student cohort', err);
    } finally {
      setUpdatingUser(null);
    }
  };

  const exportThesisCSV = () => {
    if (!data || !data.students) return;

    const headers = [
      'Student Name',
      'Grade',
      'Cohort Group',
      'Pre-Assessment Score (%)',
      'Post-Assessment Score (%)',
      'Conceptual Learning Gain (Δ %)',
      'Avg Response Latency (seconds)',
      'Cognitive Struggles (Attempts >= 3)',
      'Questions (Easy)',
      'Questions (Medium)',
      'Questions (Hard)',
      'Questions (Master)',
      'AI Scaffold Triggers',
      'Post-Intervention Success Rate (%)'
    ];

    const rows = data.students.map(s => [
      s.username,
      s.grade,
      s.cohort === 'A' ? 'Cohort A (Supervised)' : (s.cohort === 'B' ? 'Cohort B (Remote)' : 'Unassigned'),
      s.pre_score !== null ? s.pre_score : 'N/A',
      s.post_score !== null ? s.post_score : 'N/A',
      s.learning_gain !== null ? s.learning_gain : 'N/A',
      s.avg_latency_sec !== null ? s.avg_latency_sec : 'N/A',
      s.struggle_frequency,
      s.difficulty_trajectory.easy,
      s.difficulty_trajectory.medium,
      s.difficulty_trajectory.hard,
      s.difficulty_trajectory.master,
      s.scaffold_count,
      s.post_intervention_success_rate !== null ? `${s.post_intervention_success_rate}%` : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `thesis_empirical_data_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{textAlign: 'center', padding: '100px'}}><i className="fa-solid fa-spinner fa-spin fa-3x" style={{color: 'var(--primary)'}}></i></div>;
  }

  const studentsList = data?.students || [];
  
  // Filter students display
  const filteredStudents = studentsList.filter(s => {
    if (selectedCohortFilter === 'all') return true;
    if (selectedCohortFilter === 'A') return s.cohort === 'A';
    if (selectedCohortFilter === 'B') return s.cohort === 'B';
    return s.cohort === '';
  });

  const cohortA = data?.cohort_summary?.A || { size: 0, avg_pre: 0, avg_post: 0, avg_gain: 0, total_ai_scaffolds: 0, avg_ai_success_rate: 0 };
  const cohortB = data?.cohort_summary?.B || { size: 0, avg_pre: 0, avg_post: 0, avg_gain: 0, total_ai_scaffolds: 0, avg_ai_success_rate: 0 };

  return (
    <div className="container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="title">Thesis Telemetry & Empirical Exporter</h1>
          <p className="subtitle">Extract precise conceptual gains, cognitive struggles, and GenAI walkthrough efficiency metrics for your results chapter.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={exportThesisCSV}>
            <i className="fa-solid fa-download"></i> Export Thesis Dataset (.CSV)
          </button>
          <Link href="/instructor/overview" className="btn btn-secondary">
            Back to Overview
          </Link>
        </div>
      </header>

      {/* Cohort Comparison Overview Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '30px' }} className="responsive-column-grid">
        {/* Cohort A Card */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(20, 24, 45, 0.45))',
          border: '1.5px solid rgba(139, 92, 246, 0.3)',
          padding: '24px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>CONTROL group</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                {cohortA.size} Active Students
              </span>
            </div>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.4rem', color: '#fff' }}>Cohort A: Supervised (In-Class)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '15px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Avg Pre-Score</span>
                <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{cohortA.avg_pre}%</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Avg Post-Score</span>
                <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{cohortA.avg_post}%</strong>
              </div>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Learning Gain (Δ)</span>
                <strong style={{ fontSize: '1.25rem', color: '#a78bfa' }}>+{cohortA.avg_gain}%</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>Total AI Walkthroughs: <strong style={{ color: '#fff' }}>{cohortA.total_ai_scaffolds}</strong></div>
            <div>Post-Walkthrough Success: <strong style={{ color: '#10b981' }}>{cohortA.avg_ai_success_rate}%</strong></div>
          </div>
        </div>

        {/* Cohort B Card */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(20, 24, 45, 0.45))',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          padding: '24px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>EXPERIMENTAL group</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                {cohortB.size} Active Students
              </span>
            </div>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.4rem', color: '#fff' }}>Cohort B: Remote (Self-Paced)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '15px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Avg Pre-Score</span>
                <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{cohortB.avg_pre}%</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Avg Post-Score</span>
                <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{cohortB.avg_post}%</strong>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Learning Gain (Δ)</span>
                <strong style={{ fontSize: '1.25rem', color: '#38bdf8' }}>+{cohortB.avg_gain}%</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>Total AI Walkthroughs: <strong style={{ color: '#fff' }}>{cohortB.total_ai_scaffolds}</strong></div>
            <div>Post-Walkthrough Success: <strong style={{ color: '#10b981' }}>{cohortB.avg_ai_success_rate}%</strong></div>
          </div>
        </div>
      </div>

      {/* Cohort Assignment Table Console */}
      <div className="card" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-folder-tree" style={{ color: 'var(--primary)' }}></i> Empirical Telemetry Dataset
            </h2>
            <p className="section-note" style={{ margin: 0 }}>Assign students to cohorts dynamically to immediately updates standard research deviations.</p>
          </div>

          {/* Table Group Cohort filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'A', 'B', 'unassigned'].map(group => (
              <button 
                key={group}
                onClick={() => setSelectedCohortFilter(group)}
                className={`btn ${selectedCohortFilter === group ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '0.8rem', 
                  borderRadius: '8px', 
                  textTransform: 'capitalize',
                  border: selectedCohortFilter === group ? '1px solid var(--primary)' : '1px solid var(--border)' 
                }}
              >
                {group === 'all' ? 'All Groups' : (group === 'unassigned' ? 'Unassigned' : `Cohort ${group}`)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text)' }}>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700' }}>STUDENT NAME</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>COHORT GROUP</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>PRE (%)</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>POST (%)</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>GAIN (Δ %)</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>LATENCY</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>STRUGGLES</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>AI WALKTHROUGHS</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>AI SUCCESS</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>POMDP TRAJECTORY</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    No students matching this cohort group filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'all 0.15s' }}>
                    {/* Username */}
                    <td style={{ padding: '14px 8px', fontWeight: '700', color: '#fff' }}>
                      {stu.username}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 'normal' }}>Grade {stu.grade}</span>
                    </td>
                    
                    {/* Cohort Selector Segmented Controls */}
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      {updatingUser === stu.username ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}><i className="fa-solid fa-spinner fa-spin"></i> Saving...</span>
                      ) : (
                        <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <button
                            onClick={() => handleAssignCohort(stu.username, 'A')}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: stu.cohort === 'A' ? 'var(--primary)' : 'transparent',
                              color: stu.cohort === 'A' ? '#fff' : 'var(--muted)',
                              fontWeight: stu.cohort === 'A' ? 'bold' : 'normal',
                              transition: 'all 0.15s'
                            }}
                          >
                            Cohort A
                          </button>
                          <button
                            onClick={() => handleAssignCohort(stu.username, 'B')}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: stu.cohort === 'B' ? '#38bdf8' : 'transparent',
                              color: stu.cohort === 'B' ? '#fff' : 'var(--muted)',
                              fontWeight: stu.cohort === 'B' ? 'bold' : 'normal',
                              transition: 'all 0.15s'
                            }}
                          >
                            Cohort B
                          </button>
                          <button
                            onClick={() => handleAssignCohort(stu.username, '')}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: stu.cohort === '' ? 'rgba(255,255,255,0.06)' : 'transparent',
                              color: stu.cohort === '' ? '#fff' : 'var(--muted)',
                              transition: 'all 0.15s'
                            }}
                          >
                            Unassign
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Pre-Assessment Score */}
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--muted)' }}>
                      {stu.pre_score !== null ? `${stu.pre_score}%` : 'N/A'}
                    </td>

                    {/* Post-Assessment Score */}
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: '#fff', fontWeight: '600' }}>
                      {stu.post_score !== null ? `${stu.post_score}%` : 'Pending'}
                    </td>

                    {/* Conceptual Gain */}
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {stu.learning_gain !== null ? (
                        <span style={{ color: stu.learning_gain >= 0 ? '#10b981' : '#ef4444' }}>
                          {stu.learning_gain >= 0 ? `+${stu.learning_gain}%` : `${stu.learning_gain}%`}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>N/A</span>
                      )}
                    </td>

                    {/* Response Latency */}
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: '#38bdf8' }}>
                      {stu.avg_latency_sec !== null ? `${stu.avg_latency_sec}s` : 'N/A'}
                    </td>

                    {/* Struggle Frequency */}
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: stu.struggle_frequency >= 3 ? '#fbbf24' : 'var(--muted)' }}>
                      {stu.struggle_frequency} struggles
                    </td>

                    {/* AI Scaffold Trigger Count */}
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: '#c084fc' }}>
                      {stu.scaffold_count} triggered
                    </td>

                    {/* AI Intervention Success Rate */}
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600' }}>
                      {stu.post_intervention_success_rate !== null ? (
                        <span style={{ color: stu.post_intervention_success_rate >= 80 ? '#10b981' : (stu.post_intervention_success_rate >= 50 ? '#fbbf24' : '#ef4444') }}>
                          {stu.post_intervention_success_rate}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>N/A</span>
                      )}
                    </td>

                    {/* POMDP Trajectory Bar */}
                    <td style={{ padding: '14px 8px', width: '220px' }}>
                      <div style={{ display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.12)', padding: '4px', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--muted)' }}>
                        <span style={{ flex: stu.difficulty_trajectory.easy || 1, background: '#4b5563', padding: '2px', textAlign: 'center', borderRadius: '4px', color: '#fff' }} title={`Easy: ${stu.difficulty_trajectory.easy}`}>
                          E:{stu.difficulty_trajectory.easy}
                        </span>
                        <span style={{ flex: stu.difficulty_trajectory.medium || 1, background: '#3b82f6', padding: '2px', textAlign: 'center', borderRadius: '4px', color: '#fff' }} title={`Medium: ${stu.difficulty_trajectory.medium}`}>
                          M:{stu.difficulty_trajectory.medium}
                        </span>
                        <span style={{ flex: stu.difficulty_trajectory.hard || 1, background: '#8b5cf6', padding: '2px', textAlign: 'center', borderRadius: '4px', color: '#fff' }} title={`Hard: ${stu.difficulty_trajectory.hard}`}>
                          H:{stu.difficulty_trajectory.hard}
                        </span>
                        <span style={{ flex: stu.difficulty_trajectory.master || 1, background: '#10b981', padding: '2px', textAlign: 'center', borderRadius: '4px', color: '#fff' }} title={`Master: ${stu.difficulty_trajectory.master}`}>
                          Ma:{stu.difficulty_trajectory.master}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LaTeX Thesis References */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(20, 24, 45, 0.65), rgba(13, 17, 33, 0.85))', 
        border: '1px solid rgba(139, 92, 246, 0.25)', 
        padding: '30px', 
        borderRadius: '24px'
      }}>
        <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px', color: 'var(--primary)' }}>
          <i className="fa-solid fa-scroll"></i> Empirical Validity Methods for Thesis Writing
        </h2>
        <p style={{ color: '#d1d5db', fontSize: '0.96rem', lineHeight: '1.6', margin: '0 0 16px' }}>
          Your university thesis examiners will look for statistical rigor in how you group your controlled classes (Cohort A) and experimental classes (Cohort B). Use the following drafting layouts directly:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="responsive-column-grid">
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '0.96rem', fontWeight: '700' }}>Thesis Formula: H1 Cognitive Scaffold Efficiency</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.4' }}>
              To prove that generative AI anxiety reduction succeeds under the BKT-POMDP engine, you can write:
              <br />
              <code style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '10px 14px', 
                borderRadius: '8px', 
                fontSize: '0.76rem', 
                display: 'block', 
                margin: '8px 0', 
                color: 'var(--primary)', 
                fontFamily: 'monospace', 
                lineHeight: '1.3',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {"\\text{Scaffold Success Rate} = \\frac{\\sum \\text{Success}_{Post-Intervention}}{\\sum \\text{Interventions}_{Total}} \\times 100"}
              </code>
              This measures the immediate state transfer efficiency from struggle state back to correct action, demonstrating empirical validity.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '0.96rem', fontWeight: '700' }}>T-Test Formula: Learning Gains comparison (A vs B)</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.4' }}>
              Run an independent two-sample t-test using the **Export Thesis Dataset (.CSV)** raw file on Cohort A and Cohort B conceptual learning gains:
              <br />
              <code style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '10px 14px', 
                borderRadius: '8px', 
                fontSize: '0.76rem', 
                display: 'block', 
                margin: '8px 0', 
                color: '#38bdf8', 
                fontFamily: 'monospace', 
                lineHeight: '1.3',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {"t = \\frac{\\bar{X}_B - \\bar{X}_A}{\\sqrt{ \\frac{s_B^2}{n_B} + \\frac{s_A^2}{n_A} }}"}
              </code>
              This mathematically determines if the platform environment (supervised vs self-paced remote) yielded statistical equivalence or differences in pedagogical gains.
            </p>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @media (max-width: 1100px) {
          .responsive-column-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
