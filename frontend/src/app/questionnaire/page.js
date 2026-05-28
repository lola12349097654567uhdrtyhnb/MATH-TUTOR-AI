'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Questionnaire() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    preferred_method: 'visual',
    pacing: 'balanced',
    confidence: 'medium',            // Fractions
    confidence_algebra: 'medium',    // Algebra
    confidence_exponents: 'medium',  // Exponents
    confidence_geometry: 'medium',   // Geometry
    support_level: 'moderate',
    hint_style: 'step_by_step'
  });
  const [loading, setLoading] = useState(false);

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
    <div className="auth-center-wrapper" style={{ minHeight: '100vh', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '650px', width: '100%' }}>
        
        {/* Welcome & Website Guidelines Guide Card */}
        <div className="card fade-enter-active" style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.04))',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          marginBottom: '20px', 
          padding: '24px', 
          borderRadius: '16px' 
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}>
            <i className="fa-solid fa-graduation-cap"></i> Welcome to your AI Math Tutor!
          </h2>
          <p style={{ color: '#d1d5db', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 16px' }}>
            We are excited to help you master math! Here is a super quick guide on how to use this website:
          </p>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '6px 10px', borderRadius: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>1</div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                <strong>Starting Out:</strong> You will begin with a quick 4-question check to help us find your starting level.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '6px 10px', borderRadius: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>2</div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                <strong>Practice Math:</strong> You will solve questions one at a time. If you make a mistake, don't worry! You can try again until you get it right.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '6px 10px', borderRadius: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>3</div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                <strong>Need a Hint?</strong> You can click the <em>"Need a Hint"</em> button anytime. If you struggle, the AI Tutor will step in to work out the equation with you step-by-step!
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '6px 10px', borderRadius: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>4</div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                <strong>Check Progress:</strong> Complete your assessments and check your scores to see how much your math skills have grown!
              </p>
            </div>
          </div>
        </div>

        {/* Questionnaire Form Card */}
        <div className="card fade-enter-active" style={{ padding: '30px', borderRadius: '16px' }}>
          <h1 className="title" style={{ textAlign: 'center', marginBottom: '6px', fontSize: '1.6rem' }}>Create Your Learning Profile</h1>
          <p className="section-note" style={{ textAlign: 'center', marginBottom: '25px', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Tell us how you like to learn so we can customize your math experience!
          </p>
          
          <form className="form-container" onSubmit={saveProfile} style={{ display: 'grid', gap: '20px' }}>
            
            <div className="form-group">
              <label style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>How do you prefer to learn math?</label>
              <select name="preferred_method" value={formData.preferred_method} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>
                <option value="visual">With pictures, diagrams, and shapes!</option>
                <option value="text">With step-by-step reading and text!</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>How fast do you like to practice math?</label>
              <select name="pacing" value={formData.pacing} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>
                <option value="slow">Slow and steady (I like lots of practice!)</option>
                <option value="balanced">Balanced and normal pace</option>
                <option value="fast">Fast (I like to move quickly!)</option>
              </select>
            </div>

            {/* Topic Confidence Levels (4 Topics) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              
              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Fractions (like 1/2 or 3/4)</label>
                <select name="confidence" value={formData.confidence} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px' }}>
                  <option value="low">Still learning! (Low)</option>
                  <option value="medium">I'm okay! (Medium)</option>
                  <option value="high">I'm a pro! (High)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Algebra (like 3x + 5 = 11)</label>
                <select name="confidence_algebra" value={formData.confidence_algebra} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px' }}>
                  <option value="low">Still learning! (Low)</option>
                  <option value="medium">I'm okay! (Medium)</option>
                  <option value="high">I'm a pro! (High)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Exponents (like x2 or b12)</label>
                <select name="confidence_exponents" value={formData.confidence_exponents} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px' }}>
                  <option value="low">Still learning! (Low)</option>
                  <option value="medium">I'm okay! (Medium)</option>
                  <option value="high">I'm a pro! (High)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Geometry (shapes & areas)</label>
                <select name="confidence_geometry" value={formData.confidence_geometry} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px' }}>
                  <option value="low">Still learning! (Low)</option>
                  <option value="medium">I'm okay! (Medium)</option>
                  <option value="high">I'm a pro! (High)</option>
                </select>
              </div>

            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>How much help do you want from the AI Tutor?</label>
              <select name="support_level" value={formData.support_level} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>
                <option value="high">Lots of help! (High support)</option>
                <option value="moderate">A normal amount (Moderate support)</option>
                <option value="low">I want to solve them on my own! (Low support)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>What kind of hints help you learn best?</label>
              <select name="hint_style" value={formData.hint_style} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>
                <option value="step_by_step">Step-by-step rules (Explain the math)</option>
                <option value="real_world">Real-world stories (Everyday analogies)</option>
                <option value="visual">Pictures and shapes (Visual help)</option>
              </select>
            </div>

            <div className="actions" style={{ marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: '600', borderRadius: '8px' }} disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Save Profile & Continue'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
