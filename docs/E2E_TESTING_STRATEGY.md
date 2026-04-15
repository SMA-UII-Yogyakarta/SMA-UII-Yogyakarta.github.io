# E2E Testing Strategy - Best Practices

## 🎯 Principles

### 1. **Test Isolation**
- Each test starts with clean database state
- No dependencies between tests
- Tests can run in any order

### 2. **Predictability**
- Use `waitForResponse()` instead of `waitForTimeout()`
- Wait for network idle before assertions
- Use data-testid attributes for stable selectors

### 3. **Maintainability**
- Page Object Model for reusable components
- Fixtures for common setup
- Clear test names describing behavior

## 📁 Structure

```
tests/
├── helpers/
│   ├── fixtures.ts       # Test fixtures with DB reset
│   ├── page-objects.ts   # Page Object Models
│   └── db-reset.ts       # Database utilities
└── e2e/
    ├── auth.spec.ts
    ├── members.spec.ts
    └── projects.spec.ts
```

## 🔧 Usage

### Basic Test
```typescript
import { test, expect } from '../helpers/fixtures';

test('should do something', async ({ authenticatedPage, membersPage }) => {
  await membersPage.goto();
  expect(await membersPage.hasMemberData()).toBeTruthy();
});
```

### With Database Reset
```typescript
test('should create member', async ({ page }) => {
  // Database is automatically reset before this test
  const loginPage = new LoginPage(page);
  await loginPage.loginAsMaintainer();
  
  // Test logic...
});
```

## 🚀 Running Tests

```bash
# Run all tests
bun run test:e2e

# Run specific file
bunx playwright test auth.spec.ts

# Run with UI
bun run test:e2e:ui

# Debug mode
bunx playwright test --debug

# Show report
bunx playwright show-report
```

## ⚡ Performance Tips

1. **Use `networkidle` sparingly** - Only when necessary
2. **Prefer API waits** - `waitForResponse()` is faster than DOM waits
3. **Minimize timeouts** - Use specific waits instead of arbitrary delays
4. **Run serially** - Avoid parallel execution with shared database

## 🐛 Debugging Flaky Tests

1. **Check timing** - Add `page.pause()` to inspect state
2. **Review traces** - `bunx playwright show-trace trace.zip`
3. **Check network** - Look for failed API calls
4. **Verify selectors** - Use Playwright Inspector

## 📊 Current Status

- **43/44 tests passing** (97.7%)
- **1 flaky test** - Projects grid visibility (timing issue)
- **Average runtime** - ~90 seconds

## 🎯 Next Steps

1. Fix flaky projects grid test
2. Add data-testid attributes for stable selectors
3. Implement visual regression testing
4. Add API contract tests
5. Setup CI/CD pipeline
