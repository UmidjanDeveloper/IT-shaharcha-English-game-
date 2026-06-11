import React, { useState, useEffect, useRef } from 'react';
import { WordPair, Team } from '../types';
import { sound } from '../utils/audio';
import { ShieldAlert } from 'lucide-react';

interface GrammarSentence { full: string; scrambled: string[]; promptUz: string; }
const sampleSentences: GrammarSentence[] = [
  { full: 'she is happy today', scrambled: ['she','is','happy','today'], promptUz: 'U bugun xursand.' },
  { full: 'the cat is sleeping', scrambled: ['the','cat','is','sleeping'], promptUz: 'Mushuk uxlamoqda.' },
  { full: 'i like to read books', scrambled: ['i','like','to','read','books'], promptUz: 'Men kitob o\'qishni yaxshi ko\'raman.' },
  { full: 'they are playing football', scrambled: ['they','are','playing','football'], promptUz: 'Ular futbol o\'ynamoqda.' },
  { full: 'we go to school every day', scrambled: ['we','go','to','school','every','day'], promptUz: 'Biz har kuni maktabga boramiz.' },
  { full: 'he drinks water in the morning', scrambled: ['he','drinks','water','in','the','morning'], promptUz: 'U ertalab suv ichadi.' },
  { full: 'my dog is very big', scrambled: ['my','dog','is','very','big'], promptUz: 'Mening itim juda katta.' },
  { full: 'she can speak english well', scrambled: ['she','can','speak','english','well'], promptUz: 'U inglizcha yaxshi gapira oladi.' },
  { full: 'the sun is shining today', scrambled: ['the','sun','is','shining','today'], promptUz: 'Bugun quyosh chiqmoqda.' },
  { full: 'i want to eat an apple', scrambled: ['i','want','to','eat','an','apple'], promptUz: 'Men olma yemoqni hohlayman.' },
];

type GameType = string;

interface DuelGamesProps {
  gameType: GameType;
  teamLeft: Team;
  teamRight: Team;
  wordList: WordPair[];
  maxScore: number;
  onGameWin: (winner: Team) => void;
  onUpdateScore: (leftScore: number, rightScore: number) => void;
}

// Antonym groups for antonym-duel
const ANTONYM_PAIRS: { word: string; antonym: string; others: string[] }[] = [
  { word: 'happy', antonym: 'sad', others: ['angry', 'tired', 'hungry'] },
  { word: 'big', antonym: 'small', others: ['tall', 'wide', 'heavy'] },
  { word: 'fast', antonym: 'slow', others: ['quiet', 'bright', 'warm'] },
  { word: 'hot', antonym: 'cold', others: ['wet', 'sharp', 'loud'] },
  { word: 'day', antonym: 'night', others: ['week', 'hour', 'month'] },
  { word: 'start', antonym: 'finish', others: ['pause', 'wait', 'rush'] },
  { word: 'love', antonym: 'hate', others: ['ignore', 'forget', 'fear'] },
  { word: 'young', antonym: 'old', others: ['tall', 'strong', 'brave'] },
  { word: 'rich', antonym: 'poor', others: ['busy', 'tired', 'lost'] },
  { word: 'push', antonym: 'pull', others: ['drop', 'throw', 'lift'] },
  { word: 'open', antonym: 'close', others: ['break', 'hide', 'turn'] },
  { word: 'clean', antonym: 'dirty', others: ['noisy', 'cold', 'flat'] },
];

// Analogies for analogy-quiz (reuses antonym-duel handler)
const ANALOGY_ITEMS: { question: string; answer: string; others: string[] }[] = [
  { question: 'Big → Small :: Hot → ?', answer: 'cold', others: ['warm', 'soft', 'quiet'] },
  { question: 'Cat → Kitten :: Dog → ?', answer: 'puppy', others: ['cub', 'chick', 'lamb'] },
  { question: 'Teacher → School :: Doctor → ?', answer: 'hospital', others: ['office', 'market', 'court'] },
  { question: 'Eye → See :: Ear → ?', answer: 'hear', others: ['taste', 'smell', 'touch'] },
  { question: 'Day → Night :: Morning → ?', answer: 'evening', others: ['weekend', 'midnight', 'holiday'] },
  { question: 'Book → Read :: Song → ?', answer: 'listen', others: ['watch', 'touch', 'count'] },
  { question: 'Fish → Water :: Bird → ?', answer: 'sky', others: ['forest', 'ground', 'desert'] },
  { question: 'Hand → Glove :: Head → ?', answer: 'hat', others: ['shoes', 'jacket', 'belt'] },
  { question: 'Summer → Hot :: Winter → ?', answer: 'cold', others: ['dark', 'windy', 'long'] },
  { question: 'Apple → Fruit :: Carrot → ?', answer: 'vegetable', others: ['grain', 'spice', 'liquid'] },
  { question: 'Run → Fast :: Sleep → ?', answer: 'slow', others: ['loud', 'warm', 'soft'] },
  { question: 'London → England :: Paris → ?', answer: 'France', others: ['Germany', 'Italy', 'Spain'] },
];

