import { useState, useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getItems } from '../database/clothingDao';
import { getTraditional } from '../database/traditionalDao';
import { markWorn } from '../database/wearDao';
import { getWeather } from '../utils/weather';
import { suggestOutfits, suggestTraditional } from '../utils/suggest';
import { getDisplayName } from '../utils/user';
import { OCCASIONS } from '../constants';
import { Screen, Header, IconButton, Card, Txt, Input, Chip, Button, Badge, Photo } from '../components/UI';
import { useTheme } from '../theme';

export default function HomeScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [weather, setWeather] = useState(null);
  const [manualTemp, setManualTemp] = useState('');
  const [modern, setModern] = useState([]);
  const [traditional, setTraditional] = useState([]);
  const [occasion, setOccasion] = useState('Daily');

  const load = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setName(await getDisplayName(user));
    setModern(await getItems(db, user.uid));
    setTraditional(await getTraditional(db, user.uid));
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

  const confirmLogout = () => {
    Alert.alert('Log out', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const updated = weather ? new Date(weather.updatedOn).toLocaleTimeString() : '';
  const weatherIcon = rain >= 50 ? 'rainy' : rain >= 20 ? 'partly-sunny' : 'sunny';

  return (
    <Screen>
      <Header
        title={`Hello, ${name}`}
        subtitle="What shall we wear today?"
        right={<IconButton name="log-out-outline" onPress={confirmLogout} />}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {/* Weather strip */}
        <Card style={{ backgroundColor: colors.primary }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Ionicons name={weatherIcon} size={44} color={colors.accent} />
            <View style={{ flex: 1 }}>
              {temp !== undefined ? (
                <>
                  <Txt bold size={28} color="#fff">{Math.round(temp)}°C</Txt>
                  <Txt size={14} color="#fff">{rain}% chance of rain</Txt>
                </>
              ) : (
                <Txt color="#fff">Weather not available. Type the temperature below.</Txt>
              )}
              {weather?.fromCache ? (
                <Txt size={12} color={colors.accent}>Offline · last updated {updated}</Txt>
              ) : null}
            </View>
            <IconButton name="refresh" onPress={load} bg={colors.secondary} tint={colors.onSecondary} />
          </View>
          <Input
            placeholder="Type temperature manually (optional)"
            keyboardType="numeric"
            value={manualTemp}
            onChangeText={setManualTemp}
            style={{ marginTop: 14, height: 48 }}
          />
        </Card>

        {/* Suggested outfits */}
        <Txt bold size={20} color={colors.primary} style={{ marginTop: 22, marginBottom: 10 }}>Picked for you</Txt>
        {outfits.length === 0 && (
          <Card flat>
            <Txt muted>Add tops, bottoms and shoes in the Closet to get suggestions.</Txt>
          </Card>
        )}
        {outfits.map((o, idx) => (
          <Card key={idx} style={{ marginBottom: 14 }}>
            <Badge
              label={idx === 0 ? 'SUGGESTED FOR TODAY' : `OPTION ${idx + 1}`}
              tone={idx === 0 ? 'secondary' : 'primary'}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
              {o.items.map((it) => (
                <View key={it.id} style={{ width: 84 }}>
                  <Photo uri={it.image_uri} style={{ width: 84, height: 84, borderRadius: 14 }} iconSize={28} />
                  <Txt bold size={12} numberOfLines={1} style={{ marginTop: 4 }}>{it.name}</Txt>
                  <Txt muted size={11} numberOfLines={1}>{it.category}</Txt>
                </View>
              ))}
            </View>
            <Button title="Wear This Outfit" icon="checkmark-circle-outline" style={{ marginTop: 14 }} onPress={() => wear(o.items, 'modern')} />
          </Card>
        ))}

        {/* Traditional wear */}
        <Txt bold size={20} color={colors.primary} style={{ marginTop: 14, marginBottom: 10 }}>Traditional wear</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {OCCASIONS.map((o) => (
            <Chip key={o} label={o} active={occasion === o} onPress={() => setOccasion(o)} />
          ))}
        </View>
        {tradPieces.length === 0 ? (
          <Card flat>
            <Txt muted>No traditional pieces for this occasion yet.</Txt>
          </Card>
        ) : (
          <Card>
            <Badge label={occasion.toUpperCase()} tone="accent" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
              {tradPieces.map((it) => (
                <View key={it.id} style={{ width: 84 }}>
                  <Photo uri={it.image_uri} style={{ width: 84, height: 84, borderRadius: 14 }} iconSize={28} />
                  <Txt bold size={12} numberOfLines={1} style={{ marginTop: 4 }}>{it.name}</Txt>
                  <Txt muted size={11} numberOfLines={1}>{it.piece_type}</Txt>
                </View>
              ))}
            </View>
            <Button title="Wear This Outfit" icon="checkmark-circle-outline" style={{ marginTop: 14 }} onPress={() => wear(tradPieces, 'traditional')} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}