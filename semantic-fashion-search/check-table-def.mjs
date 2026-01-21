import pg from 'pg';
const { Client } = pg;
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Parse the Supabase URL to get database connection details
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// For Supabase, we need to use the connection pooler or direct connection
// The connection string format is: postgresql://postgres:[password]@[host]:5432/postgres
// We'll need to construct this from the Supabase URL

console.log('Supabase URL:', supabaseUrl);
console.log('\nNote: To check the actual column type, we need direct PostgreSQL access.');
console.log('You can check this in the Supabase dashboard under Database > Tables > products');
console.log('\nAlternatively, run this SQL query in the Supabase SQL Editor:');
console.log(`
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name = 'embedding';
`);

console.log('\nIf the udt_name is "vector", the column is correctly typed.');
console.log('If it shows "text" or "varchar", the column needs to be altered to vector(1536).');
