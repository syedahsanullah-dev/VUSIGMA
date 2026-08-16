import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLanguageStore = create(
  persist(
    (set) => ({
      // Available modes: 'english', 'urdu', 'bilingual'
      languageMode: 'english',
      
      setLanguageMode: (mode) => set({ languageMode: mode }),
      
      // Helper functions to easily check current mode in components
      isUrduEnabled: () => {
        const mode = useLanguageStore.getState().languageMode;
        return mode === 'urdu' || mode === 'bilingual';
      },
      isBilingual: () => {
        return useLanguageStore.getState().languageMode === 'bilingual';
      }
    }),
    {
      name: 'language-storage', // name of the item in the storage (must be unique)
    }
  )
);

export default useLanguageStore;
