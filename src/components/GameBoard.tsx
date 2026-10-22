import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Candy,
  GridCell,
  Position,
  TileType,
  LevelConfig,
  BoosterType,
  FloatingText,
  CandyColor,
} from '../types/game';
import {
  BOARD_SIZE,
  isAdjacent,
  findMatches,
  getSpecialComboEffect,
  getSpecialDetonationCells,
  applyGravityAndRefill,
  shuffleBoard,
  findValidMoves,
} from '../utils/gameLogic';
import { CandyPiece } from './CandyPiece';
import { ParticleCanvas, ParticleCanvasHandle } from './ParticleCanvas';
import { sound } from '../services/sound';

interface GameBoardProps {
  level: LevelConfig;
  grid: GridCell[][];
  tiles: TileType[][];
  movesLeft: number;
  activeBooster: BoosterType | null;
  onMoveMade: (movesUsed: number) => void;
  onScoreGained: (points: number, comboText?: string) => void;
  onGoalProgress: (update: {
    frostingCleared?: number;
    chocolateCleared?: number;
    candiesCollected?: Partial<Record<CandyColor, number>>;
    ingredientsDown?: number;
  }) => void;
  onBoosterUsed: (booster: BoosterType) => void;
  onGridUpdate: (newGrid: GridCell[][], newTiles: TileType[][]) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  hintPos: Position | null;
}

const COMBO_WORDS = ['GOOD!', 'SWEET!', 'TASTY!', 'DELICIOUS!', 'DIVINE!', 'SUGAR CRUSH!'];

