import React, { useState, useEffect, useRef } from 'react';
import { WordPair, Team } from '../types';
import { sound } from '../utils/audio';
import { standardCategories } from '../utils/data';
import { Award, Timer, Sparkles, RefreshCw, PenTool, Trash2, Eraser } from 'lucide-react';
import TugOfWar from './TugOfWar';

// ---- Vocabulary Bingo data ----
const BINGO_WORDS: WordPair[] = [
  {uz:'Olma',en:'Apple'},{uz:'Kitob',en:'Book'},{uz:'Mushuk',en:'Cat'},{uz:'Kuchuk',en:'Dog'},
  {uz:'Fil',en:'Elephant'},{uz:'Baliq',en:'Fish'},{uz:'Oltin',en:'Gold'},{uz:'Uy',en:'House'},
  {uz:'Orol',en:'Island'},{uz:'Kema',en:'Ship'},{uz:'Kalit',en:'Key'},{uz:'Chiroq',en:'Lamp'},
  {uz:'Oy',en:'Moon'},{uz:'Ismaloq',en:'Spinach'},{uz:'Olmaxon',en:'Squirrel'},{uz:'Daraxt',en:'Tree'},
  {uz:'Soyabon',en:'Umbrella'},{uz:'Ko\'klamor',en:'Violet'},{uz:'Ariqcha',en:'Stream'},{uz:'Xachir',en:'Mule'},
  {uz:'Anjir',en:'Fig'},{uz:'Nok',en:'Pear'},{uz:'Gilos',en:'Cherry'},{uz:'Quyon',en:'Rabbit'},
  {uz:'Kaptar',en:'Pigeon'},
];

// ---- English Taboo data ----
const TABOO_CARDS: { word: string; uz: string; forbidden: string[] }[] = [
  { word:'Computer', uz:'Kompyuter', forbidden:['Screen','Mouse','Keyboard','Tech','Internet'] },
  { word:'Teacher', uz:'O\'qituvchi', forbidden:['School','Class','Lesson','Board','Student'] },
  { word:'Elephant', uz:'Fil', forbidden:['Big','Animal','Trunk','Africa','Zoo'] },
  { word:'Birthday', uz:'Tug\'ilgan kun', forbidden:['Party','Cake','Gift','Wish','Age'] },
  { word:'Hospital', uz:'Shifoxona', forbidden:['Doctor','Sick','Nurse','Medicine','Bed'] },
  { word:'Mountain', uz:'Tog\'', forbidden:['High','Snow','Climb','Peak','Rock'] },
  { word:'Library', uz:'Kutubxona', forbidden:['Book','Read','Quiet','Shelf','Study'] },
  { word:'Football', uz:'Futbol', forbidden:['Ball','Goal','Player','Team','Match'] },
  { word:'Rainbow', uz:'Kamalak', forbidden:['Color','Rain','Sky','Seven','Sun'] },
  { word:'Kitchen', uz:'Oshxona', forbidden:['Cook','Food','Oven','Stove','Plate'] },
];

// ---- Word Pyramid data ----
const PYRAMID_CLUES: { clue: string; answer: string; uz: string; length: number }[][] = [
  [
    { clue:'Tekin', answer:'FREE', uz:'Free (Bepul)', length:4 },
    { clue:'Meva (rezavor)', answer:'BERRY', uz:'Berry', length:5 },
    { clue:'Tabiat (ekologiya)', answer:'NATURE', uz:'Nature (tabiat)', length:6 },
    { clue:'Zamonaviy texnologiya', answer:'MACHINE', uz:'Machine (mashina)', length:7 },
    { clue:'Inqilob (o\'zgarish)', answer:'MOVEMENT', uz:'Movement (harakat)', length:8 },
  ],
  [
    { clue:'Ko\'z yoshi', answer:'TEAR', uz:'Tear (yosh)', length:4 },
    { clue:'Yulduz (osmon)', answer:'STARS', uz:'Stars (yulduzlar)', length:5 },
    { clue:'Bog\'', answer:'GARDEN', uz:'Garden (bog\')', length:6 },
    { clue:'Erkinlik', answer:'FREEDOM', uz:'Freedom (erkinlik)', length:7 },
    { clue:'Zanjirband', answer:'PRISONER', uz:'Prisoner (mahbus)', length:8 },
  ],
];

// ---- Story Builder cards ----
const STORY_WORDS: string[][] = [
  ['Once','upon','a','time','there','was','a','brave','knight'],
  ['In','the','morning','a','small','cat','found','a','magic','box'],
  ['The','children','were','playing','in','the','garden','when','suddenly'],
  ['Every','summer','the','family','traveled','to','a','beautiful','mountain'],
  ['One','day','a','young','girl','discovered','an','old','book'],
];

// ---- Grammar Team sentences ----
const GRAMMAR_SENTENCES: { sentence: string; isCorrect: boolean; fixed?: string }[] = [
  { sentence:'She go to school every day.', isCorrect:false, fixed:'She goes to school every day.' },
  { sentence:'They are playing football.', isCorrect:true },
  { sentence:'I buyed a new phone.', isCorrect:false, fixed:'I bought a new phone.' },
  { sentence:'He doesn\'t like coffee.', isCorrect:true },
  { sentence:'We was at the park.', isCorrect:false, fixed:'We were at the park.' },
  { sentence:'The children ran fast.', isCorrect:true },
  { sentence:'She have a cat.', isCorrect:false, fixed:'She has a cat.' },
  { sentence:'I am happy today.', isCorrect:true },
  { sentence:'They goes to bed early.', isCorrect:false, fixed:'They go to bed early.' },
  { sentence:'He is reading a book.', isCorrect:true },
];

interface TeamGamesProps {
  gameType: string;
  teamLeft: Team;
  teamRight: Team;
  wordList: WordPair[];
  maxScore: number;
  onGameWin: (winner: Team) => void;
  onUpdateScore: (leftScore: number, rightScore: number) => void;
}

