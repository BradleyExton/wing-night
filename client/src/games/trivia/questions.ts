import { TriviaQuestion } from './types';

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Pop Culture
  {
    id: 'pop-1',
    question: 'What year did the first iPhone come out?',
    answer: '2007',
    category: 'Pop Culture',
    difficulty: 'medium',
  },
  {
    id: 'pop-2',
    question: 'Who played Iron Man in the Marvel Cinematic Universe?',
    answer: 'Robert Downey Jr.',
    category: 'Pop Culture',
    difficulty: 'easy',
  },
  {
    id: 'pop-3',
    question: 'What is the name of the coffee shop in Friends?',
    answer: 'Central Perk',
    category: 'Pop Culture',
    difficulty: 'easy',
  },
  {
    id: 'pop-4',
    question: 'Which band performed at the Super Bowl halftime show in 2023?',
    answer: 'Rihanna',
    category: 'Pop Culture',
    difficulty: 'medium',
  },
  {
    id: 'pop-5',
    question: 'What Netflix show features a game of Red Light, Green Light?',
    answer: 'Squid Game',
    category: 'Pop Culture',
    difficulty: 'easy',
  },

  // Sports
  {
    id: 'sports-1',
    question: 'How many players are on a basketball team on the court at one time?',
    answer: '5',
    category: 'Sports',
    difficulty: 'easy',
  },
  {
    id: 'sports-2',
    question: 'Which country has won the most FIFA World Cups?',
    answer: 'Brazil (5)',
    category: 'Sports',
    difficulty: 'medium',
  },
  {
    id: 'sports-3',
    question: 'What sport is played at Wimbledon?',
    answer: 'Tennis',
    category: 'Sports',
    difficulty: 'easy',
  },
  {
    id: 'sports-4',
    question: 'How many holes are played in a standard round of golf?',
    answer: '18',
    category: 'Sports',
    difficulty: 'easy',
  },
  {
    id: 'sports-5',
    question: 'Which NFL team has won the most Super Bowls?',
    answer: 'New England Patriots (tied with 6)',
    category: 'Sports',
    difficulty: 'hard',
  },

  // Science
  {
    id: 'science-1',
    question: 'What planet is known as the Red Planet?',
    answer: 'Mars',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: 'science-2',
    question: 'What is the chemical symbol for gold?',
    answer: 'Au',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: 'science-3',
    question: 'How many bones are in the adult human body?',
    answer: '206',
    category: 'Science',
    difficulty: 'medium',
  },
  {
    id: 'science-4',
    question: 'What gas do plants absorb from the atmosphere?',
    answer: 'Carbon dioxide (CO2)',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: 'science-5',
    question: 'What is the largest organ in the human body?',
    answer: 'Skin',
    category: 'Science',
    difficulty: 'medium',
  },

  // History
  {
    id: 'history-1',
    question: 'In what year did World War II end?',
    answer: '1945',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: 'history-2',
    question: 'Who was the first President of the United States?',
    answer: 'George Washington',
    category: 'History',
    difficulty: 'easy',
  },
  {
    id: 'history-3',
    question: 'What ancient wonder was located in Alexandria, Egypt?',
    answer: 'The Lighthouse (Pharos)',
    category: 'History',
    difficulty: 'hard',
  },
  {
    id: 'history-4',
    question: 'Which ship famously sank on its maiden voyage in 1912?',
    answer: 'Titanic',
    category: 'History',
    difficulty: 'easy',
  },
  {
    id: 'history-5',
    question: 'What year did the Berlin Wall fall?',
    answer: '1989',
    category: 'History',
    difficulty: 'medium',
  },

  // Food & Drink
  {
    id: 'food-1',
    question: 'What is the main ingredient in guacamole?',
    answer: 'Avocado',
    category: 'Food & Drink',
    difficulty: 'easy',
  },
  {
    id: 'food-2',
    question: 'What country is Parmesan cheese originally from?',
    answer: 'Italy',
    category: 'Food & Drink',
    difficulty: 'easy',
  },
  {
    id: 'food-3',
    question: 'What is the hottest pepper in the world (as of 2023)?',
    answer: 'Carolina Reaper',
    category: 'Food & Drink',
    difficulty: 'medium',
  },
  {
    id: 'food-4',
    question: 'What grain is sake made from?',
    answer: 'Rice',
    category: 'Food & Drink',
    difficulty: 'medium',
  },
  {
    id: 'food-5',
    question: 'How many herbs and spices are in KFC\'s original recipe?',
    answer: '11',
    category: 'Food & Drink',
    difficulty: 'medium',
  },

  // Geography
  {
    id: 'geo-1',
    question: 'What is the largest country by land area?',
    answer: 'Russia',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: 'geo-2',
    question: 'What is the capital of Australia?',
    answer: 'Canberra',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: 'geo-3',
    question: 'Which river flows through Paris?',
    answer: 'Seine',
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    id: 'geo-4',
    question: 'How many continents are there?',
    answer: '7',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: 'geo-5',
    question: 'What is the smallest country in the world?',
    answer: 'Vatican City',
    category: 'Geography',
    difficulty: 'medium',
  },

  // Music
  {
    id: 'music-1',
    question: 'What band was Freddie Mercury the lead singer of?',
    answer: 'Queen',
    category: 'Music',
    difficulty: 'easy',
  },
  {
    id: 'music-2',
    question: 'How many strings does a standard guitar have?',
    answer: '6',
    category: 'Music',
    difficulty: 'easy',
  },
  {
    id: 'music-3',
    question: 'What was Elvis Presley\'s middle name?',
    answer: 'Aaron',
    category: 'Music',
    difficulty: 'medium',
  },
];

// Shuffle and pick random questions
export function getRandomQuestions(count: number): TriviaQuestion[] {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get questions by category
export function getQuestionsByCategory(category: string): TriviaQuestion[] {
  return TRIVIA_QUESTIONS.filter(q => q.category === category);
}

export const CATEGORIES = [...new Set(TRIVIA_QUESTIONS.map(q => q.category))];
