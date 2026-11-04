import { hexOf } from '../constants';
 
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
 
// What a piece really is. The name wins over the category for the core pieces,
// so sweatpants saved under "Tops" still count as a bottom.
function roleOf(item) {
  const n = (item.name || '').toLowerCase();
  if (['Tops', 'Bottoms', 'Dresses'].includes(item.category)) {
    if (/dress shirt/.test(n)) return 'Tops';
    if (/skirt|pant|trouser|jean|\bshorts?\b|jogger|legging|chino|slack/.test(n)) return 'Bottoms';
    if (/\bdress\b|gown|jumpsuit|romper/.test(n)) return 'Dresses';
    if (/shirt|\btee\b|t-shirt|tshirt|top|blouse|hoodie|sweater|jumper|kurta|polo|tank/.test(n)) return 'Tops';
  }
  return item.category;
}
 
function ranked(items, role, target, now) {
  return items
    .filter((i) => roleOf(i) === role && i.status !== 'Needs washing')
    .sort((a, b) => score(a, target, now) - score(b, target, now));
}
 
// Style of a piece, guessed from its name: 0 = casual, 1 = neutral, 2 = smart
function formality(item) {
  const n = (item.name || '').toLowerCase();
  if (/sweat|jogger|track|hoodie|\btee\b|t-shirt|tshirt|short|legging|lounge|gym|pyjama|pajama/.test(n)) return 0;
  if (/blazer|formal|trouser|chino|slack|blouse|skirt|button|oxford|dress|suit|coat/.test(n)) return 2;
  return 1; // jeans, shirts, etc. go with anything
}
 
// Casual and smart never mix; neutral pieces go with both
function matches(a, b) {
  return Math.abs(formality(a) - formality(b)) < 2;
}
 
const isColdOnly = (item) => /skirt|short/i.test(item.name || '');
 
// Accessories use weight (1 light, 3 medium, 5 heavy). One is only suggested
// if it is not heavier than the weather suits (no heavy scarf in summer).
const accessoryFits = (a, target) => (a.warmth ?? 3) <= target;
 
// ---------- Colour matching ----------
 
// Hue, saturation and lightness of a piece's colour, or null if it has none
function hslOf(item) {
  const hex = hexOf(item.color);
  if (!hex || hex[0] !== '#' || hex.length < 7) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}
 
// Black, white, grey, navy, beige and tan go with everything
function isNeutral(c) {
  if (c.s < 25 || c.l < 15 || c.l > 90) return true;
  return c.h >= 20 && c.h <= 50 && c.l > 55 && c.s < 60; // beige / tan
}
 
// 0 = goes well, 1 = acceptable, 3 = clashes. Unknown colours never count against a piece.
export function colorPenalty(a, b) {
  const ca = hslOf(a);
  const cb = hslOf(b);
  if (!ca || !cb) return 0;
  if (isNeutral(ca) || isNeutral(cb)) return 0;
  const diff = Math.abs(ca.h - cb.h);
  const d = Math.min(diff, 360 - diff);
  if (d <= 75) return 0;   // same or neighbouring colours (blue + green, red + orange)
  if (d >= 150) return 1;  // opposite colours (blue + orange)
  return 3;                // in between looks clashing
}
 
// Total colour penalty of one piece against the pieces already chosen
const penaltyAgainst = (item, pieces) => pieces.reduce((sum, p) => sum + colorPenalty(item, p), 0);
 
// Best colour match first; keeps the warmth order for ties (sort is stable)
const byColor = (list, base) =>
  [...list].sort((a, b) => penaltyAgainst(a, base) - penaltyAgainst(b, base));
 
// Best colour match that is not already used in another outfit (if possible)
function pickUnused(list, base, used) {
  const options = byColor(list, base);
  const choice = options.find((p) => !used.has(p.id) && penaltyAgainst(p, base) <= 1) || options[0];
  if (choice) used.add(choice.id);
  return choice;
}
 
// ---------- Modern outfits ----------
 
