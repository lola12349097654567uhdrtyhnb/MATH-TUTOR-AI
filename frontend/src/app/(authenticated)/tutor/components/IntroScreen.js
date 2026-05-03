export function IntroScreen({
  topic,
  remedialFeedback,
  data,
  continueFromVideo
}) {
  return (
    <section className="card fade-enter-active">
      <h2 className="section-title" style={{textTransform: 'capitalize'}}>{topic} • Video Review</h2>
      {remedialFeedback ? (
        <div style={{backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--warn-text)', padding: '15px', borderRadius: '10px', marginBottom: '20px'}}>
          <h3 style={{color: 'var(--warn-text)', fontSize: '1rem', marginBottom: '5px'}}><i className="fa-solid fa-triangle-exclamation"></i> AI Evaluation Feedback</h3>
          <p style={{color: '#d1d5db'}}>{remedialFeedback}</p>
        </div>
      ) : (
        <p className="section-note">Based on your recent progress, we recommend re-watching this highly targeted lesson to reinforce your fundamental logic.</p>
      )}
      {data?.video_url && (
        <div style={{border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)'}}>
          {data.video_url.endsWith('.mp4') ? (
            <video width="100%" height="420" src={data?.video_url} controls style={{display: 'block'}}></video>
          ) : (
            <iframe width="100%" height="420" src={data?.video_url} title="Topic video" frameBorder="0" allowFullScreen></iframe>
          )}
        </div>
      )}
      <div className="actions">
        <button className="btn btn-primary" onClick={continueFromVideo}><i className="fa-solid fa-play"></i> Return to Practice</button>
      </div>
    </section>
  );
}