export const GameBoard: React.FC<GameBoardProps> = ({
  level,
  grid,
  tiles,
  movesLeft,
  activeBooster,
  onMoveMade,
  onScoreGained,
  onGoalProgress,
  onBoosterUsed,
  onGridUpdate,
  isProcessing,
  setIsProcessing,
  hintPos,
}) => {
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [swapAnimation, setSwapAnimation] = useState<{ p1: Position; p2: Position } | null>(null);

  const particleRef = useRef<ParticleCanvasHandle | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const touchStartPos = useRef<{ x: number; y: number; r: number; c: number } | null>(null);

  // Trigger screen shake on big explosions
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  // Add floating text popup
  const addFloatingText = (text: string, x: number, y: number, color: string = '#F59E0B') => {
    const id = 'ft_' + Math.random().toString(36).substring(2, 8);
    setFloatingTexts((prev) => [...prev, { id, text, color, x, y }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1000);
  };

  // Get pixel center of cell (row, col)
  const getCellCoords = (r: number, c: number) => {
    if (!boardRef.current) return { x: 250, y: 250 };
    const rect = boardRef.current.getBoundingClientRect();
    const cellSize = rect.width / BOARD_SIZE;
    return {
      x: (c + 0.5) * cellSize,
      y: (r + 0.5) * cellSize,
    };
  };

  /**
   * Main Match Cascade Pipeline
   * Recursively processes matches, cascades drops, detects new matches, and updates score/goals
   */
  const processBoardCascades = useCallback(
    async (
      currentGrid: GridCell[][],
      currentTiles: TileType[][],
      comboCount: number = 1
    ) => {
      const { matchedCells, specialsToSpawn } = findMatches(currentGrid);

      if (matchedCells.size === 0) {
        setIsProcessing(false);
        // Check if board has valid moves, if not reshuffle
        const validMoves = findValidMoves(currentGrid, level.colors);
        if (validMoves.length === 0) {
          addFloatingText('Reshuffling!', 240, 240, '#EC4899');
          sound.playSpecialCreate();
          const reshuffled = shuffleBoard(currentGrid, currentTiles, level.colors);
          onGridUpdate(reshuffled, currentTiles);
        }
        return;
      }

      // We have matches!
      const nextGrid: GridCell[][] = currentGrid.map((row) => [...row]);
      const nextTiles: TileType[][] = currentTiles.map((row) => [...row]);

      // Calculate score and particle bursts
      const points = matchedCells.size * 60 * comboCount;
      const comboWord = comboCount > 1 ? COMBO_WORDS[Math.min(comboCount - 2, COMBO_WORDS.length - 1)] : undefined;
      onScoreGained(points, comboWord);
      sound.playMatch(comboCount);

      // Track goal progress for collected colors
      const collectedCandies: Partial<Record<CandyColor, number>> = {};
      let frostingCleared = 0;
      let chocolateCleared = 0;

      matchedCells.forEach((key) => {
        const [r, c] = key.split(',').map(Number);
        const candy = nextGrid[r][c];

        if (candy) {
          collectedCandies[candy.color] = (collectedCandies[candy.color] || 0) + 1;
          const coords = getCellCoords(r, c);
          particleRef.current?.burst(coords.x, coords.y, candy.color, 10);

          // If matched candy was a special, trigger its detonation!
          if (candy.special !== 'none' && candy.special !== 'cherry') {
            const extraCells = getSpecialDetonationCells(candy);
            if (candy.special === 'striped_h' || candy.special === 'striped_v') {
              sound.playLaser();
              particleRef.current?.stripedBeam(
                candy.special === 'striped_h' ? 0 : coords.x,
                candy.special === 'striped_h' ? coords.y : 0,
                candy.special === 'striped_h' ? 500 : coords.x,
                candy.special === 'striped_h' ? coords.y : 500,
                candy.color
              );
            } else if (candy.special === 'wrapped') {
              sound.playExplosion();
              triggerShake();
              particleRef.current?.shockwave(coords.x, coords.y, 140, '#F59E0B');
            }

            for (const ep of extraCells) {
              const epKey = `${ep.row},${ep.col}`;
              if (!matchedCells.has(epKey) && nextGrid[ep.row][ep.col]) {
                const ec = nextGrid[ep.row][ep.col]!;
                collectedCandies[ec.color] = (collectedCandies[ec.color] || 0) + 1;
                nextGrid[ep.row][ep.col] = null;
              }
            }
          }
        }

        // Damage frosting beneath matched cell
        if (nextTiles[r][c] === 'frosting') {
          nextTiles[r][c] = 'normal';
          frostingCleared++;
        } else if (nextTiles[r][c] === 'double_frosting') {
          nextTiles[r][c] = 'frosting';
          frostingCleared++;
        }

        // Check adjacent chocolate blockers
        const neighbors = [
          { r: r - 1, c },
          { r: r + 1, c },
          { r, c: c - 1 },
          { r, c: c + 1 },
        ];
        for (const nb of neighbors) {
          if (nb.r >= 0 && nb.r < BOARD_SIZE && nb.c >= 0 && nb.c < BOARD_SIZE) {
            if (nextTiles[nb.r][nb.c] === 'chocolate') {
              nextTiles[nb.r][nb.c] = 'normal';
              chocolateCleared++;
              const nCoords = getCellCoords(nb.r, nb.c);
              particleRef.current?.burst(nCoords.x, nCoords.y, '#78350F', 12);
            }
          }
        }

        // Clear matched candy
        nextGrid[r][c] = null;
      });

      // Spawn newly created specials (Striped, Wrapped, Color Bomb)
      for (const sp of specialsToSpawn) {
        sound.playSpecialCreate();
        const coords = getCellCoords(sp.pos.row, sp.pos.col);
        addFloatingText(sp.special.toUpperCase().replace('_', ' '), coords.x, coords.y, '#A855F7');
        particleRef.current?.burst(coords.x, coords.y, 'gold', 20);

        nextGrid[sp.pos.row][sp.pos.col] = {
          id: 'sp_' + Math.random().toString(36).substring(2, 8),
          color: sp.color,
          special: sp.special,
          row: sp.pos.row,
          col: sp.pos.col,
        };
      }

      onGoalProgress({
        frostingCleared,
        chocolateCleared,
        candiesCollected: collectedCandies,
      });

      // Update intermediate board state for pop animation
      onGridUpdate(nextGrid, nextTiles);

      // Brief delay to allow pop visual, then drop and refill
      setTimeout(() => {
        const { newGrid, collectedIngredients } = applyGravityAndRefill(nextGrid, nextTiles, level.colors);

        if (collectedIngredients > 0) {
          sound.playSpecialCreate();
          addFloatingText('+1 INGREDIENT!', 240, 400, '#EF4444');
          onGoalProgress({ ingredientsDown: collectedIngredients });
        }

        onGridUpdate(newGrid, nextTiles);

        // Continue cascade check
        setTimeout(() => {
          processBoardCascades(newGrid, nextTiles, comboCount + 1);
        }, 220);
      }, 200);
    },
    [level, onScoreGained, onGoalProgress, onGridUpdate, setIsProcessing]
  );

  /**
   * Execute direct swap between p1 and p2
   */
  const executeSwap = async (p1: Position, p2: Position) => {
    if (isProcessing) return;
    if (movesLeft <= 0) return;

    const c1 = grid[p1.row][p1.col];
    const c2 = grid[p2.row][p2.col];
    if (!c1 || !c2) return;

    setIsProcessing(true);
    setSelectedPos(null);
    setSwapAnimation({ p1, p2 });
    sound.playSwap();

    // Check for special combo (Color Bomb + Color Bomb, Striped + Wrapped, etc.)
    const specialCombo = getSpecialComboEffect(c1, c2, grid);

    if (specialCombo) {
      setTimeout(() => {
        setSwapAnimation(null);
        onMoveMade(1);

        const nextGrid: GridCell[][] = grid.map((row) => [...row]);
        const nextTiles: TileType[][] = tiles.map((row) => [...row]);
        const collected: Partial<Record<CandyColor, number>> = {};
        let frostingCleared = 0;
        let chocolateCleared = 0;

        // Perform combo visuals & audio
        if (specialCombo.comboType === 'MEGA_BOARD_CLEAR') {
          sound.playColorBomb();
          triggerShake();
          addFloatingText('SUPER DISCO!', 240, 240, '#EC4899');
          particleRef.current?.confettiRain();
        } else if (specialCombo.comboType.includes('STRIPED')) {
          sound.playLaser();
          triggerShake();
          addFloatingText('STRIPE STORM!', 240, 240, '#38BDF8');
        } else {
          sound.playExplosion();
          triggerShake();
          addFloatingText(specialCombo.comboType.replace(/_/g, ' '), 240, 240, '#FACC15');
        }

        specialCombo.cellsToClear.forEach((pos) => {
          const candy = nextGrid[pos.row][pos.col];
          if (candy) {
            collected[candy.color] = (collected[candy.color] || 0) + 1;
            const coords = getCellCoords(pos.row, pos.col);
            particleRef.current?.burst(coords.x, coords.y, candy.color, 8);
            nextGrid[pos.row][pos.col] = null;
          }
          if (nextTiles[pos.row][pos.col] === 'frosting') {
            nextTiles[pos.row][pos.col] = 'normal';
            frostingCleared++;
          } else if (nextTiles[pos.row][pos.col] === 'double_frosting') {
            nextTiles[pos.row][pos.col] = 'frosting';
            frostingCleared++;
          }
        });

        onGoalProgress({
          frostingCleared,
          chocolateCleared,
          candiesCollected: collected,
        });
        onScoreGained(specialCombo.cellsToClear.length * 100, 'SWEET COMBO!');

        onGridUpdate(nextGrid, nextTiles);

        // Drop & refill after combo
        setTimeout(() => {
          const { newGrid, collectedIngredients } = applyGravityAndRefill(nextGrid, nextTiles, level.colors);
          if (collectedIngredients > 0) {
            onGoalProgress({ ingredientsDown: collectedIngredients });
          }
          onGridUpdate(newGrid, nextTiles);
          setTimeout(() => {
            processBoardCascades(newGrid, nextTiles, 2);
          }, 240);
        }, 220);
      }, 180);
      return;
    }

    // Normal swap check
    const simulatedGrid: GridCell[][] = grid.map((row) => [...row]);
    simulatedGrid[p1.row][p1.col] = { ...c2, row: p1.row, col: p1.col };
    simulatedGrid[p2.row][p2.col] = { ...c1, row: p2.row, col: p2.col };

    const { matchedCells } = findMatches(simulatedGrid);

    if (matchedCells.size === 0) {
      // Invalid swap - bounce back
      setTimeout(() => {
        sound.playReject();
        setSwapAnimation(null);
        setIsProcessing(false);
      }, 200);
      return;
    }

    // Valid swap!
    setTimeout(() => {
      setSwapAnimation(null);
      onMoveMade(1);
      onGridUpdate(simulatedGrid, tiles);

      // Start cascade evaluation
      processBoardCascades(simulatedGrid, tiles, 1);
    }, 180);
  };

  /**
   * Handle Click on Cell (or booster activation on cell)
   */
  const handleCellClick = (r: number, c: number) => {
    if (isProcessing) return;
    if (tiles[r][c] === 'blocked') return;

    // Handle Active Boosters
    if (activeBooster) {
      handleBoosterOnCell(r, c, activeBooster);
      return;
    }

    // Cell selection / swap
    if (!selectedPos) {
      if (grid[r][c]) {
        setSelectedPos({ row: r, col: c });
        sound.playSwap();
      }
    } else {
      if (selectedPos.row === r && selectedPos.col === c) {
        // Deselect
        setSelectedPos(null);
      } else if (isAdjacent(selectedPos, { row: r, col: c })) {
        // Swap!
        executeSwap(selectedPos, { row: r, col: c });
      } else {
        // Change selection to new valid candy
        if (grid[r][c]) {
          setSelectedPos({ row: r, col: c });
          sound.playSwap();
        } else {
          setSelectedPos(null);
        }
      }
    }
  };

  /**
   * Handle Active Booster Used on Board Cell
   */
  const handleBoosterOnCell = (r: number, c: number, booster: BoosterType) => {
    const coords = getCellCoords(r, c);

    if (booster === 'lollipop') {
      // Smashes any single candy or blocker
      sound.playBooster();
      sound.playExplosion();
      particleRef.current?.shockwave(coords.x, coords.y, 80, '#F43F5E');
      particleRef.current?.burst(coords.x, coords.y, 'gold', 16);
      addFloatingText('SMASH!', coords.x, coords.y, '#F43F5E');

      const nextGrid: GridCell[][] = grid.map((row) => [...row]);
      const nextTiles: TileType[][] = tiles.map((row) => [...row]);

      let frostingCleared = 0;
      let chocolateCleared = 0;

      if (nextTiles[r][c] === 'frosting' || nextTiles[r][c] === 'double_frosting') {
        nextTiles[r][c] = nextTiles[r][c] === 'double_frosting' ? 'frosting' : 'normal';
        frostingCleared++;
      } else if (nextTiles[r][c] === 'chocolate') {
        nextTiles[r][c] = 'normal';
        chocolateCleared++;
      }

      nextGrid[r][c] = null;

      onGoalProgress({ frostingCleared, chocolateCleared });
      onScoreGained(100);
      onBoosterUsed('lollipop');

      const { newGrid } = applyGravityAndRefill(nextGrid, nextTiles, level.colors);
      onGridUpdate(newGrid, nextTiles);
      processBoardCascades(newGrid, nextTiles, 1);
    } else if (booster === 'color_bomb') {
      // Place a Color Bomb at this cell!
      sound.playSpecialCreate();
      particleRef.current?.burst(coords.x, coords.y, 'rainbow', 25);
      addFloatingText('+COLOR BOMB!', coords.x, coords.y, '#EC4899');

      const nextGrid: GridCell[][] = grid.map((row) => [...row]);
      nextGrid[r][c] = {
        id: 'cb_' + Date.now(),
        color: 'yellow',
        special: 'color_bomb',
        row: r,
        col: c,
      };

      onBoosterUsed('color_bomb');
      onGridUpdate(nextGrid, tiles);
    } else if (booster === 'free_swap') {
      // Select first cell, then swap with second without needing match
      if (!selectedPos) {
        setSelectedPos({ row: r, col: c });
        sound.playSwap();
      } else {
        const nextGrid: GridCell[][] = grid.map((row) => [...row]);
        const c1 = nextGrid[selectedPos.row][selectedPos.col];
        const c2 = nextGrid[r][c];

        if (c1 && c2) {
          sound.playBooster();
          nextGrid[selectedPos.row][selectedPos.col] = { ...c2, row: selectedPos.row, col: selectedPos.col };
          nextGrid[r][c] = { ...c1, row: r, col: c };

          setSelectedPos(null);
          onBoosterUsed('free_swap');
          onGridUpdate(nextGrid, tiles);
          processBoardCascades(nextGrid, tiles, 1);
        }
      }
    }
  };

  /**
   * Touch Gesture Support (Swipe up/down/left/right)
   */
  const handleTouchStart = (r: number, c: number, e: React.TouchEvent) => {
    if (isProcessing) return;
    const touch = e.touches[0];
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      r,
      c,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || isProcessing) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const { r, c } = touchStartPos.current;
    touchStartPos.current = null;

    const threshold = 25; // minimum swipe distance
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        const targetCol = dx > 0 ? c + 1 : c - 1;
        if (targetCol >= 0 && targetCol < BOARD_SIZE) {
          executeSwap({ row: r, col: c }, { row: r, col: targetCol });
        }
      } else {
        // Vertical swipe
        const targetRow = dy > 0 ? r + 1 : r - 1;
        if (targetRow >= 0 && targetRow < BOARD_SIZE) {
          executeSwap({ row: r, col: c }, { row: targetRow, col: c });
        }
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto p-2">
      {/* Game Board Container */}
      <div
        ref={boardRef}
        className={`relative w-full aspect-square rounded-3xl p-3 bg-gradient-to-b from-amber-900/60 via-amber-950/70 to-amber-900/80 backdrop-blur-md shadow-2xl border-4 border-amber-300/40 select-none overflow-hidden ${
          isShaking ? 'animate-candy-shake' : ''
        }`}
      >
        {/* Subtle Frosted Inner Background Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* 8x8 Grid Canvas */}
        <div className="relative w-full h-full grid grid-cols-8 grid-rows-8 gap-1">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const tileType = tiles[r][c];
              const isBlocked = tileType === 'blocked';
              const isFrosting = tileType === 'frosting';
              const isDoubleFrosting = tileType === 'double_frosting';
              const isChocolate = tileType === 'chocolate';
              const isSelected = selectedPos?.row === r && selectedPos?.col === c;
              const isHint = hintPos?.row === r && hintPos?.col === c;

              if (isBlocked) {
                return (
                  <div
                    key={`cell-${r}-${c}`}
                    className="w-full h-full rounded-xl opacity-0 pointer-events-none"
                  />
                );
              }

              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onTouchStart={(e) => handleTouchStart(r, c, e)}
                  onTouchEnd={handleTouchEnd}
                  className={`relative flex items-center justify-center rounded-xl cursor-pointer transition-all ${
                    (r + c) % 2 === 0 ? 'bg-amber-100/10' : 'bg-amber-100/5'
                  } hover:bg-white/20`}
                >
                  {/* Frosting / Jelly Background Layer */}
                  {isFrosting && (
                    <div className="absolute inset-0.5 rounded-lg bg-sky-200/40 border border-sky-300/50 backdrop-blur-[1px] pointer-events-none flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/60" />
                    </div>
                  )}

                  {/* Double Frosting Layer */}
                  {isDoubleFrosting && (
                    <div className="absolute inset-0.5 rounded-lg bg-sky-300/60 border-2 border-sky-100/70 shadow-inner flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" />
                    </div>
                  )}

                  {/* Chocolate Blocker */}
                  {isChocolate && (
                    <div className="absolute inset-0.5 rounded-lg bg-[#3F1A07] border-2 border-[#5B280E] shadow-md flex items-center justify-center z-10">
                      <div className="w-4 h-4 rounded bg-[#2D1204] border border-[#713412]" />
                    </div>
                  )}

                  {/* Candy Piece */}
                  {cell && !isChocolate && (
                    <CandyPiece
                      candy={cell}
                      isSelected={isSelected}
                      isHinted={isHint}
                      size={48}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Floating Score / Combo Texts */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute font-candy text-xl sm:text-2xl font-bold drop-shadow-md animate-float-up pointer-events-none z-40 whitespace-nowrap"
            style={{
              left: ft.x,
              top: ft.y,
              color: ft.color,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {ft.text}
          </div>
        ))}

        {/* Canvas Particle Overlay */}
        <ParticleCanvas ref={particleRef} width={500} height={500} />
      </div>
    </div>
  );
};
