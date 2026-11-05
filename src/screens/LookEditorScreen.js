// Create or edit a look.
// Reads: modern_items, traditional_items, and (when editing) the look from outfits + outfit_items.
// Rule: a look uses ONE wardrobe, all Modern or all Traditional. This screen enforces it by
// (1) showing only the chosen wardrobe's pieces, (2) clearing the selection when the wardrobe is
// switched, and (3) saving every piece with the type of that one wardrobe. looksDao.js and a
// database trigger check the same rule again.
import { useState, useEffect } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { auth } from '../firebase';
import { getItems } from '../database/clothingDao';
import { getTraditional } from '../database/traditionalDao';
import { saveLook, updateLook, getLook, lookKind } from '../database/looksDao';
import { Screen, Header, Input, Txt, Button, ItemCard, EmptyState, SegmentedControl } from '../components/UI';

const WARDROBES = ['Modern', 'Traditional'];
const MIN_PIECES = 2;

// Second line shown under each piece's name in the picker
const subtitleOf = (item, isModern) =>
  isModern ? `${item.category} · ${item.color || '-'}` : `${item.piece_type} · ${item.occasion}`;

export default function LookEditorScreen({ route, navigation }) {
  const lookId = route.params?.lookId;
  const db = useSQLiteContext();
  const [wardrobe, setWardrobe] = useState('Modern');
  const [modern, setModern] = useState([]);
  const [traditional, setTraditional] = useState([]);
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]); // ids of pieces in the CURRENT wardrobe only
  const [saving, setSaving] = useState(false);

  const isModern = wardrobe === 'Modern';
  const type = isModern ? 'modern' : 'traditional';
  const data = isModern ? modern : traditional;

  // Only loads data. Nothing is saved here.
  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      setModern(await getItems(db, uid));
      setTraditional(await getTraditional(db, uid));
      if (!lookId) return;

      const look = await getLook(db, lookId);
      if (!look) return;
      setName(look.name);

      // Looks saved before this rule existed may mix both wardrobes. Keep the first kind only.
      const kind = lookKind(look.items);
      const kept = look.items.filter((i) => i.type === kind);
      if (kind) setWardrobe(kind === 'modern' ? 'Modern' : 'Traditional');
      setSelectedIds(kept.map((i) => i.id));
      if (kept.length < look.items.length) {
        Alert.alert(
          'Mixed look fixed',
          `This look had both modern and traditional pieces. Only the ${kind} pieces are kept. Press Save Look to apply.`
        );
      }
    })();
  }, [db, lookId]);

  const toggle = (item) =>
    setSelectedIds((ids) => (ids.includes(item.id) ? ids.filter((x) => x !== item.id) : [...ids, item.id]));

  // Switching wardrobe would mix the two, so selected pieces are cleared (after asking)
  const switchWardrobe = (next) => {
    if (next === wardrobe || saving) return;
    if (selectedIds.length === 0) {
      setWardrobe(next);
      return;
    }
    Alert.alert(
      `Switch to ${next}?`,
      `A look can hold modern or traditional pieces, not both. Your ${selectedIds.length} selected piece(s) will be cleared.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', style: 'destructive', onPress: () => { setSelectedIds([]); setWardrobe(next); } },
      ]
    );
  };

  // The only place a look is saved: when you press Save Look
  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || saving) return;
    if (!name.trim()) return Alert.alert('Please name your look');

    // Keep only ids that really exist in the current wardrobe, then tag them all with its type
    const available = new Set(data.map((i) => i.id));
    const pieces = selectedIds.filter((id) => available.has(id)).map((id) => ({ id, type }));
    if (pieces.length < MIN_PIECES) return Alert.alert(`Pick at least ${MIN_PIECES} pieces`);

    setSaving(true);
    try {
      if (lookId) await updateLook(db, lookId, name.trim(), pieces);
      else await saveLook(db, uid, name.trim(), pieces);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save look', String(e.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title={lookId ? 'Edit Look' : 'Curate Look'} onBack={() => navigation.goBack()} />
      <View style={{ padding: 16 }}>
        <Input placeholder="Look name (e.g. Office Monday)" value={name} onChangeText={setName} />
        <Txt muted size={13} style={{ marginTop: 10, marginBottom: 12 }}>
          {selectedIds.length} selected · a look is all Modern or all Traditional.
        </Txt>
        <SegmentedControl options={WARDROBES} value={wardrobe} onChange={switchWardrobe} />
      </View>

      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(i) => `${type}-${i.id}`}
        extraData={selectedIds}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={<EmptyState title="Nothing here yet" text="Add pieces in the Closet first." />}
        renderItem={({ item }) => (
          <ItemCard
            title={item.name}
            subtitle={subtitleOf(item, isModern)}
            uri={item.image_uri}
            selected={selectedIds.includes(item.id)}
            onPress={() => toggle(item)}
          />
        )}
      />

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
        <Button title="Save Look" icon="checkmark" onPress={save} disabled={saving} />
      </View>
    </Screen>
  );
}