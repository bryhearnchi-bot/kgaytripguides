#!/bin/bash

# Database Backup Script
# Creates timestamped backups with verification

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kgay_backup_$TIMESTAMP.sql"
CHECKSUM_FILE="$BACKUP_DIR/kgay_backup_$TIMESTAMP.checksum"
LOG_FILE="$BACKUP_DIR/backup_$TIMESTAMP.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check for required environment variable
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is not set"
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Start backup process
log "=== Starting Database Backup ==="
log "Backup file: $BACKUP_FILE"

# 1. Create the backup
log "Step 1: Creating database dump..."
pg_dump "$DATABASE_URL" \
    --verbose \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --format=plain \
    --file="$BACKUP_FILE" 2>> "$LOG_FILE"

if [ $? -ne 0 ]; then
    error "Database dump failed"
fi

# 2. Verify backup was created
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file was not created"
fi

BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
log "Backup created successfully (Size: $BACKUP_SIZE)"

# 3. Generate checksum
log "Step 2: Generating checksum..."
if command -v md5sum > /dev/null; then
    md5sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
elif command -v md5 > /dev/null; then
    md5 -q "$BACKUP_FILE" > "$CHECKSUM_FILE"
else
    warning "No MD5 utility found, skipping checksum"
fi

if [ -f "$CHECKSUM_FILE" ]; then
    CHECKSUM=$(cat "$CHECKSUM_FILE" | awk '{print $1}')
    log "Checksum: $CHECKSUM"
fi

# 4. Compress the backup
log "Step 3: Compressing backup..."
gzip -9 -c "$BACKUP_FILE" > "$BACKUP_FILE.gz"

if [ -f "$BACKUP_FILE.gz" ]; then
    COMPRESSED_SIZE=$(ls -lh "$BACKUP_FILE.gz" | awk '{print $5}')
    log "Compressed backup created (Size: $COMPRESSED_SIZE)"

    # Remove uncompressed file to save space
    rm "$BACKUP_FILE"
    log "Removed uncompressed backup file"
else
    warning "Compression failed, keeping uncompressed backup"
fi

# 5. Test restore capability (optional dry-run)
log "Step 4: Verifying backup integrity..."

# Create a test database name
TEST_DB="kgay_test_restore_$TIMESTAMP"

# Extract just the connection parameters from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

# Test if we can read the backup file
if [ -f "$BACKUP_FILE.gz" ]; then
    gunzip -t "$BACKUP_FILE.gz" 2>> "$LOG_FILE"
    if [ $? -eq 0 ]; then
        log "Backup file integrity verified"
    else
        error "Backup file is corrupted"
    fi
fi

# 6. Cleanup old backups (keep last 7 days)
log "Step 5: Cleaning up old backups..."
find "$BACKUP_DIR" -name "kgay_backup_*.sql.gz" -mtime +7 -exec rm {} \; 2>> "$LOG_FILE"
REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR"/kgay_backup_*.sql.gz 2>/dev/null | wc -l)
log "Remaining backups: $REMAINING_BACKUPS"

# 7. Create backup metadata
log "Step 6: Creating backup metadata..."
cat > "$BACKUP_DIR/latest_backup.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "file": "kgay_backup_$TIMESTAMP.sql.gz",
  "checksum": "${CHECKSUM:-'N/A'}",
  "size_compressed": "${COMPRESSED_SIZE:-'N/A'}",
  "size_original": "$BACKUP_SIZE",
  "database_url": "REDACTED",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# 8. Summary
log "=== Backup Complete ==="
log "Backup file: $BACKUP_FILE.gz"
log "Checksum file: $CHECKSUM_FILE"
log "Log file: $LOG_FILE"
log "Metadata: $BACKUP_DIR/latest_backup.json"

# Exit successfully
exit 0