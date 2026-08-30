import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddItemModal } from '@/components/add-item-modal';
import { EmptyState } from '@/components/empty-state';
import { ItemDetailModal } from '@/components/item-detail-modal';
import { LendModal } from '@/components/lend-modal';
import { PrimaryButton } from '@/components/primary-button';
import { SeoHead } from '@/components/seo-head';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getLoanForItem, useStore } from '@/lib/store';

export default function ItemsScreen() {
  const store = useStore();
  const [addVisible, setAddVisible] = useState(false);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [lendModal, setLendModal] = useState<{ visible: boolean; itemId?: string }>({ visible: false });

  const visibleItems = useMemo(
    () => store.items.filter((item) => !item.ownerId || getLoanForItem(store, item.id)),
    [store],
  );

  return (
    <ThemedView style={styles.container}>
      <SeoHead
        title="Items — Lendly"
        description="Every item you've added to Lendly, and who currently has it. Free, no sign-up."
        path="items"
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.contentWeb]}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Items</ThemedText>
            <PrimaryButton label="+ Add" onPress={() => setAddVisible(true)} />
          </View>

          {visibleItems.length === 0 ? (
            <EmptyState message="No items yet. Add the things you might lend out." />
          ) : (
            <View style={styles.list}>
              {visibleItems.map((item) => {
                const loan = getLoanForItem(store, item.id);
                const statusLabel = loan
                  ? loan.direction === 'lent_out'
                    ? `Lent to ${loan.person.name}`
                    : `Borrowed from ${loan.person.name}`
                  : 'Available';
                return (
                  <Pressable key={item.id} onPress={() => setDetailItemId(item.id)}>
                    <ThemedView type="backgroundElement" style={styles.row}>
                      <View style={styles.rowMain}>
                        <ThemedText type="smallBold">{item.name}</ThemedText>
                        {item.category && (
                          <ThemedText type="small" themeColor="textSecondary">
                            {item.category}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText type="small" themeColor={loan ? undefined : 'textSecondary'}>
                        {statusLabel}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AddItemModal visible={addVisible} onClose={() => setAddVisible(false)} />
      <ItemDetailModal
        visible={detailItemId !== null}
        itemId={detailItemId}
        onClose={() => setDetailItemId(null)}
        onLend={(itemId) => {
          setDetailItemId(null);
          setLendModal({ visible: true, itemId });
        }}
      />
      <LendModal visible={lendModal.visible} itemId={lendModal.itemId} onClose={() => setLendModal({ visible: false })} />
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
    alignItems: 'center',
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  rowMain: {
    gap: 2,
  },
});
