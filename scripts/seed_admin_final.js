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

    // Highly simplified raw SQL to avoid parameter issues
    await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'admin',
        name
      },
      create: {
        email,
        password: hashedPassword,
        name,
        role: 'admin'
      }
    });

    console.log('Admin user seeded successfully via SIMPLIFIED RAW SQL!');
  } catch (e) {
    console.error('Error seeding admin via SIMPLIFIED RAW SQL:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
