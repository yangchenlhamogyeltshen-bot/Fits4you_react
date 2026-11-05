// A Look is one row in `outfits` plus its pieces in `outfit_items`.
// Each piece is stored with item_type = 'modern' or 'traditional'.
// Rule: a look is made of ONE wardrobe only, so all its pieces share the same item_type.
// The rule is enforced in three places: the editor screen, this file, and a database trigger (migrate.js).

export const MIXED_LOOK_MESSAGE = 'A look can hold modern or traditional pieces, not both.';

// Normalises one piece: a bare number means a modern piece; anything else must be { id, type }.
function toPiece(p, index) {
  const id = typeof p === 'number' ? p : p && p.id;
  if (typeof id !== 'number') {
    throw new Error('Look save: piece ' + index + ' has no numeric id: ' + JSON.stringify(p));
  }
  return { id, type: p && p.type === 'traditional' ? 'traditional' : 'modern' };
}

// Checks the name and pieces and returns the pieces in a clean { id, type } shape.
// Throws if the pieces mix modern and traditional.
export function cleanPieces(name, pieces) {
  if (typeof name !== 'string') throw new Error('Look save: name must be a string, got ' + typeof name);
  if (!Array.isArray(pieces)) throw new Error('Look save: pieces must be an array');
  const safe = pieces.map(toPiece);
  if (new Set(safe.map((p) => p.type)).size > 1) throw new Error(MIXED_LOOK_MESSAGE);
  return safe;
}

// Same checks plus the user id, used when creating a look
export function clean(userId, name, pieces) {
  if (typeof userId !== 'string') throw new Error('Look save: userId must be a string, got ' + typeof userId);
  return cleanPieces(name, pieces);
}

// 'modern', 'traditional', or null when there are no pieces
export function lookKind(items) {
  return items && items.length ? items[0].type : null;
}

// True for looks saved before the one-wardrobe rule existed (they hold both kinds)
export function isMixedLook(items) {
  return new Set((items || []).map((i) => i.type)).size > 1;
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
  const safe = clean(userId, name, pieces); // throws before anything is written
  // One transaction, so a failure never leaves a look with no pieces
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      'INSERT INTO outfits (user_id, name, created_on) VALUES (?, ?, ?)',
      [userId, name, Date.now()]
    );
    await addPieces(db, res.lastInsertRowId, safe); // the cleaned pieces, never the raw input
  });
}

export async function updateLook(db, id, name, pieces) {
  const safe = cleanPieces(name, pieces);
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE outfits SET name = ? WHERE id = ?', [name, id]);
    await db.runAsync('DELETE FROM outfit_items WHERE outfit_id = ?', [id]);
    await addPieces(db, id, safe);
  });
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
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM outfit_items WHERE outfit_id = ?', [id]);
    await db.runAsync('DELETE FROM outfits WHERE id = ?', [id]);
  });
}