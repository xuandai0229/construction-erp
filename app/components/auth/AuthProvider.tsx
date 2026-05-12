'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('erp-user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        if (pathname === '/login') {
          router.push('/');
        }
      }
      
      await initStore();
      setLoading(false);
    };

    checkAuth();
  }, [initStore, pathname, router]);

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

