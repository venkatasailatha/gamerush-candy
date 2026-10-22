import React from 'react';
import { BoosterType } from '../types/game';
import { Sparkles, ArrowLeftRight, PlusCircle, Hammer } from 'lucide-react';

interface BoosterBarProps {
  inventory: Record<BoosterType, number>;
  activeBooster: BoosterType | null;
  onSelectBooster: (booster: BoosterType) => void;
  onAddExtraMoves: () => void;
}

export const BoosterBar: React.FC<BoosterBarProps> = ({
  inventory,
  activeBooster,
  onSelectBooster,
  onAddExtraMoves,
}) => {
  const boosters: {
    type: BoosterType;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    isInstant?: boolean;
  }[] = [
    {
      type: 'lollipop',
      name: 'Lollipop Hammer',
      description: 'Tap any candy or blocker to smash it!',
      icon: <Hammer className="w-5 h-5 text-rose-500" />,
      color: 'hover:bg-rose-50 border-rose-200',
    },
    {
      type: 'color_bomb',
      name: 'Disco Ball',
      description: 'Drop a rainbow color bomb onto the board!',
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      color: 'hover:bg-purple-50 border-purple-200',
    },
    {
      type: 'free_swap',
      name: 'Free Swap',
      description: 'Swap any two candies without matching!',
      icon: <ArrowLeftRight className="w-5 h-5 text-blue-500" />,
      color: 'hover:bg-blue-50 border-blue-200',
    },
    {
      type: 'extra_moves',
      name: '+5 Moves',
      description: 'Add 5 extra moves instantly to this round!',
      icon: <PlusCircle className="w-5 h-5 text-emerald-500" />,
      color: 'hover:bg-emerald-50 border-emerald-200',
      isInstant: true,
    },
  ];

  const handleClick = (b: typeof boosters[0]) => {
    if (b.isInstant) {
      if (inventory[b.type] > 0) {
        onAddExtraMoves();
      }
    } else {
      if (inventory[b.type] > 0) {
        onSelectBooster(b.type);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 mt-1 mb-3">
      {/* Active Booster Prompt Banner */}
      {activeBooster && (
        <div className="mb-2 p-2 bg-amber-100 border border-amber-300 rounded-xl text-center text-xs font-semibold text-amber-900 flex items-center justify-between animate-pulse">
          <span>Tap a tile on the board to use your {activeBooster.replace('_', ' ')}!</span>
          <button
            onClick={() => onSelectBooster(activeBooster)}
            className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 rounded-md text-[11px] text-amber-950 font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Boosters Row */}
      <div className="flex items-center justify-between gap-2 bg-white/80 backdrop-blur-xs p-2 rounded-2xl border border-amber-200 shadow-xs">
        {boosters.map((b) => {
          const count = inventory[b.type] || 0;
          const isActive = activeBooster === b.type;

          return (
            <button
              key={b.type}
              onClick={() => handleClick(b)}
              disabled={count <= 0}
              title={b.description}
              className={`flex-1 flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border transition-all ${
                isActive
                  ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400 scale-105'
                  : count > 0
                  ? `bg-white ${b.color} cursor-pointer active:scale-95`
                  : 'bg-slate-100 border-slate-200 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="relative">
                {b.icon}
                {/* Quantity badge */}
                <span className="absolute -top-1.5 -right-2.5 bg-amber-900 text-amber-100 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                  {count}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-amber-950 mt-1 whitespace-nowrap">
                {b.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
