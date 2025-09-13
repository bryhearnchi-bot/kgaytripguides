import { config } from 'dotenv';
config();

console.log('🔍 Debugging database connection...\n');

console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
console.log('Starts with "file:"?', process.env.DATABASE_URL?.startsWith('file:'));
console.log('Starts with "postgresql:"?', process.env.DATABASE_URL?.startsWith('postgresql:'));

if (process.env.DATABASE_URL?.startsWith('file:')) {
  console.log('❌ ISSUE: Application will use SQLite (dev.db)');
} else {
  console.log('✅ GOOD: Application will use PostgreSQL (Neon)');
}

// Check if dev.db exists
import { existsSync } from 'fs';
const devDbExists = existsSync('./dev.db');
console.log('\ndev.db file exists:', devDbExists);

if (devDbExists) {
  console.log('⚠️  WARNING: dev.db file is present and might interfere');
}