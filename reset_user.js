const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'adithyanvs105@gmail.com';
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`Updated password for ${email}`);
  const isMatch = await bcrypt.compare('password123', user.password);
  console.log(`Immediate Verification: ${isMatch ? 'MATCH' : 'FAIL'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
