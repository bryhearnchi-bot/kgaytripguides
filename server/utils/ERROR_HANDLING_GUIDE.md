# Error Handling Guide for K-GAY Travel Guides Backend

## Overview

The K-GAY Travel Guides backend uses a standardized error handling system that provides:
- Consistent error response format
- Proper HTTP status codes
- Error codes for client-side handling
- Appropriate logging
- Security (hiding sensitive information in production)

## Core Components

### 1. ApiError Class (`server/utils/ApiError.ts`)

The `ApiError` class is the foundation of our error handling system. It extends the native Error class and provides:
- Standardized error structure
- Error codes for client identification
- Factory methods for common errors
- Automatic stack trace capture

#### Usage Examples:

```typescript
import { ApiError } from '../utils/ApiError';

// Using factory methods
throw ApiError.notFound('User');
throw ApiError.badRequest('Invalid email format');
throw ApiError.unauthorized();
throw ApiError.forbidden('You cannot access this resource');
throw ApiError.validationError('Invalid input', { fields: ['email', 'password'] });

// Custom error with code
throw new ApiError(400, 'Custom error message', {
  code: ErrorCode.INVALID_INPUT,
  details: { field: 'email' }
});
```

### 2. Global Error Handler (`server/middleware/errorHandler.ts`)

The global error handler middleware catches all errors and:
- Converts them to ApiError format
- Logs errors appropriately
- Sends consistent responses
- Hides sensitive information in production

#### Features:
- Automatic error conversion
- Request context logging
- Security headers
- Development vs production modes

### 3. Error Utilities (`server/utils/errorUtils.ts`)

Helper functions for common error scenarios:

```typescript
import {
  validateId,
  ensureResourceExists,
  executeDbOperation,
  validateRequiredFields,
  buildPaginatedResponse
} from '../utils/errorUtils';

// Validate and parse ID
const userId = validateId(req.params.id, 'User');

// Ensure resource exists
const user = await userStorage.getUser(userId);
ensureResourceExists(user, 'User');

// Execute database operation with error handling
const result = await executeDbOperation(
  () => db.insert(users).values(userData),
  'Failed to create user'
);

// Validate required fields
validateRequiredFields(req.body, ['email', 'password', 'name']);
```

## Migration Guide

### Step 1: Update Route Handlers

#### Before (Old Style):
```typescript
app.post('/api/users', async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await userStorage.createUser(req.body);
    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### After (New Style):
```typescript
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import { validateRequiredFields, executeDbOperation } from '../utils/errorUtils';

app.post('/api/users',
  asyncHandler(async (req, res) => {
    // Validation throws ApiError automatically
    validateRequiredFields(req.body, ['email']);

    // Database operation with automatic error handling
    const user = await executeDbOperation(
      () => userStorage.createUser(req.body),
      'Failed to create user'
    );

    res.json(user);
  })
);
```

### Step 2: Gradual Migration

For backwards compatibility during migration, use the legacy wrapper:

```typescript
import { legacyErrorWrapper } from '../utils/backwardsCompatibility';

