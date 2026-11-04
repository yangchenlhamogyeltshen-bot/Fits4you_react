import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Screen, Header, Txt, Input, Button } from '../components/UI';
import { useTheme } from '../theme';

export function friendlyAuthError(e) {
  switch (e.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Email or password is incorrect.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/email-already-in-use': return 'This email already has an account. Please sign in instead.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed': return 'No internet connection. Please try again.';
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded': return 'Too many attempts. Please wait a few minutes and try again.';
    default: return e.message;
  }
}

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password) return Alert.alert('Missing details', 'Enter your email and password.');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert('Sign in failed', friendlyAuthError(e));
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) return Alert.alert('Enter your email first', 'Type your email above, then tap Forgot Password.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Email sent', 'Check your inbox (and spam) for the reset link.');
    } catch (e) {
      Alert.alert('Error', friendlyAuthError(e));
    }
  };

  return (
    <Screen>
      <Header title="Login" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Txt bold size={32}>Welcome Back</Txt>
        <Txt muted size={16} style={{ marginTop: 6, marginBottom: 24 }}>Sign in to scan and plan your outfits</Txt>

        <Txt bold style={{ marginBottom: 8 }}>Email Address</Txt>
        <Input placeholder="name@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} />

        <Txt bold style={{ marginTop: 18, marginBottom: 8 }}>Password</Txt>
        <View>
          <Input placeholder="••••••••" autoCapitalize="none" autoCorrect={false} secureTextEntry={!show} value={password} onChangeText={setPassword} style={{ paddingRight: 50 }} />
          <TouchableOpacity onPress={() => setShow(!show)} style={{ position: 'absolute', right: 14, top: 16 }}>
            <Ionicons name={show ? 'eye-off' : 'eye'} size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={forgot} style={{ alignSelf: 'flex-end', marginVertical: 14 }}>
          <Txt bold size={14} color={colors.primary}>Forgot Password?</Txt>
        </TouchableOpacity>

        {loading ? <ActivityIndicator size="large" color={colors.primary} /> : <Button title="Sign In" onPress={signIn} />}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Txt muted size={16}>New member?  </Txt>
          <TouchableOpacity onPress={() => navigation.replace('Signup')}>
            <Txt bold size={16} color={colors.primary}>Join FitsForYou</Txt>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}