<template>
  <div class="gammon-board-container">
    <div class="gammon-board bg-gradient-to-b from-amber-700 to-amber-900 rounded-lg shadow-2xl p-4 relative">

      <!-- Header avec scores et infos -->
      <div class="flex justify-between items-center mb-4 text-white">
        <div class="flex items-center space-x-4">
          <div class="text-sm">
            <span class="font-bold">White:</span> {{ game?.whiteScore || 0 }}
          </div>
          <div class="text-sm">
            <span class="font-bold">Black:</span> {{ game?.blackScore || 0 }}
          </div>
        </div>

        <div class="text-center">
          <div class="text-lg font-bold">{{ opponentName }}</div>
          <div class="text-xs opacity-75">Turn: {{ game?.currentPlayer || 'WHITE' }}</div>
        </div>

        <div class="flex items-center space-x-2">
          <div v-if="game?.dice?.length" class="flex space-x-1">
            <div v-for="(die, index) in game.dice" :key="index"
                 class="dice dice-roll bg-white text-black rounded-lg shadow-lg flex items-center justify-center text-xl font-bold w-10 h-10">
              {{ die }}
            </div>
          </div>
          <button v-if="canRollDice"
                  @click="rollDice"
                  class="gammon-button text-sm">
            🎲 Roll Dice
          </button>
        </div>
      </div>

      <!-- Game Controls -->
      <div class="flex justify-between items-center mb-4">
        <div class="text-white text-sm">
          <span v-if="isMyTurn" class="text-green-300 font-bold">✅ Your turn</span>
          <span v-else class="text-yellow-300">⏳ Opponent's turn</span>
        </div>

        <div class="space-x-2">
          <button @click="createNewGame"
                  class="gammon-button text-sm bg-green-600 hover:bg-green-700">
            🎮 New Game
          </button>
          <button v-if="selectedPoint"
                  @click="cancelSelection"
                  class="gammon-button text-sm bg-gray-600 hover:bg-gray-700">
            ❌ Cancel
          </button>
        </div>
      </div>

      <!-- Backgammon Board -->
      <div class="backgammon-board">
        <!-- Top Bar -->
        <div class="bar top-bar">
          <div class="bar-section">
            <div
              v-for="piece in barPieces.black"
              :key="piece.id"
              class="piece black-piece"
              :style="getPieceStackOffset(barPieces.black.indexOf(piece))"
            ></div>
          </div>
        </div>

        <!-- Top Row Points (13-24) -->
        <div class="board-row top-row">
          <div
            v-for="point in boardPoints.slice(12, 24)"
            :key="point.number"
            class="point"
            :class="{ selected: selectedPoint === point.number }"
            @click="selectPoint(point.number)"
          >
            <div
              v-for="piece in point.pieces"
              :key="piece.id"
              class="piece"
              :class="`${piece.color}-piece`"
              :style="getPieceStackOffset(point.pieces.indexOf(piece))"
            ></div>
          </div>
        </div>

        <!-- Middle Bar -->
        <div class="bar middle-bar">
          <div class="home-section white-home">
            <div
              v-for="piece in homePieces.white"
              :key="piece.id"
              class="piece white-piece"
              :style="getPieceStackOffset(homePieces.white.indexOf(piece))"
            ></div>
          </div>
          <div class="center-divider"></div>
          <div class="home-section black-home">
            <div
              v-for="piece in homePieces.black"
              :key="piece.id"
              class="piece black-piece"
              :style="getPieceStackOffset(homePieces.black.indexOf(piece))"
            ></div>
          </div>
        </div>

        <!-- Bottom Row Points (1-12) -->
        <div class="board-row bottom-row">
          <div
            v-for="point in boardPoints.slice(0, 12)"
            :key="point.number"
            class="point"
            :class="{ selected: selectedPoint === point.number }"
            @click="selectPoint(point.number)"
          >
            <div
              v-for="piece in point.pieces"
              :key="piece.id"
              class="piece"
              :class="`${piece.color}-piece`"
              :style="getPieceStackOffset(point.pieces.indexOf(piece))"
            ></div>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="bar bottom-bar">
          <div class="bar-section">
            <div
              v-for="piece in barPieces.white"
              :key="piece.id"
              class="piece white-piece"
              :style="getPieceStackOffset(barPieces.white.indexOf(piece))"
            ></div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {{ error }}
      </div>

      <!-- Loading overlay -->
      <div v-if="isLoading"
           class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
        <div class="text-white text-lg font-bold">Loading...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiService from '@/services/api.service'

