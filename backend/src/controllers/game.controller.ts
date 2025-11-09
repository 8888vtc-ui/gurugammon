/**
 * GameController - API REST pour la gestion des jeux
 */

import { Request, Response } from 'express';
import { GameService } from '../services/game.simple';
import { AuthService } from '../services/auth.service.robust';
import { GnubgService } from '../services/gnubg.service.robust';
import { Logger } from '../utils/logger.utils';
import { z } from 'zod';

// Schémas de validation pour les requêtes API
const CreateGameRequestSchema = z.object({
  mode: z.enum(['pvp', 'pvc']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  isRanked: z.boolean(),
  timeLimit: z.number().positive().optional()
});

const MakeMoveRequestSchema = z.object({
  from: z.number().int().min(0).max(25),
  to: z.number().int().min(0).max(25),
  diceValue: z.number().int().min(1).max(6)
});

const RollDiceRequestSchema = z.object({
  gameId: z.string().min(1)
});

export class GameController {
  /**
   * Créer une nouvelle partie
   */
  public static async createGame(req: Request, res: Response): Promise<void> {
    try {
      // Validation de la requête
      const validatedData = CreateGameRequestSchema.parse(req.body);
      
      // Récupérer l'utilisateur depuis le JWT (middleware d'auth)
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      // Créer la partie via GameService
      const gameState = GameService.createGame(userId, validatedData);

      Logger.info('Game created via API', {
        gameId: gameState.id,
        userId,
        mode: validatedData.mode,
        action: 'api_game_created'
      });

      res.status(201).json({
        success: true,
        data: {
          gameId: gameState.id,
          status: gameState.status,
          mode: gameState.mode,
          currentPlayer: gameState.currentPlayer,
          players: gameState.players,
          board: gameState.board,
          isRanked: gameState.isRanked,
          timeLimit: gameState.timeLimit,
          createdAt: gameState.createdAt
        }
      });
    } catch (error) {
      Logger.error('API create game failed', {
        userId: (req as any).user?.id,
        action: 'api_create_game_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: error.issues
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la création de la partie'
      });
    }
  }

  /**
   * Lancer les dés
   */
  public static async rollDice(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = RollDiceRequestSchema.parse(req.params);
      
      // Récupérer l'état actuel du jeu
      const currentGameState = GameService.getGameState(gameId);
      if (!currentGameState) {
        res.status(404).json({
          success: false,
          error: 'Partie non trouvée'
        });
        return;
      }

      // Lancer les dés
      const updatedGameState = GameService.rollDice(currentGameState);

      Logger.info('Dice rolled via API', {
        gameId,
        dice: updatedGameState.dice,
        action: 'api_dice_rolled'
      });

      res.status(200).json({
        success: true,
        data: {
          gameId: updatedGameState.id,
          dice: updatedGameState.dice,
          currentPlayer: updatedGameState.currentPlayer,
          updatedAt: updatedGameState.updatedAt
        }
      });
    } catch (error) {
      Logger.error('API roll dice failed', {
        gameId: req.params.gameId,
        action: 'api_roll_dice_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'ID de partie invalide',
          details: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors du lancer des dés'
      });
    }
  }

  /**
   * Effectuer un mouvement
   */
  public static async makeMove(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = RollDiceRequestSchema.parse(req.params);
      const moveData = MakeMoveRequestSchema.parse(req.body);
      
      // Récupérer l'état actuel du jeu
      const currentGameState = GameService.getGameState(gameId);
      if (!currentGameState) {
        res.status(404).json({
          success: false,
          error: 'Partie non trouvée'
        });
        return;
      }

      // Effectuer le mouvement
      const updatedGameState = GameService.makeMove(currentGameState, moveData);

      // Si la partie est terminée, mettre à jour le ELO
      if (updatedGameState.status === 'completed' && updatedGameState.winner) {
        try {
          const userId = (req as any).user?.id;
          const opponentElo = 1200; // ELO par défaut pour l'IA
          
          if (userId && updatedGameState.winner.id === userId) {
            await AuthService.updateElo(userId, 'win', opponentElo);
          } else if (userId) {
            await AuthService.updateElo(userId, 'loss', opponentElo);
          }
        } catch (eloError) {
          Logger.warn('ELO update failed after game completion', {
            gameId,
            error: eloError instanceof Error ? eloError.message : 'Unknown error'
          });
        }
      }

      Logger.info('Move executed via API', {
        gameId,
        move: moveData,
        gameStatus: updatedGameState.status,
        action: 'api_move_executed'
      });

      res.status(200).json({
        success: true,
        data: {
          gameId: updatedGameState.id,
          board: updatedGameState.board,
          moves: updatedGameState.moves,
          currentPlayer: updatedGameState.currentPlayer,
          status: updatedGameState.status,
          winner: updatedGameState.winner,
          updatedAt: updatedGameState.updatedAt
        }
      });
    } catch (error) {
      Logger.error('API make move failed', {
        gameId: req.params.gameId,
        action: 'api_make_move_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Données de mouvement invalides',
          details: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors du mouvement'
      });
    }
  }

  /**
   * Obtenir l'état actuel d'une partie
   */
  public static async getGameState(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = RollDiceRequestSchema.parse(req.params);
      
      const gameState = GameService.getGameState(gameId);
      
      if (!gameState) {
        res.status(404).json({
          success: false,
          error: 'Partie non trouvée'
        });
        return;
      }

      Logger.debug('Game state fetched via API', {
        gameId,
        status: gameState.status,
        action: 'api_game_state_fetched'
      });

      res.status(200).json({
        success: true,
        data: {
          gameId: gameState.id,
          status: gameState.status,
          mode: gameState.mode,
          currentPlayer: gameState.currentPlayer,
          players: gameState.players,
          board: gameState.board,
          dice: gameState.dice,
          moves: gameState.moves,
          winner: gameState.winner,
          isRanked: gameState.isRanked,
          timeLimit: gameState.timeLimit,
          createdAt: gameState.createdAt,
          updatedAt: gameState.updatedAt
        }
      });
    } catch (error) {
      Logger.error('API get game state failed', {
        gameId: req.params.gameId,
        action: 'api_get_game_state_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'ID de partie invalide',
          details: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération de l\'état de jeu'
      });
    }
  }

  /**
   * Obtenir les suggestions de mouvements de l'IA GNUBG
   */
  public static async getMoveSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = RollDiceRequestSchema.parse(req.params);
      
      const gameState = GameService.getGameState(gameId);
      if (!gameState) {
        res.status(404).json({
          success: false,
          error: 'Partie non trouvée'
        });
        return;
      }

      // Convertir l'état du jeu en format GNUBG
      const boardState = GameController.convertBoardToGnubgFormat(gameState.board);
      
      const suggestions = await GnubgService.getBestMoves(
        boardState,
        [gameState.dice.die1, gameState.dice.die2],
        gameState.currentPlayer
      );

      Logger.info('Move suggestions fetched via API', {
        gameId,
        currentPlayer: gameState.currentPlayer,
        dice: gameState.dice,
        suggestionsCount: suggestions.length,
        action: 'api_move_suggestions_fetched'
      });

      res.status(200).json({
        success: true,
        data: {
          gameId,
          currentPlayer: gameState.currentPlayer,
          dice: gameState.dice,
          suggestions: suggestions.map(suggestion => ({
            move: suggestion.move,
            equity: suggestion.equity,
            winProbability: suggestion.winProbability,
            rank: suggestion.rank,
            isBest: suggestion.isBest
          }))
        }
      });
    } catch (error) {
      Logger.error('API get move suggestions failed', {
        gameId: req.params.gameId,
        action: 'api_get_move_suggestions_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'ID de partie invalide',
          details: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération des suggestions de mouvements'
      });
    }
  }

  /**
   * Évaluer la position actuelle avec GNUBG
   */
  public static async evaluatePosition(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = RollDiceRequestSchema.parse(req.params);
      
      const gameState = GameService.getGameState(gameId);
      if (!gameState) {
        res.status(404).json({
          success: false,
          error: 'Partie non trouvée'
        });
        return;
      }

      const boardState = GameController.convertBoardToGnubgFormat(gameState.board);
      
      const evaluation = await GnubgService.evaluatePosition(
        boardState,
        gameState.currentPlayer
      );

      Logger.info('Position evaluated via API', {
        gameId,
        currentPlayer: gameState.currentPlayer,
        winProbability: evaluation.winProbability,
        equity: evaluation.equity,
        action: 'api_position_evaluated'
      });

      res.status(200).json({
        success: true,
        data: {
          gameId,
          currentPlayer: gameState.currentPlayer,
          evaluation: {
            winProbability: evaluation.winProbability,
            equity: evaluation.equity,
            cubefulEquity: evaluation.cubefulEquity,
            marketWindow: evaluation.marketWindow
          }
        }
      });
    } catch (error) {
      Logger.error('API evaluate position failed', {
        gameId: req.params.gameId,
        action: 'api_evaluate_position_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'ID de partie invalide',
          details: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de l\'évaluation de la position'
      });
    }
  }

  /**
   * Liste des parties de l'utilisateur
   */
  public static async getUserGames(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non authentifié' });
        return;
      }

      // Pour l'instant, retourne une liste vide (à implémenter avec base de données)
      const userGames = [];

      Logger.info('User games fetched via API', {
        userId,
        gamesCount: userGames.length,
        action: 'api_user_games_fetched'
      });

      res.status(200).json({
        success: true,
        data: {
          games: userGames,
          count: userGames.length
        }
      });
    } catch (error) {
      Logger.error('API get user games failed', {
        userId: (req as any).user?.id,
        action: 'api_get_user_games_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération des parties'
      });
    }
  }

  /**
   * Convertir le plateau en format GNUBG
   */
  private static convertBoardToGnubgFormat(board: any[]): string {
    // Format GNUBG: position:point1,point2,...,point24
    // Point positif = pions blancs, négatif = pions noirs
    const gnubgBoard: number[] = Array(24).fill(0);
    
    board.forEach((position, index) => {
      if (index > 0 && index <= 24) {
        if (position.player === 'white') {
          gnubgBoard[index - 1] = position.checkers;
        } else if (position.player === 'black') {
          gnubgBoard[index - 1] = -position.checkers;
        }
      }
    });
    
    return gnubgBoard.join(':');
  }
}
