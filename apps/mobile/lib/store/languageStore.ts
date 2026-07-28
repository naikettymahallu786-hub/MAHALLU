import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LanguageState = {
  language: 'en' | 'ml';
  setLanguage: (lang: 'en' | 'ml') => void;
  toggleLanguage: () => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set((state) => ({ language: state.language === 'en' ? 'ml' : 'en' })),
    }),
    {
      name: 'mahallu-language',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
