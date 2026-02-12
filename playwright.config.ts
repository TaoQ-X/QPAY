import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices.chromiumDesktop },
    },
    {
      name: "firefox",
      use: { ...devices.firefoxDesktop },
    },
    {
      name: "webkit",
      use: { ...devices.webkitDesktop },
    },
    {
      name: "mobile-chrome",
      use: { ...devices.chromiumMobileDevice },
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe",
  },
});
