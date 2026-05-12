'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({ id: "mock-id", email: "admin@erp.com" });
  const [loading, setLoading] = useState(true);
  const initStore = useERPStore(state => state.init);
  const router = useRouter();
  const pathname = usePathname();
  const initRef = useRef(false);

  // Init store only once on mount — NOT on every route change
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const checkAuth = async () => {
      // Emergency failsafe: always stop loading after 8s regardless of what happens
      const emergencyTimer = setTimeout(() => {
        setLoading(false);
      }, 8000);

      try {
        const savedUser = localStorage.getItem('erp-user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        await initStore();
      } catch (e) {
        console.error('[AuthProvider] init error:', e);
      } finally {
        clearTimeout(emergencyTimer);
        setLoading(false);
      }
    };

    checkAuth();
  }, [initStore]);

  // Redirect away from login if user is already saved — separate effect
  useEffect(() => {
    if (!loading && pathname === '/login') {
      const savedUser = localStorage.getItem('erp-user');
      if (savedUser) {
        router.push('/');
      }
    }
  }, [loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading ? children : (
        <div className="flex h-screen w-screen items-center justify-center bg-[#020617]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

