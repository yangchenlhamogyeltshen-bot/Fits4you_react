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

// A piece saved as 'Both' can be used for a Daily and for a Special outfit
const suitsOccasion = (item, occasion) => item.occasion === occasion || item.occasion === 'Both';

// Small bonus for pieces not worn for a while
function recency(item, now) {
  const daysAgo = item.last_worn ? (now - item.last_worn) / DAY : 30;
  return Math.min(daysAgo, 30) / 3;
}

// Lower score = better. Warmth fit counts most; items not worn for longer get a small bonus.
function score(item, target, now) {
  const fit = Math.abs((item.warmth ?? 3) - target);
  return fit * 10 - recency(item, now);
}

// Does the piece's season suit today? A hot day wants Summer, a cold day wants Winter,
// "All Season" suits everything. 0 = suits, 1 = does not.
function seasonMiss(item, target) {
  const wanted = target >= 4 ? 'Winter' : target <= 2 ? 'Summer' : null;
  if (!wanted || !item.season || item.season === 'All Season' || item.season === wanted) return 0;
  return 1;
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

// Clothes: ranked by warmth fit
function ranked(items, role, target, now) {
  return items
    .filter((i) => roleOf(i) === role && i.status !== 'Needs washing')
    .sort((a, b) => score(a, target, now) - score(b, target, now));
}

// Shoes and accessories: ranked by season only, no warmth
function rankedBySeason(items, role, target, now) {
  return items
    .filter((i) => roleOf(i) === role && i.status !== 'Needs washing')
    .sort((a, b) => (seasonMiss(a, target) * 10 - recency(a, now)) - (seasonMiss(b, target) * 10 - recency(b, now)));
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

// Accessories follow the season only
const accessoryFits = (a, target) => seasonMiss(a, target) === 0;

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

// Best colour match first; keeps the earlier order for ties (sort is stable)
const byColor = (list, base) =>
  [...list].sort((a, b) => penaltyAgainst(a, base) - penaltyAgainst(b, base));

// Best colour match that is not already used in another outfit (if possible)
function pickUnused(list, base, used) {
  const options = byColor(list, base);
  const choice = options.find((p) => !used.has(p.id) && penaltyAgainst(p, base) <= 1) || options[0];
  if (choice) used.add(choice.id);
  return choice;
}

// Colour first: the piece that matches the main garment (set[0]) best wins, then the whole
// outfit. Only when colours tie does an unused piece beat one used in an earlier outfit.
function pickByColor(list, set, used) {
  const main = [set[0]];
  const sorted = [...list].sort(
    (a, b) =>
      penaltyAgainst(a, main) - penaltyAgainst(b, main) ||
      penaltyAgainst(a, set) - penaltyAgainst(b, set) ||
      Number(used.has(a.id)) - Number(used.has(b.id))
  );
  const choice = sorted[0];
  if (choice) used.add(choice.id);
  return choice;
}

// ---------- Shoes ----------

const HEELS = /heel|pump|stiletto|wedge|kitten/i;
const SPORTY = /sneaker|trainer|running|sport|gym|croc|slipper|flip/i;

// The best group of shoes for this outfit: the first group that is not empty.
// Dress: heels first, then anything not sporty.
// Sweatwear or shorts: no heels unless heels are all you own.
// Everything else (jeans, pants, trousers, skirts): any shoe works.
function shoePool(shoes, base) {
  const is = (re) => (s) => re.test(s.name || '');
  const not = (re) => (s) => !re.test(s.name || '');
  const isDress = roleOf(base[0]) === 'Dresses';
  const lead = base[base.length - 1];

  let tiers;
  if (isDress) {
    tiers = [shoes.filter(is(HEELS)), shoes.filter(not(SPORTY)), shoes];
  } else if (formality(lead) === 0) {
    tiers = [shoes.filter((s) => !HEELS.test(s.name || '') && matches(s, lead)), shoes.filter(not(HEELS)), shoes];
  } else {
    tiers = [shoes];
  }

  return tiers.find((t) => t.length) || [];
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

  // Shoes: by season only. Wrong-season pairs are skipped if any right-season pair exists.
  const allShoes = rankedBySeason(items, 'Shoes', target, now);
  const seasonShoes = allShoes.filter((s) => seasonMiss(s, target) === 0);
  const shoes = seasonShoes.length ? seasonShoes : allShoes;

  const jackets = ranked(items, 'Outerwear', target, now);
  const accessories = rankedBySeason(items, 'Accessories', target, now).filter((a) => accessoryFits(a, target));
  const needJacket = rainChance >= 50 || cold;

  const outfits = [];
  const seen = new Set();
  const usedBottoms = new Set();
  const usedShoes = new Set();
  const usedAccessories = new Set();

  const finish = (base) => {
    const pieces = [...base];
    const missing = [];

    // shoes: right kind for the outfit (heels with a dress), best colour,
    // and a different pair than earlier outfits when possible
    const shoe = pickUnused(shoePool(shoes, base), base, usedShoes);
    if (shoe) pieces.push(shoe);
    else missing.push('Shoes');

    if (needJacket) {
      const styledJackets = jackets.filter((j) => matches(j, base[0]));
      const jacket = byColor(styledJackets.length ? styledJackets : jackets, pieces)[0];
      if (jacket) pieces.push(jacket);
    }

    // accessory: right season, colour matched, different from earlier outfits
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

// ---------- Traditional footwear (borrowed from the modern Shoes) ----------

// Gho: no heels, no sporty shoes. Kira: no sporty shoes (heels and flats are fine).
// On a Special occasion only suitable shoes are used (none rather than sneakers);
// on a Daily outfit anything is allowed if nothing more suitable exists.
function traditionalShoePool(shoes, base, occasion) {
  const isGho = base.some((i) => i.piece_type === 'Gho');
  const dressy = shoes.filter((s) => !SPORTY.test(s.name || ''));
  const noHeels = (list) => list.filter((s) => !HEELS.test(s.name || ''));

  let tiers;
  if (occasion === 'Special') tiers = isGho ? [noHeels(dressy)] : [dressy];
  else tiers = isGho ? [noHeels(dressy), noHeels(shoes), shoes] : [dressy, shoes];

  return tiers.find((t) => t.length) || [];
}

// ---------- Traditional outfits ----------

// Kira outfit  = Kira + Tego + Wonju (all three are required), plus Rachu and Kera if you have them.
// Gho outfit   = Gho on its own, plus Kabney and Kera if you have them. A Gho is never mixed
//                with the Kira, Tego or Wonju.
// Both finish with a shoe from the modern Shoes (modernItems) when one suits.
// A Kira outfit picks its shoe (heels, flats or plain shoes) by colour first.
// A piece saved as 'Both' is available for Daily and for Special outfits.
// Returns [{ items, label, missing }], alternating Kira outfits and Gho outfits.
export function suggestTraditionalOutfits(items, occasion, temp, now = Date.now(), modernItems = []) {
  const target = targetWarmth(temp);
  const pool = items.filter((i) => suitsOccasion(i, occasion) && i.status !== 'Needs washing');
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

  // Shoes come from the modern wardrobe, matched by season
  const allShoes = rankedBySeason(modernItems, 'Shoes', target, now);
  const seasonShoes = allShoes.filter((s) => seasonMiss(s, target) === 0);
  const shoes = seasonShoes.length ? seasonShoes : allShoes;

  const used = { tego: new Set(), wonju: new Set(), kera: new Set(), rachu: new Set(), kabney: new Set(), shoe: new Set() };

  const addShoe = (set) => {
    const shoePool = traditionalShoePool(shoes, set, occasion);
    const isKira = set.some((i) => i.piece_type === 'Kira');
    // Kira: colour first. Gho: best colour that is not already used.
    const shoe = isKira ? pickByColor(shoePool, set, used.shoe) : pickUnused(shoePool, set, used.shoe);
    if (shoe) set.push(shoe);
  };

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
      addShoe(set);
      kiraOutfits.push({ items: set, label: 'Kira outfit', missing: [] });
    });
  }

  const ghoOutfits = ghos.slice(0, 2).map((gho) => {
    const set = [gho];
    const kabney = pickUnused(kabneys, set, used.kabney);
    if (kabney) set.push(kabney);
    const kera = pickUnused(keras, set, used.kera);
    if (kera) set.push(kera);
    addShoe(set);
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
  const pool = items.filter((i) => suitsOccasion(i, occasion));
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
    .filter((i) => suitsOccasion(i, occasion))
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
// nothing needs washing, every piece fits the temperature (clothes by warmth,
// shoes and accessories by season), and (traditional only) the occasion matches.
// mode is 'modern' or 'traditional'. A traditional look may include modern Shoes.
export function suggestFromLooks(looks, mode, temp, rainChance, options = {}) {
  const { occasion, now = Date.now() } = options;
  const target = targetWarmth(temp);
  const type = mode === 'traditional' ? 'traditional' : 'modern';
  const needJacket = type === 'modern' && (rainChance >= 50 || target >= 4);

  const pieceFits = (i) =>
    i.category === 'Accessories'
      ? accessoryFits(i, target)
      : i.category === 'Shoes'
        ? seasonMiss(i, target) === 0
        : Math.abs((i.warmth ?? 3) - target) <= 2;

  const rate = (look) => {
    const its = look.items;
    const avg = its.reduce((sum, i) => sum + score(i, target, now), 0) / its.length;
    const noJacket = needJacket && !its.some((i) => i.category === 'Outerwear');
    return avg + (noJacket ? 5 : 0); // a look without a jacket is pushed down on rainy or cold days
  };

  // Every piece must match the mode, except that a traditional look can include modern Shoes
  const kindOk = (i) =>
    i.type === type || (type === 'traditional' && i.type === 'modern' && i.category === 'Shoes');

  return (looks || [])
    .filter((l) => {
      const its = l.items || [];
      if (its.length < 2) return false;
      if (!its.every(kindOk)) return false;
      if (its.some((i) => i.status === 'Needs washing')) return false;
      if (
        type === 'traditional' && occasion &&
        !its.filter((i) => i.type === 'traditional').every((i) => suitsOccasion(i, occasion))
      ) return false;
      return its.every(pieceFits);
    })
    .sort((a, b) => rate(a) - rate(b))
    .map((l) => ({ items: l.items, label: l.name, fromLook: true, missing: [] }));
}

// An outfit can mix modern and traditional pieces, so the key includes the kind
const keyOf = (p) => `${p.piece_type ? 't' : 'm'}${p.id}`;

// Your saved looks first (up to 2), then generated ones. Identical outfits appear once.
function combine(fromLooks, generated) {
  const seen = new Set();
  const out = [];
  [...fromLooks.slice(0, 2), ...generated].forEach((o) => {
    const key = o.items.map(keyOf).sort().join('-');
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

// modernItems = the modern wardrobe, used only for shoes
export function suggestTraditionalAll(items, looks, occasion, temp, now = Date.now(), modernItems = []) {
  return combine(
    suggestFromLooks(looks, 'traditional', temp, 0, { occasion, now }),
    suggestTraditionalOutfits(items, occasion, temp, now, modernItems)
  );
}