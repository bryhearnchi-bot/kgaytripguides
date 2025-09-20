# User Invitation System E2E Tests

## Overview

This directory contains comprehensive end-to-end tests for the user invitation system using Playwright. The tests cover the complete invitation flow from admin invitation creation to user account setup.

## Test Coverage

### 🔐 Admin Sending Invitations
- ✅ Successfully send user, editor, and admin invitations
- ✅ Form validation (email format, required fields)
- ✅ Role-based permission checks
- ✅ Duplicate invitation prevention
- ✅ Rate limiting enforcement

### 📧 Invitation Management Panel
- ✅ Display invitation statistics (pending, accepted, expired)
- ✅ Search and filter invitations
- ✅ Resend expired invitations
- ✅ Delete invitations with confirmation
- ✅ Copy invitation links

### 🎯 Account Setup Flow
- ✅ Multi-step wizard (email verification, password, profile, terms)
- ✅ Password strength validation
- ✅ Profile information collection
- ✅ Terms and conditions acceptance
- ✅ Account creation and activation

### 🛡️ Security Validations
- ✅ Token validation and expiration
- ✅ Role-based access control
- ✅ CSRF protection testing
- ✅ Input sanitization
- ✅ Timing attack prevention

### 📱 Mobile Responsiveness
- ✅ Mobile-optimized invitation interface
- ✅ Touch-friendly account setup flow
- ✅ Responsive form layouts

### 🔄 Error Handling
- ✅ Network error scenarios
- ✅ Server error handling
- ✅ Invalid token responses
- ✅ Graceful degradation

## Running the Tests

### Prerequisites

1. **Server Running**: Ensure the development server is running on `http://localhost:3001`
   ```bash
   npm run dev
   ```

2. **Admin User**: The tests require an admin user with credentials:
   - Email: `admin@atlantis.com`
   - Password: `Admin123!`

3. **Clean Database**: Tests work best with a clean invitation state

### Running Invitation Tests

```bash
# Run all invitation tests
npm run test:e2e:invitations

# Run with UI mode (recommended for development)
npm run test:e2e:invitations:ui

# Run in debug mode
npm run test:e2e:invitations:debug

# Run in headed mode (see browser)
npm run test:e2e:invitations:headed

# Run specific test file
npx playwright test test/e2e/user-invitations.spec.ts

# Run specific test
npx playwright test test/e2e/user-invitations.spec.ts -g "should send invitation"
```

### Browser Testing

Tests run on multiple browsers by default:
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome Mobile, Safari Mobile
- **Branded**: Edge, Chrome

```bash
# Run on specific browser
npx playwright test --project=chromium --config=playwright-invitations.config.ts

# Run on mobile
npx playwright test --project="Mobile Chrome" --config=playwright-invitations.config.ts
```

## Test Structure

### Main Test File
- `user-invitations.spec.ts` - Comprehensive invitation system tests

### Helper Files
- `invitation-helpers.ts` - Reusable test utilities and functions
- `global-setup.ts` - Pre-test environment preparation
- `global-teardown.ts` - Post-test cleanup

### Configuration
- `playwright-invitations.config.ts` - Specialized test configuration

## Test Data Management

### Automatic Cleanup
Tests automatically clean up:
- Test invitations (emails containing 'test' or 'example.com')
- Created user accounts
- Session data and cookies

### Test Data Generation
Helper functions generate:
- Random email addresses
- Test user profiles
- Strong/weak passwords for validation testing
- Multiple invitation scenarios

## Environment-Specific Testing

### Development
```bash
# Standard development testing
npm run test:e2e:invitations
```

### CI/CD
```bash
# Headless mode with retries
npx playwright test --config=playwright-invitations.config.ts --reporter=html
```

### Production-like Testing
```bash
# With production environment variables
NODE_ENV=production npm run test:e2e:invitations
```

## Debugging Tests

### Interactive Debugging
```bash
# Debug mode - pauses at breakpoints
npm run test:e2e:invitations:debug

# UI mode - visual test runner
npm run test:e2e:invitations:ui
```

### Test Artifacts
Test artifacts are saved to:
- `playwright-report-invitations/` - HTML test reports
- `test-results/` - Screenshots, videos, traces
- `test-results/invitation-results.json` - JSON test results

### Common Issues

1. **Server Not Running**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3001
   ```
   Solution: Run `npm run dev` first

2. **Admin Login Failed**
   ```
   Error: Admin authentication is not working
   ```
   Solution: Verify admin user exists with correct credentials

3. **Rate Limiting**
   ```
   Error: Too many invitations created
   ```
   Solution: Wait or restart server to reset rate limits

4. **Database State**
   ```
   Error: Invitation already exists
   ```
   Solution: Clean test data or use unique email addresses

## Test Patterns and Best Practices

### Test Organization
```typescript
test.describe('Feature Group', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
  });

  test('specific functionality', async ({ page }) => {
    // Test implementation
  });
});
```

### Helper Usage
```typescript
import { AuthHelpers, InvitationHelpers } from './invitation-helpers';

// Login as admin
await AuthHelpers.loginAsAdmin(page);

// Create test invitation
await InvitationHelpers.createInvitation(page, {
  email: 'test@example.com',
  role: 'user'
});
```

### Assertion Patterns
```typescript
// Wait for elements
await expect(page.locator('text=Success')).toBeVisible();

// Check multiple conditions
await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
await expect(page.locator('select[name="role"]')).toHaveValue('user');

// Verify URL changes
await expect(page).toHaveURL('/admin/dashboard');
```

## Performance Considerations

### Parallel Execution
- Tests run in parallel by default
- Each test gets isolated browser context
- Database state is managed per test

### Test Speed
- Average test duration: 30-60 seconds
- Full suite: 5-15 minutes (depending on browser count)
- Mobile tests may take longer due to slower interactions

### Resource Usage
- Memory: ~500MB per browser instance
- CPU: Moderate during test execution
- Network: Local requests only

## Security Testing

### Authentication
- Tests verify proper login/logout flows
- Session management validation
- Permission boundary testing

### Input Validation
- Email format validation
- Password strength requirements
- XSS prevention testing
- CSRF token validation

### Token Security
- Invitation token generation
- Token expiration handling
- Timing attack prevention
- Secure token comparison

## Future Enhancements

### Planned Test Additions
- [ ] Email integration testing (when email service is implemented)
- [ ] Real token extraction from email content
- [ ] API rate limiting stress tests
- [ ] Performance benchmarking
- [ ] Visual regression testing

### Test Infrastructure
- [ ] Parallel test data isolation
- [ ] Custom test reporters
- [ ] Integration with CI/CD pipelines
- [ ] Cross-browser compatibility matrix

## Troubleshooting

### Debug Output
Enable verbose logging:
```bash
DEBUG=pw:* npm run test:e2e:invitations
```

### Test Isolation
Run single test in isolation:
```bash
npx playwright test --config=playwright-invitations.config.ts -g "specific test name" --workers=1
```

### Clean State
Reset everything:
```bash
# Clear browser data
rm -rf test-results/
rm -rf playwright-report-invitations/

# Restart server
npm run dev
```

## Support

For issues with invitation tests:
1. Check server is running (`npm run dev`)
2. Verify admin credentials work in browser
3. Review test artifacts in `test-results/`
4. Check console logs for error details
5. Run tests in headed mode to see browser behavior

## Contributing

When adding new invitation tests:
1. Follow existing test patterns
2. Use helper functions from `invitation-helpers.ts`
3. Add appropriate cleanup in teardown
4. Test on multiple browsers
5. Update this documentation