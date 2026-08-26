import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemeOverride } from '@/hooks/use-theme-override';

export function useColorScheme() {
  const { override } = useThemeOverride();
  const system = useRNColorScheme();
  return override ?? system;
}
