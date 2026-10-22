import React from 'react';
import { LevelConfig, LevelProgress } from '../types/game';
import { Star, Lock, Play, X, Trophy } from 'lucide-react';
import candyLandscape from '../assets/images/candy_kingdom_landscape_1792690702719.jpg';
import fairyMascot from '../assets/images/candy_mascot_avatar_1792690702801.jpg';

interface LevelSelectModalProps {
  levels: LevelConfig[];
  currentLevelId: number;
  progress: Record<number, LevelProgress>;
  isOpen: boolean;
  onClose: () => void;
  onSelectLevel: (levelId: number) => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  levels,
  currentLevelId,
  progress,
  isOpen,
  onClose,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  const totalStars = Object.values(progress).reduce((acc, p) => acc + (p.stars || 0), 0);
  const maxPossibleStars = levels.length * 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Landscape Banner */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-amber-900">
          <img
            src={candyLandscape}
            alt="Candy Kingdom Landscape"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-amber-950/20 to-black/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close level map"
            className="absolute top-3 right-3 p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full backdrop-blur-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Mascot Lockup */}
          <div className="absolute bottom-3 left-4 flex items-center gap-3">
            <img
              src={fairyMascot}
              alt="Sugar Fairy Companion"
              referrerPolicy="no-referrer"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white shadow-lg object-cover bg-amber-100"
            />
            <div>
              <h2 className="font-candy text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                Candy Kingdom Map
              </h2>
              <div className="flex items-center gap-2 text-xs text-amber-200 mt-0.5">
                <span className="flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="tabular-nums">{totalStars} / {maxPossibleStars} Stars</span>
                </span>
                <span>·</span>
                <span>8 Kingdom Realms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level List / Road Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {levels.map((lvl) => {
              const isUnlocked = lvl.id === 1 || progress[lvl.id - 1]?.completed;
              const isCurrent = lvl.id === currentLevelId;
              const lvlProgress = progress[lvl.id] || { stars: 0, highScore: 0, completed: false };

              return (
                <div
                  key={lvl.id}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectLevel(lvl.id);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isUnlocked
                      ? 'bg-white hover:bg-amber-50/80 border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-md'
                      : 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                  } ${isCurrent ? 'ring-2 ring-amber-500 bg-amber-50/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Level Number Orb */}
                    <div
                      className={`w-11 h-11 rounded-2xl font-candy font-bold text-lg flex items-center justify-center shrink-0 shadow-sm ${
                        isUnlocked
                          ? lvlProgress.completed
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isUnlocked ? lvl.id : <Lock className="w-4 h-4 text-slate-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-candy font-bold text-sm text-amber-950">
                          {lvl.name}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded-md">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-800/80 line-clamp-1">
                        {lvl.title} · {lvl.moves} moves
                      </p>
                      {lvlProgress.highScore > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-0.5">
                          <Trophy className="w-3 h-3 text-amber-500" />
                          <span className="tabular-nums font-semibold">
                            {lvlProgress.highScore.toLocaleString()} pts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stars earned & Play action */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            starIdx <= lvlProgress.stars
                              ? 'fill-yellow-400 text-yellow-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>

                    {isUnlocked && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:text-amber-900">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-amber-100/70 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <span>Match 3 or more sweet candies to unlock stages and earn stars!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-900 hover:bg-amber-950 rounded-xl transition-colors shadow-xs"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};
