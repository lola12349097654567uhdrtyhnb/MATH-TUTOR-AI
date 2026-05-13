'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Questionnaire() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    preferred_method: 'visual',
    pacing: 'balanced',
    confidence: 'medium',
    confidence_algebra: 'medium',
    support_level: 'moderate',
    hint_style: 'step_by_step'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkRole() {
      const sesh = await fetch('/api/auth/session');
      if (sesh.ok) {
        const seshData = await sesh.json();
        if (seshData.role === 'instructor') {
          router.push('/instructor/overview');
        }
      }
    }
    checkRole();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/student/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      router.push('/select-targets');
    } else {
      alert("Failed to save profile.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-center-wrapper">
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card">
          <h1 className="title" style={{textAlign: 'center', marginBottom: '8px'}}>Learning Profile</h1>
        <p className="section-note">Tell us about how you learn best so the AI can adapt to you across all subjects.</p>
        
        <form className="form-container" onSubmit={saveProfile}>
          <div className="form-group">
            <label>How do you prefer to learn?</label>
            <select name="preferred_method" value={formData.preferred_method} onChange={handleChange}>
              <option value="visual">Visually (Pictures and diagrams)</option>
              <option value="text">Textually (Step-by-step reading)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preferred pacing</label>
            <select name="pacing" value={formData.pacing} onChange={handleChange}>
              <option value="slow">Slow and steady (More practice)</option>
              <option value="balanced">Balanced</option>
              <option value="fast">Fast (Quick progression)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Confidence in Fractions</label>
            <select name="confidence" value={formData.confidence} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Confidence in Algebraic Equations</label>
            <select name="confidence_algebra" value={formData.confidence_algebra} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Required support level</label>
            <select name="support_level" value={formData.support_level} onChange={handleChange}>
              <option value="high">High support</option>
              <option value="moderate">Moderate support</option>
              <option value="low">Low support (Independent)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preferred hint style</label>
            <select name="hint_style" value={formData.hint_style} onChange={handleChange}>
              <option value="step_by_step">Step-by-step logic</option>
              <option value="real_world">Real world analogies</option>
              <option value="visual">Visual representations</option>
            </select>
          </div>

          <div className="actions" style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Save Profile & Continue'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
