const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP');
    console.log('completedAt column added to Task table');
  } catch (e) {
    console.log('Column may already exist:', e.message?.substring(0, 60));
  } finally {
    await prisma.$disconnect();
  }
}
main();
