/**
 * Serveur Minimal GammonGuru - Version qui fonctionne immédiatement
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// Middleware de base
app.use(cors());
app.use(express.json());

// Routes de test
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'GammonGuru Backend is running!'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'GammonGuru API',
    version: '1.0.0',
    status: 'minimal version running'
  });
});

// Route d'inscription simple
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email, password et username requis'
      });
    }
    
    // Simulation d'inscription réussie
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: {
          id: 'user_' + Date.now(),
          email,
          username,
          role: 'PLAYER',
          level: 1,
          elo: 1200
        },
        tokens: {
          accessToken: 'mock_jwt_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route de connexion simple
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et password requis'
      });
    }
    
    // Simulation de connexion réussie
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: 'user_123',
          email,
          username: 'test_user',
          role: 'PLAYER',
          level: 1,
          elo: 1200
        },
        tokens: {
          accessToken: 'mock_jwt_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route de création de partie simple
app.post('/api/games', (req, res) => {
  try {
    const { mode, isRanked } = req.body;
    
    if (!mode || !isRanked) {
      return res.status(400).json({
        success: false,
        error: 'Mode et isRanked requis'
      });
    }
    
    // Simulation de création de partie
    const game = {
      id: 'game_' + Date.now(),
      status: 'waiting',
      mode,
      isRanked,
      currentPlayer: 'white',
      players: [
        { id: 'user_123', color: 'white', isHuman: true },
        { id: 'ai_bot', color: 'black', isHuman: false }
      ],
      board: createInitialBoard(),
      dice: { die1: 0, die2: 0 },
      moves: [],
      createdAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      message: 'Partie créée avec succès',
      data: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route de lancer les dés simple
app.post('/api/games/:gameId/roll', (req, res) => {
  try {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    
    res.status(200).json({
      success: true,
      message: 'Dés lancés',
      data: {
        gameId: req.params.gameId,
        dice: { die1, die2 },
        currentPlayer: 'white'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route d'état de partie simple
app.get('/api/games/:gameId', (req, res) => {
  try {
    // Simulation d'état de partie
    const game = {
      id: req.params.gameId,
      status: 'playing',
      mode: 'pvc',
      currentPlayer: 'white',
      board: createInitialBoard(),
      dice: { die1: 3, die2: 5 },
      moves: [],
      winner: null
    };
    
    res.status(200).json({
      success: true,
      data: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Fonction utilitaire pour créer le plateau initial
function createInitialBoard() {
  return [
    { point: 1, player: 'white', checkers: 2 },
    { point: 6, player: 'black', checkers: 5 },
    { point: 8, player: 'black', checkers: 3 },
    { point: 12, player: 'white', checkers: 5 },
    { point: 13, player: 'black', checkers: 5 },
    { point: 17, player: 'white', checkers: 3 },
    { point: 19, player: 'white', checkers: 5 },
    { point: 24, player: 'black', checkers: 2 }
  ];
}

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé',
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/games',
      'POST /api/games/:gameId/roll',
      'GET /api/games/:gameId'
    ]
  });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`🎮 GammonGuru Backend running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📚 API info: http://localhost:${port}/api`);
  console.log(`🔐 Auth: http://localhost:${port}/api/auth`);
  console.log(`🎯 Games: http://localhost:${port}/api/games`);
});

export default app;
