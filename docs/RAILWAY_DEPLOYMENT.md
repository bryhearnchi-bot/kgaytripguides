# Railway Deployment Guide

## 🚂 Quick Start

### 1. Verify Deployment Configuration

Run the verification script to ensure everything is configured correctly:

```bash
./scripts/verify-railway-deployment.sh
```

This will check:

- ✅ Build configuration files exist
- ✅ Build process completes successfully
- ✅ TypeScript compilation passes
- ✅ Static assets are generated correctly
- ✅ Required environment variables are documented

### 2. Add Environment Variables to Railway

**Critical:** The application will crash on startup if these are missing.

Go to Railway Dashboard → Your Project → Variables and add:

#### Required Variables

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres

# Supabase Configuration
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security (Generate with: openssl rand -base64 32)
SESSION_SECRET=<generated-secret-here>
JWT_SECRET=<generated-secret-here>

# Environment
NODE_ENV=production
```

#### How to Get These Values

**DATABASE_URL:**

- Go to Supabase Dashboard → Settings → Database → Connection String
- Use the "Connection Pooling" URL with port 6543
- Mode: Transaction

**SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY:**

- Go to Supabase Dashboard → Settings → API
- Copy the URL and service_role key (not anon key)

**SESSION_SECRET & JWT_SECRET:**
Generate secure random strings:

```bash
openssl rand -base64 32
```

### 3. Deploy to Railway

```bash
# Commit all changes
git add .
git commit -m "feat: prepare for Railway deployment"

# Push to main branch (triggers Railway deployment)
git push origin main
```

Railway will automatically:

1. Detect the repository
2. Install dependencies (`npm install`)
3. Run build command (`npm run build`)
4. Start the server (`NODE_ENV=production npx tsx server/index.ts`)

### 4. Monitor Deployment

Watch the Railway logs for:

✅ **Success indicators:**

```
✅ Server ready and listening on port 3001
✅ Serving static files from: /app/dist/public
✅ Database connection successful
✅ Health check: HEALTHY
```

❌ **Failure indicators:**

```
❌ FATAL: Missing required environment variables
❌ Failed to connect to database
❌ Error: ENOENT: no such file or directory
```

### 5. Verify Deployment

Once deployed, check these endpoints:

```bash
# Health check
curl https://your-app.railway.app/healthz

# API status
curl https://your-app.railway.app/api

# Frontend (should return HTML)
curl https://your-app.railway.app/
```

---

## 🐛 Troubleshooting

### Issue: Server crashes with "Missing required environment variables"

**Symptom:** 502 Bad Gateway errors, logs show "FATAL: Missing required environment variables"

**Solution:**

1. Go to Railway Dashboard → Variables
2. Add all required environment variables (see above)
3. Redeploy

### Issue: CSS/JS files return 502 errors

**Symptom:** Browser shows "Failed to load resource: 502" for index-_.css and index-_.js

**Possible causes:**

1. **Missing environment variables** - Server crashes before serving static files
2. **Build failed** - Check Railway logs for build errors
3. **Wrong build output** - Verify `dist/public/` contains assets

**Solution:**

```bash
# Test build locally
npm run build

# Check output
ls -la dist/public/
ls -la dist/public/assets/

# If successful, commit and push
git add .
git commit -m "fix: update build configuration"
git push origin main
```

### Issue: Database connection fails

**Symptom:** Logs show "Failed to connect to database" or "Connection timeout"

**Solutions:**

1. Verify `DATABASE_URL` is correct (port 6543, Transaction mode)
2. Check Supabase Dashboard → Database → Connection Pooling is enabled
3. Ensure Supabase project is not paused

### Issue: PWA files not loading

**Symptom:** Browser console shows "Error while trying to use icon from Manifest"

**Solution:**
The `scripts/copy-pwa-files.js` script runs automatically during build. If PWA files are missing:

```bash
# Check if files exist in client/public/
ls -la client/public/manifest.json
ls -la client/public/sw.js

# Manually run the copy script
node scripts/copy-pwa-files.js

# Verify files are in dist/public/
ls -la dist/public/manifest.json
ls -la dist/public/sw.js
```

### Issue: TypeScript errors during build

**Symptom:** Build fails with TypeScript compilation errors

**Solution:**

```bash
# Run type check locally
npm run check

# Fix any errors, then rebuild
npm run build
```

---

## 📋 Deployment Checklist

Before deploying to Railway:

- [ ] All environment variables added to Railway Dashboard
- [ ] Build completes successfully locally (`npm run build`)
- [ ] TypeScript check passes (`npm run check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Security check passes (`npm run security:check`)
- [ ] `dist/public/` directory contains all assets
- [ ] `dist/public/index.html` exists
- [ ] `dist/public/assets/` contains CSS and JS files
- [ ] Railway configuration files exist (`railway.json`, `nixpacks.toml`)
- [ ] No hardcoded credentials in source code

---

## 🔧 Railway Configuration Files

### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "NODE_ENV=production npx tsx server/index.ts",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### nixpacks.toml

```toml
[variables]
NIXPACKS_NODE_VERSION = "20"

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "NODE_ENV=production npx tsx server/index.ts"
```

---

## 🚀 Advanced Configuration

### Custom Domain

1. Go to Railway Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your custom domain
4. Add DNS records as shown

### Environment-Specific Variables

Railway supports multiple environments (production, staging):

```bash
# Production
NODE_ENV=production
LOG_LEVEL=info

# Staging
NODE_ENV=development
LOG_LEVEL=debug
```

### Health Check Configuration

Railway can use the `/healthz` endpoint for health checks:

- **Path:** `/healthz`
- **Expected Status:** 200
- **Interval:** 30 seconds
- **Timeout:** 5 seconds
- **Retries:** 3

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Response Time:** Should be < 500ms for most requests
2. **Error Rate:** Should be < 1%
3. **Memory Usage:** Should be < 512MB
4. **CPU Usage:** Should be < 80%

### Useful Endpoints

- `/healthz` - Overall health status
- `/metrics` - Prometheus-style metrics
- `/api/debug/pwa-paths` - Debug PWA file paths

### Logs

View logs in Railway Dashboard → Logs

Look for:

- Server startup messages
- Database connection status
- Health check results
- API request logs
- Error messages

---

## 🔐 Security Considerations

1. **Never commit secrets** - Use Railway environment variables
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Enable HTTPS** - Railway provides this automatically
4. **Set SESSION_SECRET** - Required for secure sessions
5. **Monitor logs** - Check for unauthorized access attempts

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Nixpacks Documentation](https://nixpacks.com/)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connection-pooling)

---

**Last Updated:** September 30, 2025
**Railway Configuration Version:** 1.0
**Node Version:** 20.x
