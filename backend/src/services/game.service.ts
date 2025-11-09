/**
 * GameService - Logique métier du backgammon
 */

import { 
  GameStatus, 
  PlayerColor, 
  GameMode,
  Difficulty
} from '../types';
import { 
  ServiceGameState,
  ServicePlayer,
  ServiceDice,
  ServiceMove,
  BoardPosition,
  CreateGameInput,
  MakeMoveInput
} from '../types';
import { CreateGameSchema, MakeMoveSchema } from '../utils';
import { Logger } from '../utils';
import { ValidationUtils } from '../utils';

export class GameService {
  /**
   * Créer une nouvelle partie de backgammon
   */
  public static createGame(userId: string, gameData: CreateGameInput): ServiceGameState {
    try {
      const validatedData = ValidationUtils.validate(CreateGameSchema, gameData);
      
      const player: ServicePlayer = {
        id: userId,
        color: PlayerColor.WHITE,
        isHuman: true
      };

      const opponent: ServicePlayer = {
        id: 'ai_' + Date.now(),
        color: PlayerColor.BLACK,
        isHuman: false
      };

      const initialBoard = GameService.createInitialBoard();
      
      const gameState: ServiceGameState = {
        id: GameService.generateGameId(),
        status: GameStatus.WAITING,
        mode: validatedData.mode,
        isRanked: validatedData.isRanked,
        timeLimit: validatedData.timeLimit,
        currentPlayer: PlayerColor.WHITE,
        players: [player, opponent],
        board: initialBoard,
        dice: { die1: 0, die2: 0 },
        moves: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Logger.info('Game created successfully', {
        gameId: gameState.id,
        userId,
        action: 'game_created',
        mode: validatedData.mode
      });

      return gameState;
    } catch (error) {
      Logger.error('Failed to create game', {
        userId,
        action: 'game_creation_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Lancer les dés pour le tour actuel
   */
  public static rollDice(gameState: GameState): GameState {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    
    const updatedState: GameState = {
      ...gameState,
      dice: { die1, die2 },
      updatedAt: new Date()
    };

    Logger.debug('Dice rolled', {
      gameId: gameState.id,
      dice: { die1, die2 },
      currentPlayer: gameState.currentPlayer
    });

    return updatedState;
  }

  /**
   * Valider et exécuter un mouvement
   */
  public static makeMove(gameState: GameState, moveData: MakeMoveInput): GameState {
    try {
      const validatedMove = ValidationUtils.validate(MakeMoveSchema, moveData);
      
      // Validation du mouvement
      if (!GameService.isValidMove(gameState, validatedMove)) {
        throw new Error('Invalid move');
      }

      // Exécuter le mouvement
      const newBoard = GameService.executeMove(gameState.board, validatedMove);
      
      const move: Move = {
        from: validatedMove.from,
        to: validatedMove.to,
        diceValue: validatedMove.diceValue,
        player: gameState.currentPlayer,
        timestamp: new Date()
      };

      const updatedState: GameState = {
        ...gameState,
        board: newBoard,
        moves: [...gameState.moves, move],
        updatedAt: new Date()
      };

      // Vérifier si le tour est terminé
      if (GameService.isTurnComplete(updatedState)) {
        updatedState.currentPlayer = updatedState.currentPlayer === PlayerColor.WHITE 
          ? PlayerColor.BLACK 
          : PlayerColor.WHITE;
        updatedState.dice = { die1: 0, die2: 0 };
      }

      // Vérifier la victoire
      const winner = GameService.checkWinner(updatedState);
      if (winner) {
        updatedState.status = GameStatus.COMPLETED;
        updatedState.winner = winner;
      }

      Logger.info('Move executed successfully', {
        gameId: gameState.id,
        move: validatedMove,
        currentPlayer: gameState.currentPlayer
      });

      return updatedState;
    } catch (error) {
      Logger.error('Failed to execute move', {
        gameId: gameState.id,
        action: 'move_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Obtenir l'état actuel du jeu
   */
  public static getGameState(gameId: string): GameState | null {
    try {
      // En production, cela viendrait de la base de données
      Logger.debug('Fetching game state', { gameId, action: 'fetch_game_state' });
      
      // Pour l'instant, retourne null (à implémenter avec base de données)
      return null;
    } catch (error) {
      Logger.error('Failed to fetch game state', {
        gameId,
        action: 'fetch_game_state_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Créer le plateau initial de backgammon
   */
  private static createInitialBoard(): BoardPosition[] {
    const board: BoardPosition[] = Array(26).fill(null).map((_, index) => ({
      point: index,
      checkers: 0,
      player: null
    }));

    // Configuration initiale standard du backgammon
    // Pions blancs
    board[1] = { point: 1, checkers: 2, player: PlayerColor.WHITE };
    board[12] = { point: 12, checkers: 5, player: PlayerColor.WHITE };
    board[17] = { point: 17, checkers: 3, player: PlayerColor.WHITE };
    board[19] = { point: 19, checkers: 5, player: PlayerColor.WHITE };

    // Pions noirs
    board[24] = { point: 24, checkers: 2, player: PlayerColor.BLACK };
    board[13] = { point: 13, checkers: 5, player: PlayerColor.BLACK };
    board[8] = { point: 8, checkers: 3, player: PlayerColor.BLACK };
    board[6] = { point: 6, checkers: 5, player: PlayerColor.BLACK };

    return board;
  }

  /**
   * Valider si un mouvement est légal
   */
  private static isValidMove(gameState: GameState, move: MakeMoveInput): boolean {
    const { board, dice, currentPlayer } = gameState;
    
    // Vérifier si la valeur du dé correspond
    const diceValues = [dice.die1, dice.die2].filter(d => d > 0);
    if (!diceValues.includes(move.diceValue)) {
      return false;
    }

    // Vérifier si le point de départ contient des pions du joueur
    const fromPoint = board[move.from];
    if (!fromPoint || fromPoint.player !== currentPlayer || fromPoint.checkers === 0) {
      return false;
    }

    // Vérifier si le point de destination est valide
    const toPoint = board[move.to];
    if (!toPoint) {
      return false;
    }

    // Vérifier si le mouvement est dans la bonne direction
    const direction = currentPlayer === PlayerColor.WHITE ? 1 : -1;
    if ((move.to - move.from) * direction !== move.diceValue) {
      return false;
    }

    // Vérifier si la destination est accessible
    if (toPoint.player && toPoint.player !== currentPlayer && toPoint.checkers > 1) {
      return false; // Point bloqué par l'adversaire
    }

    return true;
  }

  /**
   * Exécuter un mouvement sur le plateau
   */
  private static executeMove(board: BoardPosition[], move: MakeMoveInput): BoardPosition[] {
    const newBoard = board.map(pos => ({ ...pos }));
    
    // Retirer le pion du point de départ
    const fromPoint = newBoard[move.from];
    if (fromPoint.checkers > 1) {
      fromPoint.checkers--;
    } else {
      fromPoint.checkers = 0;
      fromPoint.player = null;
    }

    // Ajouter le pion au point de destination
    const toPoint = newBoard[move.to];
    if (toPoint.player && toPoint.player !== fromPoint.player && toPoint.checkers === 1) {
      // Frapper un pion adverse
      toPoint.player = fromPoint.player;
      // Le pion frappé va au bar (point 0)
      newBoard[0].checkers++;
      newBoard[0].player = toPoint.player === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
    } else {
      toPoint.checkers++;
      toPoint.player = fromPoint.player;
    }

    return newBoard;
  }

  /**
   * Vérifier si le tour est complet
   */
  private static isTurnComplete(gameState: GameState): boolean {
    const { dice, moves } = gameState;
    const diceValues = [dice.die1, dice.die2].filter(d => d > 0);
    
    // Si les dés sont les mêmes (double), 4 mouvements sont possibles
    const totalMoves = dice.die1 === dice.die2 ? 4 : 2;
    
    return moves.length >= totalMoves || !GameService.hasAvailableMoves(gameState);
  }

  /**
   * Vérifier s'il reste des mouvements possibles
   */
  private static hasAvailableMoves(gameState: GameState): boolean {
    const { board, dice, currentPlayer } = gameState;
    const diceValues = [dice.die1, dice.die2].filter(d => d > 0);
    
    for (const dieValue of diceValues) {
      for (let i = 0; i < board.length; i++) {
        const position = board[i];
        if (position && position.player === currentPlayer && position.checkers > 0) {
          const direction = currentPlayer === PlayerColor.WHITE ? 1 : -1;
          const targetPoint = i + (dieValue * direction);
          
          if (targetPoint >= 0 && targetPoint <= 25) {
            const target = board[targetPoint];
            if (target && (!target.player || target.player === currentPlayer || target.checkers <= 1)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Vérifier si un joueur a gagné
   */
  private static checkWinner(gameState: GameState): Player | null {
    const { board, players } = gameState;
    
    for (const player of players) {
      // Vérifier si tous les pions du joueur sont sortis (point 25)
      const playerCheckers = board.filter(pos => pos && pos.player === player.color && pos.checkers > 0);
      
      if (playerCheckers.length === 0 || (playerCheckers.length === 1 && playerCheckers[0] && playerCheckers[0].point === 25)) {
        return player;
      }
    }
    
    return null;
  }

  /**
   * Générer un ID de partie unique
   */
  private static generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
