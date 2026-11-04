import { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { getItem, updateItem } from '../database/clothingDao';
import { getTraditionalItem, updateTraditional } from '../database/traditionalDao';
import { CATEGORIES, SEASONS, PIECES, OCCASIONS } from '../constants';
import { pickPhoto } from '../utils/photo';
import { Screen, Header, Photo, Button, Input, Label, Swatches, Options, WarmthPicker } from '../components/UI';
import { radius } from '../theme';
 
export default function EditPieceScreen({ route, navigation }) {
  const { id, type } = route.params;
  const isModern = type === 'modern';
  const db = useSQLiteContext();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('Tops');
  const [season, setSeason] = useState('All Season');
  const [fabric, setFabric] = useState('');
  const [pieceType, setPieceType] = useState('Gho');
  const [occasion, setOccasion] = useState('Daily');
  const [warmth, setWarmth] = useState(3);
  const [imageUri, setImageUri] = useState(null);
 
  useEffect(() => {
    (async () => {
      const it = isModern ? await getItem(db, id) : await getTraditionalItem(db, id);
      if (!it) return navigation.goBack();
      setName(it.name);
      setWarmth(it.warmth ?? 3);
      setImageUri(it.image_uri);
      if (isModern) {
        setColor(it.color || '');
        setCategory(it.category);
        setSeason(it.season || 'All Season');
      } else {
        setFabric(it.fabric || '');
        setPieceType(it.piece_type);
        setOccasion(it.occasion || 'Daily');
      }
      setLoaded(true);
    })();
  }, []);
 
  const choose = async (useCamera) => {
    const uri = await pickPhoto(useCamera);
    if (uri) setImageUri(uri);
  };
 
  const save = async () => {
    if (!name.trim()) return Alert.alert('Please enter a name');
    if (isModern) {
      await updateItem(db, id, { name: name.trim(), category, color, season, warmth, imageUri });
    } else {
      await updateTraditional(db, id, { name: name.trim(), pieceType, fabric: fabric.trim(), occasion, warmth, imageUri });
    }
    navigation.goBack();
  };
 
  if (!loaded) {
    return (
      <Screen>
        <Header title="Edit" onBack={() => navigation.goBack()} />
      </Screen>
    );
  }
 
  return (
    <Screen>
      <Header title={isModern ? 'Edit Clothing' : 'Edit Traditional Wear'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Photo uri={imageUri} fit="contain" style={{ width: '100%', height: 220, borderRadius: radius.card }} iconSize={56} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Button title="Camera" icon="camera" variant="soft" style={{ flex: 1 }} onPress={() => choose(true)} />
          <Button title="Gallery" icon="images" variant="soft" style={{ flex: 1 }} onPress={() => choose(false)} />
        </View>
 
        <Label>Name</Label>
        <Input value={name} onChangeText={setName} />
 
        {isModern ? (
          <>
            <Label>Colour</Label>
            <Swatches value={color} onChange={setColor} />
            <Options label="Category" values={CATEGORIES} value={category} onChange={setCategory} />
            <Options label="Season" values={SEASONS} value={season} onChange={setSeason} />
          </>
        ) : (
          <>
            <Label>Fabric</Label>
            <Input value={fabric} onChangeText={setFabric} />
            <Options label="Piece type" values={PIECES} value={pieceType} onChange={setPieceType} />
            <Options label="Occasion" values={OCCASIONS} value={occasion} onChange={setOccasion} />
          </>
        )}
        <WarmthPicker category={isModern ? category : ''} value={warmth} onChange={setWarmth} />
 
        <Button title="Save Changes" style={{ marginTop: 28 }} onPress={save} />
      </ScrollView>
    </Screen>
  );
}