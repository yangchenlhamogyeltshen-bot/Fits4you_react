export const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];
export const SEASONS = ['Summer', 'Winter', 'All Season'];
export const PIECES = ['Gho', 'Kira', 'Tego', 'Wonju', 'Rachu', 'Kabney', 'Kera'];
export const OCCASIONS = ['Daily', 'Special'];
export const ITEM_OCCASIONS = ['Daily', 'Special', 'Both'];   // what a piece can be saved as

// Clothing swatches from the Android app (AddClothingActivity)
export const COLORS = [
  { name: 'Navy', hex: '#3E4A61' }, { name: 'Blue', hex: '#5B7FA6' },
  { name: 'Green', hex: '#4E8C6C' }, { name: 'Grey', hex: '#8B8F99' },
  { name: 'Charcoal', hex: '#2E2E2E' }, { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' }, { name: 'Tan', hex: '#D2B48C' },
  { name: 'Maroon', hex: '#800000' }, { name: 'Mustard', hex: '#F4B942' },
];

export const hexOf = (value) => {
  if (!value) return undefined;
  if (value[0] === '#') return value;
  return (COLORS.find((c) => c.name === value) || {}).hex;
};

const BASIC = [
  ['Black', '#000000'], ['White', '#FFFFFF'], ['Grey', '#808080'], ['Red', '#D32F2F'],
  ['Orange', '#F57C00'], ['Yellow', '#FBC02D'], ['Green', '#388E3C'], ['Teal', '#00897B'],
  ['Blue', '#1976D2'], ['Navy', '#1A237E'], ['Purple', '#7B1FA2'], ['Pink', '#E91E63'],
  ['Brown', '#6D4C41'], ['Beige', '#D7C4A3'], ['Maroon', '#800000'],
];

// Shows a readable name for any colour, including custom hex values
export const colorName = (value) => {
  if (!value) return '-';
  if (value[0] !== '#') return value;
  const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = n(value);
  let best = BASIC[0];
  let bestD = Infinity;
  for (const c of BASIC) {
    const [r2, g2, b2] = n(c[1]);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best[0];
};

export const WEIGHTS = [
  { label: 'Light', value: 1 },
  { label: 'Medium', value: 3 },
  { label: 'Heavy', value: 5 },
];

// Any saved number shows as a weight word (older items with 2 or 4 still work)
export const weightLabel = (w) => {
  const n = w ?? 3;
  return n <= 2 ? 'Light' : n === 3 ? 'Medium' : 'Heavy';
};