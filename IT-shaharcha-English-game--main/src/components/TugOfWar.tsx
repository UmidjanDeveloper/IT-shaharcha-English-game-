import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, Team, WordPair } from '../types';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Swords, Sparkles, AlertCircle, Trophy, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TugOfWarProps {
  teamLeft: Team;
  teamRight: Team;
  wordList: WordPair[];
  selectedDifficulty?: GameDifficulty;
  onGameWin: (winner: Team) => void;
  onUpdateScore: (leftScore: number, rightScore: number) => void;
}

const EASY_WORDS: WordPair[] = [
  { uz: 'Rivojlantirmoq', en: 'Develop' }, { uz: 'Taqdim etmoq', en: 'Present' },
  { uz: 'Tushunmoq', en: 'Understand' }, { uz: 'Imkoniyat', en: 'Opportunity' },
  { uz: 'Tajriba', en: 'Experience' }, { uz: 'Sayohat qilmoq', en: 'Travel' },
  { uz: 'Harakat qilmoq', en: 'Attempt' }, { uz: 'Zaruriy', en: 'Necessary' },
  { uz: 'Qaror qabul qilmoq', en: 'Decide' }, { uz: 'Yaxshilamoq', en: 'Improve' },
  { uz: 'Muallif', en: 'Author' }, { uz: 'Kashf qilmoq', en: 'Discover' },
  { uz: 'Maslahat bermoq', en: 'Advise' }, { uz: 'Niyat', en: 'Purpose' },
  { uz: 'Erishmoq', en: 'Achieve' }, { uz: 'Ta\'sir qilmoq', en: 'Influence' },
  { uz: 'Tavsiya qilmoq', en: 'Recommend' }, { uz: 'G\'alaba', en: 'Victory' },
  { uz: 'Tasvirlamoq', en: 'Describe' }, { uz: 'Solishtirmoq', en: 'Compare' },
];
const MEDIUM_WORDS: WordPair[] = [
  { uz: 'Tergov qilmoq', en: 'Investigate' }, { uz: 'Cheklamoq', en: 'Restrict' },
  { uz: 'Tashvishlanish', en: 'Anxiety' }, { uz: 'Isbotlamoq', en: 'Verify' },
  { uz: 'Samarali', en: 'Efficient' }, { uz: 'Ilhomlantirmoq', en: 'Inspire' },
  { uz: 'Moslashmoq', en: 'Adapt' }, { uz: 'Ziddiyat', en: 'Conflict' },
  { uz: 'Raqobatlashmoq', en: 'Compete' }, { uz: 'Kafolatlamoq', en: 'Guarantee' },
  { uz: 'Foyda keltiradigan', en: 'Beneficial' }, { uz: 'Faraz qilmoq', en: 'Assume' },
  { uz: 'Xabardorlik', en: 'Awareness' }, { uz: 'Hissa qo\'shmoq', en: 'Contribute' },
  { uz: 'Baholash', en: 'Assessment' }, { uz: 'Hamkorlik qilmoq', en: 'Collaborate' },
  { uz: 'Izchil', en: 'Consistent' }, { uz: 'Kengaytirish', en: 'Expand' },
  { uz: 'Tahlil qilmoq', en: 'Analyze' }, { uz: 'Tasdiqlamoq', en: 'Confirm' },
];
const HARD_WORDS: WordPair[] = [
  { uz: 'Hamma joyda mavjud', en: 'Ubiquitous' }, { uz: 'Fikrlash tarzi', en: 'Paradigm' },
  { uz: 'Xulosa chiqarmoq', en: 'Extrapolate' }, { uz: 'Yarashtirish', en: 'Reconcile' },
  { uz: 'Yonma-yon qo\'yish', en: 'Juxtapose' }, { uz: 'Vazminlik', en: 'Equanimity' },
  { uz: 'Murakkab jumboq', en: 'Conundrum' }, { uz: 'Maqtovga loyiq', en: 'Meritorious' },
  { uz: 'Dalillar bilan isbotlamoq', en: 'Substantiate' }, { uz: 'O\'tkinchi', en: 'Ephemeral' },
  { uz: 'Pinhona', en: 'Surreptitious' }, { uz: 'Zerikarli', en: 'Monotonous' },
  { uz: 'Chuqur bilim', en: 'Erudition' }, { uz: 'Eng yuqori cho\'qqi', en: 'Zenith' },
  { uz: 'Mavhum', en: 'Obscure' }, { uz: 'Chechanlik', en: 'Eloquence' },
  { uz: 'Chidamli', en: 'Resilient' }, { uz: 'Inkor etib bo\'lmaydigan', en: 'Irrefutable' },
  { uz: 'Amaliy', en: 'Pragmatic' }, { uz: 'G\'ayratli', en: 'Assiduous' },
];

type Difficulty = 'easy' | 'medium' | 'hard' | 'custom';
type CharState = 'idle' | 'pulling' | 'slipping' | 'won' | 'lost';

// --- Confetti ---
const CONFETTI_COLORS = ['#f59e0b','#10b981','#3b82f6','#ef4444','#a855f7','#ec4899','#fff'];
const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 1.5,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + Math.random() * 8,
  rotation: Math.random() * 360,
}));

