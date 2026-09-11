import prisma from './config/database.js';

async function init() {
  try {
    console.log('Ensuring PostgreSQL pgvector extension exists...');
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log('PostgreSQL pgvector extension ready.');
  } catch (err) {
    console.warn('PostgreSQL extension check notice:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

init();
