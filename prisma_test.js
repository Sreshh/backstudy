const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst({
      include: {
        subjects: {
          include: {
            topics: { where: { isCompleted: false } },
            exams: { orderBy: { date: "asc" }, take: 1 },
          },
        },
        tasks: { where: { isCompleted: false }, take: 5 },
      },
    });
    console.log("Success findUnique:", !!user);
    if (!user) console.log("No user found");
  } catch (error) {
    console.error("Error with Prisma:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
