import axios from 'axios'

// Configuration base API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888/.netlify/functions'

// Créer instance Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gammon-guru-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('gammon-guru-token')
      localStorage.removeItem('gammon-guru-user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Service Authentification
export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.data.success) {
        localStorage.setItem('gammon-guru-token', response.data.data.token)
        localStorage.setItem('gammon-guru-user', JSON.stringify(response.data.data.user))
      }
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  },

  async register(email, password, username) {
    try {
      const response = await api.post('/auth/register', { email, password, username })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  },

  logout() {
    localStorage.removeItem('gammon-guru-token')
    localStorage.removeItem('gammon-guru-user')
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('gammon-guru-user')
    return userStr ? JSON.parse(userStr) : null
  },

  getToken() {
    return localStorage.getItem('gammon-guru-token')
  },

  isAuthenticated() {
    return !!this.getToken()
  }
}

// Service Jeu
export const gameService = {
  async createGame(gameMode, opponentId = null, difficulty = 'MEDIUM') {
    try {
      const response = await api.post('/game/create', { gameMode, opponentId, difficulty })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create game')
    }
  },

  async getGameStatus(gameId) {
    try {
      const response = await api.get(`/game/status?gameId=${gameId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get game status')
    }
  },

  async makeMove(gameId, move) {
    try {
      const response = await api.post('/game/move', { gameId, move })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to make move')
    }
  }
}

// Service GNUBG Analyse
export const analysisService = {
  async analyzePosition(boardState, dice, move, analysisType = 'full') {
    try {
      const response = await api.post('/gnubg/analyze', { 
        boardState, 
        dice, 
        move, 
        analysisType 
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Analysis failed')
    }
  },

  async getHint(boardState, dice) {
    try {
      const response = await api.post('/gnubg/hint', { boardState, dice })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get hint')
    }
  }
}

// Service Utilisateur
export const userService = {
  async getProfile() {
    try {
      const response = await api.get('/user/profile')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get profile')
    }
  },

  async updateProfile(updates) {
    try {
      const response = await api.put('/user/profile', updates)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update profile')
    }
  },

  async getStats() {
    try {
      const response = await api.get('/user/stats')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get stats')
    }
  }
}

// Export par défaut
export default api
