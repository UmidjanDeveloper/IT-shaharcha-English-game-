import React, { useState } from 'react';
import { GameDifficulty, GameState, GameType, Team } from './types';
import Header from './components/Header';
import SetupScreen from './components/SetupScreen';
import VocabularyGame from './components/VocabularyGame';
import Leaderboard from './components/Leaderboard';
import TeacherSettings from './components/TeacherSettings';
import { sound } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedGame, setSelectedGame] = useState<GameType>('word-duel');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('beginner');
  
  // Custom states
  const [useCustomVocabulary, setUseCustomVocabulary] = useState(false);
  const [showTeacherSettings, setShowTeacherSettings] = useState(false);

  // Teams with custom emojis and values
  const [teamLeft, setTeamLeft] = useState<Team>({ name: 'Cyber Tigers', score: 0, color: '#3b82f6', emoji: '⚡' });
  const [teamRight, setTeamRight] = useState<Team>({ name: 'Matrix Wolves', score: 0, color: '#ef4444', emoji: '👾' });
  const [maxScore, setMaxScore] = useState(10);
  const [winner, setWinner] = useState<Team | null>(null);

  // Live score states for the header display
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);

  const handleStartGame = (config: {
    selectedGame: GameType;
    selectedDifficulty: GameDifficulty;
    teamLeft: Team;
    teamRight: Team;
    maxScore: number;
  }) => {
    setSelectedGame(config.selectedGame);
    setSelectedDifficulty(config.selectedDifficulty);
    setTeamLeft(config.teamLeft);
    setTeamRight(config.teamRight);
    setMaxScore(config.maxScore);
    
    // Reset running scores
    setLeftScore(0);
    setRightScore(0);
    setWinner(null);
    setGameState('playing');
  };

  const handleUpdateScore = (leftS: number, rightS: number) => {
    setLeftScore(leftS);
    setRightScore(rightS);
  };

  const handleGameWin = (winningTeam: Team) => {
    const isLeft = winningTeam.name === teamLeft.name;
    const finalScore = isLeft ? Math.max(leftScore, winningTeam.score) : Math.max(rightScore, winningTeam.score);
    setWinner({ ...winningTeam, score: finalScore });
    setGameState('ended');
  };

  const handleRematch = () => {
    sound.playCorrect();
    setLeftScore(0);
    setRightScore(0);
    setWinner(null);
    setGameState('playing');
  };

  const handleReset = () => {
    sound.playTap();
    setGameState('setup');
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-stretch text-slate-100 relative">
      
      {/* Absolute cyber nodes background styling */}
      <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none opacity-40 z-0 overflow-hidden">
        {/* Subtle grid and lines representing connection circuitry */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Abstract glowing branch nodes matching the logo */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      {/* Styled Interactive Layout Header */}
      <Header
        leftScore={gameState === 'playing' ? leftScore : undefined}
        rightScore={gameState === 'playing' ? rightScore : undefined}
        leftTeamName={teamLeft.name}
        rightTeamName={teamRight.name}
        leftColor={teamLeft.color}
        rightColor={teamRight.color}
        onReset={handleReset}
      />

      {/* Primary Game Display Window */}
      <main className="flex-1 w-full flex flex-col justify-start relative z-10">
        {gameState === 'setup' && (
          <SetupScreen
            teamLeft={teamLeft}
            teamRight={teamRight}
            maxScore={maxScore}
            useCustomVocabulary={useCustomVocabulary}
            onStartGame={handleStartGame}
            onOpenTeacherSettings={() => setShowTeacherSettings(true)}
          />
        )}

        {gameState === 'playing' && (
          <div className="flex-1 w-full bg-slate-950/85 backdrop-blur-[2px] transition-all">
            <VocabularyGame
              selectedGame={selectedGame}
              selectedDifficulty={selectedDifficulty}
              teamLeft={teamLeft}
              teamRight={teamRight}
              maxScore={maxScore}
              useCustomVocabulary={useCustomVocabulary}
              onGameWin={handleGameWin}
              onUpdateScore={handleUpdateScore}
            />
          </div>
        )}

        {gameState === 'ended' && winner && (
          <Leaderboard
            winner={winner}
            leftTeam={{ ...teamLeft, score: leftScore }}
            rightTeam={{ ...teamRight, score: rightScore }}
            onRematch={handleRematch}
            onHome={handleReset}
          />
        )}
      </main>

      {/* Teacher Settings Cockpit Modal Trigger */}
      {showTeacherSettings && (
        <TeacherSettings
          teamLeft={teamLeft}
          teamRight={teamRight}
          maxScore={maxScore}
          useCustomVocabulary={useCustomVocabulary}
          onUpdateTeams={(left, right) => {
            setTeamLeft(left);
            setTeamRight(right);
          }}
          onUpdateMaxScore={setMaxScore}
          onToggleCustomVocabulary={setUseCustomVocabulary}
          onClose={() => setShowTeacherSettings(false)}
        />
      )}

      {/* Beautiful humble footer */}
      <footer className="w-full text-center py-4 border-t border-slate-900/40 text-xs text-slate-500 bg-slate-950 relative z-10 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>IT Shaharcha • Xatirchi tumani • Yoshlar Axborot Texnologiyalari Markazi</span>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">IQ-ARENA INTERFAOL DOSKA TAYYOR TIZIMI</span>
        </div>
      </footer>

    </div>
  );
}
