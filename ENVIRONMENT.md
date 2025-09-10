# Environment Configuration

## Production vs Development Data

### Production Environment
- **NODE_ENV=production**: Always uses real Greek Isles cruise data
- No mock data is allowed in production for security and data integrity
- Cruise slug: `greek-isles-2025`
- Data source: `client/src/data/cruise-data.ts`

### Development Environment  
- **Default**: Uses real Greek Isles cruise data (same as production)
- **Testing with Mock Data**: Set `USE_MOCK_DATA=true` to use simplified test data
  - Cruise slug: `mock-cruise-2024`
  - Data source: `client/src/data/mock-data.ts`
  - Only available in development mode (NODE_ENV=development)

## Usage

### For Production Deployment
No configuration needed - production automatically uses Greek cruise guide data.

### For Development Testing
To test with mock data:
```bash
USE_MOCK_DATA=true npm run dev
```

To test with production data (default):
```bash
npm run dev
```

### Database Seeding
The seed script automatically selects the appropriate data based on environment:
- Production: Seeds with Greek Isles cruise data
- Development with USE_MOCK_DATA=true: Seeds with mock test data

```bash
# Seed with production data
npm run db:seed

# Seed with mock data (development only)
USE_MOCK_DATA=true npm run db:seed
```

## Data Sources

### Production Data (`cruise-data.ts`)
- Real Greek Isles cruise itinerary (August 21-31, 2025)
- Complete talent roster with social media links
- Authentic party themes and events
- Real port information and attractions

### Mock Data (`mock-data.ts`)  
- Simplified test cruise (January 1-3, 2024)
- Basic test talent entries
- Minimal events for testing UI functionality
- Placeholder content for development