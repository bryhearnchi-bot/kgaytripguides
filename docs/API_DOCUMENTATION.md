# K-GAY Travel Guides API Documentation

## 🚀 Overview

The K-GAY Travel Guides API provides comprehensive access to cruise information, events, talent, and locations for LGBTQ+ travel experiences. This RESTful API follows OpenAPI 3.1 standards and includes interactive documentation via Swagger UI.

## 📚 Interactive Documentation

### Access Points

- **Swagger UI**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs) (Development)
- **OpenAPI JSON**: [http://localhost:3001/api/docs/swagger.json](http://localhost:3001/api/docs/swagger.json)
- **Alternative OpenAPI**: [http://localhost:3001/api/openapi.json](http://localhost:3001/api/openapi.json)

### Production URLs

- **Swagger UI**: [https://kgay-travel-guides-production.up.railway.app/api/docs](https://kgay-travel-guides-production.up.railway.app/api/docs)
- **OpenAPI JSON**: [https://kgay-travel-guides-production.up.railway.app/api/docs/swagger.json](https://kgay-travel-guides-production.up.railway.app/api/docs/swagger.json)

## 🔐 Authentication

The API uses **Supabase JWT tokens** for authentication. Include the Bearer token in the Authorization header for protected endpoints:

```http
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **viewer**: Read-only access to public content
- **content_manager**: Can create and edit trips, events, and content
- **admin**: Full access including user management and system operations

## 📊 Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General API requests**: 100 requests per 15 minutes
- **Admin operations**: 30 requests per 15 minutes
- **Search operations**: 50 requests per 15 minutes
- **Bulk operations**: 10 requests per 15 minutes

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## 🌐 API Endpoints

### System Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api` | GET | API health check | No |
| `/api/versions` | GET | Get supported API versions | No |
| `/api/csrf-token` | GET | Get CSRF token for forms | No |
| `/healthz` | GET/HEAD | System health check | No |
| `/api/metrics` | GET | Performance metrics | No |

### Trip Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/trips` | GET | List all trips | No |
| `/api/trips` | POST | Create new trip | Content Editor |
| `/api/trips/upcoming` | GET | Get upcoming trips | No |
| `/api/trips/past` | GET | Get past trips | No |
| `/api/trips/id/{id}` | GET | Get trip by ID | No |
| `/api/trips/{slug}` | GET | Get trip by slug | No |
| `/api/trips/{slug}/complete` | GET | Get complete trip info | No |
| `/api/trips/{id}` | PUT | Update trip | Content Editor |
| `/api/trips/{id}` | DELETE | Delete trip | Super Admin |
| `/api/trips/{id}/duplicate` | POST | Duplicate trip | Content Editor |
| `/api/trips/{tripId}/itinerary` | GET | Get trip itinerary | No |

### Event Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/events` | GET | List events with filtering | No |
| `/api/events/stats` | GET | Get event statistics | No |
| `/api/events/bulk` | POST | Bulk create/update events | Content Editor |
| `/api/events/{id}` | PUT | Update event | Content Editor |
| `/api/events/{id}` | DELETE | Delete event | Content Editor |
| `/api/cruises/{cruiseId}/events` | GET/POST | Cruise events | Varies |
| `/api/cruises/{cruiseId}/events/date/{date}` | GET | Events by date | No |
| `/api/cruises/{cruiseId}/events/type/{type}` | GET | Events by type | No |

### Content and Media

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/talent` | GET | List talent/performers | No |
| `/api/talent/{id}` | GET | Get talent by ID | No |
| `/api/ports` | GET | List cruise ports | No |
| `/api/ports/{id}` | GET | Get port by ID | No |
| `/api/search` | GET | Global search | No |

### Admin Operations

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/admin/cruises` | GET | Get admin cruise list | Content Editor |
| `/api/admin/cruises/{id}/status` | PATCH | Update cruise status | Content Editor |
| `/api/admin/cruises/stats` | GET | Get cruise statistics | Content Editor |
| `/api/admin/dashboard/stats` | POST | Get dashboard stats | Content Editor |
| `/api/admin/system/health` | GET | System health check | Content Editor |
| `/api/admin/users` | GET/POST | User management | Admin |
| `/api/admin/users/{id}` | PUT/DELETE | User operations | Admin |

### Analytics and Monitoring

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/analytics/track` | POST | Track analytics event | No |
| `/api/metrics` | GET | Performance metrics | No |

## 📋 Data Models

### Trip Schema

```typescript
interface Trip {
  id: number;
  name: string;
  slug: string;
  subtitle?: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'archived';
  price?: number;
  duration?: number;
  shipName?: string;
  featuredImage?: string;
  maxCapacity?: number;
  currentBookings?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### Event Schema

```typescript
interface Event {
  id: number;
  cruiseId: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  type: 'party' | 'show' | 'activity' | 'dining' | 'meeting' | 'other';
  category?: string;
  capacity?: number;
  isPrivate: boolean;
  requiresReservation: boolean;
  cost?: number;
  heroImage?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

## 🔍 Search and Filtering

### Global Search

Search across trips, events, talent, and ports:

```http
GET /api/search?q=pride&type=events&limit=10
```

Parameters:
- `q` (required): Search query
- `type`: Filter by content type (`trips`, `events`, `talent`, `ports`, `all`)
- `limit`: Maximum results per type (1-50, default: 10)

### Filtering Options

#### Trip Filters
- `page`, `limit`: Pagination
- `search`: Text search
- `status`: Filter by publication status

#### Event Filters
- `cruiseId`: Filter by cruise
- `type`: Event type
- `startDate`, `endDate`: Date range
- `limit`, `offset`: Pagination

## 📝 Request/Response Examples

### Create a Trip

```http
POST /api/trips
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Mediterranean Magic 2024",
  "slug": "mediterranean-magic-2024",
  "subtitle": "7 Days of Sun, Sea & Celebration",
  "startDate": "2024-06-15",
  "endDate": "2024-06-22",
  "status": "draft",
  "price": 1299.99,
  "duration": 7,
  "shipName": "Celebrity Apex"
}
```

### Bulk Create Events

```http
POST /api/events/bulk
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "cruiseId": 1,
  "events": [
    {
      "title": "Welcome Party",
      "date": "2024-06-15",
      "time": "20:00",
      "type": "party",
      "location": "Main Deck",
      "capacity": 200
    },
    {
      "title": "Drag Show",
      "date": "2024-06-16",
      "time": "21:30",
      "type": "show",
      "location": "Theater"
    }
  ]
}
```

### Search Results

```http
GET /api/search?q=pride&type=events
```

Response:
```json
{
  "query": "pride",
  "total": 5,
  "results": {
    "events": [
      {
        "id": 1,
        "title": "Pride Night Dance Party",
        "date": "2024-06-17",
        "type": "party",
        "tags": ["pride", "dance", "party"]
      }
    ],
    "trips": [],
    "talent": [],
    "ports": []
  }
}
```

## ⚠️ Error Handling

The API uses standard HTTP status codes and returns consistent error responses:

### Error Response Format

```json
{
  "error": "Resource not found",
  "details": {
    "field": "id",
    "value": "99999"
  },
  "code": "NOT_FOUND"
}
```

### Common Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## 🛠️ Development

### Running Documentation Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access Swagger UI at: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

### Updating Documentation

The API documentation is automatically generated from the OpenAPI specification. To update:

1. Edit the OpenAPI spec files in `server/openapi/`
2. Restart the development server
3. Documentation updates are immediately available

### TypeScript Types

TypeScript types are generated from the OpenAPI specification and available in:
- `shared/api-types.ts`: Complete type definitions
- Use these types in your client applications for type safety

### Testing Documentation

Run the API documentation tests:

```bash
npm run test tests/api-documentation.test.ts
```

This validates:
- OpenAPI specification structure
- Endpoint accessibility
- Response formats
- Authentication flows
- Error handling

## 🔧 Client Libraries

### JavaScript/TypeScript Example

```typescript
import type { Trip, Event, ApiResponse } from './shared/api-types';

class KGayApiClient {
  constructor(private baseUrl: string, private token?: string) {}

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getTrips(): Promise<Trip[]> {
    return this.request<Trip[]>('/api/trips');
  }

  async createTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    return this.request<Trip>('/api/trips', {
      method: 'POST',
      body: JSON.stringify(trip),
    });
  }

  async searchAll(query: string, limit = 10) {
    return this.request(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }
}
```

### cURL Examples

```bash
# Get all trips
curl -X GET "http://localhost:3001/api/trips"

# Create a trip (with authentication)
curl -X POST "http://localhost:3001/api/trips" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Trip",
    "slug": "test-trip",
    "startDate": "2024-06-01",
    "endDate": "2024-06-07"
  }'

# Search
curl -X GET "http://localhost:3001/api/search?q=pride&type=events"
```

## 📈 Monitoring and Analytics

### Performance Metrics

Access Prometheus-style metrics at `/api/metrics` for monitoring:
- Request counts by endpoint
- Response times
- Error rates
- Rate limiting statistics

### Analytics Events

Track user behavior with the analytics endpoint:

```http
POST /api/analytics/track
Content-Type: application/json

{
  "event": "page_view",
  "properties": {
    "page": "/trips/mediterranean-magic-2024",
    "source": "navigation"
  },
  "userId": "user-123",
  "sessionId": "session-456"
}
```

## 🔄 API Versioning

The API supports versioning through multiple methods:
- Header: `API-Version: v1`
- URL path: `/api/v1/trips`
- Query parameter: `/api/trips?version=v1`

Current version: **v1**

## 🤝 Contributing

When adding new endpoints:

1. Update the OpenAPI specification in `server/openapi/paths/`
2. Implement the endpoint in the appropriate route file
3. Add TypeScript types to `shared/api-types.ts`
4. Update tests in `tests/api-documentation.test.ts`
5. Document any breaking changes

## 📞 Support

- **API Issues**: Create an issue in the project repository
- **Documentation Questions**: Check the interactive Swagger UI
- **Authentication Problems**: Verify your JWT token and user permissions

---

*Generated API documentation for K-GAY Travel Guides v1.0.0*