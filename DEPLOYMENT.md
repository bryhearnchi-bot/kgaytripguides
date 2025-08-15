# Deployment Guide

This project is optimized for deployment on various platforms. The build process creates a static frontend and a Node.js backend.

## Build Process

The project uses a hybrid build system:
- Frontend: Vite builds the React application to `dist/public/`
- Backend: esbuild compiles the Express server to `dist/index.js`

### Latest Build Stats
- JavaScript Bundle: ~477KB (minified)
- CSS Bundle: ~77KB (minified)
- Total Assets: Optimized with long-term caching
- Build Time: ~10 seconds

## Deployment Options

### Netlify (Current Configuration)
- Build command: `npm run build`
- Publish directory: `dist/public`
- SPA redirects configured for client-side routing

### Manual Export
1. Run `npm run build` to create production files
2. Serve `dist/public/` as static files
3. Deploy `dist/index.js` as Node.js server (if backend needed)

### File Structure After Build
```
dist/
├── index.js          # Express server bundle
└── public/           # Static frontend files
    ├── index.html    # Main HTML file
    ├── assets/       # CSS, JS, and other assets
    └── _redirects    # Netlify redirects (auto-generated)
```

## Environment Variables
No environment variables required for basic deployment.

## Performance Optimizations
- Static assets are cached for 1 year
- CSS and JS files are minified and bundled
- React components are code-split for optimal loading

## Browser Support
- Modern browsers (ES2015+)
- Mobile responsive design
- PWA-ready structure