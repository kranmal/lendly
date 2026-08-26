import { useState } from 'react';
import { View } from 'react-native';

import { DueDatePicker } from './due-date-picker';
import { FormInput } from './form-input';
import { PersonNameField } from './person-name-field';
import { PrimaryButton } from './primary-button';
import { SheetModal } from './sheet-modal';

import { Spacing } from '@/constants/theme';
import { borrowItem, findOrCreatePerson } from '@/lib/store';

type BorrowModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function BorrowModal({ visible, onClose }: BorrowModalProps) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [personName, setPersonName] = useState('');
  const [dueDate, setDueDate] = useState<number | undefined>(undefined);

  function reset() {
    setItemName('');
    setCategory('');
    setPersonName('');
    setDueDate(undefined);
  }

  function submit() {
    if (!itemName.trim() || !personName.trim()) return;
    const person = findOrCreatePerson(personName);
    borrowItem({ name: itemName, category, personId: person.id, expectedReturn: dueDate });
    reset();
    onClose();
  }

  return (
    <SheetModal
      visible={visible}
      title="I'm borrowing something"
      onClose={() => {
        reset();
        onClose();
      }}>
      <View style={{ gap: Spacing.three }}>
        <FormInput label="What did you borrow?" value={itemName} onChangeText={setItemName} placeholder="Ladder" autoFocus />
        <FormInput label="Category (optional)" value={category} onChangeText={setCategory} placeholder="Tools" />
        <PersonNameField value={personName} onChange={setPersonName} />
        <DueDatePicker onChange={setDueDate} />
        <PrimaryButton label="Log it" onPress={submit} disabled={!itemName.trim() || !personName.trim()} />
      </View>
    </SheetModal>
  );
}
