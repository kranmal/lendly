import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeOverride } from '@/hooks/use-theme-override';

export function ThemeToggleButton() {
  const scheme = useColorScheme();
  const { setOverride } = useThemeOverride();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Toggle light or dark theme"
      hitSlop={8}
      onPress={() => setOverride(scheme === 'dark' ? 'light' : 'dark')}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.button}>
        <ThemedText style={styles.icon}>{scheme === 'dark' ? '☀' : '◐'}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
