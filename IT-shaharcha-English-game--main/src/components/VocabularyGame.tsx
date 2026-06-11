import React from 'react';
import { GameDifficulty, Team, GameType, GameMode } from '../types';
import { defaultVocabularyPairs, getTeacherVocabulary, getVocabularyByLevel } from '../utils/data';
import SoloGames from './SoloGames';
import DuelGames from './DuelGames';
import TeamGames from './TeamGames';

interface VocabularyGameProps {
  selectedGame: GameType;
  selectedDifficulty: GameDifficulty;
  teamLeft: Team;
  teamRight: Team;
  maxScore: number;
  useCustomVocabulary: boolean;
  onGameWin: (winner: Team) => void;
  onUpdateScore: (leftScore: number, rightScore: number) => void;
}

export default function VocabularyGame({
  selectedGame,
  selectedDifficulty,
  teamLeft,
  teamRight,
  maxScore,
  useCustomVocabulary,
  onGameWin,
  onUpdateScore
}: VocabularyGameProps) {
  const sourceVocabulary = useCustomVocabulary ? getTeacherVocabulary() : defaultVocabularyPairs;
  const activeWordList = getVocabularyByLevel(selectedDifficulty, sourceVocabulary);

  const [soloScore, setSoloScore] = React.useState(0);

  React.useEffect(() => {
    setSoloScore(0);
  }, [selectedGame]);

  const getGameMode = (gameId: GameType): GameMode => {
    const soloList: GameType[] = [
      'spelling-bee', 'hangman', 'word-search', 'anagram', 'fill-blank',
      'emoji-quiz', 'synonym-find', 'definition-quiz', 'word-scramble',
      'listening-quiz', 'vocab-speed', 'letter-hint', 'grammar-choose',
      'word-builder', 'flashcard-solo', 'odd-one-out'
    ];
    const duelList: GameType[] = [
      'word-duel', 'flashcard-battle', 'spelling-race', 'sentence-duel',
      'true-false', 'sentence-sprint', 'phrase-builder',
      'speed-quiz', 'word-bomb', 'definition-duel', 'emoji-battle',
      'grammar-clash', 'synonym-duel', 'antonym-duel', 'vocab-blitz',
      'sentence-fix', 'word-race', 'analogy-quiz'
    ];
    const teamList: GameType[] = [
      'team-quiz', 'category-sort', 'word-chain', 'hot-seat', 'pictionary',
      'memory-match', 'tug-of-war', 'category-quiz', 'memory-rush', 'picture-quest',
      'vocabulary-bingo', 'english-taboo', 'team-spelling', 'word-pyramid',
      'vocab-relay', 'story-builder', 'word-wheel', 'grammar-team', 'speed-sort',
      'password-game'
    ];

    if (soloList.includes(gameId)) return 'solo';
    if (duelList.includes(gameId)) return 'duel';
    if (teamList.includes(gameId)) return 'team';
    return 'solo';
  };

  const mode = getGameMode(selectedGame);

  return (
    <div className="w-full h-full flex flex-col justify-start">
      {mode === 'solo' && (
        <div className="p-4 md:p-6 animate-fade-in">
          <SoloGames
            gameType={selectedGame}
            wordList={activeWordList}
            onAddScore={(points) => {
              const updatedScore = soloScore + points;
              setSoloScore(updatedScore);
              onUpdateScore(updatedScore, 0);
              if (updatedScore >= maxScore) {
                onGameWin({ ...teamLeft, score: updatedScore });
              }
            }}
            onNextQuestion={() => {}}
          />
        </div>
      )}

      {mode === 'duel' && (
        <div className="flex-1 animate-fade-in">
          <DuelGames
            gameType={selectedGame}
            teamLeft={teamLeft}
            teamRight={teamRight}
            wordList={activeWordList}
            maxScore={maxScore}
            onGameWin={onGameWin}
            onUpdateScore={onUpdateScore}
          />
        </div>
      )}

      {mode === 'team' && (
        <div className="flex-1 animate-fade-in">
          <TeamGames
            gameType={selectedGame}
            teamLeft={teamLeft}
            teamRight={teamRight}
            wordList={activeWordList}
            maxScore={maxScore}
            onGameWin={onGameWin}
            onUpdateScore={onUpdateScore}
          />
        </div>
      )}
    </div>
  );
}
