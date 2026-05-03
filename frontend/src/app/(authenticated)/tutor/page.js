'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { useTutorEngine } from './hooks/useTutorEngine';
import { SkeletonLoader } from './components/Shared';
import { DiagnosticScreen } from './components/DiagnosticScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { IntroScreen } from './components/IntroScreen';
import { UploadScreen } from './components/UploadScreen';
import { GraduatedScreen } from './components/GraduatedScreen';

function TutorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topic = searchParams.get('topic') || 'fractions';

  const engine = useTutorEngine(topic, router);
  const { uiState, error, retryInit } = engine;

  let content;

  if (uiState === 'loading') {
    content = <SkeletonLoader />;
  } else if (uiState === 'error') {
    content = (
      <section className="card fade-enter-active" style={{textAlign: 'center'}}>
        <h2 className="section-title" style={{color: 'var(--warn-text)'}}><i className="fa-solid fa-triangle-exclamation"></i> Connection Error</h2>
        <p className="section-note">{error}</p>
        <button className="btn btn-primary" onClick={retryInit} style={{marginTop: '20px'}}>
          <i className="fa-solid fa-rotate-right"></i> Try Again
        </button>
      </section>
    );
  } else if (uiState === 'diagnostic') {
    content = <DiagnosticScreen {...engine} />;
  } else if (uiState === 'graduated') {
    content = <GraduatedScreen setUiState={engine.setUiState} setQuestionStartTime={engine.setQuestionStartTime} />;
  } else if (uiState === 'intro') {
    content = <IntroScreen topic={topic} remedialFeedback={engine.remedialFeedback} data={engine.data} continueFromVideo={engine.continueFromVideo} />;
  } else if (uiState === 'practice') {
    content = <PracticeScreen topic={topic} {...engine} />;
  } else if (uiState === 'upload') {
    content = <UploadScreen topic={topic} isActive={true} {...engine} />;
  }

  return (
    <div className="container">
      <header className="page-header">
        <div className="header-row">
          <div>
            <h1 className="title" style={{textTransform: 'capitalize'}}>{topic} Tutor AI</h1>
            <p className="subtitle">Adaptive learning platform • Master your skills.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      </header>

      <main>
        {content}
      </main>
    </div>
  );
}

export default function Tutor() {
  return (
    <Suspense fallback={<div className="container"><SkeletonLoader /></div>}>
      <TutorContent />
    </Suspense>
  );
}
