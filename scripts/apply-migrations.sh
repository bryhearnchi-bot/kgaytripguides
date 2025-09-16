#!/bin/bash

# Database Migration Application Script
# Applies migrations using psql directly

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    # Try to load from .env
    if [ -f .env ]; then
        export $(cat .env | grep DATABASE_URL | xargs)
    fi

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}ERROR: DATABASE_URL not set${NC}"
        echo "Please set DATABASE_URL or ensure it's in your .env file"
        exit 1
    fi
fi

echo -e "${BLUE}=== Database Migration Starting ===${NC}"
echo ""

# Create migrations tracking table
echo -e "${YELLOW}Creating migrations tracking table...${NC}"
psql "$DATABASE_URL" << EOF
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT true,
    UNIQUE(number)
);
EOF

# Function to run a migration
run_migration() {
    local file=$1
    local number=$2
    local name=$3

    # Check if already executed
    EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT 1 FROM _migrations WHERE number = $number" 2>/dev/null || echo "0")

    if [ "$EXISTS" = " 1" ]; then
        echo -e "${GRAY}  Skipping: ${number}_${name} (already executed)${NC}"
        return 0
    fi

    echo -e "${YELLOW}  Running: ${number}_${name}...${NC}"

    # Run the migration
    if psql "$DATABASE_URL" < "$file" > /tmp/migration_${number}.log 2>&1; then
        # Record success
        psql "$DATABASE_URL" -c "INSERT INTO _migrations (number, name, success) VALUES ($number, '$name', true) ON CONFLICT (number) DO NOTHING"
        echo -e "${GREEN}  ✓ Completed${NC}"
        return 0
    else
        # Record failure
        psql "$DATABASE_URL" -c "INSERT INTO _migrations (number, name, success) VALUES ($number, '$name', false) ON CONFLICT (number) DO UPDATE SET success = false"
        echo -e "${RED}  ✗ Failed${NC}"
        echo -e "${RED}    See /tmp/migration_${number}.log for details${NC}"
        return 1
    fi
}

# Find and run migrations
MIGRATIONS_DIR="./migrations"
SUCCESS_COUNT=0
FAIL_COUNT=0

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}ERROR: Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}Running migrations...${NC}"
echo ""

for file in $MIGRATIONS_DIR/*.sql; do
    if [ -f "$file" ]; then
        # Extract number and name from filename
        filename=$(basename "$file")
        number=$(echo "$filename" | cut -d'_' -f1)
        name=$(echo "$filename" | sed "s/${number}_//" | sed 's/\.sql$//')

        if run_migration "$file" "$number" "$name"; then
            ((SUCCESS_COUNT++))
        else
            ((FAIL_COUNT++))
            # Stop on first failure unless --force is specified
            if [ "$1" != "--force" ]; then
                break
            fi
        fi
    fi
done

# Summary
echo ""
echo -e "${BLUE}=== Migration Summary ===${NC}"
echo -e "${GREEN}  Successful: $SUCCESS_COUNT${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}  Failed: $FAIL_COUNT${NC}"
fi

# Run verification
if [ $FAIL_COUNT -eq 0 ]; then
    echo ""
    echo -e "${BLUE}Running verification...${NC}"
    if [ -f "scripts/verify-migration.ts" ]; then
        npx tsx scripts/verify-migration.ts
    else
        echo -e "${YELLOW}  Verification script not found${NC}"
    fi
fi

# Exit with appropriate code
if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
    exit 0
fi