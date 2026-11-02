import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SQLiteProvider } from 'expo-sqlite';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';
import { initDatabase } from './src/database/db';
import { colors } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ClosetScreen from './src/screens/ClosetScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import AddTraditionalScreen from './src/screens/AddTraditionalScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary },
};

const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={route.name === 'Home' ? 'home' : 'shirt'} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'FitsForYou' }} />
      <Tab.Screen name="Closet" component={ClosetScreen} options={{ title: 'My Closet' }} />
    </Tab.Navigator>
  );
}

function MainApp() {
  return (
    <SQLiteProvider databaseName="fitsforyou.db" onInit={initDatabase}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={headerOptions}>
          <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add clothing' }} />
          <Stack.Screen name="AddTraditional" component={AddTraditionalScreen} options={{ title: 'Add traditional wear' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <LoginScreen />;
  return <MainApp />;
}