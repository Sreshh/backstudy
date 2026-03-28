const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing Role Enum conflict...');
  try {
    // 1. Drop the constraint/type link
    console.log('Changing User.role type to TEXT...');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ALTER COLUMN role TYPE TEXT;');
    
    // 2. Drop the enum type itself if possible
    console.log('Dropping legacy Role enum...');
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "Role" CASCADE;');

    console.log('ROLE ENUM CONFLICT FIXED!');
  } catch (e) {
    console.error('Error fixing Role enum:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
