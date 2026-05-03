import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'employee' | 'manager' | 'ceo';
  department: string | null;
  employee_id: string | null;
  manager: number | null;
  phone: string | null;
  is_active: boolean;
  preferences: {
    theme: string;
    primary_color: string;
    accent_color: string;
    sidebar_color: string;
    background_color: string;
    font_size: string;
    layout_density: string;
    layout_style?: string;    // 'sidebar' | 'compact' | 'topnav'
    sidebar_position?: string; // 'left' | 'right'
  };
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  branding: { name: string; logo: string };
  setAuth: (access: string, refresh: string, user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  setBranding: (branding: { name: string; logo: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      branding: { name: 'WorkConnect', logo: '' },
      setAuth: (access, refresh, user) => set({
        accessToken: access,
        refreshToken: refresh,
        user,
        isAuthenticated: true
      }),
      setTokens: (access, refresh) => set({
        accessToken: access,
        refreshToken: refresh
      }),
      setUser: (user) => set({ user }),
      setBranding: (branding) => set({ branding }),
      logout: () => set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false
      })
    }),
    { name: 'auth-storage' }
  )
);
