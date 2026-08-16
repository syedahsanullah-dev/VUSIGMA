'use client';
import { create } from 'zustand';
import api from '@/lib/api';

const safeParseUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    return null;
  }
};

const initialUser = safeParseUser();

const useAuthStore = create((set) => ({
  user: initialUser,
  role: initialUser?.role || 'STUDENT',
  loading: false,
  error: null,

  login: async (email, password, requiredRole) => {
    set({ loading: true, error: null });
    try {
      const payload = { email, password };
      if (requiredRole) payload.requiredRole = requiredRole;
      const data = await api.post('/auth', payload);
      const userWithToken = { ...data.user, token: data.token };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userWithToken));
      }

      set({
        user: userWithToken,
        role: data.user.role,
        loading: false
      });
      return userWithToken;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  adminLogin: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.post('/admin/auth', { email, password });
      const userWithToken = { ...data.user, token: data.token };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userWithToken));
      }

      set({
        user: userWithToken,
        role: 'SUPER_ADMIN',
        loading: false
      });
      return userWithToken;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password, role = 'STUDENT') => {
    set({ loading: true, error: null });
    try {
      const data = await api.post('/auth', { name, email, password, role });
      const userWithToken = { ...data.user, token: data.token };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userWithToken));
      }

      set({
        user: userWithToken,
        role: data.user.role,
        loading: false
      });
      return userWithToken;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.delete('/auth');
    } catch (err) {
      console.error('Logout API failed', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    set({ user: null, role: 'STUDENT', error: null });
  }
}));

export default useAuthStore;
