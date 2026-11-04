import { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { auth } from '../firebase';
import { getItems } from '../database/clothingDao';
import { getTraditional } from '../database/traditionalDao';
import { saveLook, updateLook, getLook } from '../database/looksDao';
import { Screen, Header, Input, Txt, Button, ItemCard, EmptyState } from '../components/UI';
import { useTheme } from '../theme';

const keyOf = (type, id) => (type === 'modern' ? 'm:' : 't:') + id;

export default function LookEditorScreen({ route, navigation }) {
  const { colors } = useTheme();
  const lookId = route.params?.lookId;
  const db = useSQLiteContext();
  const [wardrobe, setWardrobe] = useState('Modern');
  const [modern, setModern] = useState([]);
  const [traditional, setTraditional] = useState([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]); // keys like 'm:3' or 't:5'

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      const pieces = selected.map(it => ({ id: it.id, type: it.type }));  // selected holds item objects
      await saveLook(db, uid, name, pieces); 
      if (!uid) return;
      setModern(await getItems(db, uid));
      setTraditional(await getTraditional(db, uid));
      if (lookId) {
        const look = await getLook(db, lookId);
        if (look) {
          setName(look.name);
          setSelected(look.items.map((i) => keyOf(i.type, i.id)));
        }
      }
    })();
  }, []);

  const isModern = wardrobe === 'Modern';
  const data = isModern ? modern : traditional;
  const type = isModern ? 'modern' : 'traditional';

  const toggle = (item) => {
    const k = keyOf(type, item.id);
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  };

  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (!name.trim()) return Alert.alert('Please name your look');
    if (selected.length < 2) return Alert.alert('Pick at least 2 pieces');
    const pieces = selected.map((k) => ({
      id: Number(k.slice(2)),
      type: k[0] === 'm' ? 'modern' : 'traditional',
    }));
    if (lookId) await updateLook(db, lookId, name.trim(), pieces);
    else await saveLook(db, uid, name.trim(), pieces);
    navigation.goBack();
  };

  return (
    <Screen>
      <Header title={lookId ? 'Edit Look' : 'Curate Look'} onBack={() => navigation.goBack()} />
      <View style={{ padding: 16 }}>
        <Input placeholder="Look name (e.g. Office Monday)" value={name} onChangeText={setName} />
        <Txt muted size={13} style={{ marginTop: 10, marginBottom: 12 }}>
          {selected.length} selected · tap pieces to choose. You can mix modern and traditional.
        </Txt>
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
            selected={selected.includes(keyOf(type, item.id))}
            onPress={() => toggle(item)}
          />
        )}
      />

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
        <Button title="Save Look" icon="checkmark" onPress={save} />
      </View>
    </Screen>
  );
}