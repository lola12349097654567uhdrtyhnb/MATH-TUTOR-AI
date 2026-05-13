'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AssessmentResults() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div style={{textAlign: 'center', padding: '50px'}}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>;
  }

  if (!data || !data.pre_assessment?.completed || !data.post_assessment?.completed) {
    return (
      <div className="container" style={{textAlign: 'center', padding: '50px'}}>
        <h2>Results not available yet.</h2>
        <Link href="/dashboard" className="btn btn-primary" style={{marginTop: '20px'}}>Back to Dashboard</Link>
      </div>
    );
  }

  const { target_topics, pre_assessment, post_assessment } = data;

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

  const preTotal = calculateTotal(pre_assessment.score);
  const postTotal = calculateTotal(post_assessment.score);

  return (
    <div className="container">
      <header className="page-header" style={{textAlign: 'center'}}>
        <h1 className="title">Assessment Results</h1>
        <p className="subtitle">See how much you've improved!</p>
      </header>

      <main>
        <div className="grid" style={{gridTemplateColumns: '1fr 1fr'}}>
          <div className="card fade-enter-active" style={{textAlign: 'center'}}>
            <h2 className="section-title">Pre-Assessment</h2>
            <div style={{fontSize: '3rem', fontWeight: 'bold', margin: '20px 0', color: 'var(--warn-text)'}}>
              {Math.round((preTotal.correct / Math.max(preTotal.total, 1)) * 100)}%
            </div>
            <p className="section-note">{preTotal.correct} out of {preTotal.total} correct</p>
            
            <div style={{marginTop: '30px', textAlign: 'left'}}>
              {target_topics.map(t => (
                <div key={t} style={{marginBottom: '10px'}}>
                  <strong style={{textTransform: 'capitalize'}}>{t}:</strong> {pre_assessment.score?.[t]?.correct || 0}/{pre_assessment.score?.[t]?.total || 0}
                </div>
              ))}
            </div>
          </div>

          <div className="card fade-enter-active" style={{textAlign: 'center', border: '2px solid var(--success-bg, #2ed573)'}}>
            <h2 className="section-title">Post-Assessment</h2>
            <div style={{fontSize: '3rem', fontWeight: 'bold', margin: '20px 0', color: 'var(--success-bg, #2ed573)'}}>
              {Math.round((postTotal.correct / Math.max(postTotal.total, 1)) * 100)}%
            </div>
            <p className="section-note">{postTotal.correct} out of {postTotal.total} correct</p>

            <div style={{marginTop: '30px', textAlign: 'left'}}>
              {target_topics.map(t => (
                <div key={t} style={{marginBottom: '10px'}}>
                  <strong style={{textTransform: 'capitalize'}}>{t}:</strong> {post_assessment.score?.[t]?.correct || 0}/{post_assessment.score?.[t]?.total || 0}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{textAlign: 'center', marginTop: '40px'}}>
          <Link href="/dashboard" className="btn btn-primary" style={{fontSize: '1.2rem'}}>
            <i className="fa-solid fa-house"></i> Return to Student Hub
          </Link>
        </div>
      </main>
    </div>
  );
}
