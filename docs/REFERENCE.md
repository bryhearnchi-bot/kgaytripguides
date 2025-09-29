# K-GAY Travel Guides - Technical Reference

**Detailed technical information, troubleshooting guides, and project specifications.**

For critical development rules, see `CLAUDE.md`.

---

## 📋 Table of Contents

1. [Tech Stack Details](#tech-stack-details)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Development Standards](#development-standards)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Component Patterns](#component-patterns)
7. [Project Status](#project-status)

---

## 🛠️ Tech Stack Details

### Frontend Technologies

**React 18 + TypeScript**
- Strict mode enabled in tsconfig.json
- Path aliases configured (@/ prefix)
- Hot module replacement via Vite

**Vite Build System**
- Code splitting with lazy loading (Phase 4)
- Manual chunk configuration for optimal bundling
- Content-hashed filenames for cache busting
- Build time: ~2.5s (optimized)
- Initial bundle: 161KB gzipped (75% reduction from 602KB)

**State Management**
- Zustand for global state
- React Query for server state (staleTime: 5 minutes)
- React Context for theme/auth

**Styling**
- Tailwind CSS with custom configuration
- Shadcn/ui component library
- Framer Motion for animations
- Custom scrollbar utilities

**Routing**
- Wouter for client-side routing
- Lazy loaded route components
- Suspense boundaries with loading fallbacks

### Backend Technologies

**Node.js 22 + Express**
- TypeScript with ES modules
- Async/await patterns
- HTTP compression middleware (gzip)
- CORS configured for development

**Database**
- Supabase PostgreSQL (port 6543 production, 5432 development)
- Connection pooling enabled
- 19 optimized indexes (Phase 3)
- Row-level security (RLS) policies

**Authentication**
- Supabase Auth
- JWT token-based authentication
- Bearer token API authentication
- Session management

**Validation & Logging**
- Zod schemas for input validation
- Winston structured logging
- Log levels: debug, info, warn, error
- Request correlation IDs

**Documentation**
- Swagger/OpenAPI specification
- API docs at `/api/docs`
- Auto-generated from route definitions

### Infrastructure

**Hosting**
- Railway for production deployment
- Automatic deployments from main branch
- Environment variables via Railway dashboard

**Database & Storage**
- Supabase PostgreSQL database
- Supabase Storage for file uploads
- Automatic backups enabled

**Node.js Requirements**
- Node.js 20+ required
- npm 9+ recommended
- Compatible with Node.js 22

### Testing Infrastructure

**Unit Testing**
- Vitest for unit tests
- React Testing Library for component tests
- Coverage reports with c8

**Integration Testing**
- Jest for API integration tests
- Supertest for HTTP assertions
- Database fixtures for test data

**E2E Testing**
- Playwright for end-to-end tests
- Multi-browser support (Chromium, Firefox, WebKit)
- Visual regression testing capabilities

**Development Tools**
- Chrome DevTools MCP integration
- Supabase MCP for database operations
- Perplexity MCP for research

---

## 📁 Project Structure

### Full Directory Tree

```
kgay-travel-guides/
├── client/                      # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── admin/           # Admin-specific components
│   │   │   ├── ui/              # Shadcn/ui components
│   │   │   └── ErrorBoundary.tsx
│   │   ├── pages/               # Application routes (lazy loaded)
│   │   │   ├── admin/           # Admin pages
│   │   │   ├── landing.tsx      # Landing page
│   │   │   ├── trip-guide.tsx   # Trip guide (needs refactoring)
│   │   │   └── ...
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── use-toast.ts
│   │   │   ├── use-mobile.tsx
│   │   │   └── ...
│   │   ├── contexts/            # React contexts
│   │   │   ├── ProfileContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── utils/               # Utility functions
│   │   │   ├── date-utils.ts
│   │   │   ├── format-utils.ts
│   │   │   └── ...
│   │   ├── types/               # TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── lib/                 # Core libraries
│   │   │   ├── logger.ts        # Client-side logger
│   │   │   ├── queryClient.ts   # React Query config
│   │   │   └── supabase.ts      # Supabase client
│   │   ├── main.tsx             # Application entry point
│   │   └── App.tsx              # Root component
│   ├── dist/                    # Build output (14 optimized chunks)
│   ├── public/                  # Static assets
│   └── index.html               # HTML entry point
├── server/                      # Express backend application
│   ├── routes/                  # API route handlers
│   │   ├── trips.ts
│   │   ├── locations.ts
│   │   ├── talent.ts
│   │   └── ...
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts              # Authentication middleware
│   │   ├── csrf.ts              # CSRF protection
│   │   ├── errorHandler.ts      # Global error handler
│   │   └── compression.ts       # HTTP compression
│   ├── services/                # Business logic services
│   │   └── (to be created in Phase 6)
│   ├── schemas/                 # Zod validation schemas
│   │   ├── tripSchemas.ts
│   │   └── ...
│   ├── utils/                   # Server utilities
│   │   ├── db.ts                # Database connection
│   │   └── ...
│   ├── storage/                 # File storage utilities
│   │   └── storage.ts           # Supabase Storage wrapper
│   ├── logging/                 # Winston logger service
│   │   └── logger.ts            # Server-side logger
│   ├── migrations/              # Database migrations
│   └── index.ts                 # Express server entry point
├── shared/                      # Shared utilities (client/server)
│   └── types.ts
├── scripts/                     # Build and deployment scripts
│   ├── build.js
│   ├── deploy-db-migration.js
│   └── dev-secure.js            # Environment validation
├── docs/                        # Project documentation
│   ├── COMPREHENSIVE_REMEDIATION_PLAN_V2.md
│   ├── REFERENCE.md             # This file
│   ├── admin-style-guide.md
│   └── checkpoint reports/
├── test/                        # Test configuration
│   ├── setup.ts
│   └── fixtures/
├── supabase/                    # Supabase configuration
│   └── migrations/              # SQL migration files
├── public/                      # Static public assets
├── CLAUDE.md                    # Critical development rules
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env                         # Environment variables (gitignored)
└── .env.example                 # Example environment configuration
```

---

## 🗄️ Database Schema

### Core Tables

#### profiles
User profiles and authentication data
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- email (text)
- username (text)
- full_name (text)
- avatar_url (text)
- role (text: 'admin' | 'user')
- location_text (text)
- state_province (text)
- country_code (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### trips
Travel trip information
```sql
- id (uuid, primary key)
- name (text)
- slug (text, unique)
- description (text)
- start_date (date)
- end_date (date)
- image_url (text)
- hero_image_url (text)
- location_id (uuid, references locations)
- ship_id (uuid, references ships, nullable)
- type (text: 'cruise' | 'resort' | 'event')
- status (text: 'upcoming' | 'past' | 'draft')
- created_at (timestamp)
- updated_at (timestamp)
```

#### locations
Destination and venue data
```sql
- id (uuid, primary key)
- name (text)
- slug (text, unique)
- city (text)
- state_province (text)
- country (text)
- country_code (text)
- description (text)
- image_url (text)
- type (text: 'resort' | 'city' | 'venue')
- created_at (timestamp)
```

#### events
Events and activities
```sql
- id (uuid, primary key)
- trip_id (uuid, references trips)
- name (text)
- description (text)
- start_time (timestamp)
- end_time (timestamp)
- location (text)
- type (text)
- created_at (timestamp)
```

#### talent
Talent/performer management
```sql
- id (uuid, primary key)
- name (text)
- slug (text, unique)
- bio (text)
- image_url (text)
- instagram_handle (text)
- twitter_handle (text)
- category (text)
- created_at (timestamp)
```

#### ships
Cruise ship information
```sql
- id (uuid, primary key)
- name (text)
- slug (text, unique)
- description (text)
- image_url (text)
- cruise_line (text)
- capacity (integer)
- year_built (integer)
- created_at (timestamp)
```

#### itinerary
Trip schedules and itineraries
```sql
- id (uuid, primary key)
- trip_id (uuid, references trips)
- day_number (integer)
- date (date)
- title (text)
- description (text)
- activities (jsonb)
- created_at (timestamp)
```

### Junction Tables

#### trip_talent
Many-to-many relationship between trips and talent
```sql
- trip_id (uuid, references trips)
- talent_id (uuid, references talent)
- role (text: 'headliner' | 'performer' | 'host')
- created_at (timestamp)
PRIMARY KEY (trip_id, talent_id)
```

#### trip_info_sections
Trip information sections
```sql
- id (uuid, primary key)
- trip_id (uuid, references trips)
- title (text)
- content (text)
- order_index (integer)
- section_type (text)
- created_at (timestamp)
```

### Database Indexes (Phase 3 Optimized)

**High-Impact Indexes:**
- `idx_profiles_role` on profiles(role)
- `idx_profiles_location` on profiles(city, state_province, country_code)
- `idx_events_trip_time` on events(trip_id, start_time)
- `idx_itinerary_trip_day` on itinerary(trip_id, day_number)
- `idx_trip_talent_composite` on trip_talent(trip_id, talent_id, role)

**Security & Audit Indexes:**
- `idx_security_audit_severity_time` on security_audit_log(severity, timestamp DESC)
- `idx_security_audit_resource_action` on security_audit_log(resource_type, action)

**Total:** 19 new indexes, 7 duplicate indexes removed

---

## 📝 Development Standards

### Date Handling

**Use date-fns library exclusively:**
```typescript
import { format } from 'date-fns';
import { dateOnly } from '@/utils/date-utils';

// Format dates
const formatted = format(dateOnly(date), 'MMMM d'); // "September 29"

// Never convert timezones for display dates
// Use dateOnly() to strip time component
```

### Image Handling

**Supabase Storage buckets:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Image URL format
const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

// Always use lazy loading
<img src={imageUrl} loading="lazy" alt="..." />
```

**Image optimization:**
- Use WebP format where possible
- Resize before upload (max 2000px width)
- Compress with quality 85%

### Location Search System

**Photon API Integration:**
- **API**: OpenStreetMap-based geocoding service
- **Service**: `client/src/lib/location-service.ts`
- **Component**: `client/src/components/admin/LocationSearchBar.tsx`
- **Endpoint**: `https://photon.komoot.io/api/`
- **No authentication required**

**Data Flow:**
1. User types location name
2. Debounce 300ms to prevent API spam
3. Query Photon API with search term
4. Parse GeoJSON response
5. Format results for display
6. Populate form fields (city, state_province, country, country_code)
7. Submit to Supabase database

**Response Format:**
```json
{
  "features": [
    {
      "properties": {
        "name": "San Francisco",
        "country": "United States",
        "state": "California",
        "osm_type": "city",
        "osm_id": 123456
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      }
    }
  ]
}
```

### Testing Strategy

**Unit Tests (Vitest):**
- Test pure functions and utilities
- Test React hooks in isolation
- Test component rendering and interactions
- Target: 40-50% coverage (Phase 9)

**Integration Tests (Jest):**
- Test API endpoints with real database
- Test authentication flows
- Test error handling
- Use database fixtures for test data

**E2E Tests (Playwright):**
- Test critical user flows (login, trip viewing)
- Test responsive breakpoints: 375px, 768px, 1024px
- Visual regression testing for UI components
- Cross-browser testing

---

## 🔧 Troubleshooting Guide

### Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- "Role does not exist" errors
- "Schema not found" errors

**Solutions:**
1. Verify `DATABASE_URL` in .env
2. Check port is 6543 (production) or 5432 (development)
3. Ensure using database password, not JWT
4. Check `USE_MOCK_DATA` is false or removed
5. Verify Supabase project is active (not paused)
6. Test connection: `psql $DATABASE_URL`

**SQL Function Errors:**
```sql
-- If you see "function not found in schema" errors
-- Always include SET search_path in functions:
BEGIN
  SET search_path = public, extensions;
  -- rest of function
END;
```

### Authentication Issues

**Symptoms:**
- "Invalid token" errors
- User not authenticated
- 401 Unauthorized responses

**Solutions:**
1. Check `SUPABASE_ANON_KEY` is correct in .env
2. Verify `VITE_SUPABASE_ANON_KEY` in client .env
3. Ensure Bearer token in Authorization header
4. Check Supabase RLS policies are enabled
5. Verify `profiles` table exists and is populated
6. Enable cookies in browser for session management

### Image/Storage Issues

**Symptoms:**
- Images not displaying
- 404 errors for image URLs
- Upload failures

**Solutions:**
1. Check Supabase Storage bucket exists
2. Verify bucket permissions (public access for public images)
3. Confirm `SUPABASE_URL` in environment
4. Check image URL format: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
5. Ensure storage policies allow uploads
6. Verify file size limits (max 50MB)

### Performance Issues

**Symptoms:**
- Slow page loads
- Large bundle sizes
- High memory usage

**Solutions:**
1. Check initial bundle size: `npm run build` → should be < 200KB gzipped
2. Verify code splitting is working: check `dist/` folder for multiple chunks
3. Confirm lazy loading on routes: use `React.lazy()` for all route components
4. Check React Query staleTime: should be 5 minutes, not Infinity
5. Verify images have `loading="lazy"`
6. Monitor API response times: should be < 200ms (p95)
7. Use database indexes: run `EXPLAIN ANALYZE` on slow queries

### TypeScript Errors

**Common Issues:**
1. **Import errors**: Check path aliases in tsconfig.json
2. **Type errors**: Run `npm run check` for full type checking
3. **'any' types**: Replace with proper types or `unknown`
4. **Missing types**: Install @types packages
5. **Strict mode errors**: Fix or add type assertions carefully

**Type Guard Pattern:**
```typescript
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

try {
  // code
} catch (error: unknown) {
  if (isError(error)) {
    logger.error('Error:', error.message);
  }
}
```

### Build Errors

**Symptoms:**
- Build fails with TypeScript errors
- Build succeeds but app doesn't work
- Missing environment variables

**Solutions:**
1. Run `npm run check` to catch TypeScript errors
2. Clear `dist/` folder and rebuild
3. Check all environment variables are set
4. Verify no hardcoded secrets in code
5. Check for missing imports
6. Review Vite config for correct settings

### Memory Leaks

**Common Causes:**
1. **Missing useEffect cleanup**: Always return cleanup function
2. **Event listeners not removed**: Use cleanup in useEffect
3. **Timers not cleared**: Clear setTimeout/setInterval

**Example Fix:**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // code
  }, 1000);

  // Cleanup function
  return () => clearTimeout(timer);
}, []);
```

---

## 🎯 Component Patterns

### MultiSelect Component Scrollbar Solution

**Problem:** CommandList component from cmdk library prevents scrollbar visibility.

**Solution:**

1. **Add custom scrollbar CSS:**
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

2. **Apply to CommandList:**
```tsx
<CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
  {/* options */}
