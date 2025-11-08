// src/controllers/gameController.ts
// @ts-nocheck - Désactiver les vérifications strictes pour le contrôleur de jeu
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { GameService } from '../services/gameService';
import { 
  Game, 
  GameState, 
  CreateGameRequest, 
  JoinGameRequest, 
  MakeMoveRequest,
  createGame,
  startGame,
  finishGame,
  isGameAvailable,
  createInitialGameState
} from '../types/game';

const prisma = new PrismaClient();

// Convertir Prisma Game vers Game interface
function prismaGameToGame(prismaGame: any, player1: any, player2: any = null): Game {
  return {
    id: prismaGame.id,
    player1,
    player2,
    status: prismaGame.status as any,
    gameType: prismaGame.gameType as any,
    stake: prismaGame.stake,
    winner: prismaGame.winnerId === player1.id ? player1 : player2,
    createdAt: prismaGame.createdAt,
    startedAt: prismaGame.startedAt,
    finishedAt: prismaGame.finishedAt
  };
}

// Créer une nouvelle partie
export const createGameController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { gameType, stake }: CreateGameRequest = req.body;

    // Validation
    if (!gameType || !stake) {
      return res.status(400).json({
        success: false,
        error: 'Game type and stake are required'
      });
    }

    if (!['match', 'money_game', 'tournament'].includes(gameType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game type'
      });
    }

    if (stake < 0 || stake > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Stake must be between 0 and 10000'
      });
    }

    // Récupérer le joueur
    const player = await prisma.player.findUnique({
      where: { id: req.user.id }
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Créer la partie en base
    const prismaGame = await prisma.game.create({
      data: {
        player1Id: player.id,
        gameType,
        stake,
        status: 'waiting'
      }
    });

    // Créer l'objet Game complet
    const game = prismaGameToGame(prismaGame, player);

    res.status(201).json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create game'
    });
  }
};

// Lister les parties disponibles
export const listAvailableGames = async (req: AuthRequest, res: Response) => {
  try {
    const availableGames = await prisma.game.findMany({
      where: {
        status: 'waiting',
        player2Id: null
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            email: true,
            points: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const games = availableGames.map(prismaGame => 
      prismaGameToGame(prismaGame, prismaGame.player1)
    );

    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('List games error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list games'
    });
  }
};

// Rejoindre une partie
export const joinGame = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { gameId }: JoinGameRequest = req.body;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    // Vérifier que la partie existe et est disponible
    const game = await prisma.game.findUnique({
      where: { id: parseInt(gameId) },
      include: {
        player1: true,
        player2: true
      }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    if (game.status !== 'waiting' || game.player2Id !== null) {
      return res.status(400).json({
        success: false,
        error: 'Game is not available'
      });
    }

    if (game.player1Id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot join your own game'
      });
    }

    // Vérifier que le joueur a assez de points
    const player = await prisma.player.findUnique({
      where: { id: req.user.id }
    });

    if (!player || player.points < game.stake) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient points to join this game'
      });
    }

    // Démarrer la partie avec le service
    const gameState = await GameService.startGame(parseInt(gameId), req.user.id);

    res.json({
      success: true,
      data: gameState
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join game'
    });
  }
};

// Obtenir les détails d'une partie
export const getGameDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const gameIdParam = req.params.gameId;

    if (!gameIdParam) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    const gameId = parseInt(gameIdParam);

    if (isNaN(gameId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID'
      });
    }

    const gameState = await GameService.loadGameState(gameId);

    if (!gameState) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Vérifier que l'utilisateur est un des joueurs
    const player1Id = parseInt(gameState.player1.id);
    const player2Id = gameState.player2 ? parseInt(gameState.player2.id) : null;
    
    if (player1Id !== req.user.id && (!player2Id || player2Id !== req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You are not a player in this game'
      });
    }

    res.json({
      success: true,
      data: gameState
    });
  } catch (error) {
    console.error('Get game details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game details'
    });
  }
};

// Lister les parties de l'utilisateur
export const listUserGames = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userGames = await prisma.game.findMany({
      where: {
        OR: [
          { player1Id: req.user.id },
          { player2Id: req.user.id }
        ]
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            email: true,
            points: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            email: true,
            points: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const games = userGames.map(prismaGame => 
      prismaGameToGame(prismaGame, prismaGame.player1, prismaGame.player2)
    );

    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    console.error('List user games error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list user games'
    });
  }
};

// Faire un mouvement dans une partie
export const makeMove = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const gameIdParam = req.params.gameId;
    
    if (!gameIdParam) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    const gameId = parseInt(gameIdParam);
    const { from, to, diceUsed }: MakeMoveRequest = req.body;

    // Validation
    if (typeof from !== 'number' || typeof to !== 'number' || typeof diceUsed !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid move parameters'
      });
    }

    if (diceUsed < 1 || diceUsed > 6) {
      return res.status(400).json({
        success: false,
        error: 'Dice value must be between 1 and 6'
      });
    }

    // Faire le mouvement via le service
    const updatedGameState = await GameService.makeMove(gameId, req.user.id, { from, to, diceUsed });

    res.json({
      success: true,
      data: updatedGameState
    });
  } catch (error) {
    console.error('Make move error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to make move'
    });
  }
};

// Lancer les dés
export const rollDice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const gameIdParam = req.params.gameId;
    
    if (!gameIdParam) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    const gameId = parseInt(gameIdParam);

    // Lancer les dés via le service
    const diceState = await GameService.rollDice(gameId, req.user.id);

    res.json({
      success: true,
      data: diceState
    });
  } catch (error) {
    console.error('Roll dice error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to roll dice'
    });
  }
};

// Obtenir les mouvements possibles
export const getAvailableMoves = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const gameIdParam = req.params.gameId;
    
    if (!gameIdParam) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    const gameId = parseInt(gameIdParam);

    // Obtenir les mouvements possibles via le service
    const availableMoves = await GameService.getAvailableMoves(gameId, req.user.id);

    res.json({
      success: true,
      data: availableMoves
    });
  } catch (error) {
    console.error('Get available moves error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available moves'
    });
  }
};

// Obtenir le pip count
export const getPipCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const gameIdParam = req.params.gameId;
    
    if (!gameIdParam) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    const gameId = parseInt(gameIdParam);

    // Calculer le pip count via le service
    const pipCount = await GameService.getPipCount(gameId);

    res.json({
      success: true,
      data: pipCount
    });
  } catch (error) {
    console.error('Get pip count error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pip count'
    });
  }
};
