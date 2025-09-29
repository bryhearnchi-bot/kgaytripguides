import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { openApiSpec } from './spec';
import { tripPaths } from './paths/trips';
import { eventPaths } from './paths/events';
import { adminPaths } from './paths/admin';
import { publicPaths } from './paths/public';

// Combine all paths
const allPaths = {
  ...publicPaths,
  ...tripPaths,
  ...eventPaths,
  ...adminPaths
};

// Complete OpenAPI specification
export const completeSpec = {
  ...openApiSpec,
  paths: allPaths
};

// Swagger JSDoc options
const swaggerOptions = {
  definition: completeSpec,
  apis: [] // We're not using JSDoc comments, everything is in the spec
};

// Generate swagger specification
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info .title { color: #1f2937; }
  .swagger-ui .info .description { color: #374151; }
  .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
  .swagger-ui .auth-container { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; }
  .swagger-ui .btn.authorize { background-color: #3b82f6; border-color: #3b82f6; }
  .swagger-ui .btn.authorize:hover { background-color: #2563eb; border-color: #2563eb; }
  .swagger-ui .operation-tag-content { margin-bottom: 20px; }
  .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #059669; }
  .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #dc2626; }
  .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #ea580c; }
  .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #dc2626; }
  .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: #7c3aed; }
`;

// Swagger UI options
const swaggerUiOptions = {
  customCss,
  customSiteTitle: 'K-GAY Travel Guides API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    requestSnippets: {
      generators: {
        curl_bash: {
          title: 'cURL (bash)',
          syntax: 'bash'
        },
        curl_powershell: {
          title: 'cURL (PowerShell)',
          syntax: 'powershell'
        },
        curl_cmd: {
          title: 'cURL (CMD)',
          syntax: 'bash'
        }
      }
    }
  }
};

/**
 * Setup Swagger UI documentation endpoint
 */
export function setupSwaggerDocs(app: Express): void {
  // Serve the OpenAPI specification as JSON
  app.get('/api/docs/swagger.json', (req: AuthenticatedRequest, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Alternative endpoint for OpenAPI spec
  app.get('/api/openapi.json', (req: AuthenticatedRequest, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 API Documentation available at:');
  console.log('   • Swagger UI: /api/docs');
  console.log('   • OpenAPI JSON: /api/docs/swagger.json');
  console.log('   • OpenAPI JSON (alt): /api/openapi.json');
}

/**
 * Generate TypeScript types from OpenAPI specification
 * This would typically be done as a build step
 */
export function generateTypeScript(): string {
  // Basic type generation - in a real project you'd use openapi-typescript
  const types = `
// Generated TypeScript types from OpenAPI specification
// This is a simplified version - use openapi-typescript for production

export interface Trip {
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

export interface Event {
  id: number;
  tripId: number;
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

export interface Talent {
  id: number;
  name: string;
  stageName?: string;
  type: 'drag_queen' | 'dj' | 'performer' | 'host' | 'comedian' | 'singer' | 'dancer' | 'other';
  bio?: string;
  profileImageUrl?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  featured: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  name: string;
  country: string;
  description?: string;
  imageUrl?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: 'viewer' | 'content_manager' | 'admin';
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  error: string;
  details?: Record<string, any>;
  code?: string;
}

export interface PaginationResponse<T = any> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Client types
export interface ApiClientConfig {
  baseURL: string;
  token?: string;
}

export interface SearchResult {
  query: string;
  total: number;
  results: {
    trips: Trip[];
    events: Event[];
    talent: Talent[];
    locations: Location[];
  };
}
`;

  return types;
}

export { swaggerUiOptions };