// Returns up to 3 outfits: [{ items, missing }]. Each is a top + bottom, or a dress,
// plus shoes, an accessory, and a jacket when the weather needs one.
// "missing" lists what you have not saved yet (for example ['Shoes']).
export function suggestOutfits(items, temp, rainChance, now = Date.now()) {
  const target = targetWarmth(temp);
  const cold = target >= 4;                       // below about 16 degrees C
 
  // Prefer pieces within 2 warmth points of the weather, but fall back to
  // whatever exists so the card is not empty just because of warmth.
  const fitsWeather = (i) => Math.abs((i.warmth ?? 3) - target) <= 2;
  const preferFit = (list) => {
    const fit = list.filter(fitsWeather);
    return fit.length ? fit : list;
  };
 
  const tops = preferFit(ranked(items, 'Tops', target, now));
  const allBottoms = preferFit(ranked(items, 'Bottoms', target, now));
  const warmBottoms = allBottoms.filter((b) => !(cold && isColdOnly(b)));
  const bottoms = warmBottoms.length ? warmBottoms : allBottoms;
 
  // A dress only counts if its warmth is within 1 of what the weather needs
  const dresses = ranked(items, 'Dresses', target, now).filter(
    (d) => Math.abs((d.warmth ?? 3) - target) <= 1
  );
 
  const shoes = ranked(items, 'Shoes', target, now);
  const jackets = ranked(items, 'Outerwear', target, now);
  const accessories = ranked(items, 'Accessories', target, now).filter((a) => accessoryFits(a, target));
  const needJacket = rainChance >= 50 || cold;
 
  const outfits = [];
  const seen = new Set();
  const usedBottoms = new Set();
  const usedShoes = new Set();
  const usedAccessories = new Set();
 
  const finish = (base) => {
    const pieces = [...base];
    const missing = [];
 
    // shoes: matching style, best colour, and a different pair than earlier outfits when possible
    const styled = shoes.filter((s) => matches(s, base[base.length - 1]));
    const shoe = pickUnused(styled.length ? styled : shoes, base, usedShoes);
    if (shoe) pieces.push(shoe);
    else missing.push('Shoes');
 
    if (needJacket) {
      const styledJackets = jackets.filter((j) => matches(j, base[0]));
      const jacket = byColor(styledJackets.length ? styledJackets : jackets, pieces)[0];
      if (jacket) pieces.push(jacket);
    }
 
    // accessory: light enough for the weather, colour matched, different from earlier outfits
    const accessory = pickUnused(accessories, pieces, usedAccessories);
    if (accessory) pieces.push(accessory);
    else missing.push('Accessory');
 
    const key = pieces.map((p) => p.id).sort().join('-');
    if (seen.has(key)) return;
    seen.add(key);
    outfits.push({ items: pieces, missing });
  };
 
  // top + bottom pairs: matching style first, then the best colour match
  tops.forEach((top) => {
    if (outfits.length >= 3) return;
    const matching = bottoms.filter((b) => matches(top, b));
    const options = byColor(matching.length ? matching : bottoms, [top]);
    const bottom = options.find((b) => !usedBottoms.has(b.id) && colorPenalty(top, b) <= 1) || options[0];
    if (!bottom) return;
    usedBottoms.add(bottom.id);
    finish([top, bottom]);
  });
 
  // a dress is a complete outfit on its own
  dresses.forEach((dress) => {
    if (outfits.length >= 3) return;
    finish([dress]);
  });
 
  return outfits;
}
 
// ---------- Traditional outfits ----------
 
// Kira outfit  = Kira + Tego + Wonju (all three are required), plus Rachu and Kera if you have them.
// Gho outfit   = Gho on its own, plus Kabney and Kera if you have them. A Gho is never mixed
//                with the Kira, Tego or Wonju.
// Returns [{ items, label, missing }], alternating Kira outfits and Gho outfits.
export function suggestTraditionalOutfits(items, occasion, temp, now = Date.now()) {
  const target = targetWarmth(temp);
  const pool = items.filter((i) => i.occasion === occasion && i.status !== 'Needs washing');
  const rank = (type) =>
    pool
      .filter((i) => i.piece_type === type)
      .sort((a, b) => score(a, target, now) - score(b, target, now));
 
  const kiras = rank('Kira');
  const ghos = rank('Gho');
  const tegos = rank('Tego');
  const wonjus = rank('Wonju');
  const keras = rank('Kera');
  const rachus = rank('Rachu');
  const kabneys = rank('Kabney');
 
  const used = { tego: new Set(), wonju: new Set(), kera: new Set(), rachu: new Set(), kabney: new Set() };
 
  const kiraOutfits = [];
  if (tegos.length && wonjus.length) {
    kiras.slice(0, 2).forEach((kira) => {
      const tego = pickUnused(tegos, [kira], used.tego);
      const wonju = pickUnused(wonjus, [kira], used.wonju);
      const set = [kira, tego, wonju];
      const rachu = pickUnused(rachus, set, used.rachu);
      if (rachu) set.push(rachu);
      const kera = pickUnused(keras, set, used.kera);
      if (kera) set.push(kera);
      kiraOutfits.push({ items: set, label: 'Kira outfit', missing: [] });
    });
  }
 
  const ghoOutfits = ghos.slice(0, 2).map((gho) => {
    const set = [gho];
    const kabney = pickUnused(kabneys, set, used.kabney);
    if (kabney) set.push(kabney);
    const kera = pickUnused(keras, set, used.kera);
    if (kera) set.push(kera);
    return { items: set, label: 'Gho outfit', missing: [] };
  });
 
  const outfits = [];
  const longest = Math.max(kiraOutfits.length, ghoOutfits.length);
  for (let i = 0; i < longest; i++) {
    if (kiraOutfits[i]) outfits.push(kiraOutfits[i]);
    if (ghoOutfits[i]) outfits.push(ghoOutfits[i]);
  }
  return outfits;
}
 
