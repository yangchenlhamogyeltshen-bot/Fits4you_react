// Phuentsholing coordinates (used if location permission is refused)
const DEFAULT = { latitude: 26.86, longitude: 89.38 };

async function getCoords() {
  try {
    const Location = require('expo-location');
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return DEFAULT;
    const pos = await Location.getLastKnownPositionAsync();
    if (pos) return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    const now = await Location.getCurrentPositionAsync({});
    return { latitude: now.coords.latitude, longitude: now.coords.longitude };
  } catch {
    return DEFAULT;
  }
}

// Returns { temperature, rainChance, updatedOn, fromCache }
export async function getWeather(db) {
  try {
    const { latitude, longitude } = await getCoords();
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=apparent_temperature&daily=precipitation_probability_max&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    const json = await res.json();
    const temperature = json.current.apparent_temperature;
    const rainChance = json.daily.precipitation_probability_max[0] ?? 0;
    const updatedOn = Date.now();
    await db.runAsync(
      'INSERT OR REPLACE INTO forecast_cache (id, temperature, rain_chance, updated_on) VALUES (1, ?, ?, ?)',
      [temperature, rainChance, updatedOn]
    );
    return { temperature, rainChance, updatedOn, fromCache: false };
  } catch {
    const row = await db.getFirstAsync('SELECT * FROM forecast_cache WHERE id = 1');
    if (!row) return null;
    return { temperature: row.temperature, rainChance: row.rain_chance, updatedOn: row.updated_on, fromCache: true };
  }
}