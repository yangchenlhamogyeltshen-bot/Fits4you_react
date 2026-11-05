export async function addTraditional(db, userId, item) {
  await db.runAsync(
    `INSERT INTO traditional_items
     (user_id, name, piece_type, fabric, occasion, warmth, image_uri, is_capsule, status, added_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Clean', ?)`,
    [userId, item.name, item.pieceType, item.fabric, item.occasion, item.warmth, item.imageUri, item.capsule ? 1 : 0, Date.now()]
  );
}

// pieceType: 'All' or a piece type; status: 'All' | 'Clean' | 'Needs washing'
export async function getTraditional(db, userId, search = '', pieceType = 'All', status = 'All') {
  let sql = 'SELECT * FROM traditional_items WHERE user_id = ? AND name LIKE ?';
  const params = [userId, `%${search}%`];
  if (pieceType !== 'All') {
    sql += ' AND piece_type = ?';
    params.push(pieceType);
  }
  if (status === 'Needs washing') {
    sql += " AND status = 'Needs washing'";
  } else if (status === 'Clean') {
    sql += " AND (status IS NULL OR status != 'Needs washing')";
  }
  sql += ' ORDER BY added_on DESC';
  return db.getAllAsync(sql, params);
}

export async function getTraditionalItem(db, id) {
  return db.getFirstAsync('SELECT * FROM traditional_items WHERE id = ?', [id]);
}

export async function updateTraditional(db, id, item) {
  await db.runAsync(
    `UPDATE traditional_items
     SET name = ?, piece_type = ?, fabric = ?, occasion = ?, warmth = ?, image_uri = ?, is_capsule = ?
     WHERE id = ?`,
    [item.name, item.pieceType, item.fabric, item.occasion, item.warmth, item.imageUri, item.capsule ? 1 : 0, id]
  );
}

// status is 'Clean' or 'Needs washing'
export async function setTraditionalStatus(db, id, status) {
  await db.runAsync('UPDATE traditional_items SET status = ? WHERE id = ?', [status, id]);
}

export async function setTraditionalCapsule(db, id, flag) {
  await db.runAsync('UPDATE traditional_items SET is_capsule = ? WHERE id = ?', [flag ? 1 : 0, id]);
}

// Also removes the piece's wear records and its place in any Looks.
export async function deleteTraditional(db, id) {
  await db.runAsync('DELETE FROM traditional_items WHERE id = ?', [id]);
  await db.runAsync("DELETE FROM outfit_items WHERE item_id = ? AND item_type = 'traditional'", [id]);
  await db.runAsync("DELETE FROM wear_events WHERE item_id = ? AND item_type = 'traditional'", [id]);
}