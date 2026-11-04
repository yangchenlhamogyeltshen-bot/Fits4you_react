import { View, Image } from 'react-native';
import { Screen, Txt, Button } from '../components/UI';
import { useTheme } from '../theme';

export default function WelcomeScreen({ navigation }) {
  const { colors } = useTheme();
  return (
    <Screen style={{ justifyContent: 'center', padding: 28 }}>
      <View style={{ alignItems: 'center', gap: 14, marginBottom: 40 }}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.primaryContainer, borderWidth: 3, borderColor: '#fff' }}
        />
        <Txt bold size={38} color={colors.primary}>FitsForYou</Txt>
        <Txt muted size={18} style={{ textAlign: 'center' }}>Organize your wardrobe. Dress with ease.</Txt>
      </View>
      <Button title="Login" onPress={() => navigation.navigate('Login')} />
      <Button title="Sign Up" variant="outline" style={{ marginTop: 14 }} onPress={() => navigation.navigate('Signup')} />
      <Txt muted size={12} style={{ textAlign: 'center', marginTop: 40 }}>Student Project Bhutan</Txt>
    </Screen>
  );
}