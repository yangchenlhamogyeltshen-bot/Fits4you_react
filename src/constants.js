export const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];
export const SEASONS = ['Summer', 'Winter', 'All Season'];
export const PIECES = ['Gho', 'Kira', 'Tego', 'Wonju', 'Rachu', 'Kabney'];
export const OCCASIONS = ['Daily', 'Tshechu', 'Losar', 'Wedding'];

// Clothing swatches from the Android app (AddClothingActivity)
export const COLORS = [
  { name: 'Navy', hex: '#3E4A61' }, { name: 'Blue', hex: '#5B7FA6' },
  { name: 'Green', hex: '#4E8C6C' }, { name: 'Grey', hex: '#8B8F99' },
  { name: 'Charcoal', hex: '#2E2E2E' }, { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' }, { name: 'Tan', hex: '#D2B48C' },
  { name: 'Maroon', hex: '#800000' }, { name: 'Mustard', hex: '#F4B942' },
];

export const hexOf = (name) => (COLORS.find((c) => c.name === name) || {}).hex;