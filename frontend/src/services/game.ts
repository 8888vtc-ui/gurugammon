import { apiClient } from '../config/api.config.js'

export interface GameOptions {
  mode: 'AI_VS_PLAYER' | 'PLAYER_VS_PLAYER' | 'TOURNAMENT'
  opponentId?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  timeControl?: 'BLITZ' | 'NORMAL' | 'LONG'
}

export interface Game {
  id: string
  whitePlayer: {
    id: string
    username: string
    elo: number
  }
  blackPlayer: {
    id: string
    username: string
    elo: number
  }
  boardState: string
  currentPlayer: 'white' | 'black'
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'ABORTED'
  gameMode: string
  createdAt: string
  whiteScore: number
  blackScore: number
  winner?: 'white' | 'black' | 'draw'
}

export interface Move {
  from: number
  to: number
  die: number
  type: 'move' | 'hit' | 'bear_off'
}

export interface Analysis {
  equity: number
  winProbability: {
    white: number
    black: number
  }
  bestMove: string
  explanation: string
  alternatives: Array<{
    move: string
    equity: number
  }>
  pr: number // Performance Rating
}

export const gameService = {
  // Créer une nouvelle partie
  async createGame(options: GameOptions): Promise<{ success: boolean; data?: { game: Game }; error?: string }> {
    try {
      const data = await apiClient.createGame(options.mode, options.difficulty || 'MEDIUM')
      
      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la partie'
      }
    }
  },

  // Obtenir le statut d'une partie
  async getGameStatus(gameId: string): Promise<{ success: boolean; data?: { game: Game; moves: Move[] }; error?: string }> {
    try {
      const data = await apiClient.getGameStatus(gameId)
      
      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors du chargement de la partie'
      }
    }
  },

  // Lancer les dés
  async rollDice(gameId: string): Promise<{ success: boolean; data?: { dice: number[] }; error?: string }> {
    try {
      const data = await apiClient.rollDice(gameId)
      
      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors du lancer de dés'
      }
    }
  },

  // Effectuer un mouvement
  async makeMove(gameId: string, move: Move): Promise<{ success: boolean; data?: { game: Game }; error?: string }> {
    try {
      const data = await apiClient.makeMove(gameId, move.from, move.to)
      
      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors du mouvement'
      }
    }
  },

  // Obtenir les suggestions de l'IA
  async getSuggestions(gameId: string): Promise<{ success: boolean; data?: { suggestions: Move[] }; error?: string }> {
    // TODO: Implement when backend supports this endpoint
    return {
      success: false,
      error: 'Suggestions not implemented yet'
    }
  },

  // Analyser une position avec GNUBG
  async analyzePosition(boardState: string, dice: number[], player: 'white' | 'black', analysisType: 'QUICK' | 'FULL' = 'FULL'): Promise<{ success: boolean; data?: Analysis; error?: string }> {
    // TODO: Implement when backend GNUBG analysis is ready
    return {
      success: false,
      error: 'GNUBG analysis not implemented yet'
    }
  },

  // Obtenir une suggestion rapide
  async getHint(boardState: string, dice: number[], player: 'white' | 'black'): Promise<{ success: boolean; data?: { hint: string; explanation: string }; error?: string }> {
    // TODO: Implement when backend hint system is ready
    return {
      success: false,
      error: 'Hint system not implemented yet'
    }
  }
}
