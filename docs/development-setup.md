# Development Environment Setup

This document outlines the proper development environment configuration for K-GAY Travel Guides.

## Environment Configuration

### Live Database Connection
- **ALWAYS uses live Supabase database** - never mock data
- Database URL: `postgresql://postgres:****@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres`
- Environment enforced: `USE_MOCK_DATA=false`

### Configuration Files
- **`.env.local`** - Contains all necessary environment variables
- **Scripts** - Pre-configured startup scripts for consistent environment

## Starting Development Servers

### Main Branch (Port 3001)
```bash
# Option 1: Use npm script (recommended)
npm run dev:main

# Option 2: Use script directly
./scripts/start-dev.sh

# Option 3: Manual (not recommended)
DATABASE_URL="postgresql://postgres:qRlGhCf4xnNXCeBF@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres" npm run dev
```

### UI Redesign Branch (Port 3002)
```bash
# Switch to redesign branch first
git checkout ui-redesign

# Option 1: Use npm script (recommended)
npm run dev:redesign

# Option 2: Use script directly
./scripts/start-redesign-dev.sh
```

## Dual Development Servers

To run both versions side-by-side for comparison:

1. **Terminal 1** (Main branch on port 3001):
   ```bash
   git checkout main
   npm run dev:main
   ```

2. **Terminal 2** (UI redesign on port 3002):
   ```bash
   git checkout ui-redesign
   npm run dev:redesign
   ```

3. **Access URLs**:
   - Main: http://localhost:3001
   - Redesign: http://localhost:3002

## Environment Variables

All environment variables are configured in `.env.local`:

```bash
# Database (Live Supabase - NEVER mock)
DATABASE_URL="postgresql://postgres:qRlGhCf4xnNXCeBF@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres"

# Supabase Configuration
SUPABASE_URL="https://bxiiodeyqvqqcgzzqzvt.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Server Configuration
PORT=3001  # (or 3002 for redesign)
NODE_ENV=development
USE_MOCK_DATA=false  # NEVER set to true
```

## Railway Deployment

### Main Branch
- Uses `railway.json` configuration
- Deploys from `main` branch

### UI Redesign Branch
- Uses `railway-ui-redesign.json` configuration
- Deploys from `ui-redesign` branch

## Troubleshooting

### Server Won't Start
1. Kill existing processes: `pkill -f "npm run dev"`
2. Wait 2 seconds for cleanup
3. Use provided scripts: `npm run dev:main` or `npm run dev:redesign`

### Database Connection Issues
- Verify `.env.local` exists and has correct DATABASE_URL
- Ensure `USE_MOCK_DATA=false` (never true)
- Check Supabase credentials are current

### Port Conflicts
- Main branch: Always use port 3001
- Redesign branch: Always use port 3002
- Kill conflicting processes: `lsof -ti:PORT | xargs kill -9`

## Important Notes

- **NEVER use mock data** - always connect to live Supabase database
- Scripts automatically clean up existing processes before starting
- Environment variables are consistently applied across all start methods
- Both servers can run simultaneously for comparison