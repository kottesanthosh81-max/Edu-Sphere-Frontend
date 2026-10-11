import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth.jsx';
import { PageHead, fmt } from '../ui.jsx';

export default function Dashboard() {
  const { user, isAdmin, isFaculty } = useAuth();
  const [s, setS] = useState(null);
  const [notes, setNotes] = useState([]);
  const [depts, setDepts] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [recentLogins, setRecentLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/api/dashboard/stats').catch(() => ({ data: null })),
      api.get('/api/notifications').catch(() => ({ data: [] })),
      api.get('/api/departments').catch(() => ({ data: [] })),
      api.get('/api/attendance/academic/mine').catch(() => ({ data: null })),
      isAdmin ? api.get('/api/users/logins').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([statsRes, notesRes, deptsRes, attRes, loginsRes]) => {
      if (active) {
        setS(statsRes.data);
        setNotes(Array.isArray(notesRes.data) ? notesRes.data.slice(0, 5) : []);
        setDepts(Array.isArray(deptsRes.data) ? deptsRes.data : []);
        setTodayAttendance(attRes.data);
        setRecentLogins(Array.isArray(loginsRes.data) ? loginsRes.data.slice(0, 4) : []);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const cards = isAdmin
    ? [
        ['📚', 'Total Resources', s?.resources, '/resources', 'c1'],
        ['👥', 'Registered Users', s?.users, '/users', 'c2'],
        ['📝', 'Pending Requests', s?.pendingRequests, '/requests', 'c3'],
        ['🔄', 'Active Borrows', s?.activeBorrows, '/borrow', 'c4'],
        ['⏰', 'Overdue Items', s?.overdueBorrows, '/borrow', 'c5'],
        ['🛠️', 'Open Complaints', s?.openComplaints, '/complaints', 'c6'],
        ['✅', 'Resolved Complaints', s?.resolvedComplaints, '/complaints', 'c7'],
        ['🏛️', 'Departments', s?.departments, '/departments', 'c8'],
      ]
    : [
        ['📚', 'Library Resources', s?.resources, '/resources', 'c1'],
        ['📝', 'My Requests', s?.myRequests, '/requests', 'c2'],
        ['⏳', 'Pending Review', s?.pendingRequests, '/requests', 'c3'],
        ['🔄', 'Currently Borrowed', s?.activeBorrows, '/borrow', 'c4'],
        ['🛠️', 'My Complaints', s?.openComplaints, '/complaints', 'c6'],
        ['🔔', 'Unread Alerts', s?.unreadNotifications, '/notifications', 'c5'],
      ];

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const roleTitle = user?.role ? user.role.replace(/_/g, ' ') : '';

  return (
    <>
      <PageHead
        title={`Welcome back, ${firstName} 👋`}
        sub={`Logged in as ${roleTitle} ${user?.departmentName ? `• ${user.departmentName}` : ''}`}
      />
      <div className="stats">
        {cards.map(([icon, label, val, to, c]) => (
          <Link key={label} to={to} className={`stat ${c}`}>
            <span className="ico">{icon}</span>
            <div>
              <b>{loading ? '…' : (val ?? 0)}</b>
              <small>{label}</small>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid2">
        {/* Left Column: Quick Actions & Attendance Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card">
            <h3>Quick Actions</h3>
            <div className="quick">
              <Link className="btn" to="/resources">📚 Browse 60+ Resources</Link>
              <Link className="btn" to="/borrow">🔄 Borrow / Return</Link>
              <Link className="btn" to="/requests">📝 View Requests</Link>
              <Link className="btn" to="/complaints">🛠️ Raise a Complaint</Link>
              <Link className="btn" to="/attendance">✅ Attendance Hub</Link>
              <Link className="btn" to="/profile">⚙️ Profile & Settings</Link>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Today's Attendance</h3>
              <Link to="/attendance" style={{ fontSize: '13px' }}>Open Hub →</Link>
            </div>
            <div style={{ marginTop: '10px' }}>
              {todayAttendance?.status ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge b-PRESENT" style={{ fontSize: '13px', padding: '6px 14px' }}>
                    Status: {todayAttendance.status}
                  </span>
                  {todayAttendance.checkedInAt && (
                    <small className="muted">Checked in at {fmt(todayAttendance.checkedInAt)}</small>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted">Not checked in for today yet.</span>
                  <Link to="/attendance" className="btn sm primary">Punch In</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Department Catalog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Recent Notifications</h3>
              <Link to="/notifications" style={{ fontSize: '13px' }}>View all →</Link>
            </div>
            <div style={{ marginTop: '10px' }}>
              {notes.length === 0 ? (
                <p className="muted">You're all caught up. No unread notifications.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className={`note ${n.read ? '' : 'unread'}`}>
                    <b>{n.title}</b>
                    <p>{n.message}</p>
                    <small>{fmt(n.createdAt)}</small>
                  </div>
                ))
              )}
            </div>
          </div>

          {isAdmin && recentLogins.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Recent User Sign-ins</h3>
                <Link to="/users" style={{ fontSize: '13px' }}>View audit logs →</Link>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentLogins.map((l) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <b>{l.name || 'User'}</b> <span style={{ color: '#64748b', fontSize: '12px' }}>({l.email})</span>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>IP: {l.ipAddress} • {l.role}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{fmt(l.loginTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3>Academic Branches & Departments</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {depts.map((d) => (
                <Link
                  key={d.id}
                  to={`/resources`}
                  className="tag"
                  style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '13px' }}
                >
                  🏛️ {d.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
