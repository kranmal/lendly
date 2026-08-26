import { useState } from 'react';
import { View } from 'react-native';

import { FormInput } from './form-input';
import { PrimaryButton } from './primary-button';
import { SheetModal } from './sheet-modal';

import { Spacing } from '@/constants/theme';
import { addItem } from '@/lib/store';

type AddItemModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (itemId: string) => void;
};

export function AddItemModal({ visible, onClose, onCreated }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  function reset() {
    setName('');
    setCategory('');
    setNotes('');
  }

  function submit() {
    if (!name.trim()) return;
    const item = addItem({ name, category, notes });
    reset();
    onCreated?.(item.id);
    onClose();
  }

  return (
    <SheetModal
      visible={visible}
      title="Add item"
      onClose={() => {
        reset();
        onClose();
      }}>
      <View style={{ gap: Spacing.three }}>
        <FormInput label="Name" value={name} onChangeText={setName} placeholder="Cordless drill" autoFocus />
        <FormInput label="Category (optional)" value={category} onChangeText={setCategory} placeholder="Tools" />
        <FormInput label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Chuck key taped to handle" multiline />
        <PrimaryButton label="Add item" onPress={submit} disabled={!name.trim()} />
      </View>
    </SheetModal>
  );
}
