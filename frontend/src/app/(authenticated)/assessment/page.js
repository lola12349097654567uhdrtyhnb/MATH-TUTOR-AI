'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MathText } from '../tutor/components/Shared';

export default function Assessment() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'pre';
  
  const [questions, setQuestions] = useState([]);
  const [targetTopics, setTargetTopics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Track scores per topic
  const [scoreTracker, setScoreTracker] = useState({});

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
        
        // Init score tracker
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

  const handleAnswer = async (selectedOption) => {
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correct_answer;
    
    // Update score
    setScoreTracker(prev => {
      const topicScore = prev[currentQ.subject] || { correct: 0, total: 0 };
      return {
        ...prev,
        [currentQ.subject]: {
          correct: topicScore.correct + (isCorrect ? 1 : 0),
          total: topicScore.total + 1
        }
      };
    });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      await finishAssessment();
    }
  };

  const finishAssessment = async () => {
    setSubmitting(true);
    const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
    
    // final score calculation uses the state that hasn't rendered yet if we don't calculate it here
    const currentQ = questions[currentIndex];
    // wait, handleAnswer updates state asynchronously. We should compute final score exactly here based on the latest state or reconstruct it.
    // Actually, it's safer to reconstruct to avoid race conditions. But since we are calling finishAssessment AFTER handleAnswer... 
    // Wait, handleAnswer calls finishAssessment directly, so state is stale.
  };

  // Fixed finishAssessment
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
             
             <div className="mcq-grid">
               {questions[currentIndex].options.map((opt, idx) => (
                 <button 
                   key={idx} 
                   className="mcq-btn" 
                   onClick={() => handleAnswerFixed(opt)}
                   style={{padding: '15px', fontSize: '1.1rem'}}
                 >
                   <MathText content={opt} />
                 </button>
               ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );

  // We define handleAnswerFixed inside the component to correctly process the final answer
  async function handleAnswerFixed(selectedOption) {
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correct_answer;
    
    // Create new score state
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
}
