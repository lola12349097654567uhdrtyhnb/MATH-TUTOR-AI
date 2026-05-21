import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const { 
    canvasRef, 
    isEraser, 
    setIsEraser, 
    startDrawing, 
    draw, 
    stopDrawing, 
    clearWhiteboard 
  } = useWhiteboard(isActive && uploadMode === 'whiteboard');

  const toggleFullscreen = () => {
    if (canvasRef.current) {
      // Snapshot current whiteboard contents
      const dataUrl = canvasRef.current.toDataURL();
      setIsFullscreen(prev => {
        const next = !prev;
        // Wait for next render cycle to bind to new canvas
        setTimeout(() => {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const img = new Image();
            img.onload = () => {
              // Fill with background color first
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              // Draw back the snapshotted content
              ctx.drawImage(img, 0, 0);
            };
            img.src = dataUrl;
          }
        }, 50);
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    let fileToUpload = null;
    
    if (uploadMode === 'camera') {
      fileToUpload = e.target.elements?.file?.files?.[0];
    } else {
      if (!canvasRef.current) return;
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'));
      if (blob) {
        fileToUpload = new File([blob], 'whiteboard.png', { type: 'image/png' });
      }
    }
    
    setIsFullscreen(false);
    submitUpload(fileToUpload);
  };

  // Fullscreen Modal rendered via React Portal
  const renderFullscreenModal = () => {
    if (!mounted || !isFullscreen) return null;
    return createPortal(
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(11, 15, 23, 0.98)',
        backdropFilter: 'blur(16px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {/* Fullscreen Header */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '15px',
          marginBottom: '10px',
          textAlign: 'left'
        }}>
          <h3 style={{margin: '0 0 5px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600}}>
            <i className="fa-solid fa-clipboard-question"></i> Solve this question:
          </h3>
          <p style={{margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#ffffff'}}>
            <MathText content={currentAction?.question_text} />
          </p>
        </div>

        {/* Dynamic Canvas Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          overflow: 'hidden',
          backgroundColor: '#161b26',
          borderRadius: '16px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          margin: '10px 0',
          position: 'relative'
        }}>
          <canvas 
            ref={canvasRef}
            width={800}
            height={600}
            style={{
              touchAction: 'none',
              background: '#ffffff',
              cursor: 'crosshair',
              width: '100%',
              height: '100%',
              display: 'block',
              borderRadius: '12px'
            }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerOut={stopDrawing}
          />
        </div>

        {/* Toolbar Controls */}
        <div style={{
          marginTop: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{display: 'flex', gap: '8px'}}>
            <button 
              type="button" 
              className={`btn ${!isEraser ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setIsEraser(false)}
              style={{padding: '10px 20px', fontSize: '0.95rem'}}
            >
              <i className="fa-solid fa-pen"></i> Pen Brush
            </button>
            <button 
              type="button" 
              className={`btn ${isEraser ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setIsEraser(true)}
              style={{padding: '10px 20px', fontSize: '0.95rem'}}
            >
              <i className="fa-solid fa-eraser"></i> Eraser Brush
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={clearWhiteboard}
              style={{padding: '10px 20px', fontSize: '0.95rem', color: 'var(--warn-text)'}}
            >
              <i className="fa-solid fa-trash-can"></i> Clear All
            </button>
          </div>
          
          <div style={{display: 'flex', gap: '8px'}}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={toggleFullscreen}
              style={{padding: '10px 20px', fontSize: '0.95rem'}}
            >
              <i className="fa-solid fa-compress"></i> Minimize
            </button>
            <button 
              type="button" 
              onClick={() => handleSubmit()}
              className="btn btn-primary"
              style={{padding: '10px 24px', fontSize: '0.95rem'}}
            >
              <i className="fa-solid fa-circle-check"></i> Submit to AI
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <section className="card fade-enter-active" style={{textAlign: 'center'}}>
      {renderFullscreenModal()}
      
      <h2 className="section-title" style={{color: 'var(--warn-text)'}}><i className="fa-solid fa-hand"></i> Stop! Show your work!</h2>
      <p className="section-note">To ensure you aren't just guessing, upload a photo of your scratchpad or draw your step-by-step mathematical logic below:</p>
      
      <div className="question-box" style={{margin: '20px 0'}}>
        <p style={{fontSize: '1.2rem', fontWeight: 600}}><MathText content={currentAction?.question_text} /></p>
      </div>
      
      <div style={{backgroundColor: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'left'}}>
        <h4 style={{color: 'var(--heading)', marginBottom: '10px', fontSize: '0.9rem'}}><i className="fa-solid fa-camera"></i> Work Guidelines</h4>
        <ul style={{color: 'var(--text)', fontSize: '0.9rem', paddingLeft: '20px', margin: 0}}>
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
          <>
            <input type="file" name="file" accept="image/*" capture="environment" style={{display: 'block', margin: '0 auto 20px'}} required />
            {feedback.text && <p className={`status show ${feedback.type}`}>{feedback.text}</p>}
            <div className="actions" style={{justifyContent: 'center'}}>
              <button type="submit" className="btn btn-primary"><i className="fa-solid fa-cloud-arrow-up"></i> Upload to AI Grader</button>
            </div>
          </>
        ) : (
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <div style={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: '12px',
              border: '3px solid #b8c6df',
              position: 'relative'
            }}>
              <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                style={{
                  touchAction: 'none',
                  background: '#ffffff',
                  cursor: 'crosshair',
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerOut={stopDrawing}
              />
            </div>
            
            <div style={{
              marginTop: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  type="button" 
                  className={`btn ${!isEraser ? 'btn-primary' : 'btn-secondary'}`} 
                  onClick={() => setIsEraser(false)}
                  style={{padding: '8px 16px', fontSize: '0.9rem'}}
                >
                  <i className="fa-solid fa-pen"></i> Pen Brush
                </button>
                <button 
                  type="button" 
                  className={`btn ${isEraser ? 'btn-primary' : 'btn-secondary'}`} 
                  onClick={() => setIsEraser(true)}
                  style={{padding: '8px 16px', fontSize: '0.9rem'}}
                >
                  <i className="fa-solid fa-eraser"></i> Eraser Brush
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={clearWhiteboard}
                  style={{padding: '8px 16px', fontSize: '0.9rem', color: 'var(--warn-text)'}}
                >
                  <i className="fa-solid fa-trash-can"></i> Clear All
                </button>
              </div>
              
              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={toggleFullscreen}
                  style={{padding: '8px 16px', fontSize: '0.9rem'}}
                >
                  <i className="fa-solid fa-expand"></i> Fullscreen
                </button>
              </div>
            </div>

            {feedback.text && <p className={`status show ${feedback.type}`} style={{marginTop: '15px'}}>{feedback.text}</p>}
            
            <div className="actions" style={{justifyContent: 'center', marginTop: '20px'}}>
              <button type="submit" className="btn btn-primary"><i className="fa-solid fa-cloud-arrow-up"></i> Upload to AI Grader</button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
