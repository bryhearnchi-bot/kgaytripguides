# API Enhancements Documentation

## Overview

This document outlines the comprehensive API enhancements implemented for the K-GAY Travel Guides backend system. These enhancements include input validation, rate limiting, CSRF protection, API versioning, and new admin endpoints.

## 🛡️ Security Enhancements

### 1. Input Validation with Zod

**Location**: `server/middleware/validation.ts`

All API endpoints now use Zod schemas for comprehensive input validation:

- **Body validation**: `validateBody(schema)`
- **Query parameter validation**: `validateQuery(schema)`
- **URL parameter validation**: `validateParams(schema)`

**Key Features**:
- Type-safe validation
- Detailed error messages
- Automatic data transformation
- Custom validation rules

**Example Usage**:
```typescript
app.post("/api/trips",
  validateBody(createTripSchema),
  async (req, res) => {
    // req.body is now validated and type-safe
  }
);
```

### 2. Rate Limiting

**Location**: `server/middleware/rate-limiting.ts`

Comprehensive rate limiting system with different limits for different endpoint types:

- **General API**: 1000 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **File uploads**: 50 requests per hour
- **Search**: 30 requests per minute
- **Admin operations**: 100 requests per minute
- **Bulk operations**: 10 requests per 5 minutes

**Features**:
- In-memory store (development)
- Redis support (production ready)
- Per-IP and per-user limiting
- Sliding window algorithm
- Rate limit headers in responses

### 3. CSRF Protection

**Location**: `server/middleware/csrf.ts`

Modern CSRF protection using double-submit cookie pattern:

- **Token generation**: Cryptographically secure tokens
- **Multiple verification methods**: Header, body, or query parameter
- **Session-based**: Tied to user sessions or IP for anonymous users
- **Configurable**: Different settings for development/production

**Endpoints**:
- `GET /api/csrf-token` - Get CSRF token
- Automatic protection on unsafe HTTP methods

## 🚀 New Admin Endpoints

### 1. Dashboard Statistics

```http
POST /api/admin/dashboard/stats
```

**Purpose**: Get comprehensive dashboard statistics
**Authentication**: Content Editor required
**Rate Limit**: Admin (100/min)

**Request Body**:
```json
{
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "metrics": ["trips", "events", "talent", "users"]
}
```

**Response**:
```json
{
  "trips": {
    "total": 12,
    "upcoming": 8,
    "past": 4
  },
  "events": {
    "total": 156
  },
  "talent": {
    "total": 45
  },
  "system": {
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": 86400,
    "memory": {...},
    "nodeVersion": "v20.0.0"
  }
}
```

### 2. System Health Check

```http
GET /api/admin/system/health
```

**Purpose**: Monitor system health and service status
**Authentication**: Content Editor required
**Rate Limit**: Admin (100/min)

