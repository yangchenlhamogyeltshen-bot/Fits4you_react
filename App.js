import { useEffect, useState } from 'react';
import { Text, View, Button, StyleSheet } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initDatabase } from './src/database/db';

function TestScreen() {
  const db = useSQLiteContext();
  const [count, setCount] = useState(0);

  const load = async () => {
    const row = await db.getFirstAsync('SELECT COUNT(*) AS n FROM modern_items');
    setCount(row.n);
  };

  const addTestItem = async () => {
    await db.runAsync(
      'INSERT INTO modern_items (user_id, name, category, added_on) VALUES (?, ?, ?, ?)',
      ['test-user', 'Test shirt', 'Tops', Date.now()]
    );
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitsForYou</Text>
      <Text>Items in SQLite: {count}</Text>
      <Button title="Add test item" onPress={addTestItem} />
    </View>
  );
}

export default function App() {
  return (
    <SQLiteProvider databaseName="fitsforyou.db" onInit={initDatabase}>
      <TestScreen />
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: 'bold' },
});