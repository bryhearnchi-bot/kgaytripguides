# Blue-Green Deployment Configuration
**Created**: September 15, 2025
**Project**: KGay Travel Guides
**Deployment Strategy**: Zero-Downtime Migration

## Overview
Blue-Green deployment enables zero-downtime releases by maintaining two identical production environments. Only one (Blue or Green) serves live traffic at any time.

## 1. Architecture Overview

```
                    [Load Balancer / CDN]
                           |
                    [Traffic Router]
                    /              \
                   /                \
            [BLUE ENV]          [GREEN ENV]
            - App v1.0          - App v1.1
            - DB Schema v1      - DB Schema v2
            - Active ✓          - Standby
```

## 2. Environment Configuration

### Blue Environment (Current Production)
```yaml
# blue-env.yaml
name: kgay-blue
database:
  url: postgresql://[user]@[host]:5432/kgay_blue
  version: schema_v1
application:
  url: https://blue.kgay-guides.com
  version: 1.0.0
  status: active
cdn:
  url: https://cdn-blue.kgay-guides.com
monitoring:
  healthcheck: https://blue.kgay-guides.com/health
  metrics: datadog.blue.kgay
```

### Green Environment (Staging/Next)
```yaml
# green-env.yaml
name: kgay-green
database:
  url: postgresql://[user]@[host]:5432/kgay_green
  version: schema_v2
application:
  url: https://green.kgay-guides.com
  version: 1.1.0
  status: standby
cdn:
  url: https://cdn-green.kgay-guides.com
monitoring:
  healthcheck: https://green.kgay-guides.com/health
  metrics: datadog.green.kgay
```

## 3. Database Replication Setup

### PostgreSQL Streaming Replication
```sql
-- On BLUE (Primary)
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET wal_keep_segments = 64;
ALTER SYSTEM SET hot_standby = on;

-- Create replication user
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
```

### Replication Configuration
```bash
#!/bin/bash
# scripts/setup-replication.sh

# On GREEN (Standby)
pg_basebackup -h blue-db-host -D /var/lib/postgresql/data \
  -U replicator -W -P -R --checkpoint=fast

# Configure recovery
cat > /var/lib/postgresql/data/recovery.conf << EOF
standby_mode = 'on'
primary_conninfo = 'host=blue-db-host port=5432 user=replicator'
trigger_file = '/tmp/promote_to_primary'
EOF

# Start replication
pg_ctl start -D /var/lib/postgresql/data
```

### Replication Monitoring
```sql
-- Check replication status
SELECT client_addr, state, sync_state, replay_lag
FROM pg_stat_replication;

-- On standby, check lag
SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;
```

## 4. Traffic Switching Mechanism

### Vercel Configuration (Primary Method)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "https://blue.kgay-guides.com/$1",
      "has": [
        {
          "type": "cookie",
          "key": "deployment",
          "value": "blue"
        }
      ]
    },
    {
      "source": "/(.*)",
      "destination": "https://green.kgay-guides.com/$1",
      "has": [
        {
          "type": "cookie",
          "key": "deployment",
          "value": "green"
        }
      ]
    }
  ]
}
```

### Traffic Router Service
```typescript
// server/traffic-router.ts
import { Request, Response, NextFunction } from 'express';

interface Environment {
  name: 'blue' | 'green';
  url: string;
  weight: number;
  active: boolean;
}

class TrafficRouter {
  private environments: Environment[] = [
    { name: 'blue', url: process.env.BLUE_URL!, weight: 100, active: true },
    { name: 'green', url: process.env.GREEN_URL!, weight: 0, active: false }
  ];

  // Gradual traffic shifting
  async shiftTraffic(targetEnv: 'blue' | 'green', percentage: number) {
    const source = targetEnv === 'blue' ? 'green' : 'blue';

    this.environments = this.environments.map(env => ({
      ...env,
      weight: env.name === targetEnv ? percentage : 100 - percentage
    }));

    await this.updateLoadBalancer();
  }

  // Instant cutover
  async cutover(targetEnv: 'blue' | 'green') {
    this.environments = this.environments.map(env => ({
      ...env,
      active: env.name === targetEnv,
      weight: env.name === targetEnv ? 100 : 0
    }));

    await this.updateLoadBalancer();
  }

  // Route request based on weight
  route(req: Request, res: Response, next: NextFunction) {
    const random = Math.random() * 100;
    let accumulated = 0;

    for (const env of this.environments) {
      accumulated += env.weight;
      if (random <= accumulated) {
        req.headers['X-Target-Environment'] = env.name;
        return proxy(env.url)(req, res, next);
      }
    }
  }

