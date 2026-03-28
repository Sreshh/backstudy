const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Final database schema recovery...');
  try {
    // Manually add missing columns from schema.prisma
    const queries = [
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyStudyHours" DOUBLE PRECISION DEFAULT 4.0;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyStudyGoal" DOUBLE PRECISION DEFAULT 4.0;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "streak" INTEGER DEFAULT 0;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "focusMode" BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActive" TIMESTAMP;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "course" TEXT;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "semester" TEXT;'
    ];

    for (const q of queries) {
      console.log(`Executing: ${q}`);
      await prisma.$executeRawUnsafe(q).catch(e => console.log(`Notice: Column already exists or error: ${e.message}`));
    }

    console.log('SCHEMA RECOVERY ATTEMPTED SUCCESSFULLY!');
  } catch (e) {
    console.error('CRITICAL ERROR DURING SCHEMA RECOVERY:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
