export async function addItem(db, userId, item) {
  await db.runAsync(
    `INSERT INTO modern_items
     (user_id, name, category, color, season, warmth, image_uri, is_capsule, added_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, item.name, item.category, item.color, item.season, item.warmth, item.imageUri, item.capsule ? 1 : 0, Date.now()]
  );
}

// status: 'All' | 'Clean' | 'Needs washing'
export async function getItems(db, userId, search = '', category = 'All', status = 'All') {
  let sql = 'SELECT * FROM modern_items WHERE user_id = ? AND name LIKE ?';
  const params = [userId, `%${search}%`];
  if (category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status === 'Needs washing') {
    sql += " AND status = 'Needs washing'";
  } else if (status === 'Clean') {
    sql += " AND (status IS NULL OR status != 'Needs washing')";
  }
  sql += ' ORDER BY added_on DESC';
  return db.getAllAsync(sql, params);
}

export async function getItem(db, id) {
  return db.getFirstAsync('SELECT * FROM modern_items WHERE id = ?', [id]);
}

export async function updateItem(db, id, item) {
  await db.runAsync(
    `UPDATE modern_items
     SET name = ?, category = ?, color = ?, season = ?, warmth = ?, image_uri = ?, is_capsule = ?
     WHERE id = ?`,
    [item.name, item.category, item.color, item.season, item.warmth, item.imageUri, item.capsule ? 1 : 0, id]
  );
}

// status is 'Clean' or 'Needs washing' (suggest.js checks this exact text)
export async function setStatus(db, id, status) {
  await db.runAsync('UPDATE modern_items SET status = ? WHERE id = ?', [status, id]);
}

export async function setCapsule(db, id, flag) {
  await db.runAsync('UPDATE modern_items SET is_capsule = ? WHERE id = ?', [flag ? 1 : 0, id]);
}

// Deleting a piece also removes its wear records and its place in any Looks,
// so Statistics never counts pieces that no longer exist.
export async function deleteItem(db, id) {
  await db.runAsync('DELETE FROM modern_items WHERE id = ?', [id]);
  await db.runAsync("DELETE FROM outfit_items WHERE item_id = ? AND item_type = 'modern'", [id]);
  await db.runAsync("DELETE FROM wear_events WHERE item_id = ? AND item_type = 'modern'", [id]);
}