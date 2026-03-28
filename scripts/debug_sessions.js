const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  // Check all sessions
  const sessions = await prisma.studySession.findMany({
    include: { subject: { select: { name: true, userId: true } } },
    orderBy: { startTime: 'asc' },
  });

  console.log(`Total sessions in DB: ${sessions.length}`);
  
  if (sessions.length === 0) {
    console.log('NO SESSIONS FOUND - plan was never generated or failed to save');
  } else {
    sessions.forEach(s => {
      console.log(`  ID:${s.id} | Subject: ${s.subject?.name} | Start: ${s.startTime.toISOString()} | End: ${s.endTime.toISOString()} | User: ${s.subject?.userId}`);
    });
  }

  // Check what "today" means
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  console.log(`\nServer NOW:    ${now.toISOString()}`);
  console.log(`Today start:   ${todayStart.toISOString()}`);
  console.log(`Today end:     ${todayEnd.toISOString()}`);

  // Filter today's sessions
  const todaySessions = sessions.filter(s => 
    s.startTime >= todayStart && s.startTime <= todayEnd
  );
  console.log(`\nToday's sessions: ${todaySessions.length}`);
  todaySessions.forEach(s => {
    console.log(`  ${s.subject?.name}: ${s.startTime.toISOString()} - ${s.endTime.toISOString()}`);
  });

  await prisma.$disconnect();
}
main();
