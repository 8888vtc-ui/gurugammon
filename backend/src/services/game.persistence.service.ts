/**
 * Game Persistence Service - Database Operations
 * Handles all game state persistence with PostgreSQL + Prisma
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseConfig } from '../config/database.config';
import { Logger } from '../utils/logger.utils';

interface GameState {
  id: string;
  player1_id?: string;
  player2_id?: string;
  board_state: any;
  current_player: 'white' | 'black';
  dice?: number[];
  game_status: 'waiting' | 'playing' | 'finished';
  winner?: string;
  created_at: Date;
  updated_at: Date;
}

interface GameMove {
  game_id: string;
  user_id?: string;
  player: 'white' | 'black';
  dice: number[];
  move: string;
  from_point?: number;
  to_point?: number;
  equity?: number;
  thinking_time?: number;
}

interface ChatMessage {
  game_id: string;
  user_id?: string;
  message: string;
  message_type: 'TEXT' | 'SYSTEM' | 'EMOJI';
}

export class GamePersistenceService {
  private static prisma: PrismaClient;

  /**
   * Initialize database connection
   */
  public static async initialize(): Promise<void> {
    try {
      this.prisma = DatabaseConfig.getInstance();
      const isConnected = await DatabaseConfig.validateConnection();
      
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      Logger.info('Game persistence service initialized', {
        service: 'GamePersistenceService',
        status: 'connected'
      });
    } catch (error) {
      Logger.error('Failed to initialize game persistence service', {
        service: 'GamePersistenceService',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create new game in database
   */
  public static async createGame(gameData: Partial<GameState>): Promise<GameState> {
    try {
      const game = await this.prisma.games.create({
        data: {
          id: gameData.id || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          player1_id: gameData.player1_id,
          player2_id: gameData.player2_id,
          board_state: gameData.board_state || {},
          current_player: gameData.current_player || 'white',
          dice: gameData.dice || [],
          game_status: gameData.game_status || 'waiting',
          winner: gameData.winner,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      Logger.debug('Game created in database', {
        gameId: game.id,
        player1_id: game.player1_id,
        status: game.game_status
      });

      return game;
    } catch (error) {
      Logger.error('Failed to create game in database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        gameData
      });
      throw new Error('Failed to create game');
    }
  }

  /**
   * Get game by ID
   */
  public static async getGame(gameId: string): Promise<GameState | null> {
    try {
      const game = await this.prisma.games.findUnique({
        where: { id: gameId },
        include: {
          game_moves: {
            orderBy: { created_at: 'asc' }
          },
          chat_messages: {
            orderBy: { created_at: 'asc' }
          }
        }
      });

      if (!game) {
        return null;
      }

      Logger.debug('Game retrieved from database', {
        gameId,
        status: game.game_status,
        movesCount: game.game_moves.length
      });

      return game;
    } catch (error) {
      Logger.error('Failed to get game from database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        gameId
      });
      throw new Error('Failed to retrieve game');
    }
  }

  /**
   * Update game state
   */
  public static async updateGame(gameId: string, updates: Partial<GameState>): Promise<GameState> {
    try {
      const game = await this.prisma.games.update({
        where: { id: gameId },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      Logger.debug('Game updated in database', {
        gameId,
        updates: Object.keys(updates)
      });

      return game;
    } catch (error) {
      Logger.error('Failed to update game in database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        gameId,
        updates
      });
      throw new Error('Failed to update game');
    }
  }

  /**
   * Save game move
   */
  public static async saveMove(moveData: GameMove): Promise<void> {
    try {
      await this.prisma.game_moves.create({
        data: {
          id: `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          game_id: moveData.game_id,
          user_id: moveData.user_id,
          player: moveData.player,
          dice: moveData.dice,
          move: moveData.move,
          from_point: moveData.from_point,
          to_point: moveData.to_point,
          equity: moveData.equity,
          thinking_time: moveData.thinking_time,
          created_at: new Date()
        }
      });

      Logger.debug('Move saved to database', {
        gameId: moveData.game_id,
        player: moveData.player,
        move: moveData.move
      });
    } catch (error) {
      Logger.error('Failed to save move to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        moveData
      });
      throw new Error('Failed to save move');
    }
  }

  /**
   * Save chat message
   */
  public static async saveChatMessage(messageData: ChatMessage): Promise<void> {
    try {
      await this.prisma.chat_messages.create({
        data: {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          game_id: messageData.game_id,
          user_id: messageData.user_id,
          message: messageData.message,
          message_type: messageData.message_type,
          created_at: new Date()
        }
      });

      Logger.debug('Chat message saved to database', {
        gameId: messageData.game_id,
        messageType: messageData.message_type
      });
    } catch (error) {
      Logger.error('Failed to save chat message to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageData
      });
      throw new Error('Failed to save chat message');
    }
  }

  /**
   * Get user's active games
   */
  public static async getUserActiveGames(userId: string): Promise<GameState[]> {
    try {
      const games = await this.prisma.games.findMany({
        where: {
          OR: [
            { player1_id: userId },
            { player2_id: userId }
          ],
          game_status: {
            in: ['waiting', 'playing']
          }
        },
        orderBy: { updated_at: 'desc' }
      });

      Logger.debug('User active games retrieved', {
        userId,
        gamesCount: games.length
      });

      return games;
    } catch (error) {
      Logger.error('Failed to get user active games', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw new Error('Failed to retrieve user games');
    }
  }

  /**
   * Get game history
   */
  public static async getGameHistory(gameId: string): Promise<{
    moves: any[];
    messages: any[];
  }> {
    try {
      const moves = await this.prisma.game_moves.findMany({
        where: { game_id: gameId },
        orderBy: { created_at: 'asc' }
      });

      const messages = await this.prisma.chat_messages.findMany({
        where: { game_id: gameId },
        orderBy: { created_at: 'asc' }
      });

      Logger.debug('Game history retrieved', {
        gameId,
        movesCount: moves.length,
        messagesCount: messages.length
      });

      return { moves, messages };
    } catch (error) {
      Logger.error('Failed to get game history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        gameId
      });
      throw new Error('Failed to retrieve game history');
    }
  }

  /**
   * Clean up old finished games
   */
  public static async cleanupOldGames(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.games.deleteMany({
        where: {
          game_status: 'finished',
          updated_at: {
            lt: cutoffDate
          }
        }
      });

      Logger.info('Old games cleaned up', {
        deletedCount: result.count,
        cutoffDate
      });

      return result.count;
    } catch (error) {
      Logger.error('Failed to cleanup old games', {
        error: error instanceof Error ? error.message : 'Unknown error',
        daysOld
      });
      throw new Error('Failed to cleanup old games');
    }
  }

  /**
   * Get database statistics
   */
  public static async getStats(): Promise<{
    totalGames: number;
    activeGames: number;
    finishedGames: number;
    totalMoves: number;
    totalMessages: number;
  }> {
    try {
      const [totalGames, activeGames, finishedGames, totalMoves, totalMessages] = await Promise.all([
        this.prisma.games.count(),
        this.prisma.games.count({ where: { game_status: { in: ['waiting', 'playing'] } } }),
        this.prisma.games.count({ where: { game_status: 'finished' } }),
        this.prisma.game_moves.count(),
        this.prisma.chat_messages.count()
      ]);

      return {
        totalGames,
        activeGames,
        finishedGames,
        totalMoves,
        totalMessages
      };
    } catch (error) {
      Logger.error('Failed to get database stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to retrieve database stats');
    }
  }
}
