'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('inteligencia-pncp-token');
    if (stored) {
      setToken(stored);
      fetch('/api/profile', {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.email) {
            setUser({ id: data.id, name: data.name, email: data.email });
          }
        })
        .catch(() => localStorage.removeItem('inteligencia-pncp-token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    localStorage.setItem('inteligencia-pncp-token', data.token);
    setToken(data.token);
    const profile = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${data.token}` },
    }).then(r => r.json());
    setUser({ id: profile.id, name: profile.name, email: profile.email });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    localStorage.setItem('inteligencia-pncp-token', data.token);
    setToken(data.token);
    setUser({ id: '', name, email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('inteligencia-pncp-token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function authHeaders(token: string | null): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
