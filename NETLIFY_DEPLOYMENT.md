# Netlify Deployment Setup

This guide explains how to deploy your Atlantis Trip Guides application to Netlify with automatic database migration from development to production.

## Overview

The deployment process automatically copies all data from your **development database** to the **production database** during the Netlify build process. This ensures your production site always has the latest content while keeping your development environment unchanged.

## Environment Variables Required in Netlify

Set these environment variables in your Netlify dashboard under **Site settings > Environment variables**:

### Database Configuration
```
DATABASE_URL=postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-fancy-queen-ad2frbaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
DEV_DATABASE_URL=postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-bold-wave-adnvwxha-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Application Configuration
```
NODE_ENV=production
SESSION_SECRET=your_secure_production_session_secret_here
CONTEXT=production
```

### Cloudinary Configuration (for image hosting)
```
CLOUDINARY_CLOUD_NAME=dfqoebbyj
CLOUDINARY_API_KEY=162354273258333
CLOUDINARY_API_SECRET=tPBIYWH3n6BL3-AN3y6W3zU7JI0
CLOUDINARY_URL=cloudinary://162354273258333:tPBIYWH3n6BL3-AN3y6W3zU7JI0@dfqoebbyj
```

## Build Process

The deployment uses a custom build command that:

1. **Builds the application** (`npm run build`)
2. **Copies development data to production** (`node scripts/deploy-db-migration.js`)
3. **Pushes database schema** (`npm run db:push:conditional`)

### Build Commands (already configured in netlify.toml)
```toml
[build]
  command = "npm install && npm run build:netlify"
  publish = "dist/public"

[context.production]
  command = "npm install && npm run build:netlify"
```

## Database Migration Process

The migration script (`scripts/deploy-db-migration.js`) performs these steps:

1. **Tests connections** to both development and production databases
2. **Clears production data** (in dependency order to avoid foreign key issues)
3. **Copies all data** from development to production (table by table)
4. **Updates sequences** to ensure proper auto-increment behavior
5. **Verifies migration** by comparing record counts

### Tables Migrated (in order)
- users
- cruises (trips)
- talent
- itinerary
- events
- media
- settings
- cruise_talent

## Deployment Steps

1. **Push your code** to your connected Git repository
2. **Netlify automatically triggers** the build process
3. **Migration script runs** during build, copying dev data to production
4. **Site deploys** with production database containing latest development data

## Local Development

Your local development environment remains unchanged:
- Uses development database (`DEV_DATABASE_URL`)
- No impact on your local workflow
- Continue developing normally

## Benefits

✅ **Seamless content updates**: Latest content automatically deployed
✅ **Safe development**: Dev environment never affected by deployments
✅ **One-way sync**: Only dev → prod, never the reverse
✅ **Automated process**: No manual database operations required
✅ **Data integrity**: Foreign key relationships maintained
✅ **Rollback safety**: Production data can be restored if needed

## Troubleshooting

### Build fails with database errors
- Check that both `DATABASE_URL` and `DEV_DATABASE_URL` are correctly set
- Verify both databases are accessible from Netlify

### Migration script fails
- Check Netlify build logs for specific error messages
- Ensure both databases have the same schema (run `npm run db:push` locally first)

### Some data missing after deployment
- Check build logs for warnings about failed row insertions
- Some data type mismatches may cause individual records to be skipped

## Security Note

🔒 **Database URLs contain credentials** - ensure they're set as environment variables in Netlify, never committed to your repository.