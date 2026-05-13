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
  canDo: (permission: string) => boolean;
}

export const useERPStore = create<ERPState>((set, get) => ({
  user: null,
  userRole: 'VIEWER',
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
        // Sync token to cookie for Middleware
        if (typeof document !== 'undefined') {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax; Secure`;
        }
        // Sync with DB
        try {
          const syncRes = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name
            })
          });
          const dbUser = await syncRes.json();
          
          set({ 
            user: {
              name: dbUser.name || session.user.user_metadata?.name || 'User',
              email: dbUser.email || session.user.email || '',
              role: dbUser.role as UserRole,  // ← CANONICAL: from /api/auth/sync (DB source of truth)
              createdAt: session.user.created_at
            },
            userRole: dbUser.role as UserRole
          });
        } catch (syncErr) {
          console.error('[Store] Sync failed, falling back to metadata:', syncErr);
          // FALLBACK ONLY: user_metadata is writable by user (not ideal)
          // This only happens if /api/auth/sync fails - should be rare
          set({ 
            user: {
              name: session.user.user_metadata?.name || 'User',
              email: session.user.email || '',
              role: (session.user.user_metadata?.role as UserRole) || 'VIEWER',
              createdAt: session.user.created_at
            },
            userRole: (session.user.user_metadata?.role as UserRole) || 'VIEWER'
          });
        }
      } else {
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
        // Sync token to cookie for Middleware
        if (typeof document !== 'undefined') {
          if (session) {
            document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax; Secure`;
          } else {
            document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
          }
        }

        if (session?.user) {
          // Trigger sync in background or wait
          fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name
            })
          }).then(dbUser => {
            console.log('[Store] Auth Sync Success:', dbUser.email, dbUser.role);
            set({ 
              user: {
                name: dbUser.name || session.user?.user_metadata?.name || 'User',
                email: dbUser.email || session.user?.email || '',
                role: dbUser.role as UserRole,  // ← CANONICAL: from /api/auth/sync (DB source of truth)
                createdAt: session.user?.created_at || ''
              },
              userRole: dbUser.role as UserRole
            });
          }).catch(err => {
            console.error('[Store] Auth Sync Error:', err);
            // FALLBACK ONLY: user_metadata is writable by user (not ideal)
            // This only happens if /api/auth/sync fails - should be rare
            set({
              user: {
                name: session.user?.user_metadata?.name || 'User',
                email: session.user?.email || '',
                role: (session.user?.user_metadata?.role as UserRole) || 'VIEWER',
                createdAt: session.user?.created_at || ''
              },
              userRole: (session.user?.user_metadata?.role as UserRole) || 'VIEWER'
            });
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
      
      console.error('Login error:', error);
      return false;
    } catch (e) {
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
      localStorage.removeItem('erp-project-id');
    } catch (e) { /* ignore */ }
    window.location.href = '/login';
  },

  setCurrentProject: (projectId: string) => {
    set({ currentProjectId: projectId });
    localStorage.setItem('erp-project-id', projectId);
  },

  canDo: (permission: any) => {
    const { userRole } = get();
    const { RolePermissions } = require('@/lib/auth/rbac');
    const allowed = RolePermissions[userRole] || [];
    return allowed.includes(permission);
  },


  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
