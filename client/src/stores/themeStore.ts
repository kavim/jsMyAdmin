import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME_ID } from '@/themes';

interface ThemeState {
  themeId: string;
  setThemeId: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      setThemeId: (themeId) => set({ themeId }),
    }),
    { name: 'elendra-theme' }
  )
);
