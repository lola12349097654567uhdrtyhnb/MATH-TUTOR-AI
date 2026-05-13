'use client';

export default function InstructionsModal({ onAccept }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', color: '#fff', textAlign: 'center' }}>
          <i className="fa-solid fa-clipboard-list" style={{ color: '#6a8dff', marginRight: '10px' }}></i>
          Testing Instructions
        </h2>
        
        <p style={{ color: '#a0aec0', marginBottom: '20px', fontSize: '15px', lineHeight: '1.5' }}>
          Welcome to the AI Tutoring Platform! Before you begin, please read the following rules for this academic study:
        </p>

        <ul style={{ color: '#cbd5e1', marginBottom: '30px', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
          <li style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#ff6b6b' }}>No Calculators:</strong> All math problems must be worked out mentally or on your provided blank scratch paper. Do not use phones or any digital tools.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#43b581' }}>Show Your Work:</strong> During practice, you will be asked to take a photo of your paper to prove your work using the AI Grader.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#f5a623' }}>Don't Guess:</strong> In the Practice zone, use the <strong>Hint</strong> buttons if you are stuck. Do not guess blindly. In Assessments, just do your best.
          </li>
          <li>
            <strong style={{ color: '#6a8dff' }}>Take Your Time:</strong> This is not a race. Focus on understanding the steps.
          </li>
        </ul>

        <button 
          onClick={onAccept}
          className="btn btn-primary" 
          style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: '600' }}
        >
          I Understand & Agree
        </button>
      </div>
    </div>
  );
}
