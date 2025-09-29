#!/bin/bash
# Database Backup Script
# Run before starting remediation plan

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/kgay_backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🗄️  K-GAY Travel Guides - Database Backup${NC}"
echo "================================================"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL not set${NC}"
    echo ""
    echo "Set it with:"
    echo "  export DATABASE_URL='your_database_url'"
    echo ""
    echo "Or run with:"
    echo "  DATABASE_URL='your_url' ./scripts/backup-database.sh"
    exit 1
fi

echo "📋 Backup Details:"
echo "  - Timestamp: $TIMESTAMP"
echo "  - File: $BACKUP_FILE"
echo "  - Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/@/g')"  # Hide password
echo ""

# Perform backup
echo -e "${YELLOW}⏳ Creating backup...${NC}"
if /opt/homebrew/opt/postgresql@17/bin/pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>&1; then
    echo -e "${GREEN}✅ Backup successful!${NC}"
    echo ""

    # Show file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📦 Backup file size: $SIZE"
    echo "📁 Location: $BACKUP_FILE"
    echo ""

    # Count tables backed up
    TABLE_COUNT=$(grep -c "CREATE TABLE" "$BACKUP_FILE" || echo "0")
    echo "📊 Tables backed up: $TABLE_COUNT"
    echo ""

    echo -e "${GREEN}✅ Backup complete!${NC}"
    echo ""
    echo "To restore this backup later:"
    echo "  psql \$DATABASE_URL < $BACKUP_FILE"
    echo ""
    echo -e "${GREEN}Ready to proceed with remediation plan!${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "  - pg_dump not installed (install PostgreSQL client tools)"
    echo "  - Invalid DATABASE_URL"
    echo "  - Network connection issues"
    exit 1
fi