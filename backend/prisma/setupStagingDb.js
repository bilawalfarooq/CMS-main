import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('--- Step 1: Checking PostgreSQL connection & provisioning educore_staging database ---');
  
  const currentDbUrl = process.env.DATABASE_URL;
  if (!currentDbUrl) {
    throw new Error('DATABASE_URL is not defined in environment.');
  }

  const urlObj = new URL(currentDbUrl);
  urlObj.pathname = '/postgres';
  const rootUrl = urlObj.toString();

  urlObj.pathname = '/educore_staging';
  const stagingUrl = urlObj.toString();

  const rootPrisma = new PrismaClient({
    datasources: { db: { url: rootUrl } },
  });

  try {
    const existing = await rootPrisma.$queryRaw`
      SELECT 1 FROM pg_database WHERE datname = 'educore_staging';
    `;

    if (existing.length === 0) {
      console.log('Database educore_staging does not exist. Creating...');
      await rootPrisma.$executeRawUnsafe('CREATE DATABASE educore_staging;');
      console.log('Database educore_staging created successfully.');
    } else {
      console.log('Database educore_staging already exists.');
    }
  } catch (err) {
    console.log('Notice during database creation:', err.message);
  } finally {
    await rootPrisma.$disconnect();
  }

  console.log('--- Step 2: Applying Prisma migrations to educore_staging ---');
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: stagingUrl },
      stdio: 'inherit',
    });
    console.log('Prisma migrations successfully applied to educore_staging.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }

  console.log('--- Step 3: Seeding isolated synthetic school data into educore_staging ---');
  try {
    execSync('node prisma/seed.js', {
      env: { ...process.env, DATABASE_URL: stagingUrl },
      stdio: 'inherit',
    });
    console.log('Synthetic staging records seeded successfully.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }

  console.log('--- Step 4: Verifying record isolation in educore_staging ---');
  const stagingPrisma = new PrismaClient({
    datasources: { db: { url: stagingUrl } },
  });

  try {
    const [students, users, staff, invoices] = await Promise.all([
      stagingPrisma.student.count(),
      stagingPrisma.user.count(),
      stagingPrisma.staff.count(),
      stagingPrisma.invoice.count(),
    ]);

    console.log('Staging Database Counts:');
    console.log(`- Students: ${students}`);
    console.log(`- Users: ${users}`);
    console.log(`- Staff: ${staff}`);
    console.log(`- Invoices: ${invoices}`);
    console.log('--- Staging Database Deployment Verified! ---');
  } finally {
    await stagingPrisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
