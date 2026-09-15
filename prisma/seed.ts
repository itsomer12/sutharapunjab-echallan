import 'dotenv/config';
import { PrismaClient } from './generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminUsername || !adminPassword) {
    throw new Error(
      'Set ADMIN_USERNAME and ADMIN_PASSWORD before running the production seed.'
    );
  }

  // Create the initial admin without committing a deployable default password.
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      name: 'System Administrator',
      cnic: '00000-0000000-0',
      contactNo: '0000-0000000',
      town: null, // nullable for ADMIN
      staffId: 'ADMIN-001',
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Admin user created: ${admin.username} (id: ${admin.id})`);

  // Initialize the notice counter
  await prisma.noticeCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, value: 0 },
  });

  console.log('✅ Notice counter initialized at 0');
  console.log('🌱 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
