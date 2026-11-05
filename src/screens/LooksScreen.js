// Lists the saved looks (reads outfits + outfit_items through looksDao) with Edit and Delete.
// Used on its own or inside CollectionsScreen (embedded hides the page title).
import { useState, useCallback } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getLooks, deleteLook, lookKind, isMixedLook } from '../database/looksDao';
import { Screen, PageTitle, Button, EmptyState, LookCard } from '../components/UI';

// "3 MODERN PIECES", "2 TRADITIONAL PIECES", or a warning for old looks that hold both kinds
function labelOf(items) {
  if (isMixedLook(items)) return `${items.length} MIXED · EDIT TO FIX`;
  const kind = (lookKind(items) || '').toUpperCase();
  return `${items.length} ${kind} ${items.length === 1 ? 'PIECE' : 'PIECES'}`.replace('  ', ' ');
}

export default function LooksScreen({ navigation, embedded }) {
  const db = useSQLiteContext();
  const [looks, setLooks] = useState([]);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setLooks(await getLooks(db, uid));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = (look) => {
    Alert.alert('Delete look', `Delete "${look.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteLook(db, look.id); load(); } },
    ]);
  };

  return (
    <Screen>
      {embedded ? null : <PageTitle title="My Looks" subtitle={`${looks.length} saved`} />}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Button title="Curate Look" icon="add-circle-outline" onPress={() => navigation.navigate('LookEditor', {})} />

        {looks.length === 0 ? (
          <EmptyState
            icon="sparkles-outline"
            title="No looks yet"
            text="Pick two or more pieces and save them as a look."
          />
        ) : (
          looks.map((look) => (
            <LookCard key={look.id} look={look} label={labelOf(look.items)}>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Button title="Edit" variant="soft" style={{ flex: 1, height: 44 }} onPress={() => navigation.navigate('LookEditor', { lookId: look.id })} />
                <Button title="Delete" variant="danger" style={{ flex: 1, height: 44 }} onPress={() => confirmDelete(look)} />
              </View>
            </LookCard>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}