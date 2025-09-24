#!/bin/bash

# Development server startup script with proper environment configuration
# Ensures consistent database connection and environment setup

echo "🚀 Starting K-GAY Travel Guides Development Server"

# Kill any existing dev servers
echo "🔄 Cleaning up existing processes..."
pkill -f "npm run dev" || true
pkill -f "tsx server/index.ts" || true

# Wait for processes to fully terminate
sleep 2

# Source environment variables
if [ -f ".env.local" ]; then
    echo "📄 Loading environment from .env.local"
    source .env.local
else
    echo "⚠️  Warning: .env.local not found, using default environment"
fi

# Ensure we're using live database (never mock data)
export USE_MOCK_DATA=false
export NODE_ENV=development
export DATABASE_URL="postgresql://postgres:qRlGhCf4xnNXCeBF@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres"

echo "🗄️  Database: Live Supabase (postgresql://postgres:****@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres)"
echo "🚫 Mock Data: Disabled (USE_MOCK_DATA=false)"
echo "🌐 Environment: $NODE_ENV"
echo "📡 Port: ${PORT:-3001}"

# Start the development server
echo "🎯 Starting development server..."
npm run dev