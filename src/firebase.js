import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBcoxUDsPAjVBJr3o4MH0I1MWHxt1Fo3JI',
  authDomain: 'fits-for-you.firebaseapp.com',
  projectId: 'fits-for-you',
  storageBucket: 'fits-for-you.firebasestorage.app',
  messagingSenderId: '897698187731',
  appId: '1:897698187731:web:5f2bd83e61f14149a0c726',
};

const app = initializeApp(firebaseConfig);

// Keeps the user logged in after the app is closed
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});