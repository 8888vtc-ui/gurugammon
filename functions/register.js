/**
 * Netlify Function - Register (Serverless)
 * Fast user registration endpoint for global CDN
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
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
    const { email, username, password, firstName, lastName } = JSON.parse(event.body);

    // Validate input
    if (!email || !username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Email, username and password are required'
        })
      };
    }

    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Password must be at least 8 characters'
        })
      };
    }

    // Check if user already exists (using 'user' singular)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          error: `This ${field} is already registered`
        })
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with schema-compliant fields
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        avatar: null,
        level: 'BEGINNER',
        elo: 1500,
        subscriptionType: 'FREE',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
    });

    // Generate access token
    const accessToken = jwt.sign(
      { userId: user.id, type: 'access' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword,
        tokens: {
          accessToken,
          expiresIn: 3600
        }
      })
    };

  } catch (error) {
    console.error('Register function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
