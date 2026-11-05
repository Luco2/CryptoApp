import { create } from 'zustand';
import { ThemeMode } from '../theme';

const DEFAULT_SERVER = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://10.0.2.2:3001';

interface AppState {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  serverUrl: DEFAULT_SERVER,
  setServerUrl: (url) => set({ serverUrl: url }),
  themeMode: 'dark',
  setThemeMode: (themeMode) => set({ themeMode }),
}));
