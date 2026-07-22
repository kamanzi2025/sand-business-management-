import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(null); // null = still checking

  const refresh = useCallback(async () => {
    const data = await api.auth.status();
    setAuthenticated(data.authenticated);
    return data.authenticated;
  }, []);

  useEffect(() => {
    refresh().catch(() => setAuthenticated(false));
  }, [refresh]);

  const login = useCallback(async (password) => {
    await api.auth.login(password);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, logout, refresh }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
