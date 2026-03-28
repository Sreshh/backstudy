const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = "postgresql://postgres.rcfnyuooseadeqmunrqm:sudhalekshmi2005@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    const userCount = await prisma.user.count();
    console.log(`Alternative Database (Pooler) State:`);
    console.log(`Users: ${userCount}`);
    
    if (userCount > 0) {
      console.log('Clearing data from alternative database...');
      // Use raw truncation to be safe and avoid missing table errors if some models aren't fully synced
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "User", "Task", "Subject", "Topic", "Exam", "StudySession", "PomodoroSession" RESTART IDENTITY CASCADE;');
      console.log('Alternative database cleared!');
    }
  } catch (e) {
    console.error('Error clearing database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
