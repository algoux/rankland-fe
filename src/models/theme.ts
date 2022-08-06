import { useState } from 'react';

export default function useThemeModel() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return {
    theme,
    setTheme,
  };
}
