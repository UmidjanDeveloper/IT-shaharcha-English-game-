import React, { useState } from 'react';
import { GameDifficulty, Team, GameType, GameMode, GameMetadata } from '../types';
import { sound } from '../utils/audio';
import { Gamepad2, Settings, ArrowRight, Sparkles } from 'lucide-react';

interface SetupScreenProps {
  teamLeft: Team;
  teamRight: Team;
  maxScore: number;
  useCustomVocabulary: boolean;
  onStartGame: (config: {
    selectedGame: GameType;
    selectedDifficulty: GameDifficulty;
    teamLeft: Team;
    teamRight: Team;
    maxScore: number;
  }) => void;
  onOpenTeacherSettings: () => void;
}

const ALL_GAMES: GameMetadata[] = [
  // =========== SOLO GAMES (15) ===========
  { id: 'spelling-bee', title: 'Spelling Bee 🐝', description: "O'zbekcha so'zni inglizcha harflab to'g'ri yozish.", mode: 'solo', icon: '🐝' },
  { id: 'hangman', title: 'Hangman 💀', description: 'Harflarni taxmin qilib yashirin so\'zni topish.', mode: 'solo', icon: '💀' },
  { id: 'anagram', title: 'Anagram o\'yini 🔮', description: 'Aralashtirilgan harflardan so\'z yasang.', mode: 'solo', icon: '🔮' },
  { id: 'word-search', title: 'Word Search 🔍', description: 'Harflar to\'ridan inglizcha so\'zlarni izlash.', mode: 'solo', icon: '🔍' },
  { id: 'fill-blank', title: 'Gap To\'ldirish 📝', description: 'Inglizcha gapdagi bo\'sh joyga mos so\'zni qo\'yish.', mode: 'solo', icon: '📝' },
  { id: 'emoji-quiz', title: 'Emoji Quiz 🎯', description: 'Emoji ko\'rinib turadi – uning inglizcha so\'zini toping!', mode: 'solo', icon: '🎯' },
  { id: 'synonym-find', title: 'Sinonim Topish 🔄', description: 'Ko\'rsatilgan so\'zning inglizcha sinonimini toping.', mode: 'solo', icon: '🔄' },
  { id: 'definition-quiz', title: 'Ta\'rif Testi 📖', description: 'Inglizcha ta\'rifdan so\'zni aniqlang.', mode: 'solo', icon: '📖' },
  { id: 'word-scramble', title: 'So\'z Aralashtirish 🌀', description: 'Aralashtirilgan harflarni tartibga solib so\'z hosil qiling.', mode: 'solo', icon: '🌀' },
  { id: 'listening-quiz', title: 'Eshitib Yozish 🎧', description: 'So\'z aytiladi – inglizcha yozing!', mode: 'solo', icon: '🎧' },
  { id: 'vocab-speed', title: 'Tezkor Lug\'at ⚡', description: '60 soniya ichida imkon qadar ko\'proq so\'z tarjima qiling.', mode: 'solo', icon: '⚡' },
  { id: 'letter-hint', title: 'Harf Yashirish 🔐', description: 'Faqat birinchi harf ko\'rinadi – so\'zni toping!', mode: 'solo', icon: '🔐' },
  { id: 'grammar-choose', title: 'Grammatika Tanlash 📚', description: 'To\'g\'ri grammatik shaklni tanlang.', mode: 'solo', icon: '📚' },
  { id: 'word-builder', title: 'So\'z Quruvchi 🏗️', description: 'Berilgan syllablardan inglizcha so\'z yasang.', mode: 'solo', icon: '🏗️' },
  { id: 'flashcard-solo', title: 'Flashcard Solo 🃏', description: 'Kartochkalarni ag\'darib so\'z eslab qolish mashqi.', mode: 'solo', icon: '🃏' },

  // =========== DUEL GAMES (17) ===========
  { id: 'word-duel', title: 'Word Duel ⚔️ ⭐', description: 'Split-screen: uchar so\'zlar orasidan tezkor topish.', mode: 'duel', icon: '⚔️' },
  { id: 'true-false', title: 'True-False Clash ⚖️', description: 'Tezkor Rost yoki Yolg\'on: kim birinchi to\'g\'ri topsa!', mode: 'duel', icon: '⚖️' },
  { id: 'spelling-race', title: 'Spelling Race 🏎️', description: 'Kim birinchi harflarni to\'g\'ri joylaydi.', mode: 'duel', icon: '🏎️' },
  { id: 'sentence-duel', title: 'Sentence Builder 🧱', description: 'Gap so\'zlarini to\'g\'ri tartibga solish musobaqasi.', mode: 'duel', icon: '🧱' },
  { id: 'flashcard-battle', title: 'Flashcard Battle ⚡', description: 'Yopiq kartalar – eslab qoling va topishda raqobat.', mode: 'duel', icon: '⚡' },
  { id: 'speed-quiz', title: 'Speed Quiz 🚀', description: 'Eng tez to\'g\'ri javob berganni ball kutmoqda!', mode: 'duel', icon: '🚀' },
  { id: 'word-bomb', title: 'Word Bomb 💣', description: '10 soniya vaqt! To\'g\'ri tarjima yoki ball yo\'qotasiz!', mode: 'duel', icon: '💣' },
  { id: 'definition-duel', title: 'Definition Duel 📜', description: 'Ta\'rifni o\'qing – birinchi to\'g\'ri javob bergan g\'alaba!', mode: 'duel', icon: '📜' },
  { id: 'emoji-battle', title: 'Emoji Battle 🎮', description: 'Emoji ko\'rsatiladi – kim birinchi inglizcha so\'z topadi?', mode: 'duel', icon: '🎮' },
  { id: 'grammar-clash', title: 'Grammar Clash 🔬', description: 'To\'g\'ri grammatik shaklni birinchi topuvchi g\'alaba!', mode: 'duel', icon: '🔬' },
  { id: 'synonym-duel', title: 'Synonym Duel 🔁', description: 'Sinonimni kim birinchi topadi!', mode: 'duel', icon: '🔁' },
  { id: 'antonym-duel', title: 'Antonym Duel 🔃', description: 'Antonimni kim birinchi topadi!', mode: 'duel', icon: '🔃' },
  { id: 'vocab-blitz', title: 'Vocab Blitz 🌪️', description: 'Tez tarjima tanlash musobaqasi – kim tez, o\'sha g\'alaba!', mode: 'duel', icon: '🌪️' },
  { id: 'sentence-fix', title: 'Sentence Fix 🔧', description: 'Noto\'g\'ri gapni kim birinchi tuzatadi?', mode: 'duel', icon: '🔧' },
  { id: 'word-race', title: 'Word Race 🏁', description: 'Harflarni ketma-ket to\'g\'ri joylashtirib so\'z hosil qiling.', mode: 'duel', icon: '🏁' },
  { id: 'sentence-sprint', title: 'Sentence Sprint 🏃', description: 'Gapni tez tuzib, birinchi bo\'lgan g\'alaba!', mode: 'duel', icon: '🏃' },
  { id: 'phrase-builder', title: 'Phrase Builder 🧠', description: 'Inglizcha iborani to\'g\'ri tuzing.', mode: 'duel', icon: '🧠' },

  // =========== TEAM GAMES (19) ===========
  { id: 'tug-of-war', title: 'Arqon Tortish 🪢 ⭐', description: 'Real-time arqon tortish: to\'g\'ri javob arqonni tortadi! (3 daraja)', mode: 'team', icon: '🪢' },
  { id: 'team-quiz', title: 'Team Quiz 🙋', description: 'Jamoalar navbat bilan tarjima savollariga javob beradi.', mode: 'team', icon: '🙋' },
  { id: 'memory-match', title: 'Memory Match 🧩', description: 'Tarjima kartochkalarining juftliklarini ochish.', mode: 'team', icon: '🧩' },
  { id: 'word-chain', title: 'Word Chain 🔗', description: 'Oxirgi harfdan yangi inglizcha so\'z yozish estafetasi.', mode: 'team', icon: '🔗' },
  { id: 'hot-seat', title: 'Hot Seat 🔥', description: 'Teskari o\'tirgan o\'quvchiga inglizcha tushuntirish yarishi.', mode: 'team', icon: '🔥' },
  { id: 'pictionary', title: 'Pictionary 🎨', description: 'Doskada rasm chiziladi, jamoasi inglizchasini topadi.', mode: 'team', icon: '🎨' },
  { id: 'category-sort', title: 'Category Sort 🗂️', description: 'So\'zlarni guruhlarga saralash.', mode: 'team', icon: '🗂️' },
  { id: 'vocabulary-bingo', title: 'Vocabulary Bingo 🎰', description: '5x5 bingo! O\'qituvchi o\'zbekcha o\'qiydi – inglizchani topib belgilang!', mode: 'team', icon: '🎰' },
  { id: 'english-taboo', title: 'English Taboo 🚫', description: 'So\'zni taqiqlangan so\'zlarsiz tushuntiring!', mode: 'team', icon: '🚫' },
  { id: 'team-spelling', title: 'Jamoaviy Spelling 🔤', description: 'Jamoalar navbat bilan so\'zlarni inglizcha harflab yozadi.', mode: 'team', icon: '🔤' },
  { id: 'word-pyramid', title: 'So\'z Piramidasi 🔺', description: 'Keng kategoriyadan aniq so\'zga qarab: kim ko\'proq biladi?', mode: 'team', icon: '🔺' },
  { id: 'vocab-relay', title: 'Lug\'at Estafetasi 🏃', description: 'Navbat bilan tarjima qiling – zanjirni uzmasdan!', mode: 'team', icon: '🏃' },
  { id: 'story-builder', title: 'Hikoya Quruvchi 📖', description: 'Inglizcha so\'zlardan qo\'shib hikoya qurishda raqobat!', mode: 'team', icon: '📖' },
  { id: 'word-wheel', title: 'So\'z G\'ildiragi 🎡', description: 'G\'ildirak aylantiring, kategoriya chiqadi – o\'sha sohadan so\'z ayting!', mode: 'team', icon: '🎡' },
  { id: 'grammar-team', title: 'Grammatika Jamoasi 📐', description: 'Noto\'g\'ri gaplarni jamoaviy tuzatish musobaqasi.', mode: 'team', icon: '📐' },
  { id: 'speed-sort', title: 'Tezkor Saralash 🌀', description: 'So\'zlarni kategoriyalarga tez-tez joylashtiring!', mode: 'team', icon: '🌀' },
  { id: 'category-quiz', title: 'Category Quiz 🎯', description: 'Kategoriyaviy savol-javob musobaqasi.', mode: 'team', icon: '🎯' },
  { id: 'memory-rush', title: 'Memory Rush 🧠', description: 'Xotira kartalarini tez topish bilan g\'alaba!', mode: 'team', icon: '🧩' },
  { id: 'picture-quest', title: 'Picture Quest 🖼️', description: 'Chizilgan rasm asosida so\'zni toping.', mode: 'team', icon: '🖼️' },
];

