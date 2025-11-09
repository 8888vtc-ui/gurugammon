/**
 * Types fondamentaux pour le jeu de backgammon
 * Architecture propre et typée strictement
 */

// Types primitifs du jeu
export type PlayerId = string;
export type PointId = number; // 1-24 pour les points, 0 pour bar, 25 pour home
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
export type GameId = string;
export type UserId = string;
export type MoveId = string;

// États du jeu
export enum GameStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
  PAUSED = 'PAUSED'
}

export enum PlayerColor {
  WHITE = 'WHITE',
  BLACK = 'BLACK'
}

export enum GameMode {
  PLAYER_VS_PLAYER = 'PLAYER_VS_PLAYER',
  PLAYER_VS_AI = 'PLAYER_VS_AI',
  AI_VS_AI = 'AI_VS_AI'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT'
}

// Interface Joueur
export interface Player {
  readonly id: PlayerId;
  readonly userId: UserId;
  readonly username: string;
  readonly color: PlayerColor;
  readonly elo: number;
  readonly isReady: boolean;
  readonly isHuman?: boolean;
}

// Interface Dé
export interface Dice {
  readonly values: readonly [DiceValue, DiceValue];
  readonly isDouble: boolean;
  readonly used: readonly boolean[];
}

// Interface Point (intersection sur le plateau)
export interface Point {
  readonly id: PointId;
  readonly tokens: readonly Token[];
  readonly color: PlayerColor | null;
  readonly index: number;
  readonly checkers: number;
  readonly player: PlayerColor | null;
}

// Interface Token (pion)
export interface Token {
  readonly id: string;
  readonly playerId: PlayerId;
  readonly color: PlayerColor;
  readonly position: PointId;
}

// Interface Mouvement
export interface Move {
  readonly id: MoveId;
  readonly playerId: PlayerId;
  readonly from: PointId;
  readonly to: PointId;
  readonly diceUsed: DiceValue;
  readonly timestamp: Date;
  readonly player: PlayerColor;
  readonly diceValue: number;
}

// Interface GameState principal
export interface GameState {
  readonly id: GameId;
  readonly status: GameStatus;
  readonly mode: GameMode;
  readonly players: readonly [Player, Player];
  readonly currentPlayerIndex: 0 | 1;
  readonly currentPlayer: PlayerColor;
  readonly board: readonly Point[];
  readonly dice: Dice | null;
  readonly moves: readonly Move[];
  readonly winner: PlayerId | null;
  readonly winner?: Player;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly settings: GameSettings;
  readonly isRanked: boolean;
  readonly timeLimit?: number;
}

// Configuration de partie
export interface GameSettings {
  readonly difficulty?: Difficulty;
  readonly timeLimit?: number; // en secondes
  readonly isRanked: boolean;
  readonly allowUndo: boolean;
}

// Interface pour création de partie
export interface CreateGameRequest {
  readonly mode: GameMode;
  readonly difficulty?: Difficulty;
  readonly isRanked: boolean;
  readonly timeLimit?: number;
}

// Interface pour mouvement
export interface MakeMoveRequest {
  readonly from: PointId;
  readonly to: PointId;
  readonly diceValue: DiceValue;
}

// Interface réponse API
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly timestamp: Date;
}

// Interface pagination
export interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

// Interface historique de partie
export interface GameHistory {
  readonly game: GameState;
  readonly moves: readonly Move[];
  readonly duration: number; // en secondes
  readonly finalScore: {
    readonly winner: PlayerId;
    readonly points: number;
  };
}

// Statistiques joueur
export interface PlayerStats {
  readonly userId: UserId;
  readonly username: string;
  readonly elo: number;
  readonly gamesPlayed: number;
  readonly gamesWon: number;
  readonly gamesLost: number;
  readonly winRate: number;
  readonly averageGameDuration: number;
  readonly bestMove: Move | null;
}
