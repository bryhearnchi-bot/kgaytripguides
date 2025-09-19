#!/bin/bash

# Navigate to project directory
cd /Users/bryan/develop/projects/kgay-travel-guides

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        echo "Please run: npm install"
        exit 1
    fi
fi

# Start the development server
echo "🚀 Starting development server..."
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:5173"
npm run dev