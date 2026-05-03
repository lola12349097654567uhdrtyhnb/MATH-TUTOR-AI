'use client';
import { useState, useEffect } from 'react';

export default function InstructorReviewGallery() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, archived, cleared
  const [remarkText, setRemarkText] = useState({});
  const [revealedImages, setRevealedImages] = useState({});

  useEffect(() => {
    async function fetchStudents() {
      const res = await fetch('/api/instructor/overview');
      if (res.ok) {
        const data = await res.json();
        // Just extract student objects mapping from the overview payload if available, or fetch all from overview
        // Wait, Overview only returns counts. Let's hit the new Review API without target to get ALL submissions and extract distinct students
      }
    }
    fetchAllSubmissions();
  }, []);

  async function fetchAllSubmissions() {
    setLoading(true);
    const res = await fetch('/api/instructor/review');
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data.submissions || []);
      
      // Extract unique students from the submission pool
      const uniqueStudents = [...new Set((data.submissions || []).map(s => s.username))];
      setStudents(uniqueStudents);
    }
    setLoading(false);
  }

  const handleAction = async (sub, actionType) => {
    if (actionType !== 'add_remark' && actionType !== 'archive') {
      if (!confirm(`Are you sure you want to Override mastery for ${sub.username}?`)) return;
    }
    
    const payload = {
      targetUsername: sub.username,
      activityId: sub._id,
      topic: sub.topic,
      action: actionType,
      remarkText: remarkText[sub._id]
    };

    const res = await fetch('/api/instructor/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(`Action '${actionType}' successful!`);
      fetchAllSubmissions(); // Refresh list
    }
  };

  const toggleReveal = (id) => {
    setRevealedImages(prev => ({...prev, [id]: !prev[id]}));
  };

  if (loading) return <div className="container">Loading Audit Queue...</div>;

  const filteredSubmissions = submissions.filter(sub => {
    if (selectedStudent && sub.username !== selectedStudent) return false;
    if (filter === 'active') return !sub.archived && !sub.cleared;
    if (filter === 'archived') return sub.archived;
    if (filter === 'cleared') return sub.cleared && !sub.archived;
    return true;
  });

  return (
    <div className="container" style={{maxWidth: '1200px'}}>
      <header className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="title">Scratchpad Audit Queue</h1>
          <p className="subtitle">Drill down into student workspaces and review their trace logs.</p>
        </div>
        <div style={{display: 'flex', gap: '8px'}}>
          <button className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('active')}>Needs Grading</button>
          <button className={`btn ${filter === 'cleared' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('cleared')}>Cleared</button>
          <button className={`btn ${filter === 'archived' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('archived')}>Archived</button>
        </div>
      </header>

      <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
        {/* Sidebar for Students */}
        <div className="card" style={{flex: '1 1 200px', alignSelf: 'flex-start'}}>
          <h3 style={{margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px'}}>Student Filter</h3>
          <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <li 
              onClick={() => setSelectedStudent(null)}
              style={{padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', background: !selectedStudent ? 'var(--primary)' : 'transparent'}}
            >
              All Students
            </li>
            {students.map(uname => (
              <li 
                key={uname} 
                onClick={() => setSelectedStudent(uname)}
                style={{padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', background: selectedStudent === uname ? 'rgba(139, 92, 246, 0.2)' : 'transparent'}}
              >
                <i className="fa-solid fa-user" style={{marginRight: '8px', color: 'var(--muted)'}}></i> {uname}
              </li>
            ))}
          </ul>
        </div>

        {/* Tickets */}
        <div style={{flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
          {filteredSubmissions.length === 0 ? (
            <div className="card" style={{textAlign: 'center', padding: '40px', color: 'var(--muted)'}}>
              <i className="fa-solid fa-box-open" style={{fontSize: '2rem', marginBottom: '16px'}}></i>
              <p>No tickets found in this view.</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => (
              <div key={sub._id} className="card" style={{borderTop: `4px solid ${sub.cleared ? 'var(--success-text)' : 'var(--primary)'}`, padding: '24px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
                  <div>
                    <h3 style={{margin: 0, color: 'var(--primary)'}}>🎟️ Student: {sub.username}</h3>
                    <p style={{margin: '4px 0 0', color: 'var(--muted)'}}>{new Date(sub.createdAt).toLocaleString()}</p>
                  </div>
                  <span style={{background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem'}}>
                    {(sub.topic || 'unknown').toUpperCase()}
                  </span>
                </div>

                <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
                  <p style={{margin: '0 0 12px'}}><strong style={{color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem'}}>Historical Context</strong></p>
                  {sub.details?.original_question_id ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      <div style={{background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--muted)'}}>
                        <p style={{margin: 0, fontStyle: 'italic', color: '#e5e7eb'}}>{sub.details.original_question_text || sub.details.original_question_id}</p>
                      </div>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
                        <p style={{margin: 0, fontSize: '0.9rem'}}><strong style={{color: 'var(--muted)'}}>Options:</strong> {(sub.details.options || []).join(', ') || 'Open ended'}</p>
                        <p style={{margin: 0, fontSize: '0.9rem'}}><strong style={{color: 'var(--muted)'}}>Student Guessed:</strong> <strong style={{color: 'var(--warn-text)', background: 'rgba(255,68,68,0.1)', padding: '2px 8px', borderRadius: '4px'}}>{sub.details.student_guess || 'None'}</strong></p>
                      </div>
                    </div>
                  ) : (
                    <p style={{margin: 0, fontStyle: 'italic', color: 'var(--muted)'}}>No MCQ preceding context found. (Diagnostic Mode)</p>
                  )}
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
                  <div>
                    <h4 style={{margin: 0}}>AI Verdict: <span style={{color: sub.details?.is_valid_math ? 'var(--success-text)' : 'var(--warn-text)'}}>{sub.details?.is_valid_math ? 'ACCEPTED (Working Out Sound)' : 'REJECTED (Flawed Math)'}</span></h4>
                  </div>
                  <button onClick={() => toggleReveal(sub._id)} className="btn btn-secondary">
                    {revealedImages[sub._id] ? <><i className="fa-solid fa-eye-slash"></i> Hide Image</>  : <><i className="fa-solid fa-eye"></i> Check Working Out</>}
                  </button>
                </div>

                {revealedImages[sub._id] && (
                  <div style={{marginBottom: '24px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
                    {sub.details && sub.details.image_trace ? (
                      <div>
                        <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '12px'}}>
                          <a href={sub.details.image_trace} download={`scratchpad_${sub.username}_${sub._id}.png`} className="btn btn-secondary" style={{padding: '6px 12px', fontSize: '0.9rem'}}>
                            <i className="fa-solid fa-download"></i> Download Image
                          </a>
                        </div>
                        <img src={sub.details.image_trace} style={{width: '100%', maxWidth: '600px', borderRadius: '8px', display: 'block', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'}} />
                      </div>
                    ) : (
                      <p style={{textAlign: 'center', margin: 0, color: 'var(--muted)'}}>Image data legally expired or missing.</p>
                    )}
                  </div>
                )}

                {/* Instructor Action Panel */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px'}}>
                  <p style={{margin: 0, fontWeight: 600}}>Instructor Actions:</p>
                  
                  <div style={{display: 'flex', gap: '8px'}}>
                    <input 
                      type="text" 
                      placeholder="Optional Remark to send to student..." 
                      value={remarkText[sub._id] || ''} 
                      onChange={(e) => setRemarkText({...remarkText, [sub._id]: e.target.value})}
                      style={{flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff'}}
                    />
                    <button onClick={() => handleAction(sub, 'add_remark')} className="btn btn-primary">Send Remark</button>
                  </div>

                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px'}}>
                    <button onClick={() => handleAction(sub, 'grant_mastery')} className="btn btn-secondary" style={{color: 'var(--success-text)'}}>
                      <i className="fa-solid fa-check"></i> Mark Correct & Clear
                    </button>
                    <button onClick={() => handleAction(sub, 'penalize')} className="btn btn-secondary" style={{color: 'var(--warn-text)'}}>
                      <i className="fa-solid fa-xmark"></i> Mark Incorrect & Clear
                    </button>
                    <button onClick={() => handleAction(sub, 'archive')} className="btn btn-secondary">
                      <i className="fa-solid fa-box-archive"></i> Archive Image
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
