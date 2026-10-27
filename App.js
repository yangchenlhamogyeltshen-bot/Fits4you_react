import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SQLiteProvider } from 'expo-sqlite';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';
import { initDatabase } from './src/database/db';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ClosetScreen from './src/screens/ClosetScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import AddTraditionalScreen from './src/screens/AddTraditionalScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Closet" component={ClosetScreen} />
    </Tab.Navigator>
  );
}

function MainApp() {
  return (
    <SQLiteProvider databaseName="fitsforyou.db" onInit={initDatabase}>
      <NavigationContainer>
        <Stack.Navigator>
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
      console.log('AUTH STATE', u ? u.email : 'no user');
      setUser(u);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Two separate top-level screens: no navigator is switched while it is showing
  if (!user) return <LoginScreen />;
  return <MainApp />;
}