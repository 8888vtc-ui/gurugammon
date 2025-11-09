// Netlify Function - Game Create
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { createId } = require('@paralleldrive/cuid2');
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const rateStore = new Map();
const rateLimit = (key, windowMs, max) => {
  const now = Date.now();
  const bucket = rateStore.get(key) || { count: 0, reset: now + windowMs };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + windowMs;
  }
  bucket.count += 1;
  rateStore.set(key, bucket);
  return { allowed: bucket.count <= max, remaining: Math.max(0, max - bucket.count), reset: bucket.reset };
};
const buildHeaders = (event) => {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const allow = ALLOWED_ORIGINS.length ? (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]) : '*';
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
};

// Initialiser Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware pour vérifier JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// État initial du plateau backgammon
const INITIAL_BOARD_STATE = '4HPwATDgc/ABMA';

exports.handler = async (event, context) => {
  const headers = buildHeaders(event);

  // Handle preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'])) || 'unknown';
    const rl = rateLimit(`${ip}:create`, 60 * 1000, 10);
    if (!rl.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Too many requests', retryAfterSeconds: Math.ceil((rl.reset - Date.now())/1000) })
      };
    }
    // Vérifier le token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    const { gameMode, opponentId, difficulty } = JSON.parse(event.body);

    // Validation
    if (!gameMode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Game mode is required' })
      };
    }

    // Validation gameMode
    const validModes = ['AI_VS_PLAYER', 'PLAYER_VS_PLAYER', 'TOURNAMENT'];
    if (!validModes.includes(gameMode)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid game mode' })
      };
    }

    // Validation difficulté pour IA
    let aiDifficulty = 'MEDIUM';
    if (gameMode === 'AI_VS_PLAYER') {
      const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
      aiDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'MEDIUM';
    }

    // Créer la partie
    const gameData = {
      id: createId(),
      white_player_id: decoded.userId,
      black_player_id: null,
      status: 'PLAYING',
      board_state: INITIAL_BOARD_STATE,
      gameMode: gameMode, // This field stays as gameMode (no @map)
      current_player: 'WHITE',
      dice: [],
      white_score: 0,
      black_score: 0,
      createdAt: new Date().toISOString()
    };

    console.log('Creating game with data:', JSON.stringify(gameData, null, 2));

    const { data: newGame, error: createError } = await supabase
      .from('games')
      .insert(gameData)
      .select()
      .single();

    if (createError) {
      console.error('Create game error:', JSON.stringify(createError, null, 2));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create game',
          details: createError.message,
          code: createError.code
        })
      };
    }

    // Récupérer les informations des joueurs
    const { data: whitePlayerInfo } = await supabase
      .from('users')
      .select('username, elo, avatar')
      .eq('id', decoded.userId)
      .single();

    let blackPlayerInfo = null;
    if (opponentId && opponentId !== 'ai-opponent') {
      const { data: blackData } = await supabase
        .from('users')
        .select('username, elo, avatar')
        .eq('id', opponentId)
        .single();
      blackPlayerInfo = blackData;
    } else if (gameMode === 'AI_VS_PLAYER') {
      blackPlayerInfo = {
        username: 'AI Opponent',
        elo: 1800,
        avatar: null
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Game created successfully',
        data: {
          game: {
            ...newGame,
            whitePlayer: whitePlayerInfo,
            blackPlayer: blackPlayerInfo,
            aiDifficulty: gameMode === 'AI_VS_PLAYER' ? aiDifficulty : null
          }
        }
      })
    };

  } catch (error) {
    console.error('Create game error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
