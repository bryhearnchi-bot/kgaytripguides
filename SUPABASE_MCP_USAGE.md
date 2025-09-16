# Supabase MCP Server Usage Guide

## ✅ MCP Configuration Complete

The Supabase MCP server is now properly configured and working with:
- **Access Token**: `sbp_c0b9f0c690627fa03f93454eeec2dd3d08e7b201`
- **Project ID**: `bxiiodeyqvqqcgzzqzvt`
- **Service Role Key**: Configured

## 🔧 Available MCP Commands

### Database Operations
```javascript
// Execute SQL
mcp__supabase__execute_sql
mcp__supabase__apply_migration

// Table operations
mcp__supabase__list_tables
mcp__supabase__generate_typescript_types
```

### Project Management
```javascript
// Project info
mcp__supabase__list_projects
mcp__supabase__get_project

// Monitoring
mcp__supabase__get_logs
mcp__supabase__get_advisors
```

### Edge Functions
```javascript
mcp__supabase__list_edge_functions
mcp__supabase__get_edge_function
mcp__supabase__deploy_edge_function
```

### Branch Management
```javascript
mcp__supabase__create_branch
mcp__supabase__list_branches
mcp__supabase__merge_branch
mcp__supabase__delete_branch
```

## ⚠️ Important Notes

### Always Use MCP for Supabase
- ✅ **DO**: Use `mcp__supabase__*` commands for all Supabase operations
- ❌ **DON'T**: Use direct PostgreSQL connections or manual API calls
- ❌ **DON'T**: Use `psql` or `pg` client libraries directly

### Benefits of MCP
1. **Integrated Authentication**: No need to manage connection strings
2. **Audit Trail**: All operations are logged
3. **Type Safety**: Built-in TypeScript generation
4. **Security**: Service role key managed securely
5. **Consistency**: Standardized interface for all operations

### Common Operations via MCP

#### Query Data
```javascript
// Use this
mcp__supabase__execute_sql({
  project_id: "bxiiodeyqvqqcgzzqzvt",
  query: "SELECT * FROM cruises"
})

// NOT this
const client = new pg.Client(connectionString);
```

#### Apply Migrations
```javascript
// Use this
mcp__supabase__apply_migration({
  project_id: "bxiiodeyqvqqcgzzqzvt",
  name: "add_new_table",
  query: "CREATE TABLE ..."
})

// NOT manual SQL files
```

#### Check Database Health
```javascript
// Use this
mcp__supabase__get_advisors({
  project_id: "bxiiodeyqvqqcgzzqzvt",
  type: "security"
})
```

## 📋 Current Database Status

Tables created via MCP:
- ✅ cruises
- ✅ talent
- ✅ ports
- ✅ parties
- ✅ itinerary
- ✅ events
- ✅ event_talent
- ✅ trip_info_sections
- ✅ cruise_talent

## 🔐 Security Notes

The MCP server handles:
- Authentication tokens securely
- Service role key management
- Access control
- Request logging

Never expose these credentials in:
- Frontend code
- Public repositories
- Client-side JavaScript
- Environment variables in production

## 🚀 Quick Test

Test MCP connection:
```javascript
mcp__supabase__list_projects()
// Should return project: bxiiodeyqvqqcgzzqzvt
```

Test database query:
```javascript
mcp__supabase__execute_sql({
  project_id: "bxiiodeyqvqqcgzzqzvt",
  query: "SELECT COUNT(*) FROM cruises"
})
```

---

**Remember**: Always use MCP for Supabase operations - it's configured, secure, and ready!