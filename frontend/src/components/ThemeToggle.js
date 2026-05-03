'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle({ floating = false }) {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Determine the initial theme
    const isLightMode = document.body.classList.contains('light-mode');
    setIsLight(isLightMode);
  }, []);

  const toggleTheme = () => {
    const nextMode = !isLight;
    setIsLight(nextMode);
    
    if (nextMode) {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  };

  const floatingStyle = floating ? {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 9999,
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1.2rem'
  } : {};

  // Avoid hydration mismatch by not rendering the icon until mounted
  if (!mounted) {
    return <button className="btn btn-secondary" style={{width: floating ? '54px' : '46px', ...floatingStyle}} aria-label="Loading theme toggle"></button>;
  }

  return (
    <button 
      className="btn btn-secondary" 
      onClick={toggleTheme}
      title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
      aria-label="Toggle theme"
      style={floatingStyle}
    >
      <i className={isLight ? "fa-solid fa-moon" : "fa-solid fa-sun"}></i>
    </button>
  );
}