// Game state interfaces
interface GameState {
  id: string
  whitePlayer: any
  blackPlayer: any
  status: string
  gameMode: string
  boardState: number[]
  currentPlayer: string
  dice: number[]
  whiteScore: number
  blackScore: number
}

interface Piece {
  id: string
  color: 'white' | 'black'
  position: number // 0-25 (0=bar, 1-24=points, 25=home)
}

// Component props
interface Props {
  gameId?: string
}

const props = withDefaults(defineProps<Props>(), {
  gameId: ''
})

// Emits
const emit = defineEmits<{
  gameCreated: [game: GameState]
  gameLoaded: [game: GameState]
}>()

// Reactive state
const game = ref<GameState | null>(null)
const pieces = ref<Piece[]>([])
const isLoading = ref(false)
const error = ref('')
const selectedPoint = ref<number | null>(null)

// Computed properties
const isMyTurn = computed(() => {
  if (!game.value) return false
  // For now, assume it's always the user's turn for AI vs Player
  return game.value.status === 'PLAYING'
})

const canRollDice = computed(() => {
  if (!game.value) return false
  return game.value.status === 'WAITING' && isMyTurn.value
})

const opponentName = computed(() => {
  if (!game.value) return 'AI'
  return game.value.gameMode === 'AI_VS_PLAYER' ? 'AI' : 'Opponent'
})

// Board layout constants
const BOARD_POINTS = 24
const BAR_POSITION = 0
const WHITE_HOME = 25
const BLACK_HOME = 26

// Computed properties for board layout
const boardPoints = computed(() => {
  const points = []
  for (let i = 1; i <= BOARD_POINTS; i++) {
    points.push({
      number: i,
      pieces: pieces.value.filter(p => p.position === i)
    })
  }
  return points
})

const barPieces = computed(() => ({
  white: pieces.value.filter(p => p.position === BAR_POSITION && p.color === 'white'),
  black: pieces.value.filter(p => p.position === BAR_POSITION && p.color === 'black')
}))

const homePieces = computed(() => ({
  white: pieces.value.filter(p => p.position === WHITE_HOME && p.color === 'white'),
  black: pieces.value.filter(p => p.position === BLACK_HOME && p.color === 'black')
}))

// Methods
const loadGame = async () => {
  if (!props.gameId) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await apiService.getGameStatus(props.gameId)

    if (response.success) {
      game.value = response.data.game
      initializePiecesFromBoardState(response.data.game.boardState)
      emit('gameLoaded', response.data.game)
    } else {
      error.value = response.error || 'Failed to load game'
    }
  } catch (err: any) {
    error.value = 'Failed to load game: ' + err.message
  } finally {
    isLoading.value = false
  }
}

const initializePiecesFromBoardState = (boardState: number[]) => {
  // Convert board state array to pieces
  // Board state format: [point1_white, point1_black, point2_white, point2_black, ...]
  const newPieces: Piece[] = []

  for (let i = 0; i < boardState.length; i += 2) {
    const pointIndex = Math.floor(i / 2) + 1
    const whiteCount = boardState[i] || 0
    const blackCount = boardState[i + 1] || 0

    // Add white pieces
    for (let j = 0; j < whiteCount; j++) {
      newPieces.push({
        id: `white-${pointIndex}-${j}`,
        color: 'white',
        position: pointIndex
      })
    }

    // Add black pieces
    for (let j = 0; j < blackCount; j++) {
      newPieces.push({
        id: `black-${pointIndex}-${j}`,
        color: 'black',
        position: pointIndex
      })
    }
  }

  pieces.value = newPieces
}

const createNewGame = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await apiService.createGame({
      gameMode: 'AI_VS_PLAYER',
      difficulty: 'MEDIUM'
    })

    if (response.success) {
      game.value = response.data.game
      initializePiecesFromBoardState(response.data.game.boardState)
      emit('gameCreated', response.data.game)
    } else {
      error.value = response.error || 'Failed to create game'
    }
  } catch (err: any) {
    error.value = 'Failed to create game: ' + err.message
  } finally {
    isLoading.value = false
  }
}

