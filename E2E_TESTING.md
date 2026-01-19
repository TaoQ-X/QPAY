# BlockPay E2E Testing Guide

This document provides comprehensive information about the end-to-end (e2e) testing setup for the BlockPay blockchain payment system.

## Overview

The BlockPay platform uses **Playwright** for end-to-end testing. Playwright is a modern browser automation framework that allows you to test your application across multiple browsers (Chromium, Firefox, WebKit) and devices (desktop, mobile).

## Test Structure

The e2e tests are organized into the following test suites:

### 1. **homepage.spec.ts** - Homepage Content Tests
Tests that verify all elements of the homepage are present and correctly displayed:
- Hero section with main heading and CTA buttons
- Feature cards showcasing key capabilities
- Statistics section ($50M+, 2000+, 99.9%)
- "How BlockPay Works" section with 4-step process
- CTA section inviting users to sign up
- Footer with company information and links

### 2. **navigation.spec.ts** - Navigation & Routing Tests
Tests that verify the navigation system works correctly:
- Header displays correctly with logo and navigation links
- Navigation links route to correct pages (Features, Pricing, Docs)
- Sign In and Get Started buttons work properly
- Back-to-home navigation from all pages
- Footer links are functional
- Logo click returns to home

### 3. **user-flows.spec.ts** - User Journey Tests
Tests that simulate real user interactions:
- Sign up flow from hero CTA
- Sign up flow from header button
- Sign up flow from bottom CTA section
- Documentation access flow
- Complete page navigation tour
- Contact sales link functionality
- Responsive navigation across viewport sizes
- Visual styling and hierarchy verification

### 4. **accessibility.spec.ts** - Responsive Design & Accessibility Tests
Tests that ensure the app is accessible and responsive:

#### Mobile Responsiveness
- iPhone (375x812) layout
- iPad (768x1024) layout
- Desktop (1400x900) layout

#### Accessibility
- Proper heading hierarchy (single h1)
- Link labels are descriptive
- Color contrast verification
- Keyboard navigation support (Tab key)
- Button styling and states
- Form structure (for future forms)

#### Interactive Elements
- Hover effects on cards
- Smooth scrolling to sections
- Focus management

#### Performance
- Page load time < 5 seconds
- Image alt text present

## Running Tests

### Install Dependencies
First, install Playwright and its dependencies:
```bash
npm install -D @playwright/test
npx playwright install
```

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tests in UI Mode (Recommended for Development)
```bash
npm run test:e2e:ui
```
This opens an interactive dashboard where you can:
- Watch tests run in real-time
- Step through tests
- See test results and failures
- Time-travel through test execution

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```
This runs tests while showing the actual browser windows, useful for debugging.

### Debug a Specific Test
```bash
npx playwright test e2e/homepage.spec.ts --debug
```

### Run a Specific Test File
```bash
npx playwright test e2e/homepage.spec.ts
```

### Run Tests Matching a Pattern
```bash
npx playwright test --grep "navigation"
```

## Test Results

After running tests, Playwright generates:
- **HTML Report**: `playwright-report/index.html`
- **Screenshots**: On failure in `test-results/` directory
- **Videos**: If configured (can be enabled in `playwright.config.ts`)
- **Console logs**: For debugging

View the HTML report:
```bash
npx playwright show-report
```

## Configuration

The Playwright configuration is defined in `playwright.config.ts` and includes:

### Browsers Tested
- **Chromium**: Desktop version
- **Firefox**: Desktop version
- **WebKit**: Desktop version (Safari)
- **Mobile Chrome**: Mobile device simulation

### Test Settings
- **Base URL**: `http://localhost:5173`
- **Timeout**: 30 seconds per test
- **Retries**: 0 in development, 2 in CI
- **Workers**: Parallel test execution (configurable)
- **Screenshots**: On failure only
- **Traces**: On first retry for debugging

### Web Server
- Playwright automatically starts the dev server (`npm run dev`)
- Reuses existing server in development
- Fresh server in CI environment

## Test Helpers

Common test utilities are available in `e2e/helpers.ts`:

