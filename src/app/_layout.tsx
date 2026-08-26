import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeOverrideProvider } from '@/hooks/use-theme-override';

SplashScreen.preventAutoHideAsync();

const ADSENSE_CLIENT_ID = 'ca-pub-6981194323350325';

export default function TabLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (document.querySelector('script[data-adsbygoogle-loader]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    script.crossOrigin = 'anonymous';
    script.dataset.adsbygoogleLoader = 'true';
    document.head.appendChild(script);
  }, []);

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
