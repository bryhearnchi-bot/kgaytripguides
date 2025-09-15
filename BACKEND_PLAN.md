# Backend Development & Migration Plan

## Project Overview
Complete full-stack overhaul including database restructuring for better normalization, migration from Railway/Cloudinary to Supabase, implementation of AI features in both backend and frontend admin interface, codebase cleanup, and development environment reorganization.

**⚠️ IMPORTANT**: Database restructuring (see DB_LOGIC_PLAN.md) must be completed FIRST before migration to Supabase.

---

## Phase 0: Environment Setup & Organization
**Timeline: Day 1-3**
**Status: ✅ COMPLETED**

### 0.1 Development Environment Reorganization ✅ COMPLETED
- [x] Create organized folder structure at `~/develop`
  ```
  ~/develop/
  ├── /claude-mcp/        # MCP installations
  ├── /projects/          # All projects
  └── /tools/             # Dev tools
  ```
- [x] Move project from `~/Desktop/Atlantis Trip Guides` to `~/develop/projects/atlantis-trip-guides`
- [x] Update all path references in project (✅ No hardcoded paths found)
- [x] Test project runs correctly in new location (✅ Basic structure verified)
- [x] Update git remotes if needed (✅ Git repository intact, remotes preserved)

### 0.2 MCP Configuration Management (Global Claude Code Setup)
**Note**: MCPs are installed globally for Claude Code, not project-specific

- [ ] Remove Neon MCP from global Claude configuration
- [ ] Install Playwright MCP globally (`~/develop/claude-mcp/playwright-mcp/`)
- [ ] Install Supabase MCP globally for database management
- [ ] Install Vercel MCP globally for deployment management
- [ ] Install Perplexity MCP globally for enhanced web search/research
- [ ] Configure all MCPs in global `claude_desktop_config.json`
- [ ] Test all MCPs work across different projects
- [ ] Document MCP usage for future projects

---

## Phase 0.5: Database Structure Restructuring (PRIORITY)
**Timeline: Week 1**
**Status: Not Started**
**Reference**: See `DB_LOGIC_PLAN.md` for detailed implementation

### 0.5.1 Create New Normalized Tables
- [ ] Create `ports` table for reusable port/location data
- [ ] Create `parties` table for reusable party templates
- [ ] Update `itinerary` table to reference ports
- [ ] Update `events` table to reference parties and talents
- [ ] Create `event_talent` junction table

### 0.5.2 Data Migration to New Structure
- [ ] Extract unique ports from existing itinerary data
- [ ] Extract party templates from existing events
- [ ] Migrate existing talent relationships to new junction table
- [ ] Update all foreign key relationships
- [ ] Validate data integrity after migration

### 0.5.3 Update Storage Layer for New Structure
- [ ] Create `PortStorage` class with CRUD operations
- [ ] Create `PartyStorage` class with CRUD operations
- [ ] Update `ItineraryStorage` to use port relationships
- [ ] Update `EventStorage` to use party and talent relationships
- [ ] Update TypeScript interfaces for new structure

### 0.5.4 Admin Interface Updates for New Structure
- [ ] Create Port Management component
- [ ] Create Party Management component
- [ ] Update Itinerary tab to use port selection
- [ ] Update Events tab to use party and talent selection
- [ ] Add reusable entity libraries

---

## Phase 1: Codebase Cleanup
**Timeline: Week 2**
**Status: Not Started**

### 1.1 Remove Legacy Service References
- [ ] Delete `/modelcontextprotocol/` folder (Neon MCP)
- [ ] Remove all Neon references from `CLAUDE.md`
- [ ] Delete `server/utils/replitmail.ts`
- [ ] Remove any `.replit` configuration files
- [ ] Delete `netlify.toml` if exists
- [ ] Remove Netlify deployment scripts

### 1.2 Clean Up Scripts & Files
- [ ] Archive/remove old migration scripts:
  - [ ] `upload-all-talents.mjs`
  - [ ] `update-talent-db-simple.mjs`
  - [ ] `upload-port-images.mjs`
  - [ ] `update-itinerary-images.mjs`
  - [ ] `update-party-images.mjs`
