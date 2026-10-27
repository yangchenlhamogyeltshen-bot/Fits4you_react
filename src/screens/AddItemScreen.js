import { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { auth } from '../firebase';
import { addItem } from '../database/clothingDao';
import { CATEGORIES } from './ClosetScreen';

const SEASONS = ['Summer', 'Winter', 'All Season'];

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

export default function AddItemScreen({ navigation }) {
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('Tops');
  const [season, setSeason] = useState('All Season');
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
    await addItem(db, uid, { name: name.trim(), category, color: color.trim(), season, warmth, imageUri });
    navigation.goBack();
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.chip} onPress={() => pickPhoto(true)}><Text>Camera</Text></TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => pickPhoto(false)}><Text>Gallery</Text></TouchableOpacity>
      </View>
      <TextInput style={styles.input} placeholder="Name (e.g. Blue shirt)" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Colour" value={color} onChangeText={setColor} />
      <Options label="Category" values={CATEGORIES} value={category} onChange={setCategory} />
      <Options label="Season" values={SEASONS} value={season} onChange={setSeason} />
      <Options label="Warmth (1 = very light, 5 = very warm)" values={[1, 2, 3, 4, 5]} value={warmth} onChange={setWarmth} />
      <TouchableOpacity style={styles.button} onPress={save}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12 },
  label: { fontWeight: 'bold', marginTop: 6, marginBottom: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#bbb', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: '#5b2a86', borderColor: '#5b2a86' },
  preview: { width: 140, height: 140, borderRadius: 10, alignSelf: 'center' },
  button: { backgroundColor: '#5b2a86', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});