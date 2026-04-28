import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginRequest,
  registerRequest,
  getMeRequest,
  setToken,
  getToken,
  clearToken,
} from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getMeRequest()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await loginRequest(email, password);
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/');
    },
    [navigate]
  );

  const register = useCallback(
    async (name, email, password) => {
      const res = await registerRequest(name, email, password);
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/');
    },
    [navigate]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, register, logout, getToken, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