- [ ] Remove unused Cloudinary migration files:
  - [ ] `server/cloudinary.ts`
  - [ ] `server/migrate-to-cloudinary.ts`
  - [ ] `server/image-migration.ts`

### 1.3 Update Documentation
- [ ] Update `CLAUDE.md` to remove all legacy references
- [ ] Create new `README.md` with current tech stack
- [ ] Update `.env.example` with only needed variables
- [ ] Clean `package.json` scripts section

### 1.4 Code Reference Cleanup
- [ ] Search and remove all "neon" references (case insensitive)
- [ ] Search and remove all "replit" references
- [ ] Search and remove all "netlify" references
- [ ] Remove environment variables:
  - [ ] All `NEON_*` variables
  - [ ] All `REPLIT_*` variables
  - [ ] All `NETLIFY_*` variables
  - [ ] All `CLOUDINARY_*` variables (after migration)

---

## Phase 2: Supabase Migration
**Timeline: Week 2-3**
**Status: Not Started**
**Note**: Database migration will include the new normalized structure

### 2.1 Supabase Project Setup
- [ ] Create Supabase project
- [ ] Configure project settings
- [ ] Set up environment variables:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_KEY`
- [ ] Enable required extensions (pgvector for AI)

### 2.2 Database Migration
- [ ] Export Railway PostgreSQL database
- [ ] Import database to Supabase
- [ ] Update `DATABASE_URL` to Supabase connection
- [ ] Test all database queries work
- [ ] Enable Row Level Security (RLS)
- [ ] Set up database backups

### 2.3 Storage Migration
- [ ] Create Supabase storage buckets:
  - [ ] `talent-images` (public)
  - [ ] `event-images` (public)
  - [ ] `itinerary-images` (public)
  - [ ] `trip-images` (public)
  - [ ] `documents` (private)
- [ ] Write migration script for Cloudinary → Supabase
- [ ] Download all images from Cloudinary
- [ ] Upload all images to Supabase Storage
- [ ] Update all image URLs in database
- [ ] Verify all images are accessible
- [ ] Set up CDN and transformations

### 2.4 Authentication Migration
- [ ] Set up Supabase Auth
- [ ] Migrate existing users to Supabase Auth
- [ ] Implement magic link authentication
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Update middleware to use Supabase sessions
- [ ] Implement role-based access control
- [ ] Test authentication flow

### 2.5 Post-Migration Cleanup
- [ ] Remove Railway-specific code
- [ ] Remove Cloudinary dependencies
- [ ] Update `server/storage.ts` for Supabase only
- [ ] Update `server/image-utils.ts` for Supabase Storage
- [ ] Delete old migration scripts
- [ ] Remove Railway MCP (after verification)

---

## Phase 3: Clean Architecture Implementation
**Timeline: Week 2**
**Status: Not Started**

### 3.1 Restructure Backend Folders
- [ ] Create new folder structure:
  ```
  /server
  ├── /api
  │   ├── /routes
  │   └── /middleware
  ├── /services
  │   ├── /ai
  │   ├── /storage
  │   └── /database
  └── /utils
  ```
- [ ] Move files to appropriate locations
- [ ] Update all import statements
- [ ] Remove duplicate code

### 3.2 Environment Variables Cleanup
- [ ] Create clean `.env` structure
- [ ] Remove all obsolete variables
- [ ] Document all required variables
- [ ] Set up `.env.example` template

### 3.3 Dependencies Cleanup
- [ ] Remove unused npm packages:
  - [ ] `@neondatabase/serverless`
  - [ ] `cloudinary`
  - [ ] All Netlify packages
  - [ ] All Replit packages
- [ ] Update to latest versions of kept packages
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Optimize bundle size

---

## Phase 4: AI Backend Implementation
**Timeline: Week 3-4**
**Status: Not Started**

### 4.1 Supabase Edge Functions Setup
- [ ] Create Edge Function for URL extraction
- [ ] Create Edge Function for email processing
- [ ] Create Edge Function for PDF processing
- [ ] Create Edge Function for content generation
- [ ] Create Edge Function for image generation
- [ ] Set up shared AI utilities

### 4.2 AI Service Integration
- [ ] Integrate OpenAI GPT-4 API
- [ ] Set up Perplexity AI for research
- [ ] Configure document processing (Google Document AI or AWS Textract)
- [ ] Implement rate limiting for AI endpoints
- [ ] Add cost tracking and monitoring

### 4.3 Automated Workflows
- [ ] **Trip Creation from URL**:
  - [ ] Web scraping implementation
  - [ ] AI data extraction
  - [ ] Auto-populate trip fields
  - [ ] Validation and confidence scoring

- [ ] **Email Processing Pipeline**:
  - [ ] Set up email webhook endpoint
  - [ ] Parse email content and attachments
  - [ ] AI analysis for updates
  - [ ] Smart merge with existing data
  - [ ] Change tracking and approval flow

- [ ] **PDF Document Processing**:
  - [ ] Upload handler
  - [ ] OCR and text extraction
  - [ ] Intelligent parsing for different sections
  - [ ] Conflict resolution system
  - [ ] Automatic categorization

### 4.4 AI Assistant Features
- [ ] Context-aware suggestions
- [ ] Auto-complete for forms
- [ ] **AI Web Research & Data Enrichment**:
  - [ ] Port/location research via Perplexity MCP
  - [ ] Talent biography and social media discovery
  - [ ] Venue information lookup
  - [ ] Historical data and facts gathering
  - [ ] Image search and suggestions
  - [ ] Real-time information updates
- [ ] Image suggestions and generation
- [ ] Content generation helpers

### 4.5 Database Schema Updates for AI
- [ ] Add AI-specific tables:
  - [ ] `ai_jobs` table
  - [ ] `extraction_templates` table
  - [ ] `ai_change_log` table
- [ ] Add AI fields to existing tables:
  - [ ] `ai_extracted` boolean to ports, parties, events, itinerary
  - [ ] `confidence_score` decimal for AI-generated content
  - [ ] `last_ai_update` timestamp
- [ ] **AI Integration with New Structure**:
  - [ ] AI can suggest existing ports when extracting itineraries
  - [ ] AI can recommend party templates for events
  - [ ] AI can match talent to appropriate events
  - [ ] Enhanced data consistency through normalization

---

## Phase 5: AI Frontend Implementation
**Timeline: Week 4**
**Status: Not Started**

### 5.1 Enhanced AI Assistant Panel
- [ ] **Complete AiAssistPanel.tsx Implementation**:
  - [ ] Replace placeholder functions with real API calls
  - [ ] Add real-time job status updates
  - [ ] Implement preview and apply functionality
  - [ ] Add progress indicators and error handling
  - [ ] Create AI job history and management

### 5.2 Trip Creation AI Interface
- [ ] **URL Extraction UI**:
  - [ ] Input field with validation
  - [ ] Loading states and progress bars
  - [ ] Preview extracted data before applying
  - [ ] Confidence scoring display
  - [ ] Manual override options

- [ ] **Email Processing Interface**:
  - [ ] Email forwarding instructions
  - [ ] Processing status dashboard
  - [ ] Change approval workflow
  - [ ] Conflict resolution UI
  - [ ] Batch processing interface

- [ ] **PDF Upload & Processing**:
  - [ ] Drag & drop file upload
  - [ ] Processing progress visualization
  - [ ] Extracted content preview
  - [ ] Section-by-section approval
  - [ ] Error handling and retry options

### 5.3 AI-Enhanced Form Fields
- [ ] **Smart Auto-complete**:
  - [ ] AI suggestions for description fields
  - [ ] Port information auto-fill
  - [ ] Talent bio enhancement
  - [ ] Event description generation

- [ ] **Intelligent Validation**:
  - [ ] Real-time data validation with AI
  - [ ] Duplicate detection warnings
  - [ ] Consistency checks across fields
  - [ ] Format standardization suggestions

### 5.4 Real-time Collaboration Features
- [ ] **Live Updates**:
  - [ ] Real-time status indicators
  - [ ] Multi-user editing indicators
  - [ ] Change notifications
  - [ ] Activity feed integration

- [ ] **AI Status Indicators**:
  - [ ] Processing badges on cards
  - [ ] Confidence meters for AI data
  - [ ] Change highlighting
  - [ ] Approval/rejection workflows

### 5.5 Batch Operations Interface
- [ ] **Bulk Processing**:
  - [ ] Multiple URL processing queue
  - [ ] Batch PDF upload interface
  - [ ] Progress tracking for multiple jobs
  - [ ] Results summary dashboard

- [ ] **AI Content Management**:
  - [ ] Generated content library
  - [ ] Content templates management
  - [ ] AI model selection interface
  - [ ] Cost tracking dashboard

### 5.6 Enhanced Admin Dashboard
- [ ] **AI Analytics**:
  - [ ] Processing time metrics
  - [ ] Accuracy statistics
  - [ ] Cost analysis charts
  - [ ] Usage patterns visualization

- [ ] **AI Job Management**:
  - [ ] Job queue visualization
  - [ ] Failed job retry interface
  - [ ] Job history and logs
  - [ ] Performance monitoring

### 5.7 Mobile-Responsive AI Features
- [ ] **Mobile AI Assistant**:
  - [ ] Condensed AI panel for mobile
  - [ ] Touch-friendly job management
  - [ ] Mobile-optimized previews
  - [ ] Swipe gestures for approval

- [ ] **Mobile Upload Interface**:
  - [ ] Camera integration for document capture
  - [ ] Mobile-friendly file selection
  - [ ] Responsive progress indicators
  - [ ] Mobile-optimized review screens

### 5.8 Integration with Existing Admin Tabs
- [ ] **Trip Details Tab**:
  - [ ] AI extraction button integration
  - [ ] Smart field suggestions
  - [ ] Auto-complete implementations
  - [ ] Validation enhancement

- [ ] **Itinerary Tab** (Enhanced for Port Selection):
  - [ ] Port selection from normalized library
  - [ ] Auto-suggest existing ports during AI extraction
  - [ ] Create new port option with AI enhancement
  - [ ] Port information auto-population
  - [ ] Route optimization suggestions
  - [ ] Bulk port operations

- [ ] **Events Tab** (Enhanced for Party/Talent Composition):
  - [ ] Party selection from template library
  - [ ] Multiple talent selection interface
  - [ ] Event composition wizard (party + talents)
  - [ ] Schedule extraction from PDFs
  - [ ] Time conflict detection
  - [ ] Venue management integration

- [ ] **Talent Tab** (Already Normalized + AI Enhanced):
  - [ ] **"Research This Artist" button** - Uses Perplexity MCP to gather:
    - [ ] Artist biography and career highlights
    - [ ] Social media profiles and links
    - [ ] Recent performances and reviews
    - [ ] Music samples and popular tracks
    - [ ] Awards and achievements
    - [ ] Collaboration history
  - [ ] Bio enhancement suggestions
  - [ ] Social media auto-discovery
  - [ ] Image generation for profiles
  - [ ] Performance history lookup
  - [ ] **Auto-fill from research** - Apply found information to talent profile

- [ ] **New Port Management Tab**:
  - [ ] Port library management
  - [ ] Port details editor with AI research integration
  - [ ] **"Research This Port" button** - Uses Perplexity MCP to gather:
    - [ ] Port information, attractions, history
    - [ ] Weather patterns and best visiting times
    - [ ] Local customs and cultural information
    - [ ] Transportation and logistics
    - [ ] Recent news and updates
  - [ ] Country/region organization
  - [ ] Port image management with AI suggestions
  - [ ] Usage analytics across trips

- [ ] **New Party Management Tab**:
  - [ ] Party template library
  - [ ] Party theme editor with AI enhancement
  - [ ] **"Research This Theme" button** - Uses AI to find:
    - [ ] Similar party themes and variations
    - [ ] Music recommendations and playlists
    - [ ] Decoration and venue ideas
    - [ ] Trending party concepts
  - [ ] Reusable party configuration
  - [ ] Party image and metadata management
  - [ ] Usage analytics across events

### 5.9 AI Configuration Interface
- [ ] **Model Selection**:
  - [ ] AI provider switching
  - [ ] Model quality vs cost settings
  - [ ] Custom prompt templates
  - [ ] Processing preferences

- [ ] **Template Management**:
  - [ ] Extraction template editor
  - [ ] Validation rule configuration
  - [ ] Output format customization
  - [ ] Confidence threshold settings

---

## Phase 6: Testing & Deployment
**Timeline: Week 5**
**Status: Not Started**

### 6.1 Frontend Testing
- [ ] **AI Component Testing**:
  - [ ] Test AI assistant panel functionality
  - [ ] Validate URL extraction UI flow
  - [ ] Test email processing interface
  - [ ] Verify PDF upload and processing
  - [ ] Test mobile responsiveness

- [ ] **Integration Testing**:
  - [ ] End-to-end AI workflow testing
  - [ ] Real-time update testing
  - [ ] Cross-browser compatibility
  - [ ] Performance testing on slow networks
  - [ ] Error handling validation

### 6.2 Backend Testing Suite
- [ ] Set up Playwright for E2E testing
- [ ] Create unit tests for AI services
- [ ] Test all migration paths
- [ ] Performance testing
- [ ] Security audit

### 6.3 Vercel Deployment
- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Deploy to preview environment
- [ ] Test all functionality
- [ ] Deploy to production
- [ ] Set up monitoring and alerts

### 5.3 Documentation
- [ ] API documentation
- [ ] AI workflow documentation
- [ ] Admin user guide
- [ ] Developer setup guide
- [ ] MCP usage guide

---

## Phase 6: Final Cleanup & Optimization
**Timeline: Week 5**
**Status: Not Started**

### 6.1 Code Quality
- [ ] Run linter on entire codebase
- [ ] Remove all console.logs
- [ ] Address all TODO comments
- [ ] Add proper error handling
- [ ] Implement logging system

### 6.2 Performance Optimization
- [ ] Optimize database queries
- [ ] Implement caching strategy
- [ ] Optimize image loading
- [ ] Bundle size optimization
- [ ] API response time optimization

### 6.3 Security Hardening
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Set up CORS properly
- [ ] Secure all API endpoints
- [ ] PII data handling

---

## Success Metrics

### Technical Metrics
- [ ] 0 references to obsolete services (Neon, Replit, Netlify)
- [ ] 100% data migrated successfully
- [ ] All images migrated to Supabase Storage
- [ ] 50% reduction in codebase size
- [ ] 30% fewer dependencies
- [ ] < 100ms image load times
- [ ] < 2s API response times

### AI Implementation Metrics
- [ ] 80% reduction in manual data entry time
- [ ] 95% accuracy in extracted trip information
- [ ] < 30 seconds for PDF processing
- [ ] < 10 seconds for URL extraction
- [ ] 90% of updates require no manual correction

### Operational Metrics
- [ ] 70% reduction in infrastructure costs
- [ ] Zero downtime during migration
- [ ] All tests passing
- [ ] 100% documented code
- [ ] Real-time updates working

---

## Risk Mitigation

### Backup Strategy
- [ ] Full database backup before migration
- [ ] Image backup before Cloudinary deletion
- [ ] Code repository backup
- [ ] Environment variables backup

### Rollback Plan
- [ ] Keep Railway running until Supabase verified
- [ ] Keep Cloudinary account until images verified
- [ ] Version control for all changes
- [ ] Staged deployment approach

---

## Maintenance Plan

### Daily Checks (During Migration)
- [ ] Monitor error logs
- [ ] Check API health
- [ ] Verify data integrity
- [ ] Test critical paths

### Weekly Reviews
- [ ] MCP functionality check
- [ ] Dependency updates
- [ ] Security patches
- [ ] Performance metrics

### Monthly Audits
- [ ] Code cleanup sweep
- [ ] Documentation updates
- [ ] Cost analysis
- [ ] User feedback review

---

## Notes & Decisions

### Technology Choices
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4 + Perplexity
- **Deployment**: Vercel
- **Testing**: Playwright

### Removed Technologies
- Neon Database
- Cloudinary
- Railway
- Replit
- Netlify
- Custom Auth System

### Key Contacts
- Project Owner: Bryan
- Repository: [GitHub Link]
- Supabase Project: [To be created]
- Vercel Project: [To be created]

---

## Current Status
**Last Updated**: [Date]
**Current Phase**: Planning Complete
**Next Step**: Begin Phase 0 - Environment Setup

---

## Change Log
- [Date] - Initial plan created
- [Date] - Added MCP configuration details
- [Date] - Updated with storage migration to Supabase

---

*This document should be updated as tasks are completed and requirements change.*