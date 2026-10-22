/**
 * Sugar Cascade: Match-3 Kingdom Game Types
 */

export type CandyColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export type SpecialType = 
  | 'none'
  | 'striped_h'   // Clears entire horizontal row
  | 'striped_v'   // Clears entire vertical column
  | 'wrapped'     // Explodes 3x3 twice
  | 'color_bomb'  // Clears all candies of one color
  | 'cherry';     // Ingredient that must drop to the bottom

export type TileType = 
  | 'normal'
  | 'frosting'          // Single layer jelly/frosting
  | 'double_frosting'   // Two layer jelly/frosting
  | 'chocolate'         // Chocolate blocker (cleared if adjacent match)
  | 'blocked';          // Gap/empty board hole

export interface Candy {
  id: string;
  color: CandyColor;
  special: SpecialType;
  row: number;
  col: number;
  isNew?: boolean;
  isMatched?: boolean;
  isHinted?: boolean;
}

export type GridCell = Candy | null;

export interface Position {
  row: number;
  col: number;
}

export interface MatchResult {
  matches: Position[];
  newSpecials: {
    pos: Position;
    special: SpecialType;
    color: CandyColor;
  }[];
}

export interface LevelGoal {
  scoreTarget?: number;
  clearFrosting?: number;
  collectCandies?: Partial<Record<CandyColor, number>>;
  bringIngredientsDown?: number;
  clearChocolate?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  title: string;
  theme: string;
  moves: number;
  targetScore: number;
  twoStarScore: number;
  threeStarScore: number;
  goals: LevelGoal;
  colors: CandyColor[];
  blockedCells?: Position[];
  initialFrosting?: Position[];
  initialDoubleFrosting?: Position[];
  initialChocolate?: Position[];
  initialIngredients?: Position[];
}

export type BoosterType = 'lollipop' | 'color_bomb' | 'free_swap' | 'extra_moves';

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface LevelProgress {
  stars: number; // 0 to 3
  highScore: number;
  completed: boolean;
}

export type GameView = 'MAP' | 'PLAYING';
