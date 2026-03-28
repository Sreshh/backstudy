const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting FINAL database reset with CURRENT .env URL...');
  try {
    // Delete in order to satisfy foreign key constraints
    console.log('1. Clearing PomodoroSessions...');
    try { await prisma.pomodoroSession.deleteMany(); } catch(e) { console.log('PomodoroSession table not found/skipped'); }
    
    console.log('2. Clearing Topics...');
    try { await prisma.topic.deleteMany(); } catch(e) { console.log('Topic table not found/skipped'); }
    
    console.log('3. Clearing Exams...');
    await prisma.exam.deleteMany();
    
    console.log('4. Clearing StudySessions...');
    await prisma.studySession.deleteMany();
    
    console.log('5. Clearing Tasks...');
    await prisma.task.deleteMany();

    console.log('6. Clearing Subjects...');
    await prisma.subject.deleteMany();
    
    console.log('7. Clearing Users...');
    const result = await prisma.user.deleteMany();
    console.log(`Deleted ${result.count} users.`);

    console.log('DATABASE CLEARED SUCCESSFULLY!');
  } catch (e) {
    console.error('CRITICAL ERROR DURING FINAL RESET:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