```typescript
// Navigate to home and wait for page to load
await goToHome(page);

// Verify page has proper accessibility structure
await verifyAccessibility(page);

// Navigate through main menu
await navigateViaMenu(page, "Features");

// Click primary CTA button
await clickPrimaryCTA(page, "Start Free Trial");

// Verify all navigation links are working
const results = await verifyNavigationLinks(page);

// Test responsive design at specific breakpoint
await testResponsiveness(page, { width: 375, height: 812 }, "iPhone");

// Verify feature cards are present
const results = await verifyFeatureCards(page);

// Verify statistics are displayed
const stats = await verifyStats(page);

// Scroll through page sections
const results = await scrollThroughPage(page);

// Verify footer
const footerResults = await verifyFooter(page);

// Wait for page to be fully loaded
await waitForPageReady(page);
```

## Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should do something specific", async ({ page }) => {
    // Arrange - set up test data and state
    const element = page.getByRole("link", { name: /Click Me/i });

    // Act - perform user actions
    await element.click();

    // Assert - verify results
    await expect(page).toHaveURL("/expected-page");
  });
});
```

### Common Selectors
```typescript
// By role (recommended)
page.getByRole("button", { name: /Sign In/i })
page.getByRole("link", { name: /Home/i })
page.getByRole("heading", { name: /Features/i })

// By text
page.getByText(/Sign Up Now/i)

// By label (for forms)
page.getByLabel("Email")

// By placeholder (for inputs)
page.getByPlaceholder("Enter your email")

// By test ID (if needed)
page.getByTestId("submit-button")
```

### Common Assertions
```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// URL
await expect(page).toHaveURL("/pricing");

// Text content
await expect(element).toContainText("Welcome");

// Enabled/Disabled
await expect(element).toBeEnabled();
await expect(element).toBeDisabled();

// Count
await expect(element).toHaveCount(3);

// Attribute values
await expect(element).toHaveAttribute("href", "/home");
```

## Continuous Integration

For CI environments (GitHub Actions, etc.), the tests will:
1. Run with `process.env.CI = true`
2. Use 1 worker (sequential execution)
3. Retry failed tests up to 2 times
4. Generate an HTML report
5. Save screenshots on failure

Example GitHub Actions workflow:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Use Semantic Queries
Prefer `getByRole`, `getByLabel`, and `getByText` over CSS selectors:
```typescript
// ✅ Good
page.getByRole("button", { name: /Submit/i })

// ❌ Avoid
page.locator(".btn.btn-primary")
```

### 2. Avoid Hard Waits
Instead of `page.waitForTimeout()`, use explicit waits:
```typescript
// ✅ Good
await page.getByText("Loading complete").waitFor({ state: "visible" });

// ❌ Avoid
await page.waitForTimeout(2000);
```

### 3. Test User Behavior
Test what users do, not implementation details:
```typescript
// ✅ Good - test user's perspective
await page.getByRole("link", { name: /Sign Up/i }).click();

// ❌ Avoid - testing implementation
await page.evaluate(() => navigation.push('/signup'));
```

### 4. Organize Tests Logically
Group related tests using `test.describe()`:
```typescript
test.describe("User Authentication", () => {
  test("should sign up successfully", async () => { });
  test("should sign in successfully", async () => { });
  test("should sign out successfully", async () => { });
});
```

### 5. Keep Tests Independent
Each test should be able to run in any order:
```typescript
// Use beforeEach to set up state before each test
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
```

## Debugging Failed Tests

### 1. Run in UI Mode
```bash
npm run test:e2e:ui
```

### 2. Run Single Test with Debug
```bash
npx playwright test e2e/homepage.spec.ts --debug
```

### 3. View Test Report
```bash
npx playwright show-report
```

### 4. Check Screenshots
Failed tests save screenshots in `test-results/` directory.

### 5. Use page.pause()
Add pauses to inspect state:
```typescript
test("should do something", async ({ page }) => {
  await page.goto("/");
  await page.pause(); // Browser will pause here
  // Open DevTools to inspect
});
```

## Common Issues

### Tests Timeout
- Check if the dev server is running
- Verify `baseURL` in `playwright.config.ts`
- Increase timeout in test if needed

### Tests Fail in CI but Pass Locally
- CI environment might be different (Docker, headless)
- Check for timing issues (use explicit waits, not `waitForTimeout`)
- Verify environment variables are set

### Flaky Tests
- Don't use `waitForTimeout` without reason
- Wait for specific elements instead
- Avoid hard-coded waits
- Use `retries` config for known flaky tests

## Next Steps

1. Run the existing test suite: `npm run test:e2e`
2. Add more tests for new features
3. Integrate with CI/CD pipeline
4. Monitor test results in CI
5. Maintain and update tests as features change

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions Reference](https://playwright.dev/docs/test-assertions)
