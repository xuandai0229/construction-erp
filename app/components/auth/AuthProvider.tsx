'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useERPStore } from '@/store/erpStore';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initStore = useERPStore(state => state.init);
  const setUserRole = useERPStore(state => state.setUserRole);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      await initStore();

      if (process.env.NODE_ENV !== 'production') {
        try {
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'SUPER_ADMIN' }),
          });
          const payload = await response.json();
          if (!cancelled && payload.success) {
            setUser(payload.data.user);
            setUserRole(payload.data.user.role);
          }
        } catch (error) {
          console.warn('[Auth] Development session bootstrap failed:', error);
        }
      }

      if (!cancelled) setLoading(false);
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [initStore, setUserRole]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
