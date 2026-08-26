import { View } from 'react-native';

import { LoanRow } from './loan-row';
import { SheetModal } from './sheet-modal';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { getLoansForPerson, markReturned, useStore } from '@/lib/store';

type PersonDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  personId: string | null;
};

export function PersonDetailModal({ visible, onClose, personId }: PersonDetailModalProps) {
  const store = useStore();
  const person = personId ? store.people.find((p) => p.id === personId) : undefined;
  if (!person) return null;

  const loans = getLoansForPerson(store, person.id);

  return (
    <SheetModal visible={visible} onClose={onClose} title={person.name}>
      <View style={{ gap: Spacing.three }}>
        {person.contact && (
          <ThemedText type="small" themeColor="textSecondary">
            {person.contact}
          </ThemedText>
        )}
        {loans.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No loans with {person.name} yet.
          </ThemedText>
        ) : (
          <View style={{ gap: Spacing.two }}>
            {loans.map((loan) => (
              <LoanRow key={loan.id} loan={loan} onMarkReturned={loan.status === 'active' ? () => markReturned(loan.id) : undefined} />
            ))}
          </View>
        )}
      </View>
    </SheetModal>
  );
}
