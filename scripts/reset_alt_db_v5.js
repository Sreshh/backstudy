const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = "postgresql://postgres.rcfnyuooseadeqmunrqm:sudhalekshmi2005@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    console.log('1. Clearing PomodoroSessions...');
    await prisma.pomodoroSession.deleteMany({});
    
    console.log('2. Clearing Topics...');
    await prisma.topic.deleteMany({});
    
    console.log('3. Clearing Exams...');
    await prisma.exam.deleteMany({});
    
    console.log('4. Clearing StudySessions...');
    await prisma.studySession.deleteMany({});
    
    console.log('5. Clearing Tasks...');
    await prisma.task.deleteMany({});

    console.log('6. Clearing Subjects...');
    await prisma.subject.deleteMany({});
    
    console.log('7. Clearing Users...');
    const result = await prisma.user.deleteMany({});
    console.log(`Deleted ${result.count} users.`);

    console.log('Alternative database cleared successfully!');
  } catch (e) {
    console.error('CRITICAL ERROR DURING CLEARING:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