// Grammar error sentences for sentence-fix
const WRONG_SENTENCES: { wrong: string; correct: string; errorWord: string; fixWord: string; uz: string }[] = [
  { wrong: 'She go to school every day.', correct: 'She goes to school every day.', errorWord: 'go', fixWord: 'goes', uz: 'U har kuni maktabga boradi.' },
  { wrong: 'They is playing football.', correct: 'They are playing football.', errorWord: 'is', fixWord: 'are', uz: 'Ular futbol o\'nyapti.' },
  { wrong: 'I buyed a new book.', correct: 'I bought a new book.', errorWord: 'buyed', fixWord: 'bought', uz: 'Men yangi kitob sotib oldim.' },
  { wrong: 'He don\'t like coffee.', correct: 'He doesn\'t like coffee.', errorWord: 'don\'t', fixWord: 'doesn\'t', uz: 'U kofe yoqtirmaydi.' },
  { wrong: 'We was at the park.', correct: 'We were at the park.', errorWord: 'was', fixWord: 'were', uz: 'Biz parkda edik.' },
  { wrong: 'The children runned fast.', correct: 'The children ran fast.', errorWord: 'runned', fixWord: 'ran', uz: 'Bolalar tez yugurdi.' },
  { wrong: 'She have a cat.', correct: 'She has a cat.', errorWord: 'have', fixWord: 'has', uz: 'Uning mushuki bor.' },
  { wrong: 'I am agree with you.', correct: 'I agree with you.', errorWord: 'am agree', fixWord: 'agree', uz: 'Men siz bilan roziman.' },
];

const playTTS = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US'; utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }
};

