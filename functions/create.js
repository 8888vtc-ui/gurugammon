// Netlify Function - Game Create
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

// État initial du plateau backgammon
const INITIAL_BOARD_STATE = '4HPwATDgc/ABMA';

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
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
      whitePlayer: decoded.userId, // Le créateur joue toujours en blanc
      blackPlayer: gameMode === 'AI_VS_PLAYER' ? null : opponentId,
      status: 'WAITING',
      boardState: INITIAL_BOARD_STATE,
      gameMode,
      currentPlayer: 'white',
      dice: [],
      whiteScore: 0,
      blackScore: 0,
      createdAt: new Date().toISOString()
    };

    const { data: newGame, error: createError } = await supabase
      .from('games')
      .insert(gameData)
      .select()
      .single();

    if (createError) {
      console.error('Create game error:', createError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create game' })
      };
    }

    // Si partie vs IA, créer un joueur IA
    if (gameMode === 'AI_VS_PLAYER') {
      const { error: aiError } = await supabase
        .from('games')
        .update({ 
          blackPlayer: 'ai-opponent',
          status: 'PLAYING'
        })
        .eq('id', newGame.id);

      if (aiError) {
        console.error('AI setup error:', aiError);
      }
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
