const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connecté à PostgreSQL');
    
    // Test création joueur
    const player = await prisma.player.create({
      data: { name: 'Test User', email: 'test@example.com' }
    });
    console.log('✅ Joueur créé:', player);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

test();