**Query Parameters**:
- `includeDetails` (boolean): Include detailed system info
- `checkServices` (array): Services to check ['database', 'storage', 'cache']

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "services": {
    "database": { "status": "healthy" }
  }
}
```

### 3. Trip Duplication

```http
POST /api/trips/:id/duplicate
```

**Purpose**: Create a complete copy of a trip with all related data
**Authentication**: Content Editor required
**Rate Limit**: Admin (100/min)

**Features**:
- Copies trip, itinerary, events, and talent assignments
- Generates unique slug and name
- Sets status to 'upcoming'
- Maintains all relationships

### 4. Bulk Events Creation

```http
POST /api/events/bulk
```

**Purpose**: Create multiple events in a single request
**Authentication**: Content Editor required
**Rate Limit**: Bulk (10 per 5 minutes)

**Request Body**:
```json
{
  "events": [
    {
      "cruiseId": 1,
      "date": "2024-06-15T20:00:00Z",
      "time": "20:00",
      "title": "Welcome Party",
      "type": "party",
      "venue": "Main Deck"
    }
  ]
}
```

### 5. Bulk Talent Assignment

```http
POST /api/talent/bulk-assign
```

**Purpose**: Assign multiple talent to trips in batch
**Authentication**: Content Editor required
**Rate Limit**: Bulk (10 per 5 minutes)

**Request Body**:
```json
{
  "assignments": [
    {
      "cruiseId": 1,
      "talentId": 5,
      "role": "Headliner"
    }
  ]
}
```

### 6. Global Search

```http
GET /api/search/global
```

**Purpose**: Search across all content types
**Rate Limit**: Search (30/min)

**Query Parameters**:
- `query` (string, required): Search term
- `types` (array): Content types to search ['trips', 'events', 'talent', 'ports', 'ships']
- `limit` (number): Maximum results (default: 20, max: 100)

**Response**:
```json
{
  "query": "atlantis",
  "results": {
    "trips": [...],
    "events": [...],
    "talent": [...]
  },
  "totalResults": 15
}
```

### 7. Data Export

```http
POST /api/export/trips/:id
```

**Purpose**: Export trip data in various formats
**Authentication**: Content Editor required
**Rate Limit**: Admin (100/min)

**Request Body**:
```json
{
  "format": "json",
  "includeData": ["itinerary", "events", "talent"]
}
```

**Supported Formats**:
- JSON (implemented)
- CSV (placeholder)
- Excel (placeholder)

### 8. Data Import

```http
POST /api/import/trips
```

**Purpose**: Import trip data from external sources
**Authentication**: Super Admin required
**Rate Limit**: Bulk (10 per 5 minutes)

**Request Body**:
```json
{
  "data": {
    "trip": {...},
    "itinerary": [...],
    "events": [...]
  },
  "options": {
    "overwrite": false,
    "mergeStrategy": "merge"
  }
}
```

## 🔄 API Versioning

### Versioning Strategy

The API supports multiple versioning methods:

1. **URL Path**: `/api/v1/trips`
2. **Header**: `API-Version: v1`
3. **Query Parameter**: `/api/trips?version=v1`

### Version Management

**Current Versions**:
- `v1` - Current stable version

**Endpoints**:
- `GET /api/versions` - List all API versions
- Versioned routes: `/api/v1/*`

**Headers**:
- `X-API-Version` - Current version
- `X-API-Deprecated` - If version is deprecated
- `X-API-Support-Until` - Support end date

### Backward Compatibility

The system includes:
- Automatic field renaming for backward compatibility
- Gradual deprecation warnings
- Response transformation for different versions

## 🚦 Middleware Integration

### Applied Middleware by Route Type

1. **All API Routes**:
   - General rate limiting (1000/15min)
   - API versioning validation
   - CSRF protection (except auth routes)

2. **Admin Routes**:
   - Admin rate limiting (100/min)
   - Authentication required
   - Content Editor or Super Admin role

3. **Upload Routes**:
   - Upload rate limiting (50/hour)
   - File validation
   - Authentication required

4. **Search Routes**:
   - Search rate limiting (30/min)
   - Query validation

5. **Bulk Operations**:
   - Bulk rate limiting (10 per 5min)
   - Enhanced validation
   - Super Admin for sensitive operations

## 📊 Monitoring and Logging

### Rate Limit Headers

All responses include rate limit information:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time
- `X-RateLimit-Used` - Current usage

### Error Handling

Comprehensive error responses with:
- Specific error codes
- Detailed validation messages
- Security-conscious error exposure
- Structured error format

### Health Monitoring

- System uptime tracking
- Memory usage monitoring
- Database connectivity checks
- Service dependency monitoring

## 🔧 Configuration

### Environment Variables

```env
# Rate Limiting
REDIS_URL=redis://localhost:6379  # Optional, falls back to memory

# CSRF Protection
CSRF_SECRET=your-csrf-secret-key

# API Configuration
API_VERSION=v1
NODE_ENV=production
```

### Production Considerations

1. **Redis Integration**: Replace in-memory rate limiting with Redis
2. **Load Balancing**: Rate limits work across instances with Redis
3. **Monitoring**: Integrate with monitoring systems
4. **Security**: Review CSRF settings for production domains

## 🚀 Usage Examples

### Creating a Trip with Validation

```typescript
// Request
POST /api/trips
Content-Type: application/json
X-CSRF-Token: abc123...

{
  "name": "Mediterranean Magic",
  "slug": "mediterranean-magic-2024",
  "shipName": "Valiant Lady",
  "startDate": "2024-06-15T00:00:00Z",
  "endDate": "2024-06-22T00:00:00Z",
  "tripType": "cruise"
}

// Response (success)
HTTP/1.1 201 Created
X-API-Version: v1
X-RateLimit-Remaining: 99

{
  "id": 123,
  "name": "Mediterranean Magic",
  // ... trip data
}

// Response (validation error)
HTTP/1.1 400 Bad Request

{
  "error": "Validation failed",
  "details": [
    {
      "path": "startDate",
      "message": "Invalid start date format",
      "code": "invalid_string"
    }
  ]
}
```

### Using Versioned Endpoints

```typescript
// Method 1: URL path
GET /api/v1/trips/mediterranean-magic-2024

// Method 2: Header
GET /api/trips/mediterranean-magic-2024
API-Version: v1

// Method 3: Query parameter
GET /api/trips/mediterranean-magic-2024?version=v1
```

This comprehensive API enhancement provides a robust, secure, and scalable foundation for the K-GAY Travel Guides backend system.