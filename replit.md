# Overview

This is an interactive cruise guide application for Atlantis Events Greek Isles, Istanbul & Pyramids cruise aboard Virgin Resilient Lady. The application provides a comprehensive digital guide featuring cruise itineraries, daily entertainment schedules, talent information, and party themes. Built with a modern React frontend and Express backend, it's designed to help cruise passengers navigate their vacation experience with an intuitive, mobile-friendly interface.

**Recent Updates (August-September 2025):**
- Enhanced with official cruise guide information including detailed party theme descriptions
- Added comprehensive cruise information: embarkation details, passport requirements, packing advice, prohibited items
- Implemented interactive "View Events" buttons on itinerary locations with popup modals
- Fixed dialog close behavior to work with single click
- Moved time toggle to navigation bar area for better layout
- Standardized all card backgrounds to white for visual consistency
- Added comprehensive "Things to Do" functionality with attraction guides for all ports
- Integrated clickable Google Maps addresses for all gay bars and venues
- Added Virgin onboard time confirmation disclaimer for all "All Aboard" times
- Fixed Crete "Things to Do" button matching logic for proper display  
- Standardized disclaimers across all tabs (Itinerary, Events, Entertainers, Parties, Info)
- Removed "Atlantis Events" text from footer while keeping logo and tagline
- Optimized build configuration and deployment setup for production export
- **August 16, 2025**: Added comprehensive social media integration with official links for all 18 entertainers
- **August 16, 2025**: Fixed text wrapping issues on Events page to prevent overlap with calendar buttons
- **August 16, 2025**: Enhanced talent modals with social media buttons (Instagram, Twitter, TikTok, YouTube, LinkedIn, Website, Linktree)
- **August 16, 2025**: Fixed Apple Calendar integration for iOS devices - replaced problematic data URLs with proper ICS file downloads that trigger native Calendar app
- **August 16, 2025**: Enhanced Apple Calendar support for macOS with hybrid approach (direct open + download fallback)
- **August 16, 2025**: Resolved Safari download errors across all Apple devices with improved data URL handling and Safari-specific event dispatching
- **August 16, 2025**: Fixed critical calendar date parsing bug causing events to default to January 1, 2000 - now correctly parses 2025 cruise dates
- **August 16, 2025**: Enhanced calendar time parsing to support both 12-hour (AM/PM) and 24-hour formats for accurate event scheduling
- **August 16, 2025**: Simplified Apple Calendar download method using reliable blob URLs for consistent Safari compatibility
- **August 16, 2025**: Removed all calendar functionality per user request - eliminated Google Calendar and Apple Calendar integration buttons from Events and Parties tabs
- **September 12, 2025**: Fixed deployment health check failures by implementing proper health endpoints (GET /healthz, HEAD /) and moving production seeding to background

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Animations**: Framer Motion for smooth UI transitions and interactive elements
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: connect-pg-simple for PostgreSQL-backed session storage
- **Development**: tsx for TypeScript execution in development

## Data Storage Solutions
- **Primary Database**: PostgreSQL configured through Neon Database serverless
- **ORM**: Drizzle ORM with PostgreSQL dialect for schema management and migrations
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Local Storage**: Browser localStorage for user preferences (time format, favorites)

## Authentication and Authorization
- **Session-based Authentication**: Express sessions with PostgreSQL storage
- **User Schema**: Basic user model with username/password authentication
- **In-memory Storage**: MemStorage class provides fallback storage interface for development

## Component Design Patterns
- **Compound Components**: Extensive use of Radix UI compound component patterns
- **Custom Hooks**: useLocalStorage for persistent user preferences, useIsMobile for responsive behavior
- **Type Safety**: Comprehensive TypeScript interfaces for cruise data (Talent, DailyEvent, ItineraryStop, SocialLinks)
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Social Integration**: Dynamic social media link rendering with platform-specific icons and external link handling
- **Simplified Event Display**: Streamlined event cards focusing on essential information without external calendar integration

## Code Organization
- **Monorepo Structure**: Shared schema between client and server in `/shared` directory
- **Path Aliases**: Configured aliases (@, @shared, @assets) for clean imports
- **Component Library**: Comprehensive UI component library in `/client/src/components/ui`
- **Data Layer**: Centralized cruise data management in `/client/src/data`

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting for production database
- **Drizzle Kit**: Database schema migrations and management

## UI and Styling
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Icon library for consistent iconography
- **React Icons**: Social media and platform icons for external link integration
- **Framer Motion**: Animation library for enhanced user interactions

## Development Tools
- **Vite**: Build tool with hot module replacement and optimized bundling
- **Replit Integration**: Development environment integration with runtime error overlay and cartographer
- **ESBuild**: Fast bundler for server-side code compilation

## Form and Data Management
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation library integrated with Drizzle ORM
- **TanStack Query**: Server state management, caching, and synchronization

## Additional Libraries
- **date-fns**: Date manipulation and formatting utilities
- **wouter**: Lightweight routing library for React applications
- **class-variance-authority**: Utility for creating variant-based component APIs
- **clsx**: Utility for constructing className strings conditionally

# Deployment Configuration

## Build Process
- **Production Build**: `npm run build` creates optimized static files in `dist/public/`
- **Bundle Size**: ~477KB JavaScript, ~77KB CSS with minification and compression
- **Static Assets**: All assets are versioned and cached with long-term cache headers
- **Build Time**: ~15 seconds with 2066+ modules transformed  
- **Last Updated**: August 16, 2025 - removed calendar functionality and streamlined event display

## Deployment Targets
- **Netlify**: Configured with `netlify.toml` for static hosting with SPA redirects
- **Manual Export**: Built files can be served from any static hosting provider
- **Performance**: Assets are cached for 1 year, CSS/JS minified for optimal loading

## File Structure (Post-Build)
```
dist/
├── index.js          # Express server bundle (optional)
└── public/           # Static frontend files (deployment target)
    ├── index.html    # Main HTML with SEO meta tags
    └── assets/       # Versioned CSS, JS bundles
```