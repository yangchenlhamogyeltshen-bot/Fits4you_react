import { useState, useCallback } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItems, setCapsule } from '../database/clothingDao';
import { getTraditional, setTraditionalCapsule } from '../database/traditionalDao';
import { colorName } from '../constants';
import { Screen, Header, Txt, Button, ItemCard, EmptyState } from '../components/UI';

const subtitleOf = (item) =>
  item.type === 'traditional'
    ? `${item.piece_type} · ${item.occasion}`
    : `${item.category} · ${colorName(item.color)}`;

export default function CapsuleScreen({ navigation, embedded }) {
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

  const capsule = all.filter((i) => i.is_capsule === 1);
  const others = all.filter((i) => i.is_capsule !== 1);
  const data = adding ? others : capsule;

  const setFlag = async (item, flag) => {
    if (item.type === 'modern') await setCapsule(db, item.id, flag);
    else await setTraditionalCapsule(db, item.id, flag);
    load();
  };

  const remove = (item) => {
    Alert.alert('Remove from essentials', `Remove ${item.name} from your essentials?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setFlag(item, false) },
    ]);
  };

  return (
    <Screen>
      {embedded ? null : <Header title="Essentials" subtitle={`${capsule.length} pieces`} />}
      <View style={{ padding: 16 }}>
        <Txt muted size={13} style={{ marginBottom: 10 }}>
          {adding ? 'Tap a piece to make it an essential.' : 'Your core pieces. Long-press one to remove it.'}
        </Txt>
        <Button
          title={adding ? 'Done' : 'Add More Essentials'}
          icon={adding ? 'checkmark' : 'add-circle-outline'}
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
            icon="albums-outline"
            title={adding ? 'Nothing left to add' : 'No essentials yet'}
            text={adding ? 'Every piece is already an essential.' : 'Choose a few pieces you wear all the time.'}
          />
        }
        renderItem={({ item }) => (
          <ItemCard
            title={item.name}
            subtitle={subtitleOf(item)}
            uri={item.image_uri}
            essential={!adding}
            badge={item.status === 'Needs washing' ? 'NEEDS WASH' : null}
            onPress={() => (adding ? setFlag(item, true) : navigation.navigate('PieceDetails', { id: item.id, type: item.type }))}
            onLongPress={() => !adding && remove(item)}
          />
        )}
      />
    </Screen>
  );
}