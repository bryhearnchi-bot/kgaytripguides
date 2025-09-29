# K-GAY Travel Guides - Project Documentation

## 🚨 CRITICAL DATABASE RULE - READ FIRST
**SUPABASE IS THE ONLY DATABASE SYSTEM WE USE. PERIOD.**
- ✅ Database: Supabase PostgreSQL ONLY
- ✅ Connection: `DATABASE_URL=postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres`
- ❌ NO Neon, NO mock data, NO other databases EVER
- ❌ NEVER use `USE_MOCK_DATA=true` - always use Supabase
- 🔥 **ANY DATABASE OPERATION MUST GO TO SUPABASE - NO EXCEPTIONS**

## 🚨 CRITICAL API FIELD NAMING RULE - READ FIRST
**ALL API RESPONSES USE SNAKE_CASE FIELD NAMES FROM DATABASE. PERIOD.**
- ✅ API responses return: `location_text`, `state_province`, `country_code`, `phone_number`
- ❌ NEVER map from camelCase: `locationText`, `stateProvince`, `countryCode`, `phoneNumber`
- ✅ Profile context mapping: `data.location_text`, `data.state_province`, `data.country_code`
- ❌ NEVER use: `data.locationText`, `data.stateProvince`, `data.countryCode`
- 🔥 **API FIELD NAMES ARE SNAKE_CASE - ALWAYS CHECK API RESPONSE STRUCTURE FIRST**

## 🚨 CRITICAL PAGE CREATION RULE - READ FIRST
**NEVER CREATE NEW PAGES - ONLY UPDATE EXISTING ONES. PERIOD.**
- ✅ Update existing pages: modify `/pages/admin/ships.tsx`, `/pages/admin/locations.tsx`, etc.
- ✅ Add new components: create in `/components/` directory
- ❌ NEVER create new pages like `ShipsManagement.tsx`, `ResortsManagement.tsx`
- ❌ NO new route files, NO new page files in `/pages/` directory
- 🔥 **CREATING NEW PAGES BREAKS APPLICATION ARCHITECTURE - UPDATE EXISTING PAGES ONLY**

## ⚡ Server Management
**ALWAYS use `npm run dev` with `run_in_background: true` to start the development server. No custom restart scripts.**
```bash
# Use Bash tool with run_in_background: true
npm run dev
```
**CRITICAL**: Always set `run_in_background: true` when using Bash tool to start the server. This prevents blocking and allows immediate response.

## 🤖 AUTOMATED CODE REVIEW REQUIREMENT
**CRITICAL: After writing any code, ALWAYS run the code-reviewer agent:**
```bash
# After any significant code change
claude-code use code-reviewer

# Or use inline review
/review-code

# The agent will check:
# - Security vulnerabilities
# - Performance issues
# - TypeScript type safety
# - Error handling
# - Code patterns
```
**If the code review finds issues, fix them before proceeding to the next task.**


## 🚀 Project Overview
**K-GAY Travel Guides** (Atlantis Events Guides) - LGBTQ+ travel application with comprehensive trip management, events coordination, and talent management. Built with React/Node.js/Supabase stack.

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite build system
- Tailwind CSS with animations
- Shadcn/ui component library
- Framer Motion for animations
- Zustand + React Query for state management
- Wouter for routing

**Backend:**
- Node.js 22 + Express
- TypeScript with strict mode
- Supabase PostgreSQL database
- Supabase Admin SDK
- Zod validation
- Winston logging
- Swagger/OpenAPI documentation

**Infrastructure:**
- Railway hosting
- Supabase (Database + Auth + Storage)
- Node.js 20+ required

**Testing:**
- Vitest for unit tests
- Jest for integration tests
- Chrome DevTools MCP integration

**Development Tools:**
- ESLint + Prettier
- TypeScript strict mode
- MCP integrations (Supabase, Chrome DevTools, Perplexity)

---

## 📁 Project Structure

