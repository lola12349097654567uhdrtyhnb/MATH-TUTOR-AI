'use client';

import { useState, useEffect } from 'react';

export default function EditProfile() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch('/api/student/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.learning_profile);
      }
    }
    fetchProfile();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedProfile = {
      learning_style: formData.get('learning_style'),
      pacing: formData.get('pacing'),
      confidence_level: formData.get('confidence_level'),
    };

    const res = await fetch('/api/student/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile)
    });

    if (res.ok) {
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!profile) return <div className="container">Loading profile...</div>;

  return (
    <div className="container" style={{maxWidth: '800px', margin: '0 auto'}}>
      <header className="page-header">
        <h1 className="title">Edit Profile</h1>
        <p className="subtitle">Adjust your learning configurations so the AI can best adapt to you.</p>
      </header>
      
      <section className="card">
        {message && <p className="status show success" style={{marginBottom: '20px'}}>{message}</p>}
        
        <form className="form-container" onSubmit={saveProfile}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>How do you learn best?</label>
            <select name="learning_style" defaultValue={profile.learning_style || 'visual'} required>
              <option value="visual">Visual (Diagrams, Colors, Spacing)</option>
              <option value="verbal">Verbal (Text explanations, step-by-step logic)</option>
              <option value="active">Active (Trial & Error, jumping straight to practice)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Preferred Pacing</label>
            <select name="pacing" defaultValue={profile.pacing || 'moderate'} required>
              <option value="slow">Step-by-Step (Lots of repetition to build confidence)</option>
              <option value="moderate">Balanced (A mix of practice and new concepts)</option>
              <option value="fast">Accelerated (I get bored easily, challenge me fast)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>How confident do you feel in Math generally?</label>
            <select name="confidence_level" defaultValue={profile.confidence_level || 'medium'} required>
              <option value="low">Low (I struggle and get anxious)</option>
              <option value="medium">Medium (I'm okay, but make mistakes)</option>
              <option value="high">High (I learn math quickly)</option>
            </select>
          </div>

          <div className="actions" style={{ marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary"><i className="fa-solid fa-floppy-disk"></i> Save Preferences</button>
          </div>
        </form>
      </section>
    </div>
  );
}
