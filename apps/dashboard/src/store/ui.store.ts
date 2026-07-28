import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'ml';

interface UIState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ language: state.language === 'en' ? 'ml' : 'en' })),
    }),
    {
      name: 'mahallu-ui-storage', // name of the item in the storage (must be unique)
    }
  )
);
