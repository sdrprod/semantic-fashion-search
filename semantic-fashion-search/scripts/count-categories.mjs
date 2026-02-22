import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
for (const line of envFile.split('\n')) {
  const eqIdx = line.indexOf('=');
  if (eqIdx > 0) {
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (key && val) process.env[key] = val;
  }
}

const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Paginate through all products
const counts = {};
let from = 0;
const pageSize = 1000;
let total = 0;

while (true) {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .range(from, from + pageSize - 1);

  if (error) { console.error(error); process.exit(1); }
  if (!data || data.length === 0) break;

  for (const row of data) {
    const key = row.category || 'NULL';
    counts[key] = (counts[key] || 0) + 1;
  }
  total += data.length;
  from += pageSize;
  if (data.length < pageSize) break;
}

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
console.log('Category counts:');
for (const [k, v] of sorted) console.log(String(v).padStart(6), k);
console.log('\nTotal products:', total);
console.log('Categories with < 50 products:', sorted.filter(([,v]) => v < 50).map(([k,v]) => `${k} (${v})`).join(', ') || 'none');
