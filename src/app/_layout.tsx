import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeOverrideProvider } from '@/hooks/use-theme-override';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <ThemeOverrideProvider>
      <RootLayoutContent />
    </ThemeOverrideProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
