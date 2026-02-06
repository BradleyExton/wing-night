import { GeoguesrLocation } from './types';

// Built-in landmark locations with Unsplash images
export const LOCATIONS: GeoguesrLocation[] = [
  {
    id: 'eiffel',
    imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
    latitude: 48.8584,
    longitude: 2.2945,
    name: 'Eiffel Tower, Paris',
    hint: 'City of Lights',
    difficulty: 'easy',
  },
  {
    id: 'statue-liberty',
    imageUrl: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=800',
    latitude: 40.6892,
    longitude: -74.0445,
    name: 'Statue of Liberty, NYC',
    hint: 'Gift from France',
    difficulty: 'easy',
  },
  {
    id: 'colosseum',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    latitude: 41.8902,
    longitude: 12.4922,
    name: 'Colosseum, Rome',
    hint: 'Ancient amphitheater',
    difficulty: 'easy',
  },
  {
    id: 'sydney-opera',
    imageUrl: 'https://images.unsplash.com/photo-1524293581917-878a6d017c71?w=800',
    latitude: -33.8568,
    longitude: 151.2153,
    name: 'Sydney Opera House',
    hint: 'Down under',
    difficulty: 'medium',
  },
  {
    id: 'taj-mahal',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
    latitude: 27.1751,
    longitude: 78.0421,
    name: 'Taj Mahal, India',
    hint: 'Monument of love',
    difficulty: 'medium',
  },
  {
    id: 'machu-picchu',
    imageUrl: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
    latitude: -13.1631,
    longitude: -72.5450,
    name: 'Machu Picchu, Peru',
    hint: 'Lost city of the Incas',
    difficulty: 'medium',
  },
  {
    id: 'great-wall',
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
    latitude: 40.4319,
    longitude: 116.5704,
    name: 'Great Wall of China',
    hint: 'Visible from space (myth)',
    difficulty: 'hard',
  },
  {
    id: 'petra',
    imageUrl: 'https://images.unsplash.com/photo-1579606032821-4e6161c81571?w=800',
    latitude: 30.3285,
    longitude: 35.4444,
    name: 'Petra, Jordan',
    hint: 'Rose-red city',
    difficulty: 'hard',
  },
  {
    id: 'christ-redeemer',
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
    latitude: -22.9519,
    longitude: -43.2105,
    name: 'Christ the Redeemer, Rio',
    hint: 'Arms wide open',
    difficulty: 'medium',
  },
  {
    id: 'big-ben',
    imageUrl: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
    latitude: 51.5007,
    longitude: -0.1246,
    name: 'Big Ben, London',
    hint: 'Tea time!',
    difficulty: 'easy',
  },
  {
    id: 'golden-gate',
    imageUrl: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800',
    latitude: 37.8199,
    longitude: -122.4783,
    name: 'Golden Gate Bridge, SF',
    hint: 'Foggy city',
    difficulty: 'easy',
  },
  {
    id: 'pyramids',
    imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800',
    latitude: 29.9792,
    longitude: 31.1342,
    name: 'Pyramids of Giza, Egypt',
    hint: 'Ancient wonder',
    difficulty: 'medium',
  },
];

// Get random locations for a game
export function getRandomLocations(count: number): GeoguesrLocation[] {
  const shuffled = [...LOCATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get locations by difficulty
export function getLocationsByDifficulty(
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  count: number
): GeoguesrLocation[] {
  let filtered: GeoguesrLocation[];

  if (difficulty === 'mixed') {
    filtered = [...LOCATIONS];
  } else {
    filtered = LOCATIONS.filter(loc => loc.difficulty === difficulty);
  }

  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
