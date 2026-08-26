import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemeOverride } from '@/hooks/use-theme-override';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { override } = useThemeOverride();
  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return override ?? colorScheme;
  }

  return override ?? 'light';
}