```
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages/routes
│   │   ├── hooks/        # Custom React hooks
│   │   ├── contexts/     # React contexts
│   │   ├── utils/        # Utility functions
│   │   ├── types/        # TypeScript type definitions
│   │   └── lib/          # Core libraries and configurations
│   ├── dist/             # Build output
│   └── public/           # Static assets
├── server/               # Express backend application
│   ├── routes/           # API route handlers
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic services
│   ├── schemas/          # Zod validation schemas
│   ├── utils/            # Server utilities
│   ├── storage/          # File storage utilities
│   └── migrations/       # Database migrations
├── shared/               # Shared utilities between client/server
├── scripts/              # Build and deployment scripts
├── docs/                 # Project documentation
├── test/                 # Test configuration and utilities
├── public/               # Static public assets
└── supabase/             # Supabase configuration
```

---

## 🗄️ Database Schema

**Core Tables:**
- `profiles` - User profiles and authentication
- `trips` - Travel trip information
- `locations` - Destination and venue data
- `events` - Events and activities
- `talent` - Talent/performer management
- `ships` - Cruise ship information
- `itinerary` - Trip schedules and itineraries

**Junction Tables:**
- `trip_talent` - Many-to-many relationship between trips and talent
- `trip_info_sections` - Trip information sections

**Connection:**
- Database: Supabase PostgreSQL
- Port: 6543 (production), 5432 (development)
- Authentication: Supabase Auth
- Storage: Supabase Storage buckets

---

## 🔐 Environment Configuration

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres

# Supabase
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Application
NODE_ENV=development|production
PORT=3001
VITE_API_URL=http://localhost:3001

# Security
SESSION_SECRET=...

# Optional
USE_MOCK_DATA=false
```

---

## 🚀 Development Commands

```bash
# Development
npm run dev                    # Start development server (port 3001)
npm run dev:script            # Alternative dev start script
npm run dev:redesign          # Redesign development mode

# Building
npm run build                 # Production build with PWA files
npm run build:railway         # Railway-specific build
npm run check                 # TypeScript type checking

# Testing
npm test                      # Run Vitest unit tests
npm run test:run              # Run tests once
npm run test:coverage         # Test coverage report
npm run test:integration      # Jest integration tests
npm run test:e2e              # Playwright E2E tests
npm run test:all              # All test suites
npm run test:ci               # CI test pipeline

# Database
npm run db:seed               # Seed development database
npm run production:seed       # Seed production database

# Production
npm start                     # Start production server
npm run deploy:production     # Deploy to production

# API Documentation
npm run api:docs              # View API docs at localhost:3001/api/docs
```

---

## 🎨 UI/UX Guidelines

**Design System:**
- Ocean theme with blue/teal gradients
- Shadcn/ui component library
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Accessible components

**Protected Elements:**
- Application headers and navigation
- Color scheme and branding
- Landing page and trip page layouts

**Modifiable Areas:**
- Card content and layouts
- Admin interface components
- Data display components
- Mobile-specific fixes

**CRITICAL: ADMIN STYLE GUIDE**
- **Reference**: `docs/admin-style-guide.md` - MANDATORY for ALL admin interface work
- **Never create new admin pages** - only update existing ones
- **Use exact LocationManagement.tsx pattern** for all admin pages
- **ResponsiveAdminTable + ocean theme colors required**
- **Compact modal layout** with 2-column grid structure

**ADMIN TABLE TEMPLATE (EnhancedTable Components)**
- **Image Column**: width: 80, minWidth: 80, maxWidth: 80, images h-14 w-14 rounded-xl with gradient bg
- **Actions Column**: width: '100px', text-center alignment
- **Action Buttons**: h-4 w-4 rounded-xl with frosted glass (border-white/15 bg-white/5 hover:bg-white/10)
- **Button Spacing**: gap-1.5 between action buttons
- **Add Button**: Same h-4 w-4 size, bg-blue-500/10 hover:bg-blue-500/15, PlusSquare icon h-5 w-5 text-blue-400/80
- **Delete Button**: Destructive variant with border-[#fb7185]/30 bg-[#fb7185]/10 text-[#fb7185]
- **Name Columns**: Show only names, no slugs or secondary info (font-bold text-xs text-white)
- **Table Header**: Simple "All [Items]" with no count, no subheader (text-lg font-semibold text-white)
- **Header Layout**: pl-6 pr-3 py-3 with Add button positioned close to table edge
- **Table Footer**: "Showing X of Y [items]" format (text-xs text-white/50)
- **Column Resizing**: Enabled with drag handles between columns
- **Column Sorting**: Enabled with ChevronUp/Down/ChevronsUpDown icons
- **Mobile Responsive**: Card layout on mobile with expandable details

---

## 📝 Development Standards

**Code Quality:**
- TypeScript strict mode enabled
- ESLint + Prettier formatting
- Conventional commit messages
- 80%+ test coverage target

**Testing Strategy:**
- Unit tests with Vitest
- Integration tests with Jest
- E2E tests with Playwright
- Test at breakpoints: 375px, 768px, 1024px

**Date Handling:**
- Use `date-fns` library
- Format: `format(dateOnly(date), 'MMMM d')`
- No timezone conversion

**Image Handling:**
- Supabase Storage buckets
- Format: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

**Location Search System:**
- **Photon API**: OpenStreetMap-based global location search service
- **Service**: `client/src/lib/location-service.ts` - Core location search implementation
- **Component**: `client/src/components/admin/LocationSearchBar.tsx` - Admin UI component
- **Data Flow**: User types → Photon API → Formatted results → Form fields → Supabase database
- **Fields Populated**: city, state_province, country, country_code (ISO 2-letter)
- **API Endpoint**: `https://photon.komoot.io/api/` - Free, no authentication required
- **Response Format**: GeoJSON with properties (name, country, state, osm_type, etc.)
- **Debouncing**: 300ms delay to prevent API spam
- **Error Handling**: Graceful fallback with user-friendly error messages

