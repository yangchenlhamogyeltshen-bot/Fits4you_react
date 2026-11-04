import { useState, useCallback } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItems, setStatus } from '../database/clothingDao';
import { Screen, Header, Txt, Button, ItemCard, EmptyState } from '../components/UI';

export default function WashingScreen({ navigation, embedded }) {
  const db = useSQLiteContext();
  const [all, setAll] = useState([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setAll(await getItems(db, uid));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const dirty = all.filter((i) => i.status === 'Needs washing');
  const clean = all.filter((i) => i.status !== 'Needs washing');
  const data = adding ? clean : dirty;

  const markDirty = async (item) => {
    await setStatus(db, item.id, 'Needs washing');
    load();
  };

  const markClean = (item) => {
    Alert.alert('Washed?', `Mark ${item.name} as clean?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark clean', onPress: async () => { await setStatus(db, item.id, 'Clean'); load(); } },
    ]);
  };

  return (
    <Screen>
      {embedded ? null : <Header title="Needs washing" subtitle={`${dirty.length} pieces`} />}
      <View style={{ padding: 16 }}>
        <Txt muted size={13} style={{ marginBottom: 10 }}>
          {adding ? 'Tap a piece to put it in the wash pile.' : 'Tap a piece once it is washed to mark it clean.'}
        </Txt>
        <Button
          title={adding ? 'Done' : 'Add to Wash Pile'}
          icon={adding ? 'checkmark' : 'water-outline'}
          variant={adding ? 'soft' : 'solid'}
          onPress={() => setAdding(!adding)}
        />
      </View>

      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(i) => String(i.id)}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            icon="water-outline"
            title={adding ? 'Nothing to add' : 'All clean'}
            text={adding ? 'Every piece is already in the wash pile.' : 'Nothing needs washing right now.'}
          />
        }
        renderItem={({ item }) => (
          <ItemCard
            title={item.name}
            subtitle={`${item.category} · ${item.color || '-'}`}
            uri={item.image_uri}
            badge={adding ? undefined : 'NEEDS WASH'}
            onPress={() => (adding ? markDirty(item) : markClean(item))}
            onLongPress={() => navigation.navigate('PieceDetails', { id: item.id, type: 'modern' })}
          />
        )}
      />
    </Screen>
  );
}