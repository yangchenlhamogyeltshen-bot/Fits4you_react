import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Switch } from 'react-native';
import { useTheme } from '../theme';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { getDisplayName } from '../utils/user';
import { Screen, Header, Card, Txt, Input, Button, Label } from '../components/UI';

export default function SettingsScreen({ navigation }) {
  const { colors, dark, setDark } = useTheme();
  const [name, setName] = useState('');
  const email = auth.currentUser?.email || '';

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (user) setName(await getDisplayName(user));
    })();
  }, []);

  const saveName = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!name.trim()) return Alert.alert('Please enter a name');
    try {
      await updateProfile(user, { displayName: name.trim() });
      Alert.alert('Saved', 'Your name has been updated.');
    } catch (e) {
      Alert.alert('Could not save', String(e && e.message ? e.message : e));
    }
  };

  const confirmLogout = () => {
    Alert.alert('Log out', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <Screen>
      <Header title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Txt bold size={18}>Account</Txt>
          <Txt muted size={13} style={{ marginTop: 4 }}>{email}</Txt>
          <Label>Display name</Label>
          <Input value={name} onChangeText={setName} placeholder="Your name" />
          <Button title="Save Name" variant="soft" style={{ marginTop: 14 }} onPress={saveName} />
        </Card>
                <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Txt bold size={18}>Dark mode</Txt>
              <Txt muted size={13}>Easier on the eyes at night.</Txt>
            </View>
            <Switch
              value={dark}
              onValueChange={setDark}
              trackColor={{ true: colors.secondary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Txt bold size={18}>About</Txt>
          <Txt muted size={13} style={{ marginTop: 4 }}>
            FitsForYou keeps your closet on this phone, so it works without internet. Weather suggestions use your last saved forecast when you are offline.
          </Txt>
        </Card>

        <Button title="Log Out" icon="log-out-outline" variant="danger" style={{ marginTop: 24 }} onPress={confirmLogout} />
      </ScrollView>
    </Screen>
  );
}