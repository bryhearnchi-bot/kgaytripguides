# Environment Configuration

## Project Overview

**Project Name**: K-GAY Travel Guides
**Type**: Full-stack web application for LGBTQ+ cruise vacation guides
**Current Cruise**: Greek Isles 2025 (Atlantis Cruise)
**Tech Stack**: React + TypeScript + Node.js + Express + Supabase

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.5.4
- **Build Tool**: Vite 5.4.10
- **Styling**: Tailwind CSS 3.4.15
- **State Management**: Zustand 5.0.1
- **Routing**: Tanstack Router 1.82.8
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Date Handling**: date-fns 4.1.0
- **Forms**: React Hook Form with Zod validation
- **Animation**: Framer Motion 11.12.0

### Backend
- **Runtime**: Node.js with Express 4.21.2
- **Language**: TypeScript
- **API**: RESTful endpoints with express-cors
- **Session**: express-session with Supabase session store
- **Validation**: Zod schemas shared between frontend and backend

### Database & Authentication
- **Primary Database**: Supabase PostgreSQL with Transaction Pooler (port 6543)
- **ORM**: Drizzle ORM 0.39.3 with node-postgres driver
- **Authentication**: Supabase Auth (@supabase/supabase-js 2.57.4)
- **Storage**: Supabase Storage for images and media
- **Schema Location**: `shared/schema.ts`
- **Connection**: Optimized for serverless deployment via transaction pooler

### Development Tools
- **Package Manager**: npm
- **Testing**: Vitest + Playwright for E2E tests
- **Linting**: ESLint with TypeScript support
- **Type Checking**: TypeScript strict mode
- **Hot Reload**: Vite HMR for frontend, tsx watch for backend

### MCP Servers (Model Context Protocol)
- **supabase**: Database and auth management (project: bxiiodeyqvqqcgzzqzvt.supabase.co)
- **perplexity-sonar**: AI-powered search capabilities
- **playwright**: Browser automation and E2E testing
- **railway**: Deployment and infrastructure management

## Environment Variables

### Required Variables
```bash
# Database - CRITICAL: Use Transaction Pooler for serverless optimization
# Port 6543 = Transaction Pooler (recommended for serverless)
# Port 5432 = Direct connection (not recommended for serverless)
# Host: db.bxiiodeyqvqqcgzzqzvt.supabase.co (direct database, NOT pooler endpoints)
# Password: Real database password from Supabase dashboard (NOT JWT tokens)
DATABASE_URL=postgresql://postgres:[REAL_PASSWORD]@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres

# Supabase - Frontend Environment Variables
VITE_SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]

# Supabase - Service Role Key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# JWT Secrets (Strong cryptographically secure secrets)
JWT_ACCESS_TOKEN_SECRET=[your-access-token-secret]
JWT_REFRESH_TOKEN_SECRET=[your-refresh-token-secret]

# Server Configuration
PORT=3001
NODE_ENV=development|production

# Session Secret (Strong cryptographically secure secret)
SESSION_SECRET=[your-session-secret]

# Development Controls - NEVER use in production
USE_MOCK_DATA=false  # ALWAYS false - real database connection required
VITE_USE_MOCK_DATA=false  # ALWAYS false - real data required
```

## Data Configuration

### Production Environment
- **NODE_ENV=production**: Always uses real Greek Isles cruise data
- **Cruise Slug**: `greek-isles-2025`
- **Data Source**: `client/src/data/cruise-data.ts`
- **Dates**: August 21-31, 2025
- **Ports**: Athens, Santorini, Kuşadası, Istanbul, Alexandria, Mykonos, Iraklion
- **No mock data allowed** in production for security and data integrity

### Development Environment
- **Default**: Uses real Greek Isles cruise data (same as production)
- **Testing with Mock Data**: Set `USE_MOCK_DATA=true`
  - Cruise slug: `mock-cruise-2024`
  - Data source: `client/src/data/mock-data.ts`
  - Simplified data for UI testing
  - Only available when NODE_ENV=development

