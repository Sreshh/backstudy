const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'testuser@example.com' },
    data: { role: 'admin' }
  });
  console.log("User promoted to admin:", user.email, "Role:", user.role);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
