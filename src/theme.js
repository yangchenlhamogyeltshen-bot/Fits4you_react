// Same palette as the Android app (res/values/colors.xml)
export const colors = {
  primary: '#4A2545',
  primaryDark: '#331A2F',
  primaryContainer: '#EFE0EC',
  onPrimary: '#FFFFFF',
  secondary: '#FF6F61',
  secondaryContainer: '#FFE1DC',
  onSecondary: '#4A2545',
  accent: '#F4B942',
  accentContainer: '#FDF0D5',
  bg: '#FBF7F2',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#2A1F28',
  muted: '#8C7E88',
  border: '#E8DFE5',
  error: '#C0392B',
  scrim: 'rgba(74,37,69,0.62)',
};

// Same corner sizes as the Android dimens.xml
export const radius = { card: 20, cardSmall: 12, cardLarge: 28, button: 28, input: 16 };

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

// Screens call useTheme() to get the colours
export const useTheme = () => ({ colors });