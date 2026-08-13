export const CATEGORIES = [
  { name: 'Vodka', slug: 'vodka' },
  { name: 'Whisky', slug: 'whisky' },
  { name: 'Rum', slug: 'rum' },
  { name: 'Gin', slug: 'gin' },
]

/** Seed catalog: brand sizes with Euro prices, grouped by category slug */
export const PRODUCT_SEED = [
  // Vodka
  { category: 'vodka', name: 'Poliakove', size: '20 cl', amount: 2.4 },
  { category: 'vodka', name: 'Poliakove', size: '35 cl', amount: 4.75 },
  { category: 'vodka', name: 'Poliakove', size: '70 cl', amount: 6.9 },
  { category: 'vodka', name: 'Poliakove', size: '1 L', amount: 10.0 },
  { category: 'vodka', name: 'Absolute', size: '20 cl', amount: 4.7 },
  { category: 'vodka', name: 'Absolute', size: '35 cl', amount: 7.0 },
  { category: 'vodka', name: 'Absolute', size: '70 cl', amount: 10.5 },
  { category: 'vodka', name: 'Sobeski', size: '20 cl', amount: 2.4 },
  { category: 'vodka', name: 'Sobeski', size: '35 cl', amount: 4.75 },
  { category: 'vodka', name: 'Sobeski', size: '70 cl', amount: 7.0 },

  // Whisky
  { category: 'whisky', name: 'William Peel', size: '20 cl', amount: 2.8 },
  { category: 'whisky', name: 'William Peel', size: '35 cl', amount: 4.75 },
  { category: 'whisky', name: 'William Peel', size: '70 cl', amount: 7.9 },
  { category: 'whisky', name: 'William Peel', size: '1 L', amount: 12.5 },
  { category: 'whisky', name: 'Label 5', size: '20 cl', amount: 2.85 },
  { category: 'whisky', name: 'Label 5', size: '35 cl', amount: 4.9 },
  { category: 'whisky', name: 'Label 5', size: '70 cl', amount: 7.5 },
  { category: 'whisky', name: 'Label 5', size: '1 L', amount: 10.5 },
  { category: 'whisky', name: 'Grants', size: '20 cl', amount: 2.9 },
  { category: 'whisky', name: 'Grants', size: '70 cl', amount: 9.5 },
  { category: 'whisky', name: 'Clanchambel', size: '20 cl', amount: 3.8 },
  { category: 'whisky', name: 'Clanchambel', size: '35 cl', amount: 7.5 },
  { category: 'whisky', name: 'Clanchambel', size: '70 cl', amount: 8.9 },
  { category: 'whisky', name: 'Clanchambel', size: '1 L', amount: 13.0 },
  { category: 'whisky', name: 'J.B', size: '20 cl', amount: 3.9 },
  { category: 'whisky', name: 'J.B', size: '70 cl', amount: 10.5 },
  { category: 'whisky', name: 'Ballantines', size: '20 cl', amount: 4.7 },
  { category: 'whisky', name: 'Ballantines', size: '35 cl', amount: 8.5 },
  { category: 'whisky', name: 'Ballantines', size: '70 cl', amount: 10.5 },
  { category: 'whisky', name: 'Ballantines', size: '1 L', amount: 16.5 },
  { category: 'whisky', name: 'Jack Daniels', size: '20 cl', amount: 6.5 },
  { category: 'whisky', name: 'Jack Daniels', size: '35 cl', amount: 10.5 },
  { category: 'whisky', name: 'Jack Daniels', size: '70 cl', amount: 15.0 },
  { category: 'whisky', name: 'Jack Daniels', size: '1 L', amount: 23.0 },
  { category: 'whisky', name: 'Jack Honey', size: '35 cl', amount: 10.9 },
  { category: 'whisky', name: 'Jack Honey', size: '70 cl', amount: 15.5 },

  // Rum
  { category: 'rum', name: 'Rum Blanc', size: '20 cl', amount: 2.85 },
  { category: 'rum', name: 'Rum Ambra', size: '20 cl', amount: 2.85 },
  { category: 'rum', name: 'Captain Morgan', size: '70 cl', amount: 10.0 },

  // Gin
  { category: 'gin', name: 'Gibson Gin', size: '20 cl', amount: 2.85 },
  { category: 'gin', name: 'Gibson Gin', size: '70 cl', amount: 9.0 },
]
