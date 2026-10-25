import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5175/' },
  /* Its own port, so it never reuses a dev server started without the form
     endpoint. The endpoint is set so a send really fetches; every test that
     sends answers it with page.route, and nothing leaves the machine. */
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://localhost:5175/',
    reuseExistingServer: true,
    env: {
      VITE_WEB3FORMS_ENDPOINT: 'https://api.web3forms.com/submit',
      VITE_WEB3FORMS_ACCESS_KEY: 'test-key',
    },
  },
  /* The three phone sizes, and the desktop guard. */
  projects: [
    { name: 'iphone-390', testDir: 'tests/mobile', use: { ...devices['iPhone 13'] } },
    { name: 'iphone-375', testDir: 'tests/mobile', use: { ...devices['iPhone 8'] } },
    { name: 'android-360', testDir: 'tests/mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 360, height: 600 } } },
    { name: 'desktop', testDir: 'tests/desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
