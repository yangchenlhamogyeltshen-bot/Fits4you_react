import { useState, useCallback } from 'react';
import { View, ScrollView, Alert, Text } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getLooks, deleteLook } from '../database/looksDao';
import { Screen, PageTitle, Card, Txt, Button, Photo, EmptyState } from '../components/UI';
import { useTheme } from '../theme';

export default function LooksScreen({ navigation, embedded }) {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [looks, setLooks] = useState([]);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setLooks(await getLooks(db, uid));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = (look) => {
    Alert.alert('Delete look', `Delete "${look.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteLook(db, look.id); load(); } },
    ]);
  };

  return (
    <Screen>
      {embedded ? null : <PageTitle title="My Looks" subtitle={`${looks.length} saved`} />}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Button title="Curate Look" icon="add-circle-outline" onPress={() => navigation.navigate('LookEditor', {})} />

        {looks.length === 0 ? (
          <EmptyState
            icon="sparkles-outline"
            title="No looks yet"
            text="Pick two or more pieces and save them as a look."
          />
        ) : (
          looks.map((look) => (
            <Card key={look.id} style={{ marginTop: 16, padding: 0, overflow: 'hidden', borderRadius: 24 }}>
              {/* Whole garments, never cropped */}
              <View style={{ flexDirection: 'row', height: 200, backgroundColor: '#fff' }}>
                {look.items.length === 0 ? (
                  <Photo style={{ flex: 1, height: '100%' }} iconSize={44} />
                ) : (
                  look.items.slice(0, 4).map((it) => (
                    <Photo
                      key={`${it.type}-${it.id}`}
                      uri={it.image_uri}
                      fit="contain"
                      style={{ flex: 1, height: '100%' }}
                      iconSize={28}
                    />
                  ))
                )}
              </View>

              <View style={{ padding: 16 }}>
                {/* The look's name, large and bold */}
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }} numberOfLines={1}>
                  {look.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <View style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: 'bold' }}>
                      {look.items.length} {look.items.length === 1 ? 'PIECE' : 'PIECES'}
                    </Text>
                  </View>
                  <Txt muted size={12} numberOfLines={1} style={{ flex: 1 }}>
                    {look.items.map((i) => i.name).join(' · ')}
                  </Txt>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <Button title="Edit" variant="soft" style={{ flex: 1, height: 44 }} onPress={() => navigation.navigate('LookEditor', { lookId: look.id })} />
                  <Button title="Delete" variant="danger" style={{ flex: 1, height: 44 }} onPress={() => confirmDelete(look)} />
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}