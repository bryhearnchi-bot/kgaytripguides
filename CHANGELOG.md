# Changelog

All notable changes to the Atlantis Trip Guides project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-01-14

### Added
- UI preservation guidelines in CLAUDE.md to maintain design consistency
- Test-Driven Development (TDD) guidelines and workflow
- CHANGELOG.md for tracking all changes
- Pre-commit checklist for quality assurance

### Planned
- White border on party event images for visual consistency with itinerary
- Improved itinerary time display (differentiate "All Aboard" from arrive/depart times)
- "View Events" button restoration on itinerary cards
- Enhanced schedule page click interactions (talent and party popups)
- Improved party timeline typography for better readability
- Performance schedules display on talent cards
- Smart timing logic based on cruise status (current/upcoming/past)
- Migration of info page content from hardcoded to database storage
- Mobile responsiveness improvements across all components

### Fixed
- Mobile view layout issues causing content squishing
- Missing talent performance times in talent cards

### Removed
- First Time Cruisers Orientation event (event ID: 3) per user request

## [Previous] - Before 2025-01-14

### Completed
- Cloudinary integration for all images (talent, ports, party themes)
- Database migration from SQLite to Neon PostgreSQL
- UI consistency improvements with ocean theme
- Timeline format implementation across tabs
- Hero image integration throughout application
- Party theme images addition to database