import { useState } from 'react';
import { colors, shadow } from '../theme';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
  console.log('SUBMIT pressed', isSignup, email, password.length);
  if (!email.trim() || password.length < 6) {
    Alert.alert('Check your details', 'Enter an email and a password of at least 6 characters.');
    return;
  }
  try {
    let cred;
    if (isSignup) {
      cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    } else {
      cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    }
    console.log('AUTH OK', cred.user.email);
  } catch (e) {
    console.log('AUTH ERROR', e.code);
    Alert.alert('Error', e.code + '\n' + e.message);
  }
};

  const resetPassword = async () => {
    if (!email.trim()) return Alert.alert('Enter your email first');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Email sent', 'Check your inbox to reset your password.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitsForYou</Text>
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" autoCorrect={false}
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" autoCapitalize="none" autoCorrect={false}
        value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>{isSignup ? 'Create account' : 'Log in'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
        <Text style={styles.link}>{isSignup ? 'Already have an account? Log in' : 'New here? Sign up'}</Text>
      </TouchableOpacity>
      {!isSignup && (
        <TouchableOpacity onPress={resetPassword}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, gap: 14, backgroundColor: colors.bg },
  title: { fontSize: 38, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, backgroundColor: colors.card, color: colors.text },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', ...shadow },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 6, fontWeight: '600' },
});