import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from './api';
import { useAuth } from './auth.jsx';

const NAV = [
  ['/', '📊', 'Dashboard'],
  ['/resources', '📚', 'Resources'],
  ['/requests', '📝', 'Requests'],
  ['/borrow', '🔄', 'Borrow / Return'],
  ['/complaints', '🛠️', 'Complaints'],
  ['/notifications', '🔔', 'Notifications'],
  ['/departments', '🏛️', 'Departments'],
  ['/users', '👥', 'Users', true],
  ['/attendance', '✅', 'Attendance'],
  ['/profile', '⚙️', 'Profile & Settings'],
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      api.get('/api/notifications/unread-count')
        .then((r) => {
          if (active && r.data && typeof r.data.count === 'number') {
            setUnread(r.data.count);
          }
        })
        .catch(() => {});
    };

    load();
    const t = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [loc.pathname]);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  const initial = user?.name ? user.name[0].toUpperCase() : 'U';
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : '';

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <span>🎓</span>
          <div>
            <b>Edu<em>-Sphere</em></b>
            <small>Resource & Complaint System</small>
          </div>
        </div>
        <nav>
          {NAV.filter((n) => !n[3] || isAdmin).map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span>{icon}</span>{label}
              {label === 'Notifications' && unread > 0 && <i className="pill">{unread}</i>}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="me">
            <div className="avatar">{initial}</div>
            <div>
              <b>{user.name}</b>
              <small>{roleLabel}</small>
            </div>
            <button title="Logout" onClick={handleLogout}>⎋</button>
          </div>
        )}
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }}></span>
          <span>API Connected • Port 8009</span>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
