// Netlify Function - Game Status
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'])) || 'unknown';
    const rl = rateLimit(`${ip}:status`, 60 * 1000, 60);
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

    // Récupérer gameId des paramètres query
    const { gameId } = event.queryStringParameters;

    if (!gameId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Game ID is required' })
      };
    }

    // Récupérer la partie
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Game not found' })
      };
    }

    // Vérifier que l'utilisateur est un joueur de la partie
    if (game.white_player_id !== decoded.userId && 
        game.black_player_id !== decoded.userId && 
        game.black_player_id !== 'ai-opponent') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' })
      };
    }

    // Récupérer les informations des joueurs
    const { data: whitePlayerInfo } = await supabase
      .from('users')
      .select('username, elo, avatar')
      .eq('id', game.white_player_id)
      .single();

    let blackPlayerInfo = null;
    if (game.black_player_id && game.black_player_id !== 'ai-opponent') {
      const { data: blackData } = await supabase
        .from('users')
        .select('username, elo, avatar')
        .eq('id', game.black_player_id)
        .single();
      blackPlayerInfo = blackData;
    } else if (game.black_player_id === 'ai-opponent') {
      blackPlayerInfo = {
        username: 'AI Opponent',
        elo: 1800,
        avatar: null
      };
    }

    // Récupérer les mouvements de la partie
    const { data: moves, error: movesError } = await supabase
      .from('game_moves')
      .select('*')
      .eq('gameId', gameId)
      .order('createdAt', { ascending: true });

    // Récupérer le dernier mouvement pour déterminer le tour
    const lastMove = moves && moves.length > 0 ? moves[moves.length - 1] : null;
    const isPlayerTurn = game.currentPlayer === 'white' 
      ? game.whitePlayer === decoded.userId 
      : game.blackPlayer === decoded.userId;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          game: {
            ...game,
            whitePlayer: whitePlayerInfo,
            blackPlayer: blackPlayerInfo,
            isPlayerTurn,
            moveCount: moves ? moves.length : 0
          },
          moves: moves || [],
          gameStatus: {
            canMove: isPlayerTurn && game.status === 'PLAYING',
            isMyTurn: isPlayerTurn,
            playerColor: game.whitePlayer === decoded.userId ? 'white' : 'black',
            opponentColor: game.whitePlayer === decoded.userId ? 'black' : 'white'
          }
        }
      })
    };

  } catch (error) {
    console.error('Game status error:', error);
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
