const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'adithyanvs105@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const isMatch = await bcrypt.compare('password123', user.password);
  console.log(`Password check for ${email}: ${isMatch ? 'MATCH' : 'FAIL'}`);
  console.log(`Hashed password in DB: ${user.password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
