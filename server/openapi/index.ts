/**
 * OpenAPI / Swagger Documentation Setup
 *
 * This file sets up Swagger UI for API documentation.
 * Currently simplified pending proper type definitions.
 *
 * TODO: Implement complete OpenAPI spec with all routes
 */

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { openApiSpec } from './spec';

// Generate swagger specification
export const swaggerSpec = swaggerJSDoc({
  definition: openApiSpec,
  apis: []
});

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none; }
`;

// Swagger UI options
const swaggerUiOptions = {
  customCss,
  customSiteTitle: 'K-GAY Travel API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  }
};

/**
 * Setup OpenAPI documentation endpoints
 */
export function setupOpenAPI(app: Express): void {
  // Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
  );

  // OpenAPI spec as JSON
  app.get('/api/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export { openApiSpec };