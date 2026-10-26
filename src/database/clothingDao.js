export async function addItem(db, userId, item) {
  await db.runAsync(
    `INSERT INTO modern_items
     (user_id, name, category, color, season, warmth, image_uri, added_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, item.name, item.category, item.color, item.season, item.warmth, item.imageUri, Date.now()]
  );
}

export async function getItems(db, userId, search = '', category = 'All') {
  let sql = 'SELECT * FROM modern_items WHERE user_id = ? AND name LIKE ?';
  const params = [userId, `%${search}%`];
  if (category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY added_on DESC';
  return db.getAllAsync(sql, params);
}

export async function deleteItem(db, id) {
  await db.runAsync('DELETE FROM modern_items WHERE id = ?', [id]);
}