export default function TugOfWar({ teamLeft, teamRight, wordList, selectedDifficulty, onGameWin, onUpdateScore }: TugOfWarProps) {
  const [phase, setPhase] = useState<'difficulty' | 'battle' | 'ended'>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>(
    selectedDifficulty === 'beginner' ? 'easy' : selectedDifficulty === 'advanced' ? 'hard' : 'medium'
  );
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [ropePosition, setRopePosition] = useState(0);
  const WIN_THRESHOLD = 12;
  const [activeWords, setActiveWords] = useState<WordPair[]>(MEDIUM_WORDS);
  const [leftWord, setLeftWord] = useState<WordPair>(MEDIUM_WORDS[0]);
  const [leftOptions, setLeftOptions] = useState<string[]>([]);
  const [leftFrozen, setLeftFrozen] = useState(false);
  const [rightWord, setRightWord] = useState<WordPair>(MEDIUM_WORDS[1]);
  const [rightOptions, setRightOptions] = useState<string[]>([]);
  const [rightFrozen, setRightFrozen] = useState(false);
  const [isLeftPulling, setIsLeftPulling] = useState(false);
  const [isRightPulling, setIsRightPulling] = useState(false);
  const [arenaShake, setArenaShake] = useState(false);
  const [leftSuccessStreak, setLeftSuccessStreak] = useState(0);
  const [rightSuccessStreak, setRightSuccessStreak] = useState(0);
  const [isLeftSlipping, setIsLeftSlipping] = useState(false);
  const [isRightSlipping, setIsRightSlipping] = useState(false);
  const [leftRemainingPool, setLeftRemainingPool] = useState<WordPair[]>([]);
  const [rightRemainingPool, setRightRemainingPool] = useState<WordPair[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leftFloatEffects, setLeftFloatEffects] = useState<{ id: number; text: string }[]>([]);
  const [rightFloatEffects, setRightFloatEffects] = useState<{ id: number; text: string }[]>([]);
  const musicRef = useRef<HTMLIFrameElement>(null);

  const ytCommand = (func: string, args: unknown[] = []) => {
    musicRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  };

  useEffect(() => {
    return () => { try { if (musicRef.current) musicRef.current.src = 'about:blank'; } catch {} };
  }, []);

  useEffect(() => {
    if (phase === 'battle' && isMusicPlaying) {
      ytCommand('unMute'); ytCommand('setVolume', [80]);
      const t = setTimeout(() => { ytCommand('unMute'); ytCommand('setVolume', [80]); }, 800);
      return () => clearTimeout(t);
    }
    if (phase === 'ended') ytCommand('mute');
  }, [phase]);

  useEffect(() => {
    if (isMusicPlaying && phase === 'battle') { ytCommand('unMute'); ytCommand('setVolume', [80]); ytCommand('playVideo'); }
    else ytCommand('mute');
  }, [isMusicPlaying]);

  useEffect(() => {
    if (phase === 'difficulty' && selectedDifficulty && selectedDifficulty !== 'custom') {
      const d = selectedDifficulty === 'beginner' ? 'easy' : selectedDifficulty === 'advanced' ? 'hard' : 'medium';
      handleStartBattle(d);
    }
  }, [selectedDifficulty]);

  const handleStartBattle = (d: Difficulty) => {
    sound.playCorrect(); setDifficulty(d);
    let words = MEDIUM_WORDS;
    if (d === 'easy') words = EASY_WORDS;
    if (d === 'hard') words = HARD_WORDS;
    if (d === 'custom' && wordList?.length > 0) words = wordList;
    setActiveWords(words); setPhase('battle');
    const sl = [...words].sort(() => Math.random() - 0.5);
    const sr = [...words].sort(() => Math.random() - 0.5);
    generateQ('left', words, sl); generateQ('right', words, sr);
  };

  const generateQ = (team: 'left' | 'right', pool: WordPair[], current: WordPair[]) => {
    let active = [...current];
    if (active.length === 0) active = [...pool].sort(() => Math.random() - 0.5);
    const item = active.pop()!;
    const dist = pool.filter(w => w.en !== item.en).map(w => w.en).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [item.en, ...dist].sort(() => Math.random() - 0.5);
    if (team === 'left') { setLeftRemainingPool(active); setLeftWord(item); setLeftOptions(opts); }
    else { setRightRemainingPool(active); setRightWord(item); setRightOptions(opts); }
  };

  const handleLeftAnswer = (opt: string) => {
    if (leftFrozen || phase !== 'battle') return;
    if (opt === leftWord.en) {
      sound.playCorrect();
      const streak = leftSuccessStreak + 1; setLeftSuccessStreak(streak);
      setIsLeftPulling(true); setArenaShake(true);
      setTimeout(() => setIsLeftPulling(false), 600);
      setTimeout(() => setArenaShake(false), 300);
      const force = streak >= 2 ? 1.5 : 1;
      const txt = streak >= 2 ? `🔥 COMBO x${streak}!` : '💪 TO\'G\'RI!';
      setLeftFloatEffects(p => [...p, { id: Date.now(), text: txt }]);
      setTimeout(() => setLeftFloatEffects(p => p.slice(1)), 1500);
      const next = Math.max(-WIN_THRESHOLD, ropePosition - force);
      setRopePosition(next);
      if (next <= -WIN_THRESHOLD) { handleEndGame('left'); }
      else { generateQ('left', activeWords, leftRemainingPool); }
    } else {
      sound.playIncorrect(); setLeftSuccessStreak(0);
      setLeftFrozen(true); setIsLeftSlipping(true);
      setLeftFloatEffects(p => [...p, { id: Date.now(), text: '😱 XATO!' }]);
      setTimeout(() => setLeftFloatEffects(p => p.slice(1)), 1500);
      const next = Math.min(WIN_THRESHOLD, ropePosition + 3);
      setRopePosition(next);
      if (next >= WIN_THRESHOLD) { handleEndGame('right'); }
      else { setTimeout(() => { setLeftFrozen(false); setIsLeftSlipping(false); generateQ('left', activeWords, leftRemainingPool); }, 1500); }
    }
  };

  const handleRightAnswer = (opt: string) => {
    if (rightFrozen || phase !== 'battle') return;
    if (opt === rightWord.en) {
      sound.playCorrect();
      const streak = rightSuccessStreak + 1; setRightSuccessStreak(streak);
      setIsRightPulling(true); setArenaShake(true);
      setTimeout(() => setIsRightPulling(false), 600);
      setTimeout(() => setArenaShake(false), 300);
      const force = streak >= 2 ? 1.5 : 1;
      const txt = streak >= 2 ? `🔥 COMBO x${streak}!` : '💪 TO\'G\'RI!';
      setRightFloatEffects(p => [...p, { id: Date.now(), text: txt }]);
      setTimeout(() => setRightFloatEffects(p => p.slice(1)), 1500);
      const next = Math.min(WIN_THRESHOLD, ropePosition + force);
      setRopePosition(next);
      if (next >= WIN_THRESHOLD) { handleEndGame('right'); }
      else { generateQ('right', activeWords, rightRemainingPool); }
    } else {
      sound.playIncorrect(); setRightSuccessStreak(0);
      setRightFrozen(true); setIsRightSlipping(true);
      setRightFloatEffects(p => [...p, { id: Date.now(), text: '😱 XATO!' }]);
      setTimeout(() => setRightFloatEffects(p => p.slice(1)), 1500);
      const next = Math.max(-WIN_THRESHOLD, ropePosition - 3);
      setRopePosition(next);
      if (next <= -WIN_THRESHOLD) { handleEndGame('left'); }
      else { setTimeout(() => { setRightFrozen(false); setIsRightSlipping(false); generateQ('right', activeWords, rightRemainingPool); }, 1500); }
    }
  };

  const handleEndGame = (side: 'left' | 'right') => {
    setPhase('ended'); sound.playWin(); setShowConfetti(true);
    onUpdateScore(side === 'left' ? WIN_THRESHOLD : 0, side === 'right' ? WIN_THRESHOLD : 0);
    setTimeout(() => { onGameWin(side === 'left' ? { ...teamLeft, score: WIN_THRESHOLD } : { ...teamRight, score: WIN_THRESHOLD }); }, 5000);
  };

  const winnerSide = phase === 'ended' ? (ropePosition <= -WIN_THRESHOLD ? 'left' : 'right') : null;
  const getPercent = () => ((ropePosition + WIN_THRESHOLD) / (WIN_THRESHOLD * 2)) * 100;

  // ─── BEAUTIFUL CHARACTER RENDERER ───
  const renderCharacter = (team: 'left' | 'right', baseX: number, charState: CharState) => {
    const isLeft = team === 'left';
    const shirtColor  = isLeft ? '#1d4ed8' : '#b91c1c';
    const shirtLight  = isLeft ? '#60a5fa' : '#f87171';
    const shirtDark   = isLeft ? '#1e40af' : '#991b1b';
    const pantsColor  = isLeft ? '#1e3a5f' : '#450a0a';
    const shoeColor   = '#0f172a';
    const skinColor   = '#fcd9a0';
    const skinDark    = '#f59e0b';
    const hairColor   = '#1c0a00';
    const cheekColor  = isLeft ? '#bfdbfe' : '#fecaca';

    // Pose parameters
    let lean = isLeft ? -6 : 6;
    let offY = 0;
    if (charState === 'pulling')  { lean = isLeft ? -22 : 22; offY = 6; }
    if (charState === 'slipping') { lean = isLeft ? 26 : -26; offY = -4; }
    if (charState === 'won')      { lean = 0; offY = -14; }
    if (charState === 'lost')     { lean = isLeft ? 14 : -14; offY = 10; }

    const GY   = 288;            // ground y
    const hx   = baseX + lean * 0.65;
    const headY = GY - 155 + offY;
    const shouldY = headY + 36;
    const waistY  = shouldY + 52;
    const footY   = GY - 2;

    const f1x = baseX + (isLeft ? -20 : 20) + (charState === 'slipping' ? (isLeft ? 22 : -22) : 0);
    const f2x = baseX + (isLeft ?   8 : -8) + (charState === 'slipping' ? (isLeft ? 16 : -16) : 0);

    // Arm toward rope
    const ropeSide = isLeft ? 1 : -1;
    const pullExtra = charState === 'pulling' ? ropeSide * 14 : 0;
    const armEndX   = baseX + ropeSide * 58 + pullExtra;
    const armEndY   = shouldY + 22;

    // ---- FACE EXPRESSIONS ----
    const el = hx - 8, er = hx + 8, eyY = headY + 4;

    let eyeL: React.ReactNode, eyeR: React.ReactNode, mouthEl: React.ReactNode;
    let browL: React.ReactNode, browR: React.ReactNode;
    let extras: React.ReactNode = null;

    if (charState === 'won') {
      // BIG SMILE, happy closed eyes ^.^
      eyeL = <path d={`M ${el-6} ${eyY+1} Q ${el} ${eyY-7} ${el+6} ${eyY+1}`} stroke="#0f172a" strokeWidth="2.8" fill="none" strokeLinecap="round" />;
      eyeR = <path d={`M ${er-6} ${eyY+1} Q ${er} ${eyY-7} ${er+6} ${eyY+1}`} stroke="#0f172a" strokeWidth="2.8" fill="none" strokeLinecap="round" />;
      mouthEl = <path d={`M ${hx-12} ${headY+14} Q ${hx} ${headY+25} ${hx+12} ${headY+14}`} stroke="#0f172a" strokeWidth="2.5" fill="#ff9999" strokeLinecap="round" />;
      browL = <path d={`M ${el-7} ${eyY-12} Q ${el} ${eyY-17} ${el+7} ${eyY-12}`} stroke="#0f172a" strokeWidth="2.2" fill="none" />;
      browR = <path d={`M ${er-7} ${eyY-12} Q ${er} ${eyY-17} ${er+7} ${eyY-12}`} stroke="#0f172a" strokeWidth="2.2" fill="none" />;
      extras = <>
        <ellipse cx={hx-16} cy={headY+10} rx="6" ry="4" fill={cheekColor} opacity="0.7" />
        <ellipse cx={hx+16} cy={headY+10} rx="6" ry="4" fill={cheekColor} opacity="0.7" />
        <text x={hx-30} y={headY-28} fontSize="18">⭐</text>
        <text x={hx+12} y={headY-32} fontSize="16">🎉</text>
        <text x={hx-9} y={headY-40} fontSize="22">🏆</text>
      </>;
    } else if (charState === 'lost') {
      // SAD FACE with tears :(
      eyeL = <ellipse cx={el} cy={eyY+2} rx="5" ry="5.5" fill="#334155" />;
      eyeR = <ellipse cx={er} cy={eyY+2} rx="5" ry="5.5" fill="#334155" />;
      mouthEl = <path d={`M ${hx-10} ${headY+18} Q ${hx} ${headY+12} ${hx+10} ${headY+18}`} stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      browL = <path d={`M ${el-6} ${eyY-9} Q ${el} ${eyY-5} ${el+6} ${eyY-9}`} stroke="#0f172a" strokeWidth="2.2" fill="none" />;
      browR = <path d={`M ${er-6} ${eyY-9} Q ${er} ${eyY-5} ${er+6} ${eyY-9}`} stroke="#0f172a" strokeWidth="2.2" fill="none" />;
      extras = <>
        {/* Tears */}
        <ellipse cx={el+2} cy={eyY+12} rx="2.5" ry="4" fill="#93c5fd" opacity="0.85" />
        <ellipse cx={el+3} cy={eyY+18} rx="2" ry="3" fill="#93c5fd" opacity="0.6" />
        <ellipse cx={er-2} cy={eyY+11} rx="2.5" ry="4" fill="#93c5fd" opacity="0.85" />
        <text x={hx-10} y={headY-24} fontSize="20">😢</text>
      </>;
    } else if (charState === 'pulling') {
      // GRITTED TEETH, squinting
      eyeL = <path d={`M ${el-6} ${eyY+3} L ${el+6} ${eyY+3}`} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />;
      eyeR = <path d={`M ${er-6} ${eyY+3} L ${er+6} ${eyY+3}`} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />;
      mouthEl = <>
        <path d={`M ${hx-9} ${headY+14} L ${hx+9} ${headY+14}`} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        {[-7,-3,1,5].map((ox,i)=>(
          <line key={i} x1={hx+ox} y1={headY+12} x2={hx+ox} y2={headY+16} stroke="#fff" strokeWidth="1.5"/>
        ))}
      </>;
      browL = <path d={`M ${el-6} ${eyY-10} L ${el+6} ${eyY-7}`} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />;
      browR = <path d={`M ${er-6} ${eyY-7} L ${er+6} ${eyY-10}`} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />;
      extras = <>
        {/* Effort lines */}
        <line x1={hx + (isLeft?-28:28)} y1={headY-20} x2={hx + (isLeft?-38:38)} y2={headY-28} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
        <line x1={hx + (isLeft?-26:26)} y1={headY-8}  x2={hx + (isLeft?-38:38)} y2={headY-10} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
        {/* Sweat drops */}
        <ellipse cx={hx+(isLeft?24:-24)} cy={headY-5} rx="2.5" ry="4" fill="#7dd3fc" opacity="0.8" />
      </>;
    } else if (charState === 'slipping') {
      // SHOCKED O.O
      eyeL = <><circle cx={el} cy={eyY} r="7" fill="white" stroke="#0f172a" strokeWidth="1.5"/><circle cx={el+1.5} cy={eyY} r="3.5" fill="#0f172a"/></>;
      eyeR = <><circle cx={er} cy={eyY} r="7" fill="white" stroke="#0f172a" strokeWidth="1.5"/><circle cx={er-1.5} cy={eyY} r="3.5" fill="#0f172a"/></>;
      mouthEl = <ellipse cx={hx} cy={headY+16} rx="7" ry="8" fill="#0f172a" />;
      browL = <path d={`M ${el-6} ${eyY-13} Q ${el} ${eyY-18} ${el+6} ${eyY-13}`} stroke="#0f172a" strokeWidth="2.5" fill="none" />;
      browR = <path d={`M ${er-6} ${eyY-13} Q ${er} ${eyY-18} ${er+6} ${eyY-13}`} stroke="#0f172a" strokeWidth="2.5" fill="none" />;
      extras = <>
        <text x={hx-8} y={headY-28} fontSize="18">😱</text>
        <ellipse cx={hx+(isLeft?30:-30)} cy={headY} rx="3" ry="5" fill="#7dd3fc" opacity="0.7" />
        <ellipse cx={hx+(isLeft?22:-22)} cy={headY-10} rx="2" ry="4" fill="#7dd3fc" opacity="0.6" />
      </>;
    } else {
      // IDLE – determined ready face
      eyeL = <><ellipse cx={el} cy={eyY+1} rx="5" ry="6" fill="white" stroke="#0f172a" strokeWidth="1"/><circle cx={el+(isLeft?.5:-.5)} cy={eyY+1} r="3" fill="#0f172a"/><circle cx={el+(isLeft?.5:-.5)+1} cy={eyY-1} r="1" fill="white"/></>;
      eyeR = <><ellipse cx={er} cy={eyY+1} rx="5" ry="6" fill="white" stroke="#0f172a" strokeWidth="1"/><circle cx={er+(isLeft?.5:-.5)} cy={eyY+1} r="3" fill="#0f172a"/><circle cx={er+(isLeft?.5:-.5)+1} cy={eyY-1} r="1" fill="white"/></>;
      mouthEl = <path d={`M ${hx-7} ${headY+14} Q ${hx} ${headY+19} ${hx+7} ${headY+14}`} stroke="#0f172a" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      browL = <path d={`M ${el-6} ${eyY-10} L ${el+6} ${eyY-8}`} stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />;
      browR = <path d={`M ${er-6} ${eyY-8} L ${er+6} ${eyY-10}`} stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />;
      extras = <>
        <ellipse cx={hx-16} cy={headY+11} rx="5" ry="3.5" fill={cheekColor} opacity="0.55" />
        <ellipse cx={hx+16} cy={headY+11} rx="5" ry="3.5" fill={cheekColor} opacity="0.55" />
      </>;
    }

    return (
      <g key={`${team}-${baseX}`}>
        {/* Shadow */}
        <ellipse cx={baseX} cy={GY+7} rx="24" ry="6" fill="rgba(0,0,0,0.22)" />

        {/* LEGS */}
        {charState === 'won' ? (
          <>
            <line x1={baseX-6} y1={waistY} x2={baseX-28} y2={GY-16} stroke={pantsColor} strokeWidth="14" strokeLinecap="round"/>
            <line x1={baseX+6} y1={waistY} x2={baseX+28} y2={GY-10} stroke={pantsColor} strokeWidth="14" strokeLinecap="round"/>
            <ellipse cx={baseX-26} cy={GY-12} rx="12" ry="6" fill={shoeColor} />
            <ellipse cx={baseX+26} cy={GY-6}  rx="12" ry="6" fill={shoeColor} />
          </>
        ) : (
          <>
            <line x1={baseX-5} y1={waistY} x2={f1x} y2={footY} stroke={pantsColor} strokeWidth="14" strokeLinecap="round"/>
            <line x1={baseX+5} y1={waistY} x2={f2x} y2={footY} stroke={pantsColor} strokeWidth="14" strokeLinecap="round"/>
            {/* Shoe highlight */}
            <ellipse cx={f1x} cy={footY+5} rx="14" ry="6" fill={shoeColor} />
            <ellipse cx={f2x} cy={footY+5} rx="14" ry="6" fill={shoeColor} />
            <ellipse cx={f1x+(isLeft?2:-2)} cy={footY+2} rx="6" ry="2.5" fill="#334155" />
            <ellipse cx={f2x+(isLeft?2:-2)} cy={footY+2} rx="6" ry="2.5" fill="#334155" />
          </>
        )}

        {/* BODY / SHIRT */}
        <path d={`M ${hx-20} ${shouldY} L ${hx+20} ${shouldY} L ${baseX+15} ${waistY} L ${baseX-15} ${waistY} Z`}
          fill={shirtColor} stroke={shirtDark} strokeWidth="1.2" />
        {/* Collar */}
        <path d={`M ${hx-9} ${shouldY} L ${hx} ${shouldY+13} L ${hx+9} ${shouldY}`} fill={shirtLight} opacity="0.5" />
        {/* Shirt shine */}
        <path d={`M ${hx-16} ${shouldY+4} L ${hx-14} ${shouldY+30} L ${hx-8} ${shouldY+30} L ${hx-10} ${shouldY+4} Z`}
          fill="white" opacity="0.08" />
        {/* Number on shirt */}
        <text x={hx} y={shouldY+34} fontSize="13" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.85">
          {isLeft ? teamLeft.emoji : teamRight.emoji}
        </text>

        {/* BELT */}
        <rect x={baseX-16} y={waistY-7} width="32" height="9" rx="3" fill="#92400e" stroke="#78350f" strokeWidth="1"/>
        <rect x={baseX-5} y={waistY-7} width="10" height="9" rx="2" fill="#ca8a04"/>
        <rect x={baseX-2} y={waistY-5} width="4" height="5" rx="1" fill="#fbbf24"/>

        {/* PULLING ARM (toward rope) */}
        {charState === 'won' ? (
          <>
            <line x1={hx-16} y1={shouldY+8} x2={hx-36} y2={shouldY-22} stroke={shirtColor} strokeWidth="12" strokeLinecap="round"/>
            <circle cx={hx-36} cy={shouldY-22} r="8" fill={skinColor} stroke={skinDark} strokeWidth="1.2"/>
            <line x1={hx+16} y1={shouldY+8} x2={hx+36} y2={shouldY-22} stroke={shirtColor} strokeWidth="12" strokeLinecap="round"/>
            <circle cx={hx+36} cy={shouldY-22} r="8" fill={skinColor} stroke={skinDark} strokeWidth="1.2"/>
          </>
        ) : (
          <>
            <line x1={hx+ropeSide*16} y1={shouldY+8} x2={armEndX} y2={armEndY} stroke={shirtColor} strokeWidth="12" strokeLinecap="round"/>
            <circle cx={armEndX} cy={armEndY} r="8" fill={skinColor} stroke={skinDark} strokeWidth="1.2"/>
            {/* Fingers on rope */}
            {[0,1,2].map(fi => (
              <ellipse key={fi} cx={armEndX + ropeSide*(fi*3-3)} cy={armEndY+8+fi} rx="3" ry="2" fill={skinDark} />
            ))}
            {/* Balance arm */}
            <line x1={hx-ropeSide*12} y1={shouldY+10} x2={hx-ropeSide*35} y2={shouldY+32} stroke={shirtColor} strokeWidth="10" strokeLinecap="round"/>
            <circle cx={hx-ropeSide*35} cy={shouldY+32} r="7" fill={skinColor} stroke={skinDark} strokeWidth="1.2"/>
          </>
        )}

        {/* NECK */}
        <rect x={hx-7} y={headY+18} width="14" height="16" rx="5" fill={skinColor} stroke={skinDark} strokeWidth="0.8"/>

        {/* HEAD */}
        <ellipse cx={hx} cy={headY} rx="26" ry="28" fill={skinColor} stroke={skinDark} strokeWidth="1.2"/>

        {/* EARS */}
        <ellipse cx={hx-25} cy={headY+4} rx="6" ry="8" fill={skinColor} stroke={skinDark} strokeWidth="0.8"/>
        <ellipse cx={hx-25} cy={headY+4} rx="3" ry="5" fill={skinDark} opacity="0.3"/>
        <ellipse cx={hx+25} cy={headY+4} rx="6" ry="8" fill={skinColor} stroke={skinDark} strokeWidth="0.8"/>
        <ellipse cx={hx+25} cy={headY+4} rx="3" ry="5" fill={skinDark} opacity="0.3"/>

        {/* HAIR */}
        <path d={`M ${hx-24} ${headY-10} C ${hx-26} ${headY-38} ${hx+26} ${headY-38} ${hx+24} ${headY-10}`}
          fill={hairColor} />
        {/* Hair highlight */}
        <path d={`M ${hx-12} ${headY-30} C ${hx-8} ${headY-36} ${hx} ${headY-36} ${hx+4} ${headY-30}`}
          stroke="white" strokeWidth="1.5" fill="none" opacity="0.2" />

        {/* NOSE */}
        <ellipse cx={hx} cy={headY+7} rx="3" ry="2.5" fill={skinDark} opacity="0.4" />

        {/* FACE EXPRESSIONS */}
        {browL}{browR}
        {eyeL}{eyeR}
        {mouthEl}
        {extras}
      </g>
    );
  };

  // Determine character states
  const getCharState = (team: 'left' | 'right'): CharState => {
    if (phase === 'ended') return winnerSide === team ? 'won' : 'lost';
    if (team === 'left') { if (isLeftPulling) return 'pulling'; if (isLeftSlipping) return 'slipping'; }
    else { if (isRightPulling) return 'pulling'; if (isRightSlipping) return 'slipping'; }
    return 'idle';
  };

  const leftState  = getCharState('left');
  const rightState = getCharState('right');

  return (
    <div className={`w-full max-w-6xl mx-auto px-2 py-2 select-none transition-all duration-75 ${arenaShake ? 'translate-x-0.5' : ''}`}>

      {/* Hidden music iframe – src NEVER changes */}
      {isMusicPlaying && (
        <iframe ref={musicRef} data-tugofwar="1"
          src="https://www.youtube.com/embed/zK3PEHr40jw?autoplay=1&loop=1&playlist=zK3PEHr40jw&controls=0&mute=1&enablejsapi=1&origin=http://localhost"
          allow="autoplay"
          className="w-0 h-0 absolute left-0 top-0 pointer-events-none opacity-0"
          title="TugOfWar Music"
        />
      )}

      {/* ─── DIFFICULTY SELECT ─── */}
      {phase === 'difficulty' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl mt-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500" />
          <div className="space-y-2 text-center">
            <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 uppercase tracking-widest block">IT SHAHARCHA</span>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
              <Swords className="w-6 h-6 text-rose-500" /> ARQON TORTISH JANGI
            </h2>
            <p className="text-slate-400 text-xs">To'g'ri javob = arqon tortish! Noto'g'ri = 3 qadam orqaga!</p>
          </div>
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-900">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />Fon musiqasi
            </span>
            <button onClick={() => { sound.playTap(); setIsMusicPlaying(!isMusicPlaying); }}
              className={`py-1.5 px-4 rounded-xl border text-[10px] font-black uppercase cursor-pointer transition-all ${isMusicPlaying ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
              {isMusicPlaying ? <Volume2 className="w-4 h-4 inline" /> : <VolumeX className="w-4 h-4 inline" />}
            </button>
          </div>
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-black text-slate-500 block tracking-wider text-center">DARAJANI TANLANG:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { diff:'easy',   emoji:'🌱', label:'Headway Beginner', desc:'Oson so\'zlar',       color:'emerald' },
                { diff:'medium', emoji:'⚡', label:'Headway Upper',    desc:'O\'rta daraja',        color:'cyan'    },
                { diff:'hard',   emoji:'🏆', label:'IELTS / Advanced', desc:'Qiyin akademik',      color:'rose'    },
              ] as const).map(({ diff, emoji, label, desc, color }) => (
                <button key={diff} onClick={() => handleStartBattle(diff)}
                  className={`p-4 bg-slate-950 hover:bg-${color}-950/20 hover:border-${color}-500 border border-slate-900 rounded-2xl text-center active:scale-95 transition-all cursor-pointer group`}>
                  <div className="text-2xl">{emoji}</div>
                  <h4 className={`font-extrabold text-white text-xs uppercase mt-1 group-hover:text-${color}-400`}>{label}</h4>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
            {wordList?.length > 0 && (
              <button onClick={() => handleStartBattle('custom')}
                className="w-full p-4 bg-slate-950 hover:bg-indigo-950/20 hover:border-indigo-500 border border-slate-900 rounded-2xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                <span className="text-xl">✍️</span>
                <div>
                  <h4 className="font-extrabold text-white text-xs uppercase">O'QITUVCHINING LUG'ATI</h4>
                  <p className="text-[9px] text-indigo-400 font-bold mt-0.5 uppercase">{wordList.length} ta so'z</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── BATTLE ARENA ─── */}
      {(phase === 'battle' || phase === 'ended') && (
        <div className="space-y-3 w-full">

          {/* Score header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{teamLeft.emoji}</span>
              <span style={{ color: teamLeft.color }} className="font-black uppercase text-sm">{teamLeft.name}</span>
              {leftSuccessStreak > 1 && <span className="bg-cyan-500 text-slate-950 px-2 py-0.5 text-[9px] font-black rounded animate-bounce">x{leftSuccessStreak} COMBO! 🔥</span>}
            </div>
            <div className="flex items-center gap-2 bg-slate-900 py-1.5 px-3 rounded-full border border-slate-800 text-xs font-black text-amber-400">
              <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
              {difficulty === 'easy' ? 'BEGINNER' : difficulty === 'medium' ? 'UPPER' : difficulty === 'hard' ? 'IELTS' : 'MAXSUS'}
              <button onClick={() => setIsMusicPlaying(!isMusicPlaying)} className="ml-1 text-slate-500 hover:text-white">
                {isMusicPlaying ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {rightSuccessStreak > 1 && <span className="bg-rose-500 text-slate-950 px-2 py-0.5 text-[9px] font-black rounded animate-bounce">x{rightSuccessStreak} COMBO! 🔥</span>}
              <span style={{ color: teamRight.color }} className="font-black uppercase text-sm">{teamRight.name}</span>
              <span className="text-xl">{teamRight.emoji}</span>
            </div>
          </div>

          {/* ── ARENA SVG ── */}
          <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl" style={{ background: 'linear-gradient(180deg,#0c1445 0%,#1a2a6c 40%,#4a1a1a 100%)' }}>

            {/* Confetti on win */}
            {showConfetti && (
              <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                {confettiPieces.map(p => (
                  <motion.div key={p.id}
                    initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: p.rotation }}
                    animate={{ y: '110vh', opacity: [1,1,0], rotate: p.rotation + 720 }}
                    transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: 'easeIn' }}
                    style={{ position:'absolute', top:0, width: p.size, height: p.size * 0.5, borderRadius: 2, background: p.color }}
                  />
                ))}
              </div>
            )}

            {/* Floating effects */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <AnimatePresence>
                {leftFloatEffects.map(e => (
                  <motion.div key={e.id}
                    initial={{ opacity:0, y:180, scale:0.7 }} animate={{ opacity:[0,1,1,0], y:[180,80] }} exit={{ opacity:0 }}
                    transition={{ duration:1.3 }}
                    className="absolute left-[14%] text-cyan-300 font-black text-sm bg-slate-950/90 px-3 py-1 rounded-xl border border-cyan-500/30 shadow">
                    {e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {rightFloatEffects.map(e => (
                  <motion.div key={e.id}
                    initial={{ opacity:0, y:180, scale:0.7 }} animate={{ opacity:[0,1,1,0], y:[180,80] }} exit={{ opacity:0 }}
                    transition={{ duration:1.3 }}
                    className="absolute right-[14%] text-rose-300 font-black text-sm bg-slate-950/90 px-3 py-1 rounded-xl border border-rose-500/30 shadow">
                    {e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <svg viewBox="0 0 1000 320" className="w-full" style={{ maxHeight: 360 }}>
              <defs>
                <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0c1445"/>
                  <stop offset="60%"  stopColor="#1a2a6c"/>
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3"/>
                </linearGradient>
                <linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#166534"/>
                  <stop offset="100%" stopColor="#14532d"/>
                </linearGradient>
                <linearGradient id="groundG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#78350f"/>
                  <stop offset="100%" stopColor="#451a03"/>
                </linearGradient>
                <linearGradient id="ropeG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#d97706"/>
                  <stop offset="40%" stopColor="#b45309"/>
                  <stop offset="100%" stopColor="#92400e"/>
                </linearGradient>
                <linearGradient id="leftTeamZone" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="rightTeamZone" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#b91c1c" stopOpacity="0"/>
                  <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.15"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Sky */}
              <rect width="1000" height="320" fill="url(#skyG)"/>

              {/* Stars */}
              {[70,140,220,310,430,520,640,760,860,950,100,380,590,820].map((sx,i)=>(
                <circle key={i} cx={sx} cy={20+i*7%40} r={i%3===0?2:1} fill="white" opacity={0.4+i%3*0.2}/>
              ))}

              {/* Clouds */}
              {[[120,55],[400,40],[720,50],[900,65]].map(([cx,cy],i)=>(
                <g key={i} opacity="0.18">
                  <ellipse cx={cx} cy={cy} rx="55" ry="20" fill="white"/>
                  <ellipse cx={cx-25} cy={cy+5} rx="30" ry="16" fill="white"/>
                  <ellipse cx={cx+30} cy={cy+4} rx="35" ry="18" fill="white"/>
                </g>
              ))}

              {/* Mountains */}
              <polygon points="0,200 120,120 240,200" fill="#1e1b4b" opacity="0.7"/>
              <polygon points="100,200 230,100 360,200" fill="#1e1b4b" opacity="0.6"/>
              <polygon points="640,200 770,105 900,200" fill="#1e1b4b" opacity="0.6"/>
              <polygon points="800,200 920,118 1000,200" fill="#1e1b4b" opacity="0.7"/>
              {/* Snow caps */}
              <polygon points="120,120 140,135 100,135" fill="white" opacity="0.3"/>
              <polygon points="230,100 250,120 210,120" fill="white" opacity="0.25"/>
              <polygon points="770,105 790,125 750,125" fill="white" opacity="0.25"/>

              {/* Team zone tint */}
              <rect x="0" y="0" width="490" height="320" fill="url(#leftTeamZone)"/>
              <rect x="510" y="0" width="490" height="320" fill="url(#rightTeamZone)"/>

              {/* Crowd silhouettes */}
              {Array.from({length:26},(_,i)=>{
                const cx = 18+i*38; const cy = 210-Math.abs(Math.sin(i)*12);
                const h = 22+Math.abs(Math.cos(i*1.3)*10);
                const col = i%5===0?'#3b82f6':i%5===1?'#ef4444':i%5===2?'#10b981':i%5===3?'#a855f7':'#f59e0b';
                return <g key={i}>
                  <ellipse cx={cx} cy={cy+h} rx="10" ry="5" fill={col} opacity="0.5"/>
                  <line x1={cx} y1={cy+h} x2={cx} y2={cy} stroke={col} strokeWidth="6" opacity="0.4" strokeLinecap="round"/>
                  <circle cx={cx} cy={cy-8} r="8" fill={col} opacity="0.45"/>
                </g>;
              })}

              {/* Grass */}
              <rect x="0" y="294" width="1000" height="26" fill="url(#grassG)"/>
              {/* Grass blades */}
              {Array.from({length:50},(_,i)=>(
                <line key={i} x1={i*20+5} y1={294} x2={i*20+(i%3-1)*4} y2={287} stroke="#15803d" strokeWidth="1.5" opacity="0.6"/>
              ))}
              {/* Ground/dirt */}
              <rect x="0" y="300" width="1000" height="20" fill="url(#groundG)"/>

              {/* Win zone markers */}
              <line x1="180" y1="294" x2="180" y2="200" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,4" opacity="0.5"/>
              <line x1="820" y1="294" x2="820" y2="200" stroke="#ef4444" strokeWidth="2" strokeDasharray="6,4" opacity="0.5"/>
              <text x="130" y="195" fill="#60a5fa" fontSize="10" fontWeight="bold" textAnchor="middle" opacity="0.7">KO'K HUDUD</text>
              <text x="870" y="195" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle" opacity="0.7">QIZIL HUDUD</text>

              {/* ── CHARACTERS ── */}
              {[220, 140, 60].map((bx, i) => {
                const px = bx - ropePosition * 12;
                return renderCharacter('left', px, leftState);
              })}
              {[780, 860, 940].map((bx, i) => {
                const px = bx - ropePosition * 12;
                return renderCharacter('right', px, rightState);
              })}

              {/* ── ROPE ── */}
              {(() => {
                const sag = isLeftPulling ? -6 : isRightPulling ? -6 : 4;
                const leanL = isLeftPulling ? -8 : 0;
                const leanR = isRightPulling ? -8 : 0;
                const r1y = 290 + leanL;
                const r2y = 290 + leanR;
                return <>
                  {/* Rope shadow */}
                  <path d={`M 290,296 C 450,${296+sag+4} 550,${296+sag+4} 710,296`}
                    stroke="rgba(0,0,0,0.35)" strokeWidth="12" fill="none" strokeLinecap="round"/>
                  {/* Main rope */}
                  <path d={`M 290,292 C 450,${292+sag} 550,${292+sag} 710,292`}
                    stroke="url(#ropeG)" strokeWidth="11" fill="none" strokeLinecap="round"/>
                  {/* Rope strands */}
                  <path d={`M 290,289 C 450,${289+sag-2} 550,${289+sag-2} 710,289`}
                    stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="10,8" fill="none" opacity="0.5"/>
                  <path d={`M 290,295 C 450,${295+sag+1} 550,${295+sag+1} 710,295`}
                    stroke="#78350f" strokeWidth="2" strokeDasharray="8,10" fill="none" opacity="0.4"/>
                  {/* Rope knots */}
                  {[350,420,490,560,630].map((kx,i)=>{
                    const t = (kx-290)/(710-290);
                    const ky = 292 + sag * Math.sin(t*Math.PI) + 0;
                    return <ellipse key={i} cx={kx} cy={ky} rx="7" ry="5" fill="#92400e" stroke="#d97706" strokeWidth="1"/>;
                  })}
                </>;
              })()}

              {/* Center flag */}
              {(() => {
                const fx = 500 + ropePosition * 14;
                const winning = ropePosition < -4 ? 'left' : ropePosition > 4 ? 'right' : null;
                const flagColor = winning === 'left' ? '#3b82f6' : winning === 'right' ? '#ef4444' : '#e11d48';
                return <g filter="url(#glow)">
                  <line x1={fx} y1="260" x2={fx} y2="290" stroke="#fbbf24" strokeWidth="3"/>
                  <polygon points={`${fx},260 ${fx+24},268 ${fx},276`} fill={flagColor} stroke="white" strokeWidth="1.5"/>
                  <circle cx={fx} cy="291" r="5" fill="#fbbf24"/>
                  {/* Glow under flag */}
                  <ellipse cx={fx} cy="291" rx="8" ry="3" fill={flagColor} opacity="0.4" className="animate-pulse"/>
                </g>;
              })()}

              {/* ── TENSION METER ── */}
              <g transform="translate(500,22)">
                <rect x="-160" y="0" width="320" height="14" rx="7" fill="#0f172a" stroke="#334155" strokeWidth="1"/>
                <motion.rect x="-160" y="0"
                  animate={{ width: `${getPercent() * 3.2}px` }}
                  transition={{ type:'spring', stiffness:100, damping:15 }}
                  height="14" rx="7"
                  fill={getPercent() < 35 ? '#3b82f6' : getPercent() > 65 ? '#ef4444' : '#a855f7'}
                  opacity="0.85"
                />
                <line x1="0" y1="0" x2="0" y2="14" stroke="white" strokeWidth="2" opacity="0.6"/>
                <text x="-155" y="11" fontSize="8" fill="#93c5fd" fontWeight="bold">{teamLeft.name}</text>
                <text x="155" y="11" fontSize="8" fill="#fca5a5" fontWeight="bold" textAnchor="end">{teamRight.name}</text>
              </g>
            </svg>
          </div>

          {/* ── ANSWER TERMINALS ── */}
          {phase === 'battle' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Left terminal */}
              <div className={`p-5 rounded-3xl border-2 transition-all ${leftFrozen ? 'bg-rose-950/30 border-rose-500/60' : 'bg-slate-900/90 border-blue-500/40 hover:border-blue-500/70'}`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: teamLeft.color }}>{teamLeft.emoji} {teamLeft.name}</span>
                  <span className="text-[9px] font-mono text-slate-500">TERMINAL A</span>
                </div>
                {leftFrozen ? (
                  <div className="h-[190px] flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
                    <h4 className="font-black text-rose-400 text-sm">XATO JAVOB! 😱</h4>
                    <p className="text-[10px] text-slate-400">Arqon orqaga ketdi. 1.5s kutish...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 py-4 px-5 rounded-2xl border border-blue-500/20 shadow-inner">
                      <span className="text-blue-400 text-[9px] uppercase font-black block mb-1">🔤 INGLIZCHASI NIMA?</span>
                      <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wide leading-tight">{leftWord.uz}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {leftOptions.map((opt, i) => (
                        <button key={i} onClick={() => handleLeftAnswer(opt)}
                          className="bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500 hover:text-blue-300 p-3 md:p-4 rounded-xl text-[11px] md:text-xs font-black text-white transition-all uppercase cursor-pointer active:scale-95 shadow">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right terminal */}
              <div className={`p-5 rounded-3xl border-2 transition-all ${rightFrozen ? 'bg-rose-950/30 border-rose-500/60' : 'bg-slate-900/90 border-red-500/40 hover:border-red-500/70'}`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: teamRight.color }}>{teamRight.emoji} {teamRight.name}</span>
                  <span className="text-[9px] font-mono text-slate-500">TERMINAL B</span>
                </div>
                {rightFrozen ? (
                  <div className="h-[190px] flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
                    <h4 className="font-black text-rose-400 text-sm">XATO JAVOB! 😱</h4>
                    <p className="text-[10px] text-slate-400">Arqon orqaga ketdi. 1.5s kutish...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 py-4 px-5 rounded-2xl border border-red-500/20 shadow-inner">
                      <span className="text-red-400 text-[9px] uppercase font-black block mb-1">🔤 INGLIZCHASI NIMA?</span>
                      <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wide leading-tight">{rightWord.uz}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {rightOptions.map((opt, i) => (
                        <button key={i} onClick={() => handleRightAnswer(opt)}
                          className="bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500 hover:text-red-300 p-3 md:p-4 rounded-xl text-[11px] md:text-xs font-black text-white transition-all uppercase cursor-pointer active:scale-95 shadow">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── VICTORY SCREEN ── */}
          {phase === 'ended' && (
            <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:200 }}
              className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-indigo-950/50 border-2 border-amber-500/40 py-10 px-8 rounded-3xl text-center space-y-4 mt-2 max-w-lg mx-auto relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"/>
              <motion.div animate={{ rotate:[0,10,-10,0], scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:1.5 }}>
                <Sparkles className="w-14 h-14 text-yellow-400 mx-auto"/>
              </motion.div>
              <div>
                <span className="text-[10px] text-yellow-500 font-extrabold tracking-widest uppercase block">🎊 MUSOBAQA YAKUNLANDI! 🎊</span>
                <h3 className="text-3xl font-black text-white uppercase mt-2">
                  {winnerSide === 'left' ? teamLeft.name : teamRight.name}
                </h3>
                <p className="text-xl font-black text-yellow-400 mt-1">G'ALABA QOZONDI! 🏆</p>
              </div>
              <div className="flex justify-center gap-4 text-4xl">
                <motion.span animate={{ y:[0,-10,0] }} transition={{ repeat:Infinity, duration:0.8 }}>🥇</motion.span>
                <motion.span animate={{ y:[0,-10,0] }} transition={{ repeat:Infinity, duration:0.8, delay:0.2 }}>🎉</motion.span>
                <motion.span animate={{ y:[0,-10,0] }} transition={{ repeat:Infinity, duration:0.8, delay:0.4 }}>⭐</motion.span>
              </div>
              <p className="text-xs text-slate-400">Natijalar saqlanmoqda...</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
