#!/bin/bash

# Database Restore Script
# Restores database from backup with verification

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"
LOG_FILE="$BACKUP_DIR/restore_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Parse arguments
BACKUP_FILE=""
FORCE_RESTORE=false
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        --force)
            FORCE_RESTORE=true
            shift
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        --latest)
            # Find the latest backup
            BACKUP_FILE=$(ls -t "$BACKUP_DIR"/kgay_backup_*.sql.gz 2>/dev/null | head -1)
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --file <path>    Specify backup file to restore"
            echo "  --latest         Use the latest backup file"
            echo "  --force          Skip confirmation prompts"
            echo "  --verify-only    Only verify backup, don't restore"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Check for required environment variable
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is not set"
fi

# Check if backup file was specified
if [ -z "$BACKUP_FILE" ]; then
    error "No backup file specified. Use --file <path> or --latest"
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

log "=== Database Restore Process Starting ==="
log "Backup file: $BACKUP_FILE"

# 1. Verify backup integrity
log "Step 1: Verifying backup integrity..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -t "$BACKUP_FILE" 2>> "$LOG_FILE"
    if [ $? -ne 0 ]; then
        error "Backup file is corrupted"
    fi
    log "Backup file integrity verified"
else
    warning "Backup file is not compressed, skipping integrity check"
fi

# 2. Check backup size and info
BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
log "Backup size: $BACKUP_SIZE"

# 3. Extract backup metadata if available
BACKUP_TIMESTAMP=$(basename "$BACKUP_FILE" | sed 's/kgay_backup_\(.*\)\.sql.*/\1/')
log "Backup timestamp: $BACKUP_TIMESTAMP"

# 4. Verify checksum if available
CHECKSUM_FILE="${BACKUP_FILE%.sql.gz}.checksum"
if [ -f "$CHECKSUM_FILE" ]; then
    log "Verifying checksum..."

    # Decompress temporarily for checksum
    TEMP_FILE="/tmp/kgay_restore_temp.sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

    if command -v md5sum > /dev/null; then
        ACTUAL_CHECKSUM=$(md5sum "$TEMP_FILE" | awk '{print $1}')
    elif command -v md5 > /dev/null; then
        ACTUAL_CHECKSUM=$(md5 -q "$TEMP_FILE")
    fi

    EXPECTED_CHECKSUM=$(cat "$CHECKSUM_FILE" | awk '{print $1}')

    if [ "$ACTUAL_CHECKSUM" = "$EXPECTED_CHECKSUM" ]; then
        log "Checksum verification passed"
    else
        rm -f "$TEMP_FILE"
        error "Checksum verification failed"
    fi

    rm -f "$TEMP_FILE"
else
    warning "No checksum file found, skipping verification"
fi

# 5. If verify-only mode, exit here
if [ "$VERIFY_ONLY" = true ]; then
    log "Verification complete (--verify-only mode)"
    exit 0
fi

# 6. Confirm restoration
if [ "$FORCE_RESTORE" != true ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║           WARNING: DATA LOSS RISK          ║${NC}"
    echo -e "${YELLOW}╠════════════════════════════════════════════╣${NC}"
    echo -e "${YELLOW}║ This will REPLACE ALL current database    ║${NC}"
    echo -e "${YELLOW}║ data with the backup from:                ║${NC}"
    echo -e "${YELLOW}║ $BACKUP_TIMESTAMP                    ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════╝${NC}"
    echo
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log "Restore cancelled by user"
        exit 0
    fi
fi

# 7. Create current backup before restore
log "Step 2: Creating safety backup of current database..."
SAFETY_BACKUP="$BACKUP_DIR/kgay_safety_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" --no-owner --no-acl > "$SAFETY_BACKUP" 2>> "$LOG_FILE"

if [ -f "$SAFETY_BACKUP" ]; then
    gzip "$SAFETY_BACKUP"
    log "Safety backup created: ${SAFETY_BACKUP}.gz"
else
    error "Failed to create safety backup"
fi

# 8. Perform the restore
log "Step 3: Restoring database..."

# Decompress the backup if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log "Decompressing backup..."
    RESTORE_FILE="/tmp/kgay_restore_$(date +%Y%m%d_%H%M%S).sql"
    gunzip -c "$BACKUP_FILE" > "$RESTORE_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Execute the restore
log "Executing restore (this may take a while)..."
psql "$DATABASE_URL" < "$RESTORE_FILE" >> "$LOG_FILE" 2>&1

RESTORE_STATUS=$?

# Clean up temporary file
if [[ "$BACKUP_FILE" == *.gz ]] && [ -f "$RESTORE_FILE" ]; then
    rm -f "$RESTORE_FILE"
fi

if [ $RESTORE_STATUS -ne 0 ]; then
    error "Restore failed! Safety backup available at: ${SAFETY_BACKUP}.gz"
fi

log "Database restore completed successfully"

# 9. Verify the restore
log "Step 4: Verifying restored data..."

# Check table counts
VERIFY_QUERIES=(
    "SELECT COUNT(*) as count, 'trips' as table_name FROM trips"
    "SELECT COUNT(*) as count, 'itinerary' as table_name FROM itinerary"
    "SELECT COUNT(*) as count, 'events' as table_name FROM events"
    "SELECT COUNT(*) as count, 'talent' as table_name FROM talent"
)

info "Table record counts:"
for query in "${VERIFY_QUERIES[@]}"; do
    RESULT=$(psql "$DATABASE_URL" -t -c "$query" 2>/dev/null)
    if [ $? -eq 0 ]; then
        COUNT=$(echo "$RESULT" | awk -F'|' '{print $1}' | tr -d ' ')
        TABLE=$(echo "$RESULT" | awk -F'|' '{print $2}' | tr -d ' ')
        info "  $TABLE: $COUNT records"
    else
        warning "  Failed to verify table"
    fi
done

# 10. Run migration verification if script exists
if [ -f "scripts/verify-migration.ts" ]; then
    log "Step 5: Running migration verification..."
    npx tsx scripts/verify-migration.ts >> "$LOG_FILE" 2>&1

    if [ $? -eq 0 ]; then
        log "Migration verification passed"
    else
        warning "Migration verification reported issues (check log for details)"
    fi
else
    info "Skipping migration verification (script not found)"
fi

# 11. Summary
log "=== Restore Complete ==="
log "Restored from: $BACKUP_FILE"
log "Safety backup: ${SAFETY_BACKUP}.gz"
log "Log file: $LOG_FILE"

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         RESTORE COMPLETED SUCCESSFULLY      ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║ Database has been restored from backup     ║${NC}"
echo -e "${GREEN}║ Please verify application functionality    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

exit 0