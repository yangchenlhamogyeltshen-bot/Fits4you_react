import { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { auth } from '../firebase';
import { getItems } from '../database/clothingDao';
import { getTraditional } from '../database/traditionalDao';
import { markWorn } from '../database/wearDao';
import { Screen, Header, Txt, Button, ItemCard, EmptyState } from '../components/UI';
import { useTheme } from '../theme';

export default function MarkWornScreen({ navigation }) {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [wardrobe, setWardrobe] = useState('Modern');
  const [modern, setModern] = useState([]);
  const [traditional, setTraditional] = useState([]);
  const [selected, setSelected] = useState([]); // keys like 'm:3' or 't:5'

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      setModern(await getItems(db, uid));
      setTraditional(await getTraditional(db, uid));
    })();
  }, []);

  const isModern = wardrobe === 'Modern';
  const data = isModern ? modern : traditional;
  const keyOf = (item) => (isModern ? 'm:' : 't:') + item.id;

  const toggle = (item) => {
    const k = keyOf(item);
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  };

  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || selected.length === 0) return;
    const pieces = selected.map((k) => ({
      id: Number(k.slice(2)),
      type: k[0] === 'm' ? 'modern' : 'traditional',
    }));
    await markWorn(db, uid, pieces);
    Alert.alert('Recorded', `${pieces.length} piece(s) marked as worn today.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <Screen>
      <Header title="Mark Worn" onBack={() => navigation.goBack()} subtitle="What did you wear today?" />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.primaryContainer, borderRadius: 24, padding: 4 }}>
          {['Modern', 'Traditional'].map((w) => (
            <TouchableOpacity
              key={w}
              onPress={() => setWardrobe(w)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20, backgroundColor: wardrobe === w ? colors.primary : 'transparent' }}
            >
              <Txt bold color={wardrobe === w ? colors.onPrimary : colors.primary}>{w}</Txt>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(i) => String(i.id)}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={<EmptyState title="Nothing here yet" text="Add pieces in the Closet first." />}
        renderItem={({ item }) => (
          <ItemCard
            title={item.name}
            subtitle={isModern ? `${item.category} · ${item.color || '-'}` : `${item.piece_type} · ${item.occasion}`}
            uri={item.image_uri}
            selected={selected.includes(keyOf(item))}
            onPress={() => toggle(item)}
          />
        )}
      />

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
        <Button
          title={selected.length ? `Mark Worn Today (${selected.length})` : 'Select pieces'}
          icon="checkmark-circle-outline"
          disabled={selected.length === 0}
          onPress={save}
        />
      </View>
    </Screen>
  );
}