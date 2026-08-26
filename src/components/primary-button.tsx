import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({ label, onPress, disabled, variant = 'primary' }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        (pressed || disabled) && styles.pressed,
      ]}>
      <ThemedText
        type="smallBold"
        themeColor={variant === 'secondary' ? 'text' : undefined}
        style={variant !== 'secondary' && styles.lightText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#3c87f7',
  },
  secondary: {
    backgroundColor: '#F0F0F3',
  },
  danger: {
    backgroundColor: '#E5484D',
  },
  pressed: {
    opacity: 0.7,
  },
  lightText: {
    color: '#ffffff',
  },
});