---

## 🔧 Troubleshooting

**Database Issues:**
- Verify DATABASE_URL points to Supabase (port 6543)
- Check database password (not JWT)
- Ensure USE_MOCK_DATA=false

**Authentication:**
- Verify SUPABASE_ANON_KEY is correct
- Check profiles table exists
- Enable cookies for session management

**Image/Storage:**
- Check Supabase bucket permissions
- Verify SUPABASE_URL configuration
- Ensure storage policies are properly set

**Performance:**
- Use `npm run performance:test` for Lighthouse CI
- Monitor API response times
- Check database query performance

---

## 🔒 Security & Coding Standards (MANDATORY FOR ALL AGENTS)

### 🚨 CRITICAL SECURITY REQUIREMENTS
**Every coding agent MUST follow these security practices:**

#### Environment Variables
- **NEVER hardcode secrets** in code, scripts, or package.json
- **ALWAYS require env vars** - fail fast if missing (no fallback defaults)
- **Use dotenv** only in development, never in production code
- **Validate all env vars** on startup with explicit error messages
```typescript
// ✅ CORRECT - Fail fast
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET not configured');
  process.exit(1);
}

// ❌ WRONG - Never use fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
```

#### Input Validation
- **Validate ALL inputs** with Zod schemas before processing
- **Sanitize user content** before display
- **Never use innerHTML** with user content
- **Use parameterized queries** for all database operations
```typescript
// ✅ CORRECT - Use DOM methods
element.textContent = userInput;

// ❌ WRONG - XSS vulnerability
element.innerHTML = userInput;
```

#### Authentication & Authorization
- **Use Bearer tokens** for API authentication (not cookies)
- **Verify roles** on every protected endpoint
- **Check permissions** before data access
- **Use Supabase RLS** policies for database-level security

### 📝 CODING BEST PRACTICES (REQUIRED)

#### Logging Standards
- **NO console.log in production code** - use logger service
- **Import logger** from `@/lib/logger` (client) or `@/server/logging/logger` (server)
- **Log levels**: debug (dev only), info, warn, error
- **Never log sensitive data** (passwords, tokens, PII)
```typescript
// ✅ CORRECT
import { logger } from '@/lib/logger';
logger.info('User action', { userId, action });

// ❌ WRONG
console.log('User password:', password);
```

#### Error Handling
- **Wrap all routes** in try-catch or asyncHandler
- **Use error boundaries** for React components
- **Return consistent error formats** from APIs
- **Never expose internal errors** to users
```typescript
// ✅ CORRECT
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  return res.status(500).json({
    error: 'An error occurred',
    code: 'INTERNAL_ERROR'
  });
}
```

#### Performance Requirements
- **Implement code splitting** for routes over 50KB
- **Use React.memo** for expensive components
- **Set finite staleTime** in React Query (never Infinity)
- **Enable compression** for all text responses
- **Lazy load images** with loading="lazy"

