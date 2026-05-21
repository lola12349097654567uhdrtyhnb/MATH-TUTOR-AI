'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstructionsModal from './InstructionsModal';

export default function Dashboard() {
  const router = useRouter();
  const [topicStatus, setTopicStatus] = useState({});
  const [targetTopics, setTargetTopics] = useState([]);
  const [targetsMastered, setTargetsMastered] = useState(false);
  const [postAssessment, setPostAssessment] = useState({ completed: false });
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  useEffect(() => {
    async function checkRole() {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const sesh = await fetch('/api/auth/session', {
        headers: { 'x-user-id': userHeader }
      });
      if (sesh.ok) {
        const seshData = await sesh.json();
        if (seshData.role === 'instructor') {
          router.push('/instructor/overview');
        }
        if (!seshData.target_topics || seshData.target_topics.length < 2) {
          router.push('/select-targets');
          return;
        }
        if (!seshData.pre_assessment?.completed) {
          router.push('/assessment?type=pre');
          return;
        }
        
        setTargetTopics(seshData.target_topics);
        if (seshData.topic_status) {
          setTopicStatus(seshData.topic_status);
        }
        
        const isMastered = seshData.target_topics.every(t => seshData.topic_graduated && seshData.topic_graduated[t]);
        setTargetsMastered(isMastered);
        setPostAssessment(seshData.post_assessment || { completed: false });
        setLoading(false);
      }
    }
    checkRole();
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem('hasAcceptedInstructions');
      if (!accepted) {
        setShowInstructions(true);
      }
    }
  }, [router]);

  const handleAcceptInstructions = () => {
    localStorage.setItem('hasAcceptedInstructions', 'true');
    setShowInstructions(false);
  };

  return (
    <div className="container">
      {showInstructions && <InstructionsModal onAccept={handleAcceptInstructions} />}
      <header className="page-header">
        <div className="header-row">
          <div>
            <h1 className="title">Student Hub</h1>
            <p className="subtitle">Welcome back! Choose a topic below to begin practice.</p>
          </div>
          <Link className="btn btn-secondary" href="/api/auth/logout"><i className="fa-solid fa-arrow-right-from-bracket"></i> Sign out</Link>
        </div>
      </header>

      <main>
        {loading ? (
          <div style={{textAlign: 'center', padding: '50px'}}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>
        ) : (
          <>
            {targetsMastered && (
              <div className="card fade-enter-active" style={{marginBottom: '30px', textAlign: 'center', background: 'var(--success-bg, rgba(46, 213, 115, 0.1))'}}>
                <h2 className="section-title">Congratulations! 🎉</h2>
                <p className="section-note" style={{marginBottom: '20px'}}>You have mastered your focus topics: {targetTopics.join(' & ')}.</p>
                {!postAssessment.completed ? (
                  <button className="btn btn-primary" onClick={() => router.push('/assessment?type=post')} style={{fontSize: '1.2rem'}}>
                    Take Post-Assessment
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={() => router.push('/assessment-results')} style={{fontSize: '1.2rem'}}>
                    View Assessment Results
                  </button>
                )}
              </div>
            )}

            {!targetsMastered && !postAssessment.completed && (
              <div className="card" style={{marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--highlight)', borderStyle: 'dashed'}}>
                <div>
                  <h3 style={{margin: 0}}>Ready to test your knowledge?</h3>
                  <p className="section-note" style={{margin: '4px 0 0'}}>You can take the Post-Assessment now if you feel confident, even before full mastery.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => router.push('/assessment?type=post')}>
                  Manual Post-Assessment
                </button>
              </div>
            )}

            {postAssessment.completed && !targetsMastered && (
               <div className="card" style={{marginBottom: '30px', textAlign: 'center'}}>
                 <h2 className="section-title">Final Results Ready</h2>
                 <p className="section-note" style={{marginBottom: '16px'}}>You've completed your assessment cycle. See how you did!</p>
                 <button className="btn btn-primary" onClick={() => router.push('/assessment-results')}>
                   View My Results
                 </button>
               </div>
            )}

        <div className="grid">
          <section className="card card-hoverable" style={{textAlign: 'center', padding: '40px 20px', border: targetTopics.includes('fractions') ? '2px solid var(--primary)' : ''}}>
            <div className="icon-wrapper">
              <i className="fa-solid fa-shapes"></i>
            </div>
            <h2 className="section-title">Fractions Unit</h2>
            <p className="section-note" style={{marginBottom: '20px'}}>Master adding, subtracting, and interpreting visual fractions.</p>
            <Link className="btn btn-primary" href="/tutor?topic=fractions" style={{width: '100%'}}>
              {topicStatus.fractions ? 'Continue Practicing' : 'Start Fractions'}
            </Link>
          </section>

          <section className="card card-hoverable" style={{textAlign: 'center', padding: '40px 20px', border: targetTopics.includes('algebra') ? '2px solid var(--primary)' : ''}}>
            <div className="icon-wrapper">
              <i className="fa-solid fa-square-root-variable"></i>
            </div>
            <h2 className="section-title">Algebraic Equations</h2>
            <p className="section-note" style={{marginBottom: '20px'}}>Solve for x and balance the mathematical scales.</p>
            <Link className="btn btn-primary" href="/tutor?topic=algebra" style={{width: '100%'}}>
              {topicStatus.algebra ? 'Continue Practicing' : 'Start Algebra'}
            </Link>
          </section>

          <section className="card card-hoverable" style={{textAlign: 'center', padding: '40px 20px', border: targetTopics.includes('exponents') ? '2px solid var(--primary)' : ''}}>
            <div className="icon-wrapper">
              <i className="fa-solid fa-superscript"></i>
            </div>
            <h2 className="section-title">Exponents & Scientific</h2>
            <p className="section-note" style={{marginBottom: '20px'}}>Master laws of exponents and large numbers.</p>
            <Link className="btn btn-primary" href="/tutor?topic=exponents" style={{width: '100%'}}>
              {topicStatus.exponents ? 'Continue Practicing' : 'Start Exponents'}
            </Link>
          </section>

          <section className="card card-hoverable" style={{textAlign: 'center', padding: '40px 20px', border: targetTopics.includes('geometry') ? '2px solid var(--primary)' : ''}}>
            <div className="icon-wrapper">
              <i className="fa-solid fa-cube"></i>
            </div>
            <h2 className="section-title">Geometry & Areas</h2>
            <p className="section-note" style={{marginBottom: '20px'}}>Calculate spatial areas, Pythagorean, and volume.</p>
            <Link className="btn btn-primary" href="/tutor?topic=geometry" style={{width: '100%'}}>
              {topicStatus.geometry ? 'Continue Practicing' : 'Start Geometry'}
            </Link>
          </section>
        </div>
          </>
        )}
      </main>
    </div>
  );
}
