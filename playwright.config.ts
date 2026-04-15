import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests serially for DB isolation
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // No retries locally for faster feedback
  workers: 1, // Single worker to avoid DB conflicts
  reporter: [
    ['list'], // Console output
    ['html', { open: 'never' }], // HTML report without auto-open
  ],
  
  timeout: 30000, // 30s per test
  expect: {
    timeout: 10000, // 10s for assertions
  },
  
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure', // Keep trace only on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Better defaults for stability
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Disable animations for faster tests
        launchOptions: {
          args: ['--disable-animations'],
        },
      },
    },
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI, // Fresh server in CI
    timeout: 120000,
    stdout: 'pipe', // Capture server logs
    stderr: 'pipe',
  },
});
