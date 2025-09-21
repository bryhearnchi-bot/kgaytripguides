# Logging and Monitoring System

## Overview
A comprehensive logging and monitoring system has been implemented for the K-GAY Travel Guides application using Winston for structured logging and custom metrics collection for performance monitoring.

## Components

### 1. Structured Logging (`/server/logging/logger.ts`)
- **Winston Logger**: Enterprise-grade logging with JSON format
- **Log Levels**: error, warn, info, http, debug
- **Features**:
  - Context management (request ID, user ID)
  - Child loggers for component isolation
  - Specialized logging methods (audit, performance, security, query)
  - Automatic log rotation in production (daily files, 14-30 day retention)
  - Separate transports for errors and audit logs

### 2. Request Logging Middleware (`/server/logging/middleware.ts`)
- **Request Logger**: Captures all HTTP requests/responses
- **Features**:
  - Automatic request ID generation
  - Response time tracking
  - Sensitive data sanitization (passwords, tokens, API keys)
  - Slow request detection (>1000ms)
  - Context propagation throughout request lifecycle

### 3. Audit Logging
- **Purpose**: Track sensitive operations for compliance
- **Coverage**:
  - Admin user management (create, update, delete)
  - Authentication events (login, logout, password changes)
  - Data modifications
- **Usage**: `auditLogger('action.name')` middleware

### 4. Health Check Endpoints (`/server/monitoring/health.ts`)
- **Endpoints**:
  - `/healthz`, `/health` - Comprehensive health check
  - `/liveness` - Simple alive check
  - `/readiness` - Ready to accept traffic
  - `/startup` - Startup probe for orchestrators
- **Monitors**:
  - Database connectivity
  - Memory usage (process and system)
  - CPU load and usage
  - Disk write permissions
  - External service availability (Supabase)

### 5. Performance Metrics (`/server/monitoring/metrics.ts`)
- **Metric Types**:
  - Counters (requests, errors)
  - Gauges (active connections, memory)
  - Histograms (response times, query durations)
- **Features**:
  - Prometheus format export (`/metrics?format=prometheus`)
  - Percentile calculations (p50, p90, p95, p99)
  - Business metrics tracking
  - System metrics collection (every 10s)

## Usage Examples

### Basic Logging
```typescript
import { logger } from './logging/logger';

// Info log
logger.info('User logged in', { userId: '123', email: 'user@example.com' });

// Error log with stack trace
logger.error('Database connection failed', error, { query: 'SELECT...' });

// Performance log
logger.performance('api_call', 150, { endpoint: '/api/users' });

// Audit log
logger.audit('USER_DELETE', { userId: '456', deletedBy: 'admin' });
```

### Request Context
```typescript
// In middleware
req.logger.info('Processing payment', { amount: 100 });
// Automatically includes requestId and userId
```

### Metrics Collection
```typescript
import { metrics } from './monitoring/metrics';

// Count events
metrics.increment('user_signups', 1, { plan: 'premium' });

// Track values
metrics.gauge('active_sessions', 42);

// Record timings
metrics.histogram('db_query_time', 25);
```

## Configuration

### Environment Variables
```env
# Logging
LOG_LEVEL=info              # debug, info, warn, error
LOG_DIR=/var/log/app        # Log file directory (production)

# Monitoring
ANALYTICS_ENDPOINT=https://analytics.example.com
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=your-secret
```

### Production Setup
1. **Log Rotation**: Automatic daily rotation with compression
2. **Retention**: 14 days for general logs, 30 days for errors, 90 days for audit
3. **Performance**: Async logging to prevent blocking
4. **Security**: Automatic PII redaction in production

## Monitoring Dashboard

Access monitoring data via:
- **Health Status**: `GET /healthz?verbose=true`
- **Metrics JSON**: `GET /metrics`
- **Prometheus Format**: `GET /metrics?format=prometheus`

### Health Response Example
```json
{
  "status": "healthy",
  "timestamp": "2025-09-20T21:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "memory": "ok",
    "cpu": "ok",
    "disk": "ok",
    "externalServices": "ok"
  }
}
```

### Metrics Response Example
```json
{
  "counters": {
    "http_requests_total": { "value": 1000 },
    "errors_total": { "value": 5 }
  },
  "gauges": {
    "nodejs_heap_size_used_bytes": { "value": 50000000 }
  },
  "histograms": {
    "http_request_duration_ms": {
      "count": 1000,
      "average": 45,
      "percentiles": {
        "p50": 30,
        "p90": 80,
        "p95": 120,
        "p99": 250
      }
    }
  }
}
```

## Integration with Error Handling

The logging system is fully integrated with the error handling middleware:
- All errors are automatically logged with context
- Error metrics are tracked by type and status code
- Stack traces included in development, hidden in production
- Request context preserved in error logs

## Testing

A comprehensive test suite is provided in `__tests__/logging.test.ts`:
- Logger functionality tests
- Metrics collection tests
- Middleware behavior tests
- Health check endpoint tests
- Error integration tests

Run tests with: `npm test logging`

## Best Practices

1. **Always use structured logging** - Pass metadata as objects
2. **Use appropriate log levels** - Debug for development, Info for production
3. **Include context** - User ID, request ID, operation details
4. **Sanitize sensitive data** - Never log passwords, tokens, or PII
5. **Monitor metrics** - Set up alerts for error rates and performance
6. **Review audit logs** - Regular security audits of sensitive operations
7. **Test logging** - Ensure critical paths have appropriate logging

## Troubleshooting

### Common Issues

1. **High memory usage from logs**
   - Reduce LOG_LEVEL to 'warn' or 'error'
   - Decrease log retention period
   - Enable log compression

2. **Missing request context**
   - Ensure requestLogger middleware is applied early
   - Check that req.logger is used instead of global logger

3. **Performance impact**
   - Use child loggers to reduce metadata overhead
   - Batch metrics updates
   - Consider async transports for high-volume logging

## Future Enhancements

- [ ] Integration with external monitoring services (DataDog, New Relic)
- [ ] Log aggregation and search (ELK stack)
- [ ] Real-time alerting based on metrics
- [ ] Distributed tracing support
- [ ] Custom dashboards for business metrics
- [ ] Automated log analysis and anomaly detection