import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddPersonModal } from '@/components/add-person-modal';
import { EmptyState } from '@/components/empty-state';
import { PersonDetailModal } from '@/components/person-detail-modal';
import { PrimaryButton } from '@/components/primary-button';
import { SeoHead } from '@/components/seo-head';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getLoansForPerson, useStore } from '@/lib/store';

export default function PeopleScreen() {
  const store = useStore();
  const [addVisible, setAddVisible] = useState(false);
  const [detailPersonId, setDetailPersonId] = useState<string | null>(null);

  return (
    <ThemedView style={styles.container}>
      <SeoHead
        title="People — Lendly"
        description="Everyone you've lent something to or borrowed something from, and what's still outstanding. Free, no sign-up."
        path="people"
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.contentWeb]}>
          <View style={styles.header}>
            <ThemedText type="subtitle">People</ThemedText>
            <PrimaryButton label="+ Add" onPress={() => setAddVisible(true)} />
          </View>

          {store.people.length === 0 ? (
            <EmptyState message="No people yet. They're added automatically the first time you lend or borrow something." />
          ) : (
            <View style={styles.list}>
              {store.people.map((person) => {
                const activeCount = getLoansForPerson(store, person.id).filter((l) => l.status === 'active').length;
                return (
                  <Pressable key={person.id} onPress={() => setDetailPersonId(person.id)}>
                    <ThemedView type="backgroundElement" style={styles.row}>
                      <View style={styles.rowMain}>
                        <ThemedText type="smallBold">{person.name}</ThemedText>
                        {person.contact && (
                          <ThemedText type="small" themeColor="textSecondary">
                            {person.contact}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {activeCount === 0 ? 'Nothing active' : `${activeCount} active`}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AddPersonModal visible={addVisible} onClose={() => setAddVisible(false)} />
      <PersonDetailModal visible={detailPersonId !== null} personId={detailPersonId} onClose={() => setDetailPersonId(null)} />
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