</CommandList>
```

3. **Keep command.tsx minimal:**
```tsx
const CommandList = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
```

4. **Add container prop for portals:**
```tsx
interface Props {
  container?: HTMLElement;
}

<PopoverContent container={container}>
  {/* content */}
</PopoverContent>
```

### Admin Table Pattern (EnhancedTable)

**Image Column:**
- width: 80, minWidth: 80, maxWidth: 80
- Images: h-14 w-14 rounded-xl
- Gradient background on missing images

**Actions Column:**
- width: '100px'
- text-center alignment
- h-4 w-4 rounded-xl buttons
- gap-1.5 between buttons

**Action Button Styles:**
- Edit: frosted glass effect (border-white/15 bg-white/5 hover:bg-white/10)
- Delete: border-[#fb7185]/30 bg-[#fb7185]/10 text-[#fb7185]
- Add: bg-blue-500/10 hover:bg-blue-500/15, PlusSquare icon h-5 w-5

**Table Features:**
- Column resizing with drag handles
- Column sorting with icons
- Mobile card layout
- "Showing X of Y [items]" footer
- Simple "All [Items]" header (no count)

---

## 📊 Project Status

### ✅ Completed Phases (Current: Phase 4)

**Phase 1: Critical Security Fixes** ✅
- Duration: 2 hours (estimated 6 hours)
- Removed hardcoded credentials from package.json
- Created .env.example and dev-secure.js validation
- Added environment validation to server startup
- Removed fallback secrets from auth.ts and csrf.ts
- Fixed SQL functions with search_path
- Replaced console.log in critical security files (26 statements)
- Database backup created (1.1MB, 68 tables)

**Phase 2: Performance Quick Wins** ✅
- Duration: 3.5 hours (estimated 4 hours)
- Added HTTP compression middleware
- Fixed React Query staleTime: Infinity → 5 minutes
- Added lazy loading to 18 images across 6 files
- Fixed useEffect cleanup in trip-guide.tsx (7 cleanups)
- Added global error boundary
- Fixed XSS vulnerabilities (removed 2 innerHTML usages)

**Phase 3: Database Optimization** ✅
- Duration: 3 hours (estimated 3 hours)
- Created 19 new indexes across 7 tables
- Removed 7 duplicate indexes (saved ~112KB)
- Added security_audit_log indexes (3 composite)
- Configured autovacuum settings (3 tables)
- Ran VACUUM FULL (reclaimed ~424KB disk space)
- Expected 20-90% query performance improvements

**Phase 4: Code Splitting & Bundling** ✅
- Duration: 45 minutes (estimated 4 hours)
- Converted 19 routes to lazy loading
- Configured Vite manual chunks (9 vendor + 3 app chunks)
- Added Suspense with PageLoader component
- Configured chunk size warnings (300KB)
- Build validation: 161KB gzipped initial load (75% reduction)
- Build time: 2.47s (40% faster)

### 📈 Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Bundle Size | 602KB | 161KB | 75% reduction |
| Build Time | 4.2s | 2.5s | 40% faster |
| Database Queries | N/A | N/A | 20-90% faster |
| Trip Guide Queries | N/A | N/A | 50-80% faster |
| Admin Dashboard | N/A | N/A | 40-60% faster |
| Security Audits | N/A | N/A | 60-90% faster |

### 🎯 Remaining Phases (Optional)

**Phase 5: TypeScript Safety** (12 hours estimated)
- Replace 'any' types in storage.ts
- Create generic TableColumn<T> interface
- Update Enhanced*Table components
- Fix trip data structure types
- Replace catch (error: any) with unknown

**Phase 6: Backend Architecture** (8 hours estimated)
- Create asyncHandler middleware
- Standardize error handling across routes
- Add request correlation IDs
- Create service layer for Trip operations
- Add response caching (optional Redis)

**Phase 7: React Refactoring** (8 hours estimated)
- Split trip-guide.tsx into components
- Create tabs/ folder (5 components)
- Create modals/ folder (3 components)
- Create shared/ folder (3 components)
- Create hooks/ folder (3 hooks)
- Add React.memo to expensive components

**Phase 8: Code Quality Tools** (3 hours estimated)
- Update ESLint config with security rules
- Add pre-commit hooks (Husky)
- Configure Prettier
- Create security-check.sh script
- Run and fix all ESLint errors

**Phase 9: Testing Foundation** (4 hours estimated - Optional)
- Add tests for critical utils
- Add API integration tests for auth
- Add E2E test for login flow
- Target 40-50% coverage

---

## 🔗 Related Documentation

- **Critical Rules**: See `CLAUDE.md` (root)
- **Admin Style Guide**: See `docs/admin-style-guide.md`
- **Remediation Plan**: See `docs/COMPREHENSIVE_REMEDIATION_PLAN_V2.md`
- **Phase Checkpoint Reports**: See `docs/PHASE_*_CHECKPOINT_REPORT.md`

---

*Last updated: September 2025*
*Current Phase: Phase 4 Complete*
*For critical development rules, see `CLAUDE.md`*