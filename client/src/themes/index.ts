import type { ThemePreset } from './types';
import { darkPlus } from './presets/dark-plus';
import { darcula } from './presets/darcula';
import { dracula } from './presets/dracula';
import { solarizedDark } from './presets/solarized-dark';
import { lightPlus } from './presets/light-plus';
import { solarizedLight } from './presets/solarized-light';
import { oneDark } from './presets/one-dark';
import { githubLight } from './presets/github-light';
import { buildMonacoThemeData, getMonacoThemeId } from './monaco/buildMonacoTheme';

export const THEME_REGISTRY: ThemePreset[] = [
  darkPlus,
  darcula,
  dracula,
  oneDark,
  solarizedDark,
  lightPlus,
  solarizedLight,
  githubLight,
];

export const DEFAULT_THEME_ID = 'dark-plus';

export function getThemeById(id: string): ThemePreset {
  return THEME_REGISTRY.find((t) => t.id === id) ?? darkPlus;
}

export function applyTheme(preset: ThemePreset): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', preset.id);
  root.classList.toggle('dark', preset.type === 'dark');
  root.classList.toggle('light', preset.type === 'light');

  for (const [key, value] of Object.entries(preset.colors)) {
    root.style.setProperty(key, value);
  }
}

export function registerMonacoThemes(monaco: typeof import('monaco-editor')): void {
  for (const preset of THEME_REGISTRY) {
    const themeId = getMonacoThemeId(preset.id);
    monaco.editor.defineTheme(themeId, buildMonacoThemeData(preset));
  }
}

export { getMonacoThemeId, buildMonacoThemeData };
export type { ThemePreset, ThemeType, ThemeColors } from './types';
