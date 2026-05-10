'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('session_user', data.username);
      }
      if (data.role === 'instructor') {
        router.push('/instructor/overview');
      } else if (!data.profile_configured) {
        router.push('/questionnaire');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="auth-center-wrapper">
      <div className="container" style={{maxWidth: '460px'}}>
        <div className="card">
          <div style={{textAlign: 'center', marginBottom: '24px'}}>
            <h1 className="title">Math Tutor AI</h1>
            <p className="section-note" style={{marginTop: '8px'}}>Log in to resume your learning journey.</p>
          </div>
          
          {error && <p className="status warn show" style={{marginBottom: '20px'}}>{error}</p>}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{marginBottom: '16px'}}>
              <label>Email Address</label>
              <input type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            <div className="form-group" style={{marginBottom: '24px'}}>
              <label>Password</label>
              <input type="password" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{width: '100%', justifyContent: 'center'}}>
              Sign In
            </button>
          </form>

          <p style={{marginTop: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem'}}>
            Don't have an account? <Link href="/signup" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: 600}}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
