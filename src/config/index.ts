// src/config/index.ts
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
