# UI/UX Implementation Guide

## Overview
This guide provides detailed specifications for implementing the approved UI mockups into the KGay Travel Guides application.

## Design System

### Color Palette
```css
/* Primary Ocean Gradient */
--ocean-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

### Typography
- **Headings**: Font-bold with sizes text-2xl (h1), text-xl (h2), text-lg (h3)
- **Body**: text-base for content, text-sm for secondary
- **Small**: text-xs for metadata and labels

### Spacing System
- Base unit: 0.25rem (4px)
- Common spacings: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)
- Grid gaps: gap-2 (8px), gap-4 (16px), gap-6 (24px)

### Border Radius
- Small: rounded (4px)
- Medium: rounded-lg (8px)
- Large: rounded-xl (12px)
- Full: rounded-full (circles)

## Component Specifications

### 1. Port Management Interface

#### Layout Structure
- **Header**: Ocean gradient with breadcrumb navigation
- **Action Bar**: Search, filters, and add new port button
- **Content Grid**: Responsive card grid (1 col mobile, 2 col tablet, 3 col desktop)
- **Port Cards**: Image, name, country, region, coordinates, action buttons

#### Interactive Elements
- **Search**: Real-time filtering with debounce (300ms)
- **Filters**: Dropdown for region, toggle for sea days
- **Bulk Actions**: Select multiple ports for batch operations
- **Edit Mode**: Inline editing with save/cancel options

#### Data Validation
- Port name: Required, max 100 chars
- Country: Required, from predefined list
- Coordinates: Lat/Long format validation
- Image: Cloudinary upload with 16:9 aspect ratio

### 2. Party Management Interface

#### Layout Structure
- **Header**: Title with view toggle (grid/list)
- **Stats Dashboard**: 4 metric cards showing usage analytics
- **Template Grid**: Visual cards with theme preview
- **Quick Actions**: Create, duplicate, archive buttons

#### Party Template Card
- **Visual Preview**: Theme-based gradient or image
- **Metadata**: Name, venue type, capacity, duration
- **Usage Badge**: Times used indicator
- **Actions**: Edit, duplicate, preview, delete

#### Create/Edit Modal
- Step 1: Basic info (name, description, capacity)
- Step 2: Theme selection (visual picker)
- Step 3: Requirements (venue, equipment, staff)
- Step 4: Preview and save

### 3. AI Assistant Panel

#### Panel Behavior
- **Toggle**: Slide-in from right (desktop), slide-up (mobile)
- **Width**: 384px (desktop), full-width (mobile)
- **Persistence**: Maintains state between toggles

#### Quick Actions Grid
- 2x2 grid of action buttons
- Icons with labels
- Color-coded by action type
- Hover states with subtle scale

#### Task Queue Display
- **Active Tasks**: Progress bar with percentage
- **Completed**: Collapsible results with apply/preview options
- **Failed**: Error message with retry option
- **Queued**: Grayed out with position indicator

#### AI Chat Interface
- **Input**: Bottom-anchored with send button
- **Suggestions**: Contextual prompts above input
- **History**: Scrollable message list
- **Typing Indicator**: Three-dot animation

### 4. Event Composition Wizard

#### Step Navigation
- **Visual Progress**: Horizontal stepper with connecting lines
- **Step States**: Complete (green check), Active (gradient), Inactive (gray)
- **Navigation**: Previous/Next buttons, clickable completed steps

#### Step 1: Basic Information
- Form fields with validation indicators
- Date/time pickers with conflict checking
- Venue selector with availability status

#### Step 2: Party Template Selection
- Visual grid of party options
- Search and filter capabilities
- Selection indicator with checkmark
- Template details preview panel

#### Step 3: Talent Selection
- Grid of talent cards with photos
- Multi-select with counter
- Availability indicators
- Quick bio on hover/tap

#### Step 4: Review & Save
- Summary of all selections
- Conflict warnings if any
- Save as draft option
- Publish button with confirmation

### 5. Loading States

#### Skeleton Screens
- Matching component layout structure
- Animated pulse effect
- Progressive content reveal

#### Progress Indicators
- **Linear**: For determinate operations
- **Circular**: For indeterminate operations
- **Stepped**: For multi-stage processes

#### Button States
- Default → Hover → Active → Loading → Success/Error
- Loading spinner replaces text
- Success checkmark animation
- Error shake animation

### 6. Mobile Responsive Patterns

#### Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

#### Navigation Patterns
- **Mobile**: Bottom tab bar with 5 items max
- **Tablet**: Side drawer with icons and labels
- **Desktop**: Full sidebar with expanded menu

#### Touch Targets
- Minimum 44x44px for all interactive elements
- 8px minimum spacing between targets
- Swipe gestures for drawer/panel controls

#### Content Adaptation
- **Cards**: Stack vertically on mobile
- **Tables**: Horizontal scroll with frozen first column
- **Forms**: Single column on mobile, multi-column on desktop
- **Modals**: Full-screen on mobile, centered on desktop

## Implementation Priority

### Phase 1: Core Components (Week 1)
1. Design system setup (colors, typography, spacing)
2. Layout components (header, sidebar, containers)
3. Basic form elements (inputs, buttons, selects)
4. Card components

### Phase 2: Feature Interfaces (Week 2)
1. Port Management interface
2. Party Management interface
3. Data tables with sorting/filtering
4. Modal and drawer components

### Phase 3: Advanced Features (Week 3)
1. Event Composition Wizard
2. AI Assistant panel
3. Real-time updates (WebSocket)
4. File upload/processing

### Phase 4: Polish & Optimization (Week 4)
1. Loading states and animations
2. Error handling and recovery
3. Mobile optimizations
4. Performance tuning

## Animation Specifications

### Transitions
```css
/* Standard transition */
transition: all 0.2s ease;

