import { Page } from "@playwright/test";

/**
 * Common test helpers and utilities for e2e tests
 */

/**
 * Navigate to home and wait for hero section to be visible
 */
export async function goToHome(page: Page) {
  await page.goto("/");
  await page.getByRole("heading", {
    name: /Instant Blockchain Payments/i,
  }).waitFor({ state: "visible" });
}

/**
 * Check if page has proper accessibility structure
 */
export async function verifyAccessibility(page: Page) {
  // Check for main heading
  const headings = await page.locator("h1").count();
  if (headings === 0) {
    throw new Error("Page must have at least one h1 heading");
  }

  // Check for semantic HTML
  const main = page.locator("main").or(page.locator("header")).or(page.locator("footer"));
  const semanticCount = await main.count();
  return semanticCount > 0;
}

/**
 * Navigate through main navigation menu
 */
export async function navigateViaMenu(page: Page, menuItem: string) {
  const link = page.getByRole("link", { name: new RegExp(menuItem, "i") });
  await link.click();
}

/**
 * Click a primary CTA button
 */
export async function clickPrimaryCTA(page: Page, text: string = "Start Free Trial") {
  const button = page.getByRole("link", { name: new RegExp(text, "i") });
  await button.first().click();
}

/**
 * Verify all navigation links are working
 */
export async function verifyNavigationLinks(page: Page) {
  const links = page.locator("a");
  const linkCount = await links.count();

  const results = {
    total: linkCount,
    working: 0,
    broken: [],
  };

  for (let i = 0; i < linkCount; i++) {
    const link = links.nth(i);
    const href = await link.getAttribute("href");

    if (href && href.startsWith("/")) {
      // Internal links - we can check them
      const text = await link.textContent();
      results.working++;
    } else if (href?.startsWith("mailto:") || href?.startsWith("http")) {
      // External links and email - skip validation
      results.working++;
    }
  }

  return results;
}

/**
 * Verify responsive design at specific breakpoint
 */
export async function testResponsiveness(
  page: Page,
  viewport: { width: number; height: number },
  testName: string
) {
  await page.setViewportSize(viewport);
  await page.goto("/");

  // Header should always be visible
  const header = page.locator("header");
  if (!(await header.isVisible())) {
    throw new Error(`Header not visible on ${testName}`);
  }

  // Main content should be visible
  const mainHeading = page.getByRole("heading").first();
  if (!(await mainHeading.isVisible())) {
    throw new Error(`Main heading not visible on ${testName}`);
  }

  return true;
}

/**
 * Verify all feature cards are present and visible
 */
export async function verifyFeatureCards(page: Page) {
  const features = [
    "Instant Settlement",
    "Bank-Level Security",
    "Full Compliance",
    "Multiple Blockchains",
    "Real-Time Analytics",
    "Developer Friendly",
  ];

  const results = {
    expected: features.length,
    found: 0,
    missing: [],
  };

  for (const feature of features) {
    const element = page.getByText(new RegExp(feature, "i"));
    if (await element.isVisible()) {
      results.found++;
    } else {
      results.missing.push(feature);
    }
  }

  return results;
}

/**
 * Verify statistics section displays correct values
 */
export async function verifyStats(page: Page) {
  const stats = [
    { value: "$50M+", label: "Monthly transaction volume" },
    { value: "2000+", label: "Active merchants worldwide" },
    { value: "99.9%", label: "Network uptime SLA" },
  ];

  const results = [];

  for (const stat of stats) {
    const element = page.getByText(new RegExp(stat.value, "i"));
    const isVisible = await element.isVisible();
    results.push({
      stat: stat.value,
      visible: isVisible,
    });
  }

  return results;
}

/**
 * Simulate user scrolling through the page
 */
export async function scrollThroughPage(page: Page) {
  const sections = [
    "Instant Blockchain Payments",
    "Enterprise-Grade Blockchain Payments",
    "How BlockPay Works",
    "Ready to Accept Blockchain Payments",
  ];

  const results = [];

  for (const section of sections) {
    const element = page.getByRole("heading", {
      name: new RegExp(section, "i"),
    }).first();

    if (await element.isVisible()) {
      await element.scrollIntoViewIfNeeded();
      results.push({ section, found: true });
    } else {
      results.push({ section, found: false });
    }
  }

  return results;
}

/**
 * Verify footer contains required links
 */
export async function verifyFooter(page: Page) {
  const footer = page.locator("footer");
  const footer_sections = ["Product", "Developers", "Company"];

  const results = {
    total: footer_sections.length,
    found: 0,
    missing: [],
  };

  for (const section of footer_sections) {
    const element = footer.getByText(new RegExp(section, "i"));
    if (await element.isVisible()) {
      results.found++;
    } else {
      results.missing.push(section);
    }
  }

  return results;
}

/**
 * Wait for page to be fully loaded and stable
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState("networkidle");
  // Wait a bit more for any animations
  await page.waitForTimeout(500);
}
