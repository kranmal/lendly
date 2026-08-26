import { Pressable, StyleSheet, View } from 'react-native';

import { FormInput } from './form-input';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useStore } from '@/lib/store';

type PersonNameFieldProps = {
  value: string;
  onChange: (name: string) => void;
};

export function PersonNameField({ value, onChange }: PersonNameFieldProps) {
  const { people } = useStore();

  return (
    <View style={{ gap: Spacing.two }}>
      <FormInput label="Person" value={value} onChangeText={onChange} placeholder="Type a name" />
      {people.length > 0 && (
        <View style={styles.chipRow}>
          {people.map((p) => (
            <Pressable key={p.id} onPress={() => onChange(p.name)}>
              <ThemedView type="backgroundElement" style={styles.chip}>
                <ThemedText type="small" themeColor="textSecondary">
                  {p.name}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
