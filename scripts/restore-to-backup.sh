#!/bin/bash
# Restore Database to Backup Project
# Usage: BACKUP_DATABASE_URL="postgresql://..." ./scripts/restore-to-backup.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 K-GAY Travel Guides - Database Restore${NC}"
echo "================================================"
echo ""

# Find the most recent backup
BACKUP_FILE=$(ls -t ./backups/kgay_backup_*.sql 2>/dev/null | head -n1)

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ ERROR: No backup file found${NC}"
    exit 1
fi

# Check if BACKUP_DATABASE_URL is set
if [ -z "$BACKUP_DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: BACKUP_DATABASE_URL not set${NC}"
    echo ""
    echo "Get the database password from Supabase dashboard:"
    echo "  1. Go to https://supabase.com/dashboard/project/xwblievvoijduoozgcst/settings/database"
    echo "  2. Copy the Database Password"
    echo "  3. Run with:"
    echo ""
    echo "  BACKUP_DATABASE_URL='postgresql://postgres:PASSWORD@db.xwblievvoijduoozgcst.supabase.co:6543/postgres' ./scripts/restore-to-backup.sh"
    echo ""
    exit 1
fi

echo "📋 Restore Details:"
echo "  - Backup file: $BACKUP_FILE"
echo "  - Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "  - Target: $(echo $BACKUP_DATABASE_URL | sed 's/:[^:]*@/@/g')"
echo ""

# Restore backup
echo -e "${YELLOW}⏳ Restoring backup to backup project...${NC}"
if /opt/homebrew/opt/postgresql@17/bin/psql "$BACKUP_DATABASE_URL" < "$BACKUP_FILE" 2>&1 | tail -20; then
    echo ""
    echo -e "${GREEN}✅ Restore successful!${NC}"
    echo ""

    # Verify tables
    TABLE_COUNT=$(/opt/homebrew/opt/postgresql@17/bin/psql "$BACKUP_DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo "📊 Tables restored: $TABLE_COUNT"
    echo ""
    echo -e "${GREEN}✅ Backup project ready!${NC}"
    echo ""
    echo "Backup project details:"
    echo "  - Project ID: xwblievvoijduoozgcst"
    echo "  - Dashboard: https://supabase.com/dashboard/project/xwblievvoijduoozgcst"
    echo "  - Region: us-east-1"
else
    echo -e "${RED}❌ Restore failed!${NC}"
    exit 1
fi