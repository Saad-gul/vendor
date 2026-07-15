'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type User = { id: string; email: string; name?: string | null; role: string; vendor?: { id: string } | null };

const AuthContext = createContext<{ user: User | null; loading: boolean; refresh: () => void }>({ user: null, loading: true, refresh: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    api.auth
      .me()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  return <AuthContext.Provider value={{ user, loading, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
