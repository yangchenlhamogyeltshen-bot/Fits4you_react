import { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { auth } from '../firebase';
import { addTraditional } from '../database/traditionalDao';
import { PIECES, OCCASIONS } from '../constants';
import { pickPhoto } from '../utils/photo';
import { Screen, Header, Photo, Button, Input, Label, Options } from '../components/UI';
import { radius } from '../theme';

export default function AddTraditionalScreen({ navigation }) {
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [fabric, setFabric] = useState('');
  const [pieceType, setPieceType] = useState('Gho');
  const [occasion, setOccasion] = useState('Daily');
  const [warmth, setWarmth] = useState(3);
  const [imageUri, setImageUri] = useState(null);

  const choose = async (useCamera) => {
    const uri = await pickPhoto(useCamera);
    if (uri) setImageUri(uri);
  };

  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (!name.trim()) return Alert.alert('Please enter a name');
    await addTraditional(db, uid, { name: name.trim(), pieceType, fabric: fabric.trim(), occasion, warmth, imageUri });
    navigation.goBack();
  };

  return (
    <Screen>
      <Header title="Add Traditional Wear" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Photo uri={imageUri} style={{ width: '100%', height: 220, borderRadius: radius.card }} iconSize={56} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Button title="Camera" icon="camera" variant="soft" style={{ flex: 1 }} onPress={() => choose(true)} />
          <Button title="Gallery" icon="images" variant="soft" style={{ flex: 1 }} onPress={() => choose(false)} />
        </View>

        <Label>Name</Label>
        <Input placeholder="e.g. Blue festival gho" value={name} onChangeText={setName} />

        <Label>Fabric</Label>
        <Input placeholder="e.g. Kira silk, wool" value={fabric} onChangeText={setFabric} />

        <Options label="Piece type" values={PIECES} value={pieceType} onChange={setPieceType} />
        <Options label="Occasion" values={OCCASIONS} value={occasion} onChange={setOccasion} />
        <Options label="Warmth (1 = very light, 5 = very warm)" values={[1, 2, 3, 4, 5]} value={warmth} onChange={setWarmth} />

        <Button title="Save" style={{ marginTop: 28 }} onPress={save} />
      </ScrollView>
    </Screen>
  );
}