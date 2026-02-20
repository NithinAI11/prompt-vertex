import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Color Palettes
const COLOR_PALETTES = {
  red: { // DEFAULT (Light Red/Rose)
    light: { main: '#f43f5e', light: '#fda4af', dark: '#e11d48', bg: '#fff1f2' },
    dark:  { main: '#fb7185', light: '#fda4af', dark: '#f43f5e', bg: '#4c0519' }
  },
  blue: { // Light Blue
    light: { main: '#0ea5e9', light: '#7dd3fc', dark: '#0284c7', bg: '#f0f9ff' },
    dark:  { main: '#38bdf8', light: '#7dd3fc', dark: '#0ea5e9', bg: '#082f49' }
  },
  lavender: { // Light Lavender/Violet
    light: { main: '#8b5cf6', light: '#c4b5fd', dark: '#7c3aed', bg: '#f5f3ff' },
    dark:  { main: '#a78bfa', light: '#c4b5fd', dark: '#8b5cf6', bg: '#2e1065' }
  },
  yellow: { // Amber/Yellow (Adjusted for contrast)
    light: { main: '#f59e0b', light: '#fcd34d', dark: '#d97706', bg: '#fffbeb' },
    dark:  { main: '#fbbf24', light: '#fde68a', dark: '#f59e0b', bg: '#451a03' }
  },
  green: { // The previous Green look
    light: { main: '#059669', light: '#34d399', dark: '#047857', bg: '#f0fdf4' },
    dark:  { main: '#34d399', light: '#6ee7b7', dark: '#059669', bg: '#022c22' }
  }
};

export const getDesignTokens = (mode, accent = 'red') => {
  const activeColor = COLOR_PALETTES[accent] ? COLOR_PALETTES[accent][mode] : COLOR_PALETTES.red[mode];

  return {
    palette: {
      mode,
      primary: {
        main: activeColor.main,
        light: activeColor.light,
        dark: activeColor.dark,
      },
      secondary: {
        main: mode === 'light' ? '#64748b' : '#94a3b8', // Slate grey as secondary
      },
      background: {
        default: mode === 'light' ? activeColor.bg : '#0f172a', // Colored tint in light, Slate-900 in dark
        paper: mode === 'light' ? '#ffffff' : '#1e293b', // White or Slate-800
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#475569' : '#cbd5e1',
      },
      action: {
        hover: alpha(activeColor.main, 0.08),
        selected: alpha(activeColor.main, 0.16),
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.025em' },
      h2: { fontWeight: 700, letterSpacing: '-0.025em' },
      h3: { fontWeight: 700, letterSpacing: '-0.025em' },
      h4: { fontWeight: 700, letterSpacing: '-0.025em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
          /* Custom Scrollbar for the new theme */
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${alpha(activeColor.main, 0.3)}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${alpha(activeColor.main, 0.5)}; }
          
          .gradient-text {
            background: linear-gradient(135deg, ${activeColor.main} 0%, ${activeColor.dark} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 800;
          }
        `,
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(12px)',
            border: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            boxShadow: mode === 'light' 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)' 
              : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: `0 4px 14px 0 ${alpha(activeColor.main, 0.4)}`,
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            background: `linear-gradient(135deg, ${activeColor.main} 0%, ${activeColor.dark} 100%)`,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            color: mode === 'dark' ? '#9ca3af' : '#e5e7eb',
            '&.Mui-checked': {
              color: activeColor.main,
              '& + .MuiSwitch-track': {
                backgroundColor: activeColor.main,
                opacity: 0.5
              }
            }
          },
          track: {
            backgroundColor: mode === 'dark' ? '#374151' : '#d1d5db',
          },
        },
      },
    },
  };
};