import { ALL_GAMES } from '../academy/gameCatalog';
import React, { useState } from 'react';
import { GameDifficulty, Team, GameType, GameMode, GameMetadata } from '../types';
import { sound } from '../utils/audio';
import { Gamepad2, Settings, ArrowRight, Sparkles, BookOpen, ChevronDown, ChevronUp, Mic } from 'lucide-react';

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
  onOpenShadowing: () => void;
  onOpenDubbing: () => void;
}

export default function SetupScreen({
  teamLeft,
  teamRight,
  maxScore,
  useCustomVocabulary,
  onStartGame,
  onOpenTeacherSettings,
  onOpenShadowing,
  onOpenDubbing
}: SetupScreenProps) {
  const [selectedGame, setSelectedGame] = useState<GameType>('word-duel');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('beginner');
  const [activeTabMode, setActiveTabMode] = useState<GameMode>('duel');
  const [showInstructions, setShowInstructions] = useState(true);

  const handleStart = () => {
    sound.playCorrect();
    onStartGame({ selectedGame, selectedDifficulty, teamLeft, teamRight, maxScore });
  };

  const selectGame = (gameId: GameType) => {
    sound.playTap();
    setSelectedGame(gameId);
    setShowInstructions(true);
  };

  const changeTabMode = (mode: GameMode) => {
    sound.playTap();
    setActiveTabMode(mode);
    const match = ALL_GAMES.find(g => g.mode === mode);
    if (match) setSelectedGame(match.id);
    setShowInstructions(true);
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
          54 ta interaktiv o'yin! Headway kitobiga asoslangan. Har bir o'yin ingliz tilini mukammal o'rgatadi.
        </p>
      </div>

      {/* Speaking sections — Shadowing + Dubbing */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {/* Shadowing */}
        <button
          onClick={() => { sound.playTap(); onOpenShadowing(); }}
          className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 hover:border-indigo-400/70 rounded-2xl px-4 py-4 cursor-pointer transition-all group shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Yangi ✨</p>
              <h3 className="text-sm font-black text-white">🎤 Shadowing</h3>
              <p className="text-[9px] text-slate-400">Tinglang va talaffuz qiling</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </button>

        {/* Dubbing */}
        <button
          onClick={() => { sound.playTap(); onOpenDubbing(); }}
          className="flex items-center justify-between gap-3 bg-gradient-to-r from-rose-950/80 to-orange-950/80 border border-rose-500/40 hover:border-rose-400/70 rounded-2xl px-4 py-4 cursor-pointer transition-all group shadow-xl shadow-rose-500/10 hover:shadow-rose-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-lg">🎬</span>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Yangi ✨</p>
              <h3 className="text-sm font-black text-white">🎬 Dublyaj Studio</h3>
              <p className="text-[9px] text-slate-400">Kinolarga ovoz bering</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </button>
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

        {/* Right: Settings + Instructions */}
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

            {/* How to Play — always visible when game selected */}
            {selectedMeta && (
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 overflow-hidden">
                <button
                  onClick={() => setShowInstructions(v => !v)}
                  className="w-full p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-indigo-900/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <div className="text-left">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Qanday o'ynash kerak?</span>
                      <span className="text-xs font-black text-white">{selectedMeta.icon} {selectedMeta.title}</span>
                    </div>
                  </div>
                  {showInstructions
                    ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  }
                </button>
                {showInstructions && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {selectedMeta.howToPlay.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-[9px] font-black flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-[10px] text-slate-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
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
          UZBEKISTAN INTERACTIVE WHITEBOARD SYSTEM PRO — 54 O'YIN
        </span>
      </div>
    </div>
  );
}