export default function TeamGames({
  gameType,
  teamLeft,
  teamRight,
  wordList,
  maxScore,
  onGameWin,
  onUpdateScore
}: TeamGamesProps) {
  const [currentLeftScore, setCurrentLeftScore] = useState(0);
  const [currentRightScore, setCurrentRightScore] = useState(0);
  
  // Turn indicator
  const [isLeftTurn, setIsLeftTurn] = useState(true);

  const normalizeGameType = (id: string): string => {
    if (id === 'category-quiz') return 'team-quiz';
    if (id === 'memory-rush') return 'memory-match';
    if (id === 'picture-quest') return 'pictionary';
    if (id === 'vocab-relay') return 'hot-seat';
    if (id === 'speed-sort') return 'category-sort';
    return id;
  };

  const effectiveGameType = normalizeGameType(gameType);

  // Common interactive state
  const [currentWord, setCurrentWord] = useState<WordPair>({ uz: 'Olma', en: 'Apple' });

  // 1. Team Quiz
  const [quizOptions, setQuizOptions] = useState<string[]>([]);

  // 2. Category Sort state
  const [activeSortWord, setActiveSortWord] = useState<WordPair>({ uz: 'Kuchuk', en: 'Dog' });
  const [sortLeftCategory, setSortLeftCategory] = useState('Hayvonlar');
  const [sortRightCategory, setSortRightCategory] = useState('Meva va Sabzavotlar');

  // 3. Hot Seat Timer
  const [hotTimer, setHotTimer] = useState(60);
  const [hotActive, setHotActive] = useState(false);
  const hotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 4. Memory Match Card Grid state
  interface Card {
    id: number;
    text: string;
    pairId: number;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  // 5. Drawing Canvas setup for Pictionary
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasColor, setCanvasColor] = useState('#3b82f6');
  const [canvasWidth, setCanvasWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // NEW GAMES STATE

  // Vocabulary Bingo
  const [bingoGrid, setBingoGrid] = useState<(WordPair | null)[]>(Array(25).fill(null));
  const [bingoMarked, setBingoMarked] = useState<boolean[]>(Array(25).fill(false));
  const [bingoCalledWord, setBingoCalledWord] = useState<WordPair | null>(null);
  const [bingoWinner, setBingoWinner] = useState<string | null>(null);

  // English Taboo
  const [tabooCard, setTabooCard] = useState(TABOO_CARDS[0]);
  const [tabooTimer, setTabooTimer] = useState(60);
  const [tabooActive, setTabooActive] = useState(false);
  const tabooRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Team Spelling
  const [spellingWord, setSpellingWord] = useState<WordPair>({ uz: 'Olma', en: 'apple' });
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingResult, setSpellingResult] = useState<'correct' | 'wrong' | null>(null);

  // Word Pyramid
  const [pyramidSet, setPyramidSet] = useState(PYRAMID_CLUES[0]);
  const [pyramidIndex, setPyramidIndex] = useState(0);
  const [pyramidInput, setPyramidInput] = useState('');
  const [pyramidResult, setPyramidResult] = useState<'correct' | 'wrong' | null>(null);

  // Story Builder
  const [storyWords, setStoryWords] = useState<string[]>(STORY_WORDS[0]);
  const [storyBuilt, setStoryBuilt] = useState<string[]>([]);
  const [storyRemaining, setStoryRemaining] = useState<string[]>([]);

  // Word Wheel
  const [wheelCenter, setWheelCenter] = useState('A');
  const [wheelLetters, setWheelLetters] = useState<string[]>([]);
  const [wheelInput, setWheelInput] = useState('');
  const [wheelFound, setWheelFound] = useState<string[]>([]);

  // Grammar Team
  const [grammarIdx, setGrammarIdx] = useState(0);
  const [grammarAns, setGrammarAns] = useState<'correct' | 'wrong' | null>(null);

  // Password Game
  const [pwdWord, setPwdWord] = useState<WordPair>({ uz: 'Olma', en: 'Apple' });
  const [pwdPhase, setPwdPhase] = useState<'clue'|'guess'|'result'>('clue');
  const [pwdOptions, setPwdOptions] = useState<string[]>([]);
  const [pwdResult, setPwdResult] = useState<'correct'|'wrong'|null>(null);
  const [pwdTeam, setPwdTeam] = useState<'left'|'right'>('left');

  // 6. Word Chain Relay state
  const [chainHistory, setChainHistory] = useState<string[]>(['apple']);
  const [chainInput, setChainInput] = useState('');
  const [chainError, setChainError] = useState('');
  const [chainChecking, setChainChecking] = useState(false);
  const [lastWordDefinition, setLastWordDefinition] = useState<string>('');
  const [lastWordPartofSpeech, setLastWordPartofSpeech] = useState<string>('');
  const [chainTimer, setChainTimer] = useState<number>(30);
  const [bonusNotification, setBonusNotification] = useState<string>('');

  // Generate next round logic
  const refreshRound = () => {
    if (!wordList || wordList.length === 0) return;
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(word);

    // Initializer per sub-game
    if (effectiveGameType === 'team-quiz') {
      const distractors = wordList
        .filter(w => w.en !== word.en)
        .map(w => w.en);
      const chosenDist = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
      setQuizOptions([word.en, ...chosenDist].sort(() => Math.random() - 0.5));
    }

    if (effectiveGameType === 'category-sort') {
      // Choose words belonging specifically to Animals or Fruits
      const animals = standardCategories.find(c => c.tag === 'animals')?.words || [];
      const fruits = standardCategories.find(c => c.tag === 'fruits')?.words || [];
      const combined = [...animals, ...fruits];
      const selected = combined[Math.floor(Math.random() * combined.length)] || word;
      setActiveSortWord(selected);
    }

    if (effectiveGameType === 'hot-seat') {
      setHotTimer(60);
      setHotActive(false);
      if (hotIntervalRef.current) clearInterval(hotIntervalRef.current);
    }

    if (effectiveGameType === 'pictionary') {
      clearCanvas();
    }

    // --- Vocabulary Bingo init ---
    if (effectiveGameType === 'vocabulary-bingo') {
      const shuffled = [...BINGO_WORDS].sort(() => Math.random() - 0.5).slice(0, 25);
      setBingoGrid(shuffled);
      setBingoMarked(Array(25).fill(false));
      setBingoCalledWord(null);
      setBingoWinner(null);
    }

    // --- Taboo ---
    if (effectiveGameType === 'english-taboo') {
      setTabooCard(TABOO_CARDS[Math.floor(Math.random() * TABOO_CARDS.length)]);
      setTabooTimer(60);
      setTabooActive(false);
      if (tabooRef.current) clearInterval(tabooRef.current);
    }

    // --- Team Spelling ---
    if (effectiveGameType === 'team-spelling') {
      const w = wordList.length > 0 ? wordList[Math.floor(Math.random() * wordList.length)] : { uz: 'Olma', en: 'apple' };
      setSpellingWord(w);
      setSpellingInput('');
      setSpellingResult(null);
    }

    // --- Word Pyramid ---
    if (effectiveGameType === 'word-pyramid') {
      setPyramidSet(PYRAMID_CLUES[Math.floor(Math.random() * PYRAMID_CLUES.length)]);
      setPyramidIndex(0);
      setPyramidInput('');
      setPyramidResult(null);
    }

    // --- Story Builder ---
    if (effectiveGameType === 'story-builder') {
      const picked = STORY_WORDS[Math.floor(Math.random() * STORY_WORDS.length)];
      setStoryWords(picked);
      setStoryBuilt([]);
      setStoryRemaining([...picked].sort(() => Math.random() - 0.5));
    }

    // --- Word Wheel ---
    if (effectiveGameType === 'word-wheel') {
      const vowels = 'AEIOU';
      const center = vowels[Math.floor(Math.random() * vowels.length)];
      const consonants = 'BCDFGHLMNPRSTW';
      const outer: string[] = [];
      while (outer.length < 8) {
        const l = consonants[Math.floor(Math.random() * consonants.length)];
        if (!outer.includes(l)) outer.push(l);
      }
      setWheelCenter(center);
      setWheelLetters(outer);
      setWheelInput('');
      setWheelFound([]);
    }

    // --- Grammar Team ---
    if (effectiveGameType === 'grammar-team') {
      setGrammarIdx(Math.floor(Math.random() * GRAMMAR_SENTENCES.length));
      setGrammarAns(null);
    }

    // --- Password Game ---
    if (gameType === 'password-game') {
      const w = wordList[Math.floor(Math.random() * wordList.length)];
      setPwdWord(w);
      setPwdPhase('clue');
      setPwdResult(null);
      const others = wordList.filter(x => x.en !== w.en).map(x => x.en).sort(() => Math.random() - 0.5).slice(0, 2);
      setPwdOptions([w.en, ...others].sort(() => Math.random() - 0.5));
    }

    if (effectiveGameType === 'memory-match') {
      // Pick 6 random pairs and double them into 12 cards (EN & UZ)
      const count = 6;
      const selectedPairs = [...wordList].sort(() => Math.random() - 0.5).slice(0, count);
      
      const cardList: Card[] = [];
      selectedPairs.forEach((pair, index) => {
        cardList.push({
          id: index * 2,
          text: pair.en,
          pairId: index,
          isFlipped: false,
          isMatched: false
        });
        cardList.push({
          id: index * 2 + 1,
          text: pair.uz,
          pairId: index,
          isFlipped: false,
          isMatched: false
        });
      });

      setCards(cardList.sort(() => Math.random() - 0.5));
      setSelectedCards([]);
    }
  };

  useEffect(() => {
    refreshRound();
    return () => {
      if (hotIntervalRef.current) clearInterval(hotIntervalRef.current);
    };
  }, [gameType, wordList]);

  // Word Chain Timer reset on turn or history changes
  useEffect(() => {
    if (effectiveGameType !== 'word-chain') return;
    setChainTimer(30);
  }, [isLeftTurn, chainHistory, gameType]);

  // Word Chain countdown countdown logic
  useEffect(() => {
    if (effectiveGameType !== 'word-chain') return;

    const timer = setInterval(() => {
      setChainTimer(prev => {
        if (prev <= 1) {
          sound.playIncorrect();
          setChainError(`Vaqt tugadi! Navbat keyingi jamoaga o'tdi.`);
          setIsLeftTurn(!isLeftTurn);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameType, isLeftTurn]);

  // Text-to-speech for english word pronunciation
  const playWordAudio = (word: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.85; // slightly slower for better learning
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis error", err);
      }
    }
  };

  // Scores update helper
  const addScoreLeft = (points: number) => {
    const nextScore = currentLeftScore + points;
    setCurrentLeftScore(nextScore);
    onUpdateScore(nextScore, currentRightScore);

    if (nextScore >= maxScore) {
      setTimeout(() => onGameWin({ ...teamLeft, score: nextScore }), 600);
    } else {
      setIsLeftTurn(false);
      setTimeout(() => refreshRound(), 1000);
    }
  };

  const addScoreRight = (points: number) => {
    const nextScore = currentRightScore + points;
    setCurrentRightScore(nextScore);
    onUpdateScore(currentLeftScore, nextScore);

    if (nextScore >= maxScore) {
      setTimeout(() => onGameWin({ ...teamRight, score: nextScore }), 600);
    } else {
      setIsLeftTurn(true);
      setTimeout(() => refreshRound(), 1000);
    }
  };

  // Turn alternator
  const passTurn = () => {
    sound.playTap();
    setIsLeftTurn(!isLeftTurn);
  };

  // 1. Double Quiz clicking
  const answerQuiz = (option: string) => {
    if (option === currentWord.en) {
      sound.playCorrect();
      if (isLeftTurn) {
        addScoreLeft(1);
      } else {
        addScoreRight(1);
      }
    } else {
      sound.playIncorrect();
      // Pass turn to another team
      setIsLeftTurn(!isLeftTurn);
    }
  };

  // 2. Sorting dragging or click categories
  const handleSortCategory = (categorySelected: string) => {
    // Check if word belongs to categorised tag
    const animals = standardCategories.find(c => c.tag === 'animals')?.words || [];
    const isAnimal = animals.some(w => w.en === activeSortWord.en);
    const correctCategory = isAnimal ? 'Hayvonlar' : 'Meva va Sabzavotlar';

    if (categorySelected === correctCategory) {
      sound.playCorrect();
      if (isLeftTurn) {
        addScoreLeft(1);
      } else {
        addScoreRight(1);
      }
    } else {
      sound.playIncorrect();
      setIsLeftTurn(!isLeftTurn);
    }
  };

  // 3. Hot Seat timer controls
  const toggleHotTimer = () => {
    sound.playTap();
    if (hotActive) {
      setHotActive(false);
      if (hotIntervalRef.current) clearInterval(hotIntervalRef.current);
    } else {
      setHotActive(true);
      hotIntervalRef.current = setInterval(() => {
        setHotTimer((prev) => {
          if (prev <= 1) {
            sound.playIncorrect();
            setHotActive(false);
            if (hotIntervalRef.current) clearInterval(hotIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const hotCorrect = () => {
    sound.playCorrect();
    if (isLeftTurn) {
      addScoreLeft(1);
    } else {
      addScoreRight(1);
    }
  };

  // 4. Word Chain actions with spelling dictionary validation and turn switching
  const submitChainWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chainChecking) return;

    const input = chainInput.trim().toLowerCase();
    if (!input) return;

    // Strict regex validation for English alphabetic words (no spaces, numbers, or special symbols like Uzbek apostrophes)
    const englishRegex = /^[a-z]+$/;
    if (!englishRegex.test(input)) {
      sound.playIncorrect();
      setChainError("Xato! Faqat inglizcha harflarni kiriting (maxsus belgilar va o'zbekcha harflar mumkin emas).");
      return;
    }

    if (input.length < 2) {
      sound.playIncorrect();
      setChainError("Xato! Inglizcha so'z kamida 2 ta harfdan iborat bo'lishi kerak!");
      return;
    }

    // Check last word letter matches first letter of input
    const lastWord = chainHistory[chainHistory.length - 1];
    const expectedLetter = lastWord[lastWord.length - 1].toLowerCase();

    if (input[0] !== expectedLetter) {
      sound.playIncorrect();
      setChainError(`Xato! So'z "${expectedLetter.toUpperCase()}" harfi bilan boshlanishi kerak!`);
      return;
    }

    if (chainHistory.includes(input)) {
      sound.playIncorrect();
      setChainError("Xato! Bu so'z oldin ishlatilgan.");
      return;
    }

    // Fast quick path for widely used English terms
    const localWords = new Set([
      'apple', 'apricot', 'banana', 'orange', 'grape', 'lemon', 'lime', 'peach', 'pear', 'plum',
      'cherry', 'berry', 'melon', 'mango', 'papaya', 'coconut', 'kiwi', 'fig', 'date', 
      'cat', 'dog', 'cow', 'horse', 'sheep', 'goat', 'pig', 'duck', 'chicken', 'hen', 'rooster',
      'bird', 'fish', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'rabbit', 'mouse', 'rat',
      'elephant', 'giraffe', 'zebra', 'monkey', 'panda', 'koala', 'kangaroo', 'snake', 'frog',
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white',
      'gray', 'silver', 'gold', 'book', 'pen', 'pencil', 'notebook', 'paper', 'desk', 'chair',
      'table', 'bag', 'school', 'class', 'teacher', 'student', 'lesson', 'exam', 'grade',
      'house', 'home', 'room', 'door', 'window', 'wall', 'floor', 'roof', 'garden', 'backyard',
      'kitchen', 'bedroom', 'bathroom', 'livingroom', 'car', 'bike', 'bus', 'train', 'plane',
      'boat', 'ship', 'truck', 'taxi', 'road', 'street', 'city', 'town', 'village', 'country',
      'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind', 'storm', 'weather',
      'water', 'fire', 'earth', 'air', 'stone', 'rock', 'sand', 'dirt', 'grass', 'flower',
      'tree', 'leaf', 'plant', 'seed', 'root', 'branch', 'wood', 'forest', 'jungle', 'desert',
      'ocean', 'sea', 'lake', 'river', 'pond', 'stream', 'wave', 'beach', 'sand', 'shell',
      'man', 'woman', 'child', 'boy', 'girl', 'baby', 'father', 'mother', 'brother', 'sister',
      'son', 'daughter', 'uncle', 'aunt', 'cousin', 'nephew', 'niece', 'friend', 'neighbor',
      'head', 'face', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'tongue', 'hair', 'neck',
      'shoulder', 'arm', 'elbow', 'hand', 'finger', 'chest', 'back', 'stomach', 'leg', 'knee',
      'foot', 'toe', 'skin', 'bone', 'blood', 'heart', 'brain', 'mind', 'body', 'health',
      'food', 'drink', 'bread', 'butter', 'cheese', 'milk', 'water', 'juice', 'tea', 'coffee',
      'rice', 'meat', 'beef', 'pork', 'chicken', 'fish', 'egg', 'soup', 'salad', 'fruit',
      'vegetable', 'potato', 'tomato', 'onion', 'garlic', 'carrot', 'day', 'night', 'morning',
      'afternoon', 'evening', 'week', 'month', 'year', 'monday', 'tuesday', 'wednesday',
      'friday', 'saturday', 'sunday', 'spring', 'summer', 'autumn', 'fall', 'winter',
      'happy', 'sad', 'angry', 'scared', 'tired', 'sleepy', 'hungry', 'thirsty', 'hot', 'cold',
      'big', 'small', 'large', 'tiny', 'tall', 'short', 'long', 'wide', 'narrow', 'deep',
      'high', 'low', 'near', 'far', 'good', 'bad', 'great', 'fine', 'nice', 'kind',
      'smart', 'clever', 'wise', 'funny', 'boring', 'interesting', 'fast', 'slow', 'quick',
      'heavy', 'light', 'hard', 'soft', 'clean', 'dirty', 'new', 'old', 'young', 'ancient',
      'yes', 'no', 'maybe', 'always', 'never', 'sometimes', 'often', 'usually',
      'and', 'but', 'or', 'so', 'because', 'although', 'if', 'when', 'where', 'why',
      'how', 'who', 'what', 'which', 'whose', 'whom', 'there', 'here',
      'play', 'work', 'study', 'read', 'write', 'learn', 'teach', 'sing', 'dance', 'draw',
      'paint', 'cook', 'bake', 'eat', 'drink', 'swim', 'run', 'walk', 'jump', 'fly',
      'ride', 'drive', 'go', 'come', 'stay', 'leave', 'arrive', 'depart', 'start', 'stop',
      'begin', 'end', 'open', 'close', 'show', 'hide', 'seek', 'find', 'lose', 'win',
      'fail', 'pass', 'try', 'do', 'make', 'build', 'create', 'destroy', 'break', 'fix',
      'buy', 'sell', 'pay', 'spend', 'save', 'give', 'take', 'bring', 'carry', 'send',
      'receive', 'get', 'keep', 'hold', 'touch', 'feel', 'think', 'believe', 'know',
      'remember', 'forget', 'love', 'hate', 'like', 'dislike', 'hope', 'wish', 'want',
      'need', 'must', 'should', 'can', 'may', 'will', 'say', 'tell', 'talk', 'speak',
      'listen', 'hear', 'see', 'look', 'watch', 'gaze', 'stare', 'glance'
    ]);

    // Feed current category words as dynamically recognized terms (ONLY english text matches)
    if (wordList) {
      wordList.forEach(w => {
        localWords.add(w.en.trim().toLowerCase());
      });
    }

    const finalizeWordChainSuccess = (awardPoints: number) => {
      sound.playCorrect();
      setChainError('');
      setChainHistory([...chainHistory, input]);
      setChainInput('');
      playWordAudio(input);

      // Add points to active team according to complexity logic
      if (isLeftTurn) {
        addScoreLeft(awardPoints);
      } else {
        addScoreRight(awardPoints);
      }

      // Automatically switch side turns so both teams take turns!
      setIsLeftTurn(!isLeftTurn);
    };

    // Calculate length-based points boost reward for student typing
    const wordLength = input.length;
    let computedPoints = 1;
    let bonusTextMsg = '';

    if (wordLength >= 9) {
      computedPoints = 3;
      bonusTextMsg = `Super Bonus! "${input.toUpperCase()}" juda uzun so'z (+3 ball!) 🔥`;
    } else if (wordLength >= 6) {
      computedPoints = 2;
      bonusTextMsg = `Bonus! "${input.toUpperCase()}" uzun so'z (+2 ball!) ⭐️`;
    } else {
      computedPoints = 1;
      bonusTextMsg = `To'g'ri! "${input.toUpperCase()}" (+1 ball!) ✨`;
    }

    // Instant approve if found in common offline vocab or teacher definitions
    if (localWords.has(input)) {
      setLastWordPartofSpeech('common vocabulary');
      setLastWordDefinition('Bu dars lug\'atidagi yoki keng qo\'llaniladigan inglizcha so\'z!');
      setBonusNotification(bonusTextMsg);
      setTimeout(() => setBonusNotification(''), 4000);
      finalizeWordChainSuccess(computedPoints);
      return;
    }

    // Query standard free dictionary API for custom entries (strict validation)
    setChainChecking(true);
    setChainError('');
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(input)}`);
      if (!response.ok) {
        throw new Error('Not found');
      }
      const dataJson = await response.json();
      if (!dataJson || !Array.isArray(dataJson) || dataJson.length === 0) {
        throw new Error('Not valid');
      }

      try {
        const meaning = dataJson[0]?.meanings?.[0];
        const partOfSpeech = meaning?.partOfSpeech || '';
        const definition = meaning?.definitions?.[0]?.definition || '';
        setLastWordPartofSpeech(partOfSpeech);
        setLastWordDefinition(definition);
      } catch (err) {
        setLastWordPartofSpeech('noun/verb');
        setLastWordDefinition('Verified standard English dictionary word!');
      }

      setBonusNotification(bonusTextMsg);
      setTimeout(() => setBonusNotification(''), 4000);
      finalizeWordChainSuccess(computedPoints);
    } catch (err) {
      sound.playIncorrect();
      setChainError("Lug'atda yo'q: Bunday inglizcha so'z ingliz tili lug'atidan topilmadi!");
    } finally {
      setChainChecking(false);
    }
  };

  // 5. Memory match card selection
  const handleCardClick = (clickedId: number) => {
    if (selectedCards.length >= 2) return;
    const card = cards.find(c => c.id === clickedId);
    if (!card || card.isFlipped || card.isMatched) return;

    sound.playTap();
    
    // Flip card visible
    const updated = cards.map(c => c.id === clickedId ? { ...c, isFlipped: true } : c);
    setCards(updated);

    const nextSelected = [...selectedCards, clickedId];
    setSelectedCards(nextSelected);

    if (nextSelected.length === 2) {
      const first = cards.find(c => c.id === nextSelected[0])!;
      const second = cards.find(c => c.id === nextSelected[1])!;

      if (first.pairId === second.pairId) {
        // MATCH!
        setTimeout(() => {
          sound.playCorrect();
          const matchedList = updated.map(c => 
            c.id === first.id || c.id === second.id ? { ...c, isMatched: true, isFlipped: true } : c
          );
          setCards(matchedList);
          setSelectedCards([]);

          // Give point to active turn team
          if (isLeftTurn) {
            addScoreLeft(2);
          } else {
            addScoreRight(2);
          }
        }, 800);
      } else {
        // NO MATCH! flip back
        setTimeout(() => {
          sound.playIncorrect();
          const flippedBack = updated.map(c => 
            c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c
          );
          setCards(flippedBack);
          setSelectedCards([]);
          setIsLeftTurn(!isLeftTurn); // change turn on miss
        }, 1200);
      }
    }
  };

  // 6. Drawing Canvas Methods for Pictionary
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Correct offset sizing
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = canvasWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isEraser ? '#020617' : canvasColor; // slate base color for erase

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  if (effectiveGameType === 'tug-of-war') {
    return (
      <div className="w-full h-full flex flex-col items-stretch overflow-y-auto select-none bg-slate-950 p-2 md:p-4">
        <TugOfWar
          teamLeft={teamLeft}
          teamRight={teamRight}
          wordList={wordList}
          onGameWin={onGameWin}
          onUpdateScore={onUpdateScore}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-stretch overflow-hidden select-none">
      
      {/* Turn indicator ribbon */}
      <div className="bg-slate-900 border-b border-slate-800 py-3 px-6 flex items-center justify-between text-white flex-shrink-0 relative z-35">
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Navbat:</div>
          <div 
            className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase shadow transition-all flex items-center gap-1.5 border ${
              isLeftTurn 
                ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                : 'bg-red-500/10 border-red-500 text-red-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            {isLeftTurn ? teamLeft.name : teamRight.name} navbati
          </div>
        </div>

        {/* Global info panel according to GameType */}
        <div className="text-center font-bold text-white text-sm md:text-base">
          {effectiveGameType === 'team-quiz' && 'Sinf Jamoaviy Savol-Javob (Team Quiz)'}
          {effectiveGameType === 'category-sort' && 'Guruhlarga Ajratish (Category Sort)'}
          {effectiveGameType === 'word-chain' && 'So\'z Zanjiri (Word Chain Relay)'}
          {effectiveGameType === 'hot-seat' && 'Qaynar Kursi (Hot Seat Timer)'}
          {effectiveGameType === 'pictionary' && 'Doskadagi Rasmlar (Pictionary)'}
          {effectiveGameType === 'memory-match' && 'Xotira Mashg\'uloti (Memory Match)'}
          {effectiveGameType === 'vocabulary-bingo' && 'Lug\'at Bingo (Vocabulary Bingo)'}
          {effectiveGameType === 'english-taboo' && 'Inglizcha Tabu (English Taboo)'}
          {effectiveGameType === 'team-spelling' && 'Jamoaviy Imlo (Team Spelling)'}
          {effectiveGameType === 'word-pyramid' && 'So\'z Piramidasi (Word Pyramid)'}
          {effectiveGameType === 'story-builder' && 'Hikoya Tuzish (Story Builder)'}
          {effectiveGameType === 'word-wheel' && 'So\'z G\'ildiragi (Word Wheel)'}
          {effectiveGameType === 'grammar-team' && 'Jamoaviy Grammatika (Grammar Team)'}
          {gameType === 'password-game' && 'Parol O\'yini 🔑'}
        </div>

        <div>
          <button
            onClick={passTurn}
            className="px-3 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs font-semibold text-slate-300 rounded-lg active:scale-95 transition-all"
          >
            Navbatni o'tkazish
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        
        {/* ============ 1. TEAM QUIZ PLAYGROUND ============ */}
        {effectiveGameType === 'team-quiz' && (
          <div className="max-w-xl mx-auto space-y-6 pt-4 text-center">
            <div className="space-y-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-900">
              <span className="text-[10px] tracking-widest uppercase font-extrabold text-slate-500">Ushbu so'zning tarjimasi toping:</span>
              <h2 className="text-4xl font-black text-amber-400 uppercase tracking-wide">{currentWord.uz}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {quizOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => answerQuiz(opt)}
                  className="py-5 px-3 bg-slate-900 hover:bg-slate-800 font-extrabold text-sm md:text-base text-white hover:text-cyan-400 border border-slate-800 hover:border-cyan-500 rounded-2xl active:scale-95 shadow transition-all cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============ 2. CATEGORY SORT ============ */}
        {effectiveGameType === 'category-sort' && (
          <div className="max-w-2xl mx-auto space-y-6 pt-4">
            
            <div className="text-center space-y-2 bg-slate-900/65 p-6 rounded-2xl border border-slate-900">
              <span className="text-xs text-slate-500 uppercase font-bold">Quyidagi so'zni qaysi guruhga tegishli?</span>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 uppercase">{activeSortWord.uz} ({activeSortWord.en})</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2">
              {/* Animals container bucket */}
              <button
                onClick={() => handleSortCategory('Hayvonlar')}
                className="p-8 rounded-3xl bg-emerald-500/5 border-2 border-emerald-500/30 hover:border-emerald-500 text-center space-y-4 hover:shadow-lg hover:shadow-emerald-500/5 active:scale-98 transition-all cursor-pointer"
              >
                <span className="text-4xl block">🐯</span>
                <h4 className="text-lg font-black text-emerald-400">Hayvonlar (Animals)</h4>
                <p className="text-xs text-slate-500">Maysa yoki sahro jonivorlar guruhiga yo'llang.</p>
              </button>

              {/* Fruits container bucket */}
              <button
                onClick={() => handleSortCategory('Meva va Sabzavotlar')}
                className="p-8 rounded-3xl bg-amber-500/5 border-2 border-amber-500/30 hover:border-amber-500 text-center space-y-4 hover:shadow-lg hover:shadow-amber-500/5 active:scale-98 transition-all cursor-pointer"
              >
                <span className="text-4xl block">🍎</span>
                <h4 className="text-lg font-black text-amber-400">Meva / Sabzavotlar</h4>
                <p className="text-xs text-slate-500">Oziq-ovqat va mazali rezavorlar guruhiga joylang.</p>
              </button>
            </div>
          </div>
        )}

        {/* ============ 3. HOT SEAT MODULE ============ */}
        {effectiveGameType === 'hot-seat' && (
          <div className="max-w-lg mx-auto space-y-6 text-center pt-4">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-900/80 space-y-4">
              
              <div className="flex justify-center items-center gap-2">
                <Timer className="w-5 h-5 text-rose-500" />
                <span className="text-2xl font-mono text-white font-extrabold">{hotTimer} soniya</span>
              </div>

              <div className="py-6 bg-slate-950/90 rounded-xl border border-dashed border-slate-800">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-2">Qarshidagi o'quvchi ko'rmasligi kerak:</span>
                <h2 className="text-4xl font-black text-sky-400 uppercase">{currentWord.en}</h2>
                <span className="text-xs text-slate-400 block mt-2">({currentWord.uz})</span>
              </div>

              <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
                Bitta o'quvchi doskaga teskari o'tiradi. Jamoasi unga bu so'zni inglizcha sinonimlar yoki imo-ishoralar bilan tushuntiradi. Topolsa yashil tugmani bosing!
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={toggleHotTimer}
                className={`flex-1 py-4.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all border ${
                  hotActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 text-white border-slate-800'
                }`}
              >
                {hotActive ? 'Vaqtni To\'xtatish' : 'Vaqtni Boshlash'}
              </button>

              <button
                onClick={hotCorrect}
                className="flex-1 py-4.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 border border-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider"
              >
                To'g'ri topdi (+1 Ball)
              </button>
            </div>
          </div>
        )}

        {/* ============ 4. DRAWING CANVAS (PICTIONARY) ============ */}
        {effectiveGameType === 'pictionary' && (
          <div className="max-w-3xl mx-auto space-y-5 pt-2">
            
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 uppercase font-black">Chizish uchun so'z:</span>
                <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded text-sky-400 font-extrabold text-sm uppercase">
                  {currentWord.en} <span className="font-normal text-slate-400">({currentWord.uz})</span>
                </span>
              </div>

              {/* Design painting controls */}
              <div className="flex items-center gap-2">
                {/* Pencil markers */}
                <button
                  onClick={() => { setIsEraser(false); setCanvasColor('#3b82f6'); }}
                  className={`p-2 rounded-lg border ${!isEraser && canvasColor === '#3b82f6' ? 'bg-blue-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  title="Ko'k qalam"
                >
                  <PenTool className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setIsEraser(false); setCanvasColor('#ef4444'); }}
                  className={`p-2 rounded-lg border ${!isEraser && canvasColor === '#ef4444' ? 'bg-red-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  title="Qizil qalam"
                >
                  <PenTool className="w-4 h-4 text-red-400" />
                </button>
                <button
                  onClick={() => { setIsEraser(false); setCanvasColor('#10b981'); }}
                  className={`p-2 rounded-lg border ${!isEraser && canvasColor === '#10b981' ? 'bg-emerald-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  title="Yashil qalam"
                >
                  <PenTool className="w-4 h-4 text-emerald-400" />
                </button>

                <div className="h-6 w-[1px] bg-slate-800 mx-1" />

                {/* Eraser */}
                <button
                  onClick={() => setIsEraser(true)}
                  className={`p-2 rounded-lg border ${isEraser ? 'bg-amber-600 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  title="O'chirg'ich"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                {/* Brush size slider */}
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={canvasWidth}
                  onChange={(e) => setCanvasWidth(parseInt(e.target.value))}
                  className="w-16 accent-sky-500"
                />

                {/* Reset canvas */}
                <button
                  onClick={clearCanvas}
                  className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-rose-400 active:scale-90"
                  title="Tozalamoq"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="border border-slate-850 rounded-3xl overflow-hidden bg-slate-950 shadow-inner">
              <canvas
                ref={canvasRef}
                width={700}
                height={350}
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onMouseMove={draw}
                className="w-full h-[320px] cursor-crosshair block"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { sound.playCorrect(); if (isLeftTurn) addScoreLeft(1); else addScoreRight(1); }}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black uppercase rounded-2xl cursor-pointer shadow border border-emerald-400"
              >
                Topishdi! Guruhingiz g'olib (+1 ball)
              </button>
              
              <button
                onClick={refreshRound}
                className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 flex items-center gap-2 uppercase font-bold text-xs"
              >
                Keyingi so'z
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============ 5. MEMORY MATCH ============ */}
        {effectiveGameType === 'memory-match' && (
          <div className="max-w-xl mx-auto space-y-5 pt-2 text-center">
            
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-900">
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Kartochkalardan bir-biriga mos keladigan o'zbekcha va inglizcha so'z juftliklarini birma-bir bosing. To'g'ri topilsa, juftlik ochiladi!
              </p>
            </div>

            {/* Cards layout grid (3 columns x 4 rows) */}
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {cards.map((card) => {
                const isSelected = selectedCards.includes(card.id);
                const showFace = card.isFlipped || card.isMatched || isSelected;
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    disabled={card.isMatched || showFace}
                    className={`h-24 rounded-2xl border flex items-center justify-center font-bold text-xs cursor-pointer p-2 uppercase text-center transition-all ${
                      card.isMatched
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 opacity-60'
                        : showFace
                        ? 'bg-gradient-to-tr from-slate-900 to-slate-950 border-cyan-500 text-cyan-300 shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'
                    }`}
                  >
                    {showFace ? card.text : '❓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============ 6. WORD CHAIN RELAY ============ */}
        {effectiveGameType === 'word-chain' && (
          <div className="max-w-md mx-auto space-y-5 pt-3 text-center">
            
            {/* Word Chain Header Info & Timer Status */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${chainTimer <= 10 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${chainTimer <= 10 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                </span>
                <span className="text-xs font-semibold text-slate-400">Jamoa o'ylash vaqti:</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider flex items-center gap-1.5 ${
                chainTimer <= 10 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
              }`}>
                ⏳ {chainTimer} soniya
              </div>
            </div>

            {/* Success Reward Notifications */}
            {bonusNotification && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-400 py-2.5 px-4 rounded-xl text-xs font-bold font-mono shadow-md animate-fade-in flex items-center justify-center gap-2">
                <span>🎉</span>
                <span>{bonusNotification}</span>
              </div>
            )}

            {/* Current Active Word Box */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden group shadow-xl">
              <div className="absolute top-2 right-2 flex gap-1">
                {/* Text-to-speech option */}
                <button
                  type="button"
                  title="Talaffuzni eshitish"
                  onClick={() => playWordAudio(chainHistory[chainHistory.length - 1])}
                  className="p-1 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs border border-slate-850 active:scale-90 transition-all flex items-center gap-1 cursor-pointer"
                >
                  🔊 <span className="text-[10px] font-bold uppercase font-sans">Listen</span>
                </button>
              </div>

              <span className="text-[9px] text-slate-500 uppercase font-black block tracking-widest text-left">Oxirgi kiritilgan so'z:</span>
              <div className="py-2.5 px-6 bg-slate-950 rounded-xl inline-block border border-slate-850 drop-shadow-md">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono uppercase tracking-widest block text-center">
                  {chainHistory[chainHistory.length - 1]}
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-1 bg-amber-500/10 border border-amber-500/20 py-1.5 px-4 rounded-xl max-w-xs mx-auto text-xs text-amber-500 font-bold uppercase mt-1">
                Navbatdagi harf: 
                <span className="text-xl font-black font-mono ml-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-md">
                  {chainHistory[chainHistory.length - 1].slice(-1).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Dictionary / Meaning Panel */}
            {lastWordDefinition && (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 text-left space-y-1.5 animate-fade-in shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-cyan-500 uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-900/25 border border-cyan-500/20">
                    DICTIONARY
                  </span>
                  {lastWordPartofSpeech && (
                    <span className="text-[9px] font-semibold text-slate-400 italic">
                      ({lastWordPartofSpeech})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium line-clamp-3">
                  {lastWordDefinition}
                </p>
              </div>
            )}

            {/* Input form */}
            <form onSubmit={submitChainWord} className="space-y-4">
              <div className="space-y-1 relative">
                <input
                  type="text"
                  value={chainInput}
                  disabled={chainChecking}
                  onChange={(e) => setChainInput(e.target.value)}
                  placeholder={chainChecking ? "Tekshirilmoqda..." : "Navbatdagi inglizcha so'zni yozing..."}
                  className="w-full bg-slate-950 border border-slate-800 text-center font-bold text-lg text-white rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 disabled:opacity-50 tracking-wider placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {chainError && (
                <p className="text-xs text-rose-500 font-bold uppercase font-mono animate-bounce">{chainError}</p>
              )}

              <button
                type="submit"
                disabled={chainChecking}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:bg-slate-850 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-500 text-slate-950 text-xs font-black uppercase rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {chainChecking ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-cyan-500 animate-spin"></span>
                    Lug'at tekshirilmoqda...
                  </>
                ) : (
                  <>
                    <span>🔗</span>
                    <span>Zanjirni Davom Ettirish</span>
                  </>
                )}
              </button>
            </form>

            {/* Mini Log of previous chains showing active visual links */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900/60 max-h-[140px] overflow-y-auto space-y-2 text-left">
              <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider px-2">Kichik Zanjir Tarixi:</span>
              <div className="flex flex-wrap items-center gap-2 p-2 justify-center">
                {chainHistory.map((item, idx) => {
                  const isLast = idx === chainHistory.length - 1;
                  return (
                    <React.Fragment key={item + idx}>
                      <span className={`py-1 px-2.5 rounded-lg font-mono text-xs border shadow-sm flex items-center gap-1 ${
                        isLast 
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 font-black' 
                          : 'bg-slate-900 border-slate-850 text-slate-400'
                      }`}>
                        <span className="text-[10px] text-slate-500">{idx + 1}.</span>
                        {item}
                        {!isLast && <span className="text-[9px] text-amber-500 opacity-80">({item.slice(-1).toUpperCase()})</span>}
                      </span>
                      {idx < chainHistory.length - 1 && (
                        <span className="text-slate-700 font-bold text-xs">➔</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============ 7. VOCABULARY BINGO ============ */}
        {effectiveGameType === 'vocabulary-bingo' && (
          <div className="max-w-2xl mx-auto space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-bold">O'qituvchi quyidagi so'zni e'lon qiladi:</p>
                <button
                  onClick={() => {
                    const next = BINGO_WORDS[Math.floor(Math.random() * BINGO_WORDS.length)];
                    setBingoCalledWord(next);
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance(next.en);
                      u.lang = 'en-US'; u.rate = 0.85;
                      window.speechSynthesis.speak(u);
                    }
                  }}
                  className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-amber-400"
                >
                  {bingoCalledWord ? `🔊 ${bingoCalledWord.en} (${bingoCalledWord.uz})` : '🎲 So\'z chiqar'}
                </button>
              </div>
              <div>
                {bingoWinner && <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-black text-sm px-4 py-2 rounded-xl">🏆 BINGO! {bingoWinner}</div>}
              </div>
            </div>

            {/* 5x5 Bingo grid */}
            <div className="grid grid-cols-5 gap-2">
              {bingoGrid.map((cell, idx) => (
                <button
                  key={idx}
                  disabled={!cell || bingoMarked[idx]}
                  onClick={() => {
                    if (!cell || !bingoCalledWord) return;
                    if (cell.en.toLowerCase() === bingoCalledWord.en.toLowerCase()) {
                      sound.playCorrect();
                      const newMarked = [...bingoMarked];
                      newMarked[idx] = true;
                      setBingoMarked(newMarked);
                      // Check for bingo (row/col/diagonal)
                      const rows = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24]];
                      const cols = [[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24]];
                      const diags = [[0,6,12,18,24],[4,8,12,16,20]];
                      const allLines = [...rows,...cols,...diags];
                      const hasBingo = allLines.some(line => line.every(i => newMarked[i]));
                      if (hasBingo) { setBingoWinner(isLeftTurn ? teamLeft.name : teamRight.name); sound.playCorrect(); if (isLeftTurn) addScoreLeft(3); else addScoreRight(3); }
                    } else { sound.playIncorrect(); }
                  }}
                  className={`h-14 rounded-xl border text-[9px] font-bold uppercase text-center flex items-center justify-center p-1 transition-all cursor-pointer ${
                    bingoMarked[idx] ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500'
                  }`}
                >
                  {bingoMarked[idx] ? '✅' : cell?.uz || ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============ 8. ENGLISH TABOO ============ */}
        {effectiveGameType === 'english-taboo' && (
          <div className="max-w-lg mx-auto space-y-5 pt-3 text-center">
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-3xl p-6 space-y-4">
              <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider">Ushbu so'zni aytish MUMKIN EMAS:</p>
              <div className="space-y-2">
                {tabooCard.forbidden.map(f => (
                  <div key={f} className="text-sm text-rose-300 font-bold line-through decoration-rose-500 decoration-2">🚫 {f}</div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 space-y-2">
              <p className="text-[10px] text-slate-400 uppercase font-black">Bu so'zni izohlang:</p>
              <h2 className="text-4xl font-black text-amber-400 uppercase">{tabooCard.word}</h2>
              <p className="text-xs text-slate-400">({tabooCard.uz})</p>
              <div className={`text-2xl font-black font-mono ${tabooTimer <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{tabooTimer}s</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  sound.playTap();
                  if (tabooActive) {
                    setTabooActive(false);
                    if (tabooRef.current) clearInterval(tabooRef.current);
                  } else {
                    setTabooActive(true);
                    tabooRef.current = setInterval(() => {
                      setTabooTimer(t => {
                        if (t <= 1) { clearInterval(tabooRef.current!); setTabooActive(false); sound.playIncorrect(); return 0; }
                        return t - 1;
                      });
                    }, 1000);
                  }
                }}
                className={`flex-1 py-4 rounded-2xl font-black uppercase text-sm border transition-all ${tabooActive ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-white border-slate-800'}`}
              >
                {tabooActive ? '⏸ To\'xtat' : '▶ Boshlash'}
              </button>
              <button onClick={() => { sound.playCorrect(); if (isLeftTurn) addScoreLeft(1); else addScoreRight(1); setTabooCard(TABOO_CARDS[Math.floor(Math.random() * TABOO_CARDS.length)]); setTabooTimer(60); setTabooActive(false); if (tabooRef.current) clearInterval(tabooRef.current); }} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-sm rounded-2xl border border-emerald-400">✅ Topishdi!</button>
              <button onClick={() => { sound.playIncorrect(); setTabooCard(TABOO_CARDS[Math.floor(Math.random() * TABOO_CARDS.length)]); setTabooTimer(60); setTabooActive(false); if (tabooRef.current) clearInterval(tabooRef.current); }} className="flex-1 py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black uppercase text-sm rounded-2xl border border-rose-400">⏭ O'tkazish</button>
            </div>
          </div>
        )}

        {/* ============ 9. TEAM SPELLING ============ */}
        {effectiveGameType === 'team-spelling' && (
          <div className="max-w-lg mx-auto space-y-5 pt-4 text-center">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Bu so'zni inglizcha yozing:</p>
              <h2 className="text-4xl font-black text-amber-400">{spellingWord.uz}</h2>
              <p className="text-xs text-slate-500">Headway: darajangizga mos</p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={spellingInput}
                onChange={e => { setSpellingInput(e.target.value); setSpellingResult(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (spellingInput.trim().toLowerCase() === spellingWord.en.toLowerCase()) {
                      sound.playCorrect(); setSpellingResult('correct');
                      setTimeout(() => { if (isLeftTurn) addScoreLeft(1); else addScoreRight(1); }, 600);
                    } else { sound.playIncorrect(); setSpellingResult('wrong'); }
                  }
                }}
                placeholder="Inglizcha yozing va Enter bosing..."
                className={`w-full bg-slate-950 border-2 text-center text-xl font-bold text-white rounded-2xl py-4 px-4 focus:outline-none tracking-wider uppercase ${spellingResult === 'correct' ? 'border-emerald-500' : spellingResult === 'wrong' ? 'border-rose-500 animate-pulse' : 'border-slate-700 focus:border-amber-500'}`}
              />
              {spellingResult === 'correct' && <p className="text-emerald-400 font-black text-sm">✅ To'g'ri! Ajoyib!</p>}
              {spellingResult === 'wrong' && <p className="text-rose-400 font-black text-sm">❌ Xato! To'g'ri: <span className="text-white uppercase">{spellingWord.en}</span></p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { sound.playCorrect(); setSpellingResult('correct'); setTimeout(() => { if (isLeftTurn) addScoreLeft(1); else addScoreRight(1); }, 600); }} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs rounded-2xl border border-emerald-400">✅ To'g'ri topdi</button>
              <button onClick={() => { sound.playTap(); const w = wordList[Math.floor(Math.random() * wordList.length)] || spellingWord; setSpellingWord(w); setSpellingInput(''); setSpellingResult(null); }} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-xs rounded-2xl border border-slate-800">⏭ Keyingisi</button>
            </div>
          </div>
        )}

        {/* ============ 10. WORD PYRAMID ============ */}
        {effectiveGameType === 'word-pyramid' && (
          <div className="max-w-lg mx-auto space-y-5 pt-3">
            <div className="text-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold">Piramiда savol #{pyramidIndex + 1}/{pyramidSet.length}</p>
              <p className="text-[10px] text-amber-400 font-black mt-1">Harflar soni: {pyramidSet[pyramidIndex]?.length}</p>
            </div>
            {pyramidSet[pyramidIndex] && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-slate-400 uppercase font-black">Maslahat:</p>
                  <h3 className="text-lg font-bold text-sky-300">{pyramidSet[pyramidIndex].clue}</h3>
                  <div className="flex justify-center gap-1 mt-2">
                    {Array.from({ length: pyramidSet[pyramidIndex].length }).map((_, i) => (
                      <div key={i} className="w-8 h-10 border-b-2 border-amber-500 flex items-end justify-center text-white font-black uppercase text-sm pb-1">
                        {pyramidInput[i] || ''}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 italic mt-1">({pyramidSet[pyramidIndex].uz})</p>
                </div>
                <input
                  type="text"
                  value={pyramidInput}
                  onChange={e => { setPyramidInput(e.target.value.toUpperCase()); setPyramidResult(null); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (pyramidInput.trim().toUpperCase() === pyramidSet[pyramidIndex].answer) {
                        sound.playCorrect(); setPyramidResult('correct');
                        setTimeout(() => {
                          if (isLeftTurn) addScoreLeft(1); else addScoreRight(1);
                          const nextIdx = pyramidIndex + 1;
                          if (nextIdx < pyramidSet.length) { setPyramidIndex(nextIdx); setPyramidInput(''); setPyramidResult(null); }
                        }, 700);
                      } else { sound.playIncorrect(); setPyramidResult('wrong'); }
                    }
                  }}
                  placeholder="Javobni kiriting..."
                  maxLength={pyramidSet[pyramidIndex].length}
                  className={`w-full bg-slate-950 border-2 text-center text-xl font-black text-white rounded-2xl py-3 px-4 focus:outline-none uppercase tracking-widest ${pyramidResult === 'correct' ? 'border-emerald-500' : pyramidResult === 'wrong' ? 'border-rose-500' : 'border-slate-700 focus:border-amber-500'}`}
                />
                {pyramidResult === 'correct' && <p className="text-center text-emerald-400 font-black">✅ To'g'ri! Keyingi savol...</p>}
                {pyramidResult === 'wrong' && <p className="text-center text-rose-400 font-black">❌ Xato! Qayta urinib ko'ring.</p>}
              </div>
            )}
          </div>
        )}

        {/* ============ 11. STORY BUILDER ============ */}
        {effectiveGameType === 'story-builder' && (
          <div className="max-w-2xl mx-auto space-y-5 pt-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl min-h-[70px]">
              <p className="text-[10px] text-slate-400 uppercase font-black mb-2">Qo'shilgan so'zlar (tartib bilan):</p>
              <div className="flex flex-wrap gap-2">
                {storyBuilt.length === 0 ? <span className="text-slate-500 italic text-xs">Hali hech narsa qo'shilmadi...</span> :
                  storyBuilt.map((w, i) => <span key={i} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded text-sm font-semibold">{w}</span>)
                }
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black mb-2">Mavjud so'zlar (bosing):</p>
              <div className="flex flex-wrap gap-2">
                {storyRemaining.map((word, idx) => (
                  <button key={`${word}-${idx}`} onClick={() => {
                    sound.playTap();
                    const next = [...storyBuilt, word];
                    setStoryBuilt(next);
                    const rem = [...storyRemaining]; rem.splice(idx, 1); setStoryRemaining(rem);
                    if (next.length === storyWords.length) {
                      const correct = JSON.stringify(next) === JSON.stringify(storyWords);
                      if (correct) { sound.playCorrect(); if (isLeftTurn) addScoreLeft(2); else addScoreRight(2); }
                      else { sound.playIncorrect(); setTimeout(() => { setStoryBuilt([]); setStoryRemaining([...storyWords].sort(() => Math.random() - 0.5)); }, 1200); }
                    }
                  }} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 text-white text-sm font-semibold rounded-xl active:scale-95 cursor-pointer">
                    {word}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setStoryBuilt([]); setStoryRemaining([...storyWords].sort(() => Math.random() - 0.5)); }} className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl">Qayta boshlash</button>
              <button onClick={() => { sound.playCorrect(); if (isLeftTurn) addScoreLeft(2); else addScoreRight(2); }} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl border border-emerald-400">✅ To'g'ri tartib</button>
              <button onClick={() => { const picked = STORY_WORDS[Math.floor(Math.random() * STORY_WORDS.length)]; setStoryWords(picked); setStoryBuilt([]); setStoryRemaining([...picked].sort(() => Math.random() - 0.5)); }} className="px-4 py-2 bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold rounded-xl">Keyingisi ⏭</button>
            </div>
          </div>
        )}

        {/* ============ 12. WORD WHEEL ============ */}
        {effectiveGameType === 'word-wheel' && (
          <div className="max-w-lg mx-auto space-y-5 pt-3 text-center">
            <div className="relative inline-flex items-center justify-center mx-auto">
              <div className="relative w-64 h-64">
                {/* Center letter */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center z-10 border-4 border-amber-300 shadow-lg shadow-amber-500/30">
                  <span className="text-2xl font-black text-slate-950">{wheelCenter}</span>
                </div>
                {/* Outer ring letters */}
                {wheelLetters.map((letter, i) => {
                  const angle = (i * 360) / wheelLetters.length;
                  const rad = (angle * Math.PI) / 180;
                  const r = 95;
                  const x = Math.cos(rad - Math.PI / 2) * r + 128 - 20;
                  const y = Math.sin(rad - Math.PI / 2) * r + 128 - 20;
                  return (
                    <button key={i} onClick={() => { sound.playTap(); setWheelInput(prev => prev + letter); }}
                      style={{ position:'absolute', left:x, top:y, width:40, height:40 }}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-white font-black text-sm rounded-full flex items-center justify-center active:scale-90 cursor-pointer transition-all">
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center min-h-[50px] flex items-center justify-center">
                <span className="text-2xl font-black tracking-widest text-white uppercase">{wheelInput || <span className="text-slate-500 text-sm">Harflarni bosing...</span>}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setWheelInput('')} className="flex-1 py-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl">Tozala</button>
                <button onClick={() => {
                  if (!wheelInput || !wheelInput.includes(wheelCenter)) { sound.playIncorrect(); return; }
                  if (wheelInput.length >= 3 && !wheelFound.includes(wheelInput.toLowerCase())) {
                    sound.playCorrect();
                    const newFound = [...wheelFound, wheelInput.toLowerCase()];
                    setWheelFound(newFound);
                    setWheelInput('');
                    if (newFound.length >= 5) { if (isLeftTurn) addScoreLeft(2); else addScoreRight(2); }
                  } else { sound.playIncorrect(); setWheelInput(''); }
                }} className="flex-3 flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl border border-emerald-400">✅ Qo'shish</button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {wheelFound.map(w => <span key={w} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded text-xs font-bold uppercase">{w}</span>)}
                {wheelFound.length === 0 && <span className="text-slate-500 text-xs">Topilgan so'zlar shu yerda chiqadi (min 5 ta so'z topish kerak)</span>}
              </div>
            </div>
          </div>
        )}

        {/* ============ 13. GRAMMAR TEAM ============ */}
        {effectiveGameType === 'grammar-team' && (
          <div className="max-w-lg mx-auto space-y-5 pt-4 text-center">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Bu gap to'g'rimi yoki noto'g'ri?</p>
              <p className={`text-xl font-bold mt-2 ${GRAMMAR_SENTENCES[grammarIdx]?.isCorrect ? 'text-white' : 'text-rose-300'}`}>
                "{GRAMMAR_SENTENCES[grammarIdx]?.sentence}"
              </p>
              {grammarAns && !GRAMMAR_SENTENCES[grammarIdx]?.isCorrect && (
                <p className="text-xs text-emerald-400 font-bold">To'g'risi: "{GRAMMAR_SENTENCES[grammarIdx]?.fixed}"</p>
              )}
            </div>
            {!grammarAns && (
              <div className="flex gap-4">
                <button onClick={() => {
                  const isRight = GRAMMAR_SENTENCES[grammarIdx]?.isCorrect;
                  if (true === isRight) { sound.playCorrect(); setGrammarAns('correct'); setTimeout(() => { if (isLeftTurn) addScoreLeft(1); else addScoreRight(1); setGrammarIdx(Math.floor(Math.random() * GRAMMAR_SENTENCES.length)); setGrammarAns(null); }, 1000); }
                  else { sound.playIncorrect(); setGrammarAns('wrong'); setTimeout(() => { setGrammarIdx(Math.floor(Math.random() * GRAMMAR_SENTENCES.length)); setGrammarAns(null); }, 1500); }
                }} className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase rounded-2xl border border-emerald-400">✅ TO'G'RI</button>
                <button onClick={() => {
                  const isRight = GRAMMAR_SENTENCES[grammarIdx]?.isCorrect;
                  if (false === isRight) { sound.playCorrect(); setGrammarAns('correct'); setTimeout(() => { if (isLeftTurn) addScoreLeft(1); else addScoreRight(1); setGrammarIdx(Math.floor(Math.random() * GRAMMAR_SENTENCES.length)); setGrammarAns(null); }, 1000); }
                  else { sound.playIncorrect(); setGrammarAns('wrong'); setTimeout(() => { setGrammarIdx(Math.floor(Math.random() * GRAMMAR_SENTENCES.length)); setGrammarAns(null); }, 1500); }
                }} className="flex-1 py-5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black uppercase rounded-2xl border border-rose-400">❌ NOTO'G'RI</button>
              </div>
            )}
            {grammarAns && (
              <div className={`py-4 rounded-2xl font-black text-lg border ${grammarAns === 'correct' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'}`}>
                {grammarAns === 'correct' ? '🎉 To\'g\'ri javob!' : '❌ Xato javob!'}
              </div>
            )}
          </div>
        )}

        {/* ===== PASSWORD GAME ===== */}
        {gameType === 'password-game' && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Parol O'yini 🔑</p>
              <p className="text-[10px] text-slate-500">
                {pwdTeam === 'left' ? teamLeft.name : teamRight.name} jamoasi o'yinchi bitta inglizcha so'z bilan belgi beradi
              </p>
            </div>

            {pwdPhase === 'clue' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center">
                  <p className="text-[10px] text-amber-400 uppercase font-black mb-2">So'z (faqat beruvchi ko'radi):</p>
                  <p className="text-3xl font-black text-white">{pwdWord.en}</p>
                  <p className="text-sm text-slate-400 mt-1">({pwdWord.uz})</p>
                </div>
                <p className="text-center text-xs text-slate-400">
                  Jamoangizga BITTA inglizcha so'z bilan belgi bering (gapirib), keyin quyidagi tugmani bosing:
                </p>
                <button
                  onClick={() => setPwdPhase('guess')}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl uppercase text-sm transition-all"
                >
                  Belgi berildi — Jamoa taxmin qilsin 🎯
                </button>
              </div>
            )}

            {pwdPhase === 'guess' && (
              <div className="space-y-4">
                <p className="text-center text-sm font-bold text-white">
                  {pwdTeam === 'left' ? teamLeft.name : teamRight.name} jamoasi: qaysi so'z?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {pwdOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        const correct = opt === pwdWord.en;
                        setPwdResult(correct ? 'correct' : 'wrong');
                        setPwdPhase('result');
                        if (correct) {
                          sound.playCorrect();
                          if (pwdTeam === 'left') addScoreLeft(2); else addScoreRight(2);
                        } else {
                          sound.playIncorrect();
                        }
                      }}
                      className="py-5 rounded-2xl border font-black text-base uppercase bg-slate-900 border-slate-700 hover:border-indigo-500 hover:bg-slate-800 text-white transition-all cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pwdPhase === 'result' && (
              <div className="space-y-4 text-center">
                <div className={`py-6 rounded-2xl border font-black text-xl ${pwdResult === 'correct' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'}`}>
                  {pwdResult === 'correct' ? `🎉 To'g'ri! So'z: "${pwdWord.en}"` : `❌ Xato! To'g'ri so'z: "${pwdWord.en}"`}
                </div>
                <button
                  onClick={() => {
                    setPwdTeam(t => t === 'left' ? 'right' : 'left');
                    const w = wordList[Math.floor(Math.random() * wordList.length)];
                    setPwdWord(w);
                    setPwdPhase('clue');
                    setPwdResult(null);
                    const others = wordList.filter(x => x.en !== w.en).map(x => x.en).sort(() => Math.random() - 0.5).slice(0, 2);
                    setPwdOptions([w.en, ...others].sort(() => Math.random() - 0.5));
                  }}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl uppercase text-sm border border-slate-700 transition-all"
                >
                  Keyingi so'z →
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
