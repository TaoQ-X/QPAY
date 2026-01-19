import { test, expect } from "@playwright/test";

test.describe("BlockPay Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display hero section with correct content", async ({ page }) => {
    // Check main heading
    const mainHeading = page.getByRole("heading", {
      name: /Instant Blockchain Payments for Modern Commerce/i,
    });
    await expect(mainHeading).toBeVisible();

    // Check subheading
    const subheading = page.getByText(
      /Accept crypto payments directly on your platform/i
    );
    await expect(subheading).toBeVisible();

    // Check badge
    const badge = page.getByText(/The Future of Blockchain Payments/i);
    await expect(badge).toBeVisible();
  });

  test("should display all feature cards", async ({ page }) => {
    const features = [
      "Instant Settlement",
      "Bank-Level Security",
      "Full Compliance",
      "Multiple Blockchains",
      "Real-Time Analytics",
      "Developer Friendly",
    ];

    for (const feature of features) {
      const card = page.getByText(feature);
      await expect(card).toBeVisible();
    }
  });

  test("should display statistics section", async ({ page }) => {
    // Check transaction volume
    const volume = page.getByText("$50M+");
    await expect(volume).toBeVisible();

    // Check merchant count
    const merchants = page.getByText("2000+");
    await expect(merchants).toBeVisible();

    // Check uptime SLA
    const uptime = page.getByText("99.9%");
    await expect(uptime).toBeVisible();
  });

  test("should display How BlockPay Works section", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: /How BlockPay Works/i,
    });
    await expect(heading).toBeVisible();

    const steps = ["Integrate", "Accept", "Settle", "Grow"];
    for (const step of steps) {
      const stepText = page.getByText(step);
      await expect(stepText).toBeVisible();
    }
  });

  test("should display CTA section", async ({ page }) => {
    const ctaHeading = page.getByRole("heading", {
      name: /Ready to Accept Blockchain Payments\?/i,
    });
    await expect(ctaHeading).toBeVisible();
  });

  test("should display footer with links", async ({ page }) => {
    // Check footer brand
    const footerBrand = page.locator("footer").getByText("BlockPay");
    await expect(footerBrand).toBeVisible();

    // Check footer sections
    const productSection = page.locator("footer").getByText("Product");
    await expect(productSection).toBeVisible();

    const developersSection = page.locator("footer").getByText("Developers");
    await expect(developersSection).toBeVisible();

    const companySection = page.locator("footer").getByText("Company");
    await expect(companySection).toBeVisible();
  });
});
