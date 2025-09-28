# K-GAY Travel Guides - Project Documentation

## 🚨 CRITICAL DATABASE RULE - READ FIRST
**SUPABASE IS THE ONLY DATABASE SYSTEM WE USE. PERIOD.**
- ✅ Database: Supabase PostgreSQL ONLY
- ✅ Connection: `DATABASE_URL=postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres`
- ❌ NO Neon, NO mock data, NO other databases EVER
- ❌ NEVER use `USE_MOCK_DATA=true` - always use Supabase
- 🔥 **ANY DATABASE OPERATION MUST GO TO SUPABASE - NO EXCEPTIONS**

## 🎉 MIGRATION COMPLETE - DRIZZLE FULLY REMOVED
**✅ DRIZZLE → SUPABASE MIGRATION COMPLETED (Phase 6)**
- ✅ All storage classes migrated to Supabase Admin
- ✅ All route files using Supabase instead of Drizzle
- ✅ Zero Drizzle dependencies remaining
- ✅ Server successfully running on Supabase architecture
- ✅ Phase 1-6 migration plan fully executed

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
**Backend:** Node.js 22 + Express, Supabase Admin, Zod validation
**Infrastructure:** Railway hosting, Supabase (DB/Auth/Storage)
**MCP:** Supabase, Playwright, Perplexity

**MIGRATION STATUS:** ✅ **DRIZZLE FULLY REMOVED** - All storage operations now use Supabase Admin directly

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

---

## 🔄 Data Consistency Rule
**CRITICAL: Always use API endpoints for data operations, never mix Supabase direct queries with API calls**

**Problem:** Mixed data access patterns cause sync issues:
- **Updates** via API (Drizzle ORM + snake_case)
- **Fetches** via Supabase client (different field mapping + caching)

**Solution:** Use API for both save AND fetch operations:
```typescript
// ❌ WRONG - Mixed approach causes data sync issues
const updateProfile = () => api.put('/api/admin/profile', data);  // API
const fetchProfile = () => supabase.from('profiles').select('*'); // Direct

// ✅ CORRECT - Consistent API usage
const updateProfile = () => api.put('/api/admin/profile', data);   // API
const fetchProfile = () => fetch('/api/admin/profile');           // API
```

**Key Changes Made:**
1. **Profile fetching**: `useSupabaseAuth.ts` now uses `/api/admin/profile`
2. **User management**: `UserManagement/` components use `/api/auth/users`
3. **Field mapping**: Consistent camelCase ↔ snake_case conversion

**Exceptions:** Direct Supabase allowed for:
- Auth operations (`supabase.auth.*`)
- File storage (`supabase.storage.*`)
- Internal authorization checks (authUtils.ts)

---

## 🔒 Security & Resources
**Security:** Never commit `.env`, use RLS policies, sanitize inputs, HTTPS in production
**Resources:**
- API docs: `http://localhost:3001/api/docs`
- [Supabase Dashboard](https://app.supabase.com/project/bxiiodeyqvqqcgzzqzvt)
- [Railway Dashboard](https://railway.app)

---

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