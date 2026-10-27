// pieces: [{ id, type }] where type is 'modern' or 'traditional'
export async function markWorn(db, userId, pieces) {
  const now = Date.now();
  for (const p of pieces) {
    const table = p.type === 'traditional' ? 'traditional_items' : 'modern_items';
    await db.runAsync(
      `UPDATE ${table} SET times_worn = times_worn + 1, last_worn = ? WHERE id = ?`,
      [now, p.id]
    );
    await db.runAsync(
      'INSERT INTO wear_events (user_id, item_id, item_type, worn_on) VALUES (?, ?, ?, ?)',
      [userId, p.id, p.type, now]
    );
  }
}