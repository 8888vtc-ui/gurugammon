// src/services/gameService.ts
// @ts-nocheck - Désactiver les vérifications strictes pour le service de jeu
import { PrismaClient } from '@prisma/client';
import { BackgammonEngine } from './gameEngine';
import { convertPrismaPlayer } from '../utils/playerUtils';
import { 
  GameState, 
  BoardState, 
  DiceState, 
  Move, 
  PlayerColor,
  MakeMoveRequest
} from '../types/game';

const prisma = new PrismaClient();

export class GameService {
  
  // Créer un nouvel état de jeu
  static async createGameState(player1Id: number, gameType: string, stake: number): Promise<GameState> {
    const player1 = await prisma.player.findUnique({
      where: { id: player1Id },
      select: { id: true, name: true, email: true, points: true }
    });

    if (!player1) {
      throw new Error('Player not found');
    }

    // Créer la partie en base
    const prismaGame = await prisma.game.create({
      data: {
        player1Id,
        gameType,
        stake,
        status: 'waiting'
      }
    });

    // Créer l'état de jeu initial
    const initialBoard = BackgammonEngine.createInitialBoard();
    const initialDice = BackgammonEngine.rollDice();

    // Créer un objet Player complet
    const fullPlayer1 = convertPrismaPlayer(player1);

    return {
      id: prismaGame.id.toString(),
      player1: fullPlayer1,
      player2: null,
      status: 'waiting',
      gameType: gameType as any,
      stake,
      winner: null,
      board: initialBoard,
      currentPlayer: 'white',
      dice: initialDice,
      availableMoves: BackgammonEngine.calculateAvailableMoves('white', initialBoard, initialDice),
      createdAt: prismaGame.createdAt,
      startedAt: null,
      finishedAt: null
    };
  }

