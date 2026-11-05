async function addColumn(db, table, column, definition) {
  const cols = await db.getAllAsync(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Safe to run on every start: only adds what is missing
export async function migrate(db) {
  await addColumn(db, 'modern_items', 'subtype', 'TEXT');
  await addColumn(db, 'traditional_items', 'is_capsule', 'INTEGER DEFAULT 0');
  await addColumn(db, 'traditional_items', 'status', "TEXT DEFAULT 'Clean'");
}