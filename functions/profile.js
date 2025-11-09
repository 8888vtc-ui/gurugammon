// Netlify Function - User Profile
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
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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

  try {
    // Extraire le token du header Authorization
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

    // GET - Récupérer le profil
    if (event.httpMethod === 'GET') {
      const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'])) || 'unknown';
      const rl = rateLimit(`${ip}:profile:get`, 60 * 1000, 60);
      if (!rl.allowed) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Too many requests', retryAfterSeconds: Math.ceil((rl.reset - Date.now())/1000) })
        };
      }
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          username,
          avatar,
          level,
          elo,
          subscriptionType,
          isActive,
          emailVerified,
          createdAt,
          lastLoginAt
        `)
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      // Récupérer les statistiques de jeu
      const { data: stats } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('userId', decoded.userId)
        .order('date', { ascending: false })
        .limit(10);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            user,
            recentStats: stats || []
          }
        })
      };
    }

    // PUT - Mettre à jour le profil
    if (event.httpMethod === 'PUT') {
      const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'])) || 'unknown';
      const rl = rateLimit(`${ip}:profile:put`, 60 * 1000, 10);
      if (!rl.allowed) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Too many requests', retryAfterSeconds: Math.ceil((rl.reset - Date.now())/1000) })
        };
      }
      const { username, avatar } = JSON.parse(event.body);
      const updateData = {};

      // Validation et mise à jour username
      if (username && username.length >= 3) {
        // Vérifier si username déjà pris
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .neq('id', decoded.userId)
          .single();

        if (existingUser) {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ error: 'Username already taken' })
          };
        }

        updateData.username = username;
      }

      // Mise à jour avatar
      if (avatar !== undefined) {
        updateData.avatar = avatar;
      }

      // Si rien à mettre à jour
      if (Object.keys(updateData).length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No valid fields to update' })
        };
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', decoded.userId)
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update profile' })
        };
      }

      // Retourner utilisateur mis à jour (sans password)
      const { password: _, ...userResponse } = updatedUser;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Profile updated successfully',
          data: {
            user: userResponse
          }
        })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Profile error:', error);
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
