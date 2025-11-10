/**
 * API Service - Centralized API Management
 * Handles all API calls to backend, Claude, OpenAI, and Replicate
 */

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  elo: number;
  level: string;
}

interface GameData {
  gameMode?: string;
  difficulty?: string;
}

class ApiService {
  private isDev: boolean;
  private baseUrl: string;
  private token: string | null;
  private apiKeys: {
    claude: null;
    openai: null;
    replicate: null;
  };
  private features: {
    claude: boolean;
    openai: boolean;
    imageGeneration: boolean;
    websocket: boolean;
  };

  constructor() {
    // Determine base URL based on environment
    this.isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.baseUrl = this.isDev ?
      (import.meta.env.VITE_DEV_API_BASE_URL || 'http://localhost:3000') :
      (import.meta.env.VITE_API_BASE_URL || 'https://gammon-guru-api.onrender.com');

    // JWT token storage
    this.token = localStorage.getItem('authToken') || null;

    // API Keys - SECURE: Only backend should have access
    this.apiKeys = {
      claude: null, // Removed for security - use backend proxy
      openai: null, // Removed for security - use backend proxy
      replicate: null // Removed for security - use backend proxy
    };

    // Feature flags
    this.features = {
      claude: import.meta.env.VITE_ENABLE_CLAUDE === 'true',
      openai: import.meta.env.VITE_ENABLE_OPENAI === 'true',
      imageGeneration: import.meta.env.VITE_ENABLE_IMAGE_GENERATION === 'true',
      websocket: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true'
    };
  }

  /**
   * Generic API request method
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add JWT token if available
    if (this.token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Authentication methods
   */
  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(name: string, email: string, password: string): Promise<ApiResponse> {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/api/auth/logout', {
      method: 'POST'
    });

    this.clearToken();
    return response;
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request('/api/user/profile');
  }

  /**
   * Token management
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Backend API calls
   */
  async getHealth(): Promise<ApiResponse> {
    return this.request('/health');
  }

  async getWebSocketStats(): Promise<ApiResponse> {
    return this.request('/api/ws/stats');
  }

  async createGame(gameData: GameData = {}): Promise<ApiResponse> {
    const data = {
      gameMode: gameData.gameMode || 'AI_VS_PLAYER',
      difficulty: gameData.difficulty || 'MEDIUM',
      ...gameData
    };

    return this.request('/api/games', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getGameStatus(gameId: string): Promise<ApiResponse> {
    return this.request(`/api/games/${gameId}`);
  }

  async rollDice(gameId: string): Promise<ApiResponse> {
    return this.request(`/api/games/${gameId}/roll`, {
      method: 'POST'
    });
  }

  async makeMove(gameId: string, from: number, to: number): Promise<ApiResponse> {
    return this.request(`/api/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify({ from, to })
    });
  }

  async getPlayers(): Promise<ApiResponse> {
    return this.request('/api/players');
  }

  async getGnubgAnalysis(positionData: any): Promise<ApiResponse> {
    return this.request('/api/gnubg/analyze', {
      method: 'POST',
      body: JSON.stringify(positionData)
    });
  }

  /**
   * Claude AI API calls - SECURE: Backend proxy only
   */
  async askClaude(message: string, context: any = {}): Promise<ApiResponse> {
    return this.request('/api/claude/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        context
        // API key managed by backend for security
      })
    });
  }

  async analyzeGameWithClaude(gameData: any): Promise<ApiResponse> {
    return this.request('/api/claude/analyze-game', {
      method: 'POST',
      body: JSON.stringify({
        ...gameData
        // API key managed by backend for security
      })
    });
  }

  async getSuggestedMove(position: any, dice: any, playerColor: string): Promise<ApiResponse> {
    return this.request('/api/claude/suggest-move', {
      method: 'POST',
      body: JSON.stringify({
        position,
        dice,
        playerColor
        // API key managed by backend for security
      })
    });
  }

  /**
   * OpenAI API calls - SECURE: Backend proxy only
   */
  async askOpenAI(message: string, context: any = {}): Promise<ApiResponse> {
    return this.request('/api/openai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        context
        // API key managed by backend for security
      })
    });
  }

  /**
   * Image generation with Replicate - SECURE: Backend proxy only
   */
  async generateImage(prompt: string, style: string = 'backgammon'): Promise<ApiResponse> {
    return this.request('/api/images/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        style
        // API key managed by backend for security
      })
    });
  }

  /**
   * User management
   */
  async getUserProfile(email: string): Promise<ApiResponse> {
    return this.request(`/api/user/profile/${email}`);
  }

  async updateUserProfile(userId: string, updates: any): Promise<ApiResponse> {
    return this.request(`/api/user/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Statistics
   */
  async getGameStats(): Promise<ApiResponse> {
    return this.request('/api/stats/games');
  }

  /**
   * Check API availability
   */
  async checkApiStatus(): Promise<any> {
    const status = {
      backend: false,
      claude: false,
      openai: false,
      imageGeneration: false,
      websocket: false
    };

    try {
      // Check backend
      await this.getHealth();
      status.backend = true;
    } catch (error) {
      console.error('Backend health check failed:', error);
    }

    // Note: AI service checks would require backend endpoints that don't exist yet
    // These would need to be implemented in the backend first

    return status;
  }

  /**
   * Get environment info
   */
  getEnvironment(): any {
    return {
      isDev: this.isDev,
      baseUrl: this.baseUrl,
      features: this.features,
      app: {
        name: import.meta.env.VITE_APP_NAME || 'GammonGuru',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        description: import.meta.env.VITE_APP_DESCRIPTION || 'Real-time Backgammon with AI Coaching'
      }
    };
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
