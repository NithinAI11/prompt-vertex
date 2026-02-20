import { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { getDesignTokens } from '../theme';

export const ThemeContext = createContext({
  toggleTheme: () => {},
  setAccent: () => {},
  mode: 'light',
  accent: 'red',
});

export function CustomThemeProvider({ children }) {
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');
  // Default to 'red' as requested
  const [accent, setAccent] = useState(localStorage.getItem('themeAccent') || 'red');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('themeAccent', accent);
  }, [accent]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => createTheme(getDesignTokens(mode, accent)), [mode, accent]);

  return (
    <ThemeContext.Provider value={{ toggleTheme, setAccent, mode, accent }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}