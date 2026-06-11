import React, { useState, useEffect, useRef } from 'react';
import { WordPair } from '../types';
import { sound } from '../utils/audio';
import { sampleSentences, GrammarSentence } from '../utils/data';
import { RefreshCw, Star, Sparkles, Volume2 } from 'lucide-react';

interface SoloGamesProps {
  gameType: string;
  wordList: WordPair[];
  onAddScore: (points: number) => void;
  onNextQuestion: () => void;
}

// Emoji vocabulary for emoji-quiz
const EMOJI_VOCAB: { emoji: string; en: string; uz: string }[] = [
  { emoji: '🍎', en: 'Apple', uz: 'Olma' },
  { emoji: '🍌', en: 'Banana', uz: 'Banan' },
  { emoji: '🐱', en: 'Cat', uz: 'Mushuk' },
  { emoji: '🐶', en: 'Dog', uz: 'Kuchuk' },
  { emoji: '🏠', en: 'House', uz: 'Uy' },
  { emoji: '🚗', en: 'Car', uz: 'Mashina' },
  { emoji: '☀️', en: 'Sun', uz: 'Quyosh' },
  { emoji: '🌙', en: 'Moon', uz: 'Oy' },
  { emoji: '⭐', en: 'Star', uz: 'Yulduz' },
  { emoji: '🌳', en: 'Tree', uz: 'Daraxt' },
  { emoji: '🌸', en: 'Flower', uz: 'Gul' },
  { emoji: '📚', en: 'Book', uz: 'Kitob' },
  { emoji: '✏️', en: 'Pencil', uz: 'Qalam' },
  { emoji: '❤️', en: 'Heart', uz: 'Yurak' },
  { emoji: '💧', en: 'Water', uz: 'Suv' },
  { emoji: '🔥', en: 'Fire', uz: 'Olov' },
  { emoji: '🏫', en: 'School', uz: 'Maktab' },
  { emoji: '🎵', en: 'Music', uz: 'Musiqa' },
  { emoji: '⚽', en: 'Football', uz: 'Futbol' },
  { emoji: '🍕', en: 'Pizza', uz: 'Pizza' },
  { emoji: '🎂', en: 'Cake', uz: 'Tort' },
  { emoji: '🐘', en: 'Elephant', uz: 'Fil' },
  { emoji: '🦁', en: 'Lion', uz: 'Arslon' },
  { emoji: '🐦', en: 'Bird', uz: 'Qush' },
  { emoji: '🐟', en: 'Fish', uz: 'Baliq' },
  { emoji: '🍊', en: 'Orange', uz: 'Apelsin' },
  { emoji: '🍋', en: 'Lemon', uz: 'Limon' },
  { emoji: '🍇', en: 'Grape', uz: 'Uzum' },
  { emoji: '🌈', en: 'Rainbow', uz: 'Kamalak' },
  { emoji: '☁️', en: 'Cloud', uz: 'Bulut' },
  { emoji: '🌧️', en: 'Rain', uz: 'Yomg\'ir' },
  { emoji: '❄️', en: 'Snow', uz: 'Qor' },
  { emoji: '👨‍🏫', en: 'Teacher', uz: 'O\'qituvchi' },
  { emoji: '👨‍🎓', en: 'Student', uz: 'O\'quvchi' },
  { emoji: '🖊️', en: 'Pen', uz: 'Ruchka' },
];

// Synonym groups for synonym-find
const SYNONYM_GROUPS: { word: string; synonyms: string[]; uz: string }[] = [
  { word: 'happy', synonyms: ['joyful', 'pleased', 'content', 'cheerful'], uz: 'Xursand' },
  { word: 'sad', synonyms: ['unhappy', 'sorrowful', 'gloomy', 'depressed'], uz: 'Qayg\'uli' },
  { word: 'big', synonyms: ['large', 'huge', 'enormous', 'vast'], uz: 'Katta' },
  { word: 'small', synonyms: ['tiny', 'little', 'miniature', 'petite'], uz: 'Kichik' },
  { word: 'fast', synonyms: ['quick', 'rapid', 'swift', 'speedy'], uz: 'Tez' },
  { word: 'smart', synonyms: ['clever', 'intelligent', 'bright', 'sharp'], uz: 'Aqlli' },
  { word: 'beautiful', synonyms: ['lovely', 'gorgeous', 'attractive', 'pretty'], uz: 'Chiroyli' },
  { word: 'strong', synonyms: ['powerful', 'mighty', 'robust', 'sturdy'], uz: 'Kuchli' },
  { word: 'old', synonyms: ['ancient', 'aged', 'elderly', 'vintage'], uz: 'Qari/Eski' },
  { word: 'new', synonyms: ['fresh', 'modern', 'recent', 'novel'], uz: 'Yangi' },
  { word: 'difficult', synonyms: ['hard', 'challenging', 'tough', 'complex'], uz: 'Qiyin' },
  { word: 'kind', synonyms: ['gentle', 'caring', 'generous', 'warm'], uz: 'Mehribon' },
];

