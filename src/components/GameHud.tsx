import React from 'react';
import { LevelConfig, CandyColor } from '../types/game';
import { Volume2, VolumeX, Lightbulb, RotateCcw, Map, HelpCircle, Star } from 'lucide-react';

interface GameHudProps {
  level: LevelConfig;
  score: number;
  movesLeft: number;
  stars: number;
  isMuted: boolean;
  onToggleSound: () => void;
  onShowHint: () => void;
  onRestart: () => void;
  onOpenMap: () => void;
  onOpenHelp: () => void;
  goalStatus: {
    frostingLeft: number;
    chocolateLeft: number;
    candiesCollected: Partial<Record<CandyColor, number>>;
    ingredientsLeft: number;
  };
}

export const GameHud: React.FC<GameHudProps> = ({
  level,
  score,
  movesLeft,
  stars,
  isMuted,
  onToggleSound,
  onShowHint,
  onRestart,
  onOpenMap,
  onOpenHelp,
  goalStatus,
}) => {
  // Score bar percentage up to 3 stars
  const maxScore = level.threeStarScore;
  const scorePercent = Math.min(100, Math.round((score / maxScore) * 100));

  const star1Percent = (level.targetScore / maxScore) * 100;
  const star2Percent = (level.twoStarScore / maxScore) * 100;

  return (
    <div className="w-full max-w-xl mx-auto mb-2 px-3">
      {/* Top action row */}
      <div className="flex items-center justify-between py-2 text-sm text-amber-900 border-b border-amber-200/60 mb-2">
        <button
          onClick={onOpenMap}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors shadow-sm"
        >
          <Map className="w-3.5 h-3.5" />
          <span>Level Map</span>
        </button>

        <div className="text-center">
          <span className="font-candy text-base font-bold text-amber-950">
            Level {level.id}
          </span>
          <span className="text-amber-800/80 text-xs ml-1.5 font-medium">
            {level.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSound}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100/70 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onShowHint}
            aria-label="Show hint"
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100/70 rounded-lg transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
          <button
            onClick={onRestart}
            aria-label="Restart level"
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100/70 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenHelp}
            aria-label="Game rules & combo guide"
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100/70 rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="bg-amber-100/80 rounded-2xl p-3 border border-amber-200 shadow-sm flex flex-col gap-2">
        {/* Moves & Score Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Moves Box */}
          <div className="flex flex-col items-center justify-center bg-white px-4 py-1.5 rounded-xl border border-amber-200/80 shadow-xs min-w-[76px]">
            <span className="text-[10px] font-semibold tracking-wider text-amber-700 uppercase">
              Moves
            </span>
            <span className={`font-candy text-2xl font-bold tabular-nums ${movesLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-amber-950'}`}>
              {movesLeft}
            </span>
          </div>

          {/* Goal Objectives Area */}
          <div className="flex-1 flex flex-wrap items-center justify-center gap-2">
            {/* Frosting Goal */}
            {level.goals.clearFrosting !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-sky-950 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-300 border border-sky-400 inline-block" />
                <span className="font-medium">Frosting:</span>
                <span className="font-bold tabular-nums">
                  {Math.max(0, goalStatus.frostingLeft)} left
                </span>
              </div>
            )}

            {/* Chocolate Goal */}
            {level.goals.clearChocolate !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-amber-950 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#5C2C16] border border-[#2A1005] inline-block" />
                <span className="font-medium">Chocolate:</span>
                <span className="font-bold tabular-nums">
                  {Math.max(0, goalStatus.chocolateLeft)} left
                </span>
              </div>
            )}

            {/* Ingredient Goal */}
            {level.goals.bringIngredientsDown !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-rose-950 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <span className="text-sm">🍒</span>
                <span className="font-medium">Cherries:</span>
                <span className="font-bold tabular-nums">
                  {goalStatus.ingredientsLeft} left
                </span>
              </div>
            )}

            {/* Candy Collection Goals */}
            {level.goals.collectCandies &&
              Object.entries(level.goals.collectCandies).map(([colorKey, targetVal]) => {
                const col = colorKey as CandyColor;
                const collected = goalStatus.candiesCollected[col] || 0;
                const needed = Math.max(0, targetVal! - collected);
                const colorEmojiMap: Record<CandyColor, string> = {
                  red: '❤️',
                  orange: '🔶',
                  yellow: '⭐',
                  green: '🟢',
                  blue: '💧',
                  purple: '💎',
                };

                return (
                  <div
                    key={col}
                    className="flex items-center gap-1 text-xs text-slate-800 bg-white px-2 py-1 rounded-lg border border-amber-200"
                  >
                    <span>{colorEmojiMap[col]}</span>
                    <span className="font-bold tabular-nums">
                      {collected}/{targetVal}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Current Score */}
          <div className="flex flex-col items-end min-w-[76px]">
            <span className="text-[10px] font-semibold tracking-wider text-amber-700 uppercase">
              Score
            </span>
            <span className="font-candy text-xl font-bold text-amber-950 tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 3-Star Progress Bar */}
        <div className="relative w-full h-3 bg-amber-200/70 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${scorePercent}%` }}
          />
          {/* Star markers */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/70"
            style={{ left: `${star1Percent}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/70"
            style={{ left: `${star2Percent}%` }}
          />
        </div>

        {/* Star icons indicator */}
        <div className="flex items-center justify-between text-[11px] text-amber-800 px-0.5">
          <div className="flex items-center gap-1">
            <Star
              className={`w-3.5 h-3.5 ${
                stars >= 1 ? 'fill-yellow-400 text-yellow-500' : 'text-amber-300'
              }`}
            />
            <span className="tabular-nums">{level.targetScore.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star
              className={`w-3.5 h-3.5 ${
                stars >= 2 ? 'fill-yellow-400 text-yellow-500' : 'text-amber-300'
              }`}
            />
            <span className="tabular-nums">{level.twoStarScore.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star
              className={`w-3.5 h-3.5 ${
                stars >= 3 ? 'fill-yellow-400 text-yellow-500' : 'text-amber-300'
              }`}
            />
            <span className="tabular-nums">{level.threeStarScore.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
