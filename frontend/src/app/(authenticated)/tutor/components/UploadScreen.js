import { useState } from 'react';
import { MathText } from './Shared';
import { useWhiteboard } from '../hooks/useWhiteboard';

export function UploadScreen({
  topic,
  currentAction,
  submitUpload,
  feedback,
  isActive
}) {
  const [uploadMode, setUploadMode] = useState('camera');
  const { canvasRef, startDrawing, draw, stopDrawing, clearWhiteboard } = useWhiteboard(isActive && uploadMode === 'whiteboard');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let fileToUpload = null;
    
    if (uploadMode === 'camera') {
      fileToUpload = e.target.elements.file?.files[0];
    } else {
      if (!canvasRef.current) return;
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'));
      if (blob) {
        fileToUpload = new File([blob], 'whiteboard.png', { type: 'image/png' });
      }
    }
    
    submitUpload(fileToUpload);
  };

  return (
    <section className="card fade-enter-active" style={{textAlign: 'center'}}>
      <h2 className="section-title" style={{color: 'var(--warn-text)'}}><i className="fa-solid fa-hand"></i> Stop! Show your work!</h2>
      <p className="section-note">You've answered 5 questions. To prove you aren't just guessing, upload a photo of your scratchpad mathematically solving this specific question:</p>
      <div className="question-box" style={{margin: '20px 0'}}>
        <p style={{fontSize: '1.2rem', fontWeight: 600}}><MathText content={currentAction?.question_text} /></p>
      </div>
      
      <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'left'}}>
        <h4 style={{color: 'var(--heading)', marginBottom: '10px', fontSize: '0.9rem'}}><i className="fa-solid fa-camera"></i> Photo Guidelines</h4>
        <ul style={{color: 'var(--text)', fontSize: '0.9rem', paddingLeft: '20px', margin: 0}}>
          <li style={{marginBottom: '5px'}}>Ensure the room is well-lit without dark shadows over the paper.</li>
          <li style={{marginBottom: '5px'}}>Write slowly and clearly step-by-step so the AI can trace your logic.</li>
          <li style={{marginBottom: '5px'}}>Make sure the entire equation to the final answer is visible in the frame.</li>
          {topic === 'geometry' && (
            <li>
              <strong style={{color: 'var(--warn-text)'}}>Geometry Rule:</strong> You must explicitly write the formal formula on paper before solving. You can use any custom letters (e.g. x, y) as long as you write what they mean (e.g. x=height). Standard letters (r for radius, h for height, b for base, or any letters for Pythagorean theorem) do not need clarification.
            </li>
          )}
        </ul>
      </div>

      <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px'}}>
        <button className={`btn ${uploadMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('camera')}>
          <i className="fa-solid fa-camera"></i> Take Photo
        </button>
        <button className={`btn ${uploadMode === 'whiteboard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('whiteboard')}>
          <i className="fa-solid fa-pen-nib"></i> Draw on Screen
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {uploadMode === 'camera' ? (
          <input type="file" name="file" accept="image/*" capture="environment" style={{display: 'block', margin: '0 auto 20px'}} required />
        ) : (
          <div style={{marginBottom: '20px'}}>
            <div style={{width: '100%', overflow: 'hidden', borderRadius: '12px', border: '3px solid #b8c6df'}}>
              <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                style={{touchAction: 'none', background: '#fff', cursor: 'crosshair', width: '100%', height: 'auto', display: 'block'}}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerOut={stopDrawing}
              />
            </div>
            <div style={{marginTop: '10px'}}>
              <button type="button" className="btn btn-secondary" onClick={clearWhiteboard} style={{padding: '8px 16px', fontSize: '0.9rem'}}>
                <i className="fa-solid fa-eraser"></i> Clear Screen
              </button>
            </div>
          </div>
        )}

        {feedback.text && <p className={`status show ${feedback.type}`}>{feedback.text}</p>}
        <div className="actions" style={{justifyContent: 'center'}}>
          <button type="submit" className="btn btn-primary"><i className="fa-solid fa-cloud-arrow-up"></i> Upload to AI Grader</button>
        </div>
      </form>
    </section>
  );
}
