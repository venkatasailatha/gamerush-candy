import React, { useEffect } from 'react';
import { RotateCcw, PlusCircle, Map } from 'lucide-react';
import { LevelConfig } from '../types/game';
import { sound } from '../services/sound';

interface GameOverModalProps {
  isOpen: boolean;
  level: LevelConfig;
  score: number;
  hasExtraMovesBooster: boolean;
  onUseExtraMoves: () => void;
  onRetry: () => void;
  onOpenMap: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  level,
  score,
  hasExtraMovesBooster,
  onUseExtraMoves,
  onRetry,
  onOpenMap,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playLose();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-amber-50 to-amber-100 rounded-3xl shadow-2xl border-4 border-amber-300 p-6 text-center">
        {/* Sad Candy Icon */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-200/70 border border-amber-300 flex items-center justify-center text-3xl shadow-inner">
          🍬
        </div>

        <h2 className="font-candy text-2xl sm:text-3xl font-bold text-amber-950 mb-1">
          Out of Moves!
        </h2>
        <p className="text-xs text-amber-800 mb-4">
          Almost there! Don&apos;t give up on Level {level.id}.
        </p>

        {/* Score achieved */}
        <div className="bg-white/90 rounded-2xl p-3 border border-amber-200 shadow-xs mb-4 text-xs text-amber-900">
          <div className="flex items-center justify-between mb-1">
            <span>Score Achieved:</span>
            <span className="font-bold tabular-nums">{score.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Target Score:</span>
            <span className="font-bold tabular-nums">{level.targetScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Option 1: Continue with Extra Moves */}
        {hasExtraMovesBooster ? (
          <button
            onClick={onUseExtraMoves}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-candy text-sm font-bold rounded-2xl shadow-md transition-all mb-2.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Use +5 Moves Booster</span>
          </button>
        ) : (
          <button
            onClick={onUseExtraMoves}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 rounded-2xl text-xs transition-colors mb-2.5"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Claim Free +5 Moves & Continue</span>
          </button>
        )}

        {/* Option 2: Retry Level */}
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-candy text-sm font-bold rounded-2xl shadow-md transition-all mb-2 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        {/* Option 3: Return to Map */}
        <button
          onClick={onOpenMap}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-amber-800 hover:text-amber-950 transition-colors"
        >
          <Map className="w-3.5 h-3.5" />
          <span>Back to Level Map</span>
        </button>
      </div>
    </div>
  );
};
