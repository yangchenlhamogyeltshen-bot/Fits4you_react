// Removes wear records and Look entries that point to pieces which no longer exist
async function cleanupOrphans(db) {
  await db.runAsync(
    `DELETE FROM wear_events WHERE rowid NOT IN (
       SELECT w.rowid FROM wear_events w WHERE
         (w.item_type = 'modern' AND w.item_id IN (SELECT id FROM modern_items))
         OR (w.item_type = 'traditional' AND w.item_id IN (SELECT id FROM traditional_items)))`
  );
  await db.runAsync(
    `DELETE FROM outfit_items WHERE rowid NOT IN (
       SELECT o.rowid FROM outfit_items o WHERE
         (o.item_type = 'modern' AND o.item_id IN (SELECT id FROM modern_items))
         OR (o.item_type = 'traditional' AND o.item_id IN (SELECT id FROM traditional_items)))`
  );
}

export async function getStats(db, userId) {
  await cleanupOrphans(db);

  const count = async (sql) => (await db.getFirstAsync(sql, [userId])).n;

  const modern = await count('SELECT COUNT(*) AS n FROM modern_items WHERE user_id = ?');
  const traditional = await count('SELECT COUNT(*) AS n FROM traditional_items WHERE user_id = ?');
  const wears = await count('SELECT COUNT(*) AS n FROM wear_events WHERE user_id = ?');
  const looks = await count('SELECT COUNT(*) AS n FROM outfits WHERE user_id = ?');
  const capsule = await count('SELECT COUNT(*) AS n FROM modern_items WHERE user_id = ? AND is_capsule = 1');
  const needsWash = await count("SELECT COUNT(*) AS n FROM modern_items WHERE user_id = ? AND status = 'Needs washing'");

  const mostWorn = await db.getAllAsync(
    `SELECT id, name, times_worn, image_uri, 'modern' AS type FROM modern_items WHERE user_id = ? AND times_worn > 0
     UNION ALL
     SELECT id, name, times_worn, image_uri, 'traditional' AS type FROM traditional_items WHERE user_id = ? AND times_worn > 0
     ORDER BY times_worn DESC LIMIT 5`,
    [userId, userId]
  );

  const leastUsed = await db.getAllAsync(
    `SELECT id, name, times_worn, image_uri, 'modern' AS type FROM modern_items WHERE user_id = ?
     UNION ALL
     SELECT id, name, times_worn, image_uri, 'traditional' AS type FROM traditional_items WHERE user_id = ?
     ORDER BY times_worn ASC LIMIT 5`,
    [userId, userId]
  );

  const categories = await db.getAllAsync(
    'SELECT category, COUNT(*) AS n FROM modern_items WHERE user_id = ? GROUP BY category ORDER BY n DESC',
    [userId]
  );

  return { modern, traditional, wears, looks, capsule, needsWash, mostWorn, leastUsed, categories };
}