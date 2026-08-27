import { useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdUnit } from '@/components/ad-unit';
import { BorrowModal } from '@/components/borrow-modal';
import { EmptyState } from '@/components/empty-state';
import { LendModal } from '@/components/lend-modal';
import { LoanRow } from '@/components/loan-row';
import { PrimaryButton } from '@/components/primary-button';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { getActiveLoans, isOverdue, markReturned, useStore } from '@/lib/store';

export default function HomeScreen() {
  const now = useNow();
  const store = useStore();
  const [lendVisible, setLendVisible] = useState(false);
  const [borrowVisible, setBorrowVisible] = useState(false);

  const activeLoans = getActiveLoans(store);
  const overdueCount = activeLoans.filter((loan) => isOverdue(loan, now)).length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.contentWeb]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="title" style={styles.title}>
                Lendly
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {activeLoans.length === 0
                  ? "Nothing's out right now."
                  : `${activeLoans.length} item${activeLoans.length === 1 ? '' : 's'} out${overdueCount ? ` · ${overdueCount} overdue` : ''}`}
              </ThemedText>
            </View>
            <ThemeToggleButton />
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.actionButton}>
              <PrimaryButton label="Lend an item" onPress={() => setLendVisible(true)} />
            </View>
            <View style={styles.actionButton}>
              <PrimaryButton label="I'm borrowing something" variant="secondary" onPress={() => setBorrowVisible(true)} />
            </View>
          </View>

          {activeLoans.length === 0 ? (
            <EmptyState message="Add an item and lend it, or log something you've borrowed from a friend." />
          ) : (
            <View style={styles.list}>
              {activeLoans.map((loan) => (
                <LoanRow key={loan.id} loan={loan} onMarkReturned={() => markReturned(loan.id)} />
              ))}
            </View>
          )}

          {Platform.OS === 'web' && <AdUnit />}

          {Platform.OS === 'web' && (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.footer}
              onPress={() => Linking.openURL('https://kranmal.github.io/privacy.html')}>
              Privacy Policy
            </ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>

      <LendModal visible={lendVisible} onClose={() => setLendVisible(false)} />
      <BorrowModal visible={borrowVisible} onClose={() => setBorrowVisible(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
    width: '100%',
    alignSelf: 'center',
  },
  contentWeb: {
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionButton: {
    flex: 1,
  },
  list: {
    gap: Spacing.two,
  },
  footer: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