/* Smooth slide */
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce effect */
transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Common Animations
- **Fade In**: opacity 0 → 1 over 200ms
- **Slide In**: translateX(100%) → translateX(0) over 300ms
- **Scale Up**: scale(0.95) → scale(1) over 200ms
- **Pulse**: scale(1) → scale(1.05) → scale(1) over 1s

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance
- Color contrast ratios: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation for all interactive elements
- ARIA labels for icons and non-text content
- Focus indicators with 2px outline

### Screen Reader Support
- Semantic HTML structure
- Descriptive headings hierarchy
- Alt text for all images
- Status announcements for dynamic content

## Testing Requirements

### Visual Regression Tests
- Capture baseline screenshots for each component
- Test at 375px, 768px, 1024px, 1440px widths
- Dark mode variations where applicable

### Interaction Tests
- Form validation and submission
- Modal open/close cycles
- Drag and drop functionality
- API integration error handling

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1
- Bundle size: < 200KB for initial load

## Development Tools

### Required Libraries
```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.x",
    "react-hook-form": "^7.x",
    "framer-motion": "^10.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "react-hot-toast": "^2.x",
    "date-fns": "^2.x"
  }
}
```

### Component Structure
```tsx
// Example component structure
components/
  ui/
    Button.tsx
    Card.tsx
    Input.tsx
    Modal.tsx
  features/
    PortManagement/
      PortCard.tsx
      PortGrid.tsx
      PortFilters.tsx
    PartyManagement/
      PartyCard.tsx
      PartyGrid.tsx
      PartyStats.tsx
    AIAssistant/
      AssistantPanel.tsx
      TaskQueue.tsx
      QuickActions.tsx
```

## Documentation Requirements

### Component Documentation
- Props interface with JSDoc comments
- Usage examples with common patterns
- Accessibility notes
- Performance considerations

### Storybook Stories
- Default state
- All prop variations
- Interactive states
- Error states
- Loading states
- Mobile/desktop views

## Quality Checklist

### Before Implementation
- [ ] Review mockups with stakeholders
- [ ] Validate against accessibility guidelines
- [ ] Confirm API endpoints availability
- [ ] Set up component testing framework

### During Implementation
- [ ] Follow TDD approach (test first)
- [ ] Maintain consistent naming conventions
- [ ] Document complex logic
- [ ] Regular code reviews

### After Implementation
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Performance profiling
- [ ] User acceptance testing

## Notes for Developers

1. **Ocean Theme**: Maintain the ocean gradient as the primary visual element
2. **Consistency**: Use the design system tokens, avoid inline styles
3. **Mobile First**: Build for mobile, enhance for desktop
4. **Progressive Enhancement**: Core functionality works without JavaScript
5. **Error Recovery**: Always provide a way to recover from errors
6. **Feedback**: Immediate visual feedback for all user actions
7. **Loading States**: Never leave users wondering if something is happening
8. **Accessibility**: Test with keyboard only and screen readers

This guide should be treated as the source of truth for UI implementation. Any deviations should be discussed and documented.