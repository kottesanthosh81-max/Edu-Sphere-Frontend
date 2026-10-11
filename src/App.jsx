import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './Layout.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Resources from './pages/Resources.jsx';
import Requests from './pages/Requests.jsx';
import Borrow from './pages/Borrow.jsx';
import Complaints from './pages/Complaints.jsx';
import Notifications from './pages/Notifications.jsx';
import Users from './pages/Users.jsx';
import Departments from './pages/Departments.jsx';
import Profile from './pages/Profile.jsx';
import Attendance from './pages/Attendance.jsx';

const LoadingSpinner = () => (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg, #f2f5fb)' }}>
    <div style={{ textAlign: 'center', color: '#12294d' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'pop 0.3s ease' }}>🎓</div>
      <b style={{ fontSize: '18px' }}>Edu-Sphere</b>
      <p style={{ color: '#6b7a90', fontSize: '14px', marginTop: '4px' }}>Loading session…</p>
    </div>
  </div>
);

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminOnly = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="resources" element={<Resources />} />
        <Route path="requests" element={<Requests />} />
        <Route path="borrow" element={<Borrow />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="departments" element={<Departments />} />
        <Route path="users" element={<AdminOnly><Users /></AdminOnly>} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
