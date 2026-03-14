# CareVault Testing Guide

## 1. Introduction

This document provides comprehensive information about the testing strategy and implementation for the CareVault application. The testing approach covers unit tests, integration tests, end-to-end tests, and manual testing procedures to ensure application quality and reliability.

## 2. Testing Strategy

### 2.1 Testing Philosophy
CareVault follows a risk-based testing approach focusing on:
- Critical user workflows (patient management, medication tracking, emergency summaries)
- Security and data privacy requirements
- Cross-browser compatibility
- Performance and scalability

### 2.2 Testing Pyramid
```
Unit Tests (70%)     - Component logic, utility functions, service functions
Integration Tests (20%) - API integrations, database operations, authentication flows
E2E Tests (10%)      - Critical user journeys, end-to-end workflows
```

## 3. Test Types and Coverage

### 3.1 Unit Tests
Unit tests validate individual components and functions in isolation.

#### 3.1.1 Location
- Component unit tests: Within component directories or `__tests__/` folders
- Utility function tests: Adjacent to the functions being tested
- Service layer tests: In `tests/unit/` directory

#### 3.1.2 Technologies Used
- **Testing Framework**: Jest
- **React Testing Library**: For React component testing
- **React Hook Testing Library**: For custom hook testing

#### 3.1.3 Example Unit Test
```typescript
// Example unit test for a utility function
import { formatDate } from '@/lib/utils'

describe('formatDate', () => {
  it('should format date in MM/DD/YYYY format', () => {
    const date = new Date('2023-05-15')
    expect(formatDate(date)).toBe('05/15/2023')
  })

  it('should handle invalid dates', () => {
    const date = new Date('invalid')
    expect(formatDate(date)).toBe('Invalid Date')
  })
})
```

### 3.2 Integration Tests
Integration tests verify how different modules work together.

#### 3.2.1 API Integration Tests
Test the interaction between frontend components and Supabase APIs.

```typescript
// Example API integration test
import { careRecipientService } from '@/lib/supabase-service'

describe('CareRecipientService Integration', () => {
  it('should create a new care recipient', async () => {
    const newRecipient = {
      caregiver_id: 'test-user-id',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1980-01-01'
    }

    const id = await careRecipientService.createCareRecipient(newRecipient)
    expect(id).toBeDefined()
    
    const retrieved = await careRecipientService.getCareRecipient(id)
    expect(retrieved?.first_name).toBe('John')
  })
})
```

#### 3.2.2 Database Integration Tests
Verify database operations work correctly with RLS policies.

### 3.3 End-to-End Tests
End-to-end tests simulate real user workflows.

#### 3.3.1 Location
Tests are located in the `tests/` directory with Playwright configuration in `playwright.config.ts`.

#### 3.3.2 Technologies Used
- **Playwright**: For comprehensive E2E testing
- **Test files**: `tests/comprehensive-registration.spec.ts`, `tests/debug-registration.spec.ts`, `tests/registration-flow.spec.ts`

#### 3.3.3 Example E2E Test
```typescript
// Example from tests/comprehensive-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test('should allow new user registration and dashboard access', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/login');
    
    // Click register link
    await page.locator('text=Register').click();
    
    // Fill registration form
    await page.locator('[data-testid="email-input"]').fill('test@example.com');
    await page.locator('[data-testid="password-input"]').fill('SecurePassword123!');
    await page.locator('[data-testid="register-button"]').click();
    
    // Verify successful registration and redirection
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome to CareVault')).toBeVisible();
  });
});
```

### 3.4 Manual Testing
Manual testing covers areas difficult to automate:

- UI/UX validation
- Cross-browser compatibility
- Accessibility compliance
- Mobile responsiveness
- Security testing

## 4. Test Configuration

### 4.1 Jest Configuration
Located in `jest.config.js` (if exists) or configured through package.json:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### 4.2 Playwright Configuration
Configuration is in `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 5. Running Tests

### 5.1 Running All Tests
```bash
# Run all tests (unit, integration, and E2E)
npm run test:all

# Run unit and integration tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### 5.2 Running Specific Tests
```bash
# Run specific test file
npm run test tests/comprehensive-registration.spec.ts

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npx jest tests/unit/

# Run Playwright tests with specific project
npx playwright test --project=chromium
```

### 5.3 Test Coverage
The project uses Jest for coverage analysis:

```bash
# Generate coverage report
npm run test:coverage

# Coverage thresholds are typically defined in package.json or jest.config.js
```

## 6. Test Organization

### 6.1 Test File Structure
```
tests/
├── unit/                    # Unit tests
│   ├── components/          # Component unit tests
│   ├── services/            # Service layer tests
│   └── utils/               # Utility function tests
├── integration/             # Integration tests
│   ├── api/                 # API integration tests
│   └── auth/                # Authentication tests
├── e2e/                    # End-to-end tests
│   ├── comprehensive-registration.spec.ts
│   ├── debug-registration.spec.ts
│   └── registration-flow.spec.ts
├── __mocks__/              # Mock implementations
└── fixtures/               # Test data fixtures
```

### 6.2 Test Naming Convention
- Unit tests: `{component}.test.tsx` or `{function}.test.ts`
- Integration tests: `{feature}.integration.test.ts`
- E2E tests: `{workflow}.spec.ts`

## 7. Test Data Management

### 7.1 Mock Data
Mock data is managed in fixtures and test helper files:

