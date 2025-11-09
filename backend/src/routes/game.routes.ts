/**
 * Game Routes - Définition des routes API pour les jeux
 */

import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Schémas de validation pour les routes
const createGameSchema = z.object({
  mode: z.enum(['pvp', 'pvc']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  isRanked: z.boolean(),
  timeLimit: z.number().positive().optional()
});

const makeMoveSchema = z.object({
  from: z.number().int().min(0).max(25),
  to: z.number().int().min(0).max(25),
  diceValue: z.number().int().min(1).max(6)
});

const gameIdParamSchema = z.object({
  gameId: z.string().min(1, 'ID de partie requis')
});

/**
 * @route   POST /api/games
 * @desc    Créer une nouvelle partie de backgammon
 * @access  Private
 */
router.post('/', 
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 10 }), // 10 parties par minute
  validationMiddleware(createGameSchema, 'body'),
  GameController.createGame
);

/**
 * @route   GET /api/games/:gameId
 * @desc    Obtenir l'état actuel d'une partie
 * @access  Private
 */
router.get('/:gameId',
  authMiddleware,
  validationMiddleware(gameIdParamSchema, 'params'),
  GameController.getGameState
);

/**
 * @route   POST /api/games/:gameId/roll
 * @desc    Lancer les dés pour une partie
 * @access  Private
 */
router.post('/:gameId/roll',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 30 }), // 30 lancers par minute
  validationMiddleware(gameIdParamSchema, 'params'),
  GameController.rollDice
);

/**
 * @route   POST /api/games/:gameId/move
 * @desc    Effectuer un mouvement dans une partie
 * @access  Private
 */
router.post('/:gameId/move',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 60 }), // 60 mouvements par minute
  validationMiddleware(gameIdParamSchema, 'params'),
  validationMiddleware(makeMoveSchema, 'body'),
  GameController.makeMove
);

/**
 * @route   GET /api/games/:gameId/suggestions
 * @desc    Obtenir les suggestions de mouvements de l'IA GNUBG
 * @access  Private
 */
router.get('/:gameId/suggestions',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 20 }), // 20 demandes de suggestions par minute
  validationMiddleware(gameIdParamSchema, 'params'),
  GameController.getMoveSuggestions
);

/**
 * @route   GET /api/games/:gameId/evaluate
 * @desc    Évaluer la position actuelle avec GNUBG
 * @access  Private
 */
router.get('/:gameId/evaluate',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 15 }), // 15 évaluations par minute
  validationMiddleware(gameIdParamSchema, 'params'),
  GameController.evaluatePosition
);

/**
 * @route   GET /api/games
 * @desc    Obtenir la liste des parties de l'utilisateur
 * @access  Private
 */
router.get('/',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 30 }), // 30 requêtes par minute
  GameController.getUserGames
);

export default router;
