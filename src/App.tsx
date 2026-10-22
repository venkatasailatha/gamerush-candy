import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LevelConfig,
  LevelProgress,
  BoosterType,
  Position,
  GridCell,
  TileType,
  CandyColor,
} from './types/game';
import { LEVELS } from './data/levels';
import { createInitialBoard, findValidMoves, BOARD_SIZE } from './utils/gameLogic';
import { GameBoard } from './components/GameBoard';
import { GameHud } from './components/GameHud';
import { BoosterBar } from './components/BoosterBar';
import { LevelSelectModal } from './components/LevelSelectModal';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { sound } from './services/sound';
import { Sparkles, Map, HelpCircle, Trophy, Play } from 'lucide-react';
import candyLandscape from './assets/images/candy_kingdom_landscape_1792690702719.jpg';
import fairyMascot from './assets/images/candy_mascot_avatar_1792690702801.jpg';

export default function App() {
  // Current active level
  const [currentLevelId, setCurrentLevelId] = useState<number>(() => {
    const saved = localStorage.getItem('sugar_cascade_current_level');
    return saved ? Math.min(LEVELS.length, Math.max(1, parseInt(saved, 10))) : 1;
  });

  const level = useMemo(() => {
    return LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0];
  }, [currentLevelId]);

  // Game Board States
  const [grid, setGrid] = useState<GridCell[][]>(() => createInitialBoard(level).grid);
  const [tiles, setTiles] = useState<TileType[][]>(() => createInitialBoard(level).tiles);
  const [score, setScore] = useState<number>(0);
  const [movesLeft, setMovesLeft] = useState<number>(level.moves);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hintPos, setHintPos] = useState<Position | null>(null);

  // Goal Tracker State
  const [goalStatus, setGoalStatus] = useState({
    frostingLeft: 0,
    chocolateLeft: 0,
    candiesCollected: {} as Partial<Record<CandyColor, number>>,
    ingredientsLeft: 0,
  });

  // Boosters Inventory State
  const [inventory, setInventory] = useState<Record<BoosterType, number>>(() => {
    const saved = localStorage.getItem('sugar_cascade_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      lollipop: 3,
      color_bomb: 2,
      free_swap: 3,
      extra_moves: 2,
    };
  });
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);

  // Level Progression & Stars State
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(() => {
    const saved = localStorage.getItem('sugar_cascade_progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      1: { stars: 0, highScore: 0, completed: false },
    };
  });

  // Modals
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Sound Mute State
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Save Progress to localStorage
  useEffect(() => {
    localStorage.setItem('sugar_cascade_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('sugar_cascade_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('sugar_cascade_current_level', String(currentLevelId));
  }, [currentLevelId]);

  // Setup / Reset Level Board
  const startLevel = useCallback((targetLevel: LevelConfig) => {
    const initial = createInitialBoard(targetLevel);
    setGrid(initial.grid);
    setTiles(initial.tiles);
    setScore(0);
    setMovesLeft(targetLevel.moves);
    setIsProcessing(false);
    setActiveBooster(null);
    setHintPos(null);
    setIsVictoryOpen(false);
    setIsGameOverOpen(false);
    setIsNewHighScore(false);

    // Count initial goals
    let frostingCount = 0;
    let chocolateCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (initial.tiles[r][c] === 'frosting') frostingCount += 1;
        if (initial.tiles[r][c] === 'double_frosting') frostingCount += 2;
        if (initial.tiles[r][c] === 'chocolate') chocolateCount += 1;
      }
    }

    setGoalStatus({
      frostingLeft: targetLevel.goals.clearFrosting !== undefined ? targetLevel.goals.clearFrosting : frostingCount,
      chocolateLeft: targetLevel.goals.clearChocolate !== undefined ? targetLevel.goals.clearChocolate : chocolateCount,
      candiesCollected: {},
      ingredientsLeft: targetLevel.goals.bringIngredientsDown !== undefined ? targetLevel.goals.bringIngredientsDown : 0,
    });
  }, []);

  // Initialize or re-init when level ID changes
  useEffect(() => {
    startLevel(level);
  }, [level, startLevel]);

  // Calculate current stars based on score
  const currentStars = useMemo(() => {
    if (score >= level.threeStarScore) return 3;
    if (score >= level.twoStarScore) return 2;
    if (score >= level.targetScore) return 1;
    return 0;
  }, [score, level]);

  // Check Win / Loss conditions
  const checkGameConditions = useCallback(() => {
    if (isProcessing) return;

    // Check goals completion
    let goalsMet = true;

    // 1. Target Score Goal
    if (level.goals.scoreTarget && score < level.goals.scoreTarget) {
      goalsMet = false;
    }

    // 2. Clear Frosting Goal
    if (level.goals.clearFrosting !== undefined && goalStatus.frostingLeft > 0) {
      goalsMet = false;
    }

    // 3. Clear Chocolate Goal
    if (level.goals.clearChocolate !== undefined && goalStatus.chocolateLeft > 0) {
      goalsMet = false;
    }

    // 4. Collect Candies Goal
    if (level.goals.collectCandies) {
      for (const [colorKey, targetVal] of Object.entries(level.goals.collectCandies)) {
        const col = colorKey as CandyColor;
        const currentCount = goalStatus.candiesCollected[col] || 0;
        if (currentCount < targetVal!) {
          goalsMet = false;
          break;
        }
      }
    }

    // 5. Ingredients Down Goal
    if (level.goals.bringIngredientsDown !== undefined && goalStatus.ingredientsLeft > 0) {
      goalsMet = false;
    }

    // VICTORY!
    if (goalsMet) {
      const finalStars = Math.max(1, currentStars);
      const prevRecord = progress[level.id];
      const newHigh = !prevRecord || score > prevRecord.highScore;

      setIsNewHighScore(newHigh);
      setIsVictoryOpen(true);

      // Update progress
      setProgress((prev) => ({
        ...prev,
        [level.id]: {
          stars: Math.max(prev[level.id]?.stars || 0, finalStars),
          highScore: Math.max(prev[level.id]?.highScore || 0, score),
          completed: true,
        },
      }));

      // Grant random booster gift on victory
      setInventory((prev) => {
        const boosterKeys: BoosterType[] = ['lollipop', 'color_bomb', 'free_swap', 'extra_moves'];
        const randomGift = boosterKeys[Math.floor(Math.random() * boosterKeys.length)];
        return {
          ...prev,
          [randomGift]: (prev[randomGift] || 0) + 1,
        };
      });

      return;
    }

    // GAME OVER (Out of moves)
    if (movesLeft <= 0 && !goalsMet) {
      setIsGameOverOpen(true);
    }
  }, [isProcessing, level, score, goalStatus, currentStars, progress, movesLeft]);

  // Trigger win/loss check after state updates
  useEffect(() => {
    const timer = setTimeout(() => {
      checkGameConditions();
    }, 400);
    return () => clearTimeout(timer);
  }, [checkGameConditions, isProcessing]);

  // Handlers for gameplay events
  const handleScoreGained = (points: number) => {
    setScore((prev) => prev + points);
  };

  const handleMoveMade = (movesUsed: number) => {
    setMovesLeft((prev) => Math.max(0, prev - movesUsed));
    setHintPos(null);
  };

  const handleGoalProgress = (update: {
    frostingCleared?: number;
    chocolateCleared?: number;
    candiesCollected?: Partial<Record<CandyColor, number>>;
    ingredientsDown?: number;
  }) => {
    setGoalStatus((prev) => {
      const nextCandies = { ...prev.candiesCollected };
      if (update.candiesCollected) {
        Object.entries(update.candiesCollected).forEach(([k, val]) => {
          const col = k as CandyColor;
          nextCandies[col] = (nextCandies[col] || 0) + val!;
        });
      }

      return {
        frostingLeft: Math.max(0, prev.frostingLeft - (update.frostingCleared || 0)),
        chocolateLeft: Math.max(0, prev.chocolateLeft - (update.chocolateCleared || 0)),
        candiesCollected: nextCandies,
        ingredientsLeft: Math.max(0, prev.ingredientsLeft - (update.ingredientsDown || 0)),
      };
    });
  };

  const handleGridUpdate = (newGrid: GridCell[][], newTiles: TileType[][]) => {
    setGrid(newGrid);
    setTiles(newTiles);
  };

  // Booster Selection
  const handleSelectBooster = (b: BoosterType) => {
    if (activeBooster === b) {
      setActiveBooster(null);
    } else {
      setActiveBooster(b);
      sound.playSwap();
    }
  };

  const handleBoosterUsed = (b: BoosterType) => {
    setActiveBooster(null);
    setInventory((prev) => ({
      ...prev,
      [b]: Math.max(0, (prev[b] || 1) - 1),
    }));
  };

  const handleAddExtraMoves = () => {
    setMovesLeft((prev) => prev + 5);
    setInventory((prev) => ({
      ...prev,
      extra_moves: Math.max(0, (prev.extra_moves || 1) - 1),
    }));
    sound.playBooster();
    setIsGameOverOpen(false);
  };

  // Sound Toggle
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Hint button: find legal move and highlight
  const handleShowHint = () => {
    if (isProcessing) return;
    const moves = findValidMoves(grid, level.colors);
    if (moves.length > 0) {
      sound.playSpecialCreate();
      setHintPos(moves[0].from);
      setTimeout(() => {
        setHintPos(null);
      }, 3000);
    }
  };

  // Navigation: Next Level
  const handleNextLevel = () => {
    setIsVictoryOpen(false);
    const nextId = currentLevelId + 1;
    if (nextId <= LEVELS.length) {
      setCurrentLevelId(nextId);
    } else {
      setIsMapOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-slate-900 flex flex-col font-sans no-select">
      {/* 
        Top Bar Contract (Universal Design Constitution):
        1 line Brand Wordmark — 4 Nav links (single line) — 1 Primary Action
      */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-amber-100/90 border-b border-amber-200/80 backdrop-blur-xs sticky top-0 z-40">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🍭</span>
          <span className="font-candy text-xl font-bold tracking-tight text-amber-950 whitespace-nowrap">
            Sugar Cascade
          </span>
        </div>

        {/* Zone 2: 4 single-line text nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-amber-900">
          <button
            onClick={() => setIsMapOpen(true)}
            className="hover:text-amber-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Map className="w-4 h-4 text-amber-700" />
            <span>Kingdom Map</span>
          </button>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="hover:text-amber-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>How to Play</span>
          </button>
          <button
            onClick={() => {
              handleShowHint();
            }}
            className="hover:text-amber-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Find Hint</span>
          </button>
          <span className="text-xs text-amber-800/80 whitespace-nowrap shrink-0 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span className="tabular-nums">
              {Object.values(progress).reduce((acc, p) => acc + (p.stars || 0), 0)} Stars Earned
            </span>
          </span>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsMapOpen(true)}
            className="px-4 py-2 text-xs font-candy font-bold text-white bg-amber-900 hover:bg-amber-950 rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Select Realm</span>
          </button>
        </div>
      </header>

      {/* Main Playable Area */}
      <main className="flex-1 flex flex-col items-center justify-start py-2 px-3 sm:px-4 max-w-4xl mx-auto w-full">
        {/* HUD: Score, Goals, Moves, Star progress */}
        <GameHud
          level={level}
          score={score}
          movesLeft={movesLeft}
          stars={currentStars}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onShowHint={handleShowHint}
          onRestart={() => startLevel(level)}
          onOpenMap={() => setIsMapOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          goalStatus={goalStatus}
        />

        {/* The 8x8 Match-3 Board */}
        <GameBoard
          level={level}
          grid={grid}
          tiles={tiles}
          movesLeft={movesLeft}
          activeBooster={activeBooster}
          onMoveMade={handleMoveMade}
          onScoreGained={handleScoreGained}
          onGoalProgress={handleGoalProgress}
          onBoosterUsed={handleBoosterUsed}
          onGridUpdate={handleGridUpdate}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          hintPos={hintPos}
        />

        {/* Boosters Tray */}
        <BoosterBar
          inventory={inventory}
          activeBooster={activeBooster}
          onSelectBooster={handleSelectBooster}
          onAddExtraMoves={handleAddExtraMoves}
        />
      </main>

      {/* Quiet Footer with zero slop */}
      <footer className="w-full py-3 px-6 bg-amber-100/60 border-t border-amber-200/50 text-center text-xs text-amber-900/70">
        <div className="flex items-center justify-center gap-3">
          <span>Sugar Cascade: Match-3 Kingdom</span>
          <span>·</span>
          <span>8 Confection Realms</span>
          <span>·</span>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="hover:underline text-amber-950 font-medium"
          >
            Rules & Combos
          </button>
        </div>
      </footer>

      {/* Modals */}
      <LevelSelectModal
        levels={LEVELS}
        currentLevelId={currentLevelId}
        progress={progress}
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLevel={(id) => {
          setCurrentLevelId(id);
          setIsMapOpen(false);
        }}
      />

      <VictoryModal
        isOpen={isVictoryOpen}
        level={level}
        score={score}
        movesLeft={movesLeft}
        stars={currentStars}
        isNewHighScore={isNewHighScore}
        onNextLevel={handleNextLevel}
        onReplay={() => {
          setIsVictoryOpen(false);
          startLevel(level);
        }}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        level={level}
        score={score}
        hasExtraMovesBooster={inventory.extra_moves > 0}
        onUseExtraMoves={handleAddExtraMoves}
        onRetry={() => {
          setIsGameOverOpen(false);
          startLevel(level);
        }}
        onOpenMap={() => {
          setIsGameOverOpen(false);
          setIsMapOpen(true);
        }}
      />

      <HowToPlayModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