export default function DuelGames({ gameType, teamLeft, teamRight, wordList, maxScore, onGameWin, onUpdateScore }: DuelGamesProps) {
  const [currentLeftScore, setCurrentLeftScore] = useState(0);
  const [currentRightScore, setCurrentRightScore] = useState(0);

  const [targetWord, setTargetWord] = useState<WordPair>({ uz: 'Olma', en: 'Apple' });
  const [targetSentence, setTargetSentence] = useState<GrammarSentence | null>(null);
  const [revealCountdown, setRevealCountdown] = useState(0);

  // True-False
  const [isTFCorrect, setIsTFCorrect] = useState(true);
  const [proposedTranslation, setProposedTranslation] = useState('');

  // Options per side
  const [leftOptions, setLeftOptions] = useState<string[]>([]);
  const [rightOptions, setRightOptions] = useState<string[]>([]);

  // Sentence/spelling builders
  const [leftScrambledSent, setLeftScrambledSent] = useState<string[]>([]);
  const [rightScrambledSent, setRightScrambledSent] = useState<string[]>([]);
  const [leftBuiltSent, setLeftBuiltSent] = useState<string[]>([]);
  const [rightBuiltSent, setRightBuiltSent] = useState<string[]>([]);

  const [leftFroze, setLeftFroze] = useState(false);
  const [rightFroze, setRightFroze] = useState(false);
  const [wrongLeftItem, setWrongLeftItem] = useState<string | null>(null);
  const [wrongRightItem, setWrongRightItem] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);

  // Word bomb
  const [bombTimer, setBombTimer] = useState(10);
  const [bombActive, setBombActive] = useState(false);
  const bombRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [bombFocus, setBombFocus] = useState<'left' | 'right'>('left');

  // Antonym duel
  const [antonymItem, setAntonymItem] = useState<typeof ANTONYM_PAIRS[0]>(ANTONYM_PAIRS[0]);
  const [antonymOptions, setAntonymOptions] = useState<string[]>([]);

  // Sentence fix
  const [fixItem, setFixItem] = useState<typeof WRONG_SENTENCES[0]>(WRONG_SENTENCES[0]);
  const [fixOptions, setFixOptions] = useState<string[]>([]);

  // Definition duel
  const [defWord, setDefWord] = useState('');
  const [defOptions, setDefOptions] = useState<string[]>([]);

  // Grammar clash (correct/wrong judgment)
  const [clashSentence, setClashSentence] = useState('');
  const [clashIsCorrect, setClashIsCorrect] = useState(true);

  const normalizeGameType = (id: string): string => {
    if (id === 'sentence-sprint' || id === 'phrase-builder') return 'sentence-duel';
    if (id === 'speed-quiz' || id === 'vocab-blitz') return 'word-duel';
    if (id === 'word-race') return 'spelling-race';
    if (id === 'emoji-battle') return 'flashcard-battle';
    if (id === 'analogy-quiz') return 'antonym-duel';
    return id;
  };

  const effectiveType = normalizeGameType(gameType);

  const nextRound = () => {
    if (wordList.length < 4) return;
    const idx = Math.floor(Math.random() * wordList.length);
    const chosen = wordList[idx];
    setTargetWord(chosen);

    if (effectiveType === 'word-duel') {
      const correct = chosen.en;
      const dist = wordList.filter((_, i) => i !== idx).map(p => p.en).sort(() => Math.random() - 0.5).slice(0, 17);
      const pool = [correct, ...dist];
      setLeftOptions([...pool].sort(() => Math.random() - 0.5));
      setRightOptions([...pool].sort(() => Math.random() - 0.5));
    }

    if (effectiveType === 'flashcard-battle') {
      const correct = chosen.en;
      const dist = wordList.filter((_, i) => i !== idx).map(p => p.en).sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [correct, ...dist].sort(() => Math.random() - 0.5);
      setLeftOptions([...opts]);
      setRightOptions([...opts]);
      setRevealCountdown(4);
    } else {
      setRevealCountdown(0);
    }

    if (effectiveType === 'spelling-race') {
      const letters = chosen.en.toLowerCase().split('').sort(() => Math.random() - 0.5);
      setLeftOptions([...letters]);
      setRightOptions([...letters]);
      setLeftBuiltSent([]);
      setRightBuiltSent([]);
    }

    if (effectiveType === 'sentence-duel') {
      const randS = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
      setTargetSentence(randS);
      setLeftScrambledSent([...randS.scrambled].sort(() => Math.random() - 0.5));
      setRightScrambledSent([...randS.scrambled].sort(() => Math.random() - 0.5));
      setLeftBuiltSent([]);
      setRightBuiltSent([]);
    }

    if (effectiveType === 'true-false') {
      const isCorrect = Math.random() > 0.5;
      setIsTFCorrect(isCorrect);
      if (isCorrect) {
        setProposedTranslation(chosen.uz);
      } else {
        const dist2 = wordList.filter((_, i) => i !== idx).map(p => p.uz);
        setProposedTranslation(dist2[Math.floor(Math.random() * dist2.length)] || 'Noma\'lum');
      }
    }

    if (effectiveType === 'word-bomb') {
      if (bombRef.current) clearInterval(bombRef.current);
      setBombTimer(10);
      setBombActive(false);
      setBombFocus(Math.random() > 0.5 ? 'left' : 'right');
      const correct = chosen.en;
      const dist = wordList.filter((_, i) => i !== idx).map(p => p.en).sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [correct, ...dist].sort(() => Math.random() - 0.5);
      setLeftOptions(opts);
      setRightOptions(opts);
      // Auto-start bomb
      setTimeout(() => {
        setBombActive(true);
      }, 500);
    }

    if (effectiveType === 'antonym-duel') {
      if (gameType === 'analogy-quiz') {
        const item = ANALOGY_ITEMS[Math.floor(Math.random() * ANALOGY_ITEMS.length)];
        setAntonymItem({ word: item.question, antonym: item.answer, others: item.others });
        setAntonymOptions([item.answer, ...item.others].sort(() => Math.random() - 0.5));
      } else {
        const item = ANTONYM_PAIRS[Math.floor(Math.random() * ANTONYM_PAIRS.length)];
        setAntonymItem(item);
        setAntonymOptions([item.antonym, ...item.others].sort(() => Math.random() - 0.5));
      }
    }

    if (effectiveType === 'sentence-fix') {
      const item = WRONG_SENTENCES[Math.floor(Math.random() * WRONG_SENTENCES.length)];
      setFixItem(item);
      const opts = [item.fixWord, item.errorWord, ...['always', 'never'].slice(0, 2)].sort(() => Math.random() - 0.5);
      setFixOptions(opts.slice(0, 4));
    }

    if (effectiveType === 'definition-duel') {
      const correct = chosen.en;
      const dist = wordList.filter((_, i) => i !== idx).map(p => p.en).sort(() => Math.random() - 0.5).slice(0, 3);
      setDefWord(correct);
      setDefOptions([correct, ...dist].sort(() => Math.random() - 0.5));
    }

    if (effectiveType === 'grammar-clash') {
      // Show a sentence – sometimes correct, sometimes with an error
      const isCorrect = Math.random() > 0.5;
      setClashIsCorrect(isCorrect);
      if (isCorrect) {
        const randomS = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
        setClashSentence(randomS.full);
      } else {
        const randomW = WRONG_SENTENCES[Math.floor(Math.random() * WRONG_SENTENCES.length)];
        setClashSentence(randomW.wrong);
      }
    }

    if (effectiveType === 'synonym-duel') {
      // Re-use word-duel flow but with synonyms concept: show word, find correct translation
      const correct = chosen.en;
      const dist = wordList.filter((_, i) => i !== idx).map(p => p.en).sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [correct, ...dist].sort(() => Math.random() - 0.5);
      setLeftOptions(opts);
      setRightOptions(opts);
    }

    setLeftFroze(false);
    setRightFroze(false);
    setWrongLeftItem(null);
    setWrongRightItem(null);
  };

  useEffect(() => {
    nextRound();
    return () => { if (bombRef.current) clearInterval(bombRef.current); };
  }, [gameType, wordList]);

  // Flashcard reveal countdown
  useEffect(() => {
    if (revealCountdown <= 0) return;
    const t = setTimeout(() => { sound.playTick?.(); setRevealCountdown(r => r - 1); }, 1000);
    return () => clearTimeout(t);
  }, [revealCountdown]);

  // Word bomb countdown
  useEffect(() => {
    if (effectiveType === 'word-bomb' && bombActive) {
      bombRef.current = setInterval(() => {
        setBombTimer(t => {
          if (t <= 1) {
            clearInterval(bombRef.current!);
            setBombActive(false);
            sound.playIncorrect();
            // The waiting team loses a point chance
            setTimeout(() => { setRoundNumber(r => r + 1); nextRound(); }, 1200);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (bombRef.current) clearInterval(bombRef.current); };
  }, [bombActive, effectiveType]);

  const addPointLeft = () => {
    const next = currentLeftScore + 1;
    setCurrentLeftScore(next);
    onUpdateScore(next, currentRightScore);
    setLeftFroze(true); setRightFroze(true);
    if (next >= maxScore) {
      setTimeout(() => onGameWin({ ...teamLeft, score: next }), 700);
    } else {
      setTimeout(() => { setRoundNumber(r => r + 1); nextRound(); }, 1000);
    }
  };

  const addPointRight = () => {
    const next = currentRightScore + 1;
    setCurrentRightScore(next);
    onUpdateScore(currentLeftScore, next);
    setLeftFroze(true); setRightFroze(true);
    if (next >= maxScore) {
      setTimeout(() => onGameWin({ ...teamRight, score: next }), 700);
    } else {
      setTimeout(() => { setRoundNumber(r => r + 1); nextRound(); }, 1000);
    }
  };

  const handleLeftClick = (choice: string) => {
    if (leftFroze || revealCountdown > 0) return;
    const correct = targetWord.en;

    if (['word-duel', 'flashcard-battle', 'synonym-duel'].includes(effectiveType)) {
      if (choice === correct) { sound.playCorrect(); addPointLeft(); }
      else { sound.playIncorrect(); setLeftFroze(true); setWrongLeftItem(choice); setTimeout(() => { setLeftFroze(false); setWrongLeftItem(null); }, 1200); }
    }
    if (effectiveType === 'antonym-duel') {
      if (choice === antonymItem.antonym) { sound.playCorrect(); addPointLeft(); }
      else { sound.playIncorrect(); setLeftFroze(true); setWrongLeftItem(choice); setTimeout(() => { setLeftFroze(false); setWrongLeftItem(null); }, 1200); }
    }
    if (effectiveType === 'sentence-fix') {
      if (choice === fixItem.fixWord) { sound.playCorrect(); addPointLeft(); }
      else { sound.playIncorrect(); setLeftFroze(true); setWrongLeftItem(choice); setTimeout(() => { setLeftFroze(false); setWrongLeftItem(null); }, 1200); }
    }
    if (effectiveType === 'definition-duel') {
      if (choice === defWord) { sound.playCorrect(); addPointLeft(); }
      else { sound.playIncorrect(); setLeftFroze(true); setWrongLeftItem(choice); setTimeout(() => { setLeftFroze(false); setWrongLeftItem(null); }, 1200); }
    }
    if (effectiveType === 'word-bomb' && bombFocus === 'left') {
      if (bombRef.current) clearInterval(bombRef.current);
      setBombActive(false);
      if (choice === correct) { sound.playCorrect(); addPointLeft(); }
      else { sound.playIncorrect(); addPointRight(); }
    }
  };

  const handleRightClick = (choice: string) => {
    if (rightFroze || revealCountdown > 0) return;
    const correct = targetWord.en;

    if (['word-duel', 'flashcard-battle', 'synonym-duel'].includes(effectiveType)) {
      if (choice === correct) { sound.playCorrect(); addPointRight(); }
      else { sound.playIncorrect(); setRightFroze(true); setWrongRightItem(choice); setTimeout(() => { setRightFroze(false); setWrongRightItem(null); }, 1200); }
    }
    if (effectiveType === 'antonym-duel') {
      if (choice === antonymItem.antonym) { sound.playCorrect(); addPointRight(); }
      else { sound.playIncorrect(); setRightFroze(true); setWrongRightItem(choice); setTimeout(() => { setRightFroze(false); setWrongRightItem(null); }, 1200); }
    }
    if (effectiveType === 'sentence-fix') {
      if (choice === fixItem.fixWord) { sound.playCorrect(); addPointRight(); }
      else { sound.playIncorrect(); setRightFroze(true); setWrongRightItem(choice); setTimeout(() => { setRightFroze(false); setWrongRightItem(null); }, 1200); }
    }
    if (effectiveType === 'definition-duel') {
      if (choice === defWord) { sound.playCorrect(); addPointRight(); }
      else { sound.playIncorrect(); setRightFroze(true); setWrongRightItem(choice); setTimeout(() => { setRightFroze(false); setWrongRightItem(null); }, 1200); }
    }
    if (effectiveType === 'word-bomb' && bombFocus === 'right') {
      if (bombRef.current) clearInterval(bombRef.current);
      setBombActive(false);
      if (choice === correct) { sound.playCorrect(); addPointRight(); }
      else { sound.playIncorrect(); addPointLeft(); }
    }
  };

  const handleTF = (side: 'left' | 'right', choice: boolean) => {
    if (side === 'left' && leftFroze) return;
    if (side === 'right' && rightFroze) return;
    if (choice === isTFCorrect) { sound.playCorrect(); if (side === 'left') addPointLeft(); else addPointRight(); }
    else { sound.playIncorrect(); if (side === 'left') { setLeftFroze(true); setTimeout(() => setLeftFroze(false), 1200); } else { setRightFroze(true); setTimeout(() => setRightFroze(false), 1200); } }
  };

  const handleGrammarClash = (side: 'left' | 'right', choice: boolean) => {
    if (side === 'left' && leftFroze) return;
    if (side === 'right' && rightFroze) return;
    if (choice === clashIsCorrect) { sound.playCorrect(); if (side === 'left') addPointLeft(); else addPointRight(); }
    else { sound.playIncorrect(); if (side === 'left') { setLeftFroze(true); setTimeout(() => setLeftFroze(false), 1200); } else { setRightFroze(true); setTimeout(() => setRightFroze(false), 1200); } }
  };

  const tapLeftSpelling = (char: string, index: number) => {
    if (leftFroze) return;
    sound.playTap();
    const target = targetWord.en.toLowerCase();
    const next = [...leftBuiltSent, char];
    setLeftBuiltSent(next);
    const remaining = [...leftOptions]; remaining.splice(index, 1); setLeftOptions(remaining);
    const built = next.join('');
    if (built === target) { sound.playCorrect(); addPointLeft(); }
    else if (!target.startsWith(built)) { sound.playIncorrect(); setLeftFroze(true); setTimeout(() => { setLeftFroze(false); setLeftOptions(target.split('').sort(() => Math.random() - 0.5)); setLeftBuiltSent([]); }, 1000); }
  };

  const tapRightSpelling = (char: string, index: number) => {
    if (rightFroze) return;
    sound.playTap();
    const target = targetWord.en.toLowerCase();
    const next = [...rightBuiltSent, char];
    setRightBuiltSent(next);
    const remaining = [...rightOptions]; remaining.splice(index, 1); setRightOptions(remaining);
    const built = next.join('');
    if (built === target) { sound.playCorrect(); addPointRight(); }
    else if (!target.startsWith(built)) { sound.playIncorrect(); setRightFroze(true); setTimeout(() => { setRightFroze(false); setRightOptions(target.split('').sort(() => Math.random() - 0.5)); setRightBuiltSent([]); }, 1000); }
  };

  const tapLeftSentence = (word: string, index: number) => {
    if (leftFroze || !targetSentence) return;
    sound.playTap();
    const target = targetSentence.full.toLowerCase();
    const next = [...leftBuiltSent, word];
    setLeftBuiltSent(next);
    const sc = [...leftScrambledSent]; sc.splice(index, 1); setLeftScrambledSent(sc);
    const built = next.join(' ').toLowerCase();
    if (built === target) { sound.playCorrect(); addPointLeft(); }
    else if (!target.startsWith(built)) { sound.playIncorrect(); setLeftFroze(true); setTimeout(() => { setLeftFroze(false); setLeftScrambledSent([...targetSentence.scrambled].sort(() => Math.random() - 0.5)); setLeftBuiltSent([]); }, 1250); }
  };

  const tapRightSentence = (word: string, index: number) => {
    if (rightFroze || !targetSentence) return;
    sound.playTap();
    const target = targetSentence.full.toLowerCase();
    const next = [...rightBuiltSent, word];
    setRightBuiltSent(next);
    const sc = [...rightScrambledSent]; sc.splice(index, 1); setRightScrambledSent(sc);
    const built = next.join(' ').toLowerCase();
    if (built === target) { sound.playCorrect(); addPointRight(); }
    else if (!target.startsWith(built)) { sound.playIncorrect(); setRightFroze(true); setTimeout(() => { setRightFroze(false); setRightScrambledSent([...targetSentence.scrambled].sort(() => Math.random() - 0.5)); setRightBuiltSent([]); }, 1250); }
  };

  const gameTitle: Record<string, string> = {
    'word-duel': 'Word Duel ⚔️', 'flashcard-battle': 'Flashcard Battle ⚡',
    'spelling-race': 'Spelling Race 🏎️', 'sentence-duel': 'Sentence Builder 🧱',
    'true-false': 'True-False Clash ⚖️', 'sentence-sprint': 'Sentence Sprint 🏃',
    'phrase-builder': 'Phrase Builder 🧠', 'speed-quiz': 'Speed Quiz 🚀',
    'word-bomb': 'Word Bomb 💣', 'definition-duel': 'Definition Duel 📜',
    'emoji-battle': 'Emoji Battle 🎮', 'grammar-clash': 'Grammar Clash 🔬',
    'synonym-duel': 'Synonym Duel 🔁', 'antonym-duel': 'Antonym Duel 🔃',
    'vocab-blitz': 'Vocab Blitz 🌪️', 'sentence-fix': 'Sentence Fix 🔧',
    'word-race': 'Word Race 🏁', 'analogy-quiz': 'Analogiya Testi 🔗',
  };

  const renderFreezeOverlay = (froze: boolean, wrongItem: string | null) => (
    froze && (
      <div className="absolute inset-x-0 top-14 bottom-0 z-20 bg-slate-950/75 backdrop-blur-[1px] flex items-center justify-center">
        {wrongItem ? (
          <div className="border border-rose-500/20 py-4 px-6 rounded-2xl text-center shadow-xl max-w-xs bg-rose-950/80">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <span className="text-xs font-black text-rose-200 tracking-wider">XATO TAXMIN</span>
            <p className="text-[10px] text-rose-300 mt-1">1.2s taqiqland</p>
          </div>
        ) : (
          <div className="bg-emerald-950/90 border border-emerald-500/20 py-3 px-5 rounded-2xl">
            <span className="text-xs font-black text-emerald-200">YANGI RAUND...</span>
          </div>
        )}
      </div>
    )
  );

  return (
    <div className="w-full h-full flex flex-col items-stretch overflow-hidden select-none">

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-3 px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-30">
        <span className="text-xs font-black font-mono text-zinc-400 uppercase">ROUND {roundNumber.toString().padStart(2, '0')}</span>

        <div className="text-center flex-1 px-4">
          {effectiveType === 'word-duel' && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase font-black">Inglizcha tarjimasini toping:</span>
              <h3 className="text-2xl md:text-3xl font-black text-amber-400 uppercase">{targetWord.uz}</h3>
            </div>
          )}
          {effectiveType === 'flashcard-battle' && (
            revealCountdown > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full animate-bounce">ESLAB QOLING!</span>
                <span className="text-xl font-black text-amber-400 font-mono">{revealCountdown}s</span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-black block">Esladingizmi?</span>
                <h3 className="text-2xl font-black text-cyan-400">{targetWord.uz}</h3>
              </div>
            )
          )}
          {effectiveType === 'true-false' && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block">ROST yoki YOLG'ON?</span>
              <div className="flex items-center justify-center gap-3 bg-slate-950 px-5 py-1.5 rounded-2xl border border-slate-800 mt-1">
                <span className="text-lg font-black text-amber-400 uppercase">{targetWord.en}</span>
                <span className="text-slate-500">=</span>
                <span className="text-lg font-black text-cyan-400">{proposedTranslation}</span>
              </div>
            </div>
          )}
          {effectiveType === 'spelling-race' && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block">Tez yozing:</span>
              <h3 className="text-2xl font-black text-emerald-400 capitalize">{targetWord.uz}</h3>
            </div>
          )}
          {effectiveType === 'sentence-duel' && targetSentence && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block">Gapni inglizcha tuzing:</span>
              <h4 className="text-sm font-bold text-sky-300 italic mt-0.5">"{targetSentence.promptUz}"</h4>
            </div>
          )}
          {effectiveType === 'word-bomb' && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-[10px] text-rose-500 uppercase font-black">BOMBA! Tez javob bering!</span>
              <div className={`text-2xl font-black font-mono ${bombTimer <= 5 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>{bombTimer}s 💣</div>
              <span className="text-[10px] text-slate-400">{bombFocus === 'left' ? `${teamLeft.name} navbati` : `${teamRight.name} navbati`}</span>
            </div>
          )}
          {effectiveType === 'antonym-duel' && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block">
                {gameType === 'analogy-quiz' ? 'Analogiyani to\'ldiring:' : 'Antonimini toping:'}
              </span>
              <h3 className={`font-black text-purple-400 uppercase ${gameType === 'analogy-quiz' ? 'text-xl' : 'text-3xl'}`}>
                {antonymItem.word}
              </h3>
            </div>
          )}
          {effectiveType === 'sentence-fix' && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block">Noto'g'ri so'zni to'g'rilang:</span>
              <p className="text-sm font-bold text-rose-300 mt-0.5">
                {fixItem.wrong.split(' ').map((w, i) => (
                  <span key={i} className={w.replace(/[.,!']/g,'') === fixItem.errorWord || w === fixItem.errorWord ? 'text-rose-400 underline decoration-wavy mx-1' : 'mx-1'}>{w}</span>
                ))}
              </p>
              <p className="text-xs text-slate-400 italic mt-0.5">{fixItem.uz}</p>
            </div>
          )}
          {effectiveType === 'definition-duel' && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block">Bu so'zning o'zbekchasi:</span>
              <h3 className="text-2xl font-black text-amber-400 uppercase">{targetWord.uz}</h3>
            </div>
          )}
          {effectiveType === 'grammar-clash' && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block">Bu gap to'g'rimi yoki noto'g'ri?</span>
              <p className={`text-sm font-bold mt-1 ${clashIsCorrect ? 'text-white' : 'text-rose-300'}`}>"{clashSentence}"</p>
            </div>
          )}
          {effectiveType === 'synonym-duel' && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black block">Inglizcha tarjimasini toping:</span>
              <h3 className="text-2xl font-black text-amber-400 uppercase">{targetWord.uz}</h3>
            </div>
          )}
          {!['word-duel','flashcard-battle','true-false','spelling-race','sentence-duel','word-bomb','antonym-duel','sentence-fix','definition-duel','grammar-clash','synonym-duel'].includes(effectiveType) && gameType !== 'analogy-quiz' && (
            <span className="text-sm font-black text-white">{gameTitle[gameType] || gameType}</span>
          )}
        </div>

        <button onClick={() => { sound.playTap(); nextRound(); }} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-amber-500 hover:bg-slate-800 active:scale-95">
          Skip
        </button>
      </div>

      {/* Split view */}
      <div className="flex-1 grid grid-cols-2 divide-x-4 divide-slate-800 overflow-y-auto">

        {/* LEFT SIDE */}
        <div className="p-4 bg-slate-950/45 flex flex-col justify-between relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-3">
            <h4 className="font-extrabold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide text-xs md:text-sm">
              <span className="text-base">{teamLeft.emoji}</span>{teamLeft.name}
            </h4>
            <div className="text-lg font-black font-mono text-cyan-400 bg-cyan-400/5 px-2.5 py-0.5 rounded border border-cyan-400/20">
              {currentLeftScore} / {maxScore}
            </div>
          </div>

          {renderFreezeOverlay(leftFroze, wrongLeftItem)}

          <div className="my-auto">
            {/* Word Duel / Synonym Duel */}
            {(effectiveType === 'word-duel' || effectiveType === 'synonym-duel') && (
              <div className="grid grid-cols-3 gap-2">
                {leftOptions.map((choice, idx) => (
                  <button key={`${choice}-${idx}`} onClick={() => handleLeftClick(choice)} disabled={leftFroze}
                    className={`py-3 px-1 rounded-xl text-center uppercase font-bold text-[10px] md:text-xs tracking-wide active:scale-95 transition-all border min-h-[48px] cursor-pointer ${choice === wrongLeftItem ? 'bg-rose-600 border-rose-500 text-white line-through' : 'bg-slate-900 border-slate-850 text-slate-300 hover:border-cyan-500 hover:text-white'}`}>
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {/* Flashcard Battle */}
            {effectiveType === 'flashcard-battle' && (
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                {leftOptions.map((choice, idx) => (
                  <button key={`${choice}-${idx}`} onClick={() => handleLeftClick(choice)} disabled={leftFroze || revealCountdown > 0}
                    className={`p-5 min-h-[90px] rounded-2xl text-center font-extrabold text-xs border transition-all flex flex-col items-center justify-center cursor-pointer ${choice === wrongLeftItem ? 'bg-rose-600 border-rose-500 text-white line-through' : revealCountdown > 0 ? 'bg-amber-950/40 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-cyan-500 hover:text-cyan-400'}`}>
                    {revealCountdown > 0 ? <><span className="text-2xl">🎴</span><span className="text-[10px] text-slate-400">Karta {idx+1}</span></> : <span className="uppercase">{choice}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* True False */}
            {effectiveType === 'true-false' && (
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button onClick={() => handleTF('left', true)} disabled={leftFroze} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-emerald-400 cursor-pointer flex items-center justify-center gap-2">✅ ROST (TRUE)</button>
                <button onClick={() => handleTF('left', false)} disabled={leftFroze} className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-rose-400 cursor-pointer flex items-center justify-center gap-2">❌ YOLG'ON (FALSE)</button>
              </div>
            )}

            {/* Grammar Clash */}
            {effectiveType === 'grammar-clash' && (
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button onClick={() => handleGrammarClash('left', true)} disabled={leftFroze} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-emerald-400 cursor-pointer flex items-center justify-center gap-2">✅ TO'G'RI (CORRECT)</button>
                <button onClick={() => handleGrammarClash('left', false)} disabled={leftFroze} className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-rose-400 cursor-pointer flex items-center justify-center gap-2">❌ NOTO'G'RI (WRONG)</button>
              </div>
            )}

            {/* Spelling Race */}
            {effectiveType === 'spelling-race' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl min-h-[50px] flex justify-center items-center gap-1.5">
                  {leftBuiltSent.map((l, i) => (
                    <div key={i} className="w-8 h-9 rounded bg-cyan-500/10 border border-cyan-500 text-cyan-300 font-extrabold uppercase flex items-center justify-center text-sm">{l}</div>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {leftOptions.map((letter, idx) => (
                    <button key={`${letter}-${idx}`} onClick={() => tapLeftSpelling(letter, idx)} disabled={leftFroze} className="w-11 h-11 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white hover:text-cyan-400 font-black uppercase text-sm rounded-xl transition-all active:scale-90 cursor-pointer">
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sentence Duel */}
            {effectiveType === 'sentence-duel' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl min-h-[60px] flex flex-wrap gap-1.5 items-center justify-center">
                  {leftBuiltSent.length === 0 ? <span className="text-[10px] text-slate-500 italic">So'zlarni bosing...</span> :
                    leftBuiltSent.map((word, idx) => <span key={idx} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2 py-1 rounded text-xs font-semibold uppercase">{word}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {leftScrambledSent.map((word, idx) => (
                    <button key={`${word}-${idx}`} onClick={() => tapLeftSentence(word, idx)} disabled={leftFroze} className="px-3 py-2 bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl active:scale-95 cursor-pointer uppercase hover:border-cyan-500">
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Word Bomb */}
            {effectiveType === 'word-bomb' && (
              <div className={`${bombFocus !== 'left' ? 'opacity-30 pointer-events-none' : ''}`}>
                <p className="text-xs text-center text-amber-400 font-bold mb-3">
                  {bombFocus === 'left' ? '⚡ Sizning navbatingiz!' : '⏳ Kutmoqda...'}
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                  {leftOptions.map((opt, i) => (
                    <button key={i} onClick={() => handleLeftClick(opt)} disabled={leftFroze || bombFocus !== 'left' || !bombActive}
                      className="py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-white font-extrabold text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Antonym Duel */}
            {effectiveType === 'antonym-duel' && (
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                {antonymOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleLeftClick(opt)} disabled={leftFroze}
                    className={`py-4 rounded-xl border font-extrabold text-sm uppercase transition-all cursor-pointer active:scale-95 ${opt === wrongLeftItem ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 hover:border-purple-500 text-white hover:text-purple-400'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Sentence Fix */}
            {effectiveType === 'sentence-fix' && (
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                {fixOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleLeftClick(opt)} disabled={leftFroze}
                    className={`py-4 rounded-xl border font-extrabold text-sm uppercase transition-all cursor-pointer active:scale-95 ${opt === wrongLeftItem ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 hover:border-emerald-500 text-white hover:text-emerald-400'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Definition Duel */}
            {effectiveType === 'definition-duel' && (
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                {defOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleLeftClick(opt)} disabled={leftFroze}
                    className={`py-4 rounded-xl border font-extrabold text-sm uppercase transition-all cursor-pointer active:scale-95 ${opt === wrongLeftItem ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 hover:border-amber-500 text-white'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-1.5 border-t border-slate-900 text-center font-mono text-[9px] text-slate-600">INPUT_A</div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-4 bg-slate-950/45 flex flex-col justify-between relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-3">
            <h4 className="font-extrabold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide text-xs md:text-sm">
              <span className="text-base">{teamRight.emoji}</span>{teamRight.name}
            </h4>
            <div className="text-lg font-black font-mono text-rose-400 bg-rose-400/5 px-2.5 py-0.5 rounded border border-rose-400/20">
              {currentRightScore} / {maxScore}
            </div>
          </div>

          {renderFreezeOverlay(rightFroze, wrongRightItem)}

          <div className="my-auto">
            {/* Word Duel / Synonym Duel */}
            {(effectiveType === 'word-duel' || effectiveType === 'synonym-duel') && (
              <div className="grid grid-cols-3 gap-2">
                {rightOptions.map((choice, idx) => (
                  <button key={`${choice}-${idx}`} onClick={() => handleRightClick(choice)} disabled={rightFroze}
                    className={`py-3 px-1 rounded-xl text-center uppercase font-bold text-[10px] md:text-xs tracking-wide active:scale-95 transition-all border min-h-[48px] cursor-pointer ${choice === wrongRightItem ? 'bg-rose-600 border-rose-500 text-white line-through' : 'bg-slate-900 border-slate-850 text-slate-300 hover:border-rose-500 hover:text-white'}`}>
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {/* Flashcard Battle */}
            {effectiveType === 'flashcard-battle' && (
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                {rightOptions.map((choice, idx) => (
                  <button key={`${choice}-${idx}`} onClick={() => handleRightClick(choice)} disabled={rightFroze || revealCountdown > 0}
                    className={`p-5 min-h-[90px] rounded-2xl text-center font-extrabold text-xs border transition-all flex flex-col items-center justify-center cursor-pointer ${choice === wrongRightItem ? 'bg-rose-600 border-rose-500 text-white line-through' : revealCountdown > 0 ? 'bg-amber-950/40 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-rose-500 hover:text-rose-400'}`}>
                    {revealCountdown > 0 ? <><span className="text-2xl">🎴</span><span className="text-[10px] text-slate-400">Karta {idx+1}</span></> : <span className="uppercase">{choice}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* True False */}
            {effectiveType === 'true-false' && (
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button onClick={() => handleTF('right', true)} disabled={rightFroze} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-emerald-400 cursor-pointer flex items-center justify-center gap-2">✅ ROST (TRUE)</button>
                <button onClick={() => handleTF('right', false)} disabled={rightFroze} className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-rose-400 cursor-pointer flex items-center justify-center gap-2">❌ YOLG'ON (FALSE)</button>
              </div>
            )}

            {/* Grammar Clash */}
            {effectiveType === 'grammar-clash' && (
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button onClick={() => handleGrammarClash('right', true)} disabled={rightFroze} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-emerald-400 cursor-pointer flex items-center justify-center gap-2">✅ TO'G'RI (CORRECT)</button>
                <button onClick={() => handleGrammarClash('right', false)} disabled={rightFroze} className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-sm uppercase rounded-2xl active:scale-95 border border-rose-400 cursor-pointer flex items-center justify-center gap-2">❌ NOTO'G'RI (WRONG)</button>
              </div>
            )}

            {/* Spelling Race */}
            {effectiveType === 'spelling-race' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl min-h-[50px] flex justify-center items-center gap-1.5">
                  {rightBuiltSent.map((l, i) => (
                    <div key={i} className="w-8 h-9 rounded bg-rose-500/10 border border-rose-500 text-rose-300 font-extrabold uppercase flex items-center justify-center text-sm">{l}</div>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {rightOptions.map((letter, idx) => (
                    <button key={`${letter}-${idx}`} onClick={() => tapRightSpelling(letter, idx)} disabled={rightFroze} className="w-11 h-11 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white hover:text-rose-400 font-black uppercase text-sm rounded-xl transition-all active:scale-90 cursor-pointer">
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sentence Duel */}
            {effectiveType === 'sentence-duel' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl min-h-[60px] flex flex-wrap gap-1.5 items-center justify-center">
                  {rightBuiltSent.length === 0 ? <span className="text-[10px] text-slate-500 italic">So'zlarni bosing...</span> :
                    rightBuiltSent.map((word, idx) => <span key={idx} className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-2 py-1 rounded text-xs font-semibold uppercase">{word}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {rightScrambledSent.map((word, idx) => (
                    <button key={`${word}-${idx}`} onClick={() => tapRightSentence(word, idx)} disabled={rightFroze} className="px-3 py-2 bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl active:scale-95 cursor-pointer uppercase hover:border-rose-500">
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Word Bomb */}
            {effectiveType === 'word-bomb' && (
              <div className={`${bombFocus !== 'right' ? 'opacity-30 pointer-events-none' : ''}`}>
                <p className="text-xs text-center text-amber-400 font-bold mb-3">
                  {bombFocus === 'right' ? '⚡ Sizning navbatingiz!' : '⏳ Kutmoqda...'}
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                  {rightOptions.map((opt, i) => (
                    <button key={i} onClick={() => handleRightClick(opt)} disabled={rightFroze || bombFocus !== 'right' || !bombActive}
                      className="py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-white font-extrabold text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Antonym Duel */}
            {effectiveType === 'antonym-duel' && (
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                {antonymOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleRightClick(opt)} disabled={rightFroze}
                    className={`py-4 rounded-xl border font-extrabold text-sm uppercase transition-all cursor-pointer active:scale-95 ${opt === wrongRightItem ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 hover:border-purple-500 text-white hover:text-purple-400'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Sentence Fix */}
            {effectiveType === 'sentence-fix' && (
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                {fixOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleRightClick(opt)} disabled={rightFroze}
                    className={`py-4 rounded-xl border font-extrabold text-sm uppercase transition-all cursor-pointer active:scale-95 ${opt === wrongRightItem ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 hover:border-emerald-500 text-white hover:text-emerald-400'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Definition Duel */}
            {effectiveType === 'definition-duel' && (
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                {defOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleRightClick(opt)} disabled={rightFroze}
                    className={`py-4 rounded-xl border font-extrabold text-sm uppercase transition-all cursor-pointer active:scale-95 ${opt === wrongRightItem ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 hover:border-amber-500 text-white'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-1.5 border-t border-slate-900 text-center font-mono text-[9px] text-slate-600">INPUT_B</div>
        </div>
      </div>
    </div>
  );
}
