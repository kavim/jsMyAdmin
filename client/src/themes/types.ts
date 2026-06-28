export type ThemeType = 'dark' | 'light';

export interface ThemeColors {
  '--background': string;
  '--foreground': string;
  '--card': string;
  '--card-foreground': string;
  '--popover': string;
  '--popover-foreground': string;
  '--primary': string;
  '--primary-foreground': string;
  '--secondary': string;
  '--secondary-foreground': string;
  '--muted': string;
  '--muted-foreground': string;
  '--accent': string;
  '--accent-foreground': string;
  '--destructive': string;
  '--destructive-foreground': string;
  '--border': string;
  '--input': string;
  '--ring': string;
  '--sidebar': string;
  '--editor': string;
  '--title-bar': string;
  '--status-bar': string;
  '--tab-active': string;
  '--tab-inactive': string;
  '--tree-selected': string;
  '--tree-hover': string;
  '--grid-row-alt': string;
  '--grid-header': string;
}

export interface MonacoThemeConfig {
  base: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  rules: { token: string; foreground: string }[];
  colors: Record<string, string>;
}

export interface ThemePreset {
  id: string;
  label: string;
  type: ThemeType;
  colors: ThemeColors;
  monaco: MonacoThemeConfig;
}
