const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  const queries = [
    'ALTER TABLE "StudySession" ADD COLUMN IF NOT EXISTS "isDone" BOOLEAN DEFAULT FALSE',
    'ALTER TABLE "StudySession" ADD COLUMN IF NOT EXISTS "focusTopic" TEXT',
    'ALTER TABLE "StudySession" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()',
  ];
  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log('OK:', q.substring(0, 50));
    } catch (e) {
      console.log('SKIP:', e.message?.substring(0, 60));
    }
  }

  // Test: verify we can create and delete a session
  try {
    // Get first subject
    const subject = await prisma.subject.findFirst();
    if (subject) {
      const session = await prisma.studySession.create({
        data: {
          subjectId: subject.id,
          startTime: new Date(),
          endTime: new Date(Date.now() + 60 * 60 * 1000),
        }
      });
      console.log('Test session created:', session.id);
      await prisma.studySession.delete({ where: { id: session.id } });
      console.log('Test session deleted. StudySession creation WORKS!');
    } else {
      console.log('No subjects found - add a subject first');
    }
  } catch (e) {
    console.error('Session test failed:', e.message);
  }

  await prisma.$disconnect();
}
main();
