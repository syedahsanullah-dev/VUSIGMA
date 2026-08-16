'use client';
import { create } from 'zustand';
import api from '@/lib/api';

const useQuizStore = create((set, get) => ({
  subjects: [],
  loading: false,
  error: null,

  fetchSubjects: async (force = false) => {
    if (!force && Array.isArray(get().subjects) && get().subjects.length > 0 && get().subjects[0].mcqCount !== undefined) {
      return;
    }

    set({ loading: true });
    try {
      const subjectsData = await api.get('/subjects');
      const list = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.data || []);
      set({ subjects: list, loading: false });
    } catch (error) {
      console.error("Store Error:", error);
      set({ subjects: [], error: error.message, loading: false });
    }
  },

  clearCache: () => set({ subjects: [] })
}));

export default useQuizStore;
