export interface WordPair {
  uz: string;
  en: string;
}

export interface WordCategory {
  name: string;
  words: WordPair[];
}

export type GameType =
  // === SOLO (15 total) ===
  | 'spelling-bee'
  | 'hangman'
  | 'word-search'
  | 'anagram'
  | 'fill-blank'
  | 'emoji-quiz'
  | 'synonym-find'
  | 'definition-quiz'
  | 'word-scramble'
  | 'listening-quiz'
  | 'vocab-speed'
  | 'letter-hint'
  | 'grammar-choose'
  | 'word-builder'
  | 'flashcard-solo'
  // === DUEL (17 total) ===
  | 'word-duel'
  | 'flashcard-battle'
  | 'spelling-race'
  | 'sentence-duel'
  | 'true-false'
  | 'sentence-sprint'
  | 'phrase-builder'
  | 'speed-quiz'
  | 'word-bomb'
  | 'definition-duel'
  | 'emoji-battle'
  | 'grammar-clash'
  | 'synonym-duel'
  | 'antonym-duel'
  | 'vocab-blitz'
  | 'sentence-fix'
  | 'word-race'
  // === TEAM (19 total) ===
  | 'team-quiz'
  | 'category-sort'
  | 'word-chain'
  | 'hot-seat'
  | 'pictionary'
  | 'memory-match'
  | 'tug-of-war'
  | 'category-quiz'
  | 'memory-rush'
  | 'picture-quest'
  | 'vocabulary-bingo'
  | 'english-taboo'
  | 'team-spelling'
  | 'word-pyramid'
  | 'vocab-relay'
  | 'story-builder'
  | 'word-wheel'
  | 'grammar-team'
  | 'speed-sort'
  // === NEW UNIQUE GAMES ===
  | 'odd-one-out'
  | 'analogy-quiz'
  | 'password-game';

export type GameDifficulty = 'beginner' | 'elementary' | 'advanced' | 'custom';

export type GameMode = 'solo' | 'duel' | 'team';

export interface GameMetadata {
  id: GameType;
  title: string;
  description: string;
  howToPlay: string[];
  mode: GameMode;
  icon: string;
}

export interface Team {
  name: string;
  score: number;
  color: string;
  emoji: string;
}

export type GameState = 'setup' | 'playing' | 'ended';
