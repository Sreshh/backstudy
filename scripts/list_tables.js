const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = "postgresql://postgres.rcfnyuooseadeqmunrqm:sudhalekshmi2005@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables in public schema:', tables);
  } catch (e) {
    console.error('Error fetching tables:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
