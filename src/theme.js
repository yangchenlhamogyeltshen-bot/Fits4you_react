import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Light mode: soft white page, light-grey tiles, black buttons, blue highlights
export const lightColors = {
  primary: '#111111',
  primaryDark: '#000000',
  primaryContainer: '#E9E9EC',
  onPrimary: '#FFFFFF',
  secondary: '#1F6FEB',
  secondaryContainer: '#1F6FEB',
  onSecondary: '#FFFFFF',
  accent: '#F5A524',
  accentContainer: '#FFF1D6',
  accentText: '#8A5A00',
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#F1F1F3',
  text: '#111111',
  muted: '#8A8A90',
  border: '#DADADD',
  error: '#D93025',
  scrim: 'rgba(0,0,0,0.55)',
};

// Dark mode: near-black page, dark-grey tiles, white buttons, blue highlights
export const darkColors = {
  primary: '#FFFFFF',
  primaryDark: '#E5E5E5',
  primaryContainer: '#2A2A2D',
  onPrimary: '#111111',
  secondary: '#2F7DF0',
  secondaryContainer: '#2F7DF0',
  onSecondary: '#FFFFFF',
  accent: '#F5A524',
  accentContainer: '#3A2D12',
  accentText: '#F5A524',
  bg: '#0F0F10',
  surface: '#141415',
  card: '#1E1E20',
  text: '#F5F5F5',
  muted: '#9B9BA1',
  border: '#2E2E31',
  error: '#FF6B5E',
  scrim: 'rgba(0,0,0,0.6)',
};

// Colours that never change with light/dark mode: garment photos always sit on white,
// and text drawn over a photo or a coloured swatch is always white.
export const fixed = { white: '#FFFFFF', black: '#000000' };

// Kept so older imports still work (this one is always the light palette)
export const colors = lightColors;

export const radius = { card: 20, cardSmall: 12, cardLarge: 28, button: 28, input: 16 };

// Font families. The name must match the key given to useFonts() in App.js, and the font is
// applied to every title through <Txt heading>, <Header>, <LookCard> and <EmptyState>.
// Custom fonts ship one weight per family, so do not add fontWeight next to these.
export const fonts = { heading: 'Fraunces_600SemiBold' };

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

const ThemeContext = createContext({ colors: lightColors, dark: false, setDark: () => {} });

export function ThemeProvider({ children }) {
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem('fy_dark');
        if (v === '1') setDarkState(true);
      } catch {}
    })();
  }, []);

  const setDark = (v) => {
    setDarkState(v);
    AsyncStorage.setItem('fy_dark', v ? '1' : '0').catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ colors: dark ? darkColors : lightColors, dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Screens call useTheme() to get the colours
export const useTheme = () => useContext(ThemeContext);