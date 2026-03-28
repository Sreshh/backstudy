const prisma = require('../db');

async function main() {
  try {
    const userCount = await prisma.user.count();
    const subjectCount = await prisma.subject.count();
    const taskCount = await prisma.task.count();
    const topicCount = await prisma.topic.count();
    console.log(`Current Database State:`);
    console.log(`Users: ${userCount}`);
    console.log(`Subjects: ${subjectCount}`);
    console.log(`Tasks: ${taskCount}`);
    console.log(`Topics: ${topicCount}`);
  } catch (e) {
    console.error('Error checking database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
