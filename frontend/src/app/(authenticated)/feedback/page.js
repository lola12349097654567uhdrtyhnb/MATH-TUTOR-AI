'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FeedbackHub() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/student/feedback');
      if (res.ok) {
        setData(await res.json());
      }
    }
    fetchData();
  }, []);

  if (!data) return <div className="container">Loading Analytics...</div>;

  return (
    <div className="container" style={{maxWidth: '1000px', margin: '0 auto'}}>
      <header className="page-header">
        <h1 className="title">Feedback & Activity</h1>
        <p className="subtitle">Track your recent engagement across your AI tutoring topics.</p>
      </header>

      <div className="grid">
        <section className="card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{background: 'rgba(56, 189, 248, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <i className="fa-solid fa-shapes" style={{color: '#38bdf8', fontSize: '1.4rem'}}></i>
              </div>
              <h2 className="section-title" style={{margin: 0}}>Fractions Unit</h2>
            </div>
            {data.topics.fractions.topicGraduated && (
              <span style={{background: 'rgba(67, 181, 129, 0.15)', color: 'var(--success-text)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}><i className="fa-solid fa-trophy" style={{marginRight: '6px'}}></i>Mastery Achieved</span>
            )}
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Last Practiced</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.fractions.lastVisited}</strong>
            </div>

            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Activity Volume</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.fractions.questionsSeen} specific questions seen</strong>
            </div>

            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Diagnostic Setup</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.fractions.diagnosticCompleted ? "Baseline Established" : "Pending Evaluation"}</strong>
            </div>
          </div>
          
          <div className="actions" style={{marginTop: '20px'}}>
            <Link className="btn btn-secondary" href="/tutor?topic=fractions" style={{width: '100%', justifyContent: 'center'}}>Resume Practicing</Link>
          </div>
        </section>

        <section className="card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{background: 'rgba(139, 92, 246, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <i className="fa-solid fa-square-root-variable" style={{color: '#8b5cf6', fontSize: '1.4rem'}}></i>
              </div>
              <h2 className="section-title" style={{margin: 0}}>Algebraic Equations</h2>
            </div>
            {data.topics.algebra.topicGraduated && (
              <span style={{background: 'rgba(67, 181, 129, 0.15)', color: 'var(--success-text)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}><i className="fa-solid fa-trophy" style={{marginRight: '6px'}}></i>Mastery Achieved</span>
            )}
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Last Practiced</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.algebra.lastVisited}</strong>
            </div>

            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Activity Volume</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.algebra.questionsSeen} specific questions seen</strong>
            </div>

            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Diagnostic Setup</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.algebra.diagnosticCompleted ? "Baseline Established" : "Pending Evaluation"}</strong>
            </div>
          </div>

          <div className="actions" style={{marginTop: '20px'}}>
            <Link className="btn btn-secondary" href="/tutor?topic=algebra" style={{width: '100%', justifyContent: 'center'}}>Resume Practicing</Link>
          </div>
        </section>

        <section className="card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{background: 'rgba(236, 72, 153, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <i className="fa-solid fa-superscript" style={{color: '#ec4899', fontSize: '1.4rem'}}></i>
              </div>
              <h2 className="section-title" style={{margin: 0}}>Exponents & Scientific</h2>
            </div>
            {data.topics.exponents.topicGraduated && (
              <span style={{background: 'rgba(67, 181, 129, 0.15)', color: 'var(--success-text)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}><i className="fa-solid fa-trophy" style={{marginRight: '6px'}}></i>Mastery Achieved</span>
            )}
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Last Practiced</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.exponents.lastVisited}</strong>
            </div>

            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Activity Volume</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.exponents.questionsSeen} specific questions seen</strong>
            </div>

            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Diagnostic Setup</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.exponents.diagnosticCompleted ? "Baseline Established" : "Pending Evaluation"}</strong>
            </div>
          </div>

          <div className="actions" style={{marginTop: '20px'}}>
            <Link className="btn btn-secondary" href="/tutor?topic=exponents" style={{width: '100%', justifyContent: 'center'}}>Resume Practicing</Link>
          </div>
        </section>

        <section className="card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{background: 'rgba(34, 197, 94, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <i className="fa-solid fa-cube" style={{color: '#22c55e', fontSize: '1.4rem'}}></i>
              </div>
              <h2 className="section-title" style={{margin: 0}}>Geometry & Areas</h2>
            </div>
            {data.topics.geometry.topicGraduated && (
              <span style={{background: 'rgba(67, 181, 129, 0.15)', color: 'var(--success-text)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}><i className="fa-solid fa-trophy" style={{marginRight: '6px'}}></i>Mastery Achieved</span>
            )}
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Last Practiced</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.geometry.lastVisited}</strong>
            </div>

            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Activity Volume</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.geometry.questionsSeen} specific questions seen</strong>
            </div>

            <div style={{background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Diagnostic Setup</span>
              <strong style={{fontSize: '1.1rem'}}>{data.topics.geometry.diagnosticCompleted ? "Baseline Established" : "Pending Evaluation"}</strong>
            </div>
          </div>

          <div className="actions" style={{marginTop: '20px'}}>
            <Link className="btn btn-secondary" href="/tutor?topic=geometry" style={{width: '100%', justifyContent: 'center'}}>Resume Practicing</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
