#!/bin/bash

# Railway Deployment Verification Script
# Run this locally to verify your Railway deployment configuration

set -e

echo "🚂 Railway Deployment Verification"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks failed
CHECKS_FAILED=0

# 1. Check if railway.json exists
echo "1. Checking railway.json..."
if [ -f "railway.json" ]; then
  echo -e "${GREEN}✓${NC} railway.json exists"
else
  echo -e "${RED}✗${NC} railway.json not found"
  CHECKS_FAILED=1
fi
echo ""

# 2. Check if nixpacks.toml exists
echo "2. Checking nixpacks.toml..."
if [ -f "nixpacks.toml" ]; then
  echo -e "${GREEN}✓${NC} nixpacks.toml exists"
else
  echo -e "${RED}✗${NC} nixpacks.toml not found"
  CHECKS_FAILED=1
fi
echo ""

# 3. Verify build script
echo "3. Checking build script..."
if grep -q '"build":' package.json; then
  BUILD_SCRIPT=$(grep '"build":' package.json | head -1)
  echo -e "${GREEN}✓${NC} Build script found: $BUILD_SCRIPT"
else
  echo -e "${RED}✗${NC} Build script not found in package.json"
  CHECKS_FAILED=1
fi
echo ""

# 4. Check if dist directory would be created
echo "4. Testing build process..."
echo -e "${YELLOW}ℹ${NC}  Running 'npm run build' to verify..."
if npm run build > /tmp/build-output.log 2>&1; then
  echo -e "${GREEN}✓${NC} Build completed successfully"

  # Check if dist/public exists
  if [ -d "dist/public" ]; then
    echo -e "${GREEN}✓${NC} dist/public directory created"

    # Check if index.html exists
    if [ -f "dist/public/index.html" ]; then
      echo -e "${GREEN}✓${NC} dist/public/index.html exists"
    else
      echo -e "${RED}✗${NC} dist/public/index.html not found"
      CHECKS_FAILED=1
    fi

    # Check if assets directory exists
    if [ -d "dist/public/assets" ]; then
      echo -e "${GREEN}✓${NC} dist/public/assets directory exists"
      ASSET_COUNT=$(ls -1 dist/public/assets | wc -l)
      echo -e "${GREEN}ℹ${NC}  Found $ASSET_COUNT files in assets/"
    else
      echo -e "${RED}✗${NC} dist/public/assets directory not found"
      CHECKS_FAILED=1
    fi

    # Check if PWA files exist
    if [ -f "dist/public/manifest.json" ]; then
      echo -e "${GREEN}✓${NC} dist/public/manifest.json exists"
    else
      echo -e "${YELLOW}⚠${NC}  dist/public/manifest.json not found (PWA may not work)"
    fi

    if [ -f "dist/public/sw.js" ]; then
      echo -e "${GREEN}✓${NC} dist/public/sw.js exists"
    else
      echo -e "${YELLOW}⚠${NC}  dist/public/sw.js not found (PWA may not work)"
    fi
  else
    echo -e "${RED}✗${NC} dist/public directory not created"
    CHECKS_FAILED=1
  fi
else
  echo -e "${RED}✗${NC} Build failed"
  echo "Build output:"
  cat /tmp/build-output.log
  CHECKS_FAILED=1
fi
echo ""

# 5. Check TypeScript compilation
echo "5. Checking TypeScript..."
if npm run check > /tmp/tsc-output.log 2>&1; then
  echo -e "${GREEN}✓${NC} TypeScript check passed"
else
  echo -e "${RED}✗${NC} TypeScript errors found"
  echo "TypeScript output:"
  cat /tmp/tsc-output.log | head -20
  CHECKS_FAILED=1
fi
echo ""

# 6. List required environment variables
echo "6. Required Environment Variables for Railway"
echo "=============================================="
echo ""
echo "You MUST set these in Railway Dashboard > Variables:"
echo ""
echo -e "${YELLOW}DATABASE_URL${NC}"
echo "  Example: postgresql://postgres:PASSWORD@HOST:6543/postgres"
echo ""
echo -e "${YELLOW}SUPABASE_URL${NC}"
echo "  Example: https://YOUR_PROJECT.supabase.co"
echo ""
echo -e "${YELLOW}SUPABASE_SERVICE_ROLE_KEY${NC}"
echo "  Get from: Supabase Dashboard > Settings > API > service_role key"
echo ""
echo -e "${YELLOW}SESSION_SECRET${NC}"
echo "  Generate with: openssl rand -base64 32"
echo "  Or use: $(openssl rand -base64 32)"
echo ""
echo -e "${YELLOW}JWT_SECRET${NC} (optional but recommended)"
echo "  Generate with: openssl rand -base64 32"
echo "  Or use: $(openssl rand -base64 32)"
echo ""
echo -e "${YELLOW}NODE_ENV${NC}"
echo "  Set to: production"
echo ""
echo -e "${YELLOW}PORT${NC} (optional - Railway sets automatically)"
echo "  Default: 3001"
echo ""

# 7. Check if .env has all required variables (for reference)
echo "7. Checking local .env file (for reference)..."
if [ -f ".env" ]; then
  MISSING_VARS=()

  if ! grep -q "^DATABASE_URL=" .env; then
    MISSING_VARS+=("DATABASE_URL")
  fi

  if ! grep -q "^SUPABASE_URL=" .env; then
    MISSING_VARS+=("SUPABASE_URL")
  fi

  if ! grep -q "^SUPABASE_SERVICE_ROLE_KEY=" .env; then
    MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
  fi

  if ! grep -q "^SESSION_SECRET=" .env; then
    MISSING_VARS+=("SESSION_SECRET")
  fi

  if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All required variables found in .env"
  else
    echo -e "${YELLOW}⚠${NC}  Missing variables in .env:"
    for var in "${MISSING_VARS[@]}"; do
      echo "  - $var"
    done
  fi
else
  echo -e "${YELLOW}⚠${NC}  .env file not found (this is OK - Railway uses dashboard variables)"
fi
echo ""

# 8. Summary
echo "===================================="
if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Add environment variables to Railway Dashboard"
  echo "2. Deploy to Railway"
  echo "3. Monitor logs for any startup errors"
  echo ""
  echo "To deploy:"
  echo "  git push origin main"
else
  echo -e "${RED}✗ Some checks failed${NC}"
  echo ""
  echo "Please fix the issues above before deploying to Railway."
  echo ""
fi