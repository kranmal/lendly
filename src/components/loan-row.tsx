import { Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from './primary-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { formatDate, formatDueLabel } from '@/lib/date';
import { isOverdue } from '@/lib/store';
import type { EnrichedLoan } from '@/lib/store';

type LoanRowProps = {
  loan: EnrichedLoan;
  onPress?: () => void;
  onMarkReturned?: () => void;
};

export function LoanRow({ loan, onPress, onMarkReturned }: LoanRowProps) {
  const overdue = isOverdue(loan);
  const directionLabel = loan.direction === 'lent_out' ? `Lent to ${loan.person.name}` : `Borrowed from ${loan.person.name}`;
  const arrow = loan.direction === 'lent_out' ? '↗' : '↙';

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={styles.mainCol}>
          <ThemedText type="smallBold">
            {arrow} {loan.item.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {directionLabel}
          </ThemedText>
          <ThemedText type="small" themeColor={overdue ? undefined : 'textSecondary'} style={overdue && styles.overdueText}>
            {loan.status === 'returned' ? `Returned ${formatDate(loan.actualReturn ?? loan.dateOut)}` : formatDueLabel(loan.expectedReturn)}
          </ThemedText>
        </View>
        {onMarkReturned && <PrimaryButton label="Returned" variant="secondary" onPress={onMarkReturned} />}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  mainCol: {
    gap: 2,
    flexShrink: 1,
  },
  overdueText: {
    color: '#E5484D',
  },
});
