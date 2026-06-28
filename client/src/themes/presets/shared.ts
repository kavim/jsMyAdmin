import type { MonacoThemeConfig } from '../types';

export const darkMonacoRules = [
  { token: 'comment', foreground: '6a9955' },
  { token: 'keyword', foreground: '569cd6' },
  { token: 'string', foreground: 'ce9178' },
  { token: 'number', foreground: 'b5cea8' },
];

export const lightMonacoRules = [
  { token: 'comment', foreground: '008000' },
  { token: 'keyword', foreground: '0000ff' },
  { token: 'string', foreground: 'a31515' },
  { token: 'number', foreground: '098658' },
];

export function darkMonaco(colors: {
  bg: string;
  fg: string;
  lineHighlight: string;
  selection: string;
  cursor: string;
  lineNumber: string;
  activeLineNumber: string;
}): MonacoThemeConfig {
  return {
    base: 'vs-dark',
    rules: darkMonacoRules,
    colors: {
      'editor.background': colors.bg,
      'editor.foreground': colors.fg,
      'editor.lineHighlightBackground': colors.lineHighlight,
      'editor.selectionBackground': colors.selection,
      'editorCursor.foreground': colors.cursor,
      'editorLineNumber.foreground': colors.lineNumber,
      'editorLineNumber.activeForeground': colors.activeLineNumber,
    },
  };
}

export function lightMonaco(colors: {
  bg: string;
  fg: string;
  lineHighlight: string;
  selection: string;
  cursor: string;
  lineNumber: string;
  activeLineNumber: string;
}): MonacoThemeConfig {
  return {
    base: 'vs',
    rules: lightMonacoRules,
    colors: {
      'editor.background': colors.bg,
      'editor.foreground': colors.fg,
      'editor.lineHighlightBackground': colors.lineHighlight,
      'editor.selectionBackground': colors.selection,
      'editorCursor.foreground': colors.cursor,
      'editorLineNumber.foreground': colors.lineNumber,
      'editorLineNumber.activeForeground': colors.activeLineNumber,
    },
  };
}
