import { prisma } from '../src/lib/db';

async function main() {
  try {
    console.log('Adding violation_image_url column...');
    await prisma.$executeRawUnsafe('ALTER TABLE challans ADD COLUMN IF NOT EXISTS violation_image_url TEXT;');
    console.log('Column added successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
