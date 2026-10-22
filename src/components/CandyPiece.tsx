import React from 'react';
import { Candy, CandyColor, SpecialType } from '../types/game';

interface CandyPieceProps {
  candy: Candy;
  isSelected?: boolean;
  isHinted?: boolean;
  isTargeted?: boolean;
  size?: number; // size in px
}

export const CandyPiece: React.FC<CandyPieceProps> = ({
  candy,
  isSelected = false,
  isHinted = false,
  isTargeted = false,
  size = 56,
}) => {
  const { color, special } = candy;

  // Base candy color palettes
  const colorGradients: Record<CandyColor, { id: string; light: string; main: string; dark: string; shadow: string }> = {
    red: {
      id: 'grad-red',
      light: '#FF6B8B',
      main: '#E11D48',
      dark: '#9F1239',
      shadow: '#4C0519',
    },
    orange: {
      id: 'grad-orange',
      light: '#FDBA74',
      main: '#EA580C',
      dark: '#9A3412',
      shadow: '#431407',
    },
    yellow: {
      id: 'grad-yellow',
      light: '#FEF08A',
      main: '#EAB308',
      dark: '#A16207',
      shadow: '#422006',
    },
    green: {
      id: 'grad-green',
      light: '#86EFAC',
      main: '#16A34A',
      dark: '#14532D',
      shadow: '#052E16',
    },
    blue: {
      id: 'grad-blue',
      light: '#93C5FD',
      main: '#2563EB',
      dark: '#1E3A8A',
      shadow: '#0F172A',
    },
    purple: {
      id: 'grad-purple',
      light: '#D8B4FE',
      main: '#9333EA',
      dark: '#581C87',
      shadow: '#2E1065',
    },
  };

  const pal = colorGradients[color] || colorGradients.red;

  // Render specific shape based on candy color
  const renderShape = () => {
    switch (color) {
      case 'red':
        // Heart shape
        return (
          <path
            d="M 50,30 C 50,15 32,8 20,20 C 8,32 10,50 50,85 C 90,50 92,32 80,20 C 68,8 50,15 50,30 Z"
            fill={`url(#${pal.id})`}
            filter="url(#candy-shadow)"
          />
        );
      case 'orange':
        // Rounded Hexagon / Lozenge
        return (
          <path
            d="M 50,14 L 80,28 L 80,72 L 50,86 L 20,72 L 20,28 Z"
            rx="8"
            fill={`url(#${pal.id})`}
            filter="url(#candy-shadow)"
          />
        );
      case 'yellow':
        // Rounded Lemon Star Drop
        return (
          <path
            d="M 50,12 C 55,30 70,45 88,50 C 70,55 55,70 50,88 C 45,70 30,55 12,50 C 30,45 45,30 50,12 Z"
            fill={`url(#${pal.id})`}
            filter="url(#candy-shadow)"
          />
        );
      case 'green':
        // Square Pillow / Lozenge
        return (
          <rect
            x="18"
            y="18"
            width="64"
            height="64"
            rx="18"
            fill={`url(#${pal.id})`}
            filter="url(#candy-shadow)"
          />
        );
      case 'blue':
        // Teardrop / Soda Drop
        return (
          <path
            d="M 50,12 C 50,12 80,48 80,64 C 80,80.5 66.5,88 50,88 C 33.5,88 20,80.5 20,64 C 20,48 50,12 50,12 Z"
            fill={`url(#${pal.id})`}
            filter="url(#candy-shadow)"
          />
        );
      case 'purple':
        // Faceted Diamond
        return (
          <path
            d="M 50,14 L 84,50 L 50,86 L 16,50 Z"
            fill={`url(#${pal.id})`}
            filter="url(#candy-shadow)"
          />
        );
      default:
        return (
          <circle
            cx="50"
            cy="50"
            r="34"
            fill={`url(#${pal.id})`}
            filter="url(#candy-shadow)"
          />
        );
    }
  };

  // Special Candies: Color Bomb (Choco sprinkle ball)
  if (special === 'color_bomb') {
    return (
      <div
        className={`relative flex items-center justify-center transition-transform ${
          isSelected ? 'scale-110' : ''
        } ${isHinted ? 'animate-bounce' : ''}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id="disco-choco" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#5C2C16" />
              <stop offset="70%" stopColor="#2A1005" />
              <stop offset="100%" stopColor="#120501" />
            </radialGradient>
            <linearGradient id="rainbow-ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF0080" />
              <stop offset="25%" stopColor="#FF8C00" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="75%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#7928CA" />
            </linearGradient>
          </defs>
          {/* Animated Rainbow Outer Aura */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#rainbow-ring)"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            className="animate-disco-spin"
          />
          {/* Chocolate base */}
          <circle cx="50" cy="50" r="36" fill="url(#disco-choco)" />
          {/* Gleam */}
          <ellipse cx="40" cy="34" rx="14" ry="8" fill="#FFFFFF" opacity="0.3" transform="rotate(-30 40 34)" />
          {/* Multi-colored sprinkles */}
          <circle cx="34" cy="42" r="3.5" fill="#EF4444" />
          <circle cx="64" cy="38" r="3.5" fill="#3B82F6" />
          <circle cx="48" cy="62" r="3.5" fill="#10B981" />
          <circle cx="60" cy="58" r="3.5" fill="#F59E0B" />
          <circle cx="36" cy="60" r="3" fill="#EC4899" />
          <circle cx="46" cy="36" r="3" fill="#A855F7" />
          <circle cx="52" cy="48" r="3.5" fill="#FACC15" />
          <circle cx="38" cy="28" r="2.5" fill="#38BDF8" />
        </svg>
      </div>
    );
  }

  // Ingredient: Cherry
  if (special === 'cherry') {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id="cherry-grad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FF4B72" />
              <stop offset="70%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </radialGradient>
          </defs>
          {/* Stems */}
          <path
            d="M 52,18 C 50,30 38,45 35,58 M 52,18 C 58,32 66,45 68,60"
            stroke="#15803D"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Leaf */}
          <path d="M 52,18 C 65,14 74,18 72,25 C 64,28 54,23 52,18 Z" fill="#22C55E" />
          {/* Cherries */}
          <circle cx="35" cy="64" r="18" fill="url(#cherry-grad)" />
          <ellipse cx="30" cy="58" rx="5" ry="3" fill="#FFFFFF" opacity="0.5" />
          <circle cx="68" cy="66" r="18" fill="url(#cherry-grad)" />
          <ellipse cx="63" cy="60" rx="5" ry="3" fill="#FFFFFF" opacity="0.5" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-150 ${
        isSelected ? 'scale-110 drop-shadow-xl z-20' : 'hover:scale-105'
      } ${isHinted ? 'animate-candy-pulse' : ''} ${isTargeted ? 'brightness-125' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
        <defs>
          {/* Vibrant radial shine */}
          <radialGradient id={pal.id} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={pal.light} />
            <stop offset="55%" stopColor={pal.main} />
            <stop offset="90%" stopColor={pal.dark} />
            <stop offset="100%" stopColor={pal.shadow} />
          </radialGradient>

          {/* Soft shadow */}
          <filter id="candy-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Base Shape */}
        {renderShape()}

        {/* 3D Glass Gleam Highlight */}
        <ellipse
          cx="38"
          cy="32"
          rx="12"
          ry="6"
          fill="#FFFFFF"
          opacity="0.45"
          transform="rotate(-25 38 32)"
        />

        {/* Horizontal Striped Overlay */}
        {special === 'striped_h' && (
          <g>
            <rect x="18" y="32" width="64" height="6" rx="3" fill="#FFFFFF" opacity="0.85" />
            <rect x="18" y="47" width="64" height="6" rx="3" fill="#FFFFFF" opacity="0.85" />
            <rect x="18" y="62" width="64" height="6" rx="3" fill="#FFFFFF" opacity="0.85" />
          </g>
        )}

        {/* Vertical Striped Overlay */}
        {special === 'striped_v' && (
          <g>
            <rect x="32" y="18" width="6" height="64" rx="3" fill="#FFFFFF" opacity="0.85" />
            <rect x="47" y="18" width="6" height="64" rx="3" fill="#FFFFFF" opacity="0.85" />
            <rect x="62" y="18" width="6" height="64" rx="3" fill="#FFFFFF" opacity="0.85" />
          </g>
        )}

        {/* Wrapped Candy (Ribbon bow knots) */}
        {special === 'wrapped' && (
          <g>
            {/* Wrapper wrapper ends */}
            <path d="M 12,38 L 22,50 L 12,62 Z" fill="#FFFFFF" opacity="0.9" />
            <path d="M 88,38 L 78,50 L 88,62 Z" fill="#FFFFFF" opacity="0.9" />
            {/* Wrapper sparkle knot */}
            <circle cx="50" cy="50" r="10" fill="#FFFFFF" opacity="0.8" />
            <circle cx="50" cy="50" r="5" fill={pal.main} />
          </g>
        )}
      </svg>

      {/* Selected Indicator Ring */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-white rounded-2xl shadow-[0_0_12px_rgba(255,255,255,0.9)] pointer-events-none" />
      )}
    </div>
  );
};
