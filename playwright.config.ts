import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:4173", trace: "on-first-retry" },
  webServer: { command: "npm run preview -- --host 127.0.0.1", port: 4173, reuseExistingServer: true },
  projects: [
    { name: "mobile-375", use: { ...devices["iPhone 13 mini"], browserName: "chromium", viewport: { width: 375, height: 812 } } },
    { name: "mobile-390", use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 390, height: 844 } } },
    { name: "mobile-430", use: { ...devices["Pixel 7"], browserName: "chromium", viewport: { width: 430, height: 932 } } },
    { name: "webkit-mobile", use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, browserName: "webkit" } },
    { name: "desktop", use: { viewport: { width: 1366, height: 768 } } },
  ],
});
