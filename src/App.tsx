import React, { useState } from 'react';
import { GameDifficulty, GameState, GameType, Team } from './types';
import Header from './components/Header';
import SetupScreen from './components/SetupScreen';
import VocabularyGame from './components/VocabularyGame';
import Leaderboard from './components/Leaderboard';
import TeacherSettings from './components/TeacherSettings';
import ShadowingGame from './components/ShadowingGame';
import DubbingGame from './components/DubbingGame';
import { ALL_GAMES } from './academy/gameCatalog';
import { sound } from './utils/audio';

type Launch = { initialGame?: GameType; difficulty?: GameDifficulty; section?: 'games' | 'shadowing' | 'dubbing'; onLeave?: () => void };
export default function App({initialGame, difficulty = 'beginner', section = 'games', onLeave}: Launch) {
  const [appSection, setAppSection] = useState<'games' | 'shadowing' | 'dubbing'>(section);
  const [gameState, setGameState] = useState<GameState>(initialGame ? 'playing' : 'setup');
  const [selectedGame, setSelectedGame] = useState<GameType>(initialGame ?? 'word-duel');
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>(difficulty);
  
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
    if (onLeave) { onLeave(); return; }
    setAppSection('games');
    setGameState('setup');
    setWinner(null);
  };

  return (
    <div className={onLeave ? 'integrated-game' : 'min-h-screen bg-slate-950 text-slate-100 relative'}>
      {onLeave && initialGame ? <div className="club-game-header"><div>
        <h1>{ALL_GAMES.find(game=>game.id===initialGame)?.title}</h1>
        <p>{teamLeft.name} {leftScore} · {rightScore} {teamRight.name}</p>
      </div><button className="secondary-button" onClick={()=>setShowTeacherSettings(true)}>Sozlamalar</button></div> :
        !onLeave && <Header leftScore={leftScore} rightScore={rightScore} leftTeamName={teamLeft.name} rightTeamName={teamRight.name} leftColor={teamLeft.color} rightColor={teamRight.color} onReset={handleReset}/>}
      {/* Primary Game Display Window */}
      <section className="flex-1 w-full flex flex-col justify-start relative z-10">

        {/* Shadowing Section */}
        {appSection === 'shadowing' && (
          <ShadowingGame onBack={handleReset} />
        )}

        {/* Dubbing Section */}
        {appSection === 'dubbing' && (
          <DubbingGame onBack={handleReset} />
        )}

        {appSection === 'games' && gameState === 'setup' && (
          <SetupScreen
            teamLeft={teamLeft}
            teamRight={teamRight}
            maxScore={maxScore}
            useCustomVocabulary={useCustomVocabulary}
            onStartGame={handleStartGame}
            onOpenTeacherSettings={() => setShowTeacherSettings(true)}
            onOpenShadowing={() => setAppSection('shadowing')}
            onOpenDubbing={() => setAppSection('dubbing')}
          />
        )}

        {appSection === 'games' && gameState === 'playing' && (
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

        {appSection === 'games' && gameState === 'ended' && winner && (
          <Leaderboard
            winner={winner}
            leftTeam={{ ...teamLeft, score: leftScore }}
            rightTeam={{ ...teamRight, score: rightScore }}
            onRematch={handleRematch}
            onHome={handleReset}
          />
        )}
      </section>

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


    </div>
  );
}
