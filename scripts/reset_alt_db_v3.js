const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = "postgresql://postgres.rcfnyuooseadeqmunrqm:sudhalekshmi2005@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    console.log('Clearing Users...');
    const users = await prisma.user.deleteMany({});
    console.log(`Deleted ${users.count} users.`);

    console.log('Clearing Tasks...');
    try { await prisma.task.deleteMany({}); } catch(e) { console.log('Task table issue'); }
    
    console.log('Clearing Subjects...');
    try { await prisma.subject.deleteMany({}); } catch(e) { console.log('Subject table issue'); }

    console.log('Alternative database cleared!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
