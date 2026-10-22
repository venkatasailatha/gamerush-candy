import { Candy, CandyColor, GridCell, LevelConfig, Position, SpecialType, TileType } from '../types/game';

export const BOARD_SIZE = 8;

export function generateId(): string {
  return 'c_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

export function getRandomColor(colors: CandyColor[]): CandyColor {
  const idx = Math.floor(Math.random() * colors.length);
  return colors[idx];
}

export function isAdjacent(p1: Position, p2: Position): boolean {
  const dr = Math.abs(p1.row - p2.row);
  const dc = Math.abs(p1.col - p2.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/**
 * Creates the initial board state without any initial matches of 3.
 */
export function createInitialBoard(level: LevelConfig): {
  grid: GridCell[][];
  tiles: TileType[][];
} {
  const tiles: TileType[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill('normal')
  );

  // Mark blocked cells
  if (level.blockedCells) {
    for (const p of level.blockedCells) {
      if (p.row >= 0 && p.row < BOARD_SIZE && p.col >= 0 && p.col < BOARD_SIZE) {
        tiles[p.row][p.col] = 'blocked';
      }
    }
  }

  // Mark frosting
  if (level.initialFrosting) {
    for (const p of level.initialFrosting) {
      if (tiles[p.row][p.col] !== 'blocked') {
        tiles[p.row][p.col] = 'frosting';
      }
    }
  }

  // Mark double frosting
  if (level.initialDoubleFrosting) {
    for (const p of level.initialDoubleFrosting) {
      if (tiles[p.row][p.col] !== 'blocked') {
        tiles[p.row][p.col] = 'double_frosting';
      }
    }
  }

  // Mark chocolate
  if (level.initialChocolate) {
    for (const p of level.initialChocolate) {
      if (tiles[p.row][p.col] !== 'blocked') {
        tiles[p.row][p.col] = 'chocolate';
      }
    }
  }

  let grid: GridCell[][] = [];
  let attempts = 0;

  do {
    grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (tiles[r][c] === 'blocked') {
          grid[r][c] = null;
          continue;
        }

        // Exclude colors that would cause an immediate match 3
        const forbidden: CandyColor[] = [];
        if (c >= 2 && grid[r][c - 1] && grid[r][c - 2] && grid[r][c - 1]?.color === grid[r][c - 2]?.color) {
          forbidden.push(grid[r][c - 1]!.color);
        }
        if (r >= 2 && grid[r - 1][c] && grid[r - 2][c] && grid[r - 1][c]?.color === grid[r - 2][c]?.color) {
          forbidden.push(grid[r - 1][c]!.color);
        }

        const validColors = level.colors.filter((col) => !forbidden.includes(col));
        const color = validColors.length > 0 ? getRandomColor(validColors) : getRandomColor(level.colors);

        grid[r][c] = {
          id: generateId(),
          color,
          special: 'none',
          row: r,
          col: c,
        };
      }
    }

    // Place ingredients if any
    if (level.initialIngredients) {
      for (const p of level.initialIngredients) {
        if (grid[p.row][p.col]) {
          grid[p.row][p.col]!.special = 'cherry';
        }
      }
    }

    attempts++;
  } while (findValidMoves(grid, level.colors).length === 0 && attempts < 50);

  return { grid, tiles };
}

/**
 * Scan board for all contiguous matches of 3 or more.
 * Classifies 4-in-a-row (Striped), L/T intersections (Wrapped), 5-in-a-row (Color Bomb).
 */
export function findMatches(grid: GridCell[][]): {
  matchedCells: Set<string>; // 'r,c'
  specialsToSpawn: { pos: Position; special: SpecialType; color: CandyColor }[];
  matchGroups: Position[][];
} {
  const matchedPositions = new Set<string>();
  const horizontalRuns: Position[][] = [];
  const verticalRuns: Position[][] = [];

  // Horizontal scan
  for (let r = 0; r < BOARD_SIZE; r++) {
    let matchLen = 1;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const current = grid[r][c];
      const next = c < BOARD_SIZE - 1 ? grid[r][c + 1] : null;

      if (current && next && current.special !== 'cherry' && next.special !== 'cherry' && current.color === next.color) {
        matchLen++;
      } else {
        if (matchLen >= 3) {
          const run: Position[] = [];
          for (let k = c - matchLen + 1; k <= c; k++) {
            run.push({ row: r, col: k });
            matchedPositions.add(`${r},${k}`);
          }
          horizontalRuns.push(run);
        }
        matchLen = 1;
      }
    }
  }

  // Vertical scan
  for (let c = 0; c < BOARD_SIZE; c++) {
    let matchLen = 1;
    for (let r = 0; r < BOARD_SIZE; r++) {
      const current = grid[r][c];
      const next = r < BOARD_SIZE - 1 ? grid[r + 1][c] : null;

      if (current && next && current.special !== 'cherry' && next.special !== 'cherry' && current.color === next.color) {
        matchLen++;
      } else {
        if (matchLen >= 3) {
          const run: Position[] = [];
          for (let k = r - matchLen + 1; k <= r; k++) {
            run.push({ row: k, col: c });
            matchedPositions.add(`${k},${c}`);
          }
          verticalRuns.push(run);
        }
        matchLen = 1;
      }
    }
  }

  const specialsToSpawn: { pos: Position; special: SpecialType; color: CandyColor }[] = [];
  const handledRuns = new Set<Position[]>();

  // 1. Detect L or T shape matches (horizontal run intersecting vertical run with same color) -> Wrapped Candy
  for (const hRun of horizontalRuns) {
    for (const vRun of verticalRuns) {
      const hColor = grid[hRun[0].row][hRun[0].col]?.color;
      const vColor = grid[vRun[0].row][vRun[0].col]?.color;

      if (hColor && vColor && hColor === vColor) {
        // Look for intersection
        const intersection = hRun.find((hp) => vRun.some((vp) => vp.row === hp.row && vp.col === hp.col));
        if (intersection) {
          specialsToSpawn.push({
            pos: intersection,
            special: 'wrapped',
            color: hColor,
          });
          handledRuns.add(hRun);
          handledRuns.add(vRun);
        }
      }
    }
  }

  // 2. Check remaining 5+ runs -> Color Bomb
  const allRuns = [...horizontalRuns, ...verticalRuns];
  for (const run of allRuns) {
    if (handledRuns.has(run)) continue;

    const firstCell = grid[run[0].row][run[0].col];
    if (!firstCell) continue;

    if (run.length >= 5) {
      // Color Bomb at center of run
      const centerPos = run[Math.floor(run.length / 2)];
      specialsToSpawn.push({
        pos: centerPos,
        special: 'color_bomb',
        color: firstCell.color,
      });
      handledRuns.add(run);
    } else if (run.length === 4) {
      // 4-in-a-row -> Striped Candy
      // If horizontal run, striped_v (clears column); if vertical run, striped_h (clears row)
      const isHorizontal = run[0].row === run[1].row;
      const centerPos = run[1]; // near center
      specialsToSpawn.push({
        pos: centerPos,
        special: isHorizontal ? 'striped_v' : 'striped_h',
        color: firstCell.color,
      });
      handledRuns.add(run);
    }
  }

  return {
    matchedCells: matchedPositions,
    specialsToSpawn,
    matchGroups: allRuns,
  };
}

