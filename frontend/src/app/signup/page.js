'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('7');
  const [role, setRole] = useState('student');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, phone, grade: role === 'student' ? grade : '' })
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/login');
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="auth-center-wrapper">
      <div className="container" style={{maxWidth: '460px'}}>
        <div className="card">
          <div style={{textAlign: 'center', marginBottom: '24px'}}>
            <h1 className="title">Create Account</h1>
            <p className="section-note" style={{marginTop: '8px'}}>Create an account to track your progress.</p>
          </div>
          
          {error && <p className="status warn show" style={{marginBottom: '20px'}}>{error}</p>}

          <form onSubmit={handleSignup}>
            <div className="form-group" style={{marginBottom: '16px'}}>
              <label>Email Address</label>
              <input type="email" placeholder="Choose an email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            <div className="form-group" style={{marginBottom: '16px'}}>
              <label>Password</label>
              <input type="password" placeholder="Choose a secure password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="form-group" style={{marginBottom: '16px'}}>
              <label>Phone Number <span style={{color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 'normal'}}>(Optional - Yours or parent's)</span></label>
              <input type="text" placeholder="Enter phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="form-group" style={{marginBottom: '16px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.1)'}}>
              <label style={{color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                <i className="fa-solid fa-user-gear"></i> Account Type
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{background: 'var(--bg)'}}>
                <option value="student">I am a Student</option>
                <option value="instructor">I am an Instructor</option>
              </select>
              <p style={{fontSize: '0.8rem', color: 'var(--muted)', marginTop: '8px', marginLeft: '4px'}}>
                Choose "Instructor" if you are a teacher managing students.
              </p>
            </div>

            {role === 'student' && (
              <div className="form-group" style={{marginBottom: '32px', padding: '16px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.1)'}}>
                <label style={{color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                  <i className="fa-solid fa-graduation-cap"></i> School Grade Level
                </label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{background: 'var(--bg)'}}>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                </select>
                <p style={{fontSize: '0.8rem', color: 'var(--muted)', marginTop: '8px', marginLeft: '4px'}}>
                  Select your current grade. This helps customize cognitive maths modules.
                </p>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{width: '100%', justifyContent: 'center'}}>
              Create Account
            </button>
          </form>

          <p style={{marginTop: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem'}}>
            Already have an account? <Link href="/login" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: 600}}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