const rollDice = async () => {
  if (!game.value?.id) return

  try {
    const response = await apiService.rollDice(game.value.id)

    if (response.success) {
      game.value.dice = response.data.dice
    } else {
      error.value = response.error || 'Failed to roll dice'
    }
  } catch (err: any) {
    error.value = 'Failed to roll dice: ' + err.message
  }
}

const selectPoint = (pointNumber: number) => {
  selectedPoint.value = selectedPoint.value === pointNumber ? null : pointNumber
}

const cancelSelection = () => {
  selectedPoint.value = null
}

const getPieceStackOffset = (pieceIndex: number) => {
  // Offset pieces in stack for visual effect
  return {
    transform: `translateY(${pieceIndex * -3}px)`
  }
}

const initializeStandardGame = () => {
  // Standard backgammon starting position
  const standardBoardState = [
    // Points 1-6 (white pieces)
    2, 0,  // Point 1: 2 white
    0, 0,  // Point 2: empty
    0, 0,  // Point 3: empty
    0, 0,  // Point 4: empty
    0, 0,  // Point 5: empty
    0, 5,  // Point 6: 5 black

    // Points 7-12
    0, 0,  // Point 7: empty
    0, 3,  // Point 8: 3 black
    0, 0,  // Point 9: empty
    0, 0,  // Point 10: empty
    0, 0,  // Point 11: empty
    5, 0,  // Point 12: 5 white

    // Points 13-18
    0, 5,  // Point 13: 5 black
    0, 0,  // Point 14: empty
    0, 0,  // Point 15: empty
    0, 0,  // Point 16: empty
    3, 0,  // Point 17: 3 white
    0, 0,  // Point 18: empty

    // Points 19-24
    0, 0,  // Point 19: empty
    0, 0,  // Point 20: empty
    0, 0,  // Point 21: empty
    0, 0,  // Point 22: empty
    0, 0,  // Point 23: empty
    0, 2   // Point 24: 2 black
  ]

  initializePiecesFromBoardState(standardBoardState)
}
</script>

<style scoped>
.gammon-board-container {
  max-width: 1000px;
  margin: 0 auto;
}

.gammon-board {
  transform-style: preserve-3d;
  perspective: 1000px;
}

.gammon-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gammon-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.gammon-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Backgammon Board Layout */
.backgammon-board {
  width: 600px;
  height: 400px;
  background: #d4a574;
  border: 3px solid #8b4513;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  margin: 0 auto;
}

/* Board sections */
.bar {
  position: absolute;
  width: 100%;
  height: 30px;
  background: #654321;
  border: 2px solid #8b4513;
}

.top-bar {
  top: 0;
}

.middle-bar {
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  height: 60px;
}

.bottom-bar {
  bottom: 0;
}

.bar-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.center-divider {
  width: 2px;
  background: #8b4513;
  height: 80%;
}

.board-row {
  position: absolute;
  display: flex;
  height: 135px;
}

.top-row {
  top: 30px;
}

.bottom-row {
  bottom: 30px;
}

.point {
  width: 25px;
  height: 135px;
  background: #deb887;
  border: 1px solid #8b4513;
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 5px;
}

.point:hover {
  background: #f4e4bc;
}

.point.selected {
  background: #ffd700;
  box-shadow: inset 0 0 4px rgba(255, 215, 0, 0.5);
}

.point:nth-child(7),
.point:nth-child(19) {
  margin-left: 50px;
}

/* Game Pieces */
.piece {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #333;
  position: relative;
  cursor: grab;
  transition: transform 0.2s ease;
  margin-bottom: 2px;
}

.piece:hover {
  transform: scale(1.1);
}

.white-piece {
  background: radial-gradient(circle at 30% 30%, #fff, #f0f0f0);
}

.black-piece {
  background: radial-gradient(circle at 30% 30%, #333, #000);
}

.piece:active {
  cursor: grabbing;
}

/* Dice animations */
.dice-roll {
  animation: diceRoll 1s ease-in-out;
}

@keyframes diceRoll {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.2); }
  50% { transform: rotate(180deg) scale(1); }
  75% { transform: rotate(270deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Responsive design */
@media (max-width: 768px) {
  .gammon-board-container {
    padding: 1rem;
  }

  .backgammon-board {
    width: 100%;
    max-width: 400px;
    height: 300px;
  }

  .board-row {
    height: 100px;
  }

  .point {
    width: 18px;
    height: 100px;
  }

  .piece {
    width: 16px;
    height: 16px;
  }
}
</style>
