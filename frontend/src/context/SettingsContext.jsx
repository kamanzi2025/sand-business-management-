import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const SettingsContext = createContext(null);

const FALLBACK_SETTINGS = {
  default_purchase_price: 0,
  default_selling_price: 0,
  default_vat_percentage: 18,
  currency_symbol: 'RWF',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await api.settings.get();
    setSettings(data);
    return data;
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const updateSettings = useCallback(
    async (patch) => {
      const data = await api.settings.update(patch);
      setSettings(data);
      return data;
    },
    []
  );

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
