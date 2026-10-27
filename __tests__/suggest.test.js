import { targetWarmth, suggestOutfits, suggestTraditional } from '../src/utils/suggest';

const NOW = new Date('2026-10-27T10:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

const item = (id, category, warmth, extra = {}) => ({
  id, name: `${category}${id}`, category, warmth, status: 'Clean', last_worn: null, ...extra,
});

const closet = [
  item(1, 'Tops', 1), item(2, 'Tops', 3), item(3, 'Tops', 5),
  item(4, 'Bottoms', 2), item(5, 'Bottoms', 4),
  item(6, 'Shoes', 3),
  item(7, 'Outerwear', 4),
];

describe('targetWarmth (weather cases)', () => {
  test.each([
    [-2, 5], [5, 5], [9.9, 5],
    [10, 4], [15, 4],
    [16, 3], [21, 3],
    [22, 2], [27, 2],
    [28, 1], [35, 1],
  ])('%i°C -> warmth %i', (temp, expected) => {
    expect(targetWarmth(temp)).toBe(expected);
  });
});

describe('suggestOutfits', () => {
  test('cold day picks the warmest top first', () => {
    const [first] = suggestOutfits(closet, 5, 0, NOW);
    expect(first.items.find((i) => i.category === 'Tops').id).toBe(3);
  });

  test('hot day picks the lightest top first', () => {
    const [first] = suggestOutfits(closet, 33, 0, NOW);
    expect(first.items.find((i) => i.category === 'Tops').id).toBe(1);
  });

  test('rain adds a jacket', () => {
    const [first] = suggestOutfits(closet, 25, 80, NOW);
    expect(first.items.some((i) => i.category === 'Outerwear')).toBe(true);
  });

  test('no jacket on a warm dry day', () => {
    const [first] = suggestOutfits(closet, 25, 10, NOW);
    expect(first.items.some((i) => i.category === 'Outerwear')).toBe(false);
  });

  test('cold day adds a jacket even without rain', () => {
    const [first] = suggestOutfits(closet, 6, 0, NOW);
    expect(first.items.some((i) => i.category === 'Outerwear')).toBe(true);
  });

  test('items that need washing are left out', () => {
    const dirty = closet.map((i) => (i.id === 3 ? { ...i, status: 'Needs washing' } : i));
    const [first] = suggestOutfits(dirty, 5, 0, NOW);
    expect(first.items.find((i) => i.category === 'Tops').id).not.toBe(3);
  });

  test('empty closet gives no outfits', () => {
    expect(suggestOutfits([], 20, 0, NOW)).toEqual([]);
  });

  test('returns at most 3 outfits', () => {
    expect(suggestOutfits(closet, 20, 0, NOW).length).toBeLessThanOrEqual(3);
  });

  test('item worn long ago is preferred when warmth is equal', () => {
    const items = [
      item(10, 'Tops', 3, { last_worn: NOW - 1 * DAY }),
      item(11, 'Tops', 3, { last_worn: NOW - 20 * DAY }),
    ];
    const [first] = suggestOutfits(items, 18, 0, NOW);
    expect(first.items[0].id).toBe(11);
  });
});

describe('suggestTraditional', () => {
  const trad = [
    { id: 1, occasion: 'Daily', warmth: 2, last_worn: null },
    { id: 2, occasion: 'Tshechu', warmth: 3, last_worn: null },
    { id: 3, occasion: 'Tshechu', warmth: 5, last_worn: null },
  ];

  test('only returns pieces for the chosen occasion', () => {
    const result = suggestTraditional(trad, 'Tshechu', 18, NOW);
    expect(result.every((i) => i.occasion === 'Tshechu')).toBe(true);
  });

  test('cold day prefers the warmer piece', () => {
    expect(suggestTraditional(trad, 'Tshechu', 5, NOW)[0].id).toBe(3);
  });

  test('no pieces for an occasion gives an empty list', () => {
    expect(suggestTraditional(trad, 'Wedding', 18, NOW)).toEqual([]);
  });
});