/**
 * Game Routes Simplifiées - Sans middleware externes
 */

import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { z } from 'zod';

const router = Router();

// Middleware de validation simple
const validateBody = (schema: z.ZodSchema) => (req: any, res: any, next: any) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.issues
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation'
    });
  }
};

const validateParams = (schema: z.ZodSchema) => (req: any, res: any, next: any) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides',
        details: error.issues
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation'
    });
  }
};

// Schémas de validation
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

const gameIdSchema = z.object({
  gameId: z.string().min(1)
});

// Middleware d'authentification simple
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token d\'authentification requis'
    });
  }
  
  // Simulation d'utilisateur authentifié
  req.user = {
    id: 'user_123',
    email: 'test@example.com',
    role: 'PLAYER'
  };
  next();
};

/**
 * @route   POST /api/games
 * @desc    Créer une nouvelle partie
 */
router.post('/', authMiddleware, validateBody(createGameSchema), GameController.createGame);

/**
 * @route   GET /api/games/:gameId
 * @desc    Obtenir l'état d'une partie
 */
router.get('/:gameId', authMiddleware, validateParams(gameIdSchema), GameController.getGameState);

/**
 * @route   POST /api/games/:gameId/roll
 * @desc    Lancer les dés
 */
router.post('/:gameId/roll', authMiddleware, validateParams(gameIdSchema), GameController.rollDice);

/**
 * @route   POST /api/games/:gameId/move
 * @desc    Effectuer un mouvement
 */
router.post('/:gameId/move', authMiddleware, validateParams(gameIdSchema), validateBody(makeMoveSchema), GameController.makeMove);

/**
 * @route   GET /api/games/:gameId/suggestions
 * @desc    Obtenir les suggestions IA
 */
router.get('/:gameId/suggestions', authMiddleware, validateParams(gameIdSchema), GameController.getMoveSuggestions);

/**
 * @route   GET /api/games/:gameId/evaluate
 * @desc    Évaluer la position
 */
router.get('/:gameId/evaluate', authMiddleware, validateParams(gameIdSchema), GameController.evaluatePosition);

/**
 * @route   GET /api/games
 * @desc    Liste des parties utilisateur
 */
router.get('/', authMiddleware, GameController.getUserGames);

export default router;
