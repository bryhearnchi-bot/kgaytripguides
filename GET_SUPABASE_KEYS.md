# Get Complete Supabase Keys for Railway

## Problem

Railway logs show: **"Database health check failed - Invalid API key"**

This means the Supabase keys in Railway are truncated/incomplete.

## Solution

### 1. Go to Supabase Dashboard

Visit: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/settings/api

### 2. Copy COMPLETE Keys

**IMPORTANT:** These keys are VERY LONG (200+ characters). Make sure you copy the ENTIRE key.

#### Service Role Key (Secret - Never expose publicly)

- Click on "service_role" in the API Settings
- Click the "Copy" button (don't manually select - use the copy button!)
- Should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...`
- Should be 200+ characters long
- Has 3 parts separated by dots: `xxxxx.yyyyy.zzzzz`

#### Anon Key (Public - Safe to expose)

- Click on "anon" / "public" in the API Settings
- Click the "Copy" button
- Should also be 200+ characters long
- Has 3 parts separated by dots

### 3. Update Railway Environment Variables

Go to: Railway Dashboard → Your Project → Variables

**Delete and re-add these variables with COMPLETE keys:**

```bash
SUPABASE_SERVICE_ROLE_KEY=<paste-complete-key-here>
VITE_SUPABASE_ANON_KEY=<paste-complete-key-here>
```

### 4. Verify Key Length

**CORRECT (full key example):**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzY0MjYyMiwiZXhwIjoyMDQzMjE4NjIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

(Should be ~200-250 characters)

**WRONG (truncated - what you have now):**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI
```

(Cut off mid-token)

### 5. Redeploy

Railway will automatically redeploy after you update the variables.

### 6. Verify

After redeployment, check:

```
https://ui-redesign-production.up.railway.app/healthz
```

Should return:

```json
{
  "status": "healthy",
  "checks": {
    "database": "ok"
  }
}
```

---

## Why This Happens

JWT tokens are VERY long strings. If you:

- Manually copy/paste and miss some characters
- Copy from a truncated log or error message
- Copy from a cell that doesn't show the full value

The key will be invalid and you'll get "Invalid API key" errors.

**Always use the "Copy" button in Supabase Dashboard!**

---

## Current Railway Variables Should Be:

```bash
# Database
DATABASE_URL=postgresql://postgres:qRlGhCf4xnNXCeBF@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres

# Supabase (GET THESE FROM DASHBOARD - FULL KEYS!)
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<FULL-200-CHAR-KEY>
VITE_SUPABASE_ANON_KEY=<FULL-200-CHAR-KEY>

# Security
SESSION_SECRET=hMyPtk9OiZX/WLaWXmz4VQS4zbKSppImQCBM8au1PK8=
JWT_SECRET=hJRkdvfjJe0j51bFxNFQxkO5c6Qhn2P8dUuloGS+T68=

# Environment
NODE_ENV=production
PORT=3001

# Client-side (same as SUPABASE_URL and anon key)
VITE_SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
```
