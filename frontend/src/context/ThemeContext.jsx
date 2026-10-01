import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  {
    id: 'slate-light',
    name: 'Executive Slate',
    mode: 'light',
    icon: '☀️',
    badge: 'Light',
    color: '#4f46e5',
    bg: '#f8fafc',
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Obsidian',
    mode: 'dark',
    icon: '🌙',
    badge: 'Dark',
    color: '#6366f1',
    bg: '#0b0f19',
  },
  {
    id: 'emerald-vault',
    name: 'Emerald Wealth',
    mode: 'dark',
    icon: '💎',
    badge: 'Fintech',
    color: '#10b981',
    bg: '#061a14',
  },
  {
    id: 'amethyst-cyber',
    name: 'Amethyst AI',
    mode: 'dark',
    icon: '🔮',
    badge: 'AI Luxe',
    color: '#8b5cf6',
    bg: '#0f0d1a',
  },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('tracker_theme');
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
    // Default to midnight-dark for modern tech executive feel, or slate-light if preferred
    return 'slate-light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tracker_theme', theme);
  }, [theme]);

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const isDark = currentThemeObj.mode === 'dark';

  const toggleLightDark = () => {
    if (isDark) {
      setTheme('slate-light');
    } else {
      setTheme('midnight-dark');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentThemeObj,
        isDark,
        toggleLightDark,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
