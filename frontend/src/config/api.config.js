/**
 * Configuration API pour production
 * Priorité absolue: connexion frontend-backend
 */

// URLs de production pour demain matin
const API_CONFIG = {
  // Development local
  development: {
    baseURL: 'http://localhost:3000',
    timeout: 10000
  },
  
  // Production Netlify + Railway
  production: {
    baseURL: 'https://gammon-guru-backend.railway.app',
    timeout: 15000
  },
  
  // Fallback si Railway down
  fallback: {
    baseURL: 'https://gnubg-backend.netlify.app/api',
    timeout: 15000
  }
}

// Configuration actuelle
const currentConfig = API_CONFIG[import.meta.env.MODE] || API_CONFIG.production

// Endpoints API prioritaires
export const API_ENDPOINTS = {
  // Auth (priorité 1)
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  PROFILE: '/api/user/profile',
  
  // Game (priorité 1)
  CREATE_GAME: '/api/game/create',
  GAME_STATUS: '/api/game/status',
  ROLL_DICE: '/api/game/roll',
  MAKE_MOVE: '/api/game/move',
  
  // GNUBG (priorité 2)
  ANALYZE: '/api/gnubg/analyze',
  
  // Health (priorité monitoring)
  HEALTH: '/health'
}

// Client HTTP avec retry automatique
class ApiClient {
  constructor(config) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }
    
    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error.message)
      
      // Retry avec fallback si disponible
      if (this.baseURL !== API_CONFIG.fallback.baseURL) {
        console.log('Retrying with fallback URL...')
        const fallbackClient = new ApiClient(API_CONFIG.fallback)
        return fallbackClient.request(endpoint, options)
      }
      
      throw error
    }
  }
  
  // Méthodes pratiques pour les endpoints prioritaires
  async login(email, password) {
    return this.request(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }
  
  async createGame(mode = 'AI_VS_PLAYER', difficulty = 'MEDIUM') {
    return this.request(API_ENDPOINTS.CREATE_GAME, {
      method: 'POST',
      body: JSON.stringify({ mode, difficulty })
    })
  }
  
  async getGameStatus(gameId) {
    return this.request(`${API_ENDPOINTS.GAME_STATUS}/${gameId}`)
  }
  
  async rollDice(gameId) {
    return this.request(API_ENDPOINTS.ROLL_DICE, {
      method: 'POST',
      body: JSON.stringify({ gameId })
    })
  }
  
  async makeMove(gameId, from, to) {
    return this.request(API_ENDPOINTS.MAKE_MOVE, {
      method: 'POST',
      body: JSON.stringify({ gameId, from, to })
    })
  }
  
  async analyzePosition(boardState, dice, analysisType = 'BEST_MOVE') {
    return this.request(API_ENDPOINTS.ANALYZE, {
      method: 'POST',
      body: JSON.stringify({ boardState, dice, analysisType })
    })
  }
  
  async healthCheck() {
    return this.request(API_ENDPOINTS.HEALTH)
  }
}

// Export client unique
export const apiClient = new ApiClient(currentConfig)

// Export configuration
export default currentConfig
