import { useRouter } from 'next/navigation';

export function GraduatedScreen({ setUiState, setQuestionStartTime }) {
  const router = useRouter();
  
  return (
    <section className="card fade-enter-active" style={{textAlign: 'center', borderColor: 'var(--success-text)', background: 'linear-gradient(135deg, rgba(67, 181, 129, 0.1), rgba(0,0,0,0.4))'}}>
      <h2 className="section-title" style={{color: 'var(--success-text)', fontSize: '2.5rem', marginBottom: '10px'}}><i className="fa-solid fa-trophy"></i> Mastery Achieved!</h2>
      <p className="section-note" style={{fontSize: '1.1rem', color: '#fff'}}>You have perfectly conquered the Master-level metrics for this subject.</p>
      <div className="actions" style={{justifyContent: 'center', margin: '30px auto 0', gap: '20px', maxWidth: '400px'}}>
        <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}><i className="fa-solid fa-house"></i> Return to Dashboard</button>
        <button className="btn btn-primary" onClick={() => {
          setUiState('practice');
          setQuestionStartTime(Date.now());
        }}>
          <i className="fa-solid fa-infinity"></i> Keep Practicing
        </button>
      </div>
    </section>
  );
}