/**
 * Finds all legal moves on the current board.
 */
export function findValidMoves(grid: GridCell[][], availableColors: CandyColor[]): { from: Position; to: Position }[] {
  const validMoves: { from: Position; to: Position }[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const current = grid[r][c];
      if (!current) continue;

      // Check right swap
      if (c < BOARD_SIZE - 1 && grid[r][c + 1]) {
        if (testSwapCreatesMatch(grid, { row: r, col: c }, { row: r, col: c + 1 })) {
          validMoves.push({ from: { row: r, col: c }, to: { row: r, col: c + 1 } });
        }
      }

      // Check down swap
      if (r < BOARD_SIZE - 1 && grid[r + 1][c]) {
        if (testSwapCreatesMatch(grid, { row: r, col: c }, { row: r + 1, col: c })) {
          validMoves.push({ from: { row: r, col: c }, to: { row: r + 1, col: c } });
        }
      }
    }
  }

  return validMoves;
}

/**
 * Test whether swapping two cells creates a match or triggers a special combo
 */
export function testSwapCreatesMatch(grid: GridCell[][], p1: Position, p2: Position): boolean {
  const c1 = grid[p1.row][p1.col];
  const c2 = grid[p2.row][p2.col];
  if (!c1 || !c2) return false;

  // Any swap involving a color bomb is valid!
  if (c1.special === 'color_bomb' || c2.special === 'color_bomb') {
    return true;
  }

  // Two specials swapping together is always valid!
  if (c1.special !== 'none' && c1.special !== 'cherry' && c2.special !== 'none' && c2.special !== 'cherry') {
    return true;
  }

  // Standard match check with simulated swap
  // Swap references
  grid[p1.row][p1.col] = c2;
  grid[p2.row][p2.col] = c1;

  const { matchedCells } = findMatches(grid);

  // Restore references
  grid[p1.row][p1.col] = c1;
  grid[p2.row][p2.col] = c2;

  return matchedCells.size > 0;
}

