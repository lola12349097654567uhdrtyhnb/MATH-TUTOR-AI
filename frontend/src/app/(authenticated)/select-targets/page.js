'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SelectTargets() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (topics) => {
    setLoading(true);
    const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
    
    const res = await fetch('/api/student/targets', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': userHeader
      },
      body: JSON.stringify({ target_topics: topics })
    });
    
    if (res.ok) {
      router.push('/assessment?type=pre');
    } else {
      alert("Failed to save selection.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-center-wrapper">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card" style={{textAlign: 'center', padding: '40px 20px'}}>
          <h1 className="title" style={{marginBottom: '10px'}}>Choose Your Learning Path</h1>
          <p className="section-note" style={{marginBottom: '40px'}}>
            Select the two topics you want to focus on mastering. You will take a quick pre-assessment to gauge your starting level.
          </p>
          
          <div className="grid">
            <section 
              className="card card-hoverable" 
              style={{cursor: 'pointer', padding: '30px 20px', border: '2px solid transparent'}}
              onClick={() => handleSelect(['algebra', 'fractions'])}
            >
              <div className="icon-wrapper" style={{marginBottom: '20px'}}>
                <i className="fa-solid fa-shapes"></i> <i className="fa-solid fa-plus" style={{margin: '0 10px', fontSize: '1rem', opacity: 0.5}}></i> <i className="fa-solid fa-square-root-variable"></i>
              </div>
              <h2 className="section-title">Algebra & Fractions</h2>
              <p className="section-note">Focus on core algebraic equations and mastering fractional math.</p>
              <button className="btn btn-primary" style={{marginTop: '20px', width: '100%'}} disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Select Path'}
              </button>
            </section>

            <section 
              className="card card-hoverable" 
              style={{cursor: 'pointer', padding: '30px 20px', border: '2px solid transparent'}}
              onClick={() => handleSelect(['exponents', 'geometry'])}
            >
              <div className="icon-wrapper" style={{marginBottom: '20px'}}>
                <i className="fa-solid fa-superscript"></i> <i className="fa-solid fa-plus" style={{margin: '0 10px', fontSize: '1rem', opacity: 0.5}}></i> <i className="fa-solid fa-cube"></i>
              </div>
              <h2 className="section-title">Exponents & Geometry</h2>
              <p className="section-note">Focus on the laws of exponents and spatial geometry problems.</p>
              <button className="btn btn-primary" style={{marginTop: '20px', width: '100%'}} disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Select Path'}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
