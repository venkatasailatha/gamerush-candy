import React, { useEffect } from 'react';
import { Star, Trophy, ArrowRight, RotateCcw, Gift } from 'lucide-react';
import { LevelConfig } from '../types/game';
import fairyMascot from '../assets/images/candy_mascot_avatar_1792690702801.jpg';
import { sound } from '../services/sound';

interface VictoryModalProps {
  isOpen: boolean;
  level: LevelConfig;
  score: number;
  movesLeft: number;
  stars: number;
  isNewHighScore: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  level,
  score,
  movesLeft,
  stars,
  isNewHighScore,
  onNextLevel,
  onReplay,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playWin();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const moveBonus = movesLeft * 500;
  const totalFinalScore = score + moveBonus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-amber-50 to-amber-100/90 rounded-3xl shadow-2xl border-4 border-amber-300 p-6 text-center overflow-hidden">
        {/* Confetti Glow Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* Mascot Avatar */}
        <div className="relative mx-auto mb-2 w-20 h-20">
          <img
            src={fairyMascot}
            alt="Victory Mascot"
            referrerPolicy="no-referrer"
            className="w-full h-full rounded-full border-4 border-white shadow-xl object-cover bg-amber-200 animate-candy-pulse"
          />
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-amber-950 p-1.5 rounded-full shadow-md">
            <Trophy className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Victory Title */}
        <h2 className="font-candy text-3xl font-bold text-amber-950 mb-0.5">
          Sugar Crush!
        </h2>
        <p className="text-xs font-semibold text-amber-800">
          Level {level.id} Complete · {level.name}
        </p>

        {/* 3 Stars Trophy Display */}
        <div className="flex items-center justify-center gap-3 my-4">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-2 rounded-2xl border transition-all transform ${
                starIdx <= stars
                  ? 'bg-yellow-100 border-yellow-400 scale-110 shadow-md'
                  : 'bg-white/60 border-amber-200/60 opacity-40 scale-95'
              }`}
            >
              <Star
                className={`w-7 h-7 ${
                  starIdx <= stars
                    ? 'fill-yellow-400 text-yellow-500 animate-bounce'
                    : 'text-slate-300'
                }`}
                style={{ animationDelay: `${starIdx * 0.15}s` }}
              />
            </div>
          ))}
        </div>

        {/* Score Breakdown Card */}
        <div className="bg-white/90 rounded-2xl p-4 border border-amber-200 shadow-xs mb-4 text-left space-y-1.5">
          <div className="flex items-center justify-between text-xs text-amber-900">
            <span>Match Score:</span>
            <span className="font-bold tabular-nums">{score.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-amber-900">
            <span>Moves Remaining ({movesLeft} × 500):</span>
            <span className="font-bold text-emerald-600 tabular-nums">+{moveBonus.toLocaleString()}</span>
          </div>
          <div className="h-px bg-amber-100 my-1" />
          <div className="flex items-center justify-between font-candy text-base font-bold text-amber-950">
            <span>Total Score:</span>
            <span className="text-amber-900 tabular-nums">{totalFinalScore.toLocaleString()}</span>
          </div>

          {isNewHighScore && (
            <div className="mt-2 text-center text-xs font-bold text-amber-800 bg-amber-100/80 py-1 rounded-lg">
              🎉 New High Score for Level {level.id}!
            </div>
          )}
        </div>

        {/* Reward Bonus Pill */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-900 bg-amber-200/50 py-1.5 px-3 rounded-xl mb-5">
          <Gift className="w-4 h-4 text-rose-600" />
          <span>Reward: +1 Booster Gift Added to Bag!</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReplay}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-amber-50 text-amber-950 font-bold rounded-2xl border border-amber-300 shadow-sm transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay</span>
          </button>
          <button
            onClick={onNextLevel}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-candy text-base font-bold rounded-2xl shadow-md transition-all active:scale-95"
          >
            <span>Next Level</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
