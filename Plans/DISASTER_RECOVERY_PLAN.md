# Disaster Recovery Plan
**Created**: September 15, 2025
**Project**: KGay Travel Guides
**Critical Level**: HIGH PRIORITY

## Executive Summary
This plan ensures business continuity and rapid recovery from disasters affecting the KGay Travel Guides application. It covers both technical failures and vendor outages.

## 1. Recovery Objectives

### Recovery Time Objective (RTO): 4 hours
- Maximum acceptable downtime for the application
- Measured from incident detection to service restoration
- Applies to production environment only

### Recovery Point Objective (RPO): 1 hour
- Maximum acceptable data loss
- Automated backups every hour
- Transaction logs retained for point-in-time recovery

### Service Level Targets
| Service | RTO | RPO | Priority |
|---------|-----|-----|----------|
| Database | 2 hours | 1 hour | Critical |
| Web Application | 4 hours | N/A | Critical |
| Image CDN | 8 hours | 0 (cached) | High |
| AI Services | 24 hours | N/A | Medium |
| Email Services | 48 hours | N/A | Low |

## 2. Alternate Service Providers

### Primary → Fallback Mapping

#### Database (Currently: Railway PostgreSQL)
**Primary**: Railway PostgreSQL
**Alternate 1**: Supabase PostgreSQL (Phase 3 target)
**Alternate 2**: Neon PostgreSQL
**Emergency**: Local PostgreSQL with ngrok tunnel

#### Hosting (Currently: Local/Development)
**Primary**: Vercel (planned)
**Alternate 1**: Netlify
**Alternate 2**: Railway
**Emergency**: GitHub Pages (static export)

#### Image Storage (Currently: Cloudinary)
**Primary**: Cloudinary
**Alternate 1**: Supabase Storage (Phase 3)
**Alternate 2**: AWS S3 + CloudFront
**Emergency**: Base64 embedded images

#### AI Services (Planned)
**Primary**: OpenAI GPT-4
**Alternate 1**: Anthropic Claude
**Alternate 2**: Perplexity API
**Emergency**: Disable AI features

## 3. Vendor-Agnostic Abstractions

### Database Abstraction Layer
```typescript
// server/abstractions/database.interface.ts
export interface IDatabaseProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  backup(): Promise<string>;
  restore(backupId: string): Promise<void>;
}

// Implementations
// server/providers/railway.database.ts
// server/providers/supabase.database.ts
// server/providers/neon.database.ts
```

### Storage Abstraction Layer
```typescript
// server/abstractions/storage.interface.ts
export interface IStorageProvider {
  upload(file: Buffer, path: string): Promise<string>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
  list(prefix: string): Promise<string[]>;
}

// Implementations
// server/providers/cloudinary.storage.ts
// server/providers/supabase.storage.ts
// server/providers/s3.storage.ts
```

### AI Service Abstraction
```typescript
// server/abstractions/ai.interface.ts
export interface IAIProvider {
  generateText(prompt: string, options?: any): Promise<string>;
  extractFromUrl(url: string): Promise<any>;
  processDocument(doc: Buffer, type: string): Promise<any>;
}

// Implementations
// server/providers/openai.ai.ts
// server/providers/anthropic.ai.ts
// server/providers/perplexity.ai.ts
```

## 4. Emergency Procedures

### Level 1: Service Degradation (Single Service Down)
1. **Detection**: Health checks fail for single service
2. **Response**:
   - Switch to alternate provider automatically
   - Notify team via Discord/Slack
   - Log incident in `incidents.log`
3. **Recovery**:
   - Fix primary service
   - Migrate back during low-traffic window

### Level 2: Partial Outage (Multiple Services Affected)
1. **Detection**: Multiple health checks failing
2. **Response**:
   - Activate read-only mode
   - Switch to emergency static site
   - All hands notification
3. **Recovery**:
   - Restore services in priority order
   - Gradual traffic ramp-up

### Level 3: Complete Outage (Total System Failure)
1. **Detection**: All monitoring systems red
2. **Response**:
   - Activate full disaster recovery
   - Deploy emergency static page
   - Executive notification
3. **Recovery**:
   - Deploy from last known good backup
   - Full system validation
   - Post-mortem required

## 5. Backup Procedures

### Automated Backups
```bash
# Scheduled via cron/GitHub Actions
0 * * * * /scripts/backup-hourly.sh  # Every hour
0 0 * * * /scripts/backup-daily.sh   # Daily at midnight
0 0 * * 0 /scripts/backup-weekly.sh  # Weekly on Sunday
```

### Manual Backup Script
```bash
#!/bin/bash
# scripts/backup-manual.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

# Database backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Application state
tar -czf "$BACKUP_DIR/app_$TIMESTAMP.tar.gz" \
  ./dist \
  ./public \
  ./.env.example \
  ./package.json \
  ./package-lock.json

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.sql" s3://kgay-backups/
aws s3 cp "$BACKUP_DIR/app_$TIMESTAMP.tar.gz" s3://kgay-backups/

echo "Backup completed: $TIMESTAMP"
```

