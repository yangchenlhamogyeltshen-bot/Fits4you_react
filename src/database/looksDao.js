// A Look is one row in `outfits` plus its pieces in `outfit_items`.
// Each piece is stored with item_type = 'modern' or 'traditional'.

function clean(userId, name, pieces) {
  if (typeof userId !== 'string') throw new Error('Look save: userId must be a string, got ' + typeof userId);
  if (typeof name !== 'string') throw new Error('Look save: name must be a string, got ' + typeof name);
  return pieces.map((p, i) => {
    const id = typeof p === 'number' ? p : p && p.id;
    if (typeof id !== 'number') throw new Error('Look save: piece ' + i + ' has no numeric id: ' + JSON.stringify(p));
    return { id, type: p && p.type === 'traditional' ? 'traditional' : 'modern' };
  });
}
async function itemsOf(db, outfitId) {
  const links = await db.getAllAsync(
    'SELECT item_id, item_type FROM outfit_items WHERE outfit_id = ?',
    [outfitId]
  );
  const items = [];
  for (const l of links) {
    const type = l.item_type === 'traditional' ? 'traditional' : 'modern';
    const table = type === 'traditional' ? 'traditional_items' : 'modern_items';
    const row = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, [l.item_id]);
    if (row) items.push({ ...row, type });
  }
  return items;
}

// pieces = [{ id, type: 'modern' | 'traditional' }]
async function addPieces(db, outfitId, pieces) {
  for (const p of pieces) {
    await db.runAsync(
      'INSERT INTO outfit_items (outfit_id, item_id, item_type) VALUES (?, ?, ?)',
      [outfitId, p.id, p.type]
    );
  }
}

export async function saveLook(db, userId, name, pieces) {
  const safe = clean(userId, name, pieces);  
  const res = await db.runAsync(
    'INSERT INTO outfits (user_id, name, created_on) VALUES (?, ?, ?)',
    [userId, name, Date.now()]
  );
  await addPieces(db, res.lastInsertRowId, pieces);
}

export async function updateLook(db, id, name, pieces) {
  await db.runAsync('UPDATE outfits SET name = ? WHERE id = ?', [name, id]);
  await db.runAsync('DELETE FROM outfit_items WHERE outfit_id = ?', [id]);
  await addPieces(db, id, pieces);
}

export async function getLook(db, id) {
  const look = await db.getFirstAsync('SELECT * FROM outfits WHERE id = ?', [id]);
  if (!look) return null;
  return { ...look, items: await itemsOf(db, id) };
}

export async function getLooks(db, userId) {
  const rows = await db.getAllAsync(
    'SELECT * FROM outfits WHERE user_id = ? ORDER BY created_on DESC',
    [userId]
  );
  const looks = [];
  for (const r of rows) looks.push({ ...r, items: await itemsOf(db, r.id) });
  return looks;
}

export async function deleteLook(db, id) {
  await db.runAsync('DELETE FROM outfit_items WHERE outfit_id = ?', [id]);
  await db.runAsync('DELETE FROM outfits WHERE id = ?', [id]);
}