import { useState, useCallback } from 'react';
import { colors, shadow } from '../theme';
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
  container: { flex: 1, padding: 14, backgroundColor: colors.bg },
  switchRow: { flexDirection: 'row', marginBottom: 10, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 4 },
  switchBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  switchActive: { backgroundColor: colors.primary },
  search: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, height: 36 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  row: { flexDirection: 'row', gap: 14, padding: 12, marginTop: 10, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, ...shadow },
  photo: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.primaryLight },
  name: { fontWeight: 'bold', fontSize: 16, color: colors.text },
  empty: { textAlign: 'center', marginTop: 50, color: colors.muted },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
});