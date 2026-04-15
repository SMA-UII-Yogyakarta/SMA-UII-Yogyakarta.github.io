# Testing Guide

## Setup

Testing menggunakan:
- **Bun Test** - Unit & API tests (built-in, no install needed)
- **Playwright** - E2E browser tests

## Prerequisites

1. Database harus di-seed dengan enhanced data:
```bash
bun run db:drop
bun run db:migrate
bun run db:seed:enhanced
```

2. Dev server harus running (Playwright akan auto-start):
```bash
bun run dev
```

## Running Tests

### Unit Tests (Bun)
```bash
# Run all unit tests
bun test

# Watch mode
bun test --watch

# Specific file
bun test tests/unit/format.test.ts
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
bun run test:e2e

# UI mode (interactive)
bun run test:e2e:ui

# Specific test
bunx playwright test tests/e2e/auth.spec.ts

# Debug mode
bunx playwright test --debug
```

### All Tests
```bash
bun run test:all
```

## Test Structure

```
tests/
├── unit/              # Unit tests (Bun)
│   ├── format.test.ts
│   ├── validation.test.ts
│   └── guards.test.ts
└── e2e/               # E2E tests (Playwright)
    ├── auth.spec.ts
    ├── member-management.spec.ts
    ├── projects.spec.ts
    └── activities.spec.ts
```

## Test Accounts

Seeded by `seed-enhanced.ts`:

```
Maintainer:
- NISN: 0000000001
- Password: test123

Active Member:
- NISN: 1234567890
- Password: test123

Pending Member:
- NISN: 1234567895
- (No password yet)
```

## Writing Tests

### Unit Test Example (Bun)
```typescript
import { describe, test, expect } from 'bun:test';

describe('My function', () => {
  test('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### E2E Test Example (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('should login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="nisn"]', '0000000001');
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/app/overview');
});
```

## CI/CD

Tests run automatically on:
- Pull requests
- Push to main

GitHub Actions workflow:
```yaml
- name: Run tests
  run: |
    bun run db:setup:enhanced
    bun test
    bunx playwright install --with-deps
    bun run test:e2e
```

## Debugging

### Playwright
```bash
# Debug mode (step through)
bunx playwright test --debug

# Show browser
bunx playwright test --headed

# Slow motion
bunx playwright test --slow-mo=1000
```

### Bun Test
```bash
# Verbose output
bun test --verbose

# Bail on first failure
bun test --bail
```

## Coverage

```bash
# Bun test coverage (coming soon)
bun test --coverage
```

## Tips

1. **Reset database** before E2E tests:
   ```bash
   bun run db:drop && bun run db:setup:enhanced
   ```

2. **Use test isolation** - Each test should be independent

3. **Use page objects** for complex E2E tests

4. **Mock external APIs** (SLIMS, etc.)

5. **Test error cases** not just happy paths

## Common Issues

### "Database locked"
- Close all connections
- Run `bun run db:drop` first

### "Element not found"
- Add `await page.waitForSelector()`
- Check if element is visible

### "Test timeout"
- Increase timeout in playwright.config.ts
- Check if dev server is running

## Next Steps

1. Add more unit tests for utilities
2. Add API tests for endpoints
3. Add E2E tests for all flows
4. Setup coverage reporting
5. Add performance tests
