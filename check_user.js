const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'testuser@example.com' }
  });
  console.log("User:", user ? "Found" : "Not Found");
  if (user) {
    console.log("Email:", user.email);
    console.log("Role:", user.role);
  } else {
    const allUsers = await prisma.user.findMany({ select: { email: true } });
    console.log("All users:", allUsers.map(u => u.email));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
