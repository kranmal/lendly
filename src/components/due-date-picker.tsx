import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

const DAY_MS = 1000 * 60 * 60 * 24;

const OPTIONS: { label: string; days: number | null }[] = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: 'No due date', days: null },
];

type DueDatePickerProps = {
  onChange: (expectedReturn: number | undefined) => void;
};

export function DueDatePicker({ onChange }: DueDatePickerProps) {
  const [selected, setSelected] = useState<number | null | undefined>(undefined);

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary">
        Due back
      </ThemedText>
      <View style={styles.chipRow}>
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.days;
          return (
            <Pressable
              key={opt.label}
              onPress={() => {
                setSelected(opt.days);
                onChange(opt.days === null ? undefined : Date.now() + opt.days * DAY_MS);
              }}>
              <ThemedView type={isSelected ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                <ThemedText type="small" themeColor={isSelected ? 'text' : 'textSecondary'}>
                  {opt.label}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
