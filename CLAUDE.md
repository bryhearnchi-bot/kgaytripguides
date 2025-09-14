# Claude Code Notes

## Database Configuration

**IMPORTANT**: This project uses **Neon PostgreSQL** database, NOT SQLite.

- All database calls/edits must be done through the Neon PostgreSQL connection
- The database connection is configured in `server/storage.ts`
- Uses Drizzle ORM with Neon serverless driver
- Environment variable: `DATABASE_URL` points to the Neon database
- Schema is defined in `shared/schema.ts`

### Never use SQLite commands like:
- `sqlite3 database.db`
- `better-sqlite3`
- Direct SQL file access

### Always use:
- The existing storage layer (`server/storage.ts`)
- Drizzle ORM queries through the Neon connection
- Environment-based database URL configuration

## Recent Updates

### Talent Images (Completed)
- Uploaded 22 individual artist images to Cloudinary
- Updated all talent records in Neon database with new `profileImageUrl` fields
- All images now served from Cloudinary CDN instead of local files

### Port Images (Completed)
- Uploaded 7 port images to Cloudinary from `attached_assets/generated_images/`
- Updated itinerary entries in Neon database with `portImageUrl` fields
- Ports covered: Athens, Santorini, Kuşadası, Istanbul, Alexandria, Mykonos, Iraklion

### Scripts Created
- `upload-all-talents.mjs` - Upload talent images to Cloudinary
- `update-talent-db-simple.mjs` - Update talent database with Cloudinary URLs
- `upload-port-images.mjs` - Upload port images to Cloudinary
- `update-itinerary-images.mjs` - Update itinerary database with port image URLs

All images are now properly stored in Cloudinary and referenced in the Neon database, ensuring the application uses cloud-hosted assets instead of local files.

### Frontend Hardcoded Images (Completed)
- Updated `client/src/components/trip-guide.tsx` to use database-stored `imageUrl` field first, then fallback to Cloudinary URLs instead of local paths
- Replaced hardcoded local paths like `/images/ports/santorini-greece.jpg` with Cloudinary URLs
- All port images now serve from Cloudinary: Santorini, Athens, Mykonos, Istanbul, Kuşadası, Alexandria, Iraklion
- Error fallbacks also use Cloudinary ship images instead of local files

**Note**: The itinerary tab cards now properly use Cloudinary images from the database instead of local server images.

### Day at Sea Images (Completed)
- Updated "Day at Sea" image to use specific Cloudinary URL with optimized transformations
- URL: `https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757773863/cruise-app/assets/celebrity-cruise-lines_celebrity-solstice_wake_article_article-2997_5685_1757732437578_cuv35p.jpg`
- Applied proper Cloudinary transformations (w_600,h_400,c_fill,g_center) to ensure image fills card space
- Consistent `objectFit: 'cover'` styling for all itinerary images

### UI Consistency Improvements (Completed)
- **Tab Reordering**: Changed tab order to Itinerary, Schedule, Parties, Talent, Info (moved Talent after Parties)
- **Filter Removal**: Removed date filter from Schedule tab and search filter from Talent tab for cleaner UX
- **Consistent Styling**: Applied party page date/time styling across all tabs:
  - Ocean-themed date badges: `bg-ocean-100 text-ocean-700`
  - Coral/pink gradient time badges: `bg-gradient-to-r from-coral to-pink-500`
- **Timeline Format**: Converted first three tabs (Itinerary, Schedule, Talent) to consistent timeline format:
  - Left border with timeline dots for visual continuity
  - Motion animations for smooth card reveals
  - Consistent spacing and visual hierarchy
- **Cloudinary Integration**: Updated all hardcoded local image paths to use Cloudinary CDN URLs with proper transformations:
  - Port images now use optimized Cloudinary URLs with w_600,h_400,c_fill,g_center transforms
  - Talent images use w_400,h_400,c_fill,g_face transforms for better portrait cropping
  - Consistent error fallbacks to Cloudinary-hosted default images
- **Hero Image Usage**: Ensured hero images are used consistently across all components

### Party Theme Images (Completed)
- **Party Card Redesign**: Updated party cards to match schedule page styling with hero images
- **Database Update**: Added party theme images to all party events in database
- **Script Created**: `update-party-images.mjs` - Updates party events with appropriate Cloudinary image URLs
- **15 Party Events Updated**: All party themes now have hero images including:
  - Dog Tag, UNITE, Lost At Sea, Empires, Think Pink
  - Greek Isles, Neon Playground, Virgin White, Off-White
  - Revival, Atlantis Classics, Last Dance, and more