  private async updateLoadBalancer() {
    // Update Vercel/Nginx/HAProxy configuration
    console.log('Load balancer updated:', this.environments);
  }
}

export const trafficRouter = new TrafficRouter();
```

## 5. Health Check Endpoints

### Application Health Check
```typescript
// server/routes/health.ts
import { Router } from 'express';
import { db } from '../storage';

const router = Router();

router.get('/health', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.DEPLOYMENT_ENV, // 'blue' or 'green'
    version: process.env.APP_VERSION,
    status: 'healthy',
    checks: {
      database: 'unknown',
      storage: 'unknown',
      memory: 'unknown'
    }
  };

  try {
    // Database check
    await db.raw('SELECT 1');
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  try {
    // Storage check (Cloudinary)
    const testUrl = await getImageUrl('health-check');
    checks.checks.storage = testUrl ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.checks.storage = 'unhealthy';
    checks.status = 'degraded';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.checks.memory = heapUsedPercent < 90 ? 'healthy' : 'unhealthy';

  res.status(checks.status === 'healthy' ? 200 : 503).json(checks);
});

router.get('/health/ready', async (req, res) => {
  // Readiness probe for deployment
  const ready = await isApplicationReady();
  res.status(ready ? 200 : 503).json({ ready });
});

router.get('/health/live', (req, res) => {
  // Liveness probe - simple check that app is running
  res.status(200).json({ alive: true });
});

export default router;
```

### Monitoring Script
```bash
#!/bin/bash
# scripts/monitor-health.sh

BLUE_URL="https://blue.kgay-guides.com/health"
GREEN_URL="https://green.kgay-guides.com/health"

check_health() {
  local url=$1
  local env=$2

  response=$(curl -s -o /dev/null -w "%{http_code}" $url)

  if [ $response -eq 200 ]; then
    echo "✅ $env environment is healthy"
  else
    echo "❌ $env environment is unhealthy (HTTP $response)"

    # Send alert
    curl -X POST $DISCORD_WEBHOOK \
      -H "Content-Type: application/json" \
      -d "{\"content\": \"🚨 $env environment health check failed!\"}"
  fi
}

while true; do
  check_health $BLUE_URL "BLUE"
  check_health $GREEN_URL "GREEN"
  sleep 30
done
```

## 6. Automated Rollback Triggers

### Rollback Configuration
```typescript
// deployment/rollback-config.ts
export const rollbackTriggers = {
  // Error rate threshold
  errorRate: {
    threshold: 5, // 5% error rate
    window: 300, // 5 minutes
    action: 'automatic'
  },

  // Response time threshold
  responseTime: {
    p95: 2000, // 2 seconds
    p99: 5000, // 5 seconds
    window: 300,
    action: 'automatic'
  },

  // Health check failures
  healthCheck: {
    consecutiveFailures: 3,
    interval: 10, // seconds
    action: 'automatic'
  },

  // Database issues
  database: {
    connectionFailures: 5,
    queryTimeout: 10000, // 10 seconds
    action: 'automatic'
  }
};
```

### Rollback Automation
```typescript
// deployment/rollback-manager.ts
import { rollbackTriggers } from './rollback-config';

class RollbackManager {
  private metrics: Map<string, any> = new Map();
  private activeEnvironment: 'blue' | 'green' = 'blue';

  async monitorAndRollback() {
    setInterval(async () => {
      const shouldRollback = await this.checkTriggers();

      if (shouldRollback) {
        await this.executeRollback();
      }
    }, 10000); // Check every 10 seconds
  }

  private async checkTriggers(): Promise<boolean> {
    // Check error rate
    const errorRate = await this.getErrorRate();
    if (errorRate > rollbackTriggers.errorRate.threshold) {
      console.error(`Error rate ${errorRate}% exceeds threshold`);
      return true;
    }

    // Check response time
    const p95 = await this.getResponseTimeP95();
    if (p95 > rollbackTriggers.responseTime.p95) {
      console.error(`P95 response time ${p95}ms exceeds threshold`);
      return true;
    }

    // Check health
    const healthStatus = await this.checkHealth();
    if (!healthStatus) {
      console.error('Health check failed');
      return true;
    }

    return false;
  }

  private async executeRollback() {
    console.log('🚨 EXECUTING AUTOMATIC ROLLBACK');

    const previousEnv = this.activeEnvironment === 'blue' ? 'green' : 'blue';

    // 1. Switch traffic back
    await trafficRouter.cutover(previousEnv);

    // 2. Alert team
    await this.sendAlert('Automatic rollback executed');

    // 3. Log incident
    await this.logIncident();

    // 4. Update active environment
    this.activeEnvironment = previousEnv;
  }

