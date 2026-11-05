import { useState, useCallback } from 'react';
import { View, FlatList, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItems, deleteItem } from '../database/clothingDao';
import { getTraditional, deleteTraditional } from '../database/traditionalDao';
import { CATEGORIES, PIECES, OCCASIONS, colorName } from '../constants';
import { Screen, Header, Txt, SearchBar, Chip, ItemCard, EmptyState } from '../components/UI';
import { useTheme } from '../theme';

const STATUSES = ['All', 'Clean', 'Needs washing'];

export default function ClosetScreen({ navigation }) {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [wardrobe, setWardrobe] = useState('Modern'); // 'Modern' or 'Traditional'
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [piece, setPiece] = useState('All');
  const [occasion, setOccasion] = useState('All');
  const [status, setStatus] = useState('All');

  const isModern = wardrobe === 'Modern';
  const chips = isModern ? ['All', ...CATEGORIES] : ['All', ...PIECES];
  const activeChip = isModern ? category : piece;
  const pickChip = (c) => (isModern ? setCategory(c) : setPiece(c));

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (isModern) {
      setItems(await getItems(db, uid, search, category, status));
    } else {
      // Load everything, then filter here so search, piece type, occasion and washing always work.
      // A piece saved as "Both" shows under Daily and under Special.
      const all = await getTraditional(db, uid);
      const q = search.trim().toLowerCase();
      const washOk = (i) =>
        status === 'All' ||
        (status === 'Needs washing' ? i.status === 'Needs washing' : i.status !== 'Needs washing');
      setItems(
        all.filter(
          (i) =>
            (piece === 'All' || i.piece_type === piece) &&
            (occasion === 'All' || i.occasion === occasion || i.occasion === 'Both') &&
            washOk(i) &&
            (!q || (i.name || '').toLowerCase().includes(q))
        )
      );
    }
  }, [db, isModern, search, category, piece, occasion, status]);

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
    <Screen>
      {/* The settings gear is added by Header automatically */}
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
              <Txt bold color={wardrobe === w ? colors.onPrimary : colors.primary}>{w}</Txt>
            </TouchableOpacity>
          ))}
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search clothes..." />

        {/* Category chips (modern) or piece-type chips (traditional) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginTop: 12 }}
          contentContainerStyle={{ paddingRight: 40 }}
        >
          {chips.map((c) => (
            <Chip key={c} label={c} active={activeChip === c} onPress={() => pickChip(c)} />
          ))}
        </ScrollView>

        {/* Occasion chips, traditional only */}
        {!isModern && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingRight: 40 }}
          >
            {['All', ...OCCASIONS].map((o) => (
              <Chip key={o} label={o} active={occasion === o} onPress={() => setOccasion(o)} />
            ))}
          </ScrollView>
        )}

        {/* Laundry filter, both wardrobes */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingRight: 40 }}
        >
          {STATUSES.map((s) => (
            <Chip key={s} label={s === 'All' ? 'Any status' : s} active={status === s} onPress={() => setStatus(s)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(i) => String(i.id)}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            title="Nothing here yet"
            text="Tap the + button in the bar below to add a piece."
          />
        }
        renderItem={({ item }) => (
          <ItemCard
            title={item.name}
            subtitle={isModern ? `${item.category} · ${colorName(item.color)}` : `${item.piece_type} · ${item.occasion}`}
            uri={item.image_uri}
            essential={item.is_capsule === 1}
            badge={item.status === 'Needs washing' ? 'NEEDS WASH' : null}
            onPress={() => navigation.navigate('PieceDetails', { id: item.id, type: isModern ? 'modern' : 'traditional' })}
            onLongPress={() => confirmDelete(item)}
          />
        )}
      />
    </Screen>
  );
}