  // Démarrer une partie (quand le deuxième joueur rejoint)
  static async startGame(gameId: number, player2Id: number): Promise<GameState> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        player1: { select: { id: true, name: true, email: true, points: true } },
        player2: { select: { id: true, name: true, email: true, points: true } }
      }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'waiting') {
      throw new Error('Game is not in waiting status');
    }

    const player2 = await prisma.player.findUnique({
      where: { id: player2Id },
      select: { id: true, name: true, email: true, points: true }
    });

    if (!player2) {
      throw new Error('Player2 not found');
    }

    // Mettre à jour la partie en base
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        player2Id,
        status: 'playing',
        startedAt: new Date()
      },
      include: {
        player1: { select: { id: true, name: true, email: true, points: true } },
        player2: { select: { id: true, name: true, email: true, points: true } }
      }
    });

    // Créer le premier état de jeu
    const initialBoard = BackgammonEngine.createInitialBoard();
    const initialDice = BackgammonEngine.rollDice();
    
    // Calculer les mouvements possibles avec les mêmes dés
    const availableMoves = BackgammonEngine.calculateAvailableMoves('white', initialBoard, initialDice);

    return {
      id: updatedGame.id.toString(),
      player1: updatedGame.player1,
      player2: updatedGame.player2,
      status: 'playing',
      gameType: updatedGame.gameType as any,
      stake: updatedGame.stake,
      winner: null,
      board: initialBoard,
      currentPlayer: 'white',
      dice: initialDice,
      availableMoves: availableMoves,
      createdAt: updatedGame.createdAt,
      startedAt: updatedGame.startedAt,
      finishedAt: null
    };
  }

  // Charger l'état d'une partie depuis la base
  static async loadGameState(gameId: number): Promise<GameState | null> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        player1: { select: { id: true, name: true, email: true, points: true } },
        player2: { select: { id: true, name: true, email: true, points: true } },
        winner: { select: { id: true, name: true, email: true, points: true } }
      }
    });

    if (!game) {
      return null;
    }

    // TODO: Charger l'état du board et des dés depuis la base
    // Pour l'instant, on retourne un état de base cohérent
    const board = BackgammonEngine.createInitialBoard();
    const dice = BackgammonEngine.rollDice();
    const availableMoves = BackgammonEngine.calculateAvailableMoves('white', board, dice);

    return {
      id: game.id.toString(),
      player1: game.player1,
      player2: game.player2,
      status: game.status as any,
      gameType: game.gameType as any,
      stake: game.stake,
      winner: game.winner,
      board,
      currentPlayer: 'white',
      dice,
      availableMoves,
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt
    };
  }

  // Faire un mouvement
  static async makeMove(gameId: number, playerId: number, moveRequest: MakeMoveRequest): Promise<GameState> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        player1: { select: { id: true, name: true, email: true, points: true } },
        player2: { select: { id: true, name: true, email: true, points: true } },
        winner: { select: { id: true, name: true, email: true, points: true } }
      }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'playing') {
      throw new Error('Game is not in playing status');
    }

    // Déterminer la couleur du joueur
    const playerColor = game.player1Id === playerId ? 'white' : 'black';
    const currentPlayer = game.player1Id === playerId ? game.player1 : game.player2;

    if (!currentPlayer) {
      throw new Error('Player not in game');
    }

    // Charger l'état actuel (TODO: depuis la base)
    const currentState = await this.loadGameState(gameId);
    if (!currentState) {
      throw new Error('Game state not found');
    }

    // Vérifier que c'est le tour du joueur
    if (currentState.currentPlayer !== playerColor) {
      throw new Error('Not your turn');
    }

    // Créer l'objet mouvement
    const move: Move = {
      from: moveRequest.from,
      to: moveRequest.to,
      player: playerColor,
      diceUsed: moveRequest.diceUsed
    };

    // Valider le mouvement
    const validation = BackgammonEngine.validateMove(move, currentState.board, currentState.dice);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid move');
    }

    // Appliquer le mouvement
    const newBoard = BackgammonEngine.applyMove(move, currentState.board);
    const newDice = BackgammonEngine.useDie(move.diceUsed, currentState.dice);

    // Changer de joueur si tous les dés sont utilisés
    let nextPlayer: PlayerColor = currentState.currentPlayer;
    let nextDice = newDice;
    
    if (newDice.remaining.length === 0) {
      nextPlayer = nextPlayer === 'white' ? 'black' : 'white';
      nextDice = BackgammonEngine.rollDice();
    }

    // Calculer les mouvements disponibles pour le prochain joueur
    const availableMoves = BackgammonEngine.calculateAvailableMoves(nextPlayer, newBoard, nextDice);

    // Vérifier la condition de victoire
    const winner = BackgammonEngine.checkWinCondition(newBoard);
    
    if (winner) {
      // Terminer la partie
      const winnerPlayer = winner === 'white' ? game.player1 : game.player2;
      const loserPlayer = winner === 'white' ? game.player2 : game.player1;

      // Mettre à jour les points
      if (winnerPlayer && loserPlayer) {
        await prisma.player.update({
          where: { id: winnerPlayer.id },
          data: { points: { increment: game.stake } }
        });

        await prisma.player.update({
          where: { id: loserPlayer.id },
          data: { points: { decrement: game.stake } }
        });
      }

      // Marquer la partie comme terminée
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'finished',
          winnerId: winnerPlayer?.id,
          finishedAt: new Date()
        }
      });

      return {
        ...currentState,
        board: newBoard,
        currentPlayer: nextPlayer,
        dice: nextDice,
        availableMoves: [],
        status: 'finished',
        winner: winnerPlayer,
        finishedAt: new Date()
      };
    }

    // TODO: Sauvegarder le nouvel état en base
    // Pour l'instant, on retourne l'état mis à jour

    return {
      ...currentState,
      board: newBoard,
      currentPlayer: nextPlayer,
      dice: nextDice,
      availableMoves
    };
  }

  // Lancer les dés
  static async rollDice(gameId: number, playerId: number): Promise<DiceState> {
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'playing') {
      throw new Error('Game is not in playing status');
    }

    // TODO: Vérifier que c'est le tour du joueur et qu'il peut lancer les dés

    const newDice = BackgammonEngine.rollDice();
    
    // TODO: Sauvegarder les dés en base

    return newDice;
  }

  // Obtenir les mouvements possibles
  static async getAvailableMoves(gameId: number, playerId: number): Promise<Move[]> {
    const gameState = await this.loadGameState(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const playerColor = gameState.player1.id === playerId ? 'white' : 'black';
    
    if (gameState.currentPlayer !== playerColor) {
      return []; // Pas de mouvements si ce n'est pas le tour du joueur
    }

    return BackgammonEngine.calculateAvailableMoves(playerColor, gameState.board, gameState.dice);
  }

  // Calculer le pip count
  static async getPipCount(gameId: number): Promise<{ white: number; black: number }> {
    const gameState = await this.loadGameState(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    return BackgammonEngine.calculatePipCount(gameState.board);
  }
}
