'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      // Granular font sizes in px
      questionSize: 18,
      optionSize: 16,
      explanationSize: 15,
      urduSize: 22,
      isSettingsOpen: false,

      // Update functions
      setQuestionSize: (size) => set({ questionSize: size }),
      setOptionSize: (size) => set({ optionSize: size }),
      setExplanationSize: (size) => set({ explanationSize: size }),
      setUrduSize: (size) => set({ urduSize: size }),
      setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
      closeSettingsModal: () => set({ isSettingsOpen: false }),
      toggleSettingsModal: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      // Reset to defaults
      resetSettings: () => set({
        questionSize: 18,
        optionSize: 16,
        explanationSize: 15,
        urduSize: 22,
      })
    }),
    {
      name: 'granular-settings-storage',
    }
  )
);

export default useSettingsStore;
