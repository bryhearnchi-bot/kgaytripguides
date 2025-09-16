# Security Planning Document
**Created**: September 15, 2025
**Project**: KGay Travel Guides
**Classification**: CONFIDENTIAL

## Executive Summary
Comprehensive security plan for KGay Travel Guides application covering threat modeling, current system audit, security requirements, penetration testing, and incident response procedures.

## 1. Threat Modeling

### Asset Inventory
| Asset | Type | Criticality | Current Protection |
|-------|------|-------------|-------------------|
| User Database | Data | Critical | PostgreSQL with basic auth |
| Trip/Event Data | Data | High | Database access controls |
| Talent Images | Media | Medium | Cloudinary CDN |
| API Keys | Secrets | Critical | Environment variables |
| Admin Interface | System | High | To be implemented |
| User Sessions | Auth | High | JWT tokens planned |

### Threat Actors
1. **External Attackers**
   - Motivation: Data theft, defacement, ransom
   - Capability: Medium to High
   - Likelihood: Medium

2. **Malicious Users**
   - Motivation: Free access, data manipulation
   - Capability: Low to Medium
   - Likelihood: Low (no user accounts yet)

3. **Automated Bots**
   - Motivation: Spam, scraping, DDoS
   - Capability: Low to Medium
   - Likelihood: High

4. **Insider Threats**
   - Motivation: Data theft, sabotage
   - Capability: High
   - Likelihood: Low

### STRIDE Analysis

#### Spoofing
- **Threat**: Impersonation of admin users
- **Current State**: No authentication implemented
- **Risk Level**: HIGH
- **Mitigation**: Implement MFA, session management

#### Tampering
- **Threat**: Unauthorized data modification
- **Current State**: No audit logging
- **Risk Level**: HIGH
- **Mitigation**: Implement audit trails, checksums

#### Repudiation
- **Threat**: Denying actions performed
- **Current State**: No action logging
- **Risk Level**: MEDIUM
- **Mitigation**: Comprehensive audit logging

#### Information Disclosure
- **Threat**: Exposure of sensitive data
- **Current State**: API keys in .env file
- **Risk Level**: MEDIUM
- **Mitigation**: Secret management system

#### Denial of Service
- **Threat**: Service unavailability
- **Current State**: No rate limiting
- **Risk Level**: HIGH
- **Mitigation**: Rate limiting, CDN, DDoS protection

#### Elevation of Privilege
- **Threat**: Gaining admin access
- **Current State**: No RBAC implemented
- **Risk Level**: HIGH
- **Mitigation**: Implement RBAC, principle of least privilege

## 2. Current System Security Audit

### Vulnerabilities Found

#### Critical (Fix Immediately)
1. **No Authentication System**
   - Impact: Anyone can access admin functions
   - Fix: Implement Supabase Auth immediately

2. **SQL Injection Risk**
   - Location: Direct SQL queries in storage.ts
   - Fix: Use parameterized queries exclusively

3. **Missing HTTPS in Development**
   - Impact: Credentials transmitted in clear text
   - Fix: Enable HTTPS even in development

#### High (Fix in Phase 2)
1. **No Rate Limiting**
   - Impact: Vulnerable to brute force and DDoS
   - Fix: Implement rate limiting middleware

2. **Missing CSP Headers**
   - Impact: XSS vulnerabilities
   - Fix: Configure Content Security Policy

3. **Secrets in Code Repository**
   - Impact: API keys could be exposed
   - Fix: Use secret management service

#### Medium (Fix in Phase 3)
1. **No Input Validation**
   - Impact: Data integrity issues
   - Fix: Implement validation middleware

2. **Missing Security Headers**
   - Impact: Various client-side attacks
   - Fix: Add all security headers

3. **No Backup Encryption**
   - Impact: Data exposure if backups stolen
   - Fix: Encrypt all backups

### Security Posture Score: 3/10 (Critical Improvements Needed)

## 3. Security Requirements

