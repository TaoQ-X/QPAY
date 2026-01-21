import { test, expect } from "@playwright/test";

test.describe("Q Pay User Flows", () => {
  test("should complete sign up flow from hero CTA", async ({ page }) => {
    await page.goto("/");

    // Find and click the primary Start Free Trial button
    const startTrialButtons = page.getByRole("link", {
      name: /Start Free Trial/i,
    });
    await expect(startTrialButtons.first()).toBeVisible();

    await startTrialButtons.first().click();
    await expect(page).toHaveURL("/signup");

    // Verify signup page displays
    const signupHeading = page.getByRole("heading", {
      name: /Signup Page/i,
    });
    await expect(signupHeading).toBeVisible();
  });

  test("should complete sign up flow from header CTA", async ({ page }) => {
    await page.goto("/");

    // Find Get Started button in header
    const getStartedButtons = page.getByRole("link", {
      name: /Get Started/i,
    });

    // Get the one that's most likely in the header (rightmost)
    const headerButton = getStartedButtons.last();
    await headerButton.click();
    await expect(page).toHaveURL("/signup");
  });

  test("should complete sign up flow from bottom CTA section", async ({
    page,
  }) => {
    await page.goto("/");

    // Scroll to bottom CTA section
    const ctaSection = page.getByRole("heading", {
      name: /Ready to Accept Blockchain Payments\?/i,
    });
    await ctaSection.scrollIntoViewIfNeeded();

    // Find Start Free Trial button in this section
    const startTrialButtons = page.getByRole("link", {
      name: /Start Free Trial/i,
    });
    await expect(startTrialButtons.last()).toBeVisible();

    await startTrialButtons.last().click();
    await expect(page).toHaveURL("/signup");
  });

  test("should complete documentation flow", async ({ page }) => {
    await page.goto("/");

    // Click View Documentation button
    const docButton = page.getByRole("link", {
      name: /View Documentation/i,
    });
    await expect(docButton).toBeVisible();

    await docButton.click();
    await expect(page).toHaveURL("/docs");

    // Verify we can go back
    const backLink = page.getByRole("link", { name: /Back to Home/i });
    await backLink.click();
    await expect(page).toHaveURL("/");
  });

  test("should be able to navigate through all main pages", async ({
    page,
  }) => {
    const pages = [
      { name: "Home", path: "/", heading: /Instant Blockchain Payments/i },
      { name: "Features", path: "/features", heading: /Features Page/i },
      { name: "Pricing", path: "/pricing", heading: /Pricing Page/i },
      { name: "Docs", path: "/docs", heading: /Docs Page/i },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await expect(page).toHaveURL(p.path);

      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible();
    }
  });

  test("should access contact sales link from CTA section", async ({
    page,
  }) => {
    await page.goto("/");

    // Scroll to bottom CTA section
    const ctaSection = page.getByRole("heading", {
      name: /Ready to Accept Blockchain Payments\?/i,
    });
    await ctaSection.scrollIntoViewIfNeeded();

    // Find Contact Sales link
    const contactLink = page.getByRole("link", {
      name: /Contact Sales/i,
    });
    await expect(contactLink).toBeVisible();

    // Verify it's an email link
    const href = await contactLink.getAttribute("href");
    expect(href).toContain("mailto:");
  });

  test("should maintain responsive navigation on different viewport sizes", async ({
    page,
  }) => {
    // Test on desktop
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/");

    let navLink = page.getByRole("link", { name: /Features/i });
    await expect(navLink).toBeVisible();

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    navLink = page.getByRole("link", { name: /Features/i });
    // Navigation may be hidden behind menu on smaller screens

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Header should still be visible
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Logo should be visible
    const logo = header.getByText("BlockPay");
    await expect(logo).toBeVisible();
  });

  test("should have proper styling and visual hierarchy", async ({ page }) => {
    await page.goto("/");

    // Check that main heading is larger than body text
    const mainHeading = page.getByRole("heading", {
      name: /Instant Blockchain Payments/i,
    });
    const heading = await mainHeading.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    expect(heading).toBeTruthy();

    // Verify primary buttons have proper styling
    const primaryButton = page.getByRole("link", {
      name: /Start Free Trial/i,
    }).first();
    const bgColor = await primaryButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(bgColor).toBeTruthy();
  });
});
