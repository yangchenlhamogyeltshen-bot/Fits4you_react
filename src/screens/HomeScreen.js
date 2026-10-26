import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function HomeScreen() {
  console.log('HOME rendered');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {auth.currentUser?.email}</Text>
      <Text>Weather and outfit suggestions will appear here.</Text>
      <Button title="Log out" onPress={async () => { console.log('LOGOUT pressed'); await signOut(auth); console.log('LOGOUT done'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
});