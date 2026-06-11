import React, { useState, useEffect } from 'react';
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
  { uz: 'Rivojlantirmoq', en: 'Develop' },
  { uz: 'Taqdim etmoq', en: 'Present' },
  { uz: 'Tushunmoq', en: 'Understand' },
  { uz: 'Imkoniyat', en: 'Opportunity' },
  { uz: 'Tajriba', en: 'Experience' },
  { uz: 'Sayohat qilmoq', en: 'Travel' },
  { uz: 'Harakat qilmoq', en: 'Attempt' },
  { uz: 'Zaruriy', en: 'Necessary' },
  { uz: 'Qaror qabul qilmoq', en: 'Decide' },
  { uz: 'Yaxshilamoq', en: 'Improve' },
  { uz: 'Muallif', en: 'Author' },
  { uz: 'Kashf qilmoq', en: 'Discover' },
  { uz: 'Maslahat bermoq', en: 'Advise' },
  { uz: 'Niyat', en: 'Purpose' },
  { uz: 'Erishmoq', en: 'Achieve' },
  { uz: 'Ta\'sir qilmoq', en: 'Influence' },
  { uz: 'Tavsiya qilmoq', en: 'Recommend' },
  { uz: 'G\'alaba', en: 'Victory' },
  { uz: 'Tasvirlamoq', en: 'Describe' },
  { uz: 'Solishtirmoq', en: 'Compare' },
  { uz: 'Qiyinchilik', en: 'Difficulty' },
  { uz: 'Izohlamoq', en: 'Explain' },
  { uz: 'Tanlash', en: 'Choose' },
  { uz: 'Ko\'maklashmoq', en: 'Support' },
  { uz: 'Birikmoq', en: 'Connect' },
];

const MEDIUM_WORDS: WordPair[] = [
  { uz: 'Tergov qilmoq', en: 'Investigate' },
  { uz: 'E\'tiroz bildirmoq', en: 'Object' },
  { uz: 'Cheklamoq', en: 'Restrict' },
  { uz: 'Tashvishlanish', en: 'Anxiety' },
  { uz: 'Noyob', en: 'Extraordinary' },
  { uz: 'Isbotlamoq', en: 'Verify' },
  { uz: 'Samarali', en: 'Efficient' },
  { uz: 'Ilhomlantirmoq', en: 'Inspire' },
  { uz: 'Moslashmoq', en: 'Adapt' },
  { uz: 'Ziddiyat', en: 'Conflict' },
  { uz: 'Raqobatlashmoq', en: 'Compete' },
  { uz: 'Kafolatlamoq', en: 'Guarantee' },
  { uz: 'Foyda keltiradigan', en: 'Beneficial' },
  { uz: 'Faraz qilmoq', en: 'Assume' },
  { uz: 'Xabardorlik', en: 'Awareness' },
  { uz: 'Hissa qo\'shmoq', en: 'Contribute' },
  { uz: 'Baholash', en: 'Assessment' },
  { uz: 'Muqobil variant', en: 'Alternative' },
  { uz: 'Hamkorlik qilmoq', en: 'Collaborate' },
  { uz: 'Izchil', en: 'Consistent' },
  { uz: 'Kengaytirish', en: 'Expand' },
  { uz: 'Tahlil qilmoq', en: 'Analyze' },
  { uz: 'Tasdiqlamoq', en: 'Confirm' },
  { uz: 'Muammoni hal qilmoq', en: 'Resolve' },
  { uz: 'Tavakkalchilik', en: 'Risk' },
];

const HARD_WORDS: WordPair[] = [
  { uz: 'Hamma joyda mavjud', en: 'Ubiquitous' },
  { uz: 'Fikrlash tarzi', en: 'Paradigm' },
  { uz: 'Xulosa chiqarmoq', en: 'Extrapolate' },
  { uz: 'Yarashtirish', en: 'Reconcile' },
  { uz: 'Yonma-yon qo\'yish', en: 'Juxtapose' },
  { uz: 'Vazminlik', en: 'Equanimity' },
  { uz: 'Murakkab jumboq', en: 'Conundrum' },
  { uz: 'Maqtovga loyiq', en: 'Meritorious' },
  { uz: 'Dalillar bilan isbotlamoq', en: 'Substantiate' },
  { uz: 'O\'tkinchi', en: 'Ephemeral' },
  { uz: 'Pinhona', en: 'Surreptitious' },
  { uz: 'Zerikarli', en: 'Monotonous' },
  { uz: 'Chuqur bilim', en: 'Erudition' },
  { uz: 'Eng yuqori cho\'qqi', en: 'Zenith' },
  { uz: 'Mavhum', en: 'Obscure' },
  { uz: 'Chechanlik', en: 'Eloquence' },
  { uz: 'Chidamli', en: 'Resilient' },
  { uz: 'Inkor etib bo\'lmaydigan', en: 'Irrefutable' },
  { uz: 'Amaliy', en: 'Pragmatic' },
  { uz: 'G\'ayratli', en: 'Assiduous' },
  { uz: 'Ruhlantiruvchi', en: 'Exhilarating' },
  { uz: 'Xavf', en: 'Jeopardy' },
  { uz: 'Zararsiz', en: 'Innocuous' },
  { uz: 'O\'jarlik', en: 'Recalcitrant' },
  { uz: 'Kuchli moyillik', en: 'Proclivity' },
];

