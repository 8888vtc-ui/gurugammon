// Netlify Function - Game Status
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

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
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

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
    if (game.whitePlayer !== decoded.userId && 
        game.blackPlayer !== decoded.userId && 
        game.blackPlayer !== 'ai-opponent') {
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
      .eq('id', game.whitePlayer)
      .single();

    let blackPlayerInfo = null;
    if (game.blackPlayer && game.blackPlayer !== 'ai-opponent') {
      const { data: blackData } = await supabase
        .from('users')
        .select('username, elo, avatar')
        .eq('id', game.blackPlayer)
        .single();
      blackPlayerInfo = blackData;
    } else if (game.blackPlayer === 'ai-opponent') {
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
