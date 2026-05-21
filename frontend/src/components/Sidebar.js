'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const [role, setRole] = useState('student');
  const [postAssessmentDone, setPostAssessmentDone] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.role) setRole(data.role);
        if (data.post_assessment?.completed) setPostAssessmentDone(true);
      }
    }
    fetchSession();
  }, []);

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: 'fa-solid fa-house' },
    { name: 'Practice', path: '/dashboard', icon: 'fa-solid fa-pen-to-square' }, 
    { name: 'Edit Profile', path: '/profile', icon: 'fa-solid fa-user-pen' },
    ...(postAssessmentDone ? [{ name: 'My Results', path: '/assessment-results', icon: 'fa-solid fa-square-poll-vertical' }] : []),
    { name: 'Feedback & Activity', path: '/feedback', icon: 'fa-solid fa-chart-line' },
    { name: 'Notifications', path: '/notifications', icon: 'fa-solid fa-bell' },
  ];

  const instructorLinks = [
    { name: 'Class Overview', path: '/instructor/overview', icon: 'fa-solid fa-chalkboard-user' },
    { name: 'Assessment Results', path: '/instructor/assessments', icon: 'fa-solid fa-square-poll-vertical' },
    { name: 'Student Reviews', path: '/instructor/review', icon: 'fa-solid fa-magnifying-glass-chart' },
    { name: 'Question Bank', path: '/instructor/questions', icon: 'fa-solid fa-database' },
  ];

  const links = role === 'instructor' ? instructorLinks : studentLinks;


  return (
    <nav className={`sidebar-nav ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header" style={{display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center'}}>
        {!collapsed && (
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div style={{background: 'var(--primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'}}>
              <i className="fa-solid fa-graduation-cap" style={{color: '#fff', fontSize: '1.2rem'}}></i>
            </div>
            <h2 style={{margin: 0, fontSize: '1.4rem'}} className="title">Tutor AI</h2>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          style={{background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '8px', borderRadius: '8px'}}
          className="hover-bg-subtle"
        >
          <i className="fa-solid fa-bars" style={{fontSize: '1.2rem'}}></i>
        </button>
      </div>
      
      <div className="sidebar-menu">
        {links.map((link) => {
          const isActive = pathname === link.path || (link.name === 'Practice' && pathname.startsWith('/tutor'));
          return (
            <Link 
              key={link.name} 
              href={link.path} 
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? link.name : ''}
              onClick={() => setMobileOpen && setMobileOpen(false)}
            >
              <i className={link.icon} style={{width: '24px', textAlign: 'center'}}></i>
              {!collapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <Link href="/api/auth/logout" className="sidebar-link" style={{color: 'var(--warn-text)'}} title={collapsed ? "Sign Out" : ""} onClick={() => setMobileOpen && setMobileOpen(false)}>
          <i className="fa-solid fa-arrow-right-from-bracket" style={{width: '24px', textAlign: 'center'}}></i>
          {!collapsed && <span>Sign Out</span>}
        </Link>
      </div>
    </nav>
  );
}