### Authentication & Authorization
```typescript
// Requirements Implementation
interface SecurityRequirements {
  authentication: {
    mfa: 'required', // Multi-factor authentication
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90, // days
      historyCount: 5 // prevent reuse
    },
    sessionTimeout: 30, // minutes
    maxFailedAttempts: 5,
    lockoutDuration: 15 // minutes
  },

  authorization: {
    model: 'RBAC', // Role-Based Access Control
    roles: ['admin', 'editor', 'viewer'],
    defaultRole: 'viewer',
    apiKeyRotation: 30 // days
  },

  encryption: {
    atRest: 'AES-256',
    inTransit: 'TLS 1.3',
    keyManagement: 'HSM',
    certificatePinning: true
  },

  compliance: {
    gdpr: true,
    ccpa: true,
    pciDss: false, // No payment processing
    hipaa: false   // No health data
  }
}
```

### Data Protection Requirements
1. **Encryption**
   - All data encrypted at rest (AES-256)
   - All connections use TLS 1.3
   - Database field-level encryption for PII

2. **Access Control**
   - Principle of least privilege
   - Role-based access control (RBAC)
   - API key rotation every 30 days

3. **Audit & Monitoring**
   - All access logged
   - Real-time alerting for suspicious activity
   - Monthly security reports

4. **Data Retention**
   - User data: Until deletion requested
   - Logs: 90 days
   - Backups: 30 days
   - Audit trails: 1 year

## 4. Security Implementation Plan

### Phase 1: Critical Security (Week 1)
```bash
# 1. Enable HTTPS everywhere
npm install helmet express-rate-limit

# 2. Add security middleware
npm install cors csurf express-validator

# 3. Implement basic auth
npm install @supabase/auth-helpers-nextjs
```

```typescript
// server/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

export const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "https://res.cloudinary.com"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
    message: 'Too many requests from this IP'
  }),

  // CORS configuration
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  })
];
```

### Phase 2: Authentication System (Week 2)
```typescript
// server/auth/supabase-auth.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export class AuthService {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.APP_URL}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Log failed attempt
      await this.logFailedAttempt(email);
      throw error;
    }

    return data;
  }

  async enableMFA(userId: string) {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    });

    if (error) throw error;
    return data;
  }

  private async logFailedAttempt(email: string) {
    // Implement failed attempt logging
    await db.insert(auditLog).values({
      action: 'failed_login',
      email,
      timestamp: new Date(),
      ip: req.ip
    });
  }
}
```

### Phase 3: Data Protection (Week 3)
```typescript
// server/encryption/data-protection.ts
import crypto from 'crypto';

export class DataProtection {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

## 5. Penetration Testing Plan

### Scope
- **In Scope**:
  - Web application (kgay-guides.com)
  - API endpoints (/api/*)
  - Database access controls
  - Authentication system
  - File upload functionality

- **Out of Scope**:
  - Third-party services (Cloudinary, Supabase)
  - Physical security
  - Social engineering
  - DDoS attacks (notify before testing)

### Testing Methodology

#### Phase 1: Reconnaissance (Day 1)
```bash
# Information gathering
nmap -sV -sC -oN nmap_scan.txt target.com
dirb https://target.com /usr/share/wordlists/dirb/common.txt
nikto -h https://target.com

# Technology identification
whatweb target.com
wappalyzer target.com
```

#### Phase 2: Vulnerability Scanning (Day 2)
```bash
# Automated scanning
sqlmap -u "https://target.com/api/trips?id=1" --batch
xsser -u "https://target.com/search?q=TEST"
zap-cli quick-scan --self-contained https://target.com

# Manual testing checklist
- [ ] SQL Injection
- [ ] XSS (Reflected, Stored, DOM)
- [ ] CSRF
- [ ] Authentication bypass
- [ ] Session management
- [ ] File upload vulnerabilities
- [ ] API rate limiting
- [ ] Information disclosure
```

#### Phase 3: Exploitation (Day 3-4)
- Attempt to exploit found vulnerabilities
- Document proof of concept
- Assess impact and risk level

#### Phase 4: Reporting (Day 5)
- Executive summary
- Technical findings
- Risk ratings
- Remediation recommendations
- Retest requirements

### Testing Tools
```yaml
tools:
  scanning:
    - OWASP ZAP
    - Burp Suite
    - Nmap
    - Nikto

  exploitation:
    - Metasploit
    - SQLMap
    - XSSer
    - Hydra

  analysis:
    - Wireshark
    - tcpdump
    - John the Ripper

  reporting:
    - Dradis
    - DefectDojo
