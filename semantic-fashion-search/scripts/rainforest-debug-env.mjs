import fs from 'fs';
import path from 'path';

console.log('🔍 Rainforest Environment Debug\n');

console.log('Current working directory:', process.cwd());
console.log('Script location:', import.meta.url);

// Try multiple paths
const paths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), 'semantic-fashion-search', '.env.local'),
  path.join(process.cwd(), '..', '.env.local'),
  '/Users/Owner/.claude/projects/semantic-fashion-search/semantic-fashion-search/.env.local',
];

console.log('\nChecking for .env.local file:\n');

for (const envPath of paths) {
  const exists = fs.existsSync(envPath);
  console.log(`${exists ? '✓' : '✗'} ${envPath}`);

  if (exists) {
    console.log('  → File found!');
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const rainforestLine = envFile.split('\n').find(line => line.startsWith('RAINFOREST_API_KEY'));
    if (rainforestLine) {
      const [key, value] = rainforestLine.split('=');
      console.log(`  → Key found: ${key} = ${value ? value.substring(0, 10) + '...' : 'undefined'}`);
    }
  }
}

console.log('\nLoading environment variables...\n');

// Try loading from detected path
for (const envPath of paths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading from: ${envPath}`);
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const envLines = envFile.split('\n');
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
    break;
  }
}

console.log('Environment variables loaded:');
console.log('  RAINFOREST_API_KEY:', process.env.RAINFOREST_API_KEY ? 'Loaded ✓' : 'NOT FOUND ✗');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded ✓' : 'NOT FOUND ✗');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded ✓' : 'NOT FOUND ✗');

if (process.env.RAINFOREST_API_KEY) {
  console.log('\n✅ API key is loaded and ready!');
} else {
  console.log('\n❌ API key not found! The import script will fail.');
}
