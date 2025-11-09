// Netlify Function - GNUBG Analyze
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

// Vérifier le quota utilisateur
const checkUserQuota = async (userId) => {
  try {
    // Récupérer le type d'abonnement
    const { data: user } = await supabase
      .from('users')
      .select('subscriptionType')
      .eq('id', userId)
      .single();

    if (!user) {
      return { allowed: false, message: 'User not found' };
    }

    // Compter les analyses ce mois-ci
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('analyses')
      .select('*', { count: 'exact' })
      .eq('userId', userId)
      .gte('createdAt', startOfMonth.toISOString());

    const quota = user.subscriptionType === 'PREMIUM' ? 1000 : 5;
    const remaining = quota - (count || 0);

    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      message: remaining <= 0 ? 
        'Quota atteint. Passez à Premium pour des analyses illimitées.' : 
        null
    };
  } catch (error) {
    console.error('Quota check error:', error);
    return { allowed: false, message: 'Failed to check quota' };
  }
};

// Simulation d'analyse GNUBG (remplacez par appel réel au service Railway)
const simulateGNUBGAnalysis = (boardState, dice, move) => {
  // Simulation basique - remplacer par appel API Railway
  const bestMoves = [
    '13/10 6/5',
    '13/9 6/5', 
    '24/20 13/9',
    '8/5 6/5'
  ];
  
  const randomBestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  const equity = -0.1 + (Math.random() * 0.5); // -0.1 à 0.4
  const pr = Math.random() * 0.1; // 0 à 0.1
  
  return {
    bestMove: randomBestMove,
    equity: equity,
    pr: pr,
    explanation: `Le coup optimal est ${randomBestMove} avec une equity de ${equity.toFixed(3)}. Votre coup ${move} a une equity de ${(equity - 0.05).toFixed(3)}.`,
    alternatives: bestMoves.filter(m => m !== randomBestMove).slice(0, 2),
    analysisType: 'full',
    confidence: 0.85 + (Math.random() * 0.15)
  };
};

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

    const { boardState, dice, move, analysisType = 'full' } = JSON.parse(event.body);

    // Validation
    if (!boardState || !dice || !move) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Board state, dice and move are required' 
        })
      };
    }

    // Validation dice (tableau de 2 nombres)
    if (!Array.isArray(dice) || dice.length !== 2 || 
        dice.some(d => d < 1 || d > 6)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid dice format' })
      };
    }

    // Vérifier le quota utilisateur
    const quotaCheck = await checkUserQuota(decoded.userId);
    if (!quotaCheck.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Quota exceeded',
          message: quotaCheck.message,
          quotaRemaining: quotaCheck.remaining
        })
      };
    }

    // Appeler le service GNUBG (simulation pour l'instant)
    let analysis;
    try {
      // TODO: Remplacer par appel réel au service Railway
      // const response = await fetch(`${process.env.GNUBG_SERVICE_URL}/analyze`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ board: boardState, dice, move, analysisType })
      // });
      // analysis = await response.json();
      
      // Simulation pour tests
      analysis = simulateGNUBGAnalysis(boardState, dice, move);
      
    } catch (gnubgError) {
      console.error('GNUBG service error:', gnubgError);
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: 'GNUBG service unavailable',
          message: 'Analysis service temporarily unavailable'
        })
      };
    }

    // Sauvegarder l'analyse dans Supabase
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        userId: decoded.userId,
        boardState,
        dice,
        move,
        bestMove: analysis.bestMove,
        equity: analysis.equity,
        pr: analysis.pr,
        explanation: analysis.explanation,
        alternatives: analysis.alternatives,
        analysisType,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis:', saveError);
      // Continuer quand même, l'analyse est réussie
    }

    // Mettre à jour le quota utilisateur
    // (déjà compté dans checkUserQuota)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Analysis completed successfully',
        data: {
          ...analysis,
          analysisId: savedAnalysis?.id,
          quotaRemaining: quotaCheck.remaining - 1,
          processedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('GNUBG analysis error:', error);
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
