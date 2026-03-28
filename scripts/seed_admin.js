const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@studymate.com';
  const password = 'admin123';
  const name = 'Admin User';

  console.log(`Creating admin user: ${email}...`);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists (shouldn't since I purged, but just in case)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
       console.log('User already exists. Updating to admin...');
       await prisma.user.update({
         where: { email },
         data: { role: 'admin', password: hashedPassword }
       });
    } else {
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'admin'
        }
      });
    }

    console.log('Admin user created/updated successfully!');
  } catch (e) {
    console.error('Error seeding admin:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
