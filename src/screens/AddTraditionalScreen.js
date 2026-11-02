import { useState } from 'react';
import { colors, shadow } from '../theme';
import { View, Text, TextInput, Image, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { auth } from '../firebase';
import { addTraditional } from '../database/traditionalDao';

const PIECES = ['Gho', 'Kira', 'Tego', 'Wonju', 'Rachu', 'Kabney'];
const OCCASIONS = ['Daily', 'Tshechu', 'Losar', 'Wedding'];

function Options({ label, values, value, onChange }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>
        {values.map((v) => (
          <TouchableOpacity key={v} onPress={() => onChange(v)} style={[styles.chip, value === v && styles.chipActive]}>
            <Text style={value === v && { color: '#fff' }}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function AddTraditionalScreen({ navigation }) {
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [fabric, setFabric] = useState('');
  const [pieceType, setPieceType] = useState('Gho');
  const [occasion, setOccasion] = useState('Daily');
  const [warmth, setWarmth] = useState(3);
  const [imageUri, setImageUri] = useState(null);

  const pickPhoto = async (useCamera) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed');
    const options = { mediaTypes: ['images'], quality: 0.6 };
    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (!name.trim()) return Alert.alert('Please enter a name');
    await addTraditional(db, uid, { name: name.trim(), pieceType, fabric: fabric.trim(), occasion, warmth, imageUri });
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.chip} onPress={() => pickPhoto(true)}><Text>Camera</Text></TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => pickPhoto(false)}><Text>Gallery</Text></TouchableOpacity>
      </View>
      <TextInput style={styles.input} placeholder="Name (e.g. Blue festival gho)" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Fabric (e.g. Kira silk, wool)" value={fabric} onChangeText={setFabric} />
      <Options label="Piece type" values={PIECES} value={pieceType} onChange={setPieceType} />
      <Options label="Occasion" values={OCCASIONS} value={occasion} onChange={setOccasion} />
      <Options label="Warmth (1 = very light, 5 = very warm)" values={[1, 2, 3, 4, 5]} value={warmth} onChange={setWarmth} />
      <TouchableOpacity style={styles.button} onPress={save}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: colors.bg },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, backgroundColor: colors.card },
  label: { fontWeight: 'bold', marginTop: 8, marginBottom: 6, color: colors.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  preview: { width: 150, height: 150, borderRadius: 16, alignSelf: 'center' },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 14, ...shadow },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});