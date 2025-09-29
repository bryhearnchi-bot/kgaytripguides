import { Request, Response, NextFunction, Router } from 'express';
import { z } from 'zod';

// API Version configuration
export interface APIVersionConfig {
  version: string;
  deprecated?: boolean;
  deprecationDate?: Date;
  supportUntil?: Date;
  redirectTo?: string;
}

// Version registry
const versionRegistry = new Map<string, APIVersionConfig>();

// Register API version
export function registerVersion(config: APIVersionConfig) {
  versionRegistry.set(config.version, config);
}

// Get version from request
function getVersionFromRequest(req: Request): string {
  // Try header first
  const headerVersion = req.get('API-Version') || req.get('X-API-Version');
  if (headerVersion) {
    return headerVersion;
  }

  // Try URL path
  const pathMatch = req.path.match(/^\/api\/v(\d+(?:\.\d+)?)\//);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // Try query parameter
  const queryVersion = req.query.version as string;
  if (queryVersion) {
    return queryVersion;
  }

  // Default to latest stable version
  return 'v1';
}

// Version validation middleware
export function validateVersion(supportedVersions: string[] = ['v1']) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestedVersion = getVersionFromRequest(req);

    if (!supportedVersions.includes(requestedVersion)) {
      return res.status(400).json({
        error: 'Unsupported API version',
        requestedVersion,
        supportedVersions,
        message: `API version '${requestedVersion}' is not supported. Please use one of: ${supportedVersions.join(', ')}`
      });
    }

    // Check if version is deprecated
    const versionConfig = versionRegistry.get(requestedVersion);
    if (versionConfig?.deprecated) {
      res.set('X-API-Deprecated', 'true');
      if (versionConfig.deprecationDate) {
        res.set('X-API-Deprecated-Date', versionConfig.deprecationDate.toISOString());
      }
      if (versionConfig.supportUntil) {
        res.set('X-API-Support-Until', versionConfig.supportUntil.toISOString());
      }
      if (versionConfig.redirectTo) {
        res.set('X-API-Redirect-To', versionConfig.redirectTo);
      }
    }

    // Add version info to request
    (req as any).apiVersion = requestedVersion;
    return next();
  };
}

// Version-specific route handler
export function versionedRoute(routes: Record<string, (req: Request, res: Response, next: NextFunction) => void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = (req as any).apiVersion || 'v1';
    const handler = routes[version] || routes['default'];

    if (!handler) {
      return res.status(501).json({
        error: 'Version not implemented',
        version,
        message: `Handler for version '${version}' is not implemented`
      });
    }

    return handler(req, res, next);
  };
}

// Create versioned router
export function createVersionedRouter(version: string): Router {
  const router = Router();

  // Add version validation middleware
  router.use(validateVersion([version]));

  // Add version header to all responses
  router.use((req, res, next) => {
    res.set('X-API-Version', version);
    next();
  });

  return router;
}

// Middleware to handle API version content negotiation
export function apiVersionNegotiation() {
  return (req: Request, res: Response, next: NextFunction) => {
    const acceptVersion = req.get('Accept-Version');
    const requestedVersion = getVersionFromRequest(req);

    // If client specifies accept-version, validate compatibility
    if (acceptVersion && acceptVersion !== requestedVersion) {
      // Parse version ranges (simplified)
      const acceptedVersions = acceptVersion.split(',').map(v => v.trim());
      if (!acceptedVersions.includes(requestedVersion)) {
        return res.status(406).json({
          error: 'Version not acceptable',
          requestedVersion,
          acceptedVersions,
          message: 'The requested API version is not acceptable by the client'
        });
      }
    }

    return next();
  };
}

// Response transformer for backward compatibility
export function versionedResponse(transformers: Record<string, (data: any) => any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = (req as any).apiVersion || 'v1';
    const originalJson = res.json.bind(res);

    res.json = function(data: any) {
      const transformer = transformers[version];
      if (transformer && data) {
        data = transformer(data);
      }
      return originalJson(data);
    };

    next();
  };
}

// Register default versions
registerVersion({
  version: 'v1',
  deprecated: false
});

// API version documentation endpoint
export function apiVersionsEndpoint(req: Request, res: Response) {
  const versions = Array.from(versionRegistry.entries()).map(([version, config]) => ({
    version,
    current: version === 'v1',
    deprecated: config.deprecated || false,
    deprecationDate: config.deprecationDate?.toISOString(),
    supportUntil: config.supportUntil?.toISOString(),
    redirectTo: config.redirectTo
  }));

  res.json({
    versions,
    currentVersion: 'v1',
    defaultVersion: 'v1',
    versioningScheme: 'header, url-path, query-parameter',
    headers: {
      version: 'API-Version',
      deprecated: 'X-API-Deprecated',
      redirectTo: 'X-API-Redirect-To'
    }
  });
}

// Middleware for handling breaking changes gracefully
export function breakingChangeHandler(changes: Record<string, {
  removedFields?: string[];
  renamedFields?: Record<string, string>;
  changedTypes?: Record<string, string>;
  newRequiredFields?: string[];
}>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = (req as any).apiVersion || 'v1';
    const versionChanges = changes[version];

    if (versionChanges && req.body) {
      // Handle renamed fields (backward compatibility)
      if (versionChanges.renamedFields) {
        Object.entries(versionChanges.renamedFields).forEach(([oldName, newName]) => {
          if (req.body[oldName] !== undefined && req.body[newName] === undefined) {
            req.body[newName] = req.body[oldName];
          }
        });
      }

      // Warn about removed fields
      if (versionChanges.removedFields) {
        const usedRemovedFields = versionChanges.removedFields.filter(
          field => req.body[field] !== undefined
        );
        if (usedRemovedFields.length > 0) {
          res.set('X-API-Warning', `Deprecated fields used: ${usedRemovedFields.join(', ')}`);
        }
      }
    }

    next();
  };
}

// Schema versioning helper
export function createVersionedSchema<T>(schemas: Record<string, z.ZodSchema<T>>) {
  return (req: Request): z.ZodSchema<T> => {
    const version = (req as any).apiVersion || 'v1';
    const schema = schemas[version] || schemas['v1'] || schemas['default'];
    if (!schema) {
      throw new Error(`No schema found for version: ${version}`);
    }
    return schema;
  };
}

export { getVersionFromRequest };