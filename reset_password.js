const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.update({
    where: { email: 'testuser@example.com' },
    data: { password: hashedPassword }
  });
  console.log("Password reset successful for:", user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
