import { create } from 'zustand';
import type { User } from '../types';
import api from '../api/client';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  init: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) set({ user: JSON.parse(user), loading: false });
    else set({ loading: false });
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user });
  },

  register: async (name, email, password) => {
    await api.post('/auth/register', { name, email, password });
    // Don't auto-login — user must sign in manually
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
  },
}));
