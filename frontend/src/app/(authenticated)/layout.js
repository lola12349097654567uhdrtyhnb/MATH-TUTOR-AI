'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function AuthenticatedLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="sidebar-layout">
      {/* Mobile Top Navbar */}
      <div className="mobile-topbar">
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{background: 'var(--primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <i className="fa-solid fa-graduation-cap" style={{color: '#fff', fontSize: '1rem'}}></i>
          </div>
          <h2 style={{margin: 0, fontSize: '1.2rem'}} className="title">Tutor AI</h2>
        </div>
        <button 
          onClick={() => setMobileOpen(true)}
          style={{background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '8px', fontSize: '1.4rem'}}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      {/* Overlay for mobile drawer */}
      <div 
        className={`mobile-overlay ${mobileOpen ? 'show' : ''}`} 
        onClick={() => setMobileOpen(false)}
      ></div>

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        {children}
      </main>
    </div>
  );
}
