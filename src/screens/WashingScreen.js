import { useState, useCallback } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItems, setStatus } from '../database/clothingDao';
import { getTraditional, setTraditionalStatus } from '../database/traditionalDao';
import { colorName } from '../constants';
import { Screen, Header, Txt, Button, ItemCard, EmptyState } from '../components/UI';

const subtitleOf = (item) =>
  item.type === 'traditional'
    ? `${item.piece_type} · ${item.occasion}`
    : `${item.category} · ${colorName(item.color)}`;

export default function WashingScreen({ navigation, embedded }) {
  const db = useSQLiteContext();
  const [all, setAll] = useState([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const modern = (await getItems(db, uid)).map((i) => ({ ...i, type: 'modern' }));
    const traditional = (await getTraditional(db, uid)).map((i) => ({ ...i, type: 'traditional' }));
    setAll([...modern, ...traditional]);
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const dirty = all.filter((i) => i.status === 'Needs washing');
  const clean = all.filter((i) => i.status !== 'Needs washing');
  const data = adding ? clean : dirty;

  const setFor = async (item, status) => {
    if (item.type === 'modern') await setStatus(db, item.id, status);
    else await setTraditionalStatus(db, item.id, status);
    load();
  };

  const markClean = (item) => {
    Alert.alert('Washed?', `Mark ${item.name} as clean?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark clean', onPress: () => setFor(item, 'Clean') },
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
        keyExtractor={(i) => `${i.type}-${i.id}`}
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
            subtitle={subtitleOf(item)}
            uri={item.image_uri}
            badge={adding ? undefined : 'NEEDS WASH'}
            onPress={() => (adding ? setFor(item, 'Needs washing') : markClean(item))}
            onLongPress={() => navigation.navigate('PieceDetails', { id: item.id, type: item.type })}
          />
        )}
      />
    </Screen>
  );
}