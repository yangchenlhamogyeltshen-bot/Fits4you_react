import { useState, useCallback } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getItems } from '../database/clothingDao';
import { getTraditional } from '../database/traditionalDao';
import { getLooks } from '../database/looksDao';
import { markWorn } from '../database/wearDao';
import { getWeather } from '../utils/weather';
import { suggestModern, suggestTraditionalAll, traditionalGaps } from '../utils/suggest';
import { getDisplayName } from '../utils/user';
import { OCCASIONS } from '../constants';
import { Screen, Header, IconButton, Card, Txt, Input, Chip, Button, Photo } from '../components/UI';
import { useTheme } from '../theme';

// 1 piece = one big photo, 2 or more = two columns.
// Whole garment visible (contain), with exact pixel sizes so the image always renders.
function PhotoGrid({ items }) {
  const { width } = useWindowDimensions();
  const inner = width - 16 * 2 - 14 * 2;           // scroll padding + card padding
  const single = items.length === 1;
  const size = single ? inner : (inner - 8) / 2;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {items.map((it) => (
        <Photo
          key={`${it.piece_type ? 't' : 'm'}${it.id}`}
          uri={it.image_uri}
          fit="contain"
          style={{ width: size, height: single ? size : size * 1.1, borderRadius: 16 }}
          iconSize={32}
        />
      ))}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [weather, setWeather] = useState(null);
  const [manualTemp, setManualTemp] = useState('');
  const [editTemp, setEditTemp] = useState(false);
  const [modern, setModern] = useState([]);
  const [traditional, setTraditional] = useState([]);
  const [looks, setLooks] = useState([]);
  const [mode, setMode] = useState('Modern'); // 'Modern' or 'Traditional'
  const [occasion, setOccasion] = useState('Daily');
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setName(await getDisplayName(user));
    setModern(await getItems(db, user.uid));
    setTraditional(await getTraditional(db, user.uid));
    setLooks(await getLooks(db, user.uid));
    setWeather(await getWeather(db));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // The user can type the temperature if the weather is not available
  const typed = parseFloat(manualTemp);
  const temp = !isNaN(typed) ? typed : weather?.temperature;
  const rain = weather?.rainChance ?? 0;

  const count = (c) => modern.filter((i) => i.category === c).length;

  const isModern = mode === 'Modern';
  // Saved looks come first, then generated outfits.
  // Traditional outfits borrow their shoes from the modern wardrobe.
  const modernOutfits = temp !== undefined ? suggestModern(modern, looks, temp, rain) : [];
  const tradOutfits =
    temp !== undefined ? suggestTraditionalAll(traditional, looks, occasion, temp, Date.now(), modern) : [];
  const outfits = isModern ? modernOutfits : tradOutfits;
  const picked = outfits.length ? outfits[index % outfits.length] : null;
  const current = picked ? picked.items : [];
  const gaps = !isModern ? traditionalGaps(traditional, occasion) : [];

  const wear = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || current.length === 0) return;
    // A traditional outfit can include a modern shoe, so record each piece by its own kind
    await markWorn(db, uid, current.map((p) => ({ id: p.id, type: p.piece_type ? 'traditional' : 'modern' })));
    Alert.alert('Recorded', 'Marked as worn today.');
    load();
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
  const updated = weather ? new Date(weather.updatedOn).toLocaleTimeString() : '';
  const weatherIcon = rain >= 50 ? 'rainy' : rain >= 20 ? 'partly-sunny' : 'sunny';

  const emptyText = isModern
    ? temp === undefined
      ? 'Weather unavailable. Use "Change temperature" below to type it in.'
      : `Needs a top + a bottom, or a dress. You have ${count('Tops')} tops, ${count('Bottoms')} bottoms, ${count('Dresses')} dresses.`
    : gaps.length
      ? `Add a ${gaps.join(' and ')} for ${occasion} to complete a Kira outfit.`
      : `No outfit for ${occasion} yet. A Kira outfit needs a Kira, Tego and Wonju. A Gho outfit needs a Gho.`;

  return (
    <Screen>
      {/* The settings gear is added by Header automatically */}
      <Header title={`Hello, ${name}`} subtitle={today} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Modern / Traditional switch */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.primaryContainer, borderRadius: 24, padding: 4 }}>
          {['Modern', 'Traditional'].map((w) => (
            <TouchableOpacity
              key={w}
              onPress={() => { setMode(w); setIndex(0); }}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20,
                backgroundColor: mode === w ? colors.primary : 'transparent',
              }}
            >
              <Txt bold color={mode === w ? colors.onPrimary : colors.primary}>{w}</Txt>
            </TouchableOpacity>
          ))}
        </View>

        {/* Occasion chips, only for traditional wear */}
        {!isModern && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: 12 }}>
            {OCCASIONS.map((o) => (
              <Chip key={o} label={o} active={occasion === o} onPress={() => { setOccasion(o); setIndex(0); }} />
            ))}
          </ScrollView>
        )}

        {/* The one thing to focus on: today's outfit */}
        <Card style={{ padding: 14, borderRadius: 24, marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt bold size={18}>
                {picked?.fromLook ? picked.label : isModern ? "Today's pick" : (picked?.label || `${occasion} outfit`)}
              </Txt>
              <Txt muted size={12}>
                {picked ? (picked.fromLook ? 'Your saved look' : 'Suggested for you') : ''}
                {outfits.length > 1 ? ` · ${(index % outfits.length) + 1} of ${outfits.length}` : ''}
              </Txt>
            </View>
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryContainer,
                borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
              }}
            >
              <Ionicons name={weatherIcon} size={16} color={colors.accent} />
              <Txt bold size={13}>{temp !== undefined ? `${Math.round(temp)}°C` : '--'}</Txt>
              <Txt muted size={12}>{rain}%</Txt>
            </View>
          </View>

          {current.length > 0 ? (
            <>
              <PhotoGrid items={current} />
              <Txt muted size={13} numberOfLines={3} style={{ marginTop: 12 }}>
                {current.map((i) => i.name).join(' · ')}
              </Txt>
              {picked?.missing?.length ? (
                <Txt muted size={12} style={{ marginTop: 6 }}>
                  Add {picked.missing.join(' and ').toLowerCase()} to complete this outfit.
                </Txt>
              ) : null}
              <Button title="Wear This Outfit" icon="checkmark-circle-outline" style={{ marginTop: 14 }} onPress={wear} />
              {outfits.length > 1 ? (
                <TouchableOpacity onPress={() => setIndex(index + 1)} style={{ alignItems: 'center', paddingTop: 14 }}>
                  <Txt bold size={14} color={colors.secondary}>Show another outfit</Txt>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
              <Ionicons name="shirt-outline" size={36} color={colors.muted} />
              <Txt muted style={{ textAlign: 'center' }}>{emptyText}</Txt>
              <Button
                title={isModern ? 'Add clothing' : 'Add traditional wear'}
                variant="soft"
                style={{ marginTop: 8 }}
                onPress={() => navigation.navigate(isModern ? 'AddItem' : 'AddTraditional')}
              />
            </View>
          )}
        </Card>

        {/* Quiet extras */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 4 }}>
          <TouchableOpacity onPress={() => setEditTemp(!editTemp)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="thermometer-outline" size={18} color={colors.muted} />
            <Txt muted size={14}>Change temperature</Txt>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MarkWorn')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-done-outline" size={18} color={colors.muted} />
            <Txt muted size={14}>Log what I wore</Txt>
          </TouchableOpacity>
        </View>

        {editTemp && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'center' }}>
            <Input
              style={{ flex: 1, height: 48 }}
              placeholder="Temperature in °C"
              keyboardType="numeric"
              value={manualTemp}
              onChangeText={setManualTemp}
            />
            <IconButton name="refresh" onPress={load} />
          </View>
        )}

        {weather?.fromCache ? (
          <Txt muted size={11} style={{ marginTop: 12, paddingHorizontal: 4 }}>Offline · weather last updated {updated}</Txt>
        ) : null}
      </ScrollView>
    </Screen>
  );
}