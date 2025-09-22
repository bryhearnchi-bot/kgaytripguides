import type { OpenAPIV3_1 } from 'openapi-types';

export const openApiSpec: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'K-GAY Travel Guides API',
    version: '1.0.0',
    description: `
# K-GAY Travel Guides API

The K-GAY Travel Guides API provides comprehensive access to cruise information, events, talent, and locations for LGBTQ+ travel experiences.

## Features
- 🚢 **Trip & Cruise Management** - Complete cruise and travel information
- 🎭 **Event Management** - Party events, talent shows, and activities
- 👥 **Talent Directory** - Artists, performers, and special guests
- 📍 **Location Services** - Ports, ships, and destinations
- 🔐 **Authentication** - Secure user and admin access
- 📊 **Analytics** - Performance monitoring and statistics

## Authentication
All protected endpoints require authentication via Supabase Auth. Include the Bearer token in the Authorization header.

## Rate Limiting
- General API requests: 100 requests per 15 minutes
- Admin operations: 30 requests per 15 minutes
- Search operations: 50 requests per 15 minutes
- Bulk operations: 10 requests per 15 minutes

## Error Handling
The API uses standard HTTP status codes and returns consistent error responses with detailed messages.
    `,
    contact: {
      name: 'K-GAY Travel Guides Support',
      email: 'support@kgay-travel.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://kgay-travel-guides-production.up.railway.app',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    }
  ],
  security: [
    {
      BearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT token for authentication'
      }
    },
    schemas: {
      // Base schemas
      Trip: {
        type: 'object',
        required: ['name', 'slug', 'startDate', 'endDate'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the trip',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Trip name',
            example: 'Mediterranean Magic 2024'
          },
          slug: {
            type: 'string',
            description: 'URL-friendly trip identifier',
            example: 'mediterranean-magic-2024'
          },
          subtitle: {
            type: 'string',
            nullable: true,
            description: 'Trip subtitle',
            example: '7 Days of Sun, Sea & Celebration'
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Detailed trip description'
          },
          startDate: {
            type: 'string',
            format: 'date',
            description: 'Trip start date',
            example: '2024-06-15'
          },
          endDate: {
            type: 'string',
            format: 'date',
            description: 'Trip end date',
            example: '2024-06-22'
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            description: 'Trip publication status',
            example: 'published'
          },
          price: {
            type: 'number',
            format: 'decimal',
            nullable: true,
            description: 'Starting price in USD',
            example: 1299.99
          },
          duration: {
            type: 'integer',
            nullable: true,
            description: 'Trip duration in days',
            example: 7
          },
          shipName: {
            type: 'string',
            nullable: true,
            description: 'Name of the cruise ship',
            example: 'Celebrity Apex'
          },
          featuredImage: {
            type: 'string',
            nullable: true,
            description: 'URL to the featured image',
            example: 'https://storage.supabase.co/cruise-images/med-magic.jpg'
          },
          maxCapacity: {
            type: 'integer',
            nullable: true,
            description: 'Maximum passenger capacity',
            example: 500
          },
          currentBookings: {
            type: 'integer',
            nullable: true,
            description: 'Current number of bookings',
            example: 342
          },
          metadata: {
            type: 'object',
            nullable: true,
            description: 'Additional trip metadata'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Trip creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      Event: {
        type: 'object',
        required: ['title', 'date', 'time', 'type'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the event',
            example: 1
          },
          cruiseId: {
            type: 'integer',
            description: 'ID of the associated cruise/trip',
            example: 1
          },
          title: {
            type: 'string',
            description: 'Event title',
            example: 'Pride Night Dance Party'
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Event description'
          },
          date: {
            type: 'string',
            format: 'date',
            description: 'Event date',
            example: '2024-06-17'
          },
          time: {
            type: 'string',
            format: 'time',
            description: 'Event time',
            example: '21:00'
          },
          endTime: {
            type: 'string',
            format: 'time',
            nullable: true,
            description: 'Event end time',
            example: '02:00'
          },
          location: {
            type: 'string',
            nullable: true,
            description: 'Event location/venue',
            example: 'Main Deck Pool Area'
          },
          type: {
            type: 'string',
            enum: ['party', 'show', 'activity', 'dining', 'meeting', 'other'],
            description: 'Event type category',
            example: 'party'
          },
          category: {
            type: 'string',
            nullable: true,
            description: 'Event category',
            example: 'entertainment'
          },
          capacity: {
            type: 'integer',
            nullable: true,
            description: 'Maximum event capacity',
            example: 200
          },
          isPrivate: {
            type: 'boolean',
            description: 'Whether the event is private',
            example: false
          },
          requiresReservation: {
            type: 'boolean',
            description: 'Whether the event requires reservation',
            example: true
          },
          cost: {
            type: 'number',
            format: 'decimal',
            nullable: true,
            description: 'Event cost in USD',
            example: 25.00
          },
          heroImage: {
            type: 'string',
            nullable: true,
            description: 'URL to the event hero image'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Event tags for categorization',
            example: ['dance', 'pride', 'party']
          },
          metadata: {
            type: 'object',
            nullable: true,
            description: 'Additional event metadata'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Event creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      Talent: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the talent',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Talent name',
            example: 'Miss Tina'
          },
          stageName: {
            type: 'string',
            nullable: true,
            description: 'Stage or performance name',
            example: 'Tina Tension'
          },
          type: {
            type: 'string',
            enum: ['drag_queen', 'dj', 'performer', 'host', 'comedian', 'singer', 'dancer', 'other'],
            description: 'Type of talent',
            example: 'drag_queen'
          },
          bio: {
            type: 'string',
            nullable: true,
            description: 'Talent biography'
          },
          profileImageUrl: {
            type: 'string',
            nullable: true,
            description: 'URL to profile image'
          },
          socialMedia: {
            type: 'object',
            nullable: true,
            description: 'Social media links',
            properties: {
              instagram: { type: 'string' },
              twitter: { type: 'string' },
              tiktok: { type: 'string' },
              youtube: { type: 'string' }
            }
          },
          featured: {
            type: 'boolean',
            description: 'Whether the talent is featured',
            example: true
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the talent is active',
            example: true
          },
          metadata: {
            type: 'object',
            nullable: true,
            description: 'Additional talent metadata'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Talent creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      Location: {
        type: 'object',
        required: ['name', 'country'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the location',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Location name',
            example: 'Santorini'
          },
          country: {
            type: 'string',
            description: 'Country where the location is located',
            example: 'Greece'
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Location description'
          },
          imageUrl: {
            type: 'string',
            nullable: true,
            description: 'URL to location image'
          },
          coordinates: {
            type: 'object',
            nullable: true,
            properties: {
              latitude: { type: 'number', format: 'float' },
              longitude: { type: 'number', format: 'float' }
            },
            description: 'Location coordinates'
          },
          timezone: {
            type: 'string',
            nullable: true,
            description: 'Location timezone',
            example: 'Europe/Athens'
          },
          metadata: {
            type: 'object',
            nullable: true,
            description: 'Additional location metadata'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Location creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user identifier (Supabase Auth UUID)',
            example: '550e8400-e29b-41d4-a716-446655440000'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com'
          },
          fullName: {
            type: 'string',
            nullable: true,
            description: 'User full name',
            example: 'John Doe'
          },
          username: {
            type: 'string',
            nullable: true,
            description: 'User username',
            example: 'johndoe'
          },
          role: {
            type: 'string',
            enum: ['viewer', 'content_manager', 'admin'],
            description: 'User role',
            example: 'viewer'
          },
          accountStatus: {
            type: 'string',
            enum: ['active', 'suspended', 'pending_verification'],
            description: 'Account status',
            example: 'active'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the user is active',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      // Response schemas
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the request was successful'
          },
          message: {
            type: 'string',
            description: 'Response message'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Resource not found'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          },
          code: {
            type: 'string',
            description: 'Error code',
            example: 'NOT_FOUND'
          }
        }
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {},
            description: 'Array of data items'
          },
          pagination: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                description: 'Total number of items'
              },
              page: {
                type: 'integer',
                description: 'Current page number'
              },
              limit: {
                type: 'integer',
                description: 'Items per page'
              },
              totalPages: {
                type: 'integer',
                description: 'Total number of pages'
              }
            }
          }
        }
      }
    },
    parameters: {
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Resource ID',
        schema: {
          type: 'integer',
          minimum: 1
        }
      },
      SlugParam: {
        name: 'slug',
        in: 'path',
        required: true,
        description: 'Resource slug',
        schema: {
          type: 'string',
          pattern: '^[a-z0-9-]+$'
        }
      },
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        }
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Search query string',
        schema: {
          type: 'string'
        }
      }
    },
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Resource not found'
            }
          }
        }
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Authentication required'
            }
          }
        }
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Insufficient permissions'
            }
          }
        }
      },
      BadRequest: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Invalid request data',
              details: {
                field: 'name',
                message: 'Name is required'
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Internal server error'
            }
          }
        }
      }
    }
  },
  paths: {}
};