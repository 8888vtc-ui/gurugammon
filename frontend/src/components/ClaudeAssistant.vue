/**
 * Claude Assistant Component - AI-Powered Backgammon Coach
 * Interactive chat interface with Claude AI for game analysis and coaching
 */

<template>
  <div class="claude-assistant-container">
    <!-- Assistant Header -->
    <div class="assistant-header">
      <div class="header-content">
        <div class="ai-avatar">
          <div class="avatar-icon">
            {{ currentAI === 'claude' ? '🤖' : '🧠' }}
          </div>
          <div class="status-indicator" :class="{ online: isClaudeOnline }"></div>
        </div>
        <div class="header-info">
          <h3>{{ currentAIName }}</h3>
          <p class="status-text">
            {{ claudeStatus }}
            <span v-if="lastResponse && lastResponse.usedFallback" class="fallback-notice">
              (ChatGPT fallback)
            </span>
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button
          @click="toggleMinimized"
          class="action-btn minimize"
          title="Réduire"
        >
          {{ isMinimized ? '🔼' : '🔽' }}
        </button>
        <button
          @click="clearChat"
          class="action-btn clear"
          title="Effacer la conversation"
        >
          🗑️
        </button>
        <button
          @click="toggleSettings"
          class="action-btn settings"
          title="Paramètres"
        >
          ⚙️
        </button>
      </div>
    </div>

    <!-- Main Content (hidden when minimized) -->
    <div v-if="!isMinimized" class="assistant-content">
      <!-- Quick Actions -->
      <div class="quick-actions">
        <button
          v-for="action in quickActions"
          :key="action.id"
          @click="executeQuickAction(action)"
          class="quick-action-btn"
          :class="{ active: activeAction === action.id }"
          :disabled="isLoading"
        >
          <span class="action-icon">{{ action.icon }}</span>
          <span class="action-text">{{ action.label }}</span>
        </button>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="[message.type, { 'typing': message.isTyping }]"
        >
          <div class="message-avatar">
            <span v-if="message.type === 'user'">👤</span>
            <span v-else>🤖</span>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.text)"></div>
            <div class="message-meta">
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
              <span v-if="message.type === 'assistant'" class="message-actions">
                <button
                  @click="copyMessage(message.text)"
                  class="message-action"
                  title="Copier"
                >
                  📋
                </button>
                <button
                  @click="likeMessage(message.id)"
                  class="message-action"
                  :class="{ liked: message.liked }"
                  title="Utile"
                >
                  👍
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="message assistant typing">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Context Panel -->
      <div v-if="gameContext && showGameContext" class="game-context-panel">
        <div class="context-header">
          <h4>🎲 Contexte de jeu</h4>
          <button @click="showGameContext = false" class="close-btn">✕</button>
        </div>
        <div class="context-content">
          <div class="context-item">
            <span class="label">Position:</span>
            <span class="value">{{ gameContext.position || 'Non disponible' }}</span>
          </div>
          <div class="context-item">
            <span class="label">Dés:</span>
            <span class="value">{{ gameContext.dice ? gameContext.dice.join(', ') : 'Non lancés' }}</span>
          </div>
          <div class="context-item">
            <span class="label">Tour:</span>
            <span class="value">{{ gameContext.currentPlayer || 'Inconnu' }}</span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-container">
          <textarea
            v-model="currentMessage"
            @keydown="handleKeyDown"
            @input="handleInput"
            placeholder="Posez votre question sur le backgammon..."
            class="message-input"
            :disabled="isLoading || !isClaudeOnline"
            rows="2"
            maxlength="500"
          ></textarea>
          <div class="input-footer">
            <div class="input-info">
              <span class="char-count">{{ currentMessage.length }}/500</span>
              <span v-if="quotaInfo" class="quota-info">
                Quota: {{ quotaInfo.remaining }}/{{ quotaInfo.total }}
              </span>
            </div>
            <button
              @click="sendMessage"
              :disabled="!canSendMessage"
              class="send-btn"
            >
              {{ isLoading ? '⏳' : '📤' }}
            </button>
          </div>
        </div>

        <!-- Suggestions -->
        <div v-if="suggestions.length > 0" class="suggestions">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            @click="useSuggestion(suggestion)"
            class="suggestion-btn"
          >
            💡 {{ suggestion }}
          </button>
        </div>
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <h4>⚙️ Paramètres Claude</h4>
        <button @click="toggleSettings" class="close-btn">✕</button>
      </div>
      <div class="settings-content">
        <div class="setting-group">
          <label class="setting-item">
            <input
              v-model="settings.autoAnalysis"
              type="checkbox"
              class="setting-checkbox"
            />
            <span>Analyse automatique des positions</span>
          </label>
          <label class="setting-item">
            <input
              v-model="settings.showContext"
              type="checkbox"
              class="setting-checkbox"
            />
            <span>Afficher le contexte de jeu</span>
          </label>
          <label class="setting-item">
            <input
              v-model="settings.soundEnabled"
              type="checkbox"
              class="setting-checkbox"
            />
            <span>Activer les notifications sonores</span>
          </label>
        </div>
        <div class="setting-group">
          <div class="setting-item">
            <label>Niveau de jeu</label>
            <select v-model="settings.playerLevel" class="setting-select">
              <option value="BEGINNER">Débutant</option>
              <option value="INTERMEDIATE">Intermédiaire</option>
              <option value="ADVANCED">Avancé</option>
              <option value="EXPERT">Expert</option>
              <option value="MASTER">Maître</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Style de coaching</label>
            <select v-model="settings.coachingStyle" class="setting-select">
              <option value="encouraging">Encourageant</option>
              <option value="technical">Technique</option>
              <option value="concise">Concis</option>
              <option value="detailed">Détaillé</option>
            </select>
          </div>
        </div>
        <div class="setting-actions">
          <button @click="resetSettings" class="action-btn reset">
            🔄 Réinitialiser
          </button>
          <button @click="saveSettings" class="action-btn save">
            💾 Sauvegarder
          </button>
        </div>
      </div>
    </div>

    <!-- Usage Statistics -->
    <div v-if="showStats" class="stats-panel">
      <div class="stats-header">
        <h4>📊 Statistiques d'utilisation</h4>
        <button @click="showStats = false" class="close-btn">✕</button>
      </div>
      <div class="stats-content">
        <div class="stat-item">
          <span class="stat-label">Requêtes aujourd'hui:</span>
          <span class="stat-value">{{ usageStats.requests_today || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Ce mois:</span>
          <span class="stat-value">{{ usageStats.requests_this_month || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Temps de réponse moyen:</span>
          <span class="stat-value">{{ usageStats.average_response_time || 0 }}ms</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Taux de succès:</span>
          <span class="stat-value">{{ usageStats.success_rate || 0 }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import apiService from '@/services/api.service'
import { useUserStore } from '@/stores/user'

const gameStore = useGameStore()
const userStore = useUserStore()

// State
const messages = ref([])
const currentMessage = ref('')
const isLoading = ref(false)
const isTyping = ref(false)
const isClaudeOnline = ref(false)
const isMinimized = ref(false)
const showSettings = ref(false)
const showStats = ref(false)
const showGameContext = ref(false)
const activeAction = ref(null)
const gameContext = ref(null)
const quotaInfo = ref(null)
const usageStats = ref({})
const lastResponse = ref(null) // Track last AI response

// Settings
const settings = ref({
  autoAnalysis: true,
  showContext: true,
  soundEnabled: true,
  playerLevel: 'INTERMEDIATE',
  coachingStyle: 'encouraging'
})

// Quick actions
const quickActions = ref([
  { id: 'analyze', icon: '🔍', label: 'Analyser la position' },
  { id: 'suggest', icon: '💡', label: 'Suggérer un coup' },
  { id: 'coach', icon: '🎯', label: 'Coaching perso' },
  { id: 'explain', icon: '📚', label: 'Expliquer la stratégie' }
])

// Suggestions
const suggestions = ref([
  'Comment améliorer mon jeu ?',
  'Quelle est la meilleure stratégie ?',
  'Analyse ma position actuelle',
  'Comment utiliser le cube ?'
])

// Refs
const messagesContainer = ref(null)

// Computed properties
const claudeStatus = computed(() => {
  if (isLoading.value) return '🔄 En réflexion...'
  if (!isClaudeOnline.value) return '❌ Hors ligne'
  return '✅ Prêt à aider'
})

const canSendMessage = computed(() => {
  return currentMessage.value.trim().length > 0 &&
         !isLoading.value &&
         isClaudeOnline.value &&
         (quotaInfo.value ? quotaInfo.value.remaining > 0 : true)
})

// AI Service tracking
const currentAI = computed(() => lastResponse.value?.aiService || 'claude')
const currentAIName = computed(() => {
  if (currentAI.value === 'chatgpt') return 'ChatGPT - Coach Backgammon'
  return 'Claude - Coach Backgammon'
})

const initialize = async () => {
  await checkClaudeHealth()
  await loadUsageStats()
  loadSettings()

  if (settings.value.showContext && gameContext.value) {
    showGameContext.value = true
  }

  // Add welcome message
  addMessage('assistant', `Bonjour ! Je suis Claude, votre coach backgammon personnel. Comment puis-je vous aider aujourd'hui ?`)
}

const checkClaudeHealth = async () => {
  try {
    const response = await fetch('/api/claude/health')
    const data = await response.json()

    isClaudeOnline.value = data.success && data.data.available

    if (!isClaudeOnline.value) {
      addMessage('assistant', '')
    }

  } catch (error) {
    console.error('Claude health check failed:', error)
    isClaudeOnline.value = false
  }
}

const loadUsageStats = async () => {
  try {
    const token = localStorage.getItem('jwt_token')
    if (!token) return

    const response = await fetch('/api/claude/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      usageStats.value = data.data
      quotaInfo.value = {
        remaining: data.data.quota_remaining,
        total: data.data.requests_this_month + data.data.quota_remaining
      }
    }

  } catch (error) {
    console.error('Failed to load usage stats:', error)
  }
}

const sendMessage = async () => {
  if (!canSendMessage.value) return

  const messageText = currentMessage.value.trim()
  currentMessage.value = ''

  // Add user message
  addMessage('user', messageText)

  // Show typing indicator
  isTyping.value = true
  isLoading.value = true

  try {
    const token = localStorage.getItem('jwt_token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch('/api/claude/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: messageText,
        gameContext: showGameContext.value ? gameContext.value : null,
        playerLevel: settings.value.playerLevel
      })
    })

    const data = await response.json()

    if (data.success) {
      addMessage('assistant', data.data.response)

      // Store response information for UI updates
      lastResponse.value = {
        aiService: data.data.aiService,
        model: data.data.model,
        usedFallback: data.data.usedFallback || false
      }

      // Play sound if enabled
      if (settings.value.soundEnabled) {
        playMessageSound()
      }

      // Update usage stats
      await loadUsageStats()

    } else {
      addMessage('assistant', ` Erreur: ${data.message || 'Impossible de traiter votre demande'}`)
    }

  } catch (error) {
    console.error('Claude chat error:', error)
    addMessage('assistant', ' Une erreur est survenue. Veuillez réessayer plus tard.')
  } finally {
    isTyping.value = false
    isLoading.value = false
    activeAction.value = null
  }
}

const executeQuickAction = async (action) => {
  if (isLoading.value || !isClaudeOnline.value) return

  activeAction.value = action.id

  switch (action.id) {
    case 'analyze':
      await analyzePosition()
      break
    case 'suggest':
      await suggestMoves()
      break
    case 'coach':
      await getCoaching()
      break
    case 'explain':
      await explainStrategy()
      break
  }
}

const analyzePosition = async () => {
  if (!gameContext.value) {
    addMessage('assistant', ' Je dois d\'abord connaître la position actuelle pour l\'analyser.')
    return
  }

  try {
    const token = localStorage.getItem('jwt_token')
    const response = await fetch('/api/claude/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        boardState: gameContext.value.boardState,
        dice: gameContext.value.dice,
        playerLevel: settings.value.playerLevel
      })
    })

    const data = await response.json()

    if (data.success) {
      addMessage('assistant', ` **Analyse de la position:**\n\n${data.data.analysis}`)
    } else {
      addMessage('assistant', ` Erreur d'analyse: ${data.message}`)
    }

  } catch (error) {
    addMessage('assistant', ' Impossible d\'analyser la position actuellement.')
  }
}

