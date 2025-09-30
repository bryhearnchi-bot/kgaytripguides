#!/bin/bash

# Generate secure secrets for Railway deployment
# Run this script and copy the output to Railway Dashboard → Variables

echo "🔐 Railway Environment Variable Generator"
echo "=========================================="
echo ""
echo "Copy these values to Railway Dashboard → Your Project → Variables"
echo ""
echo "-------------------------------------------------------------------"
echo ""

# Generate SESSION_SECRET
SESSION_SECRET=$(openssl rand -base64 32)
echo "SESSION_SECRET=${SESSION_SECRET}"
echo ""

# Generate JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=${JWT_SECRET}"
echo ""

echo "-------------------------------------------------------------------"
echo ""
echo "⚠️  IMPORTANT: Also add these variables from your Supabase Dashboard:"
echo ""
echo "DATABASE_URL=postgresql://postgres:PASSWORD@HOST:6543/postgres"
echo "  Get from: Supabase Dashboard → Settings → Database → Connection String"
echo "  Use: Connection Pooling (Transaction mode, port 6543)"
echo ""
echo "SUPABASE_URL=https://YOUR_PROJECT.supabase.co"
echo "  Get from: Supabase Dashboard → Settings → API"
echo ""
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "  Get from: Supabase Dashboard → Settings → API → service_role key"
echo ""
echo "NODE_ENV=production"
echo "  (Set this manually)"
echo ""
echo "-------------------------------------------------------------------"
echo ""
echo "✅ Save these secrets securely - you won't be able to view them again!"
echo ""