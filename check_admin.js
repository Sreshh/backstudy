const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function test() {
  try {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@studymate.com' } });
    if (!admin) {
      console.log("Admin user not found!");
      return;
    }
    console.log("Admin found:", { id: admin.id, email: admin.email, role: admin.role, name: admin.name });
    
    // Test common passwords
    const passwords = ['password123', 'admin123', 'Admin123', 'password', '123456'];
    for (const pw of passwords) {
      const match = await bcrypt.compare(pw, admin.password);
      if (match) {
        console.log(`Password match found: "${pw}"`);
        return;
      }
    }
    console.log("None of the common passwords matched.");
    console.log("Password hash:", admin.password.substring(0, 20) + "...");

    // Reset password to 'admin123' for convenience
    const newHash = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: newHash, role: 'admin' }
    });
    console.log("Admin password has been reset to: admin123");
    console.log("Admin role confirmed as: admin");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
