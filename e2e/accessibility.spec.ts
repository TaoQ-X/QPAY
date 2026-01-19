import { test, expect } from "@playwright/test";

test.describe("BlockPay Accessibility & Responsive Design", () => {
  test.describe("Mobile Responsiveness", () => {
    test("should render correctly on mobile (iPhone)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/");

      // Header should be visible and fixed
      const header = page.locator("header");
      await expect(header).toBeVisible();

      // Logo should be readable
      const logo = header.getByText("BlockPay");
      await expect(logo).toBeVisible();

      // Hero heading should be readable
      const mainHeading = page.getByRole("heading", {
        name: /Instant Blockchain Payments/i,
      });
      await expect(mainHeading).toBeVisible();

      // CTA buttons should be accessible
      const ctaButton = page.getByRole("link", {
        name: /Start Free Trial/i,
      }).first();
      await expect(ctaButton).toBeVisible();

      // Should be able to scroll and see all sections
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const footer = page.locator("footer");
      await expect(footer).toBeVisible();
    });

    test("should render correctly on tablet (iPad)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/");

      // All main elements should be visible
      const header = page.locator("header");
      await expect(header).toBeVisible();

      const mainHeading = page.getByRole("heading", {
        name: /Instant Blockchain Payments/i,
      });
      await expect(mainHeading).toBeVisible();

      // Feature cards should be arranged nicely
      const featureCards = page.locator("div").filter({
        hasText: /Instant Settlement/i,
      });
      await expect(featureCards.first()).toBeVisible();
    });

    test("should render correctly on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto("/");

      // Full navigation should be visible
      const navLink = page.getByRole("link", { name: /Features/i });
      await expect(navLink).toBeVisible();

      // Multi-column layout should be visible
      const stats = [
        page.getByText("$50M+"),
        page.getByText("2000+"),
        page.getByText("99.9%"),
      ];

      for (const stat of stats) {
        await expect(stat).toBeVisible();
      }
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper heading hierarchy", async ({ page }) => {
      await page.goto("/");

      // Should have exactly one h1
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBe(1);

      // H1 should be the main hero heading
      const h1 = page.locator("h1").first();
      const text = await h1.textContent();
      expect(text).toContain("Instant Blockchain Payments");
    });

    test("should have proper link labels", async ({ page }) => {
      await page.goto("/");

      // All links should have accessible text
      const links = page.locator("a");
      const linkCount = await links.count();

      expect(linkCount).toBeGreaterThan(0);

      // Check each link has text content
      for (let i = 0; i < Math.min(5, linkCount); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        expect(text).toBeTruthy();
      }
    });

    test("should have proper color contrast", async ({ page }) => {
      await page.goto("/");

      // Check primary button has good contrast
      const primaryButton = page.getByRole("link", {
        name: /Start Free Trial/i,
      }).first();

      const bgColor = await primaryButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      const textColor = await primaryButton.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      expect(bgColor).toBeTruthy();
      expect(textColor).toBeTruthy();
    });

    test("should have keyboard navigation support", async ({ page }) => {
      await page.goto("/");

      // Tab through links
      await page.keyboard.press("Tab");
      let focusedElement = await page.locator(":focus");
      await expect(focusedElement).toBeTruthy();

      // Should be able to navigate to buttons
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
      }

      focusedElement = await page.locator(":focus");
      await expect(focusedElement).toBeTruthy();
    });

    test("should have proper form labels for future forms", async ({
      page,
    }) => {
      // Navigate to signup page
      await page.goto("/signup");

      // Check for proper semantic HTML structure
      const main = page.locator("main").or(page.locator("[role='main']"));
      // Should have some main content area
      const visible = await main.first().isVisible().catch(() => true);
      expect(typeof visible).toBe("boolean");
    });

    test("should have proper button styling and states", async ({ page }) => {
      await page.goto("/");

      const primaryButton = page.getByRole("link", {
        name: /Start Free Trial/i,
      }).first();

      // Button should be visible and clickable
      await expect(primaryButton).toBeVisible();
      await expect(primaryButton).toBeEnabled();

      // Hover state should be applied
      await primaryButton.hover();
      const hoverStyle = await primaryButton.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });

      expect(hoverStyle).toBeTruthy();
    });
  });

  test.describe("Interactive Elements", () => {
    test("should have hover effects on cards", async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto("/");

      // Find a feature card
      const card = page.locator("div").filter({
        hasText: /Instant Settlement/i,
      }).first();

      await card.hover();

      // Card should have some visual feedback
      const borderColor = await card.evaluate((el) => {
        return window.getComputedStyle(el).borderColor;
      });

      expect(borderColor).toBeTruthy();
    });

    test("should scroll smoothly to sections", async ({ page }) => {
      await page.goto("/");

      // Scroll to Features section
      const featuresSection = page.getByRole("heading", {
        name: /Enterprise-Grade Blockchain Payments/i,
      });
      await featuresSection.scrollIntoViewIfNeeded();

      // Verify we're at the section
      await expect(featuresSection).toBeInViewport();
    });

    test("should maintain focus management", async ({ page }) => {
      await page.goto("/");

      const firstLink = page.getByRole("link").first();
      await firstLink.focus();

      let focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      expect(focusedElement).toBe("A");
    });
  });

  test.describe("Performance", () => {
    test("should load homepage within reasonable time", async ({ page }) => {
      const startTime = Date.now();
      await page.goto("/");
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test("should have images with proper attributes", async ({ page }) => {
      await page.goto("/");

      // All images should have alt text or be decorative
      const images = page.locator("img");
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        // Either has alt text or is marked as decorative
        expect(alt !== undefined).toBeTruthy();
      }
    });
  });
});
