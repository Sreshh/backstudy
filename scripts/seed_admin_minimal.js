const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@studymate.com';
  const password = 'admin123';
  const name = 'Admin User';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Seeding Admin: ${email}`);

    // Insert only with columns that we KNOW exist
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" (email, password, name, role, "createdAt")
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (email) DO UPDATE 
      SET role = 'admin', password = $2;
    `, email, hashedPassword, name, 'admin');

    console.log('Admin user seeded successfully via RAW SQL!');
  } catch (e) {
    console.error('Error seeding admin via RAW SQL:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
