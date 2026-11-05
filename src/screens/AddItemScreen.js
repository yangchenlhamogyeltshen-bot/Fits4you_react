import { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { auth } from '../firebase';
import { addItem } from '../database/clothingDao';
import { CATEGORIES, SEASONS } from '../constants';
import { pickPhoto } from '../utils/photo';
import { Screen, Header, Photo, Button, Input, Label, Swatches, Options, Card, SwitchRow, WarmthPicker } from '../components/UI';
import { radius } from '../theme';

export default function AddItemScreen({ navigation }) {
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('Tops');
  const [season, setSeason] = useState('All Season');
  const [warmth, setWarmth] = useState(3);
  const [capsule, setCapsule] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const choose = async (useCamera) => {
    const uri = await pickPhoto(useCamera);
    if (uri) setImageUri(uri);
  };

  // Picking a season gives warmth a sensible starting value; it can still be changed below
  const chooseSeason = (s) => {
    setSeason(s);
    setWarmth(s === 'Summer' ? 2 : s === 'Winter' ? 4 : 3);
  };

  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (!name.trim()) return Alert.alert('Please enter a name');
    // the DAO reads item.capsule
    await addItem(db, uid, { name: name.trim(), category, color, season, warmth, imageUri, capsule });
    navigation.goBack();
  };

  return (
    <Screen>
      <Header title="Add Clothing" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Photo uri={imageUri} fit="contain" style={{ width: '100%', height: 240, borderRadius: radius.card }} iconSize={56} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Button title="Camera" icon="camera" variant="soft" style={{ flex: 1 }} onPress={() => choose(true)} />
          <Button title="Gallery" icon="images" variant="soft" style={{ flex: 1 }} onPress={() => choose(false)} />
        </View>

        <Label>Name</Label>
        <Input placeholder="e.g. Blue shirt" value={name} onChangeText={setName} />

        <Label>Colour</Label>
        <Swatches value={color} onChange={setColor} />

        <Options label="Category" values={CATEGORIES} value={category} onChange={setCategory} />
        <Options label="Season" values={SEASONS} value={season} onChange={chooseSeason} />
        <WarmthPicker category={category} value={warmth} onChange={setWarmth} />

        <Card flat style={{ marginTop: 20, paddingVertical: 6 }}>
          <SwitchRow
            label="Add to Essentials"
            hint="Slide on to make this one of your core pieces"
            value={capsule}
            onChange={setCapsule}
          />
        </Card>

        <Button title="Save" style={{ marginTop: 28 }} onPress={save} />
      </ScrollView>
    </Screen>
  );
}