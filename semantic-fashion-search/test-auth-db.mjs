import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: '.env.local' });

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Create Prisma client
const prisma = new PrismaClient({ adapter });

async function testAuthDatabase() {
  try {
    console.log('Testing Prisma connection with auth tables...');

    // Test users table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible: ${userCount} users found`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      console.log('\nExisting users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Created: ${user.createdAt}`);
      });
    }

    // Test accounts table
    const accountCount = await prisma.account.count();
    console.log(`\n✅ Accounts table accessible: ${accountCount} accounts found`);

    // Test sessions table
    const sessionCount = await prisma.session.count();
    console.log(`✅ Sessions table accessible: ${sessionCount} sessions found`);

    console.log('\n✅ All authentication tables are working correctly!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testAuthDatabase();
