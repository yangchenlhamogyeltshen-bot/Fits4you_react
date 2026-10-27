import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItems, deleteItem } from '../database/clothingDao';
import { getTraditional, deleteTraditional } from '../database/traditionalDao';

export const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];

export default function ClosetScreen({ navigation }) {
  const db = useSQLiteContext();
  const [wardrobe, setWardrobe] = useState('Modern'); // 'Modern' or 'Traditional'
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const isModern = wardrobe === 'Modern';

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (isModern) setItems(await getItems(db, uid, search, category));
    else setItems(await getTraditional(db, uid, search));
  }, [db, isModern, search, category]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = (item) => {
    Alert.alert('Delete item', `Delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (isModern) await deleteItem(db, item.id);
          else await deleteTraditional(db, item.id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        {['Modern', 'Traditional'].map((w) => (
          <TouchableOpacity key={w} onPress={() => { setWardrobe(w); setItems([]); }}
            style={[styles.switchBtn, wardrobe === w && styles.switchActive]}>
            <Text style={wardrobe === w && { color: '#fff', fontWeight: 'bold' }}>{w}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.search} placeholder="Search clothes..." value={search} onChangeText={setSearch} />

      {isModern && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {['All', ...CATEGORIES].map((c) => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipActive]}>
              <Text style={category === c && { color: '#fff' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text style={styles.empty}>Nothing here yet. Tap + to add one.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onLongPress={() => confirmDelete(item)}>
            {item.image_uri ? <Image source={{ uri: item.image_uri }} style={styles.photo} /> : <View style={styles.photo} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text>
                {isModern
                  ? `${item.category} · ${item.color} · ${item.season}`
                  : `${item.piece_type} · ${item.fabric} · ${item.occasion}`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab}
        onPress={() => navigation.navigate(isModern ? 'AddItem' : 'AddTraditional')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  switchRow: { flexDirection: 'row', marginBottom: 8, borderWidth: 1, borderColor: '#5b2a86', borderRadius: 8, overflow: 'hidden' },
  switchBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  switchActive: { backgroundColor: '#5b2a86' },
  search: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 10, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: '#bbb', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, height: 34 },
  chipActive: { backgroundColor: '#5b2a86', borderColor: '#5b2a86' },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  photo: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#ddd' },
  name: { fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 40, color: '#777' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#5b2a86', alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
});