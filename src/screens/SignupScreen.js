import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Screen, Header, Txt, Input, Button } from '../components/UI';
import { useTheme } from '../theme';
import { friendlyAuthError } from './LoginScreen';
import { rememberName } from '../utils/user';

export default function SignupScreen({ navigation }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    if (!name.trim() || !email.trim()) return Alert.alert('Missing details', 'Enter your name and email.');
    if (password.length < 6) return Alert.alert('Weak password', 'Password must be at least 6 characters.');
    if (password !== confirm) return Alert.alert('Passwords do not match', 'Please repeat the same password.');
    setLoading(true);
    try {
      await rememberName(email.trim(), name.trim());
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (e) {
      Alert.alert('Sign up failed', friendlyAuthError(e));
      setLoading(false);
    }
  };

  const field = (label, props) => (
    <View style={{ marginBottom: 16 }}>
      <Txt bold style={{ marginBottom: 8 }}>{label}</Txt>
      <Input autoCapitalize="none" autoCorrect={false} {...props} />
    </View>
  );

  return (
    <Screen>
      <Header title="Sign Up" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Txt bold size={28}>Join FitsForYou</Txt>
        <Txt muted size={16} style={{ marginTop: 6, marginBottom: 24 }}>Organize your wardrobe easily</Txt>

        {field('Your Name', { placeholder: 'Full Name', autoCapitalize: 'words', value: name, onChangeText: setName })}
        {field('Email Address', { placeholder: 'name@example.com', keyboardType: 'email-address', value: email, onChangeText: setEmail })}
        {field('Password', { placeholder: 'Min. 6 characters', secureTextEntry: true, value: password, onChangeText: setPassword })}
        {field('Repeat Password', { placeholder: '••••••••', secureTextEntry: true, value: confirm, onChangeText: setConfirm })}

        {loading ? <ActivityIndicator size="large" color={colors.primary} /> : <Button title="Create Account" onPress={signUp} />}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Txt muted size={16}>Already a member?  </Txt>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Txt bold size={16} color={colors.primary}>Sign In</Txt>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}