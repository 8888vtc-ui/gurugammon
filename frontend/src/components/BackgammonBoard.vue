<template>
  <div class="gammon-board-container">
    <div class="gammon-board bg-gradient-to-b from-amber-700 to-amber-900 rounded-lg shadow-2xl p-4 relative">
      
      <!-- Header avec scores et infos -->
      <div class="flex justify-between items-center mb-4 text-white">
        <div class="flex items-center space-x-4">
          <div class="text-sm">
            <span class="font-bold">Blanc:</span> {{ whiteScore }}
          </div>
          <div class="text-sm">
            <span class="font-bold">Noir:</span> {{ blackScore }}
          </div>
        </div>
        
        <div class="text-center">
          <div class="text-lg font-bold">{{ opponentName }}</div>
          <div class="text-xs opacity-75">Tour: {{ currentPlayer === 'white' ? 'Blanc' : 'Noir' }}</div>
        </div>
        
        <div class="flex items-center space-x-2">
          <div v-if="dice.length > 0" class="flex space-x-1">
            <div v-for="(die, index) in dice" :key="index" 
                 class="dice dice-roll bg-white text-black rounded-lg shadow-lg flex items-center justify-center text-xl font-bold w-10 h-10">
              {{ die }}
            </div>
          </div>
          <button v-if="canRollDice" 
                  @click="rollDice" 
                  class="gammon-button text-sm">
            🎲 Lancer
          </button>
        </div>
      </div>

      <!-- Plateau principal -->
      <div class="relative bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg p-2" 
           style="height: 400px;">
        
        <!-- Barre centrale (bar) -->
        <div class="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-8 bg-amber-900 rounded"></div>
        
        <!-- Points du plateau (24 points) -->
        <div class="grid grid-cols-12 gap-1 h-full">
          <!-- Moitié supérieure (points 13-24) -->
          <template v-for="point in 24" :key="point">
            <div class="board-point relative cursor-pointer"
                 :class="getPointClass(point)"
                 @click="selectPoint(point)">
              
              <!-- Triangle du point -->
              <div class="absolute inset-0" 
                   :class="getTriangleClass(point)">
              </div>
              
              <!-- Checkers sur le point -->
              <div class="absolute inset-0 flex flex-col items-center justify-start pt-1">
                <div v-for="(checker, index) in getCheckersOnPoint(point)" 
                     :key="index"
                     class="checker-drop"
                     :class="[
                       'w-6 h-6 rounded-full border-2 shadow-md',
                       checker.color === 'white' ? 'checker-white' : 'checker-black',
                       selectedChecker === point ? 'ring-2 ring-yellow-400' : ''
                     ]">
                </div>
                
                <!-- Indicateur si plus de 5 checkers -->
                <div v-if="getCheckerCount(point) > 5" 
                     class="text-xs text-white font-bold bg-red-600 rounded-full w-4 h-4 flex items-center justify-center">
                  {{ getCheckerCount(point) }}
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <!-- Home zones -->
        <div class="absolute right-0 top-0 bottom-0 w-16 bg-amber-900 rounded-r-lg flex flex-col items-center justify-center space-y-2">
          <div class="text-white text-xs font-bold">Home</div>
          <div class="space-y-1">
            <div v-for="n in 5" :key="'white-home-' + n" 
                 class="w-6 h-6 checker-white rounded-full border-2 border-gray-300"></div>
          </div>
          <div class="space-y-1">
            <div v-for="n in 3" :key="'black-home-' + n" 
                 class="w-6 h-6 checker-black rounded-full border-2 border-gray-300"></div>
          </div>
        </div>
      </div>

      <!-- Actions du jeu -->
      <div class="mt-4 flex justify-between items-center">
        <div class="text-white text-sm">
          <span v-if="isMyTurn" class="text-green-300 font-bold">✅ Votre tour</span>
          <span v-else class="text-yellow-300">⏳ Tour de l'adversaire</span>
        </div>
        
        <div class="space-x-2">
          <button @click="resetGame" 
                  class="gammon-button text-sm bg-red-600 hover:bg-red-700">
            🔄 Nouvelle partie
          </button>
          <button v-if="selectedChecker" 
                  @click="cancelSelection" 
                  class="gammon-button text-sm bg-gray-600 hover:bg-gray-700">
            ❌ Annuler
          </button>
        </div>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {{ error }}
      </div>

      <!-- Loading overlay -->
      <div v-if="isLoading" 
           class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
        <div class="text-white text-lg font-bold">Chargement...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