/**
 * Handle special combo interactions when two specials are swapped directly
 */
export function getSpecialComboEffect(
  c1: Candy,
  c2: Candy,
  grid: GridCell[][]
): {
  cellsToClear: Position[];
  comboType: string;
} | null {
  const isC1Special = c1.special !== 'none' && c1.special !== 'cherry';
  const isC2Special = c2.special !== 'none' && c2.special !== 'cherry';

  // 1. Color Bomb + Color Bomb -> Clears the entire board!
  if (c1.special === 'color_bomb' && c2.special === 'color_bomb') {
    const cells: Position[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c]) cells.push({ row: r, col: c });
      }
    }
    return { cellsToClear: cells, comboType: 'MEGA_BOARD_CLEAR' };
  }

  // 2. Color Bomb + Striped Candy -> Turns all candies of that color into striped and detonates all!
  if (
    (c1.special === 'color_bomb' && (c2.special === 'striped_h' || c2.special === 'striped_v')) ||
    (c2.special === 'color_bomb' && (c1.special === 'striped_h' || c1.special === 'striped_v'))
  ) {
    const targetColor = c1.special === 'color_bomb' ? c2.color : c1.color;
    const cells: Position[] = [{ row: c1.row, col: c1.col }, { row: c2.row, col: c2.col }];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const item = grid[r][c];
        if (item && item.color === targetColor) {
          // Clear entire row or col for each
          for (let k = 0; k < BOARD_SIZE; k++) {
            cells.push({ row: r, col: k });
            cells.push({ row: k, col: c });
          }
        }
      }
    }
    return { cellsToClear: cells, comboType: 'COLOR_STRIPED_STORM' };
  }

  // 3. Color Bomb + Wrapped Candy -> Destroys all of that color and random bombs
  if (
    (c1.special === 'color_bomb' && c2.special === 'wrapped') ||
    (c2.special === 'color_bomb' && c1.special === 'wrapped')
  ) {
    const targetColor = c1.special === 'color_bomb' ? c2.color : c1.color;
    const cells: Position[] = [{ row: c1.row, col: c1.col }, { row: c2.row, col: c2.col }];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const item = grid[r][c];
        if (item && item.color === targetColor) {
          // Add 3x3 blast around each
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                cells.push({ row: nr, col: nc });
              }
            }
          }
        }
      }
    }
    return { cellsToClear: cells, comboType: 'COLOR_WRAPPED_SHOCK' };
  }

  // 4. Color Bomb + Normal Candy -> Clears all candies of that color
  if (c1.special === 'color_bomb' || c2.special === 'color_bomb') {
    const targetColor = c1.special === 'color_bomb' ? c2.color : c1.color;
    const cells: Position[] = [{ row: c1.row, col: c1.col }, { row: c2.row, col: c2.col }];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c]?.color === targetColor) {
          cells.push({ row: r, col: c });
        }
      }
    }
    return { cellsToClear: cells, comboType: 'COLOR_BOMB_BURST' };
  }

  // 5. Striped + Striped -> Clears both row AND col of the swapped position!
  if (
    (c1.special === 'striped_h' || c1.special === 'striped_v') &&
    (c2.special === 'striped_h' || c2.special === 'striped_v')
  ) {
    const cells: Position[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      cells.push({ row: c2.row, col: i });
      cells.push({ row: i, col: c2.col });
    }
    return { cellsToClear: cells, comboType: 'CROSS_LASER' };
  }

  // 6. Wrapped + Wrapped -> Giant 5x5 explosion!
  if (c1.special === 'wrapped' && c2.special === 'wrapped') {
    const cells: Position[] = [];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = c2.row + dr;
        const nc = c2.col + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          cells.push({ row: nr, col: nc });
        }
      }
    }
    return { cellsToClear: cells, comboType: 'MEGA_WRAPPED_BLAST' };
  }

  // 7. Striped + Wrapped -> Clears 3 rows and 3 columns!
  if (
    ((c1.special === 'striped_h' || c1.special === 'striped_v') && c2.special === 'wrapped') ||
    ((c2.special === 'striped_h' || c2.special === 'striped_v') && c1.special === 'wrapped')
  ) {
    const cells: Position[] = [];
    const centerR = c2.row;
    const centerC = c2.col;

    for (let dr = -1; dr <= 1; dr++) {
      const r = centerR + dr;
      if (r >= 0 && r < BOARD_SIZE) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          cells.push({ row: r, col: c });
        }
      }
    }
    for (let dc = -1; dc <= 1; dc++) {
      const c = centerC + dc;
      if (c >= 0 && c < BOARD_SIZE) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          cells.push({ row: r, col: c });
        }
      }
    }
    return { cellsToClear: cells, comboType: 'TRIPLE_CROSS_BEAM' };
  }

  return null;
}

