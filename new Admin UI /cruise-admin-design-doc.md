# Cruise Admin Interface - Complete Design Documentation

## Project Overview
A comprehensive admin interface for managing cruise guide content. This is an information management system for cruise guides, NOT a booking platform.

## Technology Stack
- **Frontend**: React/Next.js (or similar modern framework)
- **Styling**: Tailwind CSS or custom CSS with design tokens
- **Database**: PostgreSQL or similar relational database
- **Authentication**: JWT-based authentication
- **API**: RESTful or GraphQL

## Design System

### Color Palette
```css
/* Primary Colors */
--ocean-dark: #0f2238;
--ocean-mid: #1e3a5f;
--ocean-light: #00B4D8;
--ocean-accent: #90E0EF;

/* Status Colors */
--success: #06FFA5;
--warning: #FFB700;
--error: #EF4444;
--info: #00B4D8;

/* Neutral Colors */
--gray-50: #F8FAFC;
--gray-100: #F1F5F9;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #64748B;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1E293B;
--gray-900: #0A1628;
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 28px;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System
```css
/* Spacing Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Border Radius
```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

## Component Specifications

### 1. Sidebar Navigation
- **Width**: 280px (expanded), 80px (collapsed)
- **Background**: Linear gradient from `#1e3a5f` to `#0f2238`
- **Sections**:
  - CRUISES: Dashboard, Active Cruises, Past Cruises
  - CONTENT MANAGEMENT: Ships, Locations, Artists/Talent, Party Themes, Info Sections
  - ADMINISTRATION: Users, Settings, Profile
- **Behavior**:
  - Collapsible via hamburger menu
  - Active state with blue accent and left border indicator
  - Smooth transitions (300ms ease)
  - Persistent state (remembers collapsed/expanded preference)

### 2. Top Bar
- **Height**: 80px
- **Background**: White with bottom border
- **Content**:
  - Left: Page title and description
  - Right: Contextual action button (changes based on page)
- **Shadow**: Subtle bottom border instead of drop shadow

### 3. Card Components
- **Border**: 1px solid #E5E7EB
- **Border Radius**: 12px
- **Hover State**: Slight elevation and shadow
- **Header**: Dark blue gradient background
- **Actions**: 3 buttons (View, Edit, Primary Action)

### 4. Form Elements
- **Input Height**: 42px
- **Border**: 1px solid #E5E7EB
- **Focus State**: Blue border with subtle glow
- **Required Fields**: Red asterisk indicator
- **Labels**: 14px, 500 weight

### 5. Buttons
- **Primary**: Blue gradient background (#00B4D8 to #0077B6)
- **Secondary**: White background with gray border
- **Danger**: Red background (#EF4444)
- **Sizes**: Default (42px height), Small (36px height)

## Page Specifications

### Dashboard
**Purpose**: Overview of all cruises and quick access to key actions
**Components**:
- Welcome header with Create New Cruise button
- Filter tabs (All, Upcoming, In Progress)
- Cruise cards grid (3 columns desktop, 1 mobile)
- Each card shows: Name, Status, Dates, Ship, Ports, Artists count, Themes count, Completion status

### Create/Edit Cruise
**Purpose**: Multi-step wizard for cruise creation/editing
**Tabs**:
1. Basic Info: Name, cruise line, duration, ship selection
2. Schedule & Route: Departure/return dates, port selection
3. Ship Details: Ship assignment and specifications
4. Entertainment: Artist and talent assignment
5. Info Sections: Content blocks and guide information
6. Media: Images and documents (edit only)

**Form Sections**:
- Clear section headers
- Grid layout for form fields
- Save Draft capability
- Validation on required fields

### Cruise Ships Management
**Purpose**: Manage fleet information
**List View**:
- Card grid showing ships
- Each card: Name, Cruise Line, Capacity, Decks, Year Built
**Edit View**:
- Ship information form
- Specifications section
- Amenities checklist
- Media upload section

### Locations Management
**Purpose**: Manage ports and destinations
**List View**:
- Card grid of locations
- Each card: Name, Country, Region, Type (Port/Private Island)
**Edit View**:
- Location details form
- Weather information
- Popular activities
- Local tips section

### Artists/Talent Management
**Purpose**: Manage entertainment roster
**List View**:
- Card grid of performers
- Each card: Name, Type (DJ/Band/Comedian), Genre, Cruises performed
**Edit View**:
- Artist information form
- Performance details
- Availability calendar
- Media/photos section

### Party Themes Management
**Purpose**: Create reusable party theme templates
**List View**:
- Card grid of themes
- Each card: Name, Category, Default Venue, Usage count
**Edit View**:
- Theme details form
- Requirements checklist
- Dress code information
- Standard timeline

### Info Sections Management
**Purpose**: Reusable content blocks for cruise guides
**Types**:
- Dining Information
- Dress Codes
- What's Included
- Important Notices
- Tips & Recommendations
- Safety Information

### User Management
**Purpose**: Admin user access control
**List View**:
- Table format with columns: Name, Email, Role, Status, Last Login, Actions
- Role types: Admin, Editor, Viewer
**Edit View**:
- User information form
- Role assignment
- Permission checkboxes
- Activity log

## Navigation Flow

### Primary Navigation Paths
1. **Dashboard → Create Cruise** → Multi-step wizard
2. **Dashboard → Cruise Card → Edit** → Edit cruise form
3. **Dashboard → Cruise Card → View** → Read-only cruise details
4. **Sidebar → Content Section → List** → Create/Edit forms

### Breadcrumb Examples
- Dashboard
- Dashboard > Create New Cruise
- Dashboard > Caribbean Paradise > Edit
- Cruise Ships > Ocean Dream > Edit
- Users > Sarah Editor > Edit

## Data Models

### Cruise
```javascript
{
  id: string,
  name: string,
  cruise_line: string,
  ship_id: string,
  status: 'upcoming' | 'active' | 'past',
  departure_date: date,
  return_date: date,
  duration_nights: number,
  description: text,
  ports: array[port_id],
  artists: array[artist_id],
  themes: array[theme_id],
  info_sections: array[section_id],
  created_at: timestamp,
  updated_at: timestamp
}
```

### Ship
```javascript
{
  id: string,
  name: string,
  cruise_line: string,
  registry: string,
  year_built: number,
  guest_capacity: number,
  crew_size: number,
  decks: number,
  tonnage: string,
  length: string,
  beam: string,
  amenities: array[string],
  images: array[url],
  status: 'active' | 'inactive'
}
```

### Location/Port
```javascript
{
  id: string,
  name: string,
  country: string,
  region: string,
  type: 'port' | 'private_island' | 'tender_port',
  description: text,
  average_temperature: string,
  currency: string,
  activities: array[string],
  tips: text,
  coordinates: {lat, lng}
}
```

### Artist/Talent
```javascript
{
  id: string,
  stage_name: string,
  real_name: string,
  type: 'dj' | 'band' | 'comedian' | 'magician' | 'other',
  genre: string,
  bio: text,
  typical_set_length: string,
  venues: array[string],
  cruises_performed: number,
  images: array[url],
  contact_info: object
}
```

### Party Theme
```javascript
{
  id: string,
  name: string,
  category: string,
  description: text,
  typical_duration: string,
  default_venue: string,
  dress_code: string,
  time_slot: string,
  requirements: array[string],
  usage_count: number
}
```

### User
```javascript
{
  id: string,
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  role: 'admin' | 'editor' | 'viewer',
  status: 'active' | 'inactive' | 'suspended',
  permissions: array[string],
  last_login: timestamp,
  created_at: timestamp
}
```

## API Endpoints

### Cruises
- GET /api/cruises - List all cruises
- GET /api/cruises/:id - Get single cruise
- POST /api/cruises - Create cruise
- PUT /api/cruises/:id - Update cruise
- DELETE /api/cruises/:id - Delete cruise
- GET /api/cruises/:id/itinerary - Get cruise itinerary

### Ships
- GET /api/ships - List all ships
- GET /api/ships/:id - Get single ship
- POST /api/ships - Create ship
- PUT /api/ships/:id - Update ship
- DELETE /api/ships/:id - Delete ship

### Locations
- GET /api/locations - List all locations
- GET /api/locations/:id - Get single location
- POST /api/locations - Create location
- PUT /api/locations/:id - Update location
- DELETE /api/locations/:id - Delete location

### Artists
- GET /api/artists - List all artists
- GET /api/artists/:id - Get single artist
- POST /api/artists - Create artist
- PUT /api/artists/:id - Update artist
- DELETE /api/artists/:id - Delete artist

### Themes
- GET /api/themes - List all themes
- GET /api/themes/:id - Get single theme
- POST /api/themes - Create theme
- PUT /api/themes/:id - Update theme
- DELETE /api/themes/:id - Delete theme

### Users
- GET /api/users - List all users
- GET /api/users/:id - Get single user
- POST /api/users - Create user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout

## Responsive Design Breakpoints
- Desktop: 1440px+
- Laptop: 1024px - 1439px
- Tablet: 768px - 1023px
- Mobile: 320px - 767px

### Mobile Adaptations
- Sidebar: Slides in from left with overlay
- Cards: Single column layout
- Tables: Horizontal scroll or card view
- Forms: Single column layout
- Top bar: Stacked layout with full-width buttons

## Performance Requirements
- Page load time: < 2 seconds
- API response time: < 500ms
- Smooth animations at 60fps
- Lazy loading for lists > 20 items
- Image optimization (WebP format)

## Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators on all interactive elements
- Proper heading hierarchy
- Alt text for all images
- Color contrast ratios meeting standards

## Security Considerations
- JWT token authentication
- Role-based access control (RBAC)
- Input validation on all forms
- SQL injection prevention
- XSS protection
- HTTPS only
- Session timeout after 30 minutes of inactivity

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Setup project structure
- Implement authentication
- Create sidebar navigation
- Build dashboard layout
- Setup routing

### Phase 2: Cruise Management (Week 3-4)
- Cruise CRUD operations
- Multi-step creation wizard
- View cruise details page
- Filter and search functionality

### Phase 3: Content Management (Week 5-6)
- Ships management
- Locations management
- Artists management
- Party themes management
- Info sections management

### Phase 4: User Management (Week 7)
- User CRUD operations
- Role management
- Permission system

### Phase 5: Polish & Testing (Week 8)
- Responsive design refinement
- Performance optimization
- Cross-browser testing
- Bug fixes
- Documentation

## Success Metrics
- 50% reduction in time to create new cruise guides
- 100% of cruise information complete before publishing
- < 2 second page load times
- Zero critical accessibility issues
- 90% user satisfaction score

## Notes for Development
1. All lists should have search and filter capabilities
2. All forms should have client-side validation
3. All delete operations should have confirmation dialogs
4. All successful operations should show toast notifications
5. All tables should be sortable
6. Implement auto-save for long forms
7. Add keyboard shortcuts for common actions
8. Include help tooltips for complex fields
9. Implement bulk operations where applicable
10. Add export functionality for reports 