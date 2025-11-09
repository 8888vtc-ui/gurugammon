/**
 * Core Types - Types fondamentaux de l'application
 */

export type Player = {
  id: string;
  color: 'white' | 'black';
  isHuman: boolean;
  elo: number;
};

export type GameState = {
  id: string;
  status: 'waiting' | 'playing' | 'completed';
  mode: 'pvp' | 'pvc';
  isRanked: boolean;
  timeLimit?: number;
  currentPlayer: 'white' | 'black';
  players: Player[];
  board: BoardPosition[];
  dice: { die1: number; die2: number };
  moves: Move[];
  winner?: Player;
  createdAt: Date;
  updatedAt: Date;
};

export type BoardPosition = {
  point: number;
  player?: 'white' | 'black';
  checkers: number;
};

export type Move = {
  from: number;
  to: number;
  diceValue: number;
  player: 'white' | 'black';
  timestamp: Date;
};
