# K-GAY Travel Guides - Project Documentation

## ⚡ Server Management
**ALWAYS use `npm run dev` with `run_in_background: true` to start the development server. No custom restart scripts.**
```bash
# Use Bash tool with run_in_background: true
npm run dev
```
**CRITICAL**: Always set `run_in_background: true` when using Bash tool to start the server. This prevents blocking and allows immediate response.

## 🚀 Project Overview
**K-GAY Travel Guides** - LGBTQ+ travel app with trip management, events, and talent coordination. React/Node.js/Supabase stack.

## 📁 File Organization
```
client/     # React frontend          server/     # Express backend
shared/     # Shared utilities        public/     # Static assets
scripts/    # Build scripts           docs/       # Documentation
mockups/    # Design references       supabase/   # DB config
```

**File Rules:**
- Tests: `__tests__/` adjacent to code
- Temp files: `/tmp/` (never commit)
- Images: Supabase Storage buckets
- Never place in root: test files, screenshots, temp scripts

---

## 🗄️ Database Schema
**Core Tables:** `profiles`, `trips`, `locations`, `events`, `talent`, `ships`, `itinerary`
**Junction:** `trip_talent`, `trip_info_sections`

**Connection:** `DATABASE_URL=postgresql://...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres`
- Port 6543 (production), 5432 (dev)
- Supabase Auth + Storage

---

## 🛠️ Tech Stack
**Frontend:** React 18 + TypeScript, Tailwind, Zustand + React Query, Vite
**Backend:** Node.js 22 + Express, Drizzle ORM, Zod validation
**Infrastructure:** Railway hosting, Supabase (DB/Auth/Storage)
**MCP:** Supabase, Playwright, Perplexity

---

## 🔐 Environment
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3001
VITE_API_URL=http://localhost:3001
```

---

## 🎨 UI/UX Guidelines
**Design:** Ocean theme, blue/teal gradients, Shadcn/ui components
**Protected:** Headers, navigation, color scheme, landing/trip pages
**Modifiable:** Card content, admin interface, data displays, mobile fixes

---

## 🤖 Agent Rules
**Always use agents for:** Code reviews, performance, security, DB migrations, complex features

**Patterns:**
- **Bug fixes:** `code-reviewer` → `[specialist]` → `test-automator`
- **New features:** `architect-review` → `ui-ux-designer` → `[specialists]` → `test-automator` → `security-auditor`
- **DB changes:** `database-optimizer` + `sql-expert` + `security-auditor`

**Key Agents:** `frontend-developer`, `backend-architect`, `database-optimizer`, `test-automator`, `security-auditor`

---

## 📝 Development
**Standards:** TypeScript strict, Prettier, ESLint, conventional commits
**Testing:** 80% coverage, Playwright E2E, test at 375px/768px/1024px
**Dates:** Use `format(dateOnly(date), 'MMMM d')` - no timezone conversion
**Images:** `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

---

## 🚀 Commands
```bash
npm run dev             # Dev server (port 3001)
npm run build           # Production build
npm test                # Run tests
npm run db:push         # Push schema
npm run db:migrate      # Run migrations
npm run test:e2e        # E2E tests
```

---

## 🔧 Troubleshooting
**DB Connection:** Use port 6543, database password (not JWT), USE_MOCK_DATA=false
**Images:** Check bucket permissions, verify SUPABASE_URL
**Auth:** Verify SUPABASE_ANON_KEY, check profiles table, enable cookies
**Debug:** `npm run db:studio`, `npm run analyze`, `npm run lighthouse`

---

## 🔒 Security & Resources
**Security:** Never commit `.env`, use RLS policies, sanitize inputs, HTTPS in production
**Resources:**
- API docs: `http://localhost:3001/api/docs`
- [Supabase Dashboard](https://app.supabase.com/project/bxiiodeyqvqqcgzzqzvt)
- [Railway Dashboard](https://railway.app)