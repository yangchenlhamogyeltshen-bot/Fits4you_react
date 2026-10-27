// How warm should the outfit be (1 = very light ... 5 = very warm)?
export function targetWarmth(temp) {
  if (temp < 10) return 5;
  if (temp < 16) return 4;
  if (temp < 22) return 3;
  if (temp < 28) return 2;
  return 1;
}

const DAY = 24 * 60 * 60 * 1000;

// Lower score = better. Warmth fit counts most; items not worn for longer get a small bonus.
function score(item, target, now) {
  const fit = Math.abs((item.warmth ?? 3) - target);
  const daysAgo = item.last_worn ? (now - item.last_worn) / DAY : 30;
  return fit * 10 - Math.min(daysAgo, 30) / 3;
}

function ranked(items, category, target, now) {
  return items
    .filter((i) => i.category === category && i.status !== 'Needs washing')
    .sort((a, b) => score(a, target, now) - score(b, target, now));
}

// Returns up to 3 outfits: [{ items: [...] }]
export function suggestOutfits(items, temp, rainChance, now = Date.now()) {
  const target = targetWarmth(temp);
  const tops = ranked(items, 'Tops', target, now);
  const bottoms = ranked(items, 'Bottoms', target, now);
  const shoes = ranked(items, 'Shoes', target, now);
  const jackets = ranked(items, 'Outerwear', target, now);
  const needJacket = rainChance >= 50 || target >= 4;

  const outfits = [];
  for (let i = 0; i < 3; i++) {
    const pieces = [tops[i], bottoms[i], shoes[i]].filter(Boolean);
    if (needJacket && jackets[i]) pieces.push(jackets[i]);
    if (pieces.length > 0) outfits.push({ items: pieces });
  }
  return outfits;
}

// Traditional pieces for an occasion, best warmth fit first
export function suggestTraditional(items, occasion, temp, now = Date.now()) {
  const target = targetWarmth(temp);
  return items
    .filter((i) => i.occasion === occasion)
    .sort((a, b) => score(a, target, now) - score(b, target, now))
    .slice(0, 2);
}