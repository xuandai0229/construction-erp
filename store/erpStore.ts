import { create } from 'zustand';
import { UserRole } from '@/app/types';

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
    try {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('erp-user') : null;
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        set({ user: userData, userRole: userData.role });
      }
      
      const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('erp-project-id') : null;
      if (savedProjectId) {
        set({ currentProjectId: savedProjectId });
      }

      set({ initialized: true });
    } catch (e) {
      console.error('init error:', e);
      set({ initialized: true });
    }
  },

  login: async (email, pass) => {
    if (email === 'admin' || email.includes('admin')) {
      const user: UserProfile = {
        name: 'Hệ thống Quản trị',
        email: 'admin@construction.com',
        role: 'ADMIN',
        phone: '0901234567',
        createdAt: '2024-01-01'
      };
      set({ user, userRole: 'ADMIN' });
      localStorage.setItem('erp-user', JSON.stringify(user));
      return true;
    }
    return false;
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem('erp-user');
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
