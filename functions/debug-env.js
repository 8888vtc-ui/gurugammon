// Function de debug pour vérifier les environment variables
exports.handler = async (event, context) => {
  console.log('🔍 DEBUG ENVIRONMENT VARIABLES');
  
  const envVars = {
    NODE_VERSION: process.env.NODE_VERSION || 'MISSING',
    DATABASE_URL: process.env.DATABASE_URL ? 'PRESENT' : 'MISSING',
    SUPABASE_URL: process.env.SUPABASE_URL || 'MISSING',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'PRESENT' : 'MISSING',
    JWT_SECRET: process.env.JWT_SECRET || 'MISSING',
    GNUBG_SERVICE_URL: process.env.GNUBG_SERVICE_URL || 'MISSING',
    GNUBG_API_KEY: process.env.GNUBG_API_KEY || 'MISSING'
  };

  console.log('Environment Variables Status:', envVars);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Environment variables debug',
      environment: envVars,
      timestamp: new Date().toISOString()
    })
  };
};
