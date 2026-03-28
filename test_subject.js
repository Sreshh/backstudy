const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const res = await prisma.subject.create({
      data: {
        name: 'Test Subject',
        difficulty: 3,
        priority: 3,
        userId: 1, // Assuming userId 1 exists
        topics: {
          create: [{ name: 'Test Topic', difficulty: 3 }]
        }
      }
    });
    console.log(res);
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
