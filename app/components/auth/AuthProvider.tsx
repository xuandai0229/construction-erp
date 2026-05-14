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
  const [user] = useState<User | null>({ id: "system_internal_admin", email: "admin@erp.internal" });
  const [loading, setLoading] = useState(false);
  const initStore = useERPStore(state => state.init);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initStore();
  }, [initStore]);

  // STABILIZATION MODE: No redirects
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

