#!/bin/bash
# Script to replace console.log with logger
# This handles the bulk of Phase 1 console.log replacements

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Replacing console.log with logger${NC}"
echo "================================================"
echo ""

# Counter
TOTAL_REPLACED=0

# Function to add logger import if not present
add_logger_import() {
  local file=$1

  if ! grep -q "import.*logger.*from" "$file"; then
    # Check if it's a server file
    if [[ $file == server/* ]]; then
      # Determine the relative path to logger
      local depth=$(echo "$file" | tr -cd '/' | wc -c)
      local relative_path=""

      if [[ $file == server/*.ts ]]; then
        relative_path="./logging/logger"
      elif [[ $file == server/*/*.ts ]]; then
        relative_path="../logging/logger"
      elif [[ $file == server/*/*/*.ts ]]; then
        relative_path="../../logging/logger"
      else
        relative_path="../logging/logger"
      fi

      # Add import after first import statement
      sed -i '' "/^import/a\\
import { logger } from '$relative_path';
" "$file"

      echo -e "  ${GREEN}✓${NC} Added logger import to $(basename $file)"
    fi
  fi
}

# Replace console.log with logger.info
replace_in_file() {
  local file=$1
  local count=0

  # Count occurrences
  count=$(grep -c "console\.\(log\|info\|warn\|error\)" "$file" 2>/dev/null || echo "0")

  if [ "$count" -gt 0 ]; then
    echo ""
    echo "📝 Processing: $file ($count occurrences)"

    # Add logger import
    add_logger_import "$file"

    # Replace console.log with logger.info
    sed -i '' 's/console\.log(/logger.info(/g' "$file"

    # Replace console.info with logger.info
    sed -i '' 's/console\.info(/logger.info(/g' "$file"

    # Replace console.warn with logger.warn
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"

    # Replace console.error with logger.error
    sed -i '' 's/console\.error(/logger.error(/g' "$file"

    echo -e "  ${GREEN}✓${NC} Replaced $count console statements"

    TOTAL_REPLACED=$((TOTAL_REPLACED + count))
  fi
}

# Find all TypeScript files in server directory (excluding node_modules and tests)
echo "🔍 Scanning server directory..."
echo ""

while IFS= read -r file; do
  replace_in_file "$file"
done < <(find server -name "*.ts" -not -path "*/node_modules/*" -not -name "*.test.ts" -not -name "*.spec.ts")

echo ""
echo "================================================"
echo -e "${GREEN}✅ Complete!${NC}"
echo ""
echo "📊 Statistics:"
echo "  - Total console statements replaced: $TOTAL_REPLACED"
echo ""
echo "⚠️  Note: Please review the changes and run TypeScript check:"
echo "  npm run check"
echo ""