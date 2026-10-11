import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const ADMINS = ['DEPARTMENT_ADMIN', 'LIBRARY_ADMIN', 'SUPER_ADMIN'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Validate session against /api/auth/me on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    api.get('/api/auth/me')
      .then((res) => {
        if (isMounted) {
          localStorage.setItem('user', JSON.stringify(res.data));
          setUser(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err.response?.status === 401) {
            logout();
          }
          // For network or server errors, keep cached user so offline/lag doesn't crash the session
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const save = (d) => {
    localStorage.setItem('token', d.token);
    localStorage.setItem('user', JSON.stringify(d.user));
    setUser(d.user);
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    save(res.data);
    return res.data;
  };

  const register = async (body) => {
    const res = await api.post('/api/auth/register', body);
    save(res.data);
    return res.data;
  };

  const updateUser = (u) => {
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const isAdmin = !!user && ADMINS.includes(user.role);
  const isSuper = user?.role === 'SUPER_ADMIN';
  const isFaculty = user?.role === 'FACULTY';
  const isStudent = user?.role === 'STUDENT';
  const canManage = isAdmin || isFaculty;

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAdmin,
        isSuper,
        isFaculty,
        isStudent,
        canManage,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
