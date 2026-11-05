import { Theme, themes } from '../theme';
import { useAppStore } from '../store/useAppStore';

export function useTheme(): Theme {
  const themeMode = useAppStore((s) => s.themeMode);
  return themes[themeMode];
}