// Props et emits
const props = defineProps({
  gameId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['moveMade', 'gameCreated'])

// Computed properties
const currentGame = computed(() => gameStore.currentGame)
const boardState = computed(() => gameStore.boardState)
const currentPlayer = computed(() => gameStore.currentPlayer)
const dice = computed(() => gameStore.dice)
const selectedChecker = computed(() => gameStore.selectedChecker)
const isMyTurn = computed(() => gameStore.isMyTurn)
const canRollDice = computed(() => gameStore.canRollDice)
const canMakeMove = computed(() => gameStore.canMakeMove)
const isLoading = computed(() => gameStore.isLoading)
const error = computed(() => gameStore.error)
const whiteScore = computed(() => gameStore.whiteScore)
const blackScore = computed(() => gameStore.blackScore)
const opponentName = computed(() => gameStore.opponentName)

// État local du plateau (simulation)
const boardPoints = ref([])

// Initialiser le plateau
onMounted(() => {
  initializeBoard()
  if (props.gameId) {
    gameStore.getGameStatus(props.gameId)
  }
})

function initializeBoard() {
  // Configuration initiale du plateau backgammon
  boardPoints.value = Array(24).fill(null).map(() => ({
    checkers: [],
    color: null
  }))
  
  // Position de départ standard
  // Blanc (joueur 1)
  addCheckers(1, 'white', 2)
  addCheckers(12, 'white', 5)
  addCheckers(17, 'white', 3)
  addCheckers(19, 'white', 5)
  
  // Noir (joueur 2)
  addCheckers(24, 'black', 2)
  addCheckers(13, 'black', 5)
  addCheckers(8, 'black', 3)
  addCheckers(6, 'black', 5)
}

function addCheckers(point, color, count) {
  for (let i = 0; i < count; i++) {
    boardPoints.value[point - 1].checkers.push({ color, id: `${color}-${point}-${i}` })
  }
}

function getPointClass(point) {
  const pointIndex = point - 1
  const isTop = point >= 13 && point <= 24
  const isDark = (point % 2 === 0)
  
  return [
    'relative',
    isTop ? 'items-start' : 'items-end',
    isDark ? 'bg-red-800' : 'bg-gray-200',
    selectedChecker.value === point ? 'ring-2 ring-yellow-400' : ''
  ]
}

function getTriangleClass(point) {
  const isTop = point >= 13 && point <= 24
  const isDark = (point % 2 === 0)
  
  return [
    'absolute',
    isTop ? 'top-0' : 'bottom-0',
    'left-1/2 transform -translate-x-1/2',
    'w-0 h-0',
    'border-l-transparent border-r-transparent',
    isTop ? 'border-b-red-900' : 'border-t-gray-700',
    isDark ? 'border-b-red-900' : 'border-t-gray-700',
    'border-l-8 border-r-8',
    isTop ? 'border-b-32' : 'border-t-32'
  ]
}

function getCheckersOnPoint(point) {
  return boardPoints.value[point - 1]?.checkers || []
}

function getCheckerCount(point) {
  return boardPoints.value[point - 1]?.checkers.length || 0
}

function selectPoint(point) {
  if (!isMyTurn.value || !canMakeMove.value) return
  
  gameStore.selectChecker(point)
}

function rollDice() {
  gameStore.rollDice()
}

function cancelSelection() {
  gameStore.selectedChecker = null
}

function resetGame() {
  gameStore.resetGame()
  initializeBoard()
  emit('gameCreated')
}
</script>

<style scoped>
.gammon-board-container {
  max-width: 800px;
  margin: 0 auto;
}

.gammon-board {
  transform-style: preserve-3d;
  perspective: 1000px;
}

.board-point {
  transition: all 0.3s ease;
}

.board-point:hover {
  transform: scale(1.05);
  z-index: 10;
}

.checker-drop {
  animation: checkerDrop 0.5s ease-out;
}

.dice-roll {
  animation: diceRoll 1s ease-in-out;
}

@keyframes checkerDrop {
  0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
  50% { transform: translateY(0) scale(1.1); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes diceRoll {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.2); }
  50% { transform: rotate(180deg) scale(1); }
  75% { transform: rotate(270deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}
</style>
