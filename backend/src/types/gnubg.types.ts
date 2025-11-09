/**
 * Types pour l'intégration GNUBG (GNU Backgammon)
 */

export type BoardState = string; // Format GNUBG: "4HPwATDgc/ABMA"
export type Move = string; // Format GNUBG: "8/5 6/5"
export type Dice = readonly [number, number];

export enum AnalysisType {
  QUICK = 'quick',
  FULL = 'full',
  EVALUATION = 'evaluation',
  BEST_MOVE = 'best_move'
}

export enum GamePhase {
  OPENING = 'opening',
  MIDDLEGAME = 'middlegame',
  ENDGAME = 'endgame',
  BEAROFF = 'bearoff'
}

// Interface pour requête d'analyse
export interface AnalyzeRequest {
  readonly boardState: BoardState;
  readonly dice: Dice;
  readonly move?: Move;
  readonly analysisType: AnalysisType;
  readonly playerColor: 'WHITE' | 'BLACK';
}

// Interface réponse GNUBG
export interface GnubgResponse {
  readonly success: boolean;
  readonly bestMove?: Move;
  readonly evaluation?: {
    readonly winProbability: number; // 0-1
    readonly equity: number; // Expected value
    readonly cubeDecision?: 'TAKE' | 'DROP' | 'DOUBLE';
  };
  readonly moveAnalysis?: {
    readonly move: Move;
    readonly errorRate: number; // in millipoints
    readonly rank: number; // 1 = best move
    readonly totalMoves: number;
  };
  readonly gamePhase: GamePhase;
  readonly difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  readonly processingTime: number; // in milliseconds
}

// Interface pour suggestion de coup
export interface MoveSuggestion {
  readonly move: Move;
  readonly confidence: number; // 0-1
  readonly reasoning: string;
  readonly alternatives: readonly {
    readonly move: Move;
    readonly score: number;
  }[];
}

// Interface configuration IA
export interface GnubgConfig {
  readonly serviceUrl: string;
  readonly apiKey: string;
  readonly timeout: number; // en millisecondes
  readonly maxRetries: number;
  readonly difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

// Interface erreur GNUBG
export interface GnubgError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}
