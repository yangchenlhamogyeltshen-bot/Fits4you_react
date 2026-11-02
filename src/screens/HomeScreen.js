import { useState, useCallback } from 'react';
import { colors, shadow } from '../theme';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getItems } from '../database/clothingDao';
import { getTraditional } from '../database/traditionalDao';
import { markWorn } from '../database/wearDao';
import { getWeather } from '../utils/weather';
import { suggestOutfits, suggestTraditional } from '../utils/suggest';

const OCCASIONS = ['Daily', 'Tshechu', 'Losar', 'Wedding'];

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [weather, setWeather] = useState(null);
  const [manualTemp, setManualTemp] = useState('');
  const [modern, setModern] = useState([]);
  const [traditional, setTraditional] = useState([]);
  const [occasion, setOccasion] = useState('Daily');

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setModern(await getItems(db, uid));
    setTraditional(await getTraditional(db, uid));
    setWeather(await getWeather(db));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // The user can type the temperature if the weather is not available
  const typed = parseFloat(manualTemp);
  const temp = !isNaN(typed) ? typed : weather?.temperature;
  const rain = weather?.rainChance ?? 0;

  const outfits = temp !== undefined ? suggestOutfits(modern, temp, rain) : [];
  const tradPieces = temp !== undefined ? suggestTraditional(traditional, occasion, temp) : [];

  const wear = async (pieces, type) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await markWorn(db, uid, pieces.map((p) => ({ id: p.id, type })));
    Alert.alert('Recorded', 'Marked as worn today.');
    load();
  };

  const updated = weather ? new Date(weather.updatedOn).toLocaleTimeString() : '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hello}>Hello, {auth.currentUser?.email}</Text>

      <View style={styles.card}>
        {weather ? (
          <Text style={styles.weather}>
            {Math.round(temp)}°C feels like · {rain}% chance of rain
            {weather.fromCache ? `\nOffline: last updated ${updated}` : ''}
          </Text>
        ) : (
          <Text>Weather not available. Type the temperature below.</Text>
        )}
        <TextInput style={styles.input} placeholder="Type temperature manually (optional)"
          keyboardType="numeric" value={manualTemp} onChangeText={setManualTemp} />
      </View>

      <Text style={styles.heading}>Picked for you</Text>
      {outfits.length === 0 && (
        <Text style={styles.muted}>Add tops, bottoms and shoes in the Closet to get suggestions.</Text>
      )}
      {outfits.map((o, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.bold}>Outfit {idx + 1}</Text>
          {o.items.map((it) => (
            <Text key={it.id}>• {it.name} ({it.category}, warmth {it.warmth})</Text>
          ))}
          <TouchableOpacity style={styles.button} onPress={() => wear(o.items, 'modern')}>
            <Text style={styles.buttonText}>Wear this</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.heading}>Traditional wear</Text>
      <View style={styles.wrap}>
        {OCCASIONS.map((o) => (
          <TouchableOpacity key={o} onPress={() => setOccasion(o)} style={[styles.chip, occasion === o && styles.chipActive]}>
            <Text style={occasion === o && { color: '#fff' }}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tradPieces.length === 0 ? (
        <Text style={styles.muted}>No traditional pieces for this occasion yet.</Text>
      ) : (
        <View style={styles.card}>
          {tradPieces.map((it) => (
            <Text key={it.id}>• {it.name} ({it.piece_type}, {it.fabric})</Text>
          ))}
          <TouchableOpacity style={styles.button} onPress={() => wear(tradPieces, 'traditional')}>
            <Text style={styles.buttonText}>Wear this</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => signOut(auth)}>
        <Text style={styles.logout}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: colors.bg },
  hello: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  heading: { fontSize: 20, fontWeight: 'bold', marginTop: 10, color: colors.primary },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, gap: 4, ...shadow },
  weather: { fontSize: 17, color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, marginTop: 8, backgroundColor: colors.bg },
  muted: { color: colors.muted },
  bold: { fontWeight: 'bold', fontSize: 16, color: colors.text },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  logout: { color: colors.primary, textAlign: 'center', marginTop: 20, fontWeight: '600' },
});