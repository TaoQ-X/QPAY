import { test, expect } from "@playwright/test";

test.describe("BlockPay Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display header with logo and navigation", async ({ page }) => {
    // Check header
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Check logo
    const logo = header.getByText("BlockPay");
    await expect(logo).toBeVisible();
  });

  test("should navigate to Home from header", async ({ page }) => {
    const homeLink = page.getByRole("link", { name: /Home/i });
    await expect(homeLink).toBeVisible();

    // Click and verify we're still on home
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });

  test("should navigate to Features page", async ({ page }) => {
    const featuresLink = page.getByRole("link", { name: /Features/i });
    await expect(featuresLink).toBeVisible();

    await featuresLink.click();
    await expect(page).toHaveURL("/features");

    // Check placeholder content
    const heading = page.getByRole("heading", {
      name: /Features Page/i,
    });
    await expect(heading).toBeVisible();

    // Check back link works
    const backLink = page.getByRole("link", { name: /Back to Home/i });
    await backLink.click();
    await expect(page).toHaveURL("/");
  });

  test("should navigate to Pricing page", async ({ page }) => {
    const pricingLink = page.getByRole("link", { name: /Pricing/i });
    await expect(pricingLink).toBeVisible();

    await pricingLink.click();
    await expect(page).toHaveURL("/pricing");

    // Check placeholder content
    const heading = page.getByRole("heading", {
      name: /Pricing Page/i,
    });
    await expect(heading).toBeVisible();
  });

  test("should navigate to Docs page", async ({ page }) => {
    const docsLink = page.getByRole("link", { name: /Docs/i });
    await expect(docsLink).toBeVisible();

    await docsLink.click();
    await expect(page).toHaveURL("/docs");

    // Check placeholder content
    const heading = page.getByRole("heading", {
      name: /Docs Page/i,
    });
    await expect(heading).toBeVisible();
  });

  test("should display Sign In link", async ({ page }) => {
    const signInLink = page.getByRole("link", { name: /Sign In/i });
    await expect(signInLink).toBeVisible();

    await signInLink.click();
    await expect(page).toHaveURL("/login");
  });

  test("should display Get Started button", async ({ page }) => {
    const getStartedButton = page.getByRole("link", {
      name: /Get Started/i,
    });
    await expect(getStartedButton).toBeVisible();
    await expect(getStartedButton).toHaveCount(3); // Multiple CTAs on page
  });

  test("should have working footer links", async ({ page }) => {
    // Scroll to footer
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();

    // Check footer links exist
    const footerLinks = footer.locator("a");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should navigate back from any page to home", async ({ page }) => {
    // Go to a different page
    await page.goto("/pricing");
    await expect(page).toHaveURL("/pricing");

    // Use logo to go back to home
    const logo = page.getByText("BlockPay").first();
    await logo.click();
    await expect(page).toHaveURL("/");
  });
});
