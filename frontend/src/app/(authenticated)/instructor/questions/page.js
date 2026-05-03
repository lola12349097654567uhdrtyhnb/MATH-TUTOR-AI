'use client';

import { useState } from 'react';

export default function InstructorQuestions() {
  const [topic, setTopic] = useState('fractions');
  const [difficulty, setDifficulty] = useState('medium');
  const [content, setContent] = useState('');
  const [answers, setAnswers] = useState(''); // Comma separated for MCQ
  const [correctAnswer, setCorrectAnswer] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content || !correctAnswer) {
      alert("Please provide the question content and correct answer.");
      return;
    }

    const ansArray = answers.split(',').map(a => a.trim()).filter(a => a);
    const payload = {
      subject: topic,
      difficulty,
      content,
      correct_answer: correctAnswer,
      answers: ansArray.length > 0 ? ansArray : [correctAnswer],
      type: ansArray.length > 0 ? 'mcq' : 'open'
    };

    const res = await fetch('/api/instructor/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Successfully injected Question into the Database AI routing pool!");
      setContent('');
      setAnswers('');
      setCorrectAnswer('');
    } else {
      alert("Error adding question");
    }
  };

  return (
    <div className="container" style={{maxWidth: '800px', margin: '0 auto'}}>
      <header className="page-header">
        <h1 className="title">Construct AI Question</h1>
        <p className="subtitle">Add new curriculum directly to the MongoDB Brain. The Python state engine parses this continuously.</p>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          
          <div style={{display: 'flex', gap: '20px'}}>
            <div className="form-group" style={{flex: 1}}>
              <label>Subject Topic</label>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} style={{width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px'}}>
                <option value="fractions">Fractions</option>
                <option value="algebra">Algebraic Equations</option>
                <option value="exponents">Exponents & Scientific</option>
                <option value="geometry">Geometry & Areas</option>
              </select>
            </div>
            
            <div className="form-group" style={{flex: 1}}>
              <label>Pedagogical Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px'}}>
                <option value="easy">Easy (Remedial)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Advanced)</option>
                <option value="master">Master (Challenge)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Question Content (Markdown/Text)</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g., Solve for x: 2x + 4 = 10"
              style={{width: '100%', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', minHeight: '100px'}}
            />
          </div>

          <div className="form-group">
            <label>Correct Answer (Exact Match)</label>
            <input 
              type="text" 
              value={correctAnswer} 
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="e.g., 3"
              style={{width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px'}}
            />
          </div>

          <div className="form-group">
            <label>Multiple Choice Options (Optional, Comma separated)</label>
            <input 
              type="text" 
              value={answers} 
              onChange={(e) => setAnswers(e.target.value)}
              placeholder="e.g., 2, 3, 5, 8 (Leave blank for Open Ended)"
              style={{width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px'}}
            />
            <p style={{fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px'}}>If blank, AI requires scratchpad photo upload by default.</p>
          </div>

          <button type="submit" className="btn btn-primary" style={{marginTop: '10px', display: 'flex', justifyContent: 'center'}}>
            <i className="fa-solid fa-plus" style={{marginRight: '8px'}}></i> Inject to Database
          </button>
        </form>
      </div>
    </div>
  );
}
