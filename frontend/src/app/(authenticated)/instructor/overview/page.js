'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InstructorOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/instructor/overview');
      if (res.ok) {
        setData(await res.json());
      }
    }
    fetchData();
  }, []);

  if (!data) return <div className="container">Loading active class metrics...</div>;

  return (
    <div className="container" style={{maxWidth: '1200px'}}>
      <header className="page-header">
        <h1 className="title">Class Overview</h1>
        <p className="subtitle">High-level insights into your student body.</p>
      </header>

      <div className="grid" style={{marginBottom: '30px'}}>
        <div className="card" style={{textAlign: 'center', padding: '24px'}}>
          <h3 style={{color: 'var(--muted)', margin: '0 0 10px'}}>Total Students Enrolled</h3>
          <p style={{fontSize: '3rem', fontWeight: 700, margin: 0, color: 'var(--primary)'}}>{data.total_students}</p>
        </div>
        <div className="card" style={{textAlign: 'center', padding: '24px'}}>
          <h3 style={{color: 'var(--muted)', margin: '0 0 10px'}}>Active in Fractions</h3>
          <p style={{fontSize: '3rem', fontWeight: 700, margin: 0, color: '#38bdf8'}}>{data.fractions_active}</p>
        </div>
        <div className="card" style={{textAlign: 'center', padding: '24px'}}>
          <h3 style={{color: 'var(--muted)', margin: '0 0 10px'}}>Active in Algebra</h3>
          <p style={{fontSize: '3rem', fontWeight: 700, margin: 0, color: '#4ade80'}}>{data.algebra_active}</p>
        </div>
        <div className="card" style={{textAlign: 'center', padding: '24px'}}>
          <h3 style={{color: 'var(--muted)', margin: '0 0 10px'}}>Active in Exponents</h3>
          <p style={{fontSize: '3rem', fontWeight: 700, margin: 0, color: '#ec4899'}}>{data.exponents_active}</p>
        </div>
        <div className="card" style={{textAlign: 'center', padding: '24px'}}>
          <h3 style={{color: 'var(--muted)', margin: '0 0 10px'}}>Active in Geometry</h3>
          <p style={{fontSize: '3rem', fontWeight: 700, margin: 0, color: '#22c55e'}}>{data.geometry_active}</p>
        </div>
      </div>

      <h2 className="section-title">At-Risk Intervention Needed</h2>
      <p className="section-note">These students have seen multiple questions but have Mastery levels dangerously low (&lt;0.40).</p>

      {data.at_risk.length === 0 ? (
        <div className="card" style={{textAlign: 'center', padding: '40px'}}>
          <i className="fa-solid fa-face-smile-beam" style={{fontSize: '3rem', color: 'var(--success-text)', marginBottom: '16px'}}></i>
          <h3>All clear!</h3>
          <p style={{color: 'var(--muted)'}}>No students are currently falling behind.</p>
        </div>
      ) : (
        <div className="grid">
          {data.at_risk.map((stu, i) => (
            <div key={i} className="card" style={{borderLeft: '4px solid var(--warn-text)'}}>
              <h3 style={{margin: '0 0 8px'}}>{stu.username}</h3>
              <p style={{margin: 0, color: 'var(--muted)'}}>
                Topic: <strong style={{color: '#fff'}}>{stu.topic}</strong>
              </p>
              <p style={{margin: '8px 0 0', color: 'var(--warn-text)', fontWeight: 600}}>
                Current Mastery: {stu.belief}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
