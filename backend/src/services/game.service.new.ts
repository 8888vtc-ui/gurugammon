/**
 * GameService - Logique métier du backgammon (Version simplifiée)
 */

import { 
  SimpleGameStatus, 
  SimplePlayerColor, 
  SimpleGameMode,
  SimpleDifficulty,
  SimpleGameState,
  SimplePlayer,
  SimpleDice,
  SimpleMove,
  SimpleBoardPosition,
  SimpleCreateGameRequest,
  SimpleMakeMoveRequest
} from '../types';
import { Logger } from '../utils';
import { ValidationUtils } from '../utils';

export class GameService {
  /**
   * Créer une nouvelle partie de backgammon
   */
  public static createGame(userId: string, gameData: SimpleCreateGameRequest): SimpleGameState {
    try {
      // Validation simple
      if (!gameData.mode || !gameData.isRanked) {
        throw new Error('Invalid game data');
      }
      
      const player: SimplePlayer = {
        id: userId,
        color: SimplePlayerColor.WHITE,
        isHuman: true
      };

      const opponent: SimplePlayer = {
        id: 'ai_' + Date.now(),
        color: SimplePlayerColor.BLACK,
        isHuman: false
      };

      const initialBoard = GameService.createInitialBoard();
      
      const gameState: SimpleGameState = {
        id: GameService.generateGameId(),
        status: SimpleGameStatus.WAITING,
        mode: gameData.mode,
        isRanked: gameData.isRanked,
        timeLimit: gameData.timeLimit,
        currentPlayer: SimplePlayerColor.WHITE,
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
        action: 'game_created'
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
  public static rollDice(gameState: SimpleGameState): SimpleGameState {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    
    const updatedState: SimpleGameState = {
      ...gameState,
      dice: { die1, die2 },
      updatedAt: new Date()
    };

    Logger.debug('Dice rolled', {
      gameId: gameState.id,
      dice: { die1, die2 }
    });

    return updatedState;
  }

  /**
   * Valider et exécuter un mouvement
   */
  public static makeMove(gameState: SimpleGameState, moveData: SimpleMakeMoveRequest): SimpleGameState {
    try {
      // Validation simple
      if (!moveData.from || !moveData.to || !moveData.diceValue) {
        throw new Error('Invalid move data');
      }
      
      // Validation du mouvement
      if (!GameService.isValidMove(gameState, moveData)) {
        throw new Error('Invalid move');
      }

      // Exécuter le mouvement
      const newBoard = GameService.executeMove(gameState.board, moveData);
      
      const move: SimpleMove = {
        from: moveData.from,
        to: moveData.to,
        diceValue: moveData.diceValue,
        player: gameState.currentPlayer,
        timestamp: new Date()
      };

      const updatedState: SimpleGameState = {
        ...gameState,
        board: newBoard,
        moves: [...gameState.moves, move],
        updatedAt: new Date()
      };

      // Vérifier si le tour est terminé
      if (GameService.isTurnComplete(updatedState)) {
        updatedState.currentPlayer = updatedState.currentPlayer === SimplePlayerColor.WHITE 
          ? SimplePlayerColor.BLACK 
          : SimplePlayerColor.WHITE;
        updatedState.dice = { die1: 0, die2: 0 };
      }

      // Vérifier la victoire
      const winner = GameService.checkWinner(updatedState);
      if (winner) {
        updatedState.status = SimpleGameStatus.COMPLETED;
        updatedState.winner = winner;
      }

      Logger.info('Move executed successfully', {
        gameId: gameState.id,
        move: moveData
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
  public static getGameState(gameId: string): SimpleGameState | null {
    try {
      Logger.debug('Fetching game state', { gameId, action: 'fetch_game_state' });
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
  private static createInitialBoard(): SimpleBoardPosition[] {
    const board: SimpleBoardPosition[] = Array(26).fill(null).map((_, index) => ({
      point: index,
      checkers: 0,
      player: null
    }));

    // Configuration initiale standard
    board[1] = { point: 1, checkers: 2, player: SimplePlayerColor.WHITE };
    board[12] = { point: 12, checkers: 5, player: SimplePlayerColor.WHITE };
    board[17] = { point: 17, checkers: 3, player: SimplePlayerColor.WHITE };
    board[19] = { point: 19, checkers: 5, player: SimplePlayerColor.WHITE };

    board[24] = { point: 24, checkers: 2, player: SimplePlayerColor.BLACK };
    board[13] = { point: 13, checkers: 5, player: SimplePlayerColor.BLACK };
    board[8] = { point: 8, checkers: 3, player: SimplePlayerColor.BLACK };
    board[6] = { point: 6, checkers: 5, player: SimplePlayerColor.BLACK };

    return board;
  }

  /**
   * Valider si un mouvement est légal
   */
  private static isValidMove(gameState: SimpleGameState, move: SimpleMakeMoveRequest): boolean {
    const { board, dice, currentPlayer } = gameState;
    
    const diceValues = [dice.die1, dice.die2].filter(d => d > 0);
    if (!diceValues.includes(move.diceValue)) {
      return false;
    }

    const fromPoint = board[move.from];
    if (!fromPoint || fromPoint.player !== currentPlayer || fromPoint.checkers === 0) {
      return false;
    }

    const toPoint = board[move.to];
    if (!toPoint) {
      return false;
    }

    const direction = currentPlayer === SimplePlayerColor.WHITE ? 1 : -1;
    if ((move.to - move.from) * direction !== move.diceValue) {
      return false;
    }

    if (toPoint.player && toPoint.player !== currentPlayer && toPoint.checkers > 1) {
      return false;
    }

    return true;
  }

  /**
   * Exécuter un mouvement sur le plateau
   */
  private static executeMove(board: SimpleBoardPosition[], move: SimpleMakeMoveRequest): SimpleBoardPosition[] {
    const newBoard = board.map(pos => ({ ...pos }));
    
    const fromPoint = newBoard[move.from];
    if (fromPoint.checkers > 1) {
      fromPoint.checkers--;
    } else {
      fromPoint.checkers = 0;
      fromPoint.player = null;
    }

    const toPoint = newBoard[move.to];
    if (toPoint.player && toPoint.player !== fromPoint.player && toPoint.checkers === 1) {
      toPoint.player = fromPoint.player;
      newBoard[0].checkers++;
      newBoard[0].player = toPoint.player === SimplePlayerColor.WHITE ? SimplePlayerColor.BLACK : SimplePlayerColor.WHITE;
    } else {
      toPoint.checkers++;
      toPoint.player = fromPoint.player;
    }

    return newBoard;
  }

  /**
   * Vérifier si le tour est complet
   */
  private static isTurnComplete(gameState: SimpleGameState): boolean {
    const { dice } = gameState;
    const diceValues = [dice.die1, dice.die2].filter(d => d > 0);
    const totalMoves = dice.die1 === dice.die2 ? 4 : 2;
    
    return gameState.moves.length >= totalMoves || !GameService.hasAvailableMoves(gameState);
  }

  /**
   * Vérifier s'il reste des mouvements possibles
   */
  private static hasAvailableMoves(gameState: SimpleGameState): boolean {
    const { board, dice, currentPlayer } = gameState;
    const diceValues = [dice.die1, dice.die2].filter(d => d > 0);
    
    for (const dieValue of diceValues) {
      for (let i = 0; i < board.length; i++) {
        const position = board[i];
        if (position && position.player === currentPlayer && position.checkers > 0) {
          const direction = currentPlayer === SimplePlayerColor.WHITE ? 1 : -1;
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
  private static checkWinner(gameState: SimpleGameState): SimplePlayer | null {
    const { board, players } = gameState;
    
    for (const player of players) {
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
