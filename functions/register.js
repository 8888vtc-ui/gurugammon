// Netlify Function - Auth Register
const bcrypt = require('bcryptjs');
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
    const rl = rateLimit(`${ip}:register`, 60 * 1000, 3);
    if (!rl.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Too many requests', retryAfterSeconds: Math.ceil((rl.reset - Date.now())/1000) })
      };
    }

    const { email, password, username } = JSON.parse(event.body);

    // Validation
    if (!email || !password || !username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Email, password and username required' 
        })
      };
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    // Validation password (min 6 caractères)
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Password must be at least 6 characters' 
        })
      };
    }

    // Validation username (min 3 caractères)
    if (username.length < 3) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Username must be at least 3 characters' 
        })
      };
    }

    // Vérifier si email déjà utilisé
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Email already registered' })
      };
    }

    // Vérifier si username déjà utilisé
    const { data: existingUsername } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Username already taken' })
      };
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Données à insérer
    const userData = {
      id: createId(),
      email,
      password: hashedPassword,
      username,
      level: 'BEGINNER',
      elo: 1500,
      subscriptionType: 'FREE',
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    console.log('Inserting user data:', JSON.stringify(userData, null, 2));

    // Créer le nouvel utilisateur
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (createError) {
      console.error('Create user error:', JSON.stringify(createError, null, 2));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create user',
          details: createError.message,
          code: createError.code
        })
      };
    }

    // Retourner succès (sans mot de passe)
    const { password: _, ...userResponse } = newUser;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse
        }
      })
    };

  } catch (error) {
    console.error('Register error:', error);
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