```

## 6. Incident Response Plan

### Incident Classification
| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| Critical | Service down, data breach | 15 minutes | Database compromise, ransomware |
| High | Service degraded, attempted breach | 1 hour | DDoS attack, auth bypass attempt |
| Medium | Security violation, no impact | 4 hours | Failed intrusion, policy violation |
| Low | Security event, informational | 24 hours | Port scan, single failed login |

### Response Team
```yaml
incident_response_team:
  incident_commander:
    primary: Bryan (Project Owner)
    backup: TBD
    responsibilities:
      - Overall incident coordination
      - External communication
      - Decision making

  technical_lead:
    primary: DevOps Engineer (TBD)
    backup: TBD
    responsibilities:
      - Technical investigation
      - System remediation
      - Evidence collection

  communications_lead:
    primary: TBD
    backup: TBD
    responsibilities:
      - User notifications
      - Status updates
      - Media relations
```

### Response Procedures

#### 1. Detection & Analysis
```bash
#!/bin/bash
# scripts/incident-detection.sh

# Check for indicators of compromise
check_ioc() {
  # Unusual network activity
  netstat -an | grep -E "ESTABLISHED|LISTEN" | grep -v "127.0.0.1"

  # Modified files
  find / -type f -mtime -1 -ls 2>/dev/null

  # Unusual processes
  ps aux | grep -v "grep" | grep -E "nc|netcat|perl|python"

  # Check logs for errors
  tail -n 1000 /var/log/syslog | grep -E "error|failed|denied"
}

# Alert on suspicious activity
if check_ioc | grep -q "suspicious"; then
  ./scripts/send-alert.sh "SECURITY: Potential incident detected"
fi
```

#### 2. Containment
```typescript
// server/incident/containment.ts
export class IncidentContainment {
  async isolateSystem() {
    // 1. Block suspicious IPs
    await this.blockIPs(suspiciousIPs);

    // 2. Disable compromised accounts
    await this.disableAccounts(compromisedUsers);

    // 3. Enable read-only mode
    await this.enableReadOnlyMode();

    // 4. Snapshot system state
    await this.createForensicSnapshot();
  }

  async blockIPs(ips: string[]) {
    for (const ip of ips) {
      await exec(`iptables -A INPUT -s ${ip} -j DROP`);
    }
  }

  async disableAccounts(userIds: string[]) {
    for (const userId of userIds) {
      await db.update(users)
        .set({ status: 'suspended', suspendedAt: new Date() })
        .where(eq(users.id, userId));
    }
  }

  async enableReadOnlyMode() {
    process.env.READ_ONLY_MODE = 'true';
    await this.notifyUsers('System in maintenance mode');
  }

  async createForensicSnapshot() {
    const timestamp = new Date().toISOString();
    await exec(`tar -czf /backup/incident_${timestamp}.tar.gz /var/log /app`);
  }
}
```

#### 3. Eradication
- Remove malware/backdoors
- Patch vulnerabilities
- Update security controls
- Reset compromised credentials

#### 4. Recovery
```bash
#!/bin/bash
# scripts/incident-recovery.sh

# 1. Restore from clean backup
./scripts/restore-from-backup.sh $LAST_CLEAN_BACKUP

# 2. Apply all security patches
apt-get update && apt-get upgrade -y

# 3. Reset all passwords
./scripts/force-password-reset.sh --all-users

# 4. Verify system integrity
./scripts/verify-integrity.sh

# 5. Gradual service restoration
./scripts/restore-services.sh --gradual

# 6. Monitor for reinfection
./scripts/enhanced-monitoring.sh --duration 72h
```

#### 5. Post-Incident Activities
```markdown
## Post-Incident Report Template

### Incident Summary
- **Incident ID**: INC-2025-001
- **Date/Time**: [Start] to [End]
- **Severity**: [Critical/High/Medium/Low]
- **Impact**: [Users affected, data compromised]

### Timeline
- Detection: [Time and how detected]
- Containment: [Actions taken]
- Eradication: [How threat was removed]
- Recovery: [Restoration steps]
- Closure: [Verification complete]

### Root Cause Analysis
- Primary cause: [Technical vulnerability]
- Contributing factors: [Process gaps]
- Attack vector: [How breach occurred]

### Lessons Learned
- What went well:
- What could be improved:
- Action items:

### Preventive Measures
- Technical controls added:
- Process improvements:
- Training needs:
```

## 7. Security Monitoring & Alerting

### Monitoring Setup
```yaml
# monitoring-config.yaml
monitoring:
  providers:
    - name: Datadog
      api_key: ${DATADOG_API_KEY}
      features:
        - apm
        - logs
        - security_monitoring

  alerts:
    - name: failed_login_spike
      condition: count > 10 in 5 minutes
      severity: high
      notification: [email, slack]

    - name: api_error_rate
      condition: error_rate > 5%
      severity: medium
      notification: [slack]

    - name: suspicious_query
      condition: contains("DROP", "DELETE", "UNION")
      severity: critical
      notification: [email, phone]

    - name: file_integrity
      condition: checksum_mismatch
      severity: critical
      notification: [email, slack, phone]
```

### Security Dashboard
```typescript
// server/monitoring/security-dashboard.ts
export class SecurityDashboard {
  getMetrics() {
    return {
      authentication: {
        failedLogins: this.getFailedLogins(24), // last 24 hours
        activeSession: this.getActiveSessions(),
        mfaAdoption: this.getMFAAdoptionRate()
      },

      threats: {
        blockedIPs: this.getBlockedIPs(),
        suspiciousActivity: this.getSuspiciousActivity(),
        vulnerabilities: this.getKnownVulnerabilities()
      },

      compliance: {
        patchLevel: this.getPatchComplianceRate(),
        auditCompleteness: this.getAuditCompleteness(),
        encryptionStatus: this.getEncryptionStatus()
      },

      incidents: {
        open: this.getOpenIncidents(),
        mttr: this.getMeanTimeToResolve(),
        trendin7Days: this.getIncidentTrend(7)
      }
    };
  }
}
```

## 8. Security Training & Awareness

### Developer Security Training
1. **OWASP Top 10** - Quarterly training
2. **Secure Coding Practices** - On onboarding
3. **Security Tools** - Hands-on workshops
4. **Incident Response** - Annual drills

### Security Checklist for Developers
```markdown
## Pre-Commit Security Checklist

### Code Review
- [ ] No hardcoded secrets or credentials
- [ ] Input validation implemented
- [ ] Output encoding for XSS prevention
- [ ] SQL queries are parameterized
- [ ] Authentication checks on all endpoints
- [ ] Authorization checks for data access
- [ ] Errors don't leak sensitive information
- [ ] Logging doesn't include PII/secrets

### Dependencies
- [ ] No known vulnerabilities (npm audit)
- [ ] Dependencies are from trusted sources
- [ ] Lock file is updated
- [ ] License compliance checked

### Testing
- [ ] Security tests written
- [ ] Edge cases covered
- [ ] Error conditions tested
- [ ] Rate limiting tested
```

## 9. Compliance & Regulatory

### GDPR Compliance
- [ ] Privacy policy updated
- [ ] Cookie consent implemented
- [ ] Data portability API
- [ ] Right to deletion implemented
- [ ] Data processing agreements signed
- [ ] Privacy by design principles followed

### CCPA Compliance
- [ ] Privacy rights notice
- [ ] Opt-out mechanism
- [ ] Data sale disclosure (N/A)
- [ ] Consumer request process

## 10. Security Roadmap

### Q4 2025 (Current)
- ✅ Security audit complete
- ✅ Threat modeling complete
- ⚠️ Basic authentication implementation
- ⚠️ Security headers configuration

### Q1 2026
- [ ] MFA implementation
- [ ] Penetration testing
- [ ] SOC 2 preparation
- [ ] Security training program

### Q2 2026
- [ ] Advanced threat detection
- [ ] Zero-trust architecture
- [ ] Bug bounty program
- [ ] ISO 27001 preparation

## Appendix A: Security Contacts

### Emergency Contacts
- **Security Lead**: [TBD]
- **AWS Security**: aws-security@amazon.com
- **Cloudinary Security**: security@cloudinary.com
- **Supabase Security**: security@supabase.com

### Security Resources
- OWASP: https://owasp.org
- SANS: https://www.sans.org
- CVE Database: https://cve.mitre.org
- Security Headers: https://securityheaders.com

---

**Document Classification**: CONFIDENTIAL
**Version**: 1.0
**Last Updated**: September 15, 2025
**Next Review**: October 15, 2025
**Owner**: Bryan

*This document contains sensitive security information and should not be shared publicly.*