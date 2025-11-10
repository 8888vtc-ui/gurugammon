// src/controllers/gameController.ts
import { Request, Response } from 'express';
import { PrismaClient, GameMode, GameStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../server';
import { BackgammonEngine, GameState, Move } from '../utils/backgammonEngine';

// Create a new game
export const createGameController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { gameMode = 'AI_VS_PLAYER', difficulty = 'MEDIUM' } = req.body;

    // Create initial game state
    const initialBoardState = BackgammonEngine.getInitialBoardState();

    const game = await prisma.games.create({
      data: {
        id: uuidv4(),
        white_player_id: req.user.id,
        game_mode: gameMode as GameMode,
        status: 'WAITING' as GameStatus,
        board_state: initialBoardState,
        current_player: 'WHITE',
        dice: [],
        white_score: 0,
        black_score: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        game: {
          id: game.id,
          whitePlayer: { id: req.user.id, username: req.user.username },
          blackPlayer: gameMode === 'PLAYER_VS_PLAYER' ? null : { id: 'ai', username: 'AI' },
          status: game.status,
          gameMode: game.game_mode,
          boardState: game.board_state,
          currentPlayer: game.current_player,
          dice: game.dice,
          whiteScore: game.white_score,
          blackScore: game.black_score,
          createdAt: game.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create game'
    });
  }
};

// Get game details
export const getGameDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { gameId } = req.params;

    const game = await prisma.games.findFirst({
      where: {
        id: gameId,
        OR: [
          { white_player_id: req.user.id },
          { black_player_id: req.user.id }
        ]
      }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Convert database game to GameState interface
    const gameState: GameState = {
      id: game.id,
      whitePlayer: game.white_player_id ? { id: game.white_player_id } : null,
      blackPlayer: game.black_player_id ? { id: game.black_player_id } : null,
      boardState: game.board_state as number[],
      currentPlayer: game.current_player as 'WHITE' | 'BLACK',
      dice: game.dice as number[],
      usedDice: [], // Not stored in DB, reset each turn
      whiteScore: game.white_score,
      blackScore: game.black_score,
      status: game.status as 'WAITING' | 'PLAYING' | 'COMPLETED',
      gameMode: game.game_mode,
      winner: game.winner as 'WHITE' | 'BLACK' | undefined,
      createdAt: game.created_at,
      updatedAt: game.updated_at
    };

    res.json({
      success: true,
      data: {
        game: gameState,
        moves: [] // TODO: Implement move history
      }
    });
  } catch (error) {
    console.error('Error getting game details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get game details'
    });
  }
};
export const rollDice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { gameId } = req.params;

    const game = await prisma.games.findFirst({
      where: {
        id: gameId,
        OR: [
          { white_player_id: req.user.id },
          { black_player_id: req.user.id }
        ]
      }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Check if it's the player's turn and no dice are rolled yet
    if (game.status !== 'PLAYING' || game.dice.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot roll dice at this time'
      });
    }

    // Generate new dice
    const newDice = BackgammonEngine.rollDice();

    // Update game with new dice
    await prisma.games.update({
      where: { id: gameId },
      data: {
        dice: newDice,
        status: 'PLAYING',
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        dice: newDice
      }
    });
  } catch (error) {
    console.error('Error rolling dice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to roll dice'
    });
  }
};

// Make a move
export const makeMove = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { gameId } = req.params;
    const { from, to } = req.body;

    if (typeof from !== 'number' || typeof to !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid move data'
      });
    }

    const game = await prisma.games.findFirst({
      where: {
        id: gameId,
        OR: [
          { white_player_id: req.user.id },
          { black_player_id: req.user.id }
        ]
      }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Convert database game to GameState
    const gameState: GameState = {
      id: game.id,
      whitePlayer: game.white_player_id ? { id: game.white_player_id } : null,
      blackPlayer: game.black_player_id ? { id: game.black_player_id } : null,
      boardState: game.board_state as number[],
      currentPlayer: game.current_player as 'WHITE' | 'BLACK',
      dice: game.dice as number[],
      usedDice: [], // Reset for validation
      whiteScore: game.white_score,
      blackScore: game.black_score,
      status: game.status as 'WAITING' | 'PLAYING' | 'COMPLETED',
      gameMode: game.game_mode,
      winner: game.winner as 'WHITE' | 'BLACK' | undefined,
      createdAt: game.created_at,
      updatedAt: game.updated_at
    };

    // Determine player color based on user ID
    let playerColor: 'WHITE' | 'BLACK';
    if (game.white_player_id === req.user.id) {
      playerColor = 'WHITE';
    } else if (game.black_player_id === req.user.id) {
      playerColor = 'BLACK';
    } else {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to make moves in this game'
      });
    }

    // Create move object
    const move: Move = {
      from,
      to,
      player: playerColor
    };

    // Validate move
    const validation = BackgammonEngine.validateMove(gameState, move);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.message
      });
    }

    // Execute move
    const newGameState = BackgammonEngine.executeMove(gameState, move);

    // Update database
    await prisma.games.update({
      where: { id: gameId },
      data: {
        board_state: newGameState.boardState,
        current_player: newGameState.currentPlayer,
        dice: newGameState.dice,
        white_score: newGameState.whiteScore,
        black_score: newGameState.blackScore,
        status: newGameState.status as GameStatus,
        winner: newGameState.winner,
        updated_at: new Date()
      }
    });

    // TODO: Record move in game_moves table

    res.json({
      success: true,
      data: {
        message: 'Move recorded',
        from,
        to,
        gameState: newGameState
      }
    });
  } catch (error) {
    console.error('Error making move:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make move'
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
          gameMode: game.game_mode,
          boardState: game.board_state,
          currentPlayer: game.current_player,
          dice: game.dice,
          whiteScore: game.white_score,
          blackScore: game.black_score,
          winner: game.winner,
          createdAt: game.created_at
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

// Placeholder functions (to be implemented)
export const listAvailableGames = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Available games listing - Coming soon',
      games: []
    }
  });
};

export const joinGame = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Game joining - Coming soon'
    }
  });
};

export const listUserGames = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const games = await prisma.games.findMany({
      where: {
        OR: [
          { white_player_id: req.user.id },
          { black_player_id: req.user.id }
        ]
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        games: games.map(game => ({
          id: game.id,
          status: game.status,
          gameMode: game.game_mode,
          currentPlayer: game.current_player,
          whiteScore: game.white_score,
          blackScore: game.black_score,
          winner: game.winner,
          createdAt: game.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Error listing user games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list games'
    });
  }
};

export const getAvailableMoves = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Available moves calculation - Coming soon',
      moves: []
    }
  });
};

export const getPipCount = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Pip count calculation - Coming soon',
      pipCount: { white: 0, black: 0 }
    }
  });
};
