// Netlify Function - User Profile
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
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