// Definitions for definition-quiz
const DEFINITIONS: { word: string; definition: string; uz: string; options: string[] }[] = [
  { word: 'generous', definition: 'Giving more than expected; kind and unselfish with money or time.', uz: 'Saxiy', options: ['selfish', 'generous', 'lazy', 'angry'] },
  { word: 'curious', definition: 'Eager to know or learn something new.', uz: 'Qiziquvchan', options: ['curious', 'bored', 'sleepy', 'rude'] },
  { word: 'ancient', definition: 'Very old; belonging to the distant past.', uz: 'Qadimiy', options: ['modern', 'ancient', 'recent', 'fresh'] },
  { word: 'courageous', definition: 'Not afraid of danger; very brave.', uz: 'Jasur', options: ['cowardly', 'weak', 'courageous', 'nervous'] },
  { word: 'enormous', definition: 'Very large in size or amount.', uz: 'Ulkan', options: ['tiny', 'enormous', 'average', 'thin'] },
  { word: 'brilliant', definition: 'Very clever and impressive; extremely bright.', uz: 'Yorqin/Aqlli', options: ['dull', 'brilliant', 'slow', 'boring'] },
  { word: 'peaceful', definition: 'Calm, quiet, and free from conflict.', uz: 'Tinch', options: ['violent', 'loud', 'peaceful', 'angry'] },
  { word: 'mysterious', definition: 'Strange, unknown, or difficult to understand.', uz: 'Sirli', options: ['obvious', 'clear', 'mysterious', 'simple'] },
  { word: 'delicious', definition: 'Having a very pleasant taste or smell.', uz: 'Mazali', options: ['horrible', 'delicious', 'tasteless', 'bitter'] },
  { word: 'exhausted', definition: 'Completely tired out, having no more energy.', uz: 'Charchagan', options: ['energetic', 'fresh', 'excited', 'exhausted'] },
  { word: 'adventurous', definition: 'Willing to try new and exciting things.', uz: 'Sarguzashtli', options: ['adventurous', 'cautious', 'boring', 'lazy'] },
  { word: 'patient', definition: 'Able to wait calmly without getting angry.', uz: 'Sabr-toqatli', options: ['impatient', 'patient', 'hasty', 'rude'] },
];

// Grammar sentences for grammar-choose
const GRAMMAR_ITEMS: { sentence: string; blank: string; options: string[]; correct: string; uz: string }[] = [
  { sentence: 'She ___ reading a book right now.', blank: '___', options: ['is', 'are', 'am', 'be'], correct: 'is', uz: 'U hozir kitob o\'qiyapti.' },
  { sentence: 'They ___ to school every day.', blank: '___', options: ['go', 'goes', 'going', 'went'], correct: 'go', uz: 'Ular har kuni maktabga boradi.' },
  { sentence: 'He ___ English for five years.', blank: '___', options: ['has studied', 'study', 'studied', 'studies'], correct: 'has studied', uz: 'U besh yildan beri ingliz tilini o\'rganmoqda.' },
  { sentence: 'I ___ a doctor when I grow up.', blank: '___', options: ['will be', 'am', 'was', 'be'], correct: 'will be', uz: 'Men katta bo\'lganimda shifokor bo\'laman.' },
  { sentence: 'The book ___ written by Shakespeare.', blank: '___', options: ['was', 'is', 'were', 'be'], correct: 'was', uz: 'Kitob Shekspir tomonidan yozilgan.' },
  { sentence: 'If it ___ tomorrow, we will stay home.', blank: '___', options: ['rains', 'rain', 'rained', 'raining'], correct: 'rains', uz: 'Agar ertaga yomg\'ir yog\'sa, uyda qolamiz.' },
  { sentence: 'There ___ many students in the class.', blank: '___', options: ['are', 'is', 'am', 'be'], correct: 'are', uz: 'Sinfda ko\'p o\'quvchilar bor.' },
  { sentence: 'She can ___ very fast.', blank: '___', options: ['run', 'runs', 'ran', 'running'], correct: 'run', uz: 'U juda tez yugura oladi.' },
  { sentence: 'We ___ football yesterday.', blank: '___', options: ['played', 'play', 'plays', 'playing'], correct: 'played', uz: 'Biz kecha futbol o\'yndik.' },
  { sentence: 'He ___ breakfast every morning.', blank: '___', options: ['eats', 'eat', 'eaten', 'eating'], correct: 'eats', uz: 'U har ertalab nonushta qiladi.' },
];

const playTTS = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }
};

