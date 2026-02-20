import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { CustomThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext'; // IMPORT THE NEW PROVIDER
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CustomThemeProvider>
      {/* WRAP THE APP WITH THE SETTINGS PROVIDER */}
      <SettingsProvider>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SettingsProvider>
    </CustomThemeProvider>
  </React.StrictMode>,
);