  private async getErrorRate(): Promise<number> {
    // Query metrics service
    const response = await fetch(`${process.env.METRICS_API}/error-rate`);
    const data = await response.json();
    return data.rate;
  }

  private async getResponseTimeP95(): Promise<number> {
    const response = await fetch(`${process.env.METRICS_API}/response-time/p95`);
    const data = await response.json();
    return data.value;
  }

  private async checkHealth(): Promise<boolean> {
    const url = this.activeEnvironment === 'blue'
      ? process.env.BLUE_HEALTH_URL
      : process.env.GREEN_HEALTH_URL;

    try {
      const response = await fetch(url!);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async sendAlert(message: string) {
    // Send to Discord/Slack
    await fetch(process.env.ALERT_WEBHOOK!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `🚨 ${message}` })
    });
  }

  private async logIncident() {
    const incident = {
      timestamp: new Date(),
      type: 'automatic_rollback',
      from: this.activeEnvironment,
      to: this.activeEnvironment === 'blue' ? 'green' : 'blue',
      metrics: Object.fromEntries(this.metrics)
    };

    // Log to database or file
    console.log('Incident logged:', incident);
  }
}

export const rollbackManager = new RollbackManager();
```

## 7. Deployment Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/blue-green-deploy.yml
name: Blue-Green Deployment

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      target_env:
        description: 'Target environment'
        required: true
        default: 'green'
        type: choice
        options:
          - blue
          - green

jobs:
  determine-target:
    runs-on: ubuntu-latest
    outputs:
      target: ${{ steps.target.outputs.environment }}
    steps:
      - id: target
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "environment=${{ github.event.inputs.target_env }}" >> $GITHUB_OUTPUT
          else
            # Auto-select inactive environment
            ACTIVE=$(curl -s https://kgay-guides.com/api/active-env)
            if [ "$ACTIVE" = "blue" ]; then
              echo "environment=green" >> $GITHUB_OUTPUT
            else
              echo "environment=blue" >> $GITHUB_OUTPUT
            fi
          fi

  deploy:
    needs: determine-target
    runs-on: ubuntu-latest
    environment: ${{ needs.determine-target.outputs.target }}
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          DEPLOYMENT_ENV: ${{ needs.determine-target.outputs.target }}

      - name: Run database migrations
        run: npm run migrate
        env:
          DATABASE_URL: ${{ secrets[format('{0}_DATABASE_URL', needs.determine-target.outputs.target)] }}

      - name: Deploy to target environment
        run: |
          if [ "${{ needs.determine-target.outputs.target }}" = "blue" ]; then
            npm run deploy:blue
          else
            npm run deploy:green
          fi

      - name: Health check
        run: |
          sleep 30
          ./scripts/health-check.sh ${{ needs.determine-target.outputs.target }}

      - name: Smoke tests
        run: npm run test:smoke
        env:
          TARGET_URL: https://${{ needs.determine-target.outputs.target }}.kgay-guides.com

  traffic-shift:
    needs: [deploy, determine-target]
    runs-on: ubuntu-latest
    if: success()
    steps:
      - name: Shift 10% traffic
        run: |
          curl -X POST https://kgay-guides.com/api/traffic/shift \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            -d '{"target": "${{ needs.determine-target.outputs.target }}", "percentage": 10}'

      - name: Monitor metrics (5 min)
        run: sleep 300

      - name: Check error rate
        id: errors
        run: |
          ERROR_RATE=$(curl -s https://kgay-guides.com/api/metrics/error-rate)
          if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
            echo "High error rate detected: $ERROR_RATE%"
            exit 1
          fi

      - name: Shift 50% traffic
        if: success()
        run: |
          curl -X POST https://kgay-guides.com/api/traffic/shift \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            -d '{"target": "${{ needs.determine-target.outputs.target }}", "percentage": 50}'

      - name: Monitor metrics (5 min)
        run: sleep 300

      - name: Full cutover
        if: success()
        run: |
          curl -X POST https://kgay-guides.com/api/traffic/cutover \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            -d '{"target": "${{ needs.determine-target.outputs.target }}"}'

      - name: Update DNS (optional)
        if: success()
        run: |
          # Update DNS records if using DNS-based switching
          echo "Deployment complete to ${{ needs.determine-target.outputs.target }}"
```

## 8. Testing Procedures

### Pre-Deployment Tests
```bash
#!/bin/bash
# scripts/pre-deploy-tests.sh

echo "Running pre-deployment tests..."

# 1. Unit tests
npm run test:unit || exit 1

# 2. Integration tests
npm run test:integration || exit 1

# 3. Database migration dry-run
npm run migrate:dry-run || exit 1

# 4. Build verification
npm run build || exit 1

# 5. Security scan
npm audit --audit-level=high || exit 1

echo "✅ All pre-deployment tests passed"
```

