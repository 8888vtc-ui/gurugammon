// src/config/index.ts

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`CRITICAL: Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`);
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET, // Now guaranteed to exist
  databaseUrl: process.env.DATABASE_URL, // Now guaranteed to exist
};
