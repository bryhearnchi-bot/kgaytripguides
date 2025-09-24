#!/bin/bash

# Development server for ui-redesign branch
# Runs on port 3002 for side-by-side comparison

echo "🎨 Starting K-GAY Travel Guides UI Redesign Development Server"

# Kill any existing dev servers on port 3002
echo "🔄 Cleaning up existing processes on port 3002..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

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
export PORT=3002
export DATABASE_URL="postgresql://postgres:qRlGhCf4xnNXCeBF@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres"

echo "🗄️  Database: Live Supabase (postgresql://postgres:****@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres)"
echo "🚫 Mock Data: Disabled (USE_MOCK_DATA=false)"
echo "🌐 Environment: $NODE_ENV"
echo "📡 Port: $PORT (UI Redesign Branch)"

# Check if we're on the ui-redesign branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "ui-redesign" ]; then
    echo "⚠️  Warning: Currently on branch '$CURRENT_BRANCH', not 'ui-redesign'"
    echo "🔀 Switch to ui-redesign branch first: git checkout ui-redesign"
fi

# Start the development server
echo "🎯 Starting redesign development server on port 3002..."
npm run dev