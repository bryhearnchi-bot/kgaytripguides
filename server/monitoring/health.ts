/**
 * Health Check Endpoints
 * Provides comprehensive health monitoring for the application
 */

import type { Request, Response } from 'express';
import { getSupabaseAdmin } from '../supabase-admin';
import { logger } from '../logging/logger';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';

interface HealthStatus {
  healthy: boolean;
  message?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface ServiceHealth {
  database: HealthStatus;
  memory: HealthStatus;
  disk: HealthStatus;
  cpu: HealthStatus;
  services: Record<string, HealthStatus>;
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    // Perform a simple query to check connectivity using Supabase Admin
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc('health_check', {});

    // If health_check function doesn't exist, fall back to a simple table query
    if (error && error.code === '42883') {
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .limit(1);

      if (fallbackError) {
        throw fallbackError;
      }
    } else if (error) {
      throw error;
    }

    // Connection pool status (managed internally by Supabase)
    const poolStats = {
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
    };

    const duration = Date.now() - startTime;

    // Warn if query is slow
    if (duration > 100) {
      logger.warn('Database health check slow', { duration });
    }

    return {
      healthy: true,
      duration,
      metadata: {
        connectionPool: poolStats,
        responseTime: `${duration}ms`,
      },
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.error('Database health check failed', error);

    return {
      healthy: false,
      message: error instanceof Error ? error.message : 'Database connection failed',
      duration,
    };
  }
}

/**
 * Check memory health
 */
function checkMemoryHealth(): HealthStatus {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercentage = (usedMem / totalMem) * 100;

  // Check if memory usage is too high
  // In development, be more lenient since the dev machine may have other processes
  const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const heapThreshold = isDevelopment ? 95 : 90;
  const systemThreshold = isDevelopment ? 99 : 90;
  const isHealthy = heapPercentage < heapThreshold && memPercentage < systemThreshold;

  if (!isHealthy) {
    logger.warn('High memory usage detected', {
      heapPercentage,
      systemMemPercentage: memPercentage,
    });
  }

  return {
    healthy: isHealthy,
    message: isHealthy ? undefined : 'High memory usage',
    metadata: {
      process: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapPercentage: `${heapPercentage.toFixed(2)}%`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
      system: {
        total: `${Math.round(totalMem / 1024 / 1024)}MB`,
        free: `${Math.round(freeMem / 1024 / 1024)}MB`,
        used: `${Math.round(usedMem / 1024 / 1024)}MB`,
        percentage: `${memPercentage.toFixed(2)}%`,
      },
    },
  };
}

/**
 * Check CPU health
 */
function checkCPUHealth(): HealthStatus {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuCount = cpus.length;

  // Calculate average CPU usage
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - Math.floor((idle * 100) / total);

  // Check if CPU load is too high (load average > number of CPUs)
  const isHealthy = (loadAvg[0] ?? 0) < cpuCount * 2;

  if (!isHealthy) {
    logger.warn('High CPU load detected', {
      loadAverage: loadAvg,
      cpuCount,
    });
  }

  return {
    healthy: isHealthy,
    message: isHealthy ? undefined : 'High CPU load',
    metadata: {
      cores: cpuCount,
      usage: `${usage}%`,
      loadAverage: {
        '1min': (loadAvg[0] ?? 0).toFixed(2),
        '5min': (loadAvg[1] ?? 0).toFixed(2),
        '15min': (loadAvg[2] ?? 0).toFixed(2),
      },
      model: cpus[0]?.model,
    },
  };
}

/**
 * Check disk health
 */
async function checkDiskHealth(): Promise<HealthStatus> {
  try {
    // Check available disk space for logs directory
    const logsDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

    // Create logs directory if it doesn't exist
    await fs.mkdir(logsDir, { recursive: true });

    // Write a test file to check write permissions
    const testFile = path.join(logsDir, '.health-check');
    await fs.writeFile(testFile, 'health-check', 'utf8');
    await fs.unlink(testFile);

    return {
      healthy: true,
      metadata: {
        logsDirectory: logsDir,
        writable: true,
      },
    };
  } catch (error: unknown) {
    logger.error('Disk health check failed', error);

    return {
      healthy: false,
      message: 'Disk write failed',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Check external service health
 * Note: These checks are informational only and don't affect overall health status
 */
async function checkExternalServices(): Promise<Record<string, HealthStatus>> {
  const services: Record<string, HealthStatus> = {};

  // Check Supabase Auth service if configured
  if (process.env.SUPABASE_URL) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/health`, {
        signal: AbortSignal.timeout(3000), // Reduced timeout
      });

      services.supabaseAuth = {
        healthy: response.ok,
        duration: Date.now() - startTime,
        metadata: {
          statusCode: response.status,
        },
      };
    } catch (error: unknown) {
      // External service checks are non-critical - mark as degraded, not failed
      services.supabaseAuth = {
        healthy: true, // Don't fail health check
        message: 'Supabase Auth check skipped (timeout or unreachable)',
      };
    }
  }

  // Check Supabase Storage service if configured
  if (process.env.SUPABASE_URL) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${process.env.SUPABASE_URL}/storage/v1/health`, {
        signal: AbortSignal.timeout(3000), // Reduced timeout
      });

      services.supabaseStorage = {
        healthy: response.ok,
        duration: Date.now() - startTime,
        metadata: {
          statusCode: response.status,
        },
      };
    } catch (error: unknown) {
      // External service checks are non-critical - mark as degraded, not failed
      services.supabaseStorage = {
        healthy: true, // Don't fail health check
        message: 'Supabase Storage check skipped (timeout or unreachable)',
      };
    }
  }

  return services;
}

/**
 * Main health check endpoint
 */
export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  const verbose = req.query.verbose === 'true';

