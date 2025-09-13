# Claude Code Setup Guide

## ✅ Migration Complete!

Your Mediterranean cruise guide application has been successfully migrated from Replit to Claude Code development.

## 🛠️ Setup Instructions

### 1. Environment Configuration

Update your `.env` file with your actual credentials:

```bash
# Required: Your Neon database connection string
DATABASE_URL=your_neon_database_url_here

# Environment
NODE_ENV=development

# Optional: Mock data for testing
USE_MOCK_DATA=false

# Image Storage: Sign up for Cloudinary and add these
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Session Secret
SESSION_SECRET=your_session_secret_here
```

### 2. Database Setup

```bash
# Push database schema to Neon
npm run db:push

# Seed with production data
npm run db:seed

# Or seed with test data
USE_MOCK_DATA=true npm run db:seed
```

### 3. Development Commands

```bash
# Start development server
npm run dev

# TypeScript check
npm run check

# Build for production
npm run build

# Test production build locally
npm start
```

## 🚀 Deployment

Your project is already configured for Netlify deployment:

1. **Push to GitHub**: Your changes will auto-deploy when pushed to main branch
2. **Environment Variables**: Add your DATABASE_URL to Netlify environment variables
3. **Build Command**: Already configured in `netlify.toml`

## 📁 Key Changes Made

- ❌ Removed Replit dependencies (`@replit/vite-plugin-*`)
- ✅ Cleaned up `vite.config.ts`
- ✅ Replaced Google Cloud Storage with Cloudinary
- ✅ Fixed TypeScript errors
- ✅ Created environment configuration
- ✅ Added Cloudinary integration (`server/cloudinary.ts`)

## 🔧 New Features Available

### Image Upload with Cloudinary
```typescript
import { talentImageStorage, eventImageStorage } from './server/cloudinary';
// Use in your multer routes for automatic cloud uploads
```

### Environment-based Data
- Production: Real Greek Isles cruise data
- Development: Option to use mock data with `USE_MOCK_DATA=true`

## 🎯 Next Steps

1. **Get Cloudinary Account**: Sign up at cloudinary.com for image storage
2. **Update Environment**: Add your actual DATABASE_URL and Cloudinary credentials
3. **Test Locally**: Run `npm run dev` to verify everything works
4. **Deploy**: Push to GitHub and watch Netlify auto-deploy

Your cruise guide application is ready for continued development in Claude Code! 🚢