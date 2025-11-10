/**
 * Final Schema-Compliant ELO Service
 * Uses exact Prisma generated types based on error analysis
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger.utils';

const prisma = new PrismaClient();

interface EloResult {
  winnerId: string;
  loserId: string;
  gameType: 'RATED' | 'CASUAL' | 'TOURNAMENT';
  isDraw?: boolean;
}

interface RankingEntry {
  userId: string;
  username: string;
  elo: number;
  rank: number;
  change: number;
  gamesPlayed: number;
  winRate: number;
  country?: string;
}

export class EloService {
  private static readonly K_FACTOR = 32;
  private static readonly INITIAL_ELO = 1500;
  private static readonly MIN_ELO = 800;
  private static readonly MAX_ELO = 2800;

  /**
   * Calculate ELO changes for a game result
   */
  public static async calculateEloChanges(result: EloResult): Promise<{
    winnerChange: number;
    loserChange: number;
    newWinnerElo: number;
    newLoserElo: number;
  }> {
    try {
      // Get current ELO ratings - using 'user' (singular)
      const [winner, loser] = await Promise.all([
        prisma.user.findUnique({ where: { id: result.winnerId } }),
        prisma.user.findUnique({ where: { id: result.loserId } })
      ]);

      if (!winner || !loser) {
        throw new Error('User not found for ELO calculation');
      }

      const winnerElo = winner.elo || this.INITIAL_ELO;
      const loserElo = loser.elo || this.INITIAL_ELO;

      // Calculate expected scores
      const expectedWinnerScore = this.getExpectedScore(winnerElo, loserElo);
      const expectedLoserScore = this.getExpectedScore(loserElo, winnerElo);

      // Determine K factor based on game type
      const kFactor = this.getKFactor(result.gameType, winnerElo, loserElo);

      // Calculate ELO changes
      const actualWinnerScore = result.isDraw ? 0.5 : 1;
      const actualLoserScore = result.isDraw ? 0.5 : 0;

      const winnerChange = Math.round(kFactor * (actualWinnerScore - expectedWinnerScore));
      const loserChange = Math.round(kFactor * (actualLoserScore - expectedLoserScore));

      // Apply ELO limits
      const newWinnerElo = Math.max(this.MIN_ELO, Math.min(this.MAX_ELO, winnerElo + winnerChange));
      const newLoserElo = Math.max(this.MIN_ELO, Math.min(this.MAX_ELO, loserElo + loserChange));

      Logger.info('ELO calculation completed', {
        winnerId: result.winnerId,
        loserId: result.loserId,
        gameType: result.gameType,
        winnerChange,
        loserChange,
        newWinnerElo,
        newLoserElo
      });

      return {
        winnerChange,
        loserChange,
        newWinnerElo,
        newLoserElo
      };
    } catch (error) {
      Logger.error('ELO calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        result
      });
      throw error;
    }
  }

  /**
   * Update ELO ratings after a game
   */
  public static async updateEloRatings(result: EloResult): Promise<void> {
    try {
      const { winnerChange, loserChange, newWinnerElo, newLoserElo } = 
        await this.calculateEloChanges(result);

      // Update database - using 'user' (singular)
      await Promise.all([
        prisma.user.update({
          where: { id: result.winnerId },
          data: { elo: newWinnerElo }
        }),
        prisma.user.update({
          where: { id: result.loserId },
          data: { elo: newLoserElo }
        })
      ]);

      Logger.info('ELO ratings updated successfully', {
        winnerId: result.winnerId,
        loserId: result.loserId,
        newWinnerElo,
        newLoserElo
      });
    } catch (error) {
      Logger.error('ELO update failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        result
      });
      throw error;
    }
  }

  /**
   * Get global rankings
   */
  public static async getGlobalRankings(limit: number = 100, offset: number = 0): Promise<{
    rankings: RankingEntry[];
    total: number;
  }> {
    try {
      // Get all active users - using 'user' (singular)
      const users = await prisma.user.findMany({
        where: { isActive: true },
        orderBy: { elo: 'desc' },
        skip: offset,
        take: limit
      });

      // Get game counts for each user - using 'game' (singular)
      const rankings: RankingEntry[] = await Promise.all(
        users.map(async (user, index) => {
          const gamesPlayed = await prisma.game.count({
            where: {
              OR: [
                { whitePlayer: user.id },
                { blackPlayer: user.id }
              ],
              status: 'FINISHED'
            }
          });

          return {
            userId: user.id,
            username: user.username,
            elo: user.elo || this.INITIAL_ELO,
            rank: offset + index + 1,
            change: 0,
            gamesPlayed,
            winRate: 0, // Simplified
            country: undefined
          };
        })
      );

      // Get total count
      const total = await prisma.user.count({ where: { isActive: true } });

      return { rankings, total };
    } catch (error) {
      Logger.error('Failed to get global rankings', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get user's rank information
   */
  public static async getUserRank(userId: string): Promise<{
    globalRank: number;
    totalPlayers: number;
    percentile: number;
  }> {
    try {
      // Get user's ELO
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { elo: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const userElo = user.elo || this.INITIAL_ELO;

      // Get global rank
      const globalRank = await prisma.user.count({
        where: {
          isActive: true,
          elo: { gt: userElo }
        }
      });

      const totalPlayers = await prisma.user.count({ where: { isActive: true } });
      const percentile = totalPlayers > 0 ? 
        Math.round(((totalPlayers - globalRank) / totalPlayers) * 100) : 0;

      return {
        globalRank: globalRank + 1,
        totalPlayers,
        percentile
      };
    } catch (error) {
      Logger.error('Failed to get user rank', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Get user's ELO history
   */
  public static async getUserEloHistory(
    userId: string, 
    limit: number = 50
  ): Promise<{
    history: Array<{
      date: string;
      elo: number;
      change: number;
      gameType: string;
      opponent: string;
    }>;
  }> {
    try {
      // TODO: Implement when elo_history table is added
      return {
        history: []
      };
    } catch (error) {
      Logger.error('Failed to get user ELO history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private static getExpectedScore(playerElo: number, opponentElo: number): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  private static getKFactor(gameType: string, playerElo: number, opponentElo: number): number {
    let baseK = this.K_FACTOR;

    // Adjust based on game type
    switch (gameType) {
      case 'TOURNAMENT':
        baseK = 48;
        break;
      case 'CASUAL':
        baseK = 16;
        break;
    }

    // Adjust for new players
    const totalGames = Math.min(playerElo, opponentElo) < 1600 ? 20 : 100;
    if (totalGames < 30) {
      baseK *= 1.5;
    }

    // Adjust for high-rated players
    const avgElo = (playerElo + opponentElo) / 2;
    if (avgElo > 2400) {
      baseK *= 0.8;
    }

    return Math.round(baseK);
  }

  /**
   * Get top players by ELO
   */
  public static async getTopPlayers(limit: number = 10): Promise<RankingEntry[]> {
    const { rankings } = await this.getGlobalRankings(limit, 0);
    return rankings;
  }

  /**
   * Calculate ELO distribution statistics
   */
  public static async getEloDistribution(): Promise<{
    ranges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    average: number;
    median: number;
  }> {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { elo: true }
      });

      const elos = users.map(u => u.elo || this.INITIAL_ELO).sort((a, b) => a - b);
      
      // Define ELO ranges
      const ranges = [
        { min: 800, max: 1200, label: '800-1200' },
        { min: 1200, max: 1400, label: '1200-1400' },
        { min: 1400, max: 1600, label: '1400-1600' },
        { min: 1600, max: 1800, label: '1600-1800' },
        { min: 1800, max: 2000, label: '1800-2000' },
        { min: 2000, max: 2400, label: '2000-2400' },
        { min: 2400, max: 2800, label: '2400-2800' }
      ];

      const distribution = ranges.map(range => {
        const count = elos.filter(elo => elo >= range.min && elo < range.max).length;
        return {
          range: range.label,
          count,
          percentage: Math.round((count / users.length) * 100 * 100) / 100
        };
      });

      const average = Math.round(
        elos.reduce((sum, elo) => sum + elo, 0) / elos.length
      );
      
      const median = elos.length > 0 ? 
        elos[Math.floor(elos.length / 2)] : this.INITIAL_ELO;

      return {
        ranges: distribution,
        average,
        median
      };
    } catch (error) {
      Logger.error('Failed to get ELO distribution', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
