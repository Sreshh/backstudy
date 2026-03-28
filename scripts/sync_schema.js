const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Syncing all tables to match Prisma schema...');
  try {
    const queries = [
      // User table
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "description" TEXT;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyStudyHours" DOUBLE PRECISION DEFAULT 4.0;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyStudyGoal" DOUBLE PRECISION DEFAULT 4.0;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "streak" INTEGER DEFAULT 0;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "focusMode" BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActive" TIMESTAMP;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "course" TEXT;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "semester" TEXT;',

      // Subject table
      'CREATE TABLE IF NOT EXISTS "Subject" (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, difficulty INTEGER DEFAULT 3, priority INTEGER DEFAULT 3, "userId" INTEGER REFERENCES "User"(id), "createdAt" TIMESTAMP DEFAULT NOW());',

      // Topic table
      'CREATE TABLE IF NOT EXISTS "Topic" (id SERIAL PRIMARY KEY, name TEXT NOT NULL, difficulty INTEGER DEFAULT 3, "isCompleted" BOOLEAN DEFAULT FALSE, "subjectId" INTEGER REFERENCES "Subject"(id), "createdAt" TIMESTAMP DEFAULT NOW());',

      // Exam table
      'CREATE TABLE IF NOT EXISTS "Exam" (id SERIAL PRIMARY KEY, date TIMESTAMP NOT NULL, "subjectId" INTEGER REFERENCES "Subject"(id), "createdAt" TIMESTAMP DEFAULT NOW());',

      // Task table  
      'CREATE TABLE IF NOT EXISTS "Task" (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, "isCompleted" BOOLEAN DEFAULT FALSE, "dueDate" TIMESTAMP, "userId" INTEGER REFERENCES "User"(id), "createdAt" TIMESTAMP DEFAULT NOW());',

      // StudySession table
      'CREATE TABLE IF NOT EXISTS "StudySession" (id SERIAL PRIMARY KEY, "startTime" TIMESTAMP NOT NULL, "endTime" TIMESTAMP NOT NULL, "focusTopic" TEXT, "subjectId" INTEGER REFERENCES "Subject"(id), "createdAt" TIMESTAMP DEFAULT NOW());',

      // PomodoroSession table
      'CREATE TABLE IF NOT EXISTS "PomodoroSession" (id SERIAL PRIMARY KEY, duration INTEGER NOT NULL, "completedAt" TIMESTAMP DEFAULT NOW(), "userId" INTEGER REFERENCES "User"(id));',

      // Add any missing columns to existing tables
      'ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "description" TEXT;',
      'ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "difficulty" INTEGER DEFAULT 3;',
      'ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 3;',
      'ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();',
      'ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "difficulty" INTEGER DEFAULT 3;',
      'ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP;',
      'ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE "StudySession" ADD COLUMN IF NOT EXISTS "focusTopic" TEXT;',
    ];

    for (const q of queries) {
      try {
        await prisma.$executeRawUnsafe(q);
        console.log('OK:', q.substring(0, 60));
      } catch (e) {
        console.log('SKIP:', q.substring(0, 60), '-', e.message?.substring(0, 50));
      }
    }

    console.log('\nSCHEMA SYNC COMPLETE!');

    // Test: create a subject
    try {
      const test = await prisma.subject.create({
        data: { name: 'Test Subject', difficulty: 3, priority: 3, userId: 1 },
      });
      console.log('Test subject created:', test);
      await prisma.subject.delete({ where: { id: test.id } });
      console.log('Test subject deleted. Subject creation is WORKING!');
    } catch(e) {
      console.log('Subject creation test failed:', e.message?.substring(0, 80));
    }
  } catch (e) {
    console.error('CRITICAL ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
