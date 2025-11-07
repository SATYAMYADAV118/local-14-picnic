import { createContext, ReactNode, useContext, useEffect } from 'react';

type ThemeContextValue = Record<string, any>;

const ThemeContext = createContext<ThemeContextValue>({});

export function ThemeProvider({ value, children }: { value: ThemeContextValue; children: ReactNode }) {
  useEffect(() => {
    if (!value) return;
    const root = document.documentElement;
    if (value.theme_primary) {
      root.style.setProperty('--l4p-primary', value.theme_primary);
    }
    if (value.theme_accent) {
      root.style.setProperty('--l4p-accent', value.theme_accent);
    }
  }, [value]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings() {
  return useContext(ThemeContext);
}
