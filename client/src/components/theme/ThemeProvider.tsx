import { useEffect } from 'react';
import { applyTheme, getThemeById } from '@/themes';
import { useThemeStore } from '@/stores/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    applyTheme(getThemeById(themeId));
  }, [themeId]);

  return <>{children}</>;
}