### Post-Deployment Tests
```bash
#!/bin/bash
# scripts/post-deploy-tests.sh

TARGET_ENV=$1
TARGET_URL="https://${TARGET_ENV}.kgay-guides.com"

echo "Running post-deployment tests for $TARGET_ENV..."

# 1. Health check
curl -f "$TARGET_URL/health" || exit 1

# 2. Database connectivity
curl -f "$TARGET_URL/api/db-check" || exit 1

# 3. Critical endpoints
ENDPOINTS=(
  "/api/trips"
  "/api/trips/1"
  "/api/talent"
  "/api/events"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing $endpoint..."
  curl -f "$TARGET_URL$endpoint" || exit 1
done

# 4. Image loading
curl -f "$TARGET_URL/api/images/test" || exit 1

# 5. Performance test
response_time=$(curl -o /dev/null -s -w '%{time_total}' "$TARGET_URL")
if (( $(echo "$response_time > 2" | bc -l) )); then
  echo "❌ Response time too high: ${response_time}s"
  exit 1
fi

echo "✅ All post-deployment tests passed"
```

## 9. Manual Procedures

### Manual Cutover Process
```bash
# 1. Verify green environment
./scripts/health-check.sh green

# 2. Compare environments
./scripts/compare-envs.sh blue green

# 3. Backup current state
./scripts/backup-blue.sh

# 4. Switch traffic (gradual)
curl -X POST https://kgay-guides.com/api/traffic/shift \
  -H "Authorization: Bearer $DEPLOY_TOKEN" \
  -d '{"target": "green", "percentage": 10}'

# Wait and monitor
sleep 300

# Increase traffic
curl -X POST https://kgay-guides.com/api/traffic/shift \
  -H "Authorization: Bearer $DEPLOY_TOKEN" \
  -d '{"target": "green", "percentage": 50}'

# Wait and monitor
sleep 300

# Full cutover
curl -X POST https://kgay-guides.com/api/traffic/cutover \
  -H "Authorization: Bearer $DEPLOY_TOKEN" \
  -d '{"target": "green"}'

# 5. Verify
./scripts/verify-deployment.sh green
```

### Emergency Rollback
```bash
#!/bin/bash
# scripts/emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# 1. Immediate traffic switch
curl -X POST https://kgay-guides.com/api/traffic/cutover \
  -H "Authorization: Bearer $DEPLOY_TOKEN" \
  -d '{"target": "blue"}'

# 2. Clear CDN cache
curl -X POST https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache \
  -H "Authorization: Bearer $CF_TOKEN" \
  -d '{"purge_everything": true}'

# 3. Alert team
curl -X POST $DISCORD_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"content": "🚨 Emergency rollback executed! Previous environment restored."}'

# 4. Generate incident report
./scripts/generate-incident-report.sh

echo "✅ Rollback complete"
```

## 10. Environment Sync

### Data Sync Between Environments
```bash
#!/bin/bash
# scripts/sync-environments.sh

SOURCE=$1  # blue or green
TARGET=$2  # blue or green

echo "Syncing from $SOURCE to $TARGET..."

# 1. Database sync (for non-production data)
pg_dump $SOURCE_DATABASE_URL \
  --exclude-table=users \
  --exclude-table=audit_log \
  | psql $TARGET_DATABASE_URL

# 2. Static assets sync
aws s3 sync s3://kgay-$SOURCE s3://kgay-$TARGET \
  --exclude "*.log" \
  --exclude "temp/*"

# 3. Configuration sync
./scripts/sync-config.sh $SOURCE $TARGET

echo "✅ Environment sync complete"
```

## Quick Reference

### Commands
```bash
# Check current active environment
curl https://kgay-guides.com/api/active-env

# Health check both environments
./scripts/health-check.sh blue
./scripts/health-check.sh green

# Deploy to green
npm run deploy:green

# Switch traffic (10% to green)
npm run traffic:shift -- --target green --percentage 10

# Full cutover to green
npm run traffic:cutover -- --target green

# Emergency rollback
npm run rollback:emergency
```

### Environment URLs
- **Production**: https://kgay-guides.com
- **Blue**: https://blue.kgay-guides.com
- **Green**: https://green.kgay-guides.com
- **Metrics**: https://metrics.kgay-guides.com
- **Status**: https://status.kgay-guides.com

---

**Document Version**: 1.0
**Last Updated**: September 15, 2025
**Next Review**: October 15, 2025
**Owner**: Bryan

*This configuration ensures zero-downtime deployments with automatic rollback capabilities.*