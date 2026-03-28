const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Final database purge using raw SQL CASCADE...');
  try {
    // 1. Get all table names from the public schema
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables to clear:', tables.map(t => t.tablename).join(', '));

    // 2. Formulate and execute TRUNCATE command for all tables
    if (tables.length > 0) {
      const tableList = tables.map(t => `"${t.tablename}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
      console.log('ALL TABLES CLEARED SUCCESSFULLY!');
    } else {
      console.log('No tables found to clear.');
    }

    // 3. Verification
    const userCount = await prisma.user.count().catch(() => 0);
    console.log(`Verification - Users: ${userCount}`);
  } catch (e) {
    console.error('CRITICAL ERROR DURING RAW PURGE:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
