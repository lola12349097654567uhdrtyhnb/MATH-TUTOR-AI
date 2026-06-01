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
  const [typedWork, setTypedWork] = useState('');
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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (blob) {
                try {
                  const compressedFile = new File([blob], file.name || 'camera.jpg', { type: 'image/jpeg' });
                  resolve(compressedFile);
                } catch (fileErr) {
                  // Fallback: iOS Safari compatibility, use blob directly
                  blob.name = file.name || 'camera.jpg';
                  resolve(blob);
                }
              } else {
                resolve(file);
              }
            }, 'image/jpeg', 0.8);
          } catch (canvasErr) {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (uploadMode === 'typed') {
      setIsFullscreen(false);
      submitUpload(typedWork, true, false);
      return;
    }

    let fileToUpload = null;
    if (uploadMode === 'camera') {
      const rawFile = e.target.elements?.file?.files?.[0];
      if (rawFile) {
        fileToUpload = await compressImage(rawFile);
      }
    } else {
      if (!canvasRef.current) return;
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'));
      if (blob) {
        fileToUpload = new File([blob], 'whiteboard.png', { type: 'image/png' });
      }
    }
    
    setIsFullscreen(false);
    submitUpload(fileToUpload, false, false);
  };

  const handleSkip = () => {
    setIsFullscreen(false);
    submitUpload('', false, true);
  };

  const getTopicTypingInstructions = () => {
    switch (topic) {
      case 'fractions':
        return (
          <div style={{ padding: '15px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', marginBottom: '15px', fontSize: '0.88rem' }}>
            <h4 style={{ margin: '0 0 8px', color: '#38bdf8', fontWeight: '700' }}><i className="fa-solid fa-keyboard"></i> Fractions Typing Rules:</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#d1d5db', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '4px' }}><strong>Division / Fraction:</strong> Use the forward slash <code>/</code> (e.g. type <code>3/4</code> for three-quarters).</li>
              <li style={{ marginBottom: '4px' }}><strong>Multiplication:</strong> Use the asterisk <code>*</code> or lowercase letter <code>x</code> (e.g. type <code>2/3 * 4/5</code> or <code>2/3 x 4/5</code>).</li>
              <li><strong>Mixed Numbers:</strong> Add a space between the whole number and fraction (e.g. type <code>1 1/2</code> for one and a half).</li>
            </ul>
          </div>
        );
      case 'algebra':
        return (
          <div style={{ padding: '15px', background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '12px', marginBottom: '15px', fontSize: '0.88rem' }}>
            <h4 style={{ margin: '0 0 8px', color: '#a78bfa', fontWeight: '700' }}><i className="fa-solid fa-keyboard"></i> Algebra Typing Rules:</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#d1d5db', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '4px' }}><strong>Variables:</strong> Use standard lowercase letters like <code>x</code>, <code>y</code>, or <code>a</code>.</li>
              <li style={{ marginBottom: '4px' }}><strong>Multiplication:</strong> Use the asterisk <code>*</code> or just write them together (e.g. type <code>3 * x</code> or <code>3x</code>).</li>
              <li><strong>Division:</strong> Use the forward slash <code>/</code> and use parentheses to group terms (e.g. type <code>(x + 2) / 3</code>).</li>
            </ul>
          </div>
        );
      case 'exponents':
        return (
          <div style={{ padding: '15px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '12px', marginBottom: '15px', fontSize: '0.88rem' }}>
            <h4 style={{ margin: '0 0 8px', color: '#fbbf24', fontWeight: '700' }}><i className="fa-solid fa-keyboard"></i> Exponents Typing Rules:</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#d1d5db', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '4px' }}><strong>Powers:</strong> Use the caret symbol <code>^</code> (e.g. type <code>2^3</code> for two to the power of three, or <code>x^2</code> for x squared).</li>
              <li style={{ marginBottom: '4px' }}><strong>Multiplication:</strong> Use the asterisk <code>*</code> or lowercase letter <code>x</code> (e.g. type <code>2^3 * 2^4</code>).</li>
              <li><strong>Fractions/Negatives:</strong> Wrap exponents in parentheses if they are fractions or negative numbers (e.g. type <code>x^(-2)</code> or <code>9^(1/2)</code>).</li>
            </ul>
          </div>
        );
      case 'geometry':
        return (
          <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', marginBottom: '15px', fontSize: '0.88rem' }}>
            <h4 style={{ margin: '0 0 8px', color: '#10b981', fontWeight: '700' }}><i className="fa-solid fa-keyboard"></i> Geometry Typing Rules:</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#d1d5db', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '4px' }}><strong>Multiplication:</strong> Use the asterisk <code>*</code> or lowercase letter <code>x</code> (e.g. type <code>pi * r^2</code> or <code>3.14 x 5 x 5</code>).</li>
              <li style={{ marginBottom: '4px' }}><strong>Powers (Area/Volume):</strong> Use the caret symbol <code>^</code> (e.g. type <code>r^2</code> or <code>cm^3</code>).</li>
              <li style={{ marginBottom: '4px' }}><strong>Division:</strong> Use the forward slash <code>/</code> (e.g. type <code>(b * h) / 2</code> for triangle area).</li>
              <li><strong>Pi (π):</strong> Type <code>pi</code> or <code>PI</code> (e.g. type <code>pi * 5^2</code>).</li>
            </ul>
          </div>
        );
      default:
        return (
          <div style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '15px', fontSize: '0.88rem' }}>
            <h4 style={{ margin: '0 0 8px', color: 'var(--primary)', fontWeight: '700' }}><i className="fa-solid fa-keyboard"></i> Math Typing Rules:</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#d1d5db', lineHeight: '1.5' }}>
              <li style={{ marginBottom: '4px' }}><strong>Multiplication:</strong> Use asterisk <code>*</code> (e.g. <code>5 * 6</code>).</li>
              <li style={{ marginBottom: '4px' }}><strong>Division:</strong> Use forward slash <code>/</code> (e.g. <code>12 / 3</code>).</li>
              <li><strong>Exponents (Powers):</strong> Use caret <code>^</code> (e.g. <code>2^3</code>).</li>
            </ul>
          </div>
        );
    }
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
              borderRadius: '12px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
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

      <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
        <button type="button" className={`btn ${uploadMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('camera')}>
          <i className="fa-solid fa-camera"></i> Take Photo
        </button>
        <button type="button" className={`btn ${uploadMode === 'whiteboard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('whiteboard')}>
          <i className="fa-solid fa-pen-nib"></i> Draw on Screen
        </button>
        <button type="button" className={`btn ${uploadMode === 'typed' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('typed')}>
          <i className="fa-solid fa-keyboard"></i> Type Steps
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {uploadMode === 'camera' && (
          <>
            <input type="file" name="file" accept="image/*" capture="environment" style={{display: 'block', margin: '0 auto 20px'}} required />
            {feedback.text && <p className={`status show ${feedback.type}`}>{feedback.text}</p>}
            <div className="actions" style={{justifyContent: 'center'}}>
              <button type="submit" className="btn btn-primary"><i className="fa-solid fa-cloud-arrow-up"></i> Upload to AI Grader</button>
            </div>
          </>
        )}

        {uploadMode === 'whiteboard' && (
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
                  display: 'block',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
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

        {uploadMode === 'typed' && (
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            {getTopicTypingInstructions()}
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem', color: '#9ca3af' }}>Type your step-by-step math calculations:</label>
            <textarea 
              placeholder="Type your steps here... (e.g. 5/6 * (2/3 + 1/4) = 5/6 * 11/12 = 55/72)" 
              required
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '15px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                marginBottom: '15px'
              }}
              value={typedWork}
              onChange={(e) => setTypedWork(e.target.value)}
            />
            {feedback.text && <p className={`status show ${feedback.type}`} style={{marginTop: '15px'}}>{feedback.text}</p>}
            <div className="actions" style={{justifyContent: 'center'}}>
              <button type="submit" className="btn btn-primary"><i className="fa-solid fa-cloud-arrow-up"></i> Upload to AI Grader</button>
            </div>
          </div>
        )}
      </form>

      <div style={{ marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <button type="button" className="btn btn-secondary" onClick={handleSkip} style={{ fontSize: '0.9rem', color: 'var(--warn-text)', border: '1px dashed rgba(245,158,11,0.3)', padding: '10px 20px' }}>
          <i className="fa-solid fa-forward"></i> Skip AI Grading (Does not affect mastery)
        </button>
      </div>
    </section>
  );
}
