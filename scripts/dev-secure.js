#!/usr/bin/env node
/**
 * Dev Secure Script
 * Validates environment variables before starting development server
 *
 * Usage: node scripts/dev-secure.js
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Load .env file
const envPath = join(projectRoot, '.env');
if (!existsSync(envPath)) {
  logError('.env file not found!');
  log('');
  logInfo('Create .env file from template:');
  log('  cp .env.example .env', 'blue');
  log('');
  logInfo('Then fill in your credentials from:');
  log('  https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/settings/api', 'blue');
  log('');
  process.exit(1);
}

config({ path: envPath });

// Required environment variables
const requiredVars = [
  { name: 'DATABASE_URL', description: 'PostgreSQL connection string from Supabase' },
  { name: 'SUPABASE_URL', description: 'Supabase project URL' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key (server-side)' },
  { name: 'VITE_SUPABASE_ANON_KEY', description: 'Supabase anonymous key (client-side)' },
  { name: 'VITE_SUPABASE_URL', description: 'Supabase URL for client' },
  { name: 'SESSION_SECRET', description: 'JWT session secret' }
];

// Optional but recommended variables
const recommendedVars = [
  { name: 'PORT', description: 'Server port', default: '3001' },
  { name: 'NODE_ENV', description: 'Environment', default: 'development' },
  { name: 'VITE_API_URL', description: 'API URL for client', default: 'http://localhost:3001' }
];

log('');
log('🔒 K-GAY Travel Guides - Environment Validation', 'blue');
log('================================================', 'blue');
log('');

let hasErrors = false;
let hasWarnings = false;

// Validate required variables
log('📋 Checking required environment variables:', 'blue');
for (const { name, description } of requiredVars) {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    logError(`${name} is not set`);
    log(`   Description: ${description}`);
    hasErrors = true;
  } else if (value === 'your_database_url_here' ||
             value === 'your_supabase_anon_key_here' ||
             value === 'your_service_role_key_here' ||
             value === 'your_session_secret_here' ||
             value === 'https://your-project.supabase.co') {
    logError(`${name} still has placeholder value`);
    log(`   Description: ${description}`);
    hasErrors = true;
  } else {
    // Mask sensitive values for display
    const displayValue = ['SERVICE_ROLE_KEY', 'SESSION_SECRET', 'DATABASE_URL'].some(s => name.includes(s))
      ? `${value.substring(0, 20)}...`
      : value;
    logSuccess(`${name} = ${displayValue}`);
  }
}

log('');

// Check recommended variables
log('📋 Checking recommended environment variables:', 'blue');
for (const { name, description, default: defaultValue } of recommendedVars) {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    logWarning(`${name} not set (will use default: ${defaultValue})`);
    log(`   Description: ${description}`);
    hasWarnings = true;
  } else {
    logSuccess(`${name} = ${value}`);
  }
}

log('');

// Validate DATABASE_URL format
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
  if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
    logError('DATABASE_URL must start with "postgresql://"');
    hasErrors = true;
  }

  if (!process.env.DATABASE_URL.includes('supabase.co')) {
    logWarning('DATABASE_URL does not appear to be a Supabase connection string');
    hasWarnings = true;
  }
}

// Validate SUPABASE_URL format
if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project')) {
  if (!process.env.SUPABASE_URL.startsWith('https://')) {
    logError('SUPABASE_URL must start with "https://"');
    hasErrors = true;
  }

  if (!process.env.SUPABASE_URL.includes('supabase.co')) {
    logError('SUPABASE_URL must be a Supabase URL (*.supabase.co)');
    hasErrors = true;
  }
}

// Validate SESSION_SECRET strength
if (process.env.SESSION_SECRET && process.env.SESSION_SECRET !== 'your_session_secret_here') {
  if (process.env.SESSION_SECRET.length < 32) {
    logWarning('SESSION_SECRET should be at least 32 characters long');
    log('   Generate a strong secret with: openssl rand -base64 32');
    hasWarnings = true;
  }
}

log('');
log('================================================', 'blue');

// Final validation result
if (hasErrors) {
  log('');
  logError('Environment validation failed!');
  log('');
  logInfo('Please fix the errors above and try again.');
  log('');
  logInfo('Get your credentials from:');
  log('  https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/settings/api', 'blue');
  log('');
  process.exit(1);
}

if (hasWarnings) {
  log('');
  logWarning('Environment validation passed with warnings.');
  log('');
  logInfo('Consider fixing the warnings above for better security.');
  log('');
}

if (!hasErrors && !hasWarnings) {
  log('');
  logSuccess('All environment variables validated successfully!');
  log('');
}

logInfo('Starting development server...');
log('');