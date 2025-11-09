import { defineStore } from 'pinia'
import { authService } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    userLevel: (state) => state.user?.level || 'BEGINNER',
    userElo: (state) => state.user?.elo || 1500,
    subscriptionType: (state) => state.user?.subscriptionType || 'FREE'
  },

  actions: {
    async login(email, password) {
      this.isLoading = true
      this.error = null
      
      try {
        const result = await authService.login(email, password)
        this.user = result.data.user
        this.token = result.data.token
        this.isLoading = false
        return { success: true, user: this.user }
      } catch (error) {
        this.error = error.message
        this.isLoading = false
        return { success: false, error: error.message }
      }
    },

    async register(email, password, username) {
      this.isLoading = true
      this.error = null
      
      try {
        const result = await authService.register(email, password, username)
        this.isLoading = false
        return { success: true, message: result.message }
      } catch (error) {
        this.error = error.message
        this.isLoading = false
        return { success: false, error: error.message }
      }
    },

    logout() {
      authService.logout()
      this.user = null
      this.token = null
      this.error = null
    },

    initializeAuth() {
      const token = authService.getToken()
      const user = authService.getCurrentUser()
      
      if (token && user) {
        this.token = token
        this.user = user
      }
    },

    async updateProfile(updates) {
      this.isLoading = true
      this.error = null
      
      try {
        const result = await userService.updateProfile(updates)
        this.user = result.data.user
        this.isLoading = false
        return { success: true, user: this.user }
      } catch (error) {
        this.error = error.message
        this.isLoading = false
        return { success: false, error: error.message }
      }
    },

    clearError() {
      this.error = null
    }
  }
})
