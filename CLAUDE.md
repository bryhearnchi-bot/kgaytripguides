# K-GAY Travel Guides - Project Documentation

## 🚀 Project Overview

**K-GAY Travel Guides** is a full-stack web application for LGBTQ+ travel experiences, featuring trip management, event planning, and talent coordination. Built with React, Node.js, and Supabase.

**Project Location**: `/Users/bryan/develop/projects/kgay-travel-guides`

---

## 📁 File Organization Rules

### Project Structure
```
kgay-travel-guides/
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared schemas and utilities
├── public/          # Static assets
├── scripts/         # Build and utility scripts
├── docs/            # Documentation files
├── mockups/         # HTML mockup and design reference files
├── supabase/        # Supabase configuration
└── dist/            # Build output
```

### ⚠️ STRICT FILE PLACEMENT RULES

#### Temporary Files & Testing
- **Test files**: Place in `__tests__/` directories adjacent to code
- **Test scripts**: Place in `scripts/test/` subdirectory
- **Debug screenshots**: Use `/tmp/` directory, never commit
- **Temporary files**: Use `/tmp/` or `.tmp/` (gitignored)

#### Image & Asset Management
- **Uploaded images**: Store directly in Supabase Storage buckets
- **Test images**: Use `/tmp/` directory during development
- **Icons/logos**: Place in `public/` directory
- **Component assets**: Keep in `client/src/assets/`

#### Documentation & Design
- **Project docs**: Place in `docs/` directory
- **API docs**: Auto-generated at `/api/docs`
- **README files**: Only in root and major subdirectories
- **HTML mockups**: Place in `mockups/` directory
- **Design references**: Keep in `mockups/` directory

### ❌ NEVER Place in Root Directory
- Test files or test results
- Screenshots or debug images
- Temporary scripts or data files
- Personal configuration files
- Build artifacts (except dist/)

---

## 🗄️ Database Schema & Architecture

### Core Tables

#### User Management
- **`profiles`** - User accounts linked to Supabase Auth
  - Roles: admin, content_manager, viewer
  - Status: active, suspended, pending_verification
- **`invitations`** - Token-based invitation system

#### Trip Management
- **`trips`** - Travel experiences (cruises, hotels, resorts)
- **`trip_types`** - Trip categorization
- **`trip_status`** - Lifecycle states
- **`ships`** - Vessel information database

#### Locations & Itinerary
- **`locations`** - Travel destinations (formerly ports)
- **`location_types`** - Location categorization
- **`itinerary`** - Day-by-day schedules

#### Events & Entertainment
- **`events`** - Activities and entertainment
- **`party_themes`** - Themed party information
- **`talent`** - Performers and entertainers
- **`talent_categories`** - Talent classification

#### Junction Tables
- **`trip_talent`** - Links trips to performers
- **`trip_info_sections`** - Additional trip content