type Difficulty = 'easy' | 'medium' | 'hard' | 'custom';

export default function TugOfWar({
  teamLeft,
  teamRight,
  wordList,
  selectedDifficulty,
  onGameWin,
  onUpdateScore
}: TugOfWarProps) {
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
  const [sparksOffset, setSparksOffset] = useState<number | null>(null);

  const [leftFloatingEffects, setLeftFloatingEffects] = useState<{ id: number; text: string; x: number }[]>([]);
  const [rightFloatingEffects, setRightFloatingEffects] = useState<{ id: number; text: string; x: number }[]>([]);
  const [leftDust, setLeftDust] = useState<{ id: number; scale: number; x: number }[]>([]);
  const [rightDust, setRightDust] = useState<{ id: number; scale: number; x: number }[]>([]);

  const [leftSuccessStreak, setLeftSuccessStreak] = useState(0);
  const [rightSuccessStreak, setRightSuccessStreak] = useState(0);

  const [isLeftSlipping, setIsLeftSlipping] = useState(false);
  const [isRightSlipping, setIsRightSlipping] = useState(false);

  const [leftRemainingPool, setLeftRemainingPool] = useState<WordPair[]>([]);
  const [rightRemainingPool, setRightRemainingPool] = useState<WordPair[]>([]);

  useEffect(() => {
    return () => {
      document.querySelectorAll('iframe[data-tugofwar]').forEach((ifr) => {
        try { (ifr as HTMLIFrameElement).src = 'about:blank'; ifr.remove(); } catch {}
      });
    };
  }, []);

  useEffect(() => {
    if (phase === 'difficulty' && selectedDifficulty && selectedDifficulty !== 'custom') {
      const chosenDiff = selectedDifficulty === 'beginner' ? 'easy' : selectedDifficulty === 'advanced' ? 'hard' : 'medium';
      handleStartBattle(chosenDiff);
    }
  }, [selectedDifficulty]);

  const handleStartBattle = (selectedDiff: Difficulty) => {
    sound.playCorrect();
    setDifficulty(selectedDiff);

    let chosenWords = MEDIUM_WORDS;
    if (selectedDiff === 'easy') chosenWords = EASY_WORDS;
    if (selectedDiff === 'hard') chosenWords = HARD_WORDS;
    if (selectedDiff === 'custom' && wordList && wordList.length > 0) chosenWords = wordList;

    setActiveWords(chosenWords);
    setPhase('battle');

    const shuffledLeft = [...chosenWords].sort(() => Math.random() - 0.5);
    const shuffledRight = [...chosenWords].sort(() => Math.random() - 0.5);
    generateQuestionFromPool('left', chosenWords, shuffledLeft);
    generateQuestionFromPool('right', chosenWords, shuffledRight);
  };

  const generateQuestionFromPool = (team: 'left' | 'right', fullPool: WordPair[], currentPoolState: WordPair[]) => {
    let activePool = [...currentPoolState];
    if (activePool.length === 0) activePool = [...fullPool].sort(() => Math.random() - 0.5);
    const item = activePool.pop()!;

    const distractors = fullPool.filter(w => w.en !== item.en).map(w => w.en);
    const shuffledDist = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [item.en, ...shuffledDist].sort(() => Math.random() - 0.5);

    if (team === 'left') {
      setLeftRemainingPool(activePool);
      setLeftWord(item);
      setLeftOptions(opts);
    } else {
      setRightRemainingPool(activePool);
      setRightWord(item);
      setRightOptions(opts);
    }
  };

  const triggerSparks = () => {
    setSparksOffset(Math.random() * 20 - 10);
    setTimeout(() => setSparksOffset(null), 850);
  };

  const triggerDust = (side: 'left' | 'right') => {
    const id = Date.now() + Math.random();
    const particle = { id, scale: Math.random() * 0.6 + 0.4, x: Math.random() * 30 - 15 };
    if (side === 'left') {
      setLeftDust(prev => [...prev, particle]);
      setTimeout(() => setLeftDust(prev => prev.filter(d => d.id !== id)), 850);
    } else {
      setRightDust(prev => [...prev, particle]);
      setTimeout(() => setRightDust(prev => prev.filter(d => d.id !== id)), 850);
    }
  };

  const handleLeftAnswer = (option: string) => {
    if (leftFrozen || phase !== 'battle') return;

    if (option === leftWord.en) {
      sound.playCorrect();
      const newStreak = leftSuccessStreak + 1;
      setLeftSuccessStreak(newStreak);
      setIsLeftPulling(true);
      setArenaShake(true);
      triggerSparks();
      triggerDust('left');
      setTimeout(() => setIsLeftPulling(false), 500);
      setTimeout(() => setArenaShake(false), 300);

      const pullForce = newStreak >= 2 ? 1.5 : 1;
      const text = newStreak >= 2 ? `🔥 COMBO x${newStreak}! +${pullForce}` : `💪 TORTISH! +${pullForce}`;
      setLeftFloatingEffects(prev => [...prev, { id: Date.now() + Math.random(), text, x: Math.random() * 40 - 20 }]);

      const nextPos = Math.max(-WIN_THRESHOLD, ropePosition - pullForce);
      setRopePosition(nextPos);

      if (nextPos <= -WIN_THRESHOLD) {
        handleEndGame('left');
      } else {
        generateQuestionFromPool('left', activeWords, leftRemainingPool);
      }
    } else {
      sound.playIncorrect();
      setLeftSuccessStreak(0);
      setLeftFrozen(true);
      setIsLeftSlipping(true);
      setLeftFloatingEffects(prev => [...prev, { id: Date.now() + Math.random(), text: '⚠️ SIRG\'ALDI! -3', x: Math.random() * 40 - 20 }]);

      const nextPos = Math.min(WIN_THRESHOLD, ropePosition + 3);
      setRopePosition(nextPos);

      if (nextPos >= WIN_THRESHOLD) {
        handleEndGame('right');
      } else {
        setTimeout(() => {
          setLeftFrozen(false);
          setIsLeftSlipping(false);
          generateQuestionFromPool('left', activeWords, leftRemainingPool);
        }, 1400);
      }
    }
  };

  const handleRightAnswer = (option: string) => {
    if (rightFrozen || phase !== 'battle') return;

    if (option === rightWord.en) {
      sound.playCorrect();
      const newStreak = rightSuccessStreak + 1;
      setRightSuccessStreak(newStreak);
      setIsRightPulling(true);
      setArenaShake(true);
      triggerSparks();
      triggerDust('right');
      setTimeout(() => setIsRightPulling(false), 500);
      setTimeout(() => setArenaShake(false), 300);

      const pullForce = newStreak >= 2 ? 1.5 : 1;
      const text = newStreak >= 2 ? `🔥 COMBO x${newStreak}! +${pullForce}` : `💪 TORTISH! +${pullForce}`;
      setRightFloatingEffects(prev => [...prev, { id: Date.now() + Math.random(), text, x: Math.random() * 40 - 20 }]);

      const nextPos = Math.min(WIN_THRESHOLD, ropePosition + pullForce);
      setRopePosition(nextPos);

      if (nextPos >= WIN_THRESHOLD) {
        handleEndGame('right');
      } else {
        generateQuestionFromPool('right', activeWords, rightRemainingPool);
      }
    } else {
      sound.playIncorrect();
      setRightSuccessStreak(0);
      setRightFrozen(true);
      setIsRightSlipping(true);
      setRightFloatingEffects(prev => [...prev, { id: Date.now() + Math.random(), text: '⚠️ SIRG\'ALDI! -3', x: Math.random() * 40 - 20 }]);

      const nextPos = Math.max(-WIN_THRESHOLD, ropePosition - 3);
      setRopePosition(nextPos);

      if (nextPos <= -WIN_THRESHOLD) {
        handleEndGame('left');
      } else {
        setTimeout(() => {
          setRightFrozen(false);
          setIsRightSlipping(false);
          generateQuestionFromPool('right', activeWords, rightRemainingPool);
        }, 1400);
      }
    }
  };

  const handleEndGame = (side: 'left' | 'right') => {
    setPhase('ended');
    sound.playWin();
    onUpdateScore(side === 'left' ? WIN_THRESHOLD : 0, side === 'right' ? WIN_THRESHOLD : 0);
    setTimeout(() => {
      onGameWin(side === 'left' ? { ...teamLeft, score: WIN_THRESHOLD } : { ...teamRight, score: WIN_THRESHOLD });
    }, 4500);
  };

  // Beautiful SVG player renderer
  const renderPlayer = (
    team: 'left' | 'right',
    cx: number,
    isPulling: boolean,
    isFrozen: boolean,
    isSlipping: boolean,
    hasWon: boolean,
    hasLost: boolean
  ) => {
    const isLeft = team === 'left';
    const bodyColor = isLeft ? '#2563eb' : '#dc2626';
    const shirtColor = isLeft ? '#3b82f6' : '#ef4444';
    const accentColor = isLeft ? '#93c5fd' : '#fca5a5';
    const pantsColor = '#1e293b';
    const skinColor = '#fbbf24';
    const darkSkin = '#f59e0b';

    // Compute pose
    let lean = 0; // head offset
    let bodyY = 0;
    if (isPulling) { lean = isLeft ? -18 : 18; bodyY = 8; }
    if (isSlipping) { lean = isLeft ? 20 : -20; bodyY = -5; }
    if (hasWon) { lean = 0; bodyY = -10; }
    if (hasLost) { lean = isLeft ? 15 : -15; bodyY = 15; }

    const hx = cx + lean;
    const hy = 95 + bodyY;
    const torsoY = 125 + bodyY;
    const waistY = 165 + bodyY;
    const groundY = 220;

    // Arm direction (reaching towards rope center)
    const armDir = isLeft ? 1 : -1;
    const armX1 = hx + armDir * 10;
    const armY1 = torsoY + 10;
    const handX = hx + armDir * 45;
    const handY = torsoY + 25;

    // Leg positions
    let foot1X = cx + (isLeft ? -20 : 20);
    let foot2X = cx + (isLeft ? 10 : -10);
    if (isPulling) { foot1X += isLeft ? -15 : 15; foot2X += isLeft ? 5 : -5; }
    if (isSlipping) { foot1X += isLeft ? 20 : -20; foot2X += isLeft ? 15 : -15; }

    // Eye / face expression
    const eyeOffsetL = -5;
    const eyeOffsetR = 5;
    let eyeL: React.ReactNode, eyeR: React.ReactNode, mouth: React.ReactNode;

    if (hasWon) {
      eyeL = <path d={`M ${hx+eyeOffsetL-4} ${hy-2} Q ${hx+eyeOffsetL} ${hy-6} ${hx+eyeOffsetL+4} ${hy-2}`} stroke="#16a34a" strokeWidth="2" fill="none" />;
      eyeR = <path d={`M ${hx+eyeOffsetR-4} ${hy-2} Q ${hx+eyeOffsetR} ${hy-6} ${hx+eyeOffsetR+4} ${hy-2}`} stroke="#16a34a" strokeWidth="2" fill="none" />;
      mouth = <path d={`M ${hx-6} ${hy+5} Q ${hx} ${hy+11} ${hx+6} ${hy+5}`} stroke="#dc2626" strokeWidth="2" fill="none" />;
    } else if (hasLost) {
      eyeL = <text x={hx+eyeOffsetL} y={hy+2} fontSize="8" fill="#dc2626" textAnchor="middle">x</text>;
      eyeR = <text x={hx+eyeOffsetR} y={hy+2} fontSize="8" fill="#dc2626" textAnchor="middle">x</text>;
      mouth = <path d={`M ${hx-5} ${hy+7} Q ${hx} ${hy+4} ${hx+5} ${hy+7}`} stroke="#334155" strokeWidth="1.5" fill="none" />;
    } else if (isSlipping) {
      eyeL = <circle cx={hx+eyeOffsetL} cy={hy-1} r="3" fill="white" stroke="#000" strokeWidth="1"><circle cx={hx+eyeOffsetL} cy={hy-1} r="1.5" fill="#000" /></circle>;
      eyeR = <circle cx={hx+eyeOffsetR} cy={hy-1} r="3" fill="white" stroke="#000" strokeWidth="1"><circle cx={hx+eyeOffsetR} cy={hy-1} r="1.5" fill="#000" /></circle>;
      mouth = <circle cx={hx} cy={hy+7} r="4" fill="#0f172a" />;
    } else if (isFrozen) {
      eyeL = <line x1={hx+eyeOffsetL-4} y1={hy-2} x2={hx+eyeOffsetL+4} y2={hy-2} stroke="#38bdf8" strokeWidth="2" />;
      eyeR = <line x1={hx+eyeOffsetR-4} y1={hy-2} x2={hx+eyeOffsetR+4} y2={hy-2} stroke="#38bdf8" strokeWidth="2" />;
      mouth = <path d={`M ${hx-5} ${hy+5} Q ${hx} ${hy+3} ${hx+5} ${hy+5}`} stroke="#fff" strokeWidth="2" fill="none" />;
    } else {
      eyeL = <circle cx={hx+eyeOffsetL} cy={hy-2} r="2.5" fill="#0f172a" />;
      eyeR = <circle cx={hx+eyeOffsetR} cy={hy-2} r="2.5" fill="#0f172a" />;
      mouth = <path d={`M ${hx-4} ${hy+5} L ${hx+4} ${hy+5}`} stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />;
    }

    return (
      <g key={`player-${team}`}>
        {/* Shadow */}
        <ellipse cx={cx} cy={groundY + 5} rx="22" ry="5" fill="rgba(0,0,0,0.3)" />

        {/* Legs */}
        <line x1={cx} y1={waistY} x2={foot1X} y2={groundY} stroke={pantsColor} strokeWidth="10" strokeLinecap="round" />
        <line x1={cx} y1={waistY} x2={foot2X} y2={groundY} stroke={pantsColor} strokeWidth="10" strokeLinecap="round" />

        {/* Boots */}
        <ellipse cx={foot1X} cy={groundY+3} rx="10" ry="5" fill="#0f172a" />
        <ellipse cx={foot2X} cy={groundY+3} rx="10" ry="5" fill="#0f172a" />

        {/* Body (torso) */}
        <path
          d={`M ${hx-16} ${torsoY} L ${hx+16} ${torsoY} L ${cx+13} ${waistY} L ${cx-13} ${waistY} Z`}
          fill={shirtColor}
          stroke={bodyColor}
          strokeWidth="1.5"
        />

        {/* Shirt stripe accent */}
        <line x1={hx-6} y1={torsoY+5} x2={cx-5} y2={waistY-5} stroke={accentColor} strokeWidth="2" opacity="0.7" />
        <line x1={hx+6} y1={torsoY+5} x2={cx+5} y2={waistY-5} stroke={accentColor} strokeWidth="2" opacity="0.7" />

        {/* Belt */}
        <rect x={cx-14} y={waistY-5} width="28" height="7" rx="2" fill="#ca8a04" stroke="#92400e" strokeWidth="1" />

        {/* Pulling arm */}
        <line x1={armX1} y1={armY1} x2={handX} y2={handY} stroke={bodyColor} strokeWidth="8" strokeLinecap="round" />
        <circle cx={handX} cy={handY} r="5.5" fill={skinColor} stroke={darkSkin} strokeWidth="1" />

        {/* Other arm (balance) */}
        <line x1={hx - armDir*10} y1={armY1} x2={hx - armDir*30} y2={armY1 + 15} stroke={bodyColor} strokeWidth="7" strokeLinecap="round" />
        <circle cx={hx - armDir*30} cy={armY1+15} r="5" fill={skinColor} stroke={darkSkin} strokeWidth="1" />

        {/* Neck */}
        <rect x={hx-5} y={hy+12} width="10" height="10" rx="2" fill={skinColor} />

        {/* Head */}
        <circle cx={hx} cy={hy} r="17" fill={skinColor} stroke={darkSkin} strokeWidth="1.5" />

        {/* Frozen tint */}
        {isFrozen && <circle cx={hx} cy={hy} r="17" fill="#38bdf8" opacity="0.3" className="animate-pulse" />}

        {/* Eyes */}
        {eyeL}
        {eyeR}
        {/* Brows (determined look) */}
        {!hasWon && !hasLost && !isSlipping && (
          <>
            <path d={`M ${hx+eyeOffsetL-5} ${hy-7} L ${hx+eyeOffsetL+3} ${hy-5}`} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            <path d={`M ${hx+eyeOffsetR-3} ${hy-5} L ${hx+eyeOffsetR+5} ${hy-7}`} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {mouth}

        {/* Do'ppi (traditional Uzbek skullcap) */}
        <path d={`M ${hx-13} ${hy-12} C ${hx-13} ${hy-26} ${hx+13} ${hy-26} ${hx+13} ${hy-12} Z`} fill="#1e293b" />
        <path d={`M ${hx-12} ${hy-12} Q ${hx} ${hy-15} ${hx+12} ${hy-12}`} stroke="#fff" strokeWidth="0.8" strokeDasharray="2,2" fill="none" />
        {/* Doppi embroidery dots */}
        {[-7, 0, 7].map(ox => (
          <circle key={ox} cx={hx+ox} cy={hy-20} r="1.2" fill="#fff" opacity="0.85" />
        ))}

        {/* Win stars */}
        {hasWon && (
          <>
            <text x={hx-20} y={hy-30} fontSize="14" className="animate-bounce">⭐</text>
            <text x={hx+8} y={hy-35} fontSize="12" className="animate-bounce">✨</text>
          </>
        )}
      </g>
    );
  };

  const getPercentage = () => {
    const normalized = ropePosition + WIN_THRESHOLD;
    return (normalized / (WIN_THRESHOLD * 2)) * 100;
  };

  const winnerSide = phase === 'ended' ? (ropePosition <= -WIN_THRESHOLD ? 'left' : 'right') : null;

  return (
    <div className={`w-full max-w-6xl mx-auto px-2 py-2 select-none flex flex-col items-stretch text-center min-h-[520px] transition-all duration-100 ${arenaShake ? 'translate-x-0.5' : ''}`}>

      {/* Music iframe - pre-loaded so it's ready immediately when battle starts */}
      {isMusicPlaying && (
        <iframe
          data-tugofwar="1"
          src={`https://www.youtube.com/embed/9eWSQtirTno?autoplay=1&loop=1&playlist=9eWSQtirTno&controls=0&mute=${phase === 'difficulty' ? 1 : 0}`}
          allow="autoplay"
          className="w-0 h-0 absolute left-0 top-0 pointer-events-none opacity-0"
          title="TugOfWar Music"
        />
      )}

      {/* DIFFICULTY SELECTION */}
      {phase === 'difficulty' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl mt-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500" />

          <div className="space-y-2">
            <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 uppercase tracking-widest block">
              IT SHAHARCHA SINF ACADEMY
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
              <Swords className="w-6 h-6 text-rose-500" />
              ARQON TORTISH JANGI
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">
              Headway darajasidagi so'zlar. Har bir jamoa o'z terminalida so'zlarni to'g'ri topadi. To'g'ri javob arqonni tortadi!
            </p>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-900">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              Fon musiqasi
            </span>
            <button
              onClick={() => { sound.playTap(); setIsMusicPlaying(!isMusicPlaying); }}
              className={`py-1.5 px-4 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                isMusicPlaying
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {isMusicPlaying ? <Volume2 className="w-4 h-4 inline" /> : <VolumeX className="w-4 h-4 inline" />}
            </button>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] uppercase font-black text-slate-500 block tracking-wider text-center">DARAJANI TANLANG:</span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { diff: 'easy', emoji: '🌱', label: 'Headway Beginner', desc: 'Oson Headway so\'zlari', color: 'emerald' },
                { diff: 'medium', emoji: '⚡', label: 'Headway Upper', desc: 'O\'rta daraja so\'zlari', color: 'cyan' },
                { diff: 'hard', emoji: '🏆', label: 'IELTS / Advanced', desc: 'Qiyin akademik so\'zlar', color: 'rose' },
              ] as const).map(({ diff, emoji, label, desc, color }) => (
                <button
                  key={diff}
                  onClick={() => handleStartBattle(diff)}
                  className={`p-4 bg-slate-950 hover:bg-${color}-950/20 hover:border-${color}-500 border border-slate-900 rounded-2xl text-center active:scale-95 transition-all group cursor-pointer`}
                >
                  <div className="text-2xl">{emoji}</div>
                  <h4 className={`font-extrabold text-white text-xs uppercase mt-1 group-hover:text-${color}-400`}>{label}</h4>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>

            {wordList && wordList.length > 0 && (
              <button
                onClick={() => handleStartBattle('custom')}
                className="w-full p-4 bg-slate-950 hover:bg-indigo-950/20 hover:border-indigo-500 border border-slate-900 rounded-2xl text-center active:scale-95 transition-all group cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="text-xl">✍️</span>
                <div>
                  <h4 className="font-extrabold text-white text-xs uppercase group-hover:text-indigo-400">O'QITUVCHINING LUG'ATI</h4>
                  <p className="text-[9px] text-indigo-400 font-bold mt-0.5 uppercase">{wordList.length} ta maxsus so'z</p>
                </div>
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 bg-slate-950 p-2.5 rounded-lg border border-slate-900">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>To'g'ri javob = arqon tortish. Noto'g'ri = 3 qadam orqaga!</span>
          </div>
        </div>
      )}

      {/* BATTLE ARENA */}
      {(phase === 'battle' || phase === 'ended') && (
        <div className="space-y-4 w-full">

          {/* Scoreboard */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 flex-wrap gap-2 text-xs font-mono font-bold text-slate-400 px-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{teamLeft.emoji}</span>
              <span style={{ color: teamLeft.color }} className="font-black uppercase">{teamLeft.name}</span>
              {leftSuccessStreak > 1 && (
                <span className="bg-cyan-500 text-slate-950 px-2 py-0.5 text-[9px] font-black rounded uppercase animate-bounce">
                  Combo x{leftSuccessStreak}! 🔥
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 bg-slate-900 py-1.5 px-4 rounded-full border border-slate-800 text-xs font-black uppercase text-white">
              <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
              <span className="text-amber-400">
                {difficulty === 'easy' ? 'BEGINNER' : difficulty === 'medium' ? 'UPPER' : difficulty === 'hard' ? 'IELTS' : 'MAXSUS'}
              </span>
              <button
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                className="ml-2 text-slate-500 hover:text-white transition-all"
              >
                {isMusicPlaying ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {rightSuccessStreak > 1 && (
                <span className="bg-rose-500 text-slate-950 px-2 py-0.5 text-[9px] font-black rounded uppercase animate-bounce">
                  Combo x{rightSuccessStreak}! 🔥
                </span>
              )}
              <span style={{ color: teamRight.color }} className="font-black uppercase">{teamRight.name}</span>
              <span className="text-lg">{teamRight.emoji}</span>
            </div>
          </div>

          {/* Arena */}
          <div className="relative w-full h-[300px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

            {/* Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gradient-to-b from-transparent via-rose-500/40 to-transparent -translate-x-1/2" />

            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-800/30 to-transparent rounded-b-3xl" />

            {/* Balance Meter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[60%] max-w-sm">
              <div className="bg-slate-900/80 h-3 rounded-full border border-slate-700 overflow-hidden relative">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-500 rounded-full"
                  animate={{ width: `${getPercentage()}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/60 -translate-x-1/2" />
              </div>
            </div>

            {/* Floating effects */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              <AnimatePresence>
                {leftFloatingEffects.map(eff => (
                  <motion.div
                    key={eff.id}
                    initial={{ opacity: 0, y: 200, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [200, 100], scale: [0.8, 1.2] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4 }}
                    className="absolute left-[15%] text-cyan-400 font-black text-xs bg-slate-900/95 px-3 py-1 rounded-xl border border-cyan-500/30 shadow-xl font-mono"
                    style={{ left: `calc(15% + ${eff.x}px)` }}
                  >{eff.text}</motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {rightFloatingEffects.map(eff => (
                  <motion.div
                    key={eff.id}
                    initial={{ opacity: 0, y: 200, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [200, 100], scale: [0.8, 1.2] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4 }}
                    className="absolute text-rose-400 font-black text-xs bg-slate-900/95 px-3 py-1 rounded-xl border border-rose-500/30 shadow-xl font-mono"
                    style={{ right: `calc(15% + ${eff.x}px)` }}
                  >{eff.text}</motion.div>
                ))}
              </AnimatePresence>

              {/* Dust */}
              {leftDust.map(d => (
                <motion.div key={d.id}
                  initial={{ opacity: 0.7, scale: 0.1, x: 120 + d.x, y: 190 }}
                  animate={{ opacity: 0, scale: d.scale * 3, x: 80 + d.x, y: 175 }}
                  transition={{ duration: 0.8 }}
                  className="absolute left-4 w-8 h-8 rounded-full bg-amber-500/15 blur-sm"
                />
              ))}
              {rightDust.map(d => (
                <motion.div key={d.id}
                  initial={{ opacity: 0.7, scale: 0.1, x: -120 + d.x, y: 190 }}
                  animate={{ opacity: 0, scale: d.scale * 3, x: -80 + d.x, y: 175 }}
                  transition={{ duration: 0.8 }}
                  className="absolute right-4 w-8 h-8 rounded-full bg-amber-500/15 blur-sm"
                />
              ))}
            </div>

            {/* SVG Arena - Characters + Rope */}
            <svg viewBox="0 0 1000 240" className="w-full h-full overflow-visible" style={{ maxHeight: '280px' }}>
              <defs>
                <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#92400e" />
                  <stop offset="40%" stopColor="#d97706" />
                  <stop offset="70%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#451a03" />
                </linearGradient>
                <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>

              {/* Ground */}
              <rect x="0" y="226" width="1000" height="14" rx="4" fill="url(#groundGrad)" opacity="0.7" />

              {/* Left Team (3 players) */}
              {[150, 230, 310].map((baseX, i) => {
                const px = baseX - ropePosition * 13;
                return renderPlayer(
                  'left', px,
                  isLeftPulling, leftFrozen, isLeftSlipping,
                  phase === 'ended' && winnerSide === 'left',
                  phase === 'ended' && winnerSide === 'right'
                );
              })}

              {/* Right Team (3 players) */}
              {[690, 770, 850].map((baseX, i) => {
                const px = baseX - ropePosition * 13;
                return renderPlayer(
                  'right', px,
                  isRightPulling, rightFrozen, isRightSlipping,
                  phase === 'ended' && winnerSide === 'right',
                  phase === 'ended' && winnerSide === 'left'
                );
              })}

              {/* Rope */}
              <path
                d={`M 5,175 C 250,${175 + (isLeftPulling ? -4 : isRightPulling ? 2 : 0)} 750,${175 + (isRightPulling ? -4 : isLeftPulling ? 2 : 0)} 995,175`}
                stroke="url(#ropeGrad)"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
              {/* Rope texture strands */}
              <path
                d={`M 5,172 C 250,${172 + (isLeftPulling ? -3 : 0)} 750,${172 + (isRightPulling ? -3 : 0)} 995,172`}
                stroke="#78350f"
                strokeWidth="2.5"
                strokeDasharray="8,6"
                fill="none"
                opacity="0.5"
              />

              {/* Center flag */}
              {(() => {
                const fx = 500 + ropePosition * 14.5;
                return (
                  <g>
                    <line x1={fx} y1="155" x2={fx} y2="180" stroke="#fbbf24" strokeWidth="2.5" />
                    <polygon
                      points={`${fx},155 ${fx+20},162 ${fx},169`}
                      fill="#e11d48"
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                    <circle cx={fx} cy="180" r="4" fill="#fbbf24" />
                  </g>
                );
              })()}

              {/* Sparks */}
              {sparksOffset !== null && (() => {
                const sx = 500 + ropePosition * 14.5 + sparksOffset;
                return (
                  <g transform={`translate(${sx}, 175)`}>
                    <circle cx="0" cy="0" r="10" fill="#fbbf24" opacity="0.5" className="animate-ping" />
                    <text x="-6" y="5" fontSize="12" fill="#fff">⚡</text>
                  </g>
                );
              })()}
            </svg>

            {/* Win/Loss zone labels */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-between text-[9px] font-mono text-slate-600 font-bold px-6 select-none">
              <span className="text-cyan-600 flex items-center gap-1"><Trophy className="w-3 h-3" /> {teamLeft.name}</span>
              <span>MARKAZ</span>
              <span className="text-rose-600 flex items-center gap-1">{teamRight.name} <Trophy className="w-3 h-3" /></span>
            </div>
          </div>

          {/* Answer terminals */}
          {phase === 'battle' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">

              {/* Left terminal */}
              <div className={`p-5 rounded-3xl border transition-all duration-300 ${
                leftFrozen ? 'bg-rose-950/20 border-rose-600/50' : 'bg-slate-900 border-slate-800 hover:border-cyan-500/30'
              }`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-4">
                  <span style={{ color: teamLeft.color }} className="text-[10px] font-black uppercase tracking-wider">
                    {teamLeft.name} TERMINALI
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">HEADWAY DRILL</span>
                </div>

                {leftFrozen ? (
                  <div className="h-[200px] flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                    <h4 className="font-black text-rose-500 text-sm uppercase">XATO! JARIMA!</h4>
                    <p className="text-[10px] text-zinc-500">Jamoa arqonda sirg'andi. 1.4 soniya kutish...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 py-3.5 px-5 rounded-2xl border border-slate-900">
                      <span className="text-cyan-500 text-[9px] uppercase font-black block mb-1.5">INGLIZCHASI NIMA?</span>
                      <h3 className="text-xl font-black text-white uppercase tracking-wide">{leftWord.uz}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {leftOptions.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleLeftAnswer(opt)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 p-4 rounded-xl text-xs font-black text-white transition-all uppercase cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right terminal */}
              <div className={`p-5 rounded-3xl border transition-all duration-300 ${
                rightFrozen ? 'bg-rose-950/20 border-rose-600/50' : 'bg-slate-900 border-slate-800 hover:border-rose-500/30'
              }`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-4">
                  <span style={{ color: teamRight.color }} className="text-[10px] font-black uppercase tracking-wider">
                    {teamRight.name} TERMINALI
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">HEADWAY DRILL</span>
                </div>

                {rightFrozen ? (
                  <div className="h-[200px] flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                    <h4 className="font-black text-rose-500 text-sm uppercase">XATO! JARIMA!</h4>
                    <p className="text-[10px] text-zinc-500">Jamoa arqonda sirg'andi. 1.4 soniya kutish...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 py-3.5 px-5 rounded-2xl border border-slate-900">
                      <span className="text-rose-500 text-[9px] uppercase font-black block mb-1.5">INGLIZCHASI NIMA?</span>
                      <h3 className="text-xl font-black text-white uppercase tracking-wide">{rightWord.uz}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {rightOptions.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleRightAnswer(opt)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-rose-500 hover:text-rose-400 p-4 rounded-xl text-xs font-black text-white transition-all uppercase cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Victory screen */}
          {phase === 'ended' && (
            <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/50 to-rose-950/40 border border-slate-800 py-8 px-10 rounded-3xl text-center space-y-4 mt-4 max-w-lg mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-400 via-indigo-500 to-rose-400" />
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto animate-spin" />
              <div className="space-y-1">
                <span className="text-[10px] text-yellow-400 font-extrabold tracking-widest uppercase block">MUSOBAQA YAKUNLANDI!</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {winnerSide === 'left' ? teamLeft.name : teamRight.name} G'ALABA! 🏆
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">Natijalar yangilanmoqda...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
