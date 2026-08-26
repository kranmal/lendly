import { useState } from 'react';
import { View } from 'react-native';

import { FormInput } from './form-input';
import { PrimaryButton } from './primary-button';
import { SheetModal } from './sheet-modal';

import { Spacing } from '@/constants/theme';
import { addPerson } from '@/lib/store';

type AddPersonModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (personId: string) => void;
};

export function AddPersonModal({ visible, onClose, onCreated }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  function reset() {
    setName('');
    setContact('');
  }

  function submit() {
    if (!name.trim()) return;
    const person = addPerson({ name, contact });
    reset();
    onCreated?.(person.id);
    onClose();
  }

  return (
    <SheetModal
      visible={visible}
      title="Add person"
      onClose={() => {
        reset();
        onClose();
      }}>
      <View style={{ gap: Spacing.three }}>
        <FormInput label="Name" value={name} onChangeText={setName} placeholder="Sam Rivera" autoFocus />
        <FormInput
          label="Contact (optional)"
          value={contact}
          onChangeText={setContact}
          placeholder="Phone or email"
        />
        <PrimaryButton label="Add person" onPress={submit} disabled={!name.trim()} />
      </View>
    </SheetModal>
  );
}
