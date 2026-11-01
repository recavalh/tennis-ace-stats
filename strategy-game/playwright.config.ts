import { defineConfig, devices } from '@playwright/test';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';
export default defineConfig({
  testDir: 'tests/ui', timeout: 120_000, expect: {timeout: 15_000}, fullyParallel: false, workers: 1,
  outputDir: 'output/playwright/results', reporter: [['list'], ['html', {outputFolder: 'output/playwright/report', open: 'never'}]],
  use: {baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure'},
  projects: [
    {name: 'desktop-chromium', use: {browserName: 'chromium', viewport: {width: 1440, height: 1080}}},
    {name: 'ipad-webkit', use: {...devices['iPad (gen 7) landscape'], browserName: 'webkit'}},
    {name: 'mobile-webkit', use: {...devices['iPhone 13'], browserName: 'webkit'}}
  ],
  webServer: {command: 'npm start', url: `${baseURL}/api/health`, env: {PORT: new URL(baseURL).port || '3100'}, reuseExistingServer: true, timeout: 30_000}
});
