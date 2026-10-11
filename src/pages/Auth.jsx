import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';

function Shell({ title, sub, children }) {
  return (
    <div className="auth-wrap">
      <div
        className="auth-hero"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(11, 27, 54, 0.82) 0%, rgba(18, 41, 77, 0.75) 50%, rgba(122, 27, 58, 0.72) 100%), url(/campus_library_hero.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ maxWidth: '520px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              padding: '6px 16px',
              borderRadius: '99px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span style={{ fontSize: '20px' }}>🎓</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: '#f0b429',
              }}
            >
              Academic Resource & Complaint Portal
            </span>
          </div>

          <h1
            style={{
              fontSize: '44px',
              margin: '0 0 14px 0',
              lineHeight: 1.15,
              fontWeight: 800,
              textShadow: '0 4px 14px rgba(0,0,0,0.4)',
            }}
          >
            Edu<span style={{ color: '#f0b429' }}>-Sphere</span>
          </h1>

          <p
            style={{
              fontSize: '17px',
              opacity: 0.95,
              lineHeight: 1.55,
              textShadow: '0 2px 6px rgba(0,0,0,0.3)',
              marginBottom: '30px',
            }}
          >
            A centralized digital platform connecting students, faculty members, and campus administrators for streamlined learning materials, borrowings, and issue resolution.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: 'rgba(255, 255, 255, 0.09)',
                backdropFilter: 'blur(12px)',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span style={{ fontSize: '26px' }}>📚</span>
              <div>
                <b style={{ display: 'block', fontSize: '15px', color: '#fff' }}>Academic & Library Resources</b>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Search textbooks, reference journals, lecture notes and laboratory equipment</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: 'rgba(255, 255, 255, 0.09)',
                backdropFilter: 'blur(12px)',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span style={{ fontSize: '26px' }}>🤝</span>
              <div>
                <b style={{ display: 'block', fontSize: '15px', color: '#fff' }}>Role-Based Access Control</b>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Dedicated environments for Students, Faculty, Department & Library Staff</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: 'rgba(255, 255, 255, 0.09)',
                backdropFilter: 'blur(12px)',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span style={{ fontSize: '26px' }}>🛠️</span>
              <div>
                <b style={{ display: 'block', fontSize: '15px', color: '#fff' }}>Grievance & Complaint Tracking</b>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Direct submission, real-time status updates, and transparent resolutions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-card">
        <h2>{title}</h2>
        <p className="muted">{sub}</p>
        {children}
      </div>
    </div>
  );
}

const DEMO = [
  ['Super Admin', 'admin@edusphere.com', 'Admin@123'],
  ['Library Admin', 'library@edusphere.com', 'Library@123'],
  ['Dept Admin', 'deptadmin@edusphere.com', 'Dept@123'],
  ['Faculty', 'faculty@edusphere.com', 'Faculty@123'],
  ['Student', 'student@edusphere.com', 'Student@123'],
];

export function Login() {
  const { user, loading, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !loading) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(f.email, f.password);
      nav('/');
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Welcome back" sub="Sign in to your Edu-Sphere account">
      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            required
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            placeholder="you@college.edu"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            placeholder="••••••••"
          />
        </label>
        {err && <div className="alert">{err}</div>}
        <button className="btn primary full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="center">
        New here? <Link to="/register">Create an account</Link>
      </p>
      <div className="demo">
        <small>Demo accounts (click to fill):</small>
        <div>
          {DEMO.map(([n, e, p]) => (
            <button
              key={e}
              type="button"
              className="chip"
              onClick={() => setF({ email: e, password: p })}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Register() {
  const { user, loading, register } = useAuth();
  const nav = useNavigate();
  const [depts, setDepts] = useState([]);
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'STUDENT', departmentId: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/departments')
      .then((r) => setDepts(r.data))
      .catch(() => {});
  }, []);

  if (user && !loading) return <Navigate to="/" replace />;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await register({
        ...f,
        departmentId: f.departmentId ? Number(f.departmentId) : null,
      });
      nav('/');
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Create your account" sub="Join Edu-Sphere as a student or faculty member">
      <form onSubmit={submit}>
        <label>
          Full name
          <input
            required
            value={f.name}
            onChange={set('name')}
            placeholder="Your name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={f.email}
            onChange={set('email')}
            placeholder="you@college.edu"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={f.password}
            onChange={set('password')}
            placeholder="At least 6 characters"
          />
        </label>
        <div className="row2">
          <label>
            I am a
            <select value={f.role} onChange={set('role')}>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
            </select>
          </label>
          <label>
            Department
            <select value={f.departmentId} onChange={set('departmentId')}>
              <option value="">— none —</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {err && <div className="alert">{err}</div>}
        <button className="btn primary full" disabled={busy}>
          {busy ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="center">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </Shell>
  );
}
