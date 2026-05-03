'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isInstructor, setIsInstructor] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: isInstructor ? 'instructor' : 'student' })
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
            
            <div className="form-group" style={{marginBottom: '24px'}}>
              <label>Password</label>
              <input type="password" placeholder="Choose a secure password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="form-group" style={{marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <input type="checkbox" id="isInstructor" checked={isInstructor} onChange={(e) => setIsInstructor(e.target.checked)} style={{width: 'auto', margin: 0}} />
              <label htmlFor="isInstructor" style={{margin: 0, fontWeight: 400}}>Register as an Instructor (Demo Only)</label>
            </div>

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
