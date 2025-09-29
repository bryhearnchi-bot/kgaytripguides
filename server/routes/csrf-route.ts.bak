import { Router } from 'express';

const router = Router();

// Simple CSRF token endpoint for development
// Returns the existing CSRF token from cookie if present
router.get('/api/csrf-token', (req, res) => {
  // Check if we already have a token in the cookie
  const existingToken = req.cookies?._csrf;

  if (existingToken) {
    // Return the existing token from the cookie
    res.json({
      csrfToken: existingToken,
      headerName: 'x-csrf-token'
    });
  } else {
    // Generate a new token and set it as a cookie
    const token = 'csrf-' + Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Set the cookie (must match the middleware expectations)
    res.cookie('_csrf', token, {
      httpOnly: false, // Must be accessible to JavaScript for double-submit pattern
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    res.json({
      csrfToken: token,
      headerName: 'x-csrf-token'
    });
  }
});

export default router;