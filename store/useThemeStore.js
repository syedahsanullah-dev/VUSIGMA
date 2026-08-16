'use client';
import { create } from 'zustand';

const applyThemeToDOM = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  if (theme === 'dark') {
    root.classList.add('dark');
    if (body) body.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    if (body) body.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
};

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
};

const current = getInitialTheme();
if (typeof window !== 'undefined') {
  applyThemeToDOM(current);
}

const useThemeStore = create((set, get) => ({
  theme: current,

  initTheme: () => {
    const t = get().theme;
    applyThemeToDOM(t);
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    applyThemeToDOM(newTheme);
    set({ theme: newTheme });
  },

  setTheme: (newTheme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    applyThemeToDOM(newTheme);
    set({ theme: newTheme });
  }
}));

export default useThemeStore;
