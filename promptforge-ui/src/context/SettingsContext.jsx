import { createContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getSettings as apiGetSettings, saveSettings as apiSaveSettings } from '../services/api';

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial settings from the backend when the app loads
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const fetchedSettings = await apiGetSettings();
      setSettings(fetchedSettings);
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  // Function to update the settings state locally (for input changes)
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Function to save the current settings state to the backend
  const saveSettingsToServer = useCallback(async () => {
    const response = await apiSaveSettings(settings);
    return response;
  }, [settings]);

  const value = { settings, isLoading, updateSettings, saveSettingsToServer };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};