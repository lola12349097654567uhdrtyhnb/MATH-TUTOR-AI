'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MathText } from '../tutor/components/Shared';

function AssessmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'pre';
  
  const [questions, setQuestions] = useState([]);
  const [targetTopics, setTargetTopics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [scoreTracker, setScoreTracker] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');

  useEffect(() => {
    async function loadQuestions() {
      try {
        const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
        const res = await fetch(`/api/assessment/questions?type=${type}`, {
          headers: { 'x-user-id': userHeader }
        });
        
        if (!res.ok) throw new Error('Failed to load assessment');
        
        const data = await res.json();
        setQuestions(data.questions);
        setTargetTopics(data.target_topics);
        
        const initialScores = {};
        data.target_topics.forEach(t => initialScores[t] = { correct: 0, total: 0 });
        setScoreTracker(initialScores);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [type]);

  async function handleAnswerFixed(selectedOption) {
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correct_answer;
    
    const newScoreTracker = { ...scoreTracker };
    if (!newScoreTracker[currentQ.subject]) {
      newScoreTracker[currentQ.subject] = { correct: 0, total: 0 };
    }
    newScoreTracker[currentQ.subject].correct += (isCorrect ? 1 : 0);
    newScoreTracker[currentQ.subject].total += 1;
    
    setScoreTracker(newScoreTracker);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSubmitting(true);
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      
      const payload = {
        type,
        score_by_topic: newScoreTracker,
        questions_seen: questions.map(q => q.id)
      };

      try {
        const res = await fetch('/api/assessment/submit', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userHeader
          },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          if (type === 'pre') {
            router.push('/dashboard');
          } else {
            router.push('/assessment-results');
          }
        } else {
          setError("Failed to submit assessment.");
          setSubmitting(false);
        }
      } catch(err) {
        setError(err.message);
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="title">{type === 'pre' ? 'Pre-Assessment' : 'Post-Assessment'}</h1>
      </header>
      <main>
        {loading ? (
          <div style={{textAlign: 'center', padding: '50px'}}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>
        ) : error ? (
          <div className="card"><p style={{color: 'red'}}>{error}</p></div>
        ) : questions.length === 0 ? (
          <div className="card"><p>No questions found.</p></div>
        ) : submitting ? (
           <div className="card" style={{textAlign: 'center', padding: '50px'}}>
             <h2>Saving Results...</h2>
             <i className="fa-solid fa-spinner fa-spin fa-2x" style={{marginTop: '20px'}}></i>
           </div>
        ) : (
          <div className="card fade-enter-active">
             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem', color: '#888'}}>
               <span style={{textTransform: 'capitalize'}}>{questions[currentIndex].subject} Question</span>
               <span>Question {currentIndex + 1} of {questions.length}</span>
             </div>
             
             <div className="question-box" style={{marginBottom: '30px'}}>
               <p className="question-text" style={{fontSize: '1.2rem'}}><MathText content={questions[currentIndex].content} /></p>
             </div>
             
             <div className="mcq-grid" style={{marginBottom: '20px'}}>
               {questions[currentIndex].options.map((opt, idx) => (
                 <button 
                   key={idx} 
                   className={`mcq-btn ${selectedAnswer === opt ? 'selected' : ''}`} 
                   onClick={() => setSelectedAnswer(opt)}
                   style={{padding: '15px', fontSize: '1.1rem'}}
                 >
                   <MathText content={opt} />
                 </button>
               ))}
             </div>

             <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
               <button 
                 className="btn btn-primary" 
                 disabled={!selectedAnswer}
                 onClick={() => {
                   handleAnswerFixed(selectedAnswer);
                   setSelectedAnswer('');
                 }}
                 style={{padding: '14px 40px', fontSize: '1.1rem'}}
               >
                 <i className="fa-solid fa-circle-check"></i> Submit Answer
               </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Assessment() {
  return (
    <Suspense fallback={<div className="container" style={{textAlign: 'center', padding: '50px'}}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>}>
      <AssessmentContent />
    </Suspense>
  );
}
