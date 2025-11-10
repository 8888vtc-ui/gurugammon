// src/controllers/gameController.ts
import { Request, Response } from 'express';
import { PrismaClient, GameMode, GameStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Create a new game
export const createGameController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { gameMode, difficulty }: { gameMode?: GameMode; difficulty?: string } = req.body;

    // Create game with user as white player (for AI vs Player mode)
    const game = await prisma.games.create({
      data: {
        id: uuidv4(),
        white_player_id: req.user.id,
        gameMode: gameMode || GameMode.AI_VS_PLAYER,
        status: GameStatus.WAITING,
        board_state: "4HPwATDgc/ABMA", // Standard backgammon starting position
        current_player: "WHITE"
      }
    });

    // Get user data separately
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        elo: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        game: {
          id: game.id,
          whitePlayer: user,
          status: game.status,
          gameMode: game.gameMode,
          boardState: game.board_state,
          currentPlayer: game.current_player,
          createdAt: game.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create game'
    });
  }
};

// Get game status
export const getGameStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    const game = await prisma.games.findUnique({
      where: { id: gameId },
      include: {
        game_moves: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Get player data separately
    const [whitePlayer, blackPlayer] = await Promise.all([
      game.white_player_id ? prisma.users.findUnique({
        where: { id: game.white_player_id },
        select: { id: true, username: true, elo: true }
      }) : null,
      game.black_player_id ? prisma.users.findUnique({
        where: { id: game.black_player_id },
        select: { id: true, username: true, elo: true }
      }) : null
    ]);

    res.json({
      success: true,
      data: {
        game: {
          id: game.id,
          whitePlayer: whitePlayer,
          blackPlayer: blackPlayer,
          status: game.status,
          gameMode: game.gameMode,
          boardState: game.board_state,
          currentPlayer: game.current_player,
          dice: game.dice,
          whiteScore: game.white_score,
          blackScore: game.black_score,
          winner: game.winner,
          createdAt: game.createdAt
        },
        moves: game.game_moves
      }
    });
  } catch (error) {
    console.error('Get game status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game status'
    });
  }
};

// Roll dice
export const rollDice = async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Generate random dice rolls
    const dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];

    // Update game with dice roll
    const game = await prisma.games.update({
      where: { id: gameId },
      data: {
        dice: dice,
        status: GameStatus.PLAYING
      }
    });

    res.json({
      success: true,
      data: {
        dice: dice
      }
    });
  } catch (error) {
    console.error('Roll dice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to roll dice'
    });
  }
};

// Make a move
export const makeMove = async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const { from, to }: { from: number; to: number } = req.body;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get current game state to get dice
    const game = await prisma.games.findUnique({
      where: { id: gameId },
      select: { dice: true, current_player: true }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Record the move
    await prisma.game_moves.create({
      data: {
        id: uuidv4(),
        game_id: gameId,
        user_id: req.user.id,
        player: game.current_player,
        dice: game.dice || [],
        move: `move ${from} to ${to}`,
        from_point: from,
        to_point: to
      }
    });

    // For now, just acknowledge the move
    // In a real implementation, this would validate the move and update board state
    res.json({
      success: true,
      data: {
        message: 'Move recorded',
        from: from,
        to: to
      }
    });
  } catch (error) {
    console.error('Make move error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make move'
    });
  }
};

// Placeholder functions for routes that exist but aren't fully implemented yet
export const listAvailableGames = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      games: [],
      message: 'Available games feature coming soon'
    }
  });
};

export const joinGame = async (req: AuthRequest, res: Response) => {
  res.json({
    success: false,
    error: 'Join game feature coming soon'
  });
};

export const getGameDetails = async (req: AuthRequest, res: Response) => {
  res.json({
    success: false,
    error: 'Game details feature coming soon'
  });
};

export const listUserGames = async (req: AuthRequest, res: Response) => {
  res.json({
    success: false,
    error: 'User games feature coming soon'
  });
};

export const getAvailableMoves = async (req: AuthRequest, res: Response) => {
  res.json({
    success: false,
    error: 'Available moves feature coming soon'
  });
};

export const getPipCount = async (req: AuthRequest, res: Response) => {
  res.json({
    success: false,
    error: 'Pip count feature coming soon'
  });
};
