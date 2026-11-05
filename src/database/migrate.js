async function addColumn(db, table, column, definition) {
  const cols = await db.getAllAsync(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Last line of defence for the "one wardrobe per look" rule: SQLite itself refuses to add a
// traditional piece to a look that already holds modern ones (or the other way round).
// Even if a screen or a future feature forgets the check, a mixed look cannot be written.
const ONE_WARDROBE_TRIGGER = `
  CREATE TRIGGER IF NOT EXISTS outfit_items_one_wardrobe
  BEFORE INSERT ON outfit_items
  WHEN EXISTS (
    SELECT 1 FROM outfit_items
    WHERE outfit_id = NEW.outfit_id AND item_type <> NEW.item_type
  )
  BEGIN
    SELECT RAISE(ABORT, 'A look can hold modern or traditional pieces, not both.');
  END;
`;

// Safe to run on every start: only adds what is missing
export async function migrate(db) {
  await addColumn(db, 'modern_items', 'subtype', 'TEXT');
  await addColumn(db, 'traditional_items', 'is_capsule', 'INTEGER DEFAULT 0');
  await addColumn(db, 'traditional_items', 'status', "TEXT DEFAULT 'Clean'");
  await db.execAsync(ONE_WARDROBE_TRIGGER);
}

export { ONE_WARDROBE_TRIGGER };