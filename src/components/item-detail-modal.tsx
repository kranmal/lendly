import { View } from 'react-native';

import { PrimaryButton } from './primary-button';
import { SheetModal } from './sheet-modal';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { formatDueLabel } from '@/lib/date';
import { getLoanForItem, markReturned, useStore } from '@/lib/store';

type ItemDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  itemId: string | null;
  onLend: (itemId: string) => void;
};

export function ItemDetailModal({ visible, onClose, itemId, onLend }: ItemDetailModalProps) {
  const store = useStore();
  const item = itemId ? store.items.find((i) => i.id === itemId) : undefined;
  if (!item) return null;

  const loan = getLoanForItem(store, item.id);
  const owner = item.ownerId ? store.people.find((p) => p.id === item.ownerId) : undefined;

  return (
    <SheetModal visible={visible} onClose={onClose} title={item.name}>
      <View style={{ gap: Spacing.three }}>
        {item.category && (
          <ThemedText type="small" themeColor="textSecondary">
            {item.category}
          </ThemedText>
        )}
        {owner && (
          <ThemedText type="small" themeColor="textSecondary">
            Belongs to {owner.name}
          </ThemedText>
        )}
        {item.notes && <ThemedText type="small">{item.notes}</ThemedText>}

        {loan ? (
          <View style={{ gap: Spacing.two }}>
            <ThemedText type="small">
              {loan.direction === 'lent_out' ? `Lent to ${loan.person.name}` : `Borrowed from ${loan.person.name}`} ·{' '}
              {formatDueLabel(loan.expectedReturn)}
            </ThemedText>
            <PrimaryButton
              label="Mark returned"
              onPress={() => {
                markReturned(loan.id);
                onClose();
              }}
            />
          </View>
        ) : (
          !item.ownerId && <PrimaryButton label="Lend this" onPress={() => onLend(item.id)} />
        )}
      </View>
    </SheetModal>
  );
}
