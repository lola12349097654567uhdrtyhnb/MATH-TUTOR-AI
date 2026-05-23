export function IntroScreen({
  topic,
  remedialFeedback,
  data,
  continueFromVideo
}) {
  return (
    <section className="card fade-enter-active">
      <h2 className="section-title" style={{textTransform: 'capitalize'}}>{topic} • Concept Review</h2>
      {remedialFeedback ? (
        <div style={{backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--warn-text)', padding: '15px', borderRadius: '10px', marginBottom: '20px'}}>
          <h3 style={{color: 'var(--warn-text)', fontSize: '1rem', marginBottom: '5px'}}><i className="fa-solid fa-triangle-exclamation"></i> AI Evaluation Feedback</h3>
          <p style={{color: '#d1d5db'}}>{remedialFeedback}</p>
        </div>
      ) : (
        <p className="section-note">Based on your recent progress, we recommend reviewing this topic to reinforce your fundamental logic.</p>
      )}
      <div className="actions" style={{marginTop: '20px'}}>
        <button className="btn btn-primary" onClick={continueFromVideo}><i className="fa-solid fa-play"></i> Return to Practice</button>
      </div>
    </section>
  );
}
