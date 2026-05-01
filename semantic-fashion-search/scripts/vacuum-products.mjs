// save as scripts/vacuum-products.mjs and run: node scripts/vacuum-products.mjs                                                                                                               
  import dotenv from 'dotenv';                                                                                                                                                                   
  import pg from 'pg';
  import { fileURLToPath } from 'url';
  import { dirname, join } from 'path';

  const __dirname = dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: join(__dirname, '..', '.env.local') });

  const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });

  console.log('Running VACUUM FULL on products table...');
  await pool.query('VACUUM FULL products');
  console.log('VACUUM FULL complete.');
  await pool.query('ANALYZE products');
  console.log('ANALYZE complete.');
  await pool.end();