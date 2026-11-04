import { useState, useCallback } from 'react';
import { View, FlatList, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItems, deleteItem } from '../database/clothingDao';
import { getTraditional, deleteTraditional } from '../database/traditionalDao';
import { CATEGORIES } from '../constants';
import { Screen, Header, Txt, SearchBar, Chip, ItemCard, EmptyState } from '../components/UI';
import { useTheme } from '../theme';

export default function ClosetScreen({ navigation }) {
  const { colors } = useTheme();
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

  const showDetails = (item) => {
    const lines = isModern
      ? `${item.category} · ${item.color || 'No colour'} · ${item.season}\nWarmth ${item.warmth}/5 · worn ${item.times_worn} times`
      : `${item.piece_type} · ${item.fabric || 'No fabric'} · ${item.occasion}\nWarmth ${item.warmth}/5 · worn ${item.times_worn} times`;
    Alert.alert(item.name, lines, [
      { text: 'Close', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(item) },
    ]);
  };

  return (
    <Screen>
      <Header title="My Wardrobe" subtitle={`${items.length} ${items.length === 1 ? 'piece' : 'pieces'}`} />

      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        {/* Modern / Traditional switch */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.primaryContainer, borderRadius: 24, padding: 4, marginBottom: 12 }}>
          {['Modern', 'Traditional'].map((w) => (
            <TouchableOpacity
              key={w}
              onPress={() => { setWardrobe(w); setItems([]); }}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20,
                backgroundColor: wardrobe === w ? colors.primary : 'transparent',
              }}
            >
              <Txt bold color={wardrobe === w ? '#fff' : colors.primary}>{w}</Txt>
            </TouchableOpacity>
          ))}
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search clothes..." />

        {isModern && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: 12 }}>
            {['All', ...CATEGORIES].map((c) => (
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(i) => String(i.id)}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 110 }}
        ListEmptyComponent={
          <EmptyState
            title="Nothing here yet"
            text="Tap the + button to add your first piece."
          />
        }
        renderItem={({ item }) => (
          <ItemCard
            title={item.name}
            subtitle={isModern ? `${item.category} · ${item.color || '-'}` : `${item.piece_type} · ${item.occasion}`}
            uri={item.image_uri}
            essential={isModern && item.is_capsule === 1}
            onPress={() => showDetails(item)}
            onLongPress={() => confirmDelete(item)}
          />
        )}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate(isModern ? 'AddItem' : 'AddTraditional')}
        style={{
          position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30,
          backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', elevation: 6,
        }}
      >
        <Ionicons name="add" size={32} color={colors.onSecondary} />
      </TouchableOpacity>
    </Screen>
  );
}