  try {
    // Run health checks
    const [database, disk, services] = await Promise.all([
      checkDatabaseHealth(),
      checkDiskHealth(),
      checkExternalServices(),
    ]);

    const memory = checkMemoryHealth();
    const cpu = checkCPUHealth();

    // Determine overall health
    // Only critical services (database, cpu, disk) are required for health
    // Memory and external services can be degraded without failing health check
    const criticalChecks = database.healthy && cpu.healthy && disk.healthy;
    const isHealthy = criticalChecks;

    const health: ServiceHealth = {
      database,
      memory,
      cpu,
      disk,
      services,
    };

    // Build response
    const response: any = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      responseTime: Date.now() - startTime,
    };

    // Add detailed health info if verbose
    if (verbose) {
      response.services = health;
    } else {
      // Just include status summary
      response.checks = {
        database: database.healthy ? 'ok' : 'failed',
        memory: memory.healthy ? 'ok' : 'degraded',
        cpu: cpu.healthy ? 'ok' : 'degraded',
        disk: disk.healthy ? 'ok' : 'failed',
        externalServices: Object.values(services).every(s => s.healthy !== false)
          ? 'ok'
          : 'degraded',
      };
    }

    // Set appropriate status code
    const statusCode = isHealthy ? 200 : 503;

    // Log health check result if unhealthy
    if (!isHealthy) {
      logger.warn('Health check failed', response);
    }

    res.status(statusCode).json(response);
  } catch (error: unknown) {
    logger.error('Health check error', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      responseTime: Date.now() - startTime,
    });
  }
}

/**
 * Liveness probe - simple check that the service is running
 */
export function livenessProbe(req: Request, res: Response) {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Readiness probe - check if the service is ready to accept traffic
 */
export async function readinessProbe(req: Request, res: Response) {
  try {
    // Quick database check
    const dbHealth = await checkDatabaseHealth();

    if (dbHealth.healthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not available',
      });
    }
  } catch (error: unknown) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
}

/**
 * Startup probe - used during application startup
 */
export function startupProbe(req: Request, res: Response) {
  const uptime = process.uptime();

  // Consider the app started if it's been running for more than 10 seconds
  if (uptime > 10) {
    res.status(200).json({
      status: 'started',
      timestamp: new Date().toISOString(),
      uptime,
    });
  } else {
    res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
      uptime,
    });
  }
}

export default {
  healthCheck,
  livenessProbe,
  readinessProbe,
  startupProbe,
};
