import { useState, useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItem, deleteItem, setStatus, setCapsule } from '../database/clothingDao';
import { getTraditionalItem, deleteTraditional } from '../database/traditionalDao';
import { markWorn, getWearHistory } from '../database/wearDao';
import { weightLabel, colorName } from '../constants';
import { Screen, Header, Photo, Card, Txt, Badge, Button, ColorDot, TextAction } from '../components/UI';
import { radius } from '../theme';
 
export default function PieceDetailsScreen({ route, navigation }) {
  const { id, type } = route.params;
  const isModern = type === 'modern';
  const db = useSQLiteContext();
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
 
  const load = useCallback(async () => {
    setItem(isModern ? await getItem(db, id) : await getTraditionalItem(db, id));
    setHistory(await getWearHistory(db, id, type));
  }, [db, id, isModern, type]);
 
  useFocusEffect(useCallback(() => { load(); }, [load]));
 
  if (!item) {
    return (
      <Screen>
        <Header title="Piece Details" onBack={() => navigation.goBack()} />
      </Screen>
    );
  }
 
  const needsWash = isModern && item.status === 'Needs washing';
  const lastWorn = item.last_worn ? new Date(item.last_worn).toLocaleDateString() : 'Never';
 
  const wearToday = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await markWorn(db, uid, [{ id: item.id, type }]);
    Alert.alert('Recorded', 'Marked as worn today.');
    load();
  };
 
  const toggleWash = async () => {
    await setStatus(db, item.id, needsWash ? 'Clean' : 'Needs washing');
    load();
  };
 
  const toggleCapsule = async () => {
    await setCapsule(db, item.id, item.is_capsule !== 1);
    load();
  };
 
  const confirmDelete = () => {
    Alert.alert('Delete item', `Delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (isModern) await deleteItem(db, item.id);
          else await deleteTraditional(db, item.id);
          navigation.goBack();
        },
      },
    ]);
  };
 
  const row = (label, value) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Txt muted>{label}</Txt>
      <Txt bold>{value}</Txt>
    </View>
  );
 
  return (
    <Screen>
      <Header
        title="Piece Details"
        onBack={() => navigation.goBack()}
        right={<TextAction title="Edit" onPress={() => navigation.navigate('EditPiece', { id: item.id, type })} />}
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Photo uri={item.image_uri} fit="contain" style={{ width: '100%', height: 280, borderRadius: radius.card }} iconSize={64} />
 
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {isModern && item.is_capsule === 1 ? <Badge label="ESSENTIAL" /> : null}
          {needsWash ? <Badge label="NEEDS WASHING" tone="accent" /> : null}
        </View>
 
        <Txt bold size={26} style={{ marginTop: 8 }}>{item.name}</Txt>
 
        <Card flat style={{ marginTop: 14 }}>
          {isModern ? (
            <>
              {row('Category', item.category)}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                <Txt muted>Colour</Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ColorDot name={item.color} />
                  <Txt bold>{colorName(item.color)}</Txt>
                </View>
              </View>
              {row('Season', item.season || '-')}
            </>
          ) : (
            <>
              {row('Piece type', item.piece_type)}
              {row('Fabric', item.fabric || '-')}
              {row('Occasion', item.occasion || '-')}
            </>
          )}
          {isModern && item.category === 'Accessories'
            ? row('Weight', weightLabel(item.warmth))
            : row('Warmth', `${item.warmth} / 5`)}
          {row('Times worn', String(item.times_worn))}
          {row('Last worn', lastWorn)}
        </Card>
 
        <Card flat style={{ marginTop: 14 }}>
          <Txt bold size={16}>Wear history</Txt>
          {history.length === 0 ? (
            <Txt muted style={{ marginTop: 6 }}>Not worn yet.</Txt>
          ) : (
            history.map((h, i) => (
              <Txt key={String(i)} muted style={{ marginTop: 6 }}>
                {new Date(h.worn_on).toLocaleDateString()}
              </Txt>
            ))
          )}
        </Card>
 
        <Button title="Mark Worn Today" icon="checkmark-circle-outline" style={{ marginTop: 20 }} onPress={wearToday} />
        {isModern && (
          <>
            <Button
              title={needsWash ? 'Mark as Washed' : 'Needs Washing'}
              icon="water-outline"
              variant="soft"
              style={{ marginTop: 12 }}
              onPress={toggleWash}
            />
            <Button
              title={item.is_capsule === 1 ? 'Remove from Capsule' : 'Add to Capsule'}
              icon="albums-outline"
              variant="soft"
              style={{ marginTop: 12 }}
              onPress={toggleCapsule}
            />
          </>
        )}
        <Button title="Delete" icon="trash-outline" variant="danger" style={{ marginTop: 12 }} onPress={confirmDelete} />
      </ScrollView>
    </Screen>
  );
}