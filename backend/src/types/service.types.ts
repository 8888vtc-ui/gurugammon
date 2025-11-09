/**
 * Types simplifiés pour les services - Compatibilité avec l'architecture existante
 */

import { PlayerColor, GameStatus, GameMode, Difficulty } from './game.types';

// Interface BoardPosition pour les services
export interface BoardPosition {
  readonly point: number;
  readonly checkers: number;
  readonly player: PlayerColor | null;
}

// Interface Dice pour les services
export interface ServiceDice {
  readonly die1: number;
  readonly die2: number;
}

// Interface Move pour les services
export interface ServiceMove {
  readonly from: number;
  readonly to: number;
  readonly diceValue: number;
  readonly player: PlayerColor;
  readonly timestamp: Date;
}

// Interface Player pour les services
export interface ServicePlayer {
  readonly id: string;
  readonly color: PlayerColor;
  readonly isHuman: boolean;
}

// Interface GameState pour les services
export interface ServiceGameState {
  readonly id: string;
  readonly status: GameStatus;
  readonly mode: GameMode;
  readonly isRanked: boolean;
  readonly timeLimit?: number;
  readonly currentPlayer: PlayerColor;
  readonly players: readonly ServicePlayer[];
  readonly board: readonly BoardPosition[];
  readonly dice: ServiceDice;
  readonly moves: readonly ServiceMove[];
  readonly winner?: ServicePlayer;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Types pour les requêtes API
export interface CreateGameInput {
  readonly mode: GameMode;
  readonly difficulty?: Difficulty;
  readonly isRanked: boolean;
  readonly timeLimit?: number;
}

export interface MakeMoveInput {
  readonly from: number;
  readonly to: number;
  readonly diceValue: number;
}