// What is stopping a Kira outfit: you own a Kira for this occasion but no Tego or Wonju.
// Returns for example ['Tego'] or ['Tego', 'Wonju'], or [] when nothing is missing.
export function traditionalGaps(items, occasion) {
  const pool = items.filter((i) => i.occasion === occasion);
  const has = (type) => pool.some((i) => i.piece_type === type);
  if (!has('Kira')) return [];
  return ['Tego', 'Wonju'].filter((t) => !has(t));
}
 
// Older helper kept so existing code and tests still work: the first suggested outfit's pieces
export function suggestTraditionalOutfit(items, occasion, temp, now = Date.now()) {
  const first = suggestTraditionalOutfits(items, occasion, temp, now)[0];
  return first ? first.items : [];
}
 
// One main piece (gho or kira) plus one extra of each other type, best warmth fit first
export function suggestTraditional(items, occasion, temp, now = Date.now()) {
  const target = targetWarmth(temp);
  const isMain = (i) => ['gho', 'kira'].includes(String(i.piece_type).toLowerCase());
  const sorted = items
    .filter((i) => i.occasion === occasion)
    .sort((a, b) => score(a, target, now) - score(b, target, now));
 
  const main = sorted.find(isMain);
  const seen = new Set(main ? [main.piece_type] : []);
  const extras = [];
  for (const i of sorted) {
    if (isMain(i) || seen.has(i.piece_type)) continue;
    seen.add(i.piece_type);
    extras.push(i);
  }
  return [main, ...extras].filter(Boolean).slice(0, 3);
}
 
// ---------- Saved looks ----------
 
// Looks the user already decided on, kept only when they suit today's weather:
// nothing needs washing, every piece fits the temperature, and (traditional only) the occasion matches.
// mode is 'modern' or 'traditional'. Looks that mix both kinds are skipped.
export function suggestFromLooks(looks, mode, temp, rainChance, options = {}) {
  const { occasion, now = Date.now() } = options;
  const target = targetWarmth(temp);
  const type = mode === 'traditional' ? 'traditional' : 'modern';
  const needJacket = type === 'modern' && (rainChance >= 50 || target >= 4);
 
  const pieceFits = (i) =>
    i.category === 'Accessories' ? accessoryFits(i, target) : Math.abs((i.warmth ?? 3) - target) <= 2;
 
  const rate = (look) => {
    const its = look.items;
    const avg = its.reduce((sum, i) => sum + score(i, target, now), 0) / its.length;
    const noJacket = needJacket && !its.some((i) => i.category === 'Outerwear');
    return avg + (noJacket ? 5 : 0); // a look without a jacket is pushed down on rainy or cold days
  };
 
  return (looks || [])
    .filter((l) => {
      const its = l.items || [];
      if (its.length < 2) return false;
      if (!its.every((i) => i.type === type)) return false;
      if (its.some((i) => i.status === 'Needs washing')) return false;
      if (type === 'traditional' && occasion && !its.every((i) => i.occasion === occasion)) return false;
      return its.every(pieceFits);
    })
    .sort((a, b) => rate(a) - rate(b))
    .map((l) => ({ items: l.items, label: l.name, fromLook: true, missing: [] }));
}
 
// Your saved looks first (up to 2), then generated ones. Identical outfits appear once.
function combine(fromLooks, generated) {
  const seen = new Set();
  const out = [];
  [...fromLooks.slice(0, 2), ...generated].forEach((o) => {
    const key = o.items.map((p) => p.id).sort((a, b) => a - b).join('-');
    if (seen.has(key)) return;
    seen.add(key);
    out.push(o);
  });
  return out;
}
 
// What the Home screen calls
export function suggestModern(items, looks, temp, rainChance, now = Date.now()) {
  return combine(suggestFromLooks(looks, 'modern', temp, rainChance, { now }), suggestOutfits(items, temp, rainChance, now));
}
 
export function suggestTraditionalAll(items, looks, occasion, temp, now = Date.now()) {
  return combine(
    suggestFromLooks(looks, 'traditional', temp, 0, { occasion, now }),
    suggestTraditionalOutfits(items, occasion, temp, now)
  );
}
