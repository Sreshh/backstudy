const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Final attempt to clear database with CASCADE order...');
  
  // Try to delete from ALL models in a safe order
  const models = ['pomodoroSession', 'topic', 'exam', 'studySession', 'task', 'subject', 'user'];
  
  for (const model of models) {
    try {
      console.log(`Clearing model: ${model}...`);
      const result = await prisma[model].deleteMany({});
      console.log(`Successfully cleared ${model}.`);
    } catch (e) {
      console.log(`Failed to clear ${model}: ${e.message}`);
    }
  }

  console.log('Verification check...');
  try {
    const userCount = await prisma.user.count();
    console.log(`Final User Count: ${userCount}`);
  } catch (e) {}

  await prisma.$disconnect();
}

main();
