'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstructionsModal from './InstructionsModal';
import QuestionnaireModal from './QuestionnaireModal';


export default function Dashboard() {
  const router = useRouter();
  const [topicStatus, setTopicStatus] = useState({});
  const [targetTopics, setTargetTopics] = useState([]);
  const [topicGraduated, setTopicGraduated] = useState({});
  const [targetsMastered, setTargetsMastered] = useState(false);
  const [postAssessment, setPostAssessment] = useState({ completed: false });
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

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
        if (seshData.topic_graduated) {
          setTopicGraduated(seshData.topic_graduated);
        }
        
        const isMastered = seshData.target_topics.every(t => seshData.topic_graduated && seshData.topic_graduated[t]);
        setTargetsMastered(isMastered);
        setPostAssessment(seshData.post_assessment || { completed: false });
        setSurveyCompleted(!!seshData.evaluation_questionnaire);
        if (seshData.post_assessment?.completed && !seshData.evaluation_questionnaire) {
          setShowQuestionnaire(true);
        }
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

  const masteredCount = targetTopics.filter(t => topicGraduated[t]).length;
  const totalCount = targetTopics.length;
  const step2Completed = targetsMastered || postAssessment.completed;

  // Calculate study mission progress percentage (each step is 25%)
  let progressPercent = 25; // Step 1: Pre-Assessment is always completed
  if (step2Completed) progressPercent += 25;
  if (postAssessment.completed) progressPercent += 25;
  if (surveyCompleted) progressPercent += 25;

  return (
    <div className="container">
      {showInstructions && <InstructionsModal onAccept={handleAcceptInstructions} />}
      {showQuestionnaire && (
        <QuestionnaireModal 
          onSubmitSuccess={() => {
            setShowQuestionnaire(false);
            setSurveyCompleted(true);
          }} 
        />
      )}
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
            {/* Unified Glassmorphic Checklist Control Center */}
            <div className="card mission-card" style={{ marginBottom: '40px', padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <i className="fa-solid fa-square-check" style={{ color: '#8b5cf6', WebkitTextFillColor: 'initial' }}></i> My Study Mission 🚀
                  </h2>
                  <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.98rem', fontWeight: '500' }}>
                    To finish our research study, please complete all 4 steps below. <strong>Post-Assessment & Survey are required!</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="progress-chip" style={{ fontSize: '0.95rem', padding: '10px 18px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: '700' }}>
                    Mission Progress: {progressPercent}%
                  </span>
                </div>
              </div>

              {/* Glowing Progress Bar */}
              <div className="mastery-bar-container" style={{ height: '14px', borderRadius: '7px', marginBottom: '30px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div className="mastery-bar-fill" style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #a855f7 0%, #6366f1 50%, #10b981 100%)', boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)' }}></div>
              </div>

              {/* Steps Layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Step 1: Pre-Assessment */}
                <div className="step-card completed">
                  <div className="step-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Step 1: Pre-Assessment</h3>
                    <p style={{ margin: '3px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>Completed at the start of your journey.</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)' }}>DONE</span>
                </div>

                {/* Step 2: Learn & Practice */}
                <div className={`step-card ${step2Completed ? 'completed' : 'active'}`}>
                  <div className="step-icon" style={{ 
                    background: step2Completed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)', 
                    color: step2Completed ? '#4ade80' : '#c084fc', 
                    border: step2Completed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)' 
                  }}>
                    {step2Completed ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-bolt"></i>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Step 2: Learn & Practice</h3>
                    <p style={{ margin: '3px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      {step2Completed 
                        ? 'Practice phase finished!' 
                        : `Practice your focus topics below to level up. (Mastered: ${masteredCount} of ${totalCount})`}
                    </p>
                  </div>
                  {step2Completed ? (
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)' }}>DONE</span>
                  ) : (
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.15)' }}>ACTIVE</span>
                  )}
                </div>

                {/* Step 3: Post-Assessment (REQUIRED) */}
                <div className={`step-card ${postAssessment.completed ? 'completed' : 'active'}`} style={{
                  border: !postAssessment.completed ? '2px solid rgba(168, 85, 247, 0.4)' : undefined,
                  background: !postAssessment.completed ? 'rgba(168, 85, 247, 0.06)' : undefined
                }}>
                  <div className={`step-icon ${!postAssessment.completed ? 'pulsing-badge-purple' : ''}`} style={{ 
                    background: postAssessment.completed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(168, 85, 247, 0.25)', 
                    color: postAssessment.completed ? '#4ade80' : '#e9d5ff', 
                    border: postAssessment.completed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(168, 85, 247, 0.4)' 
                  }}>
                    {postAssessment.completed ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-star"></i>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Step 3: Post-Assessment <span style={{ fontSize: '0.72rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '800', border: '1px solid rgba(239,68,68,0.2)' }}>REQUIRED FOR STUDY</span>
                    </h3>
                    <p style={{ margin: '3px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      {postAssessment.completed 
                        ? 'Completed! Outstanding job!' 
                        : 'Take the test to check your improvements. You can take this now or after mastering your topics.'}
                    </p>
                  </div>
                  {postAssessment.completed ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)', display: 'inline-flex', alignItems: 'center' }}>DONE</span>
                      <button className="btn btn-secondary" onClick={() => router.push('/assessment-results')} style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px' }}>
                        View Results
                      </button>
                    </div>
                  ) : (
                    <button className="btn pulsing-badge-purple pulse-button-purple" onClick={() => router.push('/assessment?type=post')} style={{ padding: '10px 20px', fontSize: '0.92rem', borderRadius: '10px', fontWeight: '700', height: 'auto' }}>
                      Take Post-Assessment <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
                    </button>
                  )}
                </div>

                {/* Step 4: Feedback Survey (REQUIRED) */}
                <div className={`step-card ${surveyCompleted ? 'completed' : (!postAssessment.completed ? 'locked' : 'active')}`} style={{
                  border: (postAssessment.completed && !surveyCompleted) ? '2px solid rgba(16, 185, 129, 0.4)' : undefined,
                  background: (postAssessment.completed && !surveyCompleted) ? 'rgba(16, 185, 129, 0.06)' : undefined
                }}>
                  <div className={`step-icon ${(postAssessment.completed && !surveyCompleted) ? 'pulsing-badge-green' : ''}`} style={{ 
                    background: surveyCompleted ? 'rgba(34, 197, 94, 0.15)' : (!postAssessment.completed ? 'rgba(255,255,255,0.03)' : 'rgba(16, 185, 129, 0.25)'), 
                    color: surveyCompleted ? '#4ade80' : (!postAssessment.completed ? '#9ca3af' : '#a7f3d0'), 
                    border: surveyCompleted ? '1px solid rgba(34, 197, 94, 0.3)' : (!postAssessment.completed ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(16, 185, 129, 0.4)') 
                  }}>
                    {surveyCompleted ? <i className="fa-solid fa-heart"></i> : (!postAssessment.completed ? <i className="fa-solid fa-lock"></i> : <i className="fa-solid fa-clipboard-question"></i>)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Step 4: Feedback Survey <span style={{ fontSize: '0.72rem', color: surveyCompleted ? '#4ade80' : (!postAssessment.completed ? '#9ca3af' : '#34d399'), background: surveyCompleted ? 'rgba(34,197,94,0.15)' : (!postAssessment.completed ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.15)'), padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '800', border: surveyCompleted ? '1px solid rgba(34,197,94,0.2)' : (!postAssessment.completed ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(16,185,129,0.2)') }}>REQUIRED FOR STUDY</span>
                    </h3>
                    <p style={{ margin: '3px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      {surveyCompleted 
                        ? 'Done! Thank you so much for your feedback! ❤️' 
                        : (!postAssessment.completed ? 'Locked (Please complete Step 3 first)' : 'Tell us about your learning experience with the AI tutor.')}
                    </p>
                  </div>
                  {surveyCompleted ? (
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)' }}>SUBMITTED</span>
                  ) : !postAssessment.completed ? (
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#9ca3af', background: 'rgba(255, 255, 255, 0.05)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-lock" style={{ marginRight: '5px' }}></i> LOCKED</span>
                  ) : (
                    <button className="btn pulsing-badge-green pulse-button-green" onClick={() => setShowQuestionnaire(true)} style={{ padding: '10px 20px', fontSize: '0.92rem', borderRadius: '10px', fontWeight: '700', height: 'auto' }}>
                      Take Survey <i className="fa-solid fa-clipboard-list" style={{ marginLeft: '6px' }}></i>
                    </button>
                  )}
                </div>

              </div>

              {/* Celebrate 100% Completion Gratitude Banner */}
              {progressPercent === 100 && (
                <div className="fade-enter-active" style={{ marginTop: '25px', padding: '20px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.35)', textAlign: 'center', boxShadow: '0 0 25px rgba(34, 197, 94, 0.15)' }}>
                  <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1.25rem', fontWeight: '800' }}>
                    🎉 Mission Fully Completed! 🎉
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: '0.96rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                    Thank you! You have successfully completed all steps of the academic research study. Your efforts are highly appreciated and will directly help improve math education. You are amazing! ❤️
                  </p>
                </div>
              )}
            </div>

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

            <style jsx>{`
              .mission-card {
                background: linear-gradient(135deg, rgba(20, 26, 48, 0.72) 0%, rgba(13, 17, 33, 0.88) 100%) !important;
                border: 1px solid rgba(139, 92, 246, 0.25) !important;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
                position: relative;
                overflow: hidden;
              }
              .mission-card::before {
                content: "";
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 60%);
                pointer-events: none;
              }
              .step-card {
                display: flex;
                align-items: center;
                gap: 20px;
                padding: 18px 24px;
                border-radius: 18px;
                transition: all 0.3s ease;
              }
              .step-card.active {
                background: rgba(139, 92, 246, 0.04);
                border: 1px solid rgba(139, 92, 246, 0.2);
                box-shadow: 0 8px 20px rgba(0,0,0,0.15);
              }
              .step-card.completed {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.04);
                opacity: 0.75;
              }
              .step-card.locked {
                background: rgba(255, 255, 255, 0.01);
                border: 1px solid rgba(255, 255, 255, 0.02);
                opacity: 0.5;
              }
              .pulsing-badge-purple {
                animation: pulsePurple 2s infinite alternate;
              }
              .pulsing-badge-green {
                animation: pulseGreen 2s infinite alternate;
              }
              .pulse-button-purple {
                background: linear-gradient(135deg, #a855f7, #6366f1) !important;
                color: #fff !important;
                box-shadow: 0 4px 15px rgba(168, 85, 247, 0.35) !important;
                animation: buttonPulsePurple 2s infinite;
                border: none !important;
              }
              .pulse-button-purple:hover {
                background: linear-gradient(135deg, #b967ff, #7478ff) !important;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5) !important;
              }
              .pulse-button-green {
                background: linear-gradient(135deg, #10b981, #059669) !important;
                color: #fff !important;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35) !important;
                animation: buttonPulseGreen 2s infinite;
                border: none !important;
              }
              .pulse-button-green:hover {
                background: linear-gradient(135deg, #13ca8d, #06a977) !important;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5) !important;
              }
              @keyframes pulsePurple {
                0% { transform: scale(0.97); box-shadow: 0 0 4px rgba(168, 85, 247, 0.2); }
                100% { transform: scale(1.03); box-shadow: 0 0 15px rgba(168, 85, 247, 0.6); }
              }
              @keyframes pulseGreen {
                0% { transform: scale(0.97); box-shadow: 0 0 4px rgba(16, 185, 129, 0.2); }
                100% { transform: scale(1.03); box-shadow: 0 0 15px rgba(16, 185, 129, 0.6); }
              }
              @keyframes buttonPulsePurple {
                0% { transform: scale(1); box-shadow: 0 4px 15px rgba(168, 85, 247, 0.35); }
                50% { transform: scale(1.03); box-shadow: 0 4px 22px rgba(168, 85, 247, 0.55); }
                100% { transform: scale(1); box-shadow: 0 4px 15px rgba(168, 85, 247, 0.35); }
              }
              @keyframes buttonPulseGreen {
                0% { transform: scale(1); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); }
                50% { transform: scale(1.03); box-shadow: 0 4px 22px rgba(16, 185, 129, 0.55); }
                100% { transform: scale(1); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); }
              }
              .step-icon {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                flex-shrink: 0;
              }
            `}</style>
          </>
        )}
      </main>
    </div>
  );
}
