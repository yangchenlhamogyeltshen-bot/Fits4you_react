import { useState, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../firebase';
import { getStats } from '../database/statsDao';
import { Screen, Header, Card, Txt, Photo } from '../components/UI';
import { useTheme } from '../theme';

function Stat({ label, value }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      <Txt bold size={30} color={colors.primary}>{value}</Txt>
      <Txt muted size={13}>{label}</Txt>
    </Card>
  );
}

function PieceList({ title, rows, empty }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <Txt bold size={18} color={colors.primary} style={{ marginBottom: 10 }}>{title}</Txt>
      <Card>
        {rows.length === 0 ? (
          <Txt muted>{empty}</Txt>
        ) : (
          rows.map((r) => (
            <View key={`${r.type}-${r.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
              <Photo uri={r.image_uri} style={{ width: 44, height: 44, borderRadius: 10 }} iconSize={18} />
              <Txt bold style={{ flex: 1 }} numberOfLines={1}>{r.name}</Txt>
              <Txt muted>{r.times_worn ? `Worn ${r.times_worn}×` : 'Not worn yet'}</Txt>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

export default function StatsScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setStats(await getStats(db, uid));
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!stats) {
    return (
      <Screen>
        <Header title="Statistics" />
      </Screen>
    );
  }

  const max = stats.categories.length ? stats.categories[0].n : 0;

  // Only the pieces at the extreme are listed: the highest count for Most worn,
  // the lowest count for Least used. A piece never appears in both lists.
  const key = (r) => `${r.type}-${r.id}`;
  const topCount = Math.max(0, ...stats.mostWorn.map((r) => r.times_worn || 0));
  const most = topCount >= 2 ? stats.mostWorn.filter((r) => (r.times_worn || 0) === topCount) : [];
  const lowCount = stats.leastUsed.length ? Math.min(...stats.leastUsed.map((r) => r.times_worn || 0)) : 0;
  const least = stats.leastUsed.filter(
    (r) => (r.times_worn || 0) === lowCount && !most.some((m) => key(m) === key(r))
  );

  return (
    <Screen>
      <Header title="Statistics" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat label="Modern pieces" value={stats.modern} />
          <Stat label="Traditional" value={stats.traditional} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Stat label="Times worn" value={stats.wears} />
          <Stat label="Saved looks" value={stats.looks} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Stat label="Essentials" value={stats.capsule} />
          <Stat label="Need washing" value={stats.needsWash} />
        </View>

        <PieceList title="Most worn" rows={most} empty="Wear a piece at least twice to see it here." />
        <PieceList title="Least used" rows={least} empty="Add some clothes first." />

        <View style={{ marginTop: 22 }}>
          <Txt bold size={18} color={colors.primary} style={{ marginBottom: 10 }}>Category mix</Txt>
          <Card>
            {stats.categories.length === 0 ? (
              <Txt muted>No clothes yet.</Txt>
            ) : (
              stats.categories.map((c) => (
                <View key={c.category} style={{ marginVertical: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Txt bold size={14}>{c.category}</Txt>
                    <Txt muted size={14}>{c.n}</Txt>
                  </View>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.primaryContainer, marginTop: 4 }}>
                    <View
                      style={{
                        height: 10, borderRadius: 5, backgroundColor: colors.secondary,
                        width: `${max ? Math.round((c.n / max) * 100) : 0}%`,
                      }}
                    />
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}