export default function SoloGames({ gameType, wordList, onAddScore, onNextQuestion }: SoloGamesProps) {
  const [currentWord, setCurrentWord] = useState<WordPair>({ uz: 'Olma', en: 'Apple' });
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // spelling-bee
  const [beeInput, setBeeInput] = useState<string[]>([]);
  const [beeScrambled, setBeeScrambled] = useState<string[]>([]);

  // hangman
  const [hangmanHidden, setHangmanHidden] = useState<string[]>([]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [hangmanLives, setHangmanLives] = useState(6);

  // word-search
  const [grid, setGrid] = useState<string[][]>([]);
  const [targetSearchWords, setTargetSearchWords] = useState<string[]>([]);
  const [foundSearchWords, setFoundSearchWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ r: number; c: number }[]>([]);

  // anagram
  const [anagramLetters, setAnagramLetters] = useState<{ id: string; val: string }[]>([]);
  const [anagramAnswer, setAnagramAnswer] = useState<string[]>([]);

  // fill-blank
  const [currentSentence, setCurrentSentence] = useState<GrammarSentence | null>(null);
  const [sentenceOptions, setSentenceOptions] = useState<string[]>([]);

  // emoji-quiz
  const [emojiItem, setEmojiItem] = useState<typeof EMOJI_VOCAB[0]>(EMOJI_VOCAB[0]);
  const [emojiOptions, setEmojiOptions] = useState<string[]>([]);

  // synonym-find
  const [synonymGroup, setSynonymGroup] = useState<typeof SYNONYM_GROUPS[0]>(SYNONYM_GROUPS[0]);
  const [synonymOptions, setSynonymOptions] = useState<string[]>([]);

  // definition-quiz
  const [defItem, setDefItem] = useState<typeof DEFINITIONS[0]>(DEFINITIONS[0]);

  // word-scramble
  const [scrambledLetters, setScrambledLetters] = useState<{ id: string; val: string }[]>([]);
  const [scrambleBuilt, setScrambleBuilt] = useState<string[]>([]);

  // listening-quiz
  const [listeningOptions, setListeningOptions] = useState<string[]>([]);
  const [listenWord, setListenWord] = useState('');

  // vocab-speed
  const [speedTimer, setSpeedTimer] = useState(60);
  const [speedActive, setSpeedActive] = useState(false);
  const [speedOptions, setSpeedOptions] = useState<string[]>([]);
  const [speedCount, setSpeedCount] = useState(0);
  const speedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // letter-hint
  const [hintWord, setHintWord] = useState('');
  const [hintOptions, setHintOptions] = useState<string[]>([]);
  const [hintUz, setHintUz] = useState('');

  // grammar-choose
  const [grammarItem, setGrammarItem] = useState<typeof GRAMMAR_ITEMS[0]>(GRAMMAR_ITEMS[0]);

  // word-builder (syllable game)
  const [builderWord, setBuilderWord] = useState('');
  const [builderSyllables, setBuilderSyllables] = useState<{ id: string; val: string }[]>([]);
  const [builderBuilt, setBuilderBuilt] = useState<string[]>([]);
  const [builderUz, setBuilderUz] = useState('');

  // flashcard-solo
  const [flashItems, setFlashItems] = useState<WordPair[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashRevealed, setFlashRevealed] = useState(false);

  const addScore = (pts: number) => {
    sound.playCorrect();
    setFeedback('correct');
    onAddScore(pts);
    setScore(s => s + pts);
    setTimeout(() => { setFeedback(null); refreshGame(); }, 900);
  };

  const wrongAnswer = () => {
    sound.playIncorrect();
    setFeedback('wrong');
    setTimeout(() => { setFeedback(null); refreshGame(); }, 900);
  };

  const refreshGame = () => {
    if (!wordList || wordList.length === 0) return;
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(word);
    const enLower = word.en.toLowerCase();

    if (gameType === 'spelling-bee') {
      setBeeInput([]);
      const targetLetters = enLower.split('');
      const extras = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(l => !targetLetters.includes(l));
      const chosenExtras = extras.sort(() => Math.random() - 0.5).slice(0, Math.min(5, 10 - targetLetters.length));
      setBeeScrambled([...targetLetters, ...chosenExtras].sort(() => Math.random() - 0.5));
    }

    if (gameType === 'hangman') {
      setGuessedLetters([]);
      setHangmanLives(6);
      setHangmanHidden(enLower.split('').map(c => (c === ' ' ? ' ' : '_')));
    }

    if (gameType === 'anagram') {
      setAnagramAnswer([]);
      setAnagramLetters(enLower.split('').map((l, i) => ({ id: `${l}-${i}`, val: l })).sort(() => Math.random() - 0.5));
    }

    if (gameType === 'word-search') {
      const count = Math.min(3, wordList.length);
      const chosen = [...wordList].sort(() => Math.random() - 0.5).slice(0, count);
      const targets = chosen.map(p => p.en.toLowerCase().replace(/\s+/g, ''));
      setTargetSearchWords(targets);
      setFoundSearchWords([]);
      setSelectedCells([]);
      const rows = 8, cols = 8;
      const matrix: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
      targets.forEach(tWord => {
        let placed = false, attempts = 0;
        while (!placed && attempts < 50) {
          attempts++;
          const hor = Math.random() > 0.5;
          const r = hor ? Math.floor(Math.random() * rows) : Math.floor(Math.random() * (rows - tWord.length));
          const c = hor ? Math.floor(Math.random() * (cols - tWord.length)) : Math.floor(Math.random() * cols);
          let ok = true;
          for (let i = 0; i < tWord.length; i++) {
            const cr = hor ? r : r + i, cc = hor ? c + i : c;
            if (matrix[cr][cc] !== '' && matrix[cr][cc] !== tWord[i]) { ok = false; break; }
          }
          if (ok) {
            for (let i = 0; i < tWord.length; i++) {
              const cr = hor ? r : r + i, cc = hor ? c + i : c;
              matrix[cr][cc] = tWord[i];
            }
            placed = true;
          }
        }
      });
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (matrix[r][c] === '') matrix[r][c] = letters[Math.floor(Math.random() * 26)];
      setGrid(matrix);
    }

    if (gameType === 'fill-blank') {
      const idx = Math.floor(Math.random() * sampleSentences.length);
      const sent = sampleSentences[idx];
      setCurrentSentence(sent);
      const dist = sampleSentences.filter((_, i) => i !== idx).map(s => s.missingWord.toLowerCase());
      setSentenceOptions([sent.missingWord.toLowerCase(), ...dist.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5));
    }

    if (gameType === 'emoji-quiz') {
      const item = EMOJI_VOCAB[Math.floor(Math.random() * EMOJI_VOCAB.length)];
      setEmojiItem(item);
      const others = EMOJI_VOCAB.filter(e => e.en !== item.en).map(e => e.en);
      setEmojiOptions([item.en, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5));
    }

    if (gameType === 'synonym-find') {
      const grp = SYNONYM_GROUPS[Math.floor(Math.random() * SYNONYM_GROUPS.length)];
      setSynonymGroup(grp);
      const correctSynonym = grp.synonyms[0];
      const wrongOpts = SYNONYM_GROUPS.filter(g => g.word !== grp.word).map(g => g.synonyms[0]);
      setSynonymOptions([correctSynonym, ...wrongOpts.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5));
    }

    if (gameType === 'definition-quiz') {
      setDefItem(DEFINITIONS[Math.floor(Math.random() * DEFINITIONS.length)]);
    }

    if (gameType === 'word-scramble') {
      setScrambleBuilt([]);
      setScrambledLetters(enLower.split('').map((l, i) => ({ id: `${l}-${i}`, val: l })).sort(() => Math.random() - 0.5));
    }

    if (gameType === 'listening-quiz') {
      const chosenWord = wordList[Math.floor(Math.random() * wordList.length)];
      setListenWord(chosenWord.en);
      const others = wordList.filter(w => w.en !== chosenWord.en).map(w => w.en);
      setListeningOptions([chosenWord.en, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5));
      setTimeout(() => playTTS(chosenWord.en), 300);
    }

    if (gameType === 'vocab-speed') {
      const distract = wordList.filter(w => w.en !== word.en).map(w => w.en);
      setSpeedOptions([word.en, ...distract.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5));
    }

    if (gameType === 'letter-hint') {
      setHintWord(word.en);
      setHintUz(word.uz);
      const others = wordList.filter(w => w.en !== word.en).map(w => w.en);
      setHintOptions([word.en, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5));
    }

    if (gameType === 'grammar-choose') {
      setGrammarItem(GRAMMAR_ITEMS[Math.floor(Math.random() * GRAMMAR_ITEMS.length)]);
    }

    if (gameType === 'word-builder') {
      // Split word into syllables (simple vowel-based split)
      const syllables = splitSyllables(word.en);
      setBuilderWord(word.en);
      setBuilderUz(word.uz);
      setBuilderBuilt([]);
      setBuilderSyllables(syllables.map((s, i) => ({ id: `${s}-${i}`, val: s })).sort(() => Math.random() - 0.5));
    }

    if (gameType === 'flashcard-solo') {
      const shuffled = [...wordList].sort(() => Math.random() - 0.5).slice(0, 10);
      setFlashItems(shuffled);
      setFlashIndex(0);
      setFlashRevealed(false);
    }
  };

  const splitSyllables = (word: string): string[] => {
    const w = word.toLowerCase();
    if (w.length <= 3) return [w];
    if (w.length <= 6) return [w.slice(0, Math.ceil(w.length / 2)), w.slice(Math.ceil(w.length / 2))];
    const mid = Math.floor(w.length / 3);
    return [w.slice(0, mid), w.slice(mid, mid * 2), w.slice(mid * 2)];
  };

  useEffect(() => {
    refreshGame();
    return () => { if (speedIntervalRef.current) clearInterval(speedIntervalRef.current); };
  }, [gameType, wordList]);

  // Vocab speed timer
  useEffect(() => {
    if (gameType === 'vocab-speed' && speedActive) {
      speedIntervalRef.current = setInterval(() => {
        setSpeedTimer(t => {
          if (t <= 1) {
            clearInterval(speedIntervalRef.current!);
            setSpeedActive(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (speedIntervalRef.current) clearInterval(speedIntervalRef.current); };
  }, [speedActive, gameType]);

  // ---- HANDLERS ----
  const selectBeeLetter = (letter: string, idx: number) => {
    sound.playTap();
    const updated = [...beeInput, letter];
    setBeeInput(updated);
    const next = [...beeScrambled]; next.splice(idx, 1); setBeeScrambled(next);
    const joined = updated.join('');
    const target = currentWord.en.toLowerCase();
    if (joined === target) { addScore(5); }
    else if (!target.startsWith(joined)) { wrongAnswer(); setTimeout(() => { setBeeInput([]); refreshGame(); }, 700); }
  };

  const guessHangmanLetter = (char: string) => {
    if (guessedLetters.includes(char) || hangmanLives <= 0) return;
    sound.playTap();
    const target = currentWord.en.toLowerCase();
    const next = [...guessedLetters, char];
    setGuessedLetters(next);
    if (target.includes(char)) {
      const hidden = target.split('').map(c => (next.includes(c) || c === ' ' ? c : '_'));
      setHangmanHidden(hidden);
      if (!hidden.includes('_')) addScore(5);
    } else {
      sound.playIncorrect();
      const lives = hangmanLives - 1;
      setHangmanLives(lives);
      if (lives <= 0) setTimeout(() => refreshGame(), 1500);
    }
  };

  const tapAnagram = (item: { id: string; val: string }) => {
    sound.playTap();
    const next = [...anagramAnswer, item.val];
    setAnagramAnswer(next);
    setAnagramLetters(prev => prev.filter(l => l.id !== item.id));
    const merged = next.join('');
    const target = currentWord.en.toLowerCase();
    if (merged === target) { addScore(5); }
    else if (!target.startsWith(merged)) { wrongAnswer(); setTimeout(refreshGame, 700); }
  };

  const tapSearchCell = (r: number, c: number) => {
    sound.playTap();
    const exists = selectedCells.findIndex(cell => cell.r === r && cell.c === c);
    const next = [...selectedCells];
    if (exists >= 0) next.splice(exists, 1); else next.push({ r, c });
    setSelectedCells(next);
    const word = next.map(cell => grid[cell.r][cell.c]).join('');
    if (targetSearchWords.includes(word) && !foundSearchWords.includes(word)) {
      sound.playCorrect();
      const found = [...foundSearchWords, word];
      setFoundSearchWords(found);
      setSelectedCells([]);
      onAddScore(3); setScore(s => s + 3);
      if (found.length === targetSearchWords.length) setTimeout(refreshGame, 1200);
    }
  };

  const handleBlankAnswer = (ans: string) => {
    if (!currentSentence) return;
    if (ans === currentSentence.missingWord.toLowerCase()) { addScore(5); }
    else wrongAnswer();
  };

  const tapScramble = (item: { id: string; val: string }) => {
    sound.playTap();
    const next = [...scrambleBuilt, item.val];
    setScrambleBuilt(next);
    setScrambledLetters(prev => prev.filter(l => l.id !== item.id));
    const merged = next.join('');
    const target = currentWord.en.toLowerCase();
    if (merged === target) { addScore(5); }
    else if (!target.startsWith(merged)) { wrongAnswer(); setTimeout(() => { setScrambleBuilt([]); setScrambledLetters(currentWord.en.toLowerCase().split('').map((l, i) => ({ id: `${l}-${i}`, val: l })).sort(() => Math.random() - 0.5)); }, 700); }
  };

  const tapBuilder = (item: { id: string; val: string }) => {
    sound.playTap();
    const next = [...builderBuilt, item.val];
    setBuilderBuilt(next);
    setBuilderSyllables(prev => prev.filter(s => s.id !== item.id));
    const merged = next.join('');
    const target = builderWord.toLowerCase();
    if (merged === target) { addScore(5); }
    else if (!target.startsWith(merged)) { wrongAnswer(); setTimeout(() => { const syls = splitSyllables(builderWord); setBuilderBuilt([]); setBuilderSyllables(syls.map((s, i) => ({ id: `${s}-${i}`, val: s })).sort(() => Math.random() - 0.5)); }, 700); }
  };

  const handleSpeedAnswer = (opt: string) => {
    if (!speedActive || speedTimer === 0) return;
    if (opt === currentWord.en) {
      sound.playCorrect();
      const cnt = speedCount + 1;
      setSpeedCount(cnt);
      onAddScore(1); setScore(s => s + 1);
      const next = wordList[Math.floor(Math.random() * wordList.length)];
      setCurrentWord(next);
      const others = wordList.filter(w => w.en !== next.en).map(w => w.en);
      setSpeedOptions([next.en, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5));
    } else {
      sound.playIncorrect();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 400);
    }
  };

  const gameTitle: Record<string, string> = {
    'spelling-bee': 'Spelling Bee 🐝',
    'hangman': 'Hangman 💀',
    'anagram': 'Anagram 🔮',
    'word-search': 'Word Search 🔍',
    'fill-blank': 'Gap To\'ldirish 📝',
    'emoji-quiz': 'Emoji Quiz 🎯',
    'synonym-find': 'Sinonim Topish 🔄',
    'definition-quiz': 'Ta\'rif Testi 📖',
    'word-scramble': 'So\'z Aralashtirish 🌀',
    'listening-quiz': 'Eshitib Yozish 🎧',
    'vocab-speed': 'Tezkor Lug\'at ⚡',
    'letter-hint': 'Harf Yashirish 🔐',
    'grammar-choose': 'Grammatika 📚',
    'word-builder': 'So\'z Quruvchi 🏗️',
    'flashcard-solo': 'Flashcard Solo 🃏',
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 select-none rounded-3xl border shadow-xl relative overflow-hidden transition-all duration-300 ${
      feedback === 'correct' ? 'bg-emerald-950/20 border-emerald-500/40' :
      feedback === 'wrong' ? 'bg-rose-950/20 border-rose-500/40' :
      'bg-slate-950/40 border-slate-900'
    }`}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-900 pb-4 gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500">INDIVIDUAL REJIM (SOLO)</span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            {gameTitle[gameType] || gameType}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-sm font-bold flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-emerald-400 font-black">{score} ball</span>
          </div>
          <button onClick={refreshGame} className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===== SPELLING BEE ===== */}
      {gameType === 'spelling-bee' && (
        <div className="text-center py-4 space-y-6">
          <div>
            <span className="text-xs text-slate-500 uppercase font-black">Bu so'zni inglizcha harflab yozing:</span>
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 mt-1">{currentWord.uz}</h3>
          </div>
          <div className="flex justify-center gap-2 py-3">
            {currentWord.en.split('').map((_, i) => (
              <div key={i} className={`w-12 h-14 rounded-xl border flex items-center justify-center font-bold text-lg uppercase shadow-inner ${beeInput[i] ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-900 text-slate-600'}`}>
                {beeInput[i] || ''}
              </div>
            ))}
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl max-w-xl mx-auto">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-3">Harflarni tartibda bosing:</span>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {beeScrambled.map((letter, idx) => (
                <button key={`${letter}-${idx}`} onClick={() => selectBeeLetter(letter, idx)} className="w-12 h-12 md:w-14 md:h-14 font-black uppercase text-base bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 rounded-xl transition-all active:scale-90 cursor-pointer">
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== HANGMAN ===== */}
      {gameType === 'hangman' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-4">
          <div className="text-center space-y-5">
            <div>
              <span className="text-xs text-slate-500 uppercase font-black">O'zbekchasi:</span>
              <h3 className="text-3xl font-black text-sky-400 mt-1">{currentWord.uz}</h3>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-slate-400">Yuraklar:</span>
              <div className="flex gap-1.5">
                {Array(6).fill(null).map((_, i) => (
                  <div key={i} className={`w-4 h-7 rounded ${i >= hangmanLives ? 'bg-zinc-800 opacity-20' : 'bg-red-500 animate-pulse'}`} />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {hangmanHidden.map((char, i) => (
                <div key={i} className="w-10 h-12 text-xl font-bold border-b-4 border-cyan-400 text-white flex items-center justify-center uppercase font-mono">
                  {char === ' ' ? ' ' : char === '_' ? '' : char}
                </div>
              ))}
            </div>
            {/* SVG hangman figure */}
            <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
              <line x1="10" y1="110" x2="110" y2="110" stroke="#475569" strokeWidth="3" />
              <line x1="30" y1="110" x2="30" y2="10" stroke="#475569" strokeWidth="3" />
              <line x1="30" y1="10" x2="70" y2="10" stroke="#475569" strokeWidth="3" />
              <line x1="70" y1="10" x2="70" y2="25" stroke="#475569" strokeWidth="3" />
              {hangmanLives <= 5 && <circle cx="70" cy="35" r="10" stroke="#ef4444" strokeWidth="2.5" fill="none" />}
              {hangmanLives <= 4 && <line x1="70" y1="45" x2="70" y2="75" stroke="#ef4444" strokeWidth="2.5" />}
              {hangmanLives <= 3 && <line x1="70" y1="55" x2="52" y2="70" stroke="#ef4444" strokeWidth="2.5" />}
              {hangmanLives <= 2 && <line x1="70" y1="55" x2="88" y2="70" stroke="#ef4444" strokeWidth="2.5" />}
              {hangmanLives <= 1 && <line x1="70" y1="75" x2="55" y2="92" stroke="#ef4444" strokeWidth="2.5" />}
              {hangmanLives <= 0 && <line x1="70" y1="75" x2="85" y2="92" stroke="#ef4444" strokeWidth="2.5" />}
            </svg>
          </div>
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900">
            <span className="text-[11px] text-slate-500 font-bold uppercase block mb-3 text-center">Tugmalarni bosib so'zni toping:</span>
            <div className="grid grid-cols-6 gap-1.5">
              {'abcdefghijklmnopqrstuvwxyz'.split('').map(letter => {
                const guessed = guessedLetters.includes(letter);
                return (
                  <button key={letter} onClick={() => guessHangmanLetter(letter)} disabled={guessed || hangmanLives <= 0} className={`p-2 font-bold font-mono text-sm rounded-xl uppercase transition-all ${guessed ? 'bg-slate-900 border border-slate-900 text-slate-700 line-through opacity-40' : 'bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:bg-slate-800 text-slate-200 cursor-pointer'}`}>
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== ANAGRAM ===== */}
      {gameType === 'anagram' && (
        <div className="text-center py-4 space-y-6">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold block">Harflarni to'g'ri joylashtiring:</span>
            <h3 className="text-3xl font-black text-amber-400 mt-1">{currentWord.uz}</h3>
          </div>
          <div className="flex justify-center gap-2 py-3 bg-slate-900/30 rounded-2xl px-5 border border-slate-900 min-h-[60px] items-center">
            {anagramAnswer.length === 0 ? <span className="text-sm text-slate-500 italic">Tepadagi ko'piklarni bosing...</span> :
              anagramAnswer.map((char, i) => (
                <div key={i} className="w-10 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-bold text-lg uppercase flex items-center justify-center">{char}</div>
              ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {anagramLetters.map(item => (
              <button key={item.id} onClick={() => tapAnagram(item)} className="w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 hover:border-amber-500 text-white font-extrabold text-lg uppercase transition-all shadow-lg active:scale-90 cursor-pointer">
                {item.val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== WORD SEARCH ===== */}
      {gameType === 'word-search' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 mx-auto">
            <div className="grid grid-cols-8 gap-1">
              {grid.map((rowArr, rIdx) => rowArr.map((letter, cIdx) => {
                const isSel = selectedCells.some(c => c.r === rIdx && c.c === cIdx);
                return (
                  <button key={`${rIdx}-${cIdx}`} onClick={() => tapSearchCell(rIdx, cIdx)} className={`w-10 h-10 md:w-11 md:h-11 font-black text-sm uppercase rounded-lg border transition-all cursor-pointer ${isSel ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500'}`}>
                    {letter}
                  </button>
                );
              }))}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />Topish kerak bo'lgan so'zlar:
            </h4>
            {targetSearchWords.map(w => (
              <div key={w} className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold uppercase ${foundSearchWords.includes(w) ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 line-through' : 'bg-slate-950 border-slate-850 text-slate-300'}`}>
                <span>{w}</span>
                <span className="text-[10px] bg-slate-800 py-0.5 px-2 rounded">{foundSearchWords.includes(w) ? 'Topildi ✓' : 'Qidirilmoqda...'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== FILL BLANK ===== */}
      {gameType === 'fill-blank' && currentSentence && (
        <div className="text-center py-4 space-y-6">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-900 max-w-2xl mx-auto space-y-3">
            <span className="text-xs text-slate-500 font-extrabold uppercase">Gap ma'nosi:</span>
            <p className="text-base italic text-slate-300">"{currentSentence.promptUz}"</p>
            <div className="h-px bg-slate-800" />
            <p className="text-xl md:text-2xl font-black text-white leading-normal">
              {currentSentence.full.split(' ').map((word, i) => {
                const isTarget = word.toLowerCase().replace(/[.,!]/g, '') === currentSentence.missingWord.toLowerCase();
                return isTarget ? <span key={i} className="mx-1.5 border-b-2 border-dashed border-amber-400 text-amber-400 px-3">_____</span> : <span key={i} className="mx-1">{word}</span>;
              })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {sentenceOptions.map(opt => (
              <button key={opt} onClick={() => handleBlankAnswer(opt)} className="py-4 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm uppercase border border-slate-800 hover:border-amber-400 active:scale-95 transition-all cursor-pointer">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== EMOJI QUIZ ===== */}
      {gameType === 'emoji-quiz' && (
        <div className="text-center py-4 space-y-6">
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-900 max-w-sm mx-auto">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-3">Bu emojining inglizchasi nima?</p>
            <div className="text-8xl my-4">{emojiItem.emoji}</div>
            <p className="text-slate-400 text-xs">(O'zbekcha: <span className="text-amber-400 font-bold">{emojiItem.uz}</span>)</p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {emojiOptions.map(opt => (
              <button key={opt} onClick={() => { if (opt === emojiItem.en) addScore(3); else wrongAnswer(); }} className="py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-white font-extrabold text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== SYNONYM FIND ===== */}
      {gameType === 'synonym-find' && (
        <div className="text-center py-4 space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-900 max-w-xl mx-auto">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Ushbu so'zning sinonimini toping:</p>
            <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase">{synonymGroup.word}</h3>
            <p className="text-slate-400 text-xs mt-2">(O'zbekcha: <span className="text-amber-400 font-bold">{synonymGroup.uz}</span>)</p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {synonymOptions.map(opt => (
              <button key={opt} onClick={() => { if (synonymGroup.synonyms.includes(opt)) addScore(3); else wrongAnswer(); }} className="py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500 text-white font-extrabold text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== DEFINITION QUIZ ===== */}
      {gameType === 'definition-quiz' && (
        <div className="text-center py-4 space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-900 max-w-2xl mx-auto">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-3">Bu ta'rifga mos so'zni toping:</p>
            <p className="text-base text-white font-semibold italic leading-relaxed">"{defItem.definition}"</p>
            <p className="text-xs text-amber-400 mt-2">({defItem.uz})</p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {defItem.options.map(opt => (
              <button key={opt} onClick={() => { if (opt === defItem.word) addScore(5); else wrongAnswer(); }} className="py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-white font-extrabold text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== WORD SCRAMBLE ===== */}
      {gameType === 'word-scramble' && (
        <div className="text-center py-4 space-y-6">
          <div>
            <span className="text-xs text-slate-500 uppercase font-black">Aralashgan harflarni to'g'ri joylashtiring:</span>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">{currentWord.uz}</h3>
          </div>
          <div className="flex justify-center gap-2 py-3 bg-slate-900/30 rounded-2xl px-4 border border-slate-900 min-h-[60px] items-center">
            {scrambleBuilt.length === 0 ? <span className="text-slate-500 text-sm italic">Harflarni bosing...</span> :
              scrambleBuilt.map((c, i) => (
                <div key={i} className="w-10 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-bold text-lg uppercase flex items-center justify-center">{c}</div>
              ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {scrambledLetters.map(item => (
              <button key={item.id} onClick={() => tapScramble(item)} className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 text-white font-extrabold text-base uppercase transition-all active:scale-90 cursor-pointer">
                {item.val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== LISTENING QUIZ ===== */}
      {gameType === 'listening-quiz' && (
        <div className="text-center py-4 space-y-6">
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-900 max-w-sm mx-auto">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-4">Ovozni eshiting va inglizcha so'zni toping:</p>
            <button onClick={() => playTTS(listenWord)} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 mx-auto active:scale-95 transition-all shadow-xl cursor-pointer">
              <Volume2 className="w-6 h-6" />
              <span>ESHITING 🎧</span>
            </button>
            <p className="text-xs text-slate-500 mt-3">Tugmani bosing va diqqat bilan eshiting!</p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {listeningOptions.map(opt => (
              <button key={opt} onClick={() => { if (opt === listenWord) addScore(5); else wrongAnswer(); }} className="py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-white font-extrabold text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== VOCAB SPEED ===== */}
      {gameType === 'vocab-speed' && (
        <div className="text-center py-4 space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className={`text-4xl font-black font-mono ${speedTimer <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {speedTimer}s
            </div>
            <div className="text-lg font-bold text-emerald-400">{speedCount} ta to'g'ri</div>
          </div>
          {!speedActive && speedTimer > 0 && (
            <button onClick={() => { setSpeedActive(true); setSpeedCount(0); setSpeedTimer(60); }} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-4 px-8 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-xl text-sm uppercase">
              ⚡ BOSHLASH
            </button>
          )}
          {speedTimer === 0 && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-2xl font-black text-amber-400">Vaqt tugadi!</h3>
              <p className="text-slate-300 mt-2">{speedCount} ta so'zni to'g'ri tarjima qildingiz!</p>
              <button onClick={() => { setSpeedTimer(60); setSpeedCount(0); setSpeedActive(false); }} className="mt-4 bg-cyan-500 text-slate-950 font-black py-2 px-6 rounded-xl cursor-pointer">Qayta boshlash</button>
            </div>
          )}
          {speedActive && speedTimer > 0 && (
            <>
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase font-black block mb-2">O'ZBEKCHASINI TOPING:</span>
                <h3 className="text-3xl font-black text-amber-400">{currentWord.uz}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                {speedOptions.map(opt => (
                  <button key={opt} onClick={() => handleSpeedAnswer(opt)} className={`py-4 border rounded-2xl font-extrabold text-sm uppercase transition-all cursor-pointer active:scale-95 ${feedback === 'wrong' ? 'border-rose-500 text-rose-400' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-emerald-500 text-white'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== LETTER HINT ===== */}
      {gameType === 'letter-hint' && (
        <div className="text-center py-4 space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-900 max-w-xl mx-auto">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-3">Faqat birinchi harf ko'rinadi – so'zni toping!</p>
            <p className="text-amber-400 text-xs mb-2">O'zbekcha: <span className="font-bold">{hintUz}</span></p>
            <div className="flex justify-center gap-2">
              {hintWord.split('').map((char, i) => (
                <div key={i} className={`w-10 h-12 rounded-xl border flex items-center justify-center font-black text-lg uppercase ${i === 0 ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                  {i === 0 ? char : '_'}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">So'z uzunligi: <span className="text-white font-bold">{hintWord.length} harf</span></p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {hintOptions.map(opt => (
              <button key={opt} onClick={() => { if (opt === hintWord) addScore(5); else wrongAnswer(); }} className="py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-white font-extrabold text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== GRAMMAR CHOOSE ===== */}
      {gameType === 'grammar-choose' && (
        <div className="text-center py-4 space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-900 max-w-2xl mx-auto space-y-3">
            <p className="text-[10px] text-slate-500 uppercase font-black">To'g'ri grammatik shaklni tanlang:</p>
            <p className="text-xs text-amber-400 italic">{grammarItem.uz}</p>
            <p className="text-xl md:text-2xl font-black text-white leading-normal">
              {grammarItem.sentence.split('___').map((part, i, arr) => (
                <span key={i}>{part}{i < arr.length - 1 && <span className="text-amber-400 border-b-2 border-dashed border-amber-400 px-2">_____</span>}</span>
              ))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {grammarItem.options.map(opt => (
              <button key={opt} onClick={() => { if (opt === grammarItem.correct) addScore(5); else wrongAnswer(); }} className="py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500 text-white font-extrabold text-sm rounded-2xl transition-all cursor-pointer active:scale-95">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== WORD BUILDER ===== */}
      {gameType === 'word-builder' && (
        <div className="text-center py-4 space-y-6">
          <div>
            <span className="text-xs text-slate-500 uppercase font-black">Syllablardan so'z qurinig:</span>
            <h3 className="text-3xl font-black text-indigo-400 mt-1">{builderUz}</h3>
          </div>
          <div className="flex justify-center gap-3 py-4 bg-slate-900/30 rounded-2xl px-6 border border-slate-900 min-h-[60px] items-center">
            {builderBuilt.length === 0 ? <span className="text-slate-500 italic">Syllablarni bosing...</span> :
              builderBuilt.map((s, i) => (
                <div key={i} className="h-12 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500 text-indigo-300 font-bold text-lg uppercase flex items-center justify-center">{s}</div>
              ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {builderSyllables.map(item => (
              <button key={item.id} onClick={() => tapBuilder(item)} className="h-14 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 hover:border-indigo-500 text-white font-extrabold text-base uppercase transition-all active:scale-90 cursor-pointer shadow-lg">
                {item.val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== FLASHCARD SOLO ===== */}
      {gameType === 'flashcard-solo' && flashItems.length > 0 && (
        <div className="text-center py-4 space-y-6">
          <div className="text-xs text-slate-400 font-bold">{flashIndex + 1} / {flashItems.length}</div>
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-10 max-w-sm mx-auto cursor-pointer shadow-2xl hover:shadow-cyan-500/10 transition-all active:scale-98 min-h-[160px] flex flex-col items-center justify-center"
            onClick={() => setFlashRevealed(!flashRevealed)}
          >
            {!flashRevealed ? (
              <>
                <p className="text-[10px] text-slate-500 uppercase font-black mb-3">O'zbekchasi:</p>
                <h3 className="text-3xl font-black text-amber-400">{flashItems[flashIndex]?.uz}</h3>
                <p className="text-xs text-slate-500 mt-4">Inglizchasi uchun bosing 👆</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-slate-500 uppercase font-black mb-3">Inglizchasi:</p>
                <h3 className="text-3xl font-black text-cyan-400">{flashItems[flashIndex]?.en}</h3>
                <button onClick={e => { e.stopPropagation(); playTTS(flashItems[flashIndex]?.en || ''); }} className="mt-3 text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1">
                  <Volume2 className="w-4 h-4" /> Talaffuz
                </button>
              </>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { if (flashRevealed) { sound.playIncorrect(); setFlashIndex(i => Math.min(flashItems.length - 1, i + 1)); setFlashRevealed(false); } }}
              className="py-3 px-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm rounded-2xl cursor-pointer hover:bg-rose-500/20 transition-all"
              disabled={!flashRevealed}
            >
              Bilmadim 😕
            </button>
            <button
              onClick={() => { if (flashRevealed) { addScore(2); setFlashIndex(i => Math.min(flashItems.length - 1, i + 1)); setFlashRevealed(false); } }}
              className="py-3 px-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm rounded-2xl cursor-pointer hover:bg-emerald-500/20 transition-all"
              disabled={!flashRevealed}
            >
              Bildim! ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
