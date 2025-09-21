/**
 * API Documentation Validation Tests
 *
 * This test suite validates that the OpenAPI documentation is working correctly
 * and that the documented endpoints are accessible and return expected responses.
 */

import { test, expect, describe } from 'vitest';

const BASE_URL = 'http://localhost:3001';

describe('API Documentation', () => {
  test('OpenAPI JSON specification is accessible', async () => {
    const response = await fetch(`${BASE_URL}/api/docs/swagger.json`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const spec = await response.json();
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('K-GAY Travel Guides API');
    expect(spec.info.version).toBe('1.0.0');
  });

  test('Swagger UI is accessible', async () => {
    const response = await fetch(`${BASE_URL}/api/docs/`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  test('Alternative OpenAPI JSON endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/api/openapi.json`);
    expect(response.status).toBe(200);

    const spec = await response.json();
    expect(spec.openapi).toBe('3.1.0');
  });
});

describe('API Endpoints Match Documentation', () => {
  test('API health check endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/api`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      ok: true,
      message: 'API is running'
    });
  });

  test('API versions endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/api/versions`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('versions');
    expect(data).toHaveProperty('currentVersion');
    expect(Array.isArray(data.versions)).toBe(true);
  });

  test('CSRF token endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/api/csrf-token`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('csrfToken');
    expect(typeof data.csrfToken).toBe('string');
    expect(data.csrfToken.length).toBeGreaterThan(0);
  });

  test('Trips endpoint returns array', async () => {
    const response = await fetch(`${BASE_URL}/api/trips`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('Events endpoint returns array', async () => {
    const response = await fetch(`${BASE_URL}/api/events`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('Health check endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/healthz`);
    expect(response.status).toBe(200);
  });

  test('Analytics tracking endpoint accepts POST', async () => {
    const response = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'test_event',
        properties: { test: true }
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Metrics endpoint returns text/plain', async () => {
    const response = await fetch(`${BASE_URL}/api/metrics`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
  });
});

describe('Authentication and Authorization', () => {
  test('Unauthorized requests to protected endpoints return 401', async () => {
    // Test creating a trip without authentication
    const response = await fetch(`${BASE_URL}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Trip',
        slug: 'test-trip',
        startDate: '2024-06-01',
        endDate: '2024-06-07'
      })
    });

    expect(response.status).toBe(401);
  });

  test('Admin endpoints require authentication', async () => {
    const response = await fetch(`${BASE_URL}/api/admin/cruises`);
    expect(response.status).toBe(401);
  });
});

describe('Error Handling', () => {
  test('404 for non-existent API routes', async () => {
    const response = await fetch(`${BASE_URL}/api/non-existent-endpoint`);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('404 for non-existent trip by ID', async () => {
    const response = await fetch(`${BASE_URL}/api/trips/id/99999`);
    expect(response.status).toBe(404);
  });

  test('404 for non-existent trip by slug', async () => {
    const response = await fetch(`${BASE_URL}/api/trips/non-existent-trip`);
    expect(response.status).toBe(404);
  });
});

describe('Content Types and Headers', () => {
  test('JSON endpoints return correct content type', async () => {
    const response = await fetch(`${BASE_URL}/api/trips`);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  test('Security headers are present', async () => {
    const response = await fetch(`${BASE_URL}/api`);

    // Check for important security headers
    expect(response.headers.get('x-frame-options')).toBeTruthy();
    expect(response.headers.get('x-content-type-options')).toBeTruthy();
    expect(response.headers.get('content-security-policy')).toBeTruthy();
  });

  test('Rate limiting headers are present', async () => {
    const response = await fetch(`${BASE_URL}/api`);

    expect(response.headers.get('x-ratelimit-limit')).toBeTruthy();
    expect(response.headers.get('x-ratelimit-remaining')).toBeTruthy();
    expect(response.headers.get('x-ratelimit-reset')).toBeTruthy();
  });
});

describe('OpenAPI Specification Validation', () => {
  let spec: any;

  beforeAll(async () => {
    const response = await fetch(`${BASE_URL}/api/docs/swagger.json`);
    spec = await response.json();
  });

  test('Required OpenAPI fields are present', () => {
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
    expect(spec.components).toBeDefined();
  });

  test('API info is properly defined', () => {
    expect(spec.info.title).toBe('K-GAY Travel Guides API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.info.description).toContain('K-GAY Travel Guides API');
    expect(spec.info.contact).toBeDefined();
    expect(spec.info.license).toBeDefined();
  });

  test('Servers are properly configured', () => {
    expect(spec.servers).toBeDefined();
    expect(Array.isArray(spec.servers)).toBe(true);
    expect(spec.servers.length).toBeGreaterThan(0);

    const devServer = spec.servers.find((s: any) => s.url.includes('localhost'));
    expect(devServer).toBeDefined();
  });

  test('Security schemes are defined', () => {
    expect(spec.components.securitySchemes).toBeDefined();
    expect(spec.components.securitySchemes.BearerAuth).toBeDefined();
    expect(spec.components.securitySchemes.BearerAuth.type).toBe('http');
    expect(spec.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
  });

  test('Core schemas are defined', () => {
    const schemas = spec.components.schemas;

    expect(schemas.Trip).toBeDefined();
    expect(schemas.Event).toBeDefined();
    expect(schemas.Talent).toBeDefined();
    expect(schemas.Port).toBeDefined();
    expect(schemas.User).toBeDefined();
    expect(schemas.ApiResponse).toBeDefined();
    expect(schemas.ErrorResponse).toBeDefined();
  });

  test('Trip schema has required fields', () => {
    const tripSchema = spec.components.schemas.Trip;

    expect(tripSchema.type).toBe('object');
    expect(tripSchema.required).toContain('name');
    expect(tripSchema.required).toContain('slug');
    expect(tripSchema.required).toContain('startDate');
    expect(tripSchema.required).toContain('endDate');
  });

  test('Event schema has required fields', () => {
    const eventSchema = spec.components.schemas.Event;

    expect(eventSchema.type).toBe('object');
    expect(eventSchema.required).toContain('title');
    expect(eventSchema.required).toContain('date');
    expect(eventSchema.required).toContain('time');
    expect(eventSchema.required).toContain('type');
  });

  test('Common parameters are defined', () => {
    const parameters = spec.components.parameters;

    expect(parameters.IdParam).toBeDefined();
    expect(parameters.SlugParam).toBeDefined();
    expect(parameters.PageParam).toBeDefined();
    expect(parameters.LimitParam).toBeDefined();
    expect(parameters.SearchParam).toBeDefined();
  });

  test('Standard HTTP responses are defined', () => {
    const responses = spec.components.responses;

    expect(responses.NotFound).toBeDefined();
    expect(responses.Unauthorized).toBeDefined();
    expect(responses.Forbidden).toBeDefined();
    expect(responses.BadRequest).toBeDefined();
    expect(responses.InternalServerError).toBeDefined();
  });

  test('API paths are properly documented', () => {
    const paths = spec.paths;

    // System endpoints
    expect(paths['/api']).toBeDefined();
    expect(paths['/api/versions']).toBeDefined();
    expect(paths['/healthz']).toBeDefined();

    // Trip endpoints
    expect(paths['/api/trips']).toBeDefined();
    expect(paths['/api/trips/upcoming']).toBeDefined();
    expect(paths['/api/trips/past']).toBeDefined();
    expect(paths['/api/trips/{slug}']).toBeDefined();

    // Event endpoints
    expect(paths['/api/events']).toBeDefined();
    expect(paths['/api/events/stats']).toBeDefined();

    // Admin endpoints
    expect(paths['/api/admin/cruises']).toBeDefined();
    expect(paths['/api/admin/dashboard/stats']).toBeDefined();
  });

  test('Endpoints have proper tags', () => {
    const paths = spec.paths;

    // Check that endpoints have appropriate tags
    expect(paths['/api/trips'].get.tags).toContain('Trips');
    expect(paths['/api/events'].get.tags).toContain('Events');
    expect(paths['/api/admin/cruises'].get.tags).toContain('Admin');
    expect(paths['/api'].get.tags).toContain('System');
  });

  test('HTTP methods are properly documented', () => {
    const paths = spec.paths;

    // Check various HTTP methods
    expect(paths['/api/trips'].get).toBeDefined();
    expect(paths['/api/trips'].post).toBeDefined();
    expect(paths['/api/trips/{id}'].put).toBeDefined();
    expect(paths['/api/trips/{id}'].delete).toBeDefined();
    expect(paths['/api/events/bulk'].post).toBeDefined();
  });
});

export {};