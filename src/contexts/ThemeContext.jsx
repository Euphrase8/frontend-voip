import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'default';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const themes = {
    default: {
      name: 'Default',
      primary: 'blue',
      secondary: 'gray',
    },
    professional: {
      name: 'Professional',
      primary: 'indigo',
      secondary: 'slate',
    },
    modern: {
      name: 'Modern',
      primary: 'purple',
      secondary: 'gray',
    },
    corporate: {
      name: 'Corporate',
      primary: 'blue',
      secondary: 'slate',
    }
  };

  const value = {
    darkMode,
    setDarkMode,
    toggleDarkMode,
    theme,
    setTheme,
    themes,
    currentTheme: themes[theme] || themes.default,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
