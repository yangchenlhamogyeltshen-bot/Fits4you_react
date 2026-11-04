import { useEffect, useState } from 'react';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SQLiteProvider } from 'expo-sqlite';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';
import { initDatabase } from './src/database/db';
import { ThemeProvider, useTheme, shadow } from './src/theme';

import WelcomeScreen from './src/screens/WelcomeScreen';
import AnimatedSplash from './src/components/AnimatedSplash';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ClosetScreen from './src/screens/ClosetScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import AddTraditionalScreen from './src/screens/AddTraditionalScreen';
import CollectionsScreen from './src/screens/CollectionsScreen';
import StatsScreen from './src/screens/StatsScreen';
import PieceDetailsScreen from './src/screens/PieceDetailsScreen';
import EditPieceScreen from './src/screens/EditPieceScreen';
import LookEditorScreen from './src/screens/LookEditorScreen';
import MarkWornScreen from './src/screens/MarkWornScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Closet = wardrobe, Looks = hanger, Capsule = star (your essentials)
const TAB_ICONS = {
  Home: { lib: Ionicons, on: 'home', off: 'home-outline' },
  Closet: { lib: MaterialCommunityIcons, on: 'wardrobe', off: 'wardrobe-outline' },
  Collections: { lib: MaterialCommunityIcons, on: 'hanger', off: 'hanger' },
  Stats: { lib: Ionicons, on: 'bar-chart', off: 'bar-chart-outline' },
};

function useNavTheme() {
  const { colors, dark } = useTheme();
  return {
    ...DefaultTheme,
    dark,
    colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border, primary: colors.primary },
  };
}

// The round + in the middle of the tab bar
function PlusButton() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const choose = () =>
    Alert.alert('Add to your wardrobe', 'What would you like to add?', [
      { text: 'Clothing', onPress: () => navigation.navigate('AddItem') },
      { text: 'Traditional wear', onPress: () => navigation.navigate('AddTraditional') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity
        onPress={choose}
        activeOpacity={0.85}
        accessibilityLabel="Add to wardrobe"
        style={[
          { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
          shadow,
        ]}
      >
        <Ionicons name="add" size={28} color={colors.onSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function Nothing() {
  return null;
}

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size, focused }) => {
          const t = TAB_ICONS[route.name];
          if (!t) return null;
          const Icon = t.lib;
          return <Icon name={focused ? t.on : t.off} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Closet" component={ClosetScreen} />
      <Tab.Screen name="Add" component={Nothing} options={{ tabBarButton: () => <PlusButton /> }} />
      <Tab.Screen name="Collections" component={CollectionsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}

// Logged-out screens: Welcome, Login, Sign Up
function AuthApp() {
  const navTheme = useNavTheme();
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Logged-in screens
function MainApp() {
  const navTheme = useNavTheme();
  return (
    <SQLiteProvider databaseName="fitsforyou.db" onInit={initDatabase}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={MainTabs} />
          <Stack.Screen name="AddItem" component={AddItemScreen} />
          <Stack.Screen name="AddTraditional" component={AddTraditionalScreen} />
          <Stack.Screen name="PieceDetails" component={PieceDetailsScreen} />
          <Stack.Screen name="EditPiece" component={EditPieceScreen} />
          <Stack.Screen name="LookEditor" component={LookEditorScreen} />
          <Stack.Screen name="MarkWorn" component={MarkWornScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}

function Root() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold });
  const { dark } = useTheme();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
  }, []);

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {!splashDone || checking || !fontsLoaded ? (
        <AnimatedSplash />
      ) : user ? (
        <MainApp />
      ) : (
        <AuthApp />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}