```typescript
// tests/fixtures/users.ts
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'caregiver' as const
};

export const mockCareRecipient = {
  id: 'recipient-123',
  caregiver_id: 'user-123',
  first_name: 'Jane',
  last_name: 'Doe',
  date_of_birth: '1980-01-01'
};
```

### 7.2 Test Database
For integration tests that require database access:
- Use a separate test database instance
- Populate with seed data before test runs
- Clean up after test completion

## 8. Testing Scenarios

### 8.1 Critical User Journeys

#### 8.1.1 User Registration and Login
- New user registration flow
- Login with valid credentials
- Login with invalid credentials
- Password reset functionality
- Social authentication (if implemented)

#### 8.1.2 Care Recipient Management
- Adding a new care recipient
- Editing existing care recipient information
- Viewing care recipient details
- Deactivating/activating care recipients
- Access control verification (caregivers can only see their recipients)

#### 8.1.3 Medication Tracking
- Adding new medications
- Updating medication information
- Marking medications as inactive
- Filtering medications by status/type

#### 8.1.4 Appointment Management
- Creating new appointments
- Updating appointment details
- Marking appointments as completed
- Viewing upcoming appointments
- Canceling appointments

#### 8.1.5 Document Management
- Uploading documents
- Downloading documents
- Organizing documents by category
- Deleting documents
- File type and size validation

#### 8.1.6 Emergency Summary
- Generating emergency summaries
- Exporting emergency summaries to PDF
- Sharing emergency summaries
- Validating summary content completeness

### 8.2 Edge Cases
- Empty states (no patients, no medications, etc.)
- Large data sets (performance testing)
- Network failures and retries
- Concurrent data modifications
- Invalid input handling

### 8.3 Security Testing
- Authentication bypass attempts
- Authorization violations
- SQL injection prevention
- Cross-site scripting (XSS) protection
- Data exposure verification

## 9. Continuous Integration

### 9.1 CI Pipeline
The project includes automated testing in CI:

```yaml
# Example GitHub Actions workflow
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

### 9.2 Quality Gates
- Minimum test coverage threshold (e.g., 80%)
- All tests must pass before merging
- Performance benchmarks maintained

## 10. Performance Testing

### 10.1 Load Testing
- Simulate concurrent users accessing the application
- Test database performance under load
- Verify application responsiveness

### 10.2 Stress Testing
- Test application behavior under extreme conditions
- Verify graceful degradation
- Identify breaking points

## 11. Accessibility Testing

### 11.1 Automated Testing
- Use axe-core for accessibility testing
- Integrate accessibility checks into CI/CD
- Test keyboard navigation

### 11.2 Manual Testing
- Screen reader compatibility
- Color contrast verification
- Focus management

## 12. Cross-Browser Testing

### 12.1 Supported Browsers
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### 12.2 Responsive Testing
- Mobile devices (iOS, Android)
- Tablets (iPad, Android tablets)
- Desktop resolutions

## 13. Test Reporting

### 13.1 Coverage Reports
- Generated using Jest coverage tools
- Integrated with CI/CD pipeline
- Stored in `test-results/` directory

### 13.2 E2E Test Reports
- HTML reports generated by Playwright
- Screenshots captured on failures
- Video recordings of test runs

## 14. Test Maintenance

### 14.1 Keeping Tests Up-to-Date
- Refactor tests when components change
- Update test data as requirements evolve
- Review and update test scenarios regularly

### 14.2 Flaky Test Management
- Identify and fix flaky tests promptly
- Implement proper waits and assertions
- Use reliable selectors

## 15. Security Testing

### 15.1 Authentication Tests
- Verify session management
- Test authentication bypasses
- Validate JWT handling

### 15.2 Authorization Tests
- Verify RLS policy enforcement
- Test cross-user data access prevention
- Validate role-based permissions

### 15.3 Data Protection Tests
- Verify encryption in transit
- Test secure storage of sensitive data
- Validate proper data sanitization

## 16. Troubleshooting Tests

### 16.1 Common Issues

#### 16.1.1 Environment Setup
- Ensure proper environment variables are set for testing
- Verify test database is properly configured
- Check that mock services are running

#### 16.1.2 Timing Issues
- Use proper async/await patterns
- Implement explicit waits instead of sleep
- Handle race conditions appropriately

#### 16.1.3 Mock Dependencies
- Ensure all external dependencies are properly mocked
- Verify mock behavior matches real implementations
- Keep mocks synchronized with actual implementations

### 16.2 Debugging Strategies
```bash
# Run tests in debug mode
npm run test -- --debug

# Run specific test in isolation
npx jest path/to/specific/test

# Enable verbose logging
DEBUG=true npm run test
```

## 17. Best Practices

### 17.1 Test Writing Guidelines
- Write clear, descriptive test names
- Test one thing at a time
- Use Arrange-Act-Assert pattern
- Keep tests independent and deterministic
- Use meaningful assertions

### 17.2 Performance Considerations
- Minimize test execution time
- Use lightweight test doubles
- Run tests in parallel when possible
- Optimize test data setup

### 17.3 Maintainability
- Organize tests logically
- Use shared test utilities
- Document complex test scenarios
- Review and refactor tests regularly

## 18. Monitoring Test Results

### 18.1 Test Metrics
- Test execution time
- Pass/fail ratios
- Code coverage percentages
- Flaky test identification

### 18.2 Alerting
- Failed builds trigger notifications
- Coverage drops trigger alerts
- Performance regressions flagged