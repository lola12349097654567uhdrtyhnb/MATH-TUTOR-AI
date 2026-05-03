import { MathText } from './Shared';

export function DiagnosticScreen({ 
  diagnosticIndex, 
  diagnosticTotal, 
  currentAction, 
  selectedAnswer, 
  setSelectedAnswer, 
  submitDiagnosticAnswer, 
  feedback 
}) {
  return (
    <section className="card fade-enter-active">
      <h2 className="section-title">Initial Mastery Check</h2>
      <p className="section-note">Answer a few quick questions so we can set your starting level.</p>
      <span className="progress-chip">Question {diagnosticIndex} of {diagnosticTotal}</span>
      <div className="question-box" style={{marginTop: '12px'}}>
        <p className="question-label">Diagnostic Question</p>
        <p className="question-text"><MathText content={currentAction?.content} /></p>
      </div>
      <div className="form-group" style={{marginTop: '14px'}}>
        <label>Your answer</label>
        <div className="mcq-grid">
          {currentAction?.options?.map(opt => (
            <button key={opt} className={`mcq-btn ${selectedAnswer === opt ? 'selected' : ''}`} onClick={() => setSelectedAnswer(opt)}>
              <MathText content={opt} />
            </button>
          ))}
        </div>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={submitDiagnosticAnswer}><i className="fa-solid fa-paper-plane"></i> Submit Answer</button>
      </div>
      {feedback.text && <p className={`status show ${feedback.type}`}>{feedback.text}</p>}
    </section>
  );
}
