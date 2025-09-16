# Supabase Authentication Setup Guide

## Phase 3.4: Authentication Configuration

This guide covers setting up email and social authentication with Supabase for the KGay Travel Guides application.

## Prerequisites

1. **Get your Supabase Anon Key**:
   - Go to: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/settings/api
   - Copy the `anon (public)` key
   - Add to `.env`: `VITE_SUPABASE_ANON_KEY=your_anon_key_here`

2. **Configure Auth Settings in Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/auth/url-configuration
   - Set Site URL: `http://localhost:3001` (for development)
   - Add Redirect URLs:
     - `http://localhost:3001/auth/callback`
     - `https://your-production-domain.com/auth/callback`

## Features to Implement

### 1. Email Authentication
- Sign up with email/password
- Email verification
- Password reset
- Magic link login (optional)

### 2. Social Login Providers
Configure these in Supabase Dashboard (Auth > Providers):

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://bxiiodeyqvqqcgzzqzvt.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app
3. Add Facebook Login product
4. Add redirect URI: `https://bxiiodeyqvqqcgzzqzvt.supabase.co/auth/v1/callback`
5. Copy App ID and Secret to Supabase

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Authorization callback URL: `https://bxiiodeyqvqqcgzzqzvt.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

#### Twitter OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create new app
3. Enable OAuth 2.0
4. Add callback URL: `https://bxiiodeyqvqqcgzzqzvt.supabase.co/auth/v1/callback`
5. Copy API Key and Secret to Supabase

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
```

### Step 2: Environment Variables
Add to `.env`:
```env
VITE_SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 3: Create Auth Components
- `/client/src/lib/supabase.ts` - Supabase client configuration
- `/client/src/components/auth/LoginForm.tsx` - Login component
- `/client/src/components/auth/SignUpForm.tsx` - Sign up component
- `/client/src/components/auth/ResetPassword.tsx` - Password reset
- `/client/src/components/auth/AuthCallback.tsx` - OAuth callback handler
- `/client/src/hooks/useSupabaseAuth.ts` - Auth hook

### Step 4: Protected Routes
Create middleware to protect admin routes:
- `/admin/*` routes require authentication
- Redirect to login if not authenticated
- Store intended destination for post-login redirect

### Step 5: User Roles & Permissions
Set up RLS (Row Level Security) policies:

```sql
-- Create user profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### Step 6: Session Management
- Auto-refresh tokens
- Persist session in localStorage
- Handle token expiry gracefully
- Logout across all tabs

## Security Considerations

### Email Configuration
1. **Email Templates**: Customize in Supabase Dashboard > Auth > Email Templates
2. **SMTP Settings**: Configure custom SMTP for production
3. **Rate Limiting**: Enable to prevent abuse
4. **Email Verification**: Required for production

### Password Policies
Configure in Supabase Dashboard > Auth > Policies:
- Minimum length: 8 characters
- Require uppercase, lowercase, numbers
- Password history (prevent reuse)
- Account lockout after failed attempts

### Security Headers
Add to your server:
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

## Testing

### Manual Testing Checklist
- [ ] Sign up with email
- [ ] Verify email link works
- [ ] Login with email/password
- [ ] Reset password flow
- [ ] Login with Google
- [ ] Login with Facebook
- [ ] Login with GitHub
- [ ] Login with Twitter
- [ ] Logout works
- [ ] Session persists on refresh
- [ ] Protected routes redirect to login
- [ ] Post-login redirect works

### Automated Tests
```javascript
// Example test structure
describe('Authentication', () => {
  it('should sign up new user', async () => {
    // Test implementation
  });

  it('should login existing user', async () => {
    // Test implementation
  });

  it('should handle invalid credentials', async () => {
    // Test implementation
  });
});
```

## Monitoring

### Track Auth Events
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  // Track with analytics
  analytics.track('auth_event', {
    event,
    userId: session?.user?.id,
    timestamp: new Date().toISOString()
  });
});
```

### Error Tracking
- Log failed login attempts
- Monitor password reset requests
- Track OAuth failures
- Alert on suspicious activity

## Production Checklist

- [ ] Custom domain configured
- [ ] SSL certificates valid
- [ ] Email templates customized
- [ ] SMTP configured
- [ ] OAuth providers configured
- [ ] Rate limiting enabled
- [ ] Security policies configured
- [ ] RLS policies tested
- [ ] Monitoring configured
- [ ] Error tracking setup
- [ ] Documentation updated

## Next Steps

1. Get the Supabase anon key
2. Configure OAuth providers in Supabase Dashboard
3. Implement auth components
4. Test all auth flows
5. Deploy to production

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Auth UI Components](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth Provider Setup](https://supabase.com/docs/guides/auth/social-login)