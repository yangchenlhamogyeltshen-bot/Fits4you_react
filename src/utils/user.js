import AsyncStorage from '@react-native-async-storage/async-storage';

export async function rememberName(email, name) {
  try { await AsyncStorage.setItem('name:' + email.toLowerCase(), name); } catch {}
}

// Display name > name saved at sign-up > first part of the email
export async function getDisplayName(user) {
  if (!user) return '';
  if (user.displayName) return user.displayName;
  try {
    const saved = await AsyncStorage.getItem('name:' + (user.email || '').toLowerCase());
    if (saved) return saved;
  } catch {}
  return (user.email || '').split('@')[0];
}