const suggestMoves = async () => {
  if (!gameContext.value || !gameContext.value.availableMoves) {
    addMessage('assistant', ' J\'ai besoin des coups disponibles pour faire des suggestions.')
    return
  }

  addMessage('assistant', ' **Suggestions de coups:**\n\nEn cours d\'analyse...')
}

const getCoaching = async () => {
  addMessage('assistant', ' **Coaching personnalisé:**\n\nBasé sur votre progression récente, je vous recommande de...')
}

const explainStrategy = async () => {
  addMessage('assistant', ' **Conseils stratégiques:**\n\nVoici les principes fondamentaux à maîtriser...')
}

const addMessage = (type, text) => {
  const message = {
    id: Date.now() + Math.random(),
    type,
    text,
    timestamp: new Date().toISOString(),
    liked: false
  }

  messages.value.push(message)
  scrollToBottom()
}

const formatMessage = (text) => {
  // Convert markdown-like formatting to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/(\d+\.\s)/g, '<br>$1')
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const copyMessage = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    // Show copied feedback
    console.log('Message copied to clipboard')
  })
}

const likeMessage = (messageId) => {
  const message = messages.value.find(m => m.id === messageId)
  if (message) {
    message.liked = !message.liked
  }
}

const useSuggestion = (suggestion) => {
  currentMessage.value = suggestion
}

const playMessageSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    audio.volume = 0.3
    audio.play().catch(() => {
      // Ignore audio play errors
    })
  } catch (error) {
    // Ignore audio errors
  }
}

const loadSettings = () => {
  const saved = localStorage.getItem('claudeSettings')
  if (saved) {
    try {
      settings.value = { ...settings.value, ...JSON.parse(saved) }
    } catch (error) {
      console.error('Failed to load Claude settings:', error)
    }
  }
}

const saveSettings = () => {
  localStorage.setItem('claudeSettings', JSON.stringify(settings.value))
  toggleSettings()
}

const resetSettings = () => {
  settings.value = {
    autoAnalysis: true,
    showContext: true,
    soundEnabled: true,
    playerLevel: 'INTERMEDIATE',
    coachingStyle: 'encouraging'
  }
}

const toggleMinimized = () => {
  isMinimized.value = !isMinimized.value
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const clearChat = () => {
  if (confirm('Êtes-vous sûr de vouloir effacer toute la conversation ?')) {
    messages.value = []
    addMessage('assistant', 'Conversation effacée. Comment puis-je vous aider ?')
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleInput = () => {
  // Update suggestions based on input
  if (currentMessage.value.length > 0) {
    suggestions.value = []
  } else {
    suggestions.value = [
      'Comment améliorer mon jeu ?',
      'Quelle est la meilleure stratégie ?',
      'Analyse ma position actuelle',
      'Comment utiliser le cube ?'
    ]
  }
}

watch(() => gameStore.initialGameContext, (newContext) => {
  gameContext.value = newContext

  if (settings.value.autoAnalysis && newContext && isClaudeOnline.value) {
    // Auto-analyze new position
    setTimeout(() => {
      if (settings.value.autoAnalysis) {
        executeQuickAction(quickActions.value[0]) // Analyze action
      }
    }, 2000)
  }
})

onMounted(() => {
  initialize()

  // Periodic health check
  const healthInterval = setInterval(checkClaudeHealth, 30000) // Every 30 seconds

  onUnmounted(() => {
    clearInterval(healthInterval)
  })
})
</script>

<style scoped>
.claude-assistant-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.claude-assistant-container.minimized {
  max-height: 60px;
}

.assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px 15px 0 0;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  position: relative;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #f44336;
  border: 2px solid white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-indicator.online {
  background: #4caf50;
}

.header-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1em;
  font-weight: bold;
}

.status-text {
  margin: 0;
  font-size: 0.9em;
  opacity: 0.9;
}

.fallback-notice {
  color: #ffd700;
  font-weight: bold;
  font-size: 0.8em;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.assistant-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.quick-actions {
  display: flex;
  gap: 5px;
  padding: 10px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.quick-action-btn {
  flex: 1;
  padding: 8px 5px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8em;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.quick-action-btn:hover {
  background: #e8eaf6;
  transform: translateY(-1px);
}

.quick-action-btn.active {
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-color: #667eea;
}

.action-icon {
  font-size: 1.2em;
}

.action-text {
  font-size: 0.7em;
  text-align: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #fafafa;
}

.message {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  animation: messageSlide 0.3s ease;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 30px;
  height: 30px;
  background: #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1em;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #667eea;
  color: white;
}

.message.assistant .message-avatar {
  background: #764ba2;
  color: white;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 12px 15px;
  border-radius: 15px 15px 5px 15px;
}

.message.assistant .message-content {
  background: white;
  padding: 12px 15px;
  border-radius: 15px 15px 15px 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-text {
  line-height: 1.4;
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
  font-size: 0.8em;
}

.message.user .message-meta {
  color: rgba(255, 255, 255, 0.8);
}

.message.assistant .message-meta {
  color: #666;
}

.message-actions {
  display: flex;
  gap: 5px;
}

.message-action {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9em;
  opacity: 0.7;
  transition: all 0.3s ease;
}

.message-action:hover {
  opacity: 1;
  transform: scale(1.1);
}

.message-action.liked {
  opacity: 1;
  color: #4caf50;
}

.typing-indicator {
  display: flex;
  gap: 3px;
  padding: 10px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

@keyframes messageSlide {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.game-context-panel {
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
  margin: 0 15px 10px 15px;
  padding: 10px;
  border-radius: 8px;
}

.context-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.context-header h4 {
  margin: 0;
  font-size: 0.9em;
  color: #2e7d32;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8em;
  color: #666;
}

.context-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.context-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
}

.context-item .label {
  font-weight: bold;
  color: #2e7d32;
}

.input-area {
  padding: 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-container {
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.input-container:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.message-input {
  width: 100%;
  padding: 12px 15px;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 0.9em;
  line-height: 1.4;
}

.message-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.input-info {
  display: flex;
  gap: 15px;
  font-size: 0.8em;
  color: #666;
}

.quota-info {
  color: #667eea;
  font-weight: bold;
}

.send-btn {
  width: 35px;
  height: 35px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}

.suggestion-btn {
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.8em;
  text-align: left;
  transition: all 0.3s ease;
}

.suggestion-btn:hover {
  background: #e8eaf6;
  transform: translateX(2px);
}

.settings-panel,
.stats-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 15px;
  z-index: 10;
  overflow-y: auto;
}

.settings-header,
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px 15px 0 0;
}

.settings-header h4,
.stats-header h4 {
  margin: 0;
  font-size: 1.1em;
}

.settings-content,
.stats-content {
  padding: 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

.setting-checkbox {
  cursor: pointer;
}

.setting-select {
  flex: 1;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: white;
  cursor: pointer;
}

.setting-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.action-btn.reset {
  background: #ff9800;
  color: white;
  padding: 8px 16px;
  border-radius: 5px;
}

.action-btn.save {
  background: #4caf50;
  color: white;
  padding: 8px 16px;
  border-radius: 5px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  font-weight: bold;
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #667eea;
}

@media (max-width: 480px) {
  .claude-assistant-container {
    width: calc(100% - 40px);
    right: 20px;
    left: 20px;
  }
  
  .quick-actions {
    flex-wrap: wrap;
  }
  
  .quick-action-btn {
    min-width: calc(50% - 3px);
  }
}
</style>
