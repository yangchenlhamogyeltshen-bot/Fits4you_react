import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItems, deleteItem } from '../database/clothingDao';

export const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];

export default function ClosetScreen({ navigation }) {
  const db = useSQLiteContext();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const load = useCallback(async () => {
    setItems(await getItems(db, auth.currentUser.uid, search, category));
  }, [db, search, category]);

  // Reload whenever the screen is shown or the search/filter changes
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = (item) => {
    Alert.alert('Delete item', `Delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteItem(db, item.id); load(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.search} placeholder="Search clothes..." value={search} onChangeText={setSearch} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        {['All', ...CATEGORIES].map((c) => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)}
            style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={category === c && { color: '#fff' }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text style={styles.empty}>No clothes yet. Tap + to add one.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onLongPress={() => confirmDelete(item)}>
            {item.image_uri ? <Image source={{ uri: item.image_uri }} style={styles.photo} /> : <View style={styles.photo} />}
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text>{item.category} · {item.color} · {item.season}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddItem')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
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