export default function SetupScreen({
  teamLeft,
  teamRight,
  maxScore,
  useCustomVocabulary,
  onStartGame,
  onOpenTeacherSettings
}: SetupScreenProps) {
  const [selectedGame, setSelectedGame] = useState<GameType>('word-duel');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('beginner');
  const [activeTabMode, setActiveTabMode] = useState<GameMode>('duel');

  const handleStart = () => {
    sound.playCorrect();
    onStartGame({ selectedGame, selectedDifficulty, teamLeft, teamRight, maxScore });
  };

  const selectGame = (gameId: GameType) => {
    sound.playTap();
    setSelectedGame(gameId);
  };

  const changeTabMode = (mode: GameMode) => {
    sound.playTap();
    setActiveTabMode(mode);
    const match = ALL_GAMES.find(g => g.mode === mode);
    if (match) setSelectedGame(match.id);
  };

  const modeGames = ALL_GAMES.filter(g => g.mode === activeTabMode);
  const selectedMeta = ALL_GAMES.find(g => g.id === selectedGame);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 select-none animate-fade-in text-center">

      {/* Header */}
      <div className="relative mb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/8 blur-3xl pointer-events-none rounded-full" />
        <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500 uppercase tracking-widest block mb-1">
          ENGLISH LEARNING ARENA
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
          IT SHAHARCHA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400">XATIRCHI</span>
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto text-xs md:text-sm mt-2 leading-relaxed">
          51 ta interaktiv o'yin! Headway kitobiga asoslangan. Har bir o'yin ingliz tilini mukammal o'rgatadi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* Left: Game Selection */}
        <div className="md:col-span-2 space-y-4 text-left">
          <div className="bg-slate-900/60 border border-slate-900 p-5 rounded-3xl shadow-xl space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>O'yinlar to'plami</span>
                <span className="bg-cyan-500/20 text-cyan-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {ALL_GAMES.length} ta
                </span>
              </h2>

              <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['solo', 'duel', 'team'] as GameMode[]).map(mode => {
                  const labels: Record<GameMode, string> = { solo: 'Yakka', duel: 'Duel', team: 'Jamoa' };
                  const colors: Record<GameMode, string> = { solo: 'bg-amber-500', duel: 'bg-cyan-500', team: 'bg-rose-500' };
                  return (
                    <button
                      key={mode}
                      onClick={() => changeTabMode(mode)}
                      className={`px-3 py-1 font-extrabold uppercase text-[10px] rounded-lg transition-all ${
                        activeTabMode === mode ? `${colors[mode]} text-slate-950 shadow-md` : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              {modeGames.map((game) => {
                const isSelected = selectedGame === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => selectGame(game.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all active:scale-98 flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950 border-slate-900 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <span className="text-2xl mt-0.5 flex-shrink-0">{game.icon}</span>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-black uppercase truncate ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                        {game.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal line-clamp-2">
                        {game.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right: Settings */}
        <div className="space-y-4 text-left">
          <div className="bg-slate-900/60 border border-slate-900 p-5 rounded-3xl shadow-xl space-y-4">

            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-amber-500" />
                Sozlamalar
              </h3>
              <button
                onClick={() => { sound.playTap(); onOpenTeacherSettings(); }}
                className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-black text-amber-400 hover:text-white uppercase transition-all"
              >
                O'zgartirish
              </button>
            </div>

            {/* Selected game preview */}
            {selectedMeta && (
              <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/20 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedMeta.icon}</span>
                  <span className="text-xs font-black text-cyan-400 uppercase">{selectedMeta.title}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">{selectedMeta.description}</p>
              </div>
            )}

            {/* Teams */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-black block">Faol Jamoalar:</span>
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span style={{ color: teamLeft.color }} className="flex items-center gap-1">
                  <span>{teamLeft.emoji}</span> {teamLeft.name}
                </span>
                <span className="text-slate-500">vs</span>
                <span style={{ color: teamRight.color }} className="flex items-center gap-1">
                  {teamRight.name} <span>{teamRight.emoji}</span>
                </span>
              </div>
            </div>

            {/* Max score */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
              <span className="text-[9px] text-slate-500 uppercase font-black">G'alaba chegarasi:</span>
              <span className="text-xs font-bold font-mono text-emerald-400">{maxScore} Ball</span>
            </div>

            {/* Vocabulary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center">
              <span className="text-[9px] text-slate-500 uppercase font-black">Lug'at:</span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase">
                {useCustomVocabulary ? 'Shaxsiy 📝' : 'Standart 🗂️'}
              </span>
            </div>

            {/* Difficulty */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
              <span className="text-[9px] text-slate-500 uppercase font-black block">Daraja:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['beginner', 'elementary', 'advanced'] as const).map((level) => {
                  const labels = { beginner: 'Beginner', elementary: 'Elementary', advanced: 'Advanced' };
                  return (
                    <button
                      key={level}
                      onClick={() => { sound.playTap(); setSelectedDifficulty(level); }}
                      className={`py-2 rounded-xl border text-[9px] uppercase font-black transition-all ${
                        selectedDifficulty === level
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {labels[level]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 hover:from-cyan-400 hover:via-indigo-400 hover:to-rose-400 text-slate-950 text-sm font-black uppercase py-3.5 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 shadow-xl transition-all cursor-pointer border border-white/20"
            >
              Bellashuvni boshlash
              <ArrowRight className="w-5 h-5" strokeWidth="2.5" />
            </button>

          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-950/40 border border-slate-900 p-3 rounded-2xl flex items-center justify-center gap-2 max-w-lg mx-auto">
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="text-[10px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase tracking-widest">
          UZBEKISTAN INTERACTIVE WHITEBOARD SYSTEM PRO — 51 O'YIN
        </span>
      </div>
    </div>
  );
}
