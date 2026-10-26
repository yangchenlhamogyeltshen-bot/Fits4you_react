// Creates all SQLite tables the first time the app runs.
export async function initDatabase(db) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS modern_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      color TEXT,
      season TEXT,
      occasion TEXT DEFAULT 'Casual',
      image_uri TEXT,
      warmth INTEGER DEFAULT 3,
      is_capsule INTEGER DEFAULT 0,
      times_worn INTEGER DEFAULT 0,
      last_worn INTEGER,
      status TEXT DEFAULT 'Clean',
      added_on INTEGER
    );

    CREATE TABLE IF NOT EXISTS traditional_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      piece_type TEXT NOT NULL,
      fabric TEXT,
      occasion TEXT,
      image_uri TEXT,
      warmth INTEGER DEFAULT 3,
      times_worn INTEGER DEFAULT 0,
      last_worn INTEGER,
      added_on INTEGER
    );

    CREATE TABLE IF NOT EXISTS outfits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_on INTEGER
    );

    CREATE TABLE IF NOT EXISTS outfit_items (
      outfit_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wear_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      worn_on INTEGER
    );

    CREATE TABLE IF NOT EXISTS forecast_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      temperature REAL,
      rain_chance INTEGER,
      updated_on INTEGER
    );
  `);
}