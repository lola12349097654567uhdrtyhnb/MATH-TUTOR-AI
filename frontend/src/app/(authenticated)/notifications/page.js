'use client';
import { useState, useEffect } from 'react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      const res = await fetch('/api/student/notifications');
      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        const sorted = (data.notifications || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(sorted);
      }
      setLoading(false);
    }
    fetchNotifications();
  }, []);

  if (loading) return <div className="container">Loading Notifications...</div>;

  return (
    <div className="container" style={{maxWidth: '800px', margin: '0 auto'}}>
      <header className="page-header">
        <h1 className="title">Notification Center</h1>
        <p className="subtitle">Important messages and remarks from your instructor.</p>
      </header>

      {notifications.length === 0 ? (
        <div className="card" style={{textAlign: 'center', padding: '40px'}}>
          <i className="fa-regular fa-bell-slash" style={{fontSize: '3rem', color: 'var(--muted)', marginBottom: '16px'}}></i>
          <h3>No notifications</h3>
          <p style={{color: 'var(--muted)'}}>You're all caught up!</p>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {notifications.map((notif, idx) => (
            <div key={idx} className="card" style={{borderLeft: '4px solid var(--primary)', display: 'flex', gap: '16px', alignItems: 'flex-start'}}>
              <div style={{background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '50%'}}>
                <i className="fa-solid fa-chalkboard-user" style={{color: 'var(--primary)', fontSize: '1.2rem'}}></i>
              </div>
              <div style={{flex: 1}}>
                <p style={{margin: '0 0 8px', lineHeight: '1.5'}}>{notif.message}</p>
                <span style={{fontSize: '0.8rem', color: 'var(--muted)'}}>{new Date(notif.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
