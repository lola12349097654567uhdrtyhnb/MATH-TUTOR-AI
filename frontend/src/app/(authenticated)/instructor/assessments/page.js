'use client';

import { useState, useEffect } from 'react';

export default function InstructorAssessments() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/instructor/assessments');
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="container">Loading assessment data...</div>;

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="title">Assessment Performance</h1>
        <p className="subtitle">Comparing Pre-test vs Post-test results across the class.</p>
      </header>

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
                <td style={{padding: '16px 24px', fontWeight: 600}}>{res.username}</td>
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
    </div>
  );
}
