import { create } from 'zustand';
import { UserRole } from '@/app/types';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

interface ERPState {
  user: UserProfile | null;
  userRole: UserRole;
  currentProjectId: string;
  initialized: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  init: () => Promise<void>;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCurrentProject: (projectId: string) => void;
  setUserRole: (role: UserRole) => void;
}

export const useERPStore = create<ERPState>((set, get) => ({
  user: null,
  userRole: 'ADMIN',
  currentProjectId: '', 
  initialized: false,
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  init: async () => {
    if (get().initialized) return;
    set({ initialized: true }); // Guard immediately to prevent concurrent calls
    
    try {
      // Add a 5s timeout to prevent hanging the whole app on startup
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth Timeout')), 5000)
      );

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (session?.user) {
        set({ 
          user: {
            name: session.user.user_metadata?.name || 'User',
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as UserRole) || 'VIEWER',
            createdAt: session.user.created_at
          },
          userRole: (session.user.user_metadata?.role as UserRole) || 'VIEWER'
        });
      } else {
        try {
          const savedUser = typeof window !== 'undefined' ? localStorage.getItem('erp-user') : null;
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            set({ user: userData, userRole: userData.role });
          }
        } catch (e) {
          console.warn('[Store] Failed to parse saved user:', e);
        }
      }
      
      try {
        const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('erp-project-id') : null;
        if (savedProjectId) {
          set({ currentProjectId: savedProjectId });
        }
      } catch (e) {
        console.warn('[Store] Failed to read saved project:', e);
      }

      // Listen to auth changes — only set up once via initialized guard
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({ 
            user: {
              name: session.user.user_metadata?.name || 'User',
              email: session.user.email || '',
              role: (session.user.user_metadata?.role as UserRole) || 'VIEWER',
              createdAt: session.user.created_at
            },
            userRole: (session.user.user_metadata?.role as UserRole) || 'VIEWER'
          });
        } else {
          set({ user: null, userRole: 'VIEWER' });
        }
      });

      // Store subscription for potential cleanup (guarded by initialized flag)
      if (typeof window !== 'undefined') {
        (window as any).__erpAuthSubscription = subscription;
      }

      set({ initialized: true });
    } catch (e) {
      console.error('init error:', e);
      set({ initialized: true });
    }
  },

  login: async (email, pass) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (!error && data.user) {
        return true;
      }
      
      // Development Fallback: If Supabase fails (e.g. offline), allow local admin for development
      if (email === 'admin@construction.com' && pass === 'password123') {
        const user: UserProfile = {
          name: 'Hệ thống Quản trị (Offline Admin)',
          email: 'admin@construction.com',
          role: 'SUPER_ADMIN',
          createdAt: new Date().toISOString()
        };
        set({ user, userRole: 'SUPER_ADMIN' });
        localStorage.setItem('erp-user', JSON.stringify(user));
        console.warn("[Auth] Using offline development fallback for SUPER_ADMIN");
        return true;
      }
      
      console.error('Login error:', error);
      return false;
    } catch (e) {
      // Handle fetch errors (offline)
      if (email === 'admin@construction.com' && pass === 'password123') {
        const user: UserProfile = {
          name: 'Hệ thống Quản trị (Offline Admin)',
          email: 'admin@construction.com',
          role: 'SUPER_ADMIN',
          createdAt: new Date().toISOString()
        };
        set({ user, userRole: 'SUPER_ADMIN' });
        localStorage.setItem('erp-user', JSON.stringify(user));
        console.warn("[Auth] Network error detected. Using offline development fallback.");
        return true;
      }
      console.error('Login exception:', e);
      return false;
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Auth] signOut error (possibly offline):', e);
    }
    set({ user: null, userRole: 'VIEWER' });
    try {
      localStorage.removeItem('erp-user');
      localStorage.removeItem('erp-project-id');
    } catch (e) { /* ignore */ }
    window.location.href = '/login';
  },

  setCurrentProject: (projectId: string) => {
    set({ currentProjectId: projectId });
    localStorage.setItem('erp-project-id', projectId);
  },

  setUserRole: (role: UserRole) => set({ userRole: role }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