#### TypeScript Standards
- **NO 'any' types** without explicit justification
- **Enable strict mode** in tsconfig.json
- **Define interfaces** for all data structures
- **Use type guards** for runtime type checking

### 🔄 AUTOMATED CODE REVIEW HOOKS

#### Pre-commit Hooks (Recommended Implementation)
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run type-check && npm run security-check",
      "post-commit": "npm run review-agent"
    }
  }
}
```

#### Security Check Script
```bash
#!/bin/bash
# scripts/security-check.sh

# Check for exposed secrets
if grep -r "postgresql://postgres:" . --exclude-dir=node_modules --exclude=.env; then
  echo "❌ ERROR: Hardcoded database credentials found!"
  exit 1
fi

# Check for console.log
if grep -r "console.log" client/src server --exclude="*.test.*"; then
  echo "⚠️ WARNING: console.log statements found"
fi

# Check for any types
if grep -r ": any" client/src server --exclude="*.d.ts"; then
  echo "⚠️ WARNING: 'any' types detected"
fi
```

#### AI Code Review Agent Integration
```bash
# scripts/review-agent.sh
#!/bin/bash
# Run after each significant code change

echo "🤖 Running AI Code Review..."

# Get changed files
CHANGED_FILES=$(git diff --name-only HEAD~1)

# Trigger code-reviewer agent
claude-code review --files="$CHANGED_FILES" \
  --check-security \
  --check-performance \
  --check-types \
  --check-errors

# Check review result
if [ $? -ne 0 ]; then
  echo "❌ Code review found issues. Please fix before proceeding."
  exit 1
fi

echo "✅ Code review passed!"
```

### 🛡️ SECURITY CHECKLIST FOR EVERY PR

Before merging any code, verify:
- [ ] No hardcoded secrets or credentials
- [ ] All inputs validated with Zod
- [ ] No console.log statements
- [ ] No 'any' types without justification
- [ ] Error boundaries in place
- [ ] Proper error handling (try-catch)
- [ ] Authentication checks on protected routes
- [ ] No innerHTML with user content
- [ ] React Query staleTime is finite
- [ ] Code splitting for large components
- [ ] Tests written and passing
- [ ] Security scan passed (npm audit)

### 🚀 PERFORMANCE CHECKLIST

- [ ] Bundle size < 50KB per route chunk
- [ ] Images have loading="lazy"
- [ ] HTTP compression enabled
- [ ] React components memoized where appropriate
- [ ] Database queries use indexes
- [ ] API responses < 200ms (p95)
- [ ] Lighthouse score > 85

**Environment Security:**
- Service role keys server-side only
- Anon keys safe for client exposure
- Proper CORS configuration
- CSP headers configured (production)
- Rate limiting enabled
- HTTPS enforced in production

---

## 📚 Resources

**Development:**
- API Documentation: `http://localhost:3001/api/docs`
- TypeScript Config: Strict mode with path aliases
- Component Library: Shadcn/ui with Radix primitives

**External Services:**
- [Supabase Dashboard](https://app.supabase.com/project/bxiiodeyqvqqcgzzqzvt)
- [Railway Dashboard](https://railway.app)

**File Organization:**
- Tests: `__tests__/` adjacent to source code
- Temporary files: `/tmp/` directory (excluded from git)
- Static assets: Supabase Storage or `/public/`
- Never commit: test files, screenshots, temporary scripts to root

## 🎯 MultiSelect Component Scrollbar Solution
**Problem:** CommandList component from cmdk library prevents scrollbar visibility in dropdowns.

**Solution:** Apply custom scrollbar styling and classes:

1. **Add custom scrollbar CSS styles:**
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 4px;
}
```

2. **Apply to CommandList with proper classes:**
```tsx
<CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
```

3. **Keep command.tsx CommandList minimal:**
```tsx
const CommandList = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
```

4. **Add container prop for portal rendering:**
```tsx
// In component props
container?: HTMLElement;

// In PopoverContent
<PopoverContent container={container} ...>
```

**Key Points:**
- Do NOT wrap CommandList in additional divs for scrolling
- Apply scrollbar styles directly to CommandList via className
- Use `custom-scrollbar` class for webkit scrollbar styling
- Set explicit max-height and overflow-y-auto on CommandList
- Pass container prop through to PopoverContent for proper portal rendering

---

*Last updated: September 2025*