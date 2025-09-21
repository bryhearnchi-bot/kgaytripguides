/**
 * Example demonstrating the new error handling system
 * This shows how to use the standardized error handling in routes
 */

import type { Express } from 'express';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/errorHandler';
import {
  validateId,
  ensureResourceExists,
  executeDbOperation,
  validateRequiredFields,
  getPaginationParams,
  buildPaginatedResponse
} from '../utils/errorUtils';

// Example service (mock)
const userService = {
  async findById(id: number) {
    // Simulated database lookup
    if (id === 999) return null;
    return { id, name: 'John Doe', email: 'john@example.com' };
  },

  async create(data: any) {
    // Simulated user creation
    return { id: 1, ...data };
  },

  async findAll(offset: number, limit: number) {
    // Simulated pagination
    return {
      data: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ],
      total: 100
    };
  }
};

export function registerExampleRoutes(app: Express) {

  // ============ EXAMPLE 1: Simple Resource Retrieval ============
  app.get('/api/example/users/:id',
    asyncHandler(async (req, res) => {
      // Automatically validates and parses ID
      const userId = validateId(req.params.id, 'User');

      // Fetch user with automatic error handling
      const user = await executeDbOperation(
        () => userService.findById(userId),
        'Failed to retrieve user'
      );

      // Ensures resource exists or throws 404
      ensureResourceExists(user, 'User');

      res.json(user);
    })
  );

  // ============ EXAMPLE 2: Resource Creation with Validation ============
  app.post('/api/example/users',
    asyncHandler(async (req, res) => {
      // Validate required fields (throws 422 if missing)
      validateRequiredFields(req.body, ['email', 'name', 'password']);

      // Additional custom validation
      const { email, password } = req.body;

      if (!email.includes('@')) {
        throw ApiError.validationError('Invalid email format', {
          field: 'email',
          value: email,
          requirement: 'Must be a valid email address'
        });
      }

      if (password.length < 8) {
        throw ApiError.validationError('Password too short', {
          field: 'password',
          requirement: 'Must be at least 8 characters'
        });
      }

      // Create user with automatic database error handling
      const user = await executeDbOperation(
        () => userService.create(req.body),
        'Failed to create user'
      );

      res.status(201).json(user);
    })
  );

  // ============ EXAMPLE 3: Paginated List with Error Handling ============
  app.get('/api/example/users',
    asyncHandler(async (req, res) => {
      // Get pagination params with validation
      const params = getPaginationParams(req.query);

      // Fetch paginated data
      const result = await executeDbOperation(
        () => userService.findAll(params.offset, params.limit),
        'Failed to retrieve users'
      );

      // Build standardized pagination response
      const response = buildPaginatedResponse(
        result.data,
        result.total,
        params
      );

      res.json(response);
    })
  );

  // ============ EXAMPLE 4: Complex Business Logic ============
  app.post('/api/example/transfer',
    asyncHandler(async (req, res) => {
      const { fromUserId, toUserId, amount } = req.body;

      // Validate inputs
      validateRequiredFields(req.body, ['fromUserId', 'toUserId', 'amount']);

      if (amount <= 0) {
        throw ApiError.badRequest('Amount must be positive');
      }

      if (fromUserId === toUserId) {
        throw ApiError.badRequest('Cannot transfer to same account');
      }

      // Check permissions (example)
      if (req.user?.id !== fromUserId && req.user?.role !== 'admin') {
        throw ApiError.forbidden('You can only transfer from your own account');
      }

      // Simulate business rule violation
      if (amount > 1000) {
        throw new ApiError(400, 'Transfer limit exceeded', {
          code: 'BUSINESS_RULE_VIOLATION',
          details: {
            limit: 1000,
            requested: amount
          }
        });
      }

      // Process transfer...
      res.json({ success: true, transactionId: '12345' });
    })
  );

  // ============ EXAMPLE 5: External Service Integration ============
  app.post('/api/example/notify',
    asyncHandler(async (req, res) => {
      try {
        // Simulate external service call
        const response = await fetch('https://api.example.com/notify', {
          method: 'POST',
          body: JSON.stringify(req.body)
        });

        if (!response.ok) {
          throw ApiError.externalServiceError('Notification Service');
        }

        res.json({ success: true });
      } catch (error) {
        // Convert fetch errors to ApiError
        if (error instanceof ApiError) {
          throw error;
        }

        throw ApiError.externalServiceError('Notification Service', error as Error);
      }
    })
  );

  // ============ EXAMPLE 6: File Upload with Validation ============
  app.post('/api/example/upload',
    asyncHandler(async (req, res) => {
      if (!req.file) {
        throw ApiError.badRequest('No file uploaded');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw ApiError.validationError('Invalid file type', {
          allowed: allowedTypes,
          received: req.file.mimetype
        });
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw ApiError.validationError('File too large', {
          maxSize: '5MB',
          receivedSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`
        });
      }

      // Process file...
      res.json({
        success: true,
        filename: req.file.filename,
        size: req.file.size
      });
    })
  );
}

// Example of how errors are automatically handled:
/*

1. Missing Required Field:
   Request: POST /api/example/users
   Body: { "email": "test@example.com" }
   Response: {
     "error": {
       "message": "Missing required fields",
       "code": "VALIDATION_ERROR",
       "statusCode": 422,
       "details": {
         "missingFields": ["name", "password"],
         "requiredFields": ["email", "name", "password"]
       }
     }
   }

2. Resource Not Found:
   Request: GET /api/example/users/999
   Response: {
     "error": {
       "message": "User not found",
       "code": "NOT_FOUND",
       "statusCode": 404
     }
   }

3. Invalid Input:
   Request: GET /api/example/users/abc
   Response: {
     "error": {
       "message": "Invalid User ID",
       "code": "INVALID_INPUT",
       "statusCode": 400
     }
   }

4. Database Error (automatically caught):
   Any database operation failure is caught and converted to:
   {
     "error": {
       "message": "Failed to retrieve user",
       "code": "DATABASE_ERROR",
       "statusCode": 500
     }
   }

5. Rate Limiting (automatic):
   When rate limit is exceeded:
   {
     "error": {
       "message": "Too many requests from this IP, please try again later",
       "code": "RATE_LIMIT_EXCEEDED",
       "statusCode": 429,
       "details": {
         "retryAfter": "60",
         "limit": "100"
       }
     }
   }

*/