## Project Structure

```
kgay-travel-guides/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Route-based page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   ├── data/         # Static cruise data files
│   │   └── contexts/     # React context providers
│   └── public/           # Static assets
├── server/                # Express backend API
│   ├── routes.ts         # API endpoint definitions
│   ├── storage.ts        # Database connection and queries
│   └── index.ts          # Server entry point
├── shared/               # Shared code between frontend and backend
│   ├── schema.ts        # Database schema (Drizzle ORM)
│   └── types.ts         # TypeScript type definitions
├── scripts/              # Utility scripts
│   ├── seed.js          # Database seeding
│   └── create-test-user.js  # Test user creation
├── test/                 # E2E tests (Playwright)
└── archived/            # Old/migrated code for reference

```

## Authentication System

### Current Implementation
- **Provider**: Supabase Auth
- **Context**: `SupabaseAuthContext` (located in `client/src/contexts/`)
- **Admin Credentials**:
  - Email: `admin@atlantis.com`
  - Password: `Admin123!`
- **Session Management**: Server-side sessions with Supabase session store
- **Protected Routes**: Implemented via `ProtectedRoute` component

### Auth Flow
1. User logs in via Supabase Auth
2. Session created on server with Supabase session store
3. Frontend uses `useSupabaseAuth` hook for auth state
4. Protected routes check authentication before rendering

## Database Schema

### Main Tables
- **users**: User accounts and profiles
- **trips**: Cruise trip information
- **ports**: Destination port details
- **events**: Cruise events and parties
- **talent**: Performers and entertainers
- **infoupdates**: News and announcements
- **translations**: Multi-language support
- **itinerary**: Day-by-day schedule

### Relationships
- Users can have multiple trip associations
- Trips have multiple ports, events, and talent
- Events belong to specific trips
- Talent can perform at multiple events

## Available Scripts

### Development
```bash
npm run dev           # Start both frontend and backend in dev mode
npm run dev:client    # Start frontend only
npm run dev:server    # Start backend only
```

### Building
```bash
npm run build         # Build both frontend and backend
npm run build:client  # Build frontend only
npm run build:server  # Build backend only
```

### Database
```bash
npm run db:seed       # Seed database with cruise data
npm run db:migrate    # Run database migrations (if any)
```

### Testing
```bash
npm test              # Run unit tests in watch mode
npm run test:run      # Run all tests once (CI mode)
npm run test:e2e      # Run E2E tests with Playwright
npm run test:e2e:ui   # Run E2E tests with UI
```

### Type Checking & Linting
```bash
npm run check         # Run TypeScript type checking
npm run lint          # Run ESLint
```

## Deployment Configuration

### Current Deployment
- **Platform**: Railway (via MCP server)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment**: Production variables set in Railway dashboard

### Deployment Process
1. Push changes to main branch
2. Railway automatically builds and deploys
3. Database migrations run automatically (if configured)
4. New version live at production URL

## Image Storage Strategy

### Current Implementation
- **Provider**: Supabase Storage
- **Buckets**:
  - `talent-images`: Artist profile photos
  - `port-images`: Destination photos
  - `party-images`: Event hero images
- **CDN**: Supabase Storage CDN with automatic optimization
- **Migration Status**: ✅ Complete (Cloudinary archived to `archived/old-cloudinary/`)

### Image References
- All image URLs stored in database
- Frontend loads images via Supabase public URLs
- Automatic transformation and optimization via Supabase CDN

## Mobile Responsiveness

### Breakpoints
- **Mobile**: 375px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Testing Requirements
- All features must work on mobile devices
- Touch interactions properly implemented
- Viewport tests at each breakpoint
- Performance optimized for mobile networks

## Security Considerations

### Authentication
- Supabase Auth handles user authentication
- Row Level Security (RLS) enabled on all tables
- Service role key only used server-side
- Anon key safe for client-side use

### API Security
- CORS configured for production domain
- Session-based authentication for API routes
- Input validation with Zod schemas
- SQL injection prevention via Drizzle ORM

