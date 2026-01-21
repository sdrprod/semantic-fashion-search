import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

console.log('Testing connection to:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);

try {
  await client.connect();
  console.log('✅ Connection successful!');

  const result = await client.query('SELECT version()');
  console.log('Database version:', result.rows[0].version);

  await client.end();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
