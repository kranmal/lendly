import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DueDatePicker } from './due-date-picker';
import { FormInput } from './form-input';
import { PersonNameField } from './person-name-field';
import { PrimaryButton } from './primary-button';
import { SheetModal } from './sheet-modal';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { findOrCreatePerson, getActiveLoans, lendItem, useStore } from '@/lib/store';

type LendModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Preselect an item (skips the item picker). */
  itemId?: string;
};

export function LendModal({ visible, onClose, itemId }: LendModalProps) {
  const store = useStore();
  const [pickedItemId, setPickedItemId] = useState<string | undefined>(itemId);
  const [personName, setPersonName] = useState('');
  const [dueDate, setDueDate] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const lentOutIds = useMemo(() => new Set(getActiveLoans(store).map((l) => l.itemId)), [store]);
  const availableItems = useMemo(
    () => store.items.filter((i) => !i.ownerId && !lentOutIds.has(i.id)),
    [store.items, lentOutIds],
  );

  const activeItemId = itemId ?? pickedItemId;

  function reset() {
    setPickedItemId(itemId);
    setPersonName('');
    setDueDate(undefined);
    setNotes('');
  }

  function submit() {
    if (!activeItemId || !personName.trim()) return;
    const person = findOrCreatePerson(personName);
    lendItem({ itemId: activeItemId, personId: person.id, expectedReturn: dueDate, notes });
    reset();
    onClose();
  }

  return (
    <SheetModal
      visible={visible}
      title="Lend an item"
      onClose={() => {
        reset();
        onClose();
      }}>
      <View style={{ gap: Spacing.three }}>
        {!itemId && (
          <View style={{ gap: Spacing.two }}>
            <ThemedText type="small" themeColor="textSecondary">
              Item
            </ThemedText>
            {availableItems.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No available items to lend. Add one from the Items tab first.
              </ThemedText>
            ) : (
              <View style={styles.chipRow}>
                {availableItems.map((item) => {
                  const isSelected = pickedItemId === item.id;
                  return (
                    <Pressable key={item.id} onPress={() => setPickedItemId(item.id)}>
                      <ThemedView type={isSelected ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                        <ThemedText type="small" themeColor={isSelected ? 'text' : 'textSecondary'}>
                          {item.name}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <PersonNameField value={personName} onChange={setPersonName} />
        <DueDatePicker onChange={setDueDate} />
        <FormInput label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="" multiline />

        <PrimaryButton label="Lend it" onPress={submit} disabled={!activeItemId || !personName.trim()} />
      </View>
    </SheetModal>
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
