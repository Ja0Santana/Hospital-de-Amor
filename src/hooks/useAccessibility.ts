import { useState, useEffect } from 'react';

export function useAccessibility() {
  const [fontSize, setFontSizeState] = useState(() => {
    return localStorage.getItem('font-size-level') || 'default';
  });

  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('portal-theme') || 'light';
  });

  useEffect(() => {
    let sizePercent = '106.25%';
    if (fontSize === 'small') sizePercent = '93.75%';
    if (fontSize === 'medium') sizePercent = '112.5%';
    if (fontSize === 'large') sizePercent = '125%';
    if (fontSize === 'xlarge') sizePercent = '137.5%';
    
    document.documentElement.style.fontSize = sizePercent;
    localStorage.setItem('font-size-level', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'contrast') {
      root.classList.add('high-contrast');
    }
    localStorage.setItem('portal-theme', theme);
  }, [theme]);

  const setFontSize = (size: string) => {
    setFontSizeState(size);
  };

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  return {
    fontSize,
    theme,
    setFontSize,
    setTheme
  };
}