### Database Connection
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres
```
- **Port 6543**: Transaction pooler (required for production)
- **Port 5432**: Direct connection (development only)
- **Storage**: Supabase Storage for all images
- **Auth**: Supabase Auth with profiles table

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Build**: Vite

### Backend
- **Runtime**: Node.js v22
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth
- **Validation**: Zod schemas

### Infrastructure
- **Hosting**: Railway (production)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **CDN**: Supabase CDN for images
- **MCP Servers**: Supabase, Playwright, Perplexity

---

## 🔐 Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Server
PORT=3001
NODE_ENV=development|production

# Frontend
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### MCP Configuration
- **Supabase MCP**: Database operations and schema management
- **Playwright MCP**: Browser automation and testing
- **Perplexity MCP**: AI-powered search capabilities
- **Railway MCP**: Deployment and infrastructure

---

## 🎨 UI/UX Guidelines

### Design System
- **Theme**: Ocean-themed gradient design
- **Colors**: Blue/teal gradient palette
- **Typography**: System fonts with responsive sizing
- **Components**: Shadcn/ui component library

### Protected UI Elements (DO NOT MODIFY)
- Headers, navigation, and tab bars
- Overall color scheme and gradients
- Landing page layout
- Trip guide page structure
- Banner and hero sections

### Modifiable Elements
- Content within cards
- Admin interface components
- Data display formats
- Mobile-specific responsive fixes

---

## 🤖 Agent Orchestration Rules

### When to Use Specialized Agents

**ALWAYS use specialized agents for:**
- Code reviews and architecture decisions
- Performance optimization
- Security audits
- Database migrations
- Complex feature implementation

### Recommended Agent Patterns

#### Bug Fixes (Minimum 3 agents)
1. `code-reviewer` - Analyze the issue
2. `[specialist]` - Implement the fix (e.g., frontend-developer, backend-architect)
3. `test-automator` - Verify the fix

#### New Features (Minimum 5 agents)
1. `architect-review` - Review architecture
2. `ui-ux-designer` - Design interface (if UI)
3. `[specialists]` - Implementation (frontend/backend)
4. `test-automator` - Write tests
5. `security-auditor` - Security review

#### Database Changes
- Always use: `database-optimizer`, `sql-expert`, `security-auditor`

#### Performance Issues
- Always use: `performance-engineer`, `database-optimizer`, `code-reviewer`

### Key Specialist Agents

**Frontend**: `frontend-developer`, `react-expert`, `ui-ux-designer`, `mobile-developer`
**Backend**: `backend-architect`, `nodejs-expert`, `express-expert`, `api-documenter`
**Database**: `postgres-expert`, `sql-expert`, `database-optimizer`
**Testing**: `test-automator`, `playwright-expert`, `jest-expert`
**Security**: `security-auditor`, `frontend-security-coder`, `backend-security-coder`
**Performance**: `performance-engineer`, `react-performance-optimizer`

### Parallel Execution
When possible, run agents in parallel for efficiency:
```
Parallel: [code-reviewer, security-auditor, test-automator]
```

---

## 📝 Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with React hooks rules
- **Commits**: Conventional commits format

### Testing Requirements
- **Unit Tests**: Minimum 80% coverage for new features
- **E2E Tests**: Playwright for critical paths
- **Viewports**: Test at 375px, 768px, 1024px
- **Location**: Tests in `__tests__/` directories

### Date/Time Handling
```typescript
// ✅ CORRECT - No timezone adjustment
format(dateOnly(date), 'MMMM d')

// ❌ WRONG - Applies timezone conversion
format(new Date(date), 'MMMM d')
```

### Image Storage Pattern
```typescript
// All images stored in Supabase Storage
const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
```

---

## 🚀 Quick Start Commands

### Development
```bash
npm run dev              # Start dev server (port 3001)
npm run build            # Build for production
npm run check            # TypeScript check
npm test                 # Run tests
```

### Database
```bash
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
```

### Testing
```bash
npm run test:unit        # Unit tests
npm run test:e2e         # E2E tests
npm run test:coverage    # Coverage report
```

---

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL uses port 6543
   - Check password is database password, not JWT token
   - Ensure USE_MOCK_DATA=false

2. **Images Not Loading**
   - Check Supabase Storage bucket permissions
   - Verify SUPABASE_URL is correct
   - Ensure images are in correct bucket

3. **Authentication Issues**
   - Verify SUPABASE_ANON_KEY is set
   - Check profiles table has matching user
   - Ensure cookies are enabled

### Debug Commands
```bash
npm run db:studio        # Open Drizzle Studio
npm run analyze          # Bundle analyzer
npm run lighthouse       # Performance audit
```

---

## 📞 Support & Resources

- **Documentation**: `/docs/` directory
- **API Docs**: `http://localhost:3001/api/docs`
- **Supabase Dashboard**: [Dashboard](https://app.supabase.com/project/bxiiodeyqvqqcgzzqzvt)
- **Railway Dashboard**: [Production](https://railway.app)

---

## 🔒 Security Notes

- Never commit `.env` files
- Use Supabase RLS policies for data access
- Sanitize all user inputs
- Keep dependencies updated
- Use HTTPS in production
- Rotate API keys regularly

---

Last Updated: December 2024