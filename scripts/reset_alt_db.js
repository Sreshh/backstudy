const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = "postgresql://postgres.rcfnyuooseadeqmunrqm:sudhalekshmi2005@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
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
      console.log('Data found in alternative database! Clearing now...');
      await prisma.pomodoroSession.deleteMany();
      await prisma.topic.deleteMany();
      await prisma.exam.deleteMany();
      await prisma.studySession.deleteMany();
      await prisma.subject.deleteMany();
      await prisma.task.deleteMany();
      await prisma.user.deleteMany();
      console.log('Alternative database cleared!');
    } else {
      console.log('Alternative database is already empty.');
    }
  } catch (e) {
    console.error('Error clearing alternative database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
