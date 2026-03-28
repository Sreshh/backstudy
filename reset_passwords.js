const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const result = await prisma.user.updateMany({
    data: { password: hashedPassword }
  });
  console.log(`Updated ${result.count} users successfully.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