// Temporary wrapper for gradual migration
app.post('/api/legacy-endpoint',
  legacyErrorWrapper(async (req, res) => {
    // Can throw ApiError, will be converted to old format
    throw ApiError.notFound('Resource');
  })
);
```

## Error Response Formats

### New Structured Format (v2+):
```json
{
  "error": {
    "message": "User not found",
    "code": "NOT_FOUND",
    "statusCode": 404,
    "timestamp": "2024-01-20T10:30:00.000Z",
    "details": {
      "resource": "User",
      "id": "123"
    }
  }
}
```

### Legacy Format (for backwards compatibility):
```json
{
  "error": "User not found",
  "message": "User not found"
}
```

## Error Codes

The system provides standardized error codes for client-side handling:

```typescript
enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}
```

## Client-Side Handling

Clients can handle errors based on codes:

```typescript
// Client-side example
try {
  const response = await fetch('/api/users/123');
  const data = await response.json();

  if (!response.ok) {
    switch (data.error?.code) {
      case 'NOT_FOUND':
        showError('User not found');
        break;
      case 'UNAUTHORIZED':
        redirectToLogin();
        break;
      case 'RATE_LIMIT_EXCEEDED':
        showError(`Please wait ${data.error.details.retryAfter} seconds`);
        break;
      default:
        showError(data.error?.message || 'An error occurred');
    }
  }
} catch (error) {
  showError('Network error');
}
```

## Best Practices

1. **Always use asyncHandler for async routes**:
   ```typescript
   app.get('/api/resource', asyncHandler(async (req, res) => {
     // Your async code here
   }));
   ```

2. **Use specific ApiError factory methods**:
   ```typescript
   // Good
   throw ApiError.notFound('User');

   // Less specific
   throw new ApiError(404, 'User not found');
   ```

3. **Include helpful details**:
   ```typescript
   throw ApiError.validationError('Invalid input', {
     fields: ['email', 'password'],
     requirements: {
       email: 'Must be a valid email',
       password: 'Must be at least 8 characters'
     }
   });
   ```

4. **Use error utilities for common patterns**:
   ```typescript
   // Database operations
   const user = await executeDbOperation(
     () => userStorage.createUser(data),
     'Failed to create user'
   );

   // Resource validation
   ensureResourceExists(user, 'User');
   ```

5. **Log appropriately**:
   - Critical errors (non-operational) are automatically logged
   - Operational errors (expected) are logged at lower levels
   - Sensitive information is automatically filtered in production

## Testing Error Handling

```typescript
// Test example
describe('Error Handling', () => {
  it('should return 404 for non-existent resource', async () => {
    const response = await request(app)
      .get('/api/users/999')
      .expect(404);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({})
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.missingFields).toContain('email');
  });
});
```

## Monitoring and Alerting

The error handler automatically:
- Logs critical errors to console
- Integrates with monitoring services (if configured)
- Tracks error patterns
- Provides metrics for debugging

## Security Considerations

1. **Production Mode**:
   - Stack traces are hidden
   - Database errors are genericized
   - Sensitive fields are filtered
   - Internal details are removed

2. **Development Mode**:
   - Full stack traces included
   - Detailed error information
   - Original errors preserved

## Backwards Compatibility

The system maintains backwards compatibility:
- Old error format is preserved by default
- Clients can opt-in to new format via headers
- Gradual migration path available
- No breaking changes for existing clients

## Common Patterns

### Validation with Early Return
```typescript
asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !isValidEmail(email)) {
    throw ApiError.validationError('Invalid email');
  }

  if (!password || password.length < 8) {
    throw ApiError.validationError('Password must be at least 8 characters');
  }

  // Continue with valid data...
});
```

### Database Transaction with Rollback
```typescript
asyncHandler(async (req, res) => {
  const trx = await db.transaction();

  try {
    const user = await trx.insert(users).values(userData);
    const profile = await trx.insert(profiles).values({ userId: user.id });

    await trx.commit();
    res.json({ user, profile });
  } catch (error) {
    await trx.rollback();
    throw ApiError.databaseError('Transaction failed', error);
  }
});
```

### External Service Integration
```typescript
asyncHandler(async (req, res) => {
  try {
    const result = await externalService.call();
    res.json(result);
  } catch (error) {
    throw ApiError.externalServiceError('Payment Gateway', error);
  }
});
```

## Summary

The standardized error handling system provides:
- ✅ Consistent error responses
- ✅ Proper HTTP status codes
- ✅ Client-friendly error codes
- ✅ Secure error messages
- ✅ Comprehensive logging
- ✅ Backwards compatibility
- ✅ Developer-friendly utilities

By following this guide, you can ensure robust and consistent error handling throughout the application.