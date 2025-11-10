// Netlify Function - Login Debug Version
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event, context) => {
  // Headers CORS
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

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔍 Login function started');
    
    // Parse body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }

    const { email, password } = body;
    console.log('📧 Login attempt for:', email);

    // Validation
    if (!email || !password) {
      console.error('❌ Missing email or password');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password required' })
      };
    }

    // Get user
    console.log('🔍 Looking up user...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('❌ User lookup error:', userError.message);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    if (!user) {
      console.error('❌ User not found');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    console.log('✅ User found:', user.username);

    // Check if user is active
    if (!user.isActive) {
      console.error('❌ User is not active');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Account is disabled' })
      };
    }

    // Verify password
    console.log('🔐 Verifying password...');
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('❌ Bcrypt error:', bcryptError.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Password verification failed' })
      };
    }

    if (!isValidPassword) {
      console.error('❌ Invalid password');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    console.log('✅ Password valid');

    // Generate JWT
    console.log('🔑 Generating JWT...');
    let token;
    try {
      const payload = {
        userId: user.id,
        email: user.email,
        username: user.username
      };
      token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    } catch (jwtError) {
      console.error('❌ JWT generation error:', jwtError.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Token generation failed' })
      };
    }

    console.log('✅ JWT generated successfully');

    // Update last login
    try {
      await supabase
        .from('users')
        .update({ lastLoginAt: new Date().toISOString() })
        .eq('id', user.id);
    } catch (updateError) {
      console.warn('⚠️ Could not update last login:', updateError.message);
    }

    // Success response
    const response = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        elo: user.elo,
        subscriptionType: user.subscriptionType,
        level: user.level
      },
      token: token
    };

    console.log('🎉 Login successful for:', user.username);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('📍 Stack:', error.stack);
    
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
