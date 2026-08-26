import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

type ThemeOverride = 'light' | 'dark' | null;

const STORAGE_KEY = 'lendly-theme-override';

const ThemeOverrideContext = createContext<{
  override: ThemeOverride;
  setOverride: (value: ThemeOverride) => void;
}>({ override: null, setOverride: () => {} });

export function ThemeOverrideProvider({ children }: PropsWithChildren) {
  const [override, setOverrideState] = useState<ThemeOverride>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setOverrideState(stored);
    });
  }, []);

  const setOverride = (value: ThemeOverride) => {
    setOverrideState(value);
    if (value) AsyncStorage.setItem(STORAGE_KEY, value);
    else AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ThemeOverrideContext.Provider value={{ override, setOverride }}>{children}</ThemeOverrideContext.Provider>
  );
}

export function useThemeOverride() {
  return useContext(ThemeOverrideContext);
}