/**
 * Calculate cells affected by a special candy detonation
 */
export function getSpecialDetonationCells(candy: Candy): Position[] {
  const result: Position[] = [];
  if (candy.special === 'striped_h') {
    // Clears entire horizontal row
    for (let c = 0; c < BOARD_SIZE; c++) {
      result.push({ row: candy.row, col: c });
    }
  } else if (candy.special === 'striped_v') {
    // Clears entire vertical column
    for (let r = 0; r < BOARD_SIZE; r++) {
      result.push({ row: r, col: candy.col });
    }
  } else if (candy.special === 'wrapped') {
    // 3x3 explosion around it
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = candy.row + dr;
        const nc = candy.col + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          result.push({ row: nr, col: nc });
        }
      }
    }
  }
  return result;
}

/**
 * Drop candies downwards and refill the board from the top
 */
export function applyGravityAndRefill(
  grid: GridCell[][],
  tiles: TileType[][],
  availableColors: CandyColor[]
): {
  newGrid: GridCell[][];
  droppedCount: number;
  collectedIngredients: number;
} {
  const newGrid: GridCell[][] = grid.map((row) => [...row]);
  let droppedCount = 0;
  let collectedIngredients = 0;

  // Process column by column
  for (let c = 0; c < BOARD_SIZE; c++) {
    // 1. Check if cherry reached bottom row (row 7)
    if (newGrid[BOARD_SIZE - 1][c]?.special === 'cherry') {
      newGrid[BOARD_SIZE - 1][c] = null;
      collectedIngredients++;
    }

    // 2. Drop existing candies down
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      if (tiles[r][c] === 'blocked') continue;

      if (newGrid[r][c] === null) {
        // Find candy above to drop
        let foundRow = -1;
        for (let above = r - 1; above >= 0; above--) {
          if (tiles[above][c] === 'blocked') break;
          if (newGrid[above][c] !== null) {
            foundRow = above;
            break;
          }
        }

        if (foundRow !== -1) {
          newGrid[r][c] = {
            ...newGrid[foundRow][c]!,
            row: r,
            col: c,
          };
          newGrid[foundRow][c] = null;
          droppedCount++;
        }
      }
    }

    // 3. Refill empty cells at the top
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (tiles[r][c] === 'blocked') continue;

      if (newGrid[r][c] === null) {
        newGrid[r][c] = {
          id: generateId(),
          color: getRandomColor(availableColors),
          special: 'none',
          row: r,
          col: c,
          isNew: true,
        };
        droppedCount++;
      }
    }
  }

  return { newGrid, droppedCount, collectedIngredients };
}

/**
 * Shuffle current board candies while avoiding blocked tiles
 */
export function shuffleBoard(grid: GridCell[][], tiles: TileType[][], colors: CandyColor[]): GridCell[][] {
  const movableCandies: Candy[] = [];
  const positions: Position[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (tiles[r][c] !== 'blocked' && grid[r][c]) {
        movableCandies.push(grid[r][c]!);
        positions.push({ row: r, col: c });
      }
    }
  }

  let attempts = 0;
  let newGrid: GridCell[][] = grid.map((row) => [...row]);

  do {
    // Fisher-Yates shuffle
    for (let i = movableCandies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [movableCandies[i], movableCandies[j]] = [movableCandies[j], movableCandies[i]];
    }

    newGrid = grid.map((row) => [...row]);
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const candy = movableCandies[i];
      newGrid[p.row][p.col] = {
        ...candy,
        row: p.row,
        col: p.col,
      };
    }
    attempts++;
  } while (findValidMoves(newGrid, colors).length === 0 && attempts < 20);

  return newGrid;
}
