import { useState, useRef, useEffect, useCallback } from 'react';

export function useWhiteboard(isActive) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Resize canvas internal coordinate system to match display CSS dimensions
  const updateCanvasScale = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        // Only rescale if empty to avoid losing drawing, or we can just ensure styling is flexible.
        // To maintain perfect drawing without stretching, we just ensure bounding logic below works well.
      }
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('resize', updateCanvasScale);
      return () => window.removeEventListener('resize', updateCanvasScale);
    }
  }, [isActive, updateCanvasScale]);

  useEffect(() => {
    if (isActive && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      // Initialize with white background so toBlob doesn't return transparent PNG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isActive]);

  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    // Support touch and mouse cleanly
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    if (e.target.setPointerCapture && e.pointerId) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!canvasRef.current || !isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
    if (e.target.releasePointerCapture && e.pointerId) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const clearWhiteboard = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return {
    canvasRef,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    clearWhiteboard
  };
}
