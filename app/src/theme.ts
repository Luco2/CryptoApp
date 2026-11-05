export type ThemeMode = 'dark' | 'light' | 'diva';

export interface Theme {
  mode: ThemeMode;
  bg: string;
  bgCard: string;
  bgInput: string;
  border: string;
  borderLight: string;
  text: string;
  textSub: string;
  textMuted: string;
  accent: string;
  accentText: string;
  positive: string;
  negative: string;
  tabBar: string;
  tabBorder: string;
  header: string;
  switchTrackOn: string;
  switchTrackOff: string;
}

export const themes: Record<ThemeMode, Theme> = {
  dark: {
    mode: 'dark',
    bg: '#0f0f14',
    bgCard: '#1a1a24',
    bgInput: '#0f0f14',
    border: '#2a2a38',
    borderLight: '#1e1e28',
    text: '#ffffff',
    textSub: '#aaaaaa',
    textMuted: '#666666',
    accent: '#6c63ff',
    accentText: '#ffffff',
    positive: '#4caf50',
    negative: '#f44336',
    tabBar: '#0f0f14',
    tabBorder: '#1e1e28',
    header: '#0f0f14',
    switchTrackOn: '#6c63ff',
    switchTrackOff: '#333333',
  },
  light: {
    mode: 'light',
    bg: '#f2f2f7',
    bgCard: '#ffffff',
    bgInput: '#f2f2f7',
    border: '#d1d1d6',
    borderLight: '#e5e5ea',
    text: '#1c1c1e',
    textSub: '#636366',
    textMuted: '#aeaeb2',
    accent: '#5856d6',
    accentText: '#ffffff',
    positive: '#34c759',
    negative: '#ff3b30',
    tabBar: '#ffffff',
    tabBorder: '#e5e5ea',
    header: '#ffffff',
    switchTrackOn: '#5856d6',
    switchTrackOff: '#d1d1d6',
  },
  diva: {
    mode: 'diva',
    bg: '#f5f0ff',
    bgCard: '#ffe8f7',
    bgInput: '#ede8ff',
    border: '#d9aaff',
    borderLight: '#f0d6ff',
    text: '#2d0060',
    textSub: '#7b1fa2',
    textMuted: '#ba68c8',
    accent: '#f048d0',
    accentText: '#ffffff',
    positive: '#40c4ff',
    negative: '#ff1493',
    tabBar: '#f5f0ff',
    tabBorder: '#d9aaff',
    header: '#f5f0ff',
    switchTrackOn: '#f048d0',
    switchTrackOff: '#d9aaff',
  },
};
