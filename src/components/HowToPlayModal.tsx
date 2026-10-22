import React from 'react';
import { X, Sparkles, Zap, Flame, ShieldAlert, Award } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h3 className="font-candy text-xl font-bold text-amber-950">
              How to Play Sugar Cascade
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close how to play guide"
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-amber-950">
          {/* Section 1: Core Goal */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs">
            <h4 className="font-candy text-sm font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Core Objective</span>
            </h4>
            <p className="leading-relaxed text-amber-800">
              Swap any two adjacent candies horizontally or vertically to create lines of 3 or more of the same color. Complete the level objectives (reach target score, clear frosting, collect specific candy varieties, or bring cherries to the bottom) before your moves run out!
            </p>
          </div>

          {/* Section 2: Special Candies */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
            <h4 className="font-candy text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Special Candies</span>
            </h4>

            {/* Striped Candy */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-base text-amber-900 shrink-0">
                ║
              </div>
              <div>
                <span className="font-bold text-amber-950">Striped Candy (Match 4 in a line)</span>
                <p className="text-amber-800/90 mt-0.5">
                  When matched, fires an energetic beam clearing the entire horizontal row or vertical column across the board.
                </p>
              </div>
            </div>

            {/* Wrapped Candy */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-base text-amber-900 shrink-0">
                🎁
              </div>
              <div>
                <span className="font-bold text-amber-950">Wrapped Candy (Match in T or L shape)</span>
                <p className="text-amber-800/90 mt-0.5">
                  Explodes in a 3x3 blast radius, clearing surrounding candies, frosting, and chocolate obstacles twice!
                </p>
              </div>
            </div>

            {/* Color Bomb */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-base text-amber-900 shrink-0">
                ✨
              </div>
              <div>
                <span className="font-bold text-amber-950">Disco Color Bomb (Match 5 in a straight line)</span>
                <p className="text-amber-800/90 mt-0.5">
                  Swap with ANY adjacent candy to vaporize every single candy of that color currently on the board!
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Mega Combos */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs space-y-2">
            <h4 className="font-candy text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span>Mega Special Combos</span>
            </h4>
            <p className="text-amber-800/90">
              Swap two special candies directly next to each other to trigger devastating combo effects:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-amber-900 font-medium">
              <li><strong className="text-amber-950">Color Bomb + Color Bomb:</strong> Wipes out every candy on the entire board!</li>
              <li><strong className="text-amber-950">Striped + Striped:</strong> Fires a cross laser clearing both the full row and full column!</li>
              <li><strong className="text-amber-950">Striped + Wrapped:</strong> Mega cross that obliterates 3 full rows and 3 full columns!</li>
              <li><strong className="text-amber-950">Color Bomb + Striped:</strong> Transforms all candies of that color into striped candies and detonates all at once!</li>
            </ul>
          </div>

          {/* Section 4: Obstacles */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs space-y-2">
            <h4 className="font-candy text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Board Obstacles</span>
            </h4>
            <div className="space-y-1.5">
              <p>
                <strong className="text-sky-800">Frosting & Double Frosting:</strong> Frosting coats tiles beneath candies. Match candies resting directly on frosted tiles to melt the sugar glaze away.
              </p>
              <p>
                <strong className="text-amber-950">Chocolate Blockers:</strong> Solid cocoa blocks that obstruct candies. Match candies immediately adjacent to chocolate to crack and clear them.
              </p>
              <p>
                <strong className="text-rose-700">Cherries:</strong> Clear candies beneath cherries to guide them down to the bottom-most row to collect them!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-amber-100/80 border-t border-amber-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-900 hover:bg-amber-950 rounded-xl transition-colors shadow-xs"
          >
            Got it, Let&apos;s Play!
          </button>
        </div>
      </div>
    </div>
  );
};
