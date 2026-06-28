import type { editor } from 'monaco-editor';
import type { ThemePreset } from '../types';

export function getMonacoThemeId(presetId: string): string {
  return `elendra-${presetId}`;
}

export function buildMonacoThemeData(preset: ThemePreset): editor.IStandaloneThemeData {
  return {
    base: preset.monaco.base,
    inherit: true,
    rules: preset.monaco.rules,
    colors: preset.monaco.colors,
  };
}
