#!/bin/bash

# Security Check Script for K-GAY Travel Guides
# Checks for common security issues before commit

set -e

echo "🔒 Running Security Checks..."
echo ""

# Track if any checks fail
CHECKS_FAILED=0

# Check for hardcoded database credentials
echo "🔍 Checking for hardcoded database credentials..."
if grep -r "postgresql://postgres:" client/ server/ --exclude-dir=node_modules --exclude="*.bak" --exclude="*.test.*" 2>/dev/null; then
  echo "❌ ERROR: Hardcoded database credentials found!"
  CHECKS_FAILED=1
else
  echo "✅ No hardcoded database credentials found"
fi
echo ""

# Check for hardcoded Supabase keys (excluding .env files and .env.example)
echo "🔍 Checking for hardcoded Supabase keys..."
if grep -rE "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\." client/src server --exclude-dir=node_modules --exclude="*.bak" --exclude="*.test.*" --exclude=".env*" 2>/dev/null; then
  echo "❌ ERROR: Hardcoded Supabase keys found in source files!"
  CHECKS_FAILED=1
else
  echo "✅ No hardcoded Supabase keys found in source files"
fi
echo ""

# Check for console.log in production code
echo "🔍 Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.log" client/src server --exclude-dir=node_modules --exclude="*.bak" --exclude="*.test.*" --exclude="**/logger.ts" --exclude="**/logging/**" 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
  echo "⚠️  WARNING: $CONSOLE_LOGS console.log statements found (should use logger instead)"
  grep -rn "console\.log" client/src server --exclude-dir=node_modules --exclude="*.bak" --exclude="*.test.*" --exclude="**/logger.ts" --exclude="**/logging/**" 2>/dev/null | head -10
  echo ""
  echo "ℹ️  Use logger.info(), logger.warn(), logger.error() instead of console.log()"
else
  echo "✅ No console.log statements found"
fi
echo ""

# Check for 'any' types in TypeScript
echo "🔍 Checking for 'any' types..."
ANY_TYPES=$(grep -r ": any" client/src server --exclude-dir=node_modules --exclude="*.bak" --exclude="*.d.ts" --exclude="*.test.*" 2>/dev/null | wc -l)
if [ "$ANY_TYPES" -gt 0 ]; then
  echo "⚠️  WARNING: $ANY_TYPES 'any' types detected (impacts type safety)"
  grep -rn ": any" client/src server --exclude-dir=node_modules --exclude="*.bak" --exclude="*.d.ts" --exclude="*.test.*" 2>/dev/null | head -10
  echo ""
  echo "ℹ️  Consider using specific types or 'unknown' instead of 'any'"
else
  echo "✅ No 'any' types found"
fi
echo ""

# Check for innerHTML usage (XSS risk)
echo "🔍 Checking for innerHTML usage..."
if grep -r "\.innerHTML\s*=" client/src --exclude-dir=node_modules --exclude="*.bak" --exclude="*.test.*" 2>/dev/null; then
  echo "❌ ERROR: innerHTML usage found (XSS vulnerability)"
  CHECKS_FAILED=1
else
  echo "✅ No innerHTML usage found"
fi
echo ""

# Check for eval() usage
echo "🔍 Checking for eval() usage..."
if grep -r "eval(" client/src server --exclude-dir=node_modules --exclude="*.bak" --exclude="*.test.*" 2>/dev/null; then
  echo "❌ ERROR: eval() usage found (security risk)"
  CHECKS_FAILED=1
else
  echo "✅ No eval() usage found"
fi
echo ""

# Check for fallback default values in auth/security files
echo "🔍 Checking for fallback defaults in security-critical code..."
if grep -rE "\|\|\s*['\"]" server/auth.ts server/middleware/csrf.ts server/middleware/security.ts 2>/dev/null | grep -E "SECRET|KEY|PASSWORD" 2>/dev/null; then
  echo "❌ ERROR: Fallback defaults found in security-critical files"
  CHECKS_FAILED=1
else
  echo "✅ No fallback defaults in security files"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $CHECKS_FAILED -eq 0 ]; then
  echo "✅ All security checks passed!"
  exit 0
else
  echo "❌ Security checks failed. Please fix the issues above."
  exit 1
fi