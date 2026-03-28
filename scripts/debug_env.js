const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  console.log('DATABASE_URL from .env:', process.env.DATABASE_URL);
  // Also check if .env旋 exists and read it
  const fs = require('fs');
  try {
     const data = fs.readFileSync('.env\u65cb', 'utf8');
     console.log('.env\u65cb contents:', data);
  } catch (e) {
     console.log('.env\u65cb not found or readable via fs');
  }
}

main();
