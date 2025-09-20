# Row Level Security (RLS) Documentation

## Overview
This document provides comprehensive documentation of all Row Level Security (RLS) policies implemented in the K-GAY Travel Guides application. RLS ensures that users can only access and modify data they are authorized to interact with, providing a secure multi-tenant environment.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [User Roles](#user-roles)
3. [RLS Policies by Table](#rls-policies-by-table)
4. [Testing Guidelines](#testing-guidelines)
5. [Best Practices](#best-practices)

## Architecture Overview

### Security Layers
1. **Supabase Auth**: Handles authentication and JWT token generation
2. **PostgreSQL RLS**: Database-level security enforcement
3. **Application Layer**: Additional validation and business logic
4. **API Layer**: Route-based access control

### Key Principles
- **Principle of Least Privilege**: Users only have access to what they need
- **Fail Secure**: Default deny, explicitly allow
- **Audit Trail**: All sensitive operations are logged
- **Defense in Depth**: Multiple layers of security

## User Roles

### Role Hierarchy
```
super_admin
    ↓
  admin
    ↓
content_editor
    ↓
trip_admin
    ↓
   user
```

### Role Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| **super_admin** | Full system access | All operations on all tables |
| **admin** | Administrative access | User management, content management, settings |
| **content_editor** | Content management | Edit trips, events, talent profiles |
| **trip_admin** | Trip-specific admin | Manage assigned trips only |
| **user** | Regular user | View content, manage own profile |

## RLS Policies by Table

### 1. Profiles Table
**Purpose**: Stores user profile information

#### Policies:
```sql
-- View Policy: profiles_view_policy
-- Users can view their own profile
-- Admins can view all profiles
(auth.uid() = id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
))

-- Update Policy: profiles_update_policy
-- Users can update their own profile (excluding role and account_status)
-- Admins can update all fields for all users
(auth.uid() = id AND NOT (role IS DISTINCT FROM OLD.role OR account_status IS DISTINCT FROM OLD.account_status))
OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
))
```

### 2. User Preferences Table
**Purpose**: Stores user communication and notification preferences

#### Policies:
```sql
-- View Policy: user_preferences_view_policy
-- Users can view their own preferences
-- Admins can view all preferences
(auth.uid() = user_id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
))

-- Insert/Update Policy: user_preferences_manage_policy
-- Users can manage their own preferences
-- Admins can manage all preferences
(auth.uid() = user_id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
))
```

### 3. User Consent Records Table
**Purpose**: GDPR compliance - tracks user consent for data processing

#### Policies:
```sql
-- View Policy: user_consent_view_policy
-- Users can view their own consent records
-- Admins can view all consent records
(auth.uid() = user_id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin', 'compliance_officer')
))

-- Insert Policy: user_consent_insert_policy
-- Users can add their own consent records
-- System can add consent records (for signup flow)
(auth.uid() = user_id) OR
(auth.uid() IS NOT NULL AND consent_type IN ('privacy_policy', 'terms_of_service'))
```

### 4. User Activity Log Table
**Purpose**: Audit trail of user actions

#### Policies:
```sql
-- View Policy: user_activity_view_policy
-- Users can view their own activity
-- Admins can view all activity
(auth.uid() = user_id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin', 'security_admin')
))

-- Insert Policy: user_activity_insert_policy
-- System can insert activity records
-- No direct user inserts allowed
auth.uid() IS NOT NULL
```

### 5. User Sessions Table
**Purpose**: Tracks active user sessions for security

#### Policies:
```sql
-- View Policy: user_sessions_view_policy
-- Users can view their own sessions
-- Admins can view all sessions
(auth.uid() = user_id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
))

-- Delete Policy: user_sessions_delete_policy
-- Users can terminate their own sessions
-- Admins can terminate any session
(auth.uid() = user_id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
))
```

### 6. User Data Requests Table
**Purpose**: GDPR compliance - tracks data export/deletion requests

#### Policies:
```sql
-- View Policy: user_data_requests_view_policy
-- Users can view their own requests
-- Admins and compliance officers can view all requests
(auth.uid() = user_id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin', 'compliance_officer')
))

-- Insert Policy: user_data_requests_insert_policy
-- Users can create their own data requests
auth.uid() = user_id

-- Update Policy: user_data_requests_update_policy
-- Only admins can update request status
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin', 'compliance_officer')
)
```

### 7. User Communication Log Table
**Purpose**: Tracks all communications sent to users

#### Policies:
```sql
-- View Policy: user_communication_view_policy
-- Users can view their own communications
-- Admins can view all communications
(auth.uid() = user_id) OR
(EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin', 'marketing_admin')
))

-- Insert Policy: user_communication_insert_policy
-- Only system and admins can insert communication records
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin', 'marketing_admin')
)
```

## Helper Functions

### check_user_role()
```sql
CREATE OR REPLACE FUNCTION check_user_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### is_admin()
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing Guidelines

### 1. Test User Creation
Create test users for each role:
```sql
-- Create test users via Supabase Auth
-- Then update their roles in profiles table
UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';
UPDATE profiles SET role = 'user' WHERE email = 'user@test.com';
```

### 2. Policy Testing Checklist
For each policy, test:
- [ ] User can access their own data
- [ ] User cannot access other users' data
- [ ] Admin can access all data
- [ ] Anonymous users are blocked
- [ ] Role escalation is prevented
- [ ] Sensitive fields are protected

### 3. Security Testing
```sql
-- Test as regular user (should fail)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid';
SELECT * FROM profiles WHERE role = 'admin';

-- Test as admin (should succeed)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'admin-uuid';
SELECT * FROM profiles;
```

## Best Practices

### 1. Policy Design
- **Be Explicit**: Always specify exact conditions
- **Use SECURITY DEFINER**: For helper functions that need elevated privileges
- **Avoid SELECT ***: Specify exact columns in policies
- **Test Thoroughly**: Each policy should be tested with different user roles

### 2. Performance Considerations
- **Index Foreign Keys**: Ensure user_id columns are indexed
- **Optimize Subqueries**: Use EXISTS instead of IN for better performance
- **Cache Role Checks**: Store role in JWT claims when possible

### 3. Maintenance
- **Document Changes**: Update this documentation when policies change
- **Version Control**: Track all RLS policy changes in migration files
- **Regular Audits**: Review policies quarterly for security gaps
- **Monitor Access**: Use activity logs to detect unusual patterns

### 4. Common Pitfalls to Avoid
- **Role Confusion**: Always check role from profiles table, not just JWT
- **Missing Policies**: Ensure all tables have appropriate RLS policies
- **Overly Permissive**: Start restrictive, then selectively allow access
- **Forgetting Updates**: When adding new tables, always add RLS policies

## Migration Management

### Adding New Policies
```sql
-- Template for new table RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "new_table_view_policy" ON new_table
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_admin()
  );

CREATE POLICY "new_table_insert_policy" ON new_table
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "new_table_update_policy" ON new_table
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    is_admin()
  );

CREATE POLICY "new_table_delete_policy" ON new_table
  FOR DELETE
  USING (
    is_admin()
  );
```

### Removing Policies
```sql
-- Always document why a policy was removed
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

## Monitoring and Alerts

### Key Metrics to Monitor
1. **Failed Access Attempts**: Track denied RLS checks
2. **Role Changes**: Alert on any role escalations
3. **Policy Violations**: Log attempts to bypass RLS
4. **Unusual Access Patterns**: Detect potential security issues

### Audit Queries
```sql
-- Check recent admin actions
SELECT * FROM user_activity_log
WHERE metadata->>'role' IN ('admin', 'super_admin')
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check failed access attempts
SELECT * FROM user_activity_log
WHERE activity_type = 'access_denied'
AND created_at > NOW() - INTERVAL '1 hour';

-- Monitor role changes
SELECT * FROM user_activity_log
WHERE activity_type = 'role_changed'
ORDER BY created_at DESC
LIMIT 50;
```

## Emergency Procedures

### Suspected Breach
1. **Immediate Actions**:
   - Revoke suspected user's access
   - Review activity logs
   - Check for unauthorized role changes

2. **Investigation**:
   ```sql
   -- Check user's recent activity
   SELECT * FROM user_activity_log
   WHERE user_id = 'suspected-user-id'
   ORDER BY created_at DESC;

   -- Check for privilege escalation
   SELECT * FROM profiles
   WHERE updated_at > NOW() - INTERVAL '1 hour'
   AND role IN ('admin', 'super_admin');
   ```

3. **Recovery**:
   - Reset affected user passwords
   - Review and strengthen policies
   - Document incident

## Contact and Support

For questions or security concerns regarding RLS policies:
- **Security Team**: security@kgaytravel.com
- **Database Admin**: dba@kgaytravel.com
- **Compliance Officer**: compliance@kgaytravel.com

---

*Last Updated: January 2025*
*Version: 1.0.0*