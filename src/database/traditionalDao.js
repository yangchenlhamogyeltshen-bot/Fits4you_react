export async function addTraditional(db, userId, item) {
  await db.runAsync(
    `INSERT INTO traditional_items
     (user_id, name, piece_type, fabric, occasion, warmth, image_uri, added_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, item.name, item.pieceType, item.fabric, item.occasion, item.warmth, item.imageUri, Date.now()]
  );
}

export async function getTraditional(db, userId, search = '') {
  return db.getAllAsync(
    'SELECT * FROM traditional_items WHERE user_id = ? AND name LIKE ? ORDER BY added_on DESC',
    [userId, `%${search}%`]
  );
}

export async function getTraditionalItem(db, id) {
  return db.getFirstAsync('SELECT * FROM traditional_items WHERE id = ?', [id]);
}

export async function updateTraditional(db, id, item) {
  await db.runAsync(
    `UPDATE traditional_items
     SET name = ?, piece_type = ?, fabric = ?, occasion = ?, warmth = ?, image_uri = ?
     WHERE id = ?`,
    [item.name, item.pieceType, item.fabric, item.occasion, item.warmth, item.imageUri, id]
  );
}

export async function deleteTraditional(db, id) {
  await db.runAsync('DELETE FROM traditional_items WHERE id = ?', [id]);
  await db.runAsync("DELETE FROM outfit_items WHERE item_id = ? AND item_type = 'traditional'", [id]);
  await db.runAsync("DELETE FROM wear_events WHERE item_id = ? AND item_type = 'traditional'", [id]);
}