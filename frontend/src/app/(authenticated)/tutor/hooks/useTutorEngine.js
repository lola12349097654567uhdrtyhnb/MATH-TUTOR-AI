import { useState, useEffect, useCallback } from 'react';

export function useTutorEngine(topic, router) {
  const [uiState, setUiState] = useState('loading'); // loading, diagnostic, intro, practice, upload, graduated
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const [diagnosticIndex, setDiagnosticIndex] = useState(1);
  const [diagnosticTotal, setDiagnosticTotal] = useState(3);
  const [currentAction, setCurrentAction] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [hintUsed, setHintUsed] = useState(false);
  const [visualData, setVisualData] = useState(null);
  const [remedialFeedback, setRemedialFeedback] = useState('');

  const initSession = useCallback(async () => {
    try {
      setError(null);
      const cacheBuster = Date.now();
      const res = await fetch(`/api/tutor/session?topic=${topic}&_cb=${cacheBuster}`, {
        headers: { 'x-user-id': typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '' }
      });
      if (!res.ok) throw new Error('Failed to fetch session');
      const sessionData = await res.json();
      
      if (!sessionData.logged_in) {
        const debugStr = sessionData.debug ? JSON.stringify(sessionData.debug) : 'No debug info';
        setError(`Auth failed! Debug info: ${debugStr}`);
        setUiState('error');
        return;
      }
      
      if (!sessionData.profile_configured) {
        router.push('/questionnaire');
        return;
      }

      setData(sessionData);

      if (!sessionData.diagnostic_completed) {
        setUiState('diagnostic');
        setCurrentAction(sessionData.diagnostic_question);
        setDiagnosticIndex(sessionData.progress.current);
        setDiagnosticTotal(sessionData.progress.total);
        setQuestionStartTime(Date.now());
      } else if (sessionData.next_action && sessionData.next_action.type === 'upload_work') {
        setUiState('upload');
        setCurrentAction(sessionData.next_action);
      } else {
        setUiState('practice');
        setCurrentAction(sessionData.next_action);
        setQuestionStartTime(Date.now());
      }
    } catch (err) {
      console.error(err);
      setError('Failed to initialize session. Please try again.');
      setUiState('error');
    }
  }, [topic, router]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const submitDiagnosticAnswer = async () => {
    if (!selectedAnswer) return;
    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    
    try {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/tutor/submit_diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userHeader },
        body: JSON.stringify({ topic, question_id: currentAction.id, answer: selectedAnswer, response_time_seconds: elapsed })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const result = await res.json();
      
      if (result.diagnostic_completed) {
        setUiState('practice');
        setCurrentAction(result.next_action);
        setData(prev => ({...prev, mastery: result.mastery}));
      } else {
        setFeedback({ text: 'Processing...', type: '' });
        setTimeout(() => {
          setFeedback({text: '', type: ''});
          setCurrentAction(result.next_diagnostic_question);
          setDiagnosticIndex(result.progress.current);
          setSelectedAnswer('');
          setQuestionStartTime(Date.now());
        }, 500);
        return; 
      }
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error(err);
      setFeedback({ text: 'Failed to submit. Please try again.', type: 'warn' });
    }
  };

  const submitPracticeAnswer = async () => {
    if (!selectedAnswer) return;
    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);

    try {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/tutor/submit_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userHeader },
        body: JSON.stringify({ topic, answer: selectedAnswer, question_id: currentAction.id, response_time_seconds: elapsed, hint_used: hintUsed })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const result = await res.json();
      
      setFeedback({ text: `${result.is_correct ? 'Correct! 🎉' : 'Not quite. Try again!'}${result.response_time_seconds ? ` (${result.response_time_seconds}s)` : ''}`, type: result.is_correct ? 'success' : 'warn' });

      if (result.is_correct) {
        setTimeout(() => {
          setFeedback({text: '', type: ''});
          setSelectedAnswer('');
          setHintUsed(false);
          setVisualData(null);
          if (result.topic_graduated) {
            setUiState('graduated');
          } else if (result.next_action && result.next_action.type === 'upload_work') {
            setUiState('upload');
            setCurrentAction(result.next_action);
          } else {
            setCurrentAction(result.next_action);
            setData(prev => ({...prev, mastery: result.mastery}));
            setQuestionStartTime(Date.now());
          }
        }, 1000);
      } else {
        setSelectedAnswer('');
        setTimeout(() => setFeedback({text:'', type:''}), 1500);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ text: 'Failed to submit. Please try again.', type: 'warn' });
    }
  };

  const requestHint = async () => {
    try {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/tutor/get_hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userHeader },
        body: JSON.stringify({ topic, question_id: currentAction.id })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const result = await res.json();
      setFeedback({ text: `Hint: ${result.hint.text}`, type: 'success' });
      setHintUsed(true);
      setVisualData(result.hint.mode === 'visual' ? result.hint.visual : null);
    } catch (err) {
      console.error(err);
      setFeedback({ text: 'Failed to load hint.', type: 'warn' });
    }
  };

  const continueFromVideo = async () => {
    try {
      const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
      const res = await fetch('/api/tutor/mark_intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userHeader },
        body: JSON.stringify({ topic })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const result = await res.json();
      setUiState('practice');
      setCurrentAction(result.next_action);
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error(err);
      setError('Failed to transition. Please try again.');
      setUiState('error');
    }
  };

  const submitUpload = async (fileToUpload) => {
    if (!fileToUpload) return;
    setFeedback({ text: 'Grading...', type: '' });
    
    const formData = new FormData();
    formData.append('topic', topic);
    formData.append('file', fileToUpload);
    formData.append('question_text', currentAction.question_text);

    const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
    
    try {
      const res = await fetch('/api/tutor/upload_work', { 
        method: 'POST', 
        headers: { 'x-user-id': userHeader },
        body: formData 
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const result = await res.json();
      
      setFeedback({ text: result.message, type: result.is_valid_math ? 'success' : 'warn' });
      setTimeout(() => {
        if (!result.is_valid_math) {
          setRemedialFeedback(result.message);
          setUiState('intro');
        } else if (result.topic_graduated) {
          setUiState('graduated');
        } else {
          setUiState('practice');
          setRemedialFeedback('');
        }
        setCurrentAction(result.next_action);
        setData(prev => ({...prev, mastery: result.mastery, video_url: result.video_url || prev?.video_url }));
        setFeedback({text: '', type: ''});
      }, 4000);
    } catch (err) {
      console.error(err);
      setFeedback({ text: 'Failed to upload. Please try again.', type: 'warn' });
    }
  };

  return {
    uiState, setUiState, data, error, retryInit: initSession,
    diagnosticIndex, diagnosticTotal, currentAction,
    selectedAnswer, setSelectedAnswer, feedback, setFeedback, visualData, remedialFeedback,
    submitDiagnosticAnswer, submitPracticeAnswer, requestHint, continueFromVideo, submitUpload,
    setQuestionStartTime
  };
}
