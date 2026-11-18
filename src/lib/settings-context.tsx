import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { secureStorage } from './secure-storage';

export type Settings = {
  vercelToken: string;
  vercelProjectId: string;
  vercelTeamId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const EMPTY_SETTINGS: Settings = {
  vercelToken: '',
  vercelProjectId: '',
  vercelTeamId: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
};

const STORAGE_KEY = 'app-tester-settings';

type SettingsContextValue = {
  settings: Settings;
  loading: boolean;
  isVercelConfigured: boolean;
  isSupabaseConfigured: boolean;
  save: (next: Settings) => Promise<void>;
  clear: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await secureStorage.getItem(STORAGE_KEY);
        if (raw) setSettings({ ...EMPTY_SETTINGS, ...JSON.parse(raw) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async (next: Settings) => {
    setSettings(next);
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clear = useCallback(async () => {
    setSettings(EMPTY_SETTINGS);
    await secureStorage.deleteItem(STORAGE_KEY);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loading,
      isVercelConfigured: Boolean(settings.vercelToken && settings.vercelProjectId),
      isSupabaseConfigured: Boolean(settings.supabaseUrl && settings.supabaseAnonKey),
      save,
      clear,
    }),
    [settings, loading, save, clear]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
