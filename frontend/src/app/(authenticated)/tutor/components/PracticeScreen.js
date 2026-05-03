import { MathText, VisualHintArea } from './Shared';

export function PracticeScreen({
  topic,
  currentAction,
  selectedAnswer,
  setSelectedAnswer,
  submitPracticeAnswer,
  requestHint,
  feedback,
  visualData
}) {
  return (
    <section className="card fade-enter-active">
      <div className="practice-layout">
        <div className="question-box">
          <p className="question-label" style={{textTransform: 'capitalize'}}>Current Question • {topic}</p>
          <p className="question-text"><MathText content={currentAction?.content} /></p>
        </div>

        <div className="form-group">
          <label>Student answer</label>
          <div className="mcq-grid">
            {currentAction?.options?.map(opt => (
              <button key={opt} className={`mcq-btn ${selectedAnswer === opt ? 'selected' : ''}`} onClick={() => setSelectedAnswer(opt)}>
                <MathText content={opt} />
              </button>
            ))}
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={submitPracticeAnswer}><i className="fa-solid fa-paper-plane"></i> Submit Answer</button>
          <button className="btn btn-secondary" onClick={requestHint}><i className="fa-solid fa-lightbulb"></i> Need a Hint</button>
        </div>

        {feedback.text && <p className={`status show ${feedback.type}`}>{feedback.text}</p>}
        <VisualHintArea visual={visualData} currentTopic={topic} />
      </div>
    </section>
  );
}