### Environment Variables
- Never commit `.env` files
- Use environment-specific configs
- Rotate secrets regularly
- Store sensitive data in Supabase vault

## Performance Optimization

### Frontend
- Lazy loading for routes and components
- Image optimization via Supabase CDN
- Bundle splitting with Vite
- Preconnect to external domains

### Backend
- Database connection pooling via Supabase Transaction Pooler
- Efficient query patterns with Drizzle
- Response caching where appropriate
- Gzip compression enabled

## Database Troubleshooting

### Common Connection Issues & Solutions

#### "Tenant or user not found" Error
- **Cause**: Using pooler endpoints or JWT tokens as password
- **Solution**: Use direct database host (`db.bxiiodeyqvqqcgzzqzvt.supabase.co`) with real password

#### "Permission denied for schema public" Error
- **Cause**: Using JWT tokens instead of database password
- **Solution**: Get real database password from Supabase dashboard

#### Slow Connection Times
- **Cause**: Using direct connection (port 5432) instead of transaction pooler
- **Solution**: Use port 6543 for transaction pooler (serverless-optimized)

### Correct vs Incorrect Database URLs

#### ✅ CORRECT (Transaction Pooler)
```bash
DATABASE_URL=postgresql://postgres:qRlGhCf4xnNXCeBF@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres
```

#### ❌ INCORRECT Examples
```bash
# Wrong: Using pooler endpoint
DATABASE_URL=postgresql://postgres:password@aws-0-us-east-2.pooler.supabase.com:5432/postgres

# Wrong: Using JWT token as password
DATABASE_URL=postgresql://postgres:eyJhbGciOiJIUzI1NiIs...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres

# Wrong: Using direct connection port for serverless
DATABASE_URL=postgresql://postgres:qRlGhCf4xnNXCeBF@db.bxiiodeyqvqqcgzzqzvt.supabase.co:5432/postgres
```

### Database Connection Testing
```bash
# Test API endpoint
curl -s http://localhost:3001/api/trips

# Expected success response: Array of cruise trips with HTTP 200
# Expected server logs: "Found X trips" and "GET /api/trips 200"
```

## Monitoring & Logging

### Development
- Console logging for debugging
- Vite HMR for instant feedback
- React DevTools integration

### Production
- Error boundaries for graceful failures
- Structured logging (if configured)
- Supabase dashboard for monitoring
- Railway metrics for deployment health

## Version Control

### Git Configuration
- **Repository**: Git-managed project
- **Main Branch**: `main`
- **Commit Convention**: Descriptive messages with ticket references
- **Protected Files**: Never commit `.env`, `node_modules/`, or sensitive data

## Support & Documentation

### Internal Documentation
- `CLAUDE.md`: AI assistant instructions and project notes
- `environment.md`: Comprehensive environment configuration

### Planning Documents (in `Plans/` folder)
- `Plans/BACKEND_PLAN_SIMPLIFIED.md`: Backend architecture guide
- `Plans/DB_LOGIC_PLAN_SIMPLIFIED.md`: Database design documentation
- `Plans/UI_UX_DESIGNER_BRIEF.md`: Design system and visual standards
- `Plans/UI_UX_IMPLEMENTATION_GUIDE.md`: UI implementation specifications
- `Plans/PHASE_3_SUMMARY.md`: Migration status and progress
- `Plans/SECURITY_PLAN.md`: Security guidelines and best practices
- `Plans/DISASTER_RECOVERY_PLAN.md`: Backup and recovery procedures
- `Plans/SUPABASE_MIGRATION_GUIDE.md`: Supabase integration guide

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Railway Documentation](https://docs.railway.app)

## Known Issues & TODOs

### Current Issues
- None reported at this time

### Upcoming Features
- Enhanced AI assistant integration
- Additional cruise destinations
- Advanced search functionality
- Social sharing features

---

*Last Updated: January 2025*
*Version: 1.0.0*