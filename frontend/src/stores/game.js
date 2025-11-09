import { defineStore } from 'pinia'
import { gameService } from '@/services/api'

export const useGameStore = defineStore('game', {
  state: () => ({
    currentGame: null,
    boardState: null,
    currentPlayer: 'white',
    dice: [],
    selectedChecker: null,
    validMoves: [],
    gameHistory: [],
    isLoading: false,
    error: null,
    isMyTurn: false,
    playerColor: 'white'
  }),

  getters: {
    isGameActive: (state) => state.currentGame?.status === 'PLAYING',
    canRollDice: (state) => state.isMyTurn && state.dice.length === 0,
    canMakeMove: (state) => state.isMyTurn && state.dice.length > 0,
    whiteScore: (state) => state.currentGame?.whiteScore || 0,
    blackScore: (state) => state.currentGame?.blackScore || 0,
    opponentName: (state) => {
      if (!state.currentGame) return null
      return state.currentGame.blackPlayer?.username || 'AI Opponent'
    }
  },

  actions: {
    async createGame(gameMode, opponentId = null, difficulty = 'MEDIUM') {
      this.isLoading = true
      this.error = null
      
      try {
        const result = await gameService.createGame(gameMode, opponentId, difficulty)
        this.currentGame = result.data.game
        this.boardState = result.data.game.boardState
        this.currentPlayer = result.data.game.currentPlayer
        this.playerColor = 'white' // Le créateur joue toujours en blanc
        this.isMyTurn = this.currentPlayer === this.playerColor
        this.isLoading = false
        return { success: true, game: this.currentGame }
      } catch (error) {
        this.error = error.message
        this.isLoading = false
        return { success: false, error: error.message }
      }
    },

    async getGameStatus(gameId) {
      this.isLoading = true
      this.error = null
      
      try {
        const result = await gameService.getGameStatus(gameId)
        this.currentGame = result.data.game
        this.boardState = result.data.game.boardState
        this.currentPlayer = result.data.game.currentPlayer
        this.isMyTurn = result.data.gameStatus.isMyTurn
        this.gameHistory = result.data.moves || []
        this.isLoading = false
        return { success: true, game: this.currentGame }
      } catch (error) {
        this.error = error.message
        this.isLoading = false
        return { success: false, error: error.message }
      }
    },

    rollDice() {
      if (!this.canRollDice) return false
      
      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      
      this.dice = die1 === die2 ? [die1, die1, die2, die2] : [die1, die2]
      this.calculateValidMoves()
      return true
    },

    calculateValidMoves() {
      // Logique simplifiée pour calculer les mouvements valides
      this.validMoves = []
      
      if (!this.boardState || this.dice.length === 0) return
      
      // TODO: Implémenter la logique complète des mouvements valides
      // Pour l'instant, mouvements simulés
      this.validMoves = [
        { from: 1, to: 3, die: this.dice[0] },
        { from: 12, to: 15, die: this.dice[1] }
      ]
    },

    selectChecker(position) {
      if (!this.canMakeMove) return
      
      this.selectedChecker = this.selectedChecker === position ? null : position
    },

    async makeMove(from, to) {
      if (!this.canMakeMove) return false
      
      this.isLoading = true
      this.error = null
      
      try {
        const move = { from, to, die: this.dice[0] }
        const result = await gameService.makeMove(this.currentGame.id, move)
        
        // Mettre à jour l'état local
        this.boardState = result.data.game.boardState
        this.currentPlayer = result.data.game.currentPlayer
        this.dice = this.dice.slice(1) // Retirer le dé utilisé
        this.selectedChecker = null
        this.isMyTurn = this.currentPlayer === this.playerColor
        
        this.isLoading = false
        return { success: true }
      } catch (error) {
        this.error = error.message
        this.isLoading = false
        return { success: false, error: error.message }
      }
    },

    resetGame() {
      this.currentGame = null
      this.boardState = null
      this.currentPlayer = 'white'
      this.dice = []
      this.selectedChecker = null
      this.validMoves = []
      this.gameHistory = []
      this.isMyTurn = false
      this.playerColor = 'white'
      this.error = null
    },

    clearError() {
      this.error = null
    }
  }
})