### Restoration Test Procedure
```bash
#!/bin/bash
# scripts/test-restoration.sh

# 1. Create test database
createdb kgay_test_restore

# 2. Restore latest backup
LATEST_BACKUP=$(ls -t backups/db_*.sql | head -1)
psql kgay_test_restore < $LATEST_BACKUP

# 3. Verify data integrity
node scripts/verify-restoration.js

# 4. Clean up
dropdb kgay_test_restore
```

## 6. Communication Plan

### Incident Communication Tree
1. **Primary Contact**: Bryan (Project Owner)
2. **Technical Lead**: DevOps Engineer (TBD)
3. **Stakeholders**: Via email distribution list
4. **Users**: Status page + in-app banner

### Status Page Template
```markdown
# Service Status

## Current Status: [🟢 Operational | 🟡 Degraded | 🔴 Outage]

### Affected Services
- [ ] Website
- [ ] Database
- [ ] Image Loading
- [ ] AI Features

### Updates
- **[Time]**: Issue detected, investigating
- **[Time]**: Root cause identified
- **[Time]**: Fix deployed, monitoring
- **[Time]**: Service restored

Next update in: 30 minutes
```

## 7. Recovery Validation Checklist

### Post-Recovery Validation
- [ ] All database tables accessible
- [ ] Record counts match pre-incident
- [ ] All images loading correctly
- [ ] Authentication working
- [ ] API endpoints responding
- [ ] Search functionality operational
- [ ] Admin interfaces accessible
- [ ] Monitoring systems green
- [ ] Backup job successful
- [ ] Performance metrics normal

## 8. Disaster Recovery Testing Schedule

### Monthly Tests (First Monday)
- Backup restoration to test environment
- Failover to alternate database
- Health check validation

### Quarterly Tests (First Monday of Quarter)
- Full disaster recovery drill
- Provider switching test
- Communication plan exercise

### Annual Tests (January)
- Complete system rebuild from backups
- Multi-region failover test
- Third-party security audit

## 9. Emergency Contacts

### Service Providers
| Service | Provider | Support Contact | Account # |
|---------|----------|----------------|-----------|
| Database | Railway | support@railway.app | [REDACTED] |
| Future DB | Supabase | support@supabase.com | TBD |
| CDN | Cloudinary | support@cloudinary.com | [REDACTED] |
| Hosting | Vercel | support@vercel.com | TBD |

### Internal Team
| Role | Name | Primary Contact | Backup Contact |
|------|------|----------------|----------------|
| Project Owner | Bryan | [Email] | [Phone] |
| DevOps Lead | TBD | TBD | TBD |
| Database Admin | TBD | TBD | TBD |

## 10. Lessons Learned Log

### Format for Post-Incident Review
```markdown
## Incident: [Date] - [Title]

### What Happened
[Description of the incident]

### Root Cause
[Technical root cause analysis]

### What Went Well
- [Positive points]

### What Could Be Improved
- [Areas for improvement]

### Action Items
- [ ] [Specific improvement tasks]

### Prevention Measures
[Steps to prevent recurrence]
```

## 11. Compliance & Audit

### Compliance Requirements
- GDPR: Data must be recoverable within 72 hours
- CCPA: User data deletion must be maintained through recovery
- PCI DSS: Not applicable (no payment processing)

### Audit Trail
- All recovery actions logged to `audit.log`
- Backup verification reports stored for 1 year
- Incident reports retained indefinitely

## 12. Budget & Resources

### Recovery Infrastructure Costs
| Item | Monthly Cost | Annual Cost | Status |
|------|-------------|------------|---------|
| Backup Storage (S3) | $20 | $240 | Planned |
| Monitoring (Datadog) | $15 | $180 | Planned |
| Status Page | $29 | $348 | Planned |
| **Total** | **$64** | **$768** | Budget Approved |

## Quick Reference Card

### 🚨 EMERGENCY PROCEDURES 🚨

#### Database Down
```bash
# Switch to backup database
export DATABASE_URL=$BACKUP_DATABASE_URL
npm run deploy:emergency
```

#### Complete Outage
```bash
# Deploy static emergency page
npm run build:static
npm run deploy:emergency-static
```

#### Data Corruption
```bash
# Restore from last backup
./scripts/restore-from-backup.sh
```

#### Provider Failure
```bash
# Switch providers
npm run switch:provider -- --from railway --to supabase
```

---

**Document Version**: 1.0
**Last Updated**: September 15, 2025
**Next Review**: October 15, 2025
**Owner**: Bryan

*This is a living document and should be updated after each incident or drill.*