const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = "postgresql://postgres.rcfnyuooseadeqmunrqm:sudhalekshmi2005@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    console.log('Clearing PomodoroSessions...');
    try { await prisma.pomodoroSession.deleteMany({}); } catch(e) {}
    
    console.log('Clearing Topics...');
    try { await prisma.topic.deleteMany({}); } catch(e) {}
    
    console.log('Clearing Exams...');
    try { await prisma.exam.deleteMany({}); } catch(e) {}
    
    console.log('Clearing StudySessions...');
    try { await prisma.studySession.deleteMany({}); } catch(e) {}
    
    console.log('Clearing Subjects...');
    try { await prisma.subject.deleteMany({}); } catch(e) {}
    
    console.log('Clearing Tasks...');
    try { await prisma.task.deleteMany({}); } catch(e) {}
    
    console.log('Clearing Users...');
    const result = await prisma.user.deleteMany({});
    console.log(`Deleted ${result.count} users.`);

    console.log('Alternative database cleared successfully!');
  } catch (e) {
    console.error('Error during clearing:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
