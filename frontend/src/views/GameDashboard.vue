<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100">
    
    <!-- Header -->
    <header class="bg-gradient-to-r from-gammon-primary to-gammon-secondary text-white shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <div class="text-2xl font-bold">🎲 GammonGuru</div>
            <div class="hidden md:block text-sm opacity-75">
              Backgammon Intelligence Artificielle
            </div>
          </div>
          
          <nav class="flex items-center space-x-6">
            <button @click="showDashboard = true" 
                    :class="showDashboard ? 'text-yellow-300' : 'text-white hover:text-yellow-200'"
                    class="transition-colors">
              📊 Dashboard
            </button>
            <button @click="showDashboard = false" 
                    :class="!showDashboard ? 'text-yellow-300' : 'text-white hover:text-yellow-200'"
                    class="transition-colors">
              🎮 Jouer
            </button>
            <div class="flex items-center space-x-3">
              <div class="text-right">
                <div class="text-sm font-semibold">{{ currentUser?.username }}</div>
                <div class="text-xs opacity-75">ELO: {{ currentUser?.elo }}</div>
              </div>
              <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gammon-primary font-bold">
                {{ currentUser?.username?.charAt(0).toUpperCase() }}
              </div>
            </div>
            <button @click="logout" 
                    class="gammon-button text-sm bg-red-600 hover:bg-red-700">
              Déconnexion
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      
      <!-- Dashboard View -->
      <div v-if="showDashboard" class="space-y-6">
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="gammon-card text-center">
            <div class="text-3xl font-bold text-gammon-primary mb-2">
              {{ userStats?.totalGames || 0 }}
            </div>
            <div class="text-sm text-gray-600">Parties jouées</div>
          </div>
          
          <div class="gammon-card text-center">
            <div class="text-3xl font-bold text-green-600 mb-2">
              {{ userStats?.winRate || '0%' }}
            </div>
            <div class="text-sm text-gray-600">Taux de victoire</div>
          </div>
          
          <div class="gammon-card text-center">
            <div class="text-3xl font-bold text-gammon-secondary mb-2">
              {{ currentUser?.elo || 1500 }}
            </div>
            <div class="text-sm text-gray-600">ELO Rating</div>
          </div>
          
          <div class="gammon-card text-center">
            <div class="text-3xl font-bold text-purple-600 mb-2">
              {{ userStats?.analysesUsed || 0 }}/{{ userStats?.analysesQuota || 5 }}
            </div>
            <div class="text-sm text-gray-600">Analyses utilisées</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="gammon-card">
          <h3 class="text-xl font-bold text-gammon-primary mb-4">🚀 Actions rapides</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button @click="startNewGame('AI_VS_PLAYER')" 
                    class="gammon-button py-4 flex flex-col items-center space-y-2">
              <div class="text-2xl">🤖</div>
              <div>Jouer vs IA</div>
            </button>
            <button @click="startNewGame('PLAYER_VS_PLAYER')" 
                    class="gammon-button py-4 flex flex-col items-center space-y-2">
              <div class="text-2xl">👥</div>
              <div>Jouer vs Humain</div>
            </button>
            <button @click="showAnalysis = true" 
                    class="gammon-button py-4 flex flex-col items-center space-y-2">
              <div class="text-2xl">🧠</div>
              <div>Analyser position</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Game View -->
      <div v-else class="space-y-6">
        
        <!-- Game Creation or Active Game -->
        <div v-if="!currentGame" class="gammon-card">
          <h3 class="text-xl font-bold text-gammon-primary mb-6">🎮 Nouvelle partie</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- AI Game -->
            <div class="text-center p-6 border-2 border-gammon-primary rounded-lg hover:bg-gammon-light transition-colors">
              <div class="text-4xl mb-4">🤖</div>
              <h4 class="text-lg font-bold mb-2">Jouer contre l'IA</h4>
              <p class="text-gray-600 mb-4">Affrontez notre intelligence artificielle avancée</p>
              
              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Difficulté</label>
                <select v-model="aiDifficulty" 
                        class="gammon-input w-full">
                  <option value="EASY">Débutant</option>
                  <option value="MEDIUM">Intermédiaire</option>
                  <option value="HARD">Expert</option>
                </select>
              </div>
              
              <button @click="startNewGame('AI_VS_PLAYER')" 
                      :disabled="isCreatingGame"
                      class="gammon-button w-full">
                {{ isCreatingGame ? 'Création...' : '🎯 Commencer' }}
              </button>
            </div>

            <!-- Human Game -->
            <div class="text-center p-6 border-2 border-gammon-secondary rounded-lg hover:bg-gammon-light transition-colors">
              <div class="text-4xl mb-4">👥</div>
              <h4 class="text-lg font-bold mb-2">Jouer contre un humain</h4>
              <p class="text-gray-600 mb-4">Invitez un autre joueur ou rejoignez une partie</p>
              
              <button @click="startNewGame('PLAYER_VS_PLAYER')" 
                      :disabled="isCreatingGame"
                      class="gammon-button w-full">
                {{ isCreatingGame ? 'Création...' : '🎲 Créer partie' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Active Game Board -->
        <div v-else>
          <BackgammonBoard :game-id="currentGame.id" 
                           @game-created="onGameCreated"
                           @move-made="onMoveMade" />
        </div>
      </div>
    </main>

    <!-- Analysis Modal -->
    <div v-if="showAnalysis" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <h3 class="text-xl font-bold text-gammon-primary mb-4">🧠 Analyse de position</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Position du plateau</label>
            <input v-model="analysisPosition" 
                   type="text" 
                   placeholder="4HPwATDgc/ABMA"
                   class="gammon-input w-full">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Dés</label>
            <div class="flex space-x-2">
              <input v-model="analysisDice[0]" 
                     type="number" 
                     min="1" 
                     max="6" 
                     class="gammon-input w-20">
              <input v-model="analysisDice[1]" 
                     type="number" 
                     min="1" 
                     max="6" 
                     class="gammon-input w-20">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Votre coup</label>
            <input v-model="analysisMove" 
                   type="text" 
                   placeholder="8/5 6/5"
                   class="gammon-input w-full">
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showAnalysis = false" 
                  class="gammon-button bg-gray-600 hover:bg-gray-700">
            Annuler
          </button>
          <button @click="analyzePosition" 
                  :disabled="isAnalyzing"
                  class="gammon-button">
            {{ isAnalyzing ? 'Analyse...' : '🧠 Analyser' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="isLoading" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 text-center">
        <div class="text-2xl font-bold text-gammon-primary mb-2">Chargement...</div>
        <div class="text-gray-600">Veuillez patienter</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { analysisService } from '@/services/api'
import BackgammonBoard from '@/components/BackgammonBoard.vue'

const router = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()

// Reactive state
const showDashboard = ref(true)
const showAnalysis = ref(false)
const aiDifficulty = ref('MEDIUM')
const isCreatingGame = ref(false)
const isAnalyzing = ref(false)

// Analysis state
const analysisPosition = ref('4HPwATDgc/ABMA')
const analysisDice = ref([3, 1])
const analysisMove = ref('8/5 6/5')

// Mock data
const userStats = ref({
  totalGames: 12,
  winRate: '67%',
  analysesUsed: 3,
  analysesQuota: 5
})

// Computed properties
const currentUser = computed(() => authStore.currentUser)
const currentGame = computed(() => gameStore.currentGame)
const isLoading = computed(() => gameStore.isLoading)

// Lifecycle
onMounted(() => {
  authStore.initializeAuth()
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})

// Methods
async function startNewGame(mode) {
  isCreatingGame.value = true
  
  try {
    const result = await gameStore.createGame(
      mode, 
      null, 
      mode === 'AI_VS_PLAYER' ? aiDifficulty.value : null
    )
    
    if (result.success) {
      showDashboard.value = false
    }
  } catch (error) {
    console.error('Failed to create game:', error)
  } finally {
    isCreatingGame.value = false
  }
}

async function analyzePosition() {
  isAnalyzing.value = true
  
  try {
    const result = await analysisService.analyzePosition(
      analysisPosition.value,
      analysisDice.value,
      analysisMove.value
    )
    
    if (result.success) {
      alert('Analyse réussie: ' + JSON.stringify(result.data, null, 2))
    }
  } catch (error) {
    console.error('Analysis failed:', error)
    alert('Erreur: ' + error.message)
  } finally {
    isAnalyzing.value = false
  }
}

function onGameCreated() {
  showDashboard.value = false
}

function onMoveMade(move) {
  console.log('Move made:', move)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.gammon-card {
  @apply bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gammon-primary;
}

.gammon-button {
  @apply bg-gammon-primary hover:bg-gammon-secondary text-white font-bold py-2 px-4 rounded-lg shadow transition-all duration-300 transform hover:scale-105;
}

.gammon-input {
  @apply border-2 border-gammon-primary rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gammon-secondary focus:border-transparent;
}
</style>
