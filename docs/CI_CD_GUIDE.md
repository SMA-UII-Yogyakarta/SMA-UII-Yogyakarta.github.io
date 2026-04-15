# CI/CD Configuration - Complete Guide

## 🔄 Workflows

### 1. **Test Workflow** (`.github/workflows/test.yml`)

Runs on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs:**

#### Unit Tests
- Runtime: ~10 seconds
- Runs: `bun test`
- Tests: Format utilities, helpers, guards

#### E2E Tests
- Runtime: ~90 seconds
- Runs: `bun run test:e2e`
- Tests: Full user flows (auth, members, projects, etc.)
- Database: Fresh seed before tests
- Browser: Chromium only (for speed)

#### Type Check
- Runtime: ~15 seconds
- Runs: `bun run astro check`
- Validates: TypeScript types, Astro components

**Total Runtime:** ~2 minutes

### 2. **Deploy Workflow** (`.github/workflows/deploy.yml`)

Trigger: Manual only (`workflow_dispatch`)

**Steps:**
1. Install Bun
2. Install dependencies
3. Build static site
4. Deploy to GitHub Pages

**Runtime:** ~60 seconds

## 🔐 Required Secrets

Configure in GitHub Settings → Secrets and variables → Actions:

```bash
# Database (Turso)
TURSO_URL=libsql://[database-name]-[org].turso.io
TURSO_TOKEN=eyJhbGc...

# OAuth (GitHub)
OAUTH_GITHUB_CLIENT_ID=Ov23li...
OAUTH_GITHUB_CLIENT_SECRET=1234567890abcdef...

# Site Config (for deploy)
PUBLIC_SITE_URL=https://your-domain.com
```

## 📊 Test Database Strategy

### Development/Preview Database
- Name: `smauiilab-prev`
- Purpose: CI/CD testing
- Reset: Before each test run
- Data: Seeded with `seed-enhanced.ts`

### Production Database
- Name: `smauiilab-prod`
- Purpose: Live application
- Protected: Not used in CI/CD
- Backup: Regular snapshots

## ✅ Pre-merge Checklist

Before merging to `main`:

- [ ] All tests passing (43/44 minimum)
- [ ] Type check passing
- [ ] No console errors in E2E tests
- [ ] Database migrations tested
- [ ] Environment variables documented

## 🚀 Deployment Process

### Automatic (Recommended)
```bash
# 1. Merge to main
git checkout main
git merge develop
git push origin main

# 2. Tests run automatically
# 3. If tests pass, manually trigger deploy workflow
```

### Manual
```bash
# 1. Build locally
bun run build

# 2. Test build
bun run preview

# 3. Deploy via GitHub Actions
# Go to Actions → Deploy to GitHub Pages → Run workflow
```

## 🐛 Troubleshooting

### Tests Failing in CI but Pass Locally

**Cause:** Database state differences

**Fix:**
```bash
# Reset local database to match CI
bun run db:setup:enhanced
bun run test:e2e
```

### E2E Tests Timeout

**Cause:** Slow network or server startup

**Fix:** Increase timeout in `playwright.config.ts`:
```typescript
webServer: {
  timeout: 180000, // 3 minutes
}
```

### Type Check Fails

**Cause:** Missing type definitions

**Fix:**
```bash
# Regenerate types
bun run astro sync
bun run astro check
```

## 📈 Performance Optimization

### Current Metrics
- Unit tests: 10s
- E2E tests: 90s
- Type check: 15s
- **Total: ~2 minutes**

### Optimization Ideas
1. **Parallel E2E tests** - Split by feature (requires DB isolation)
2. **Cache Playwright browsers** - Save ~20s
3. **Incremental type checking** - Only changed files
4. **Test sharding** - Split tests across multiple workers

## 🔄 Continuous Improvement

### Monitoring
- Track test duration trends
- Monitor flaky test rate
- Review failed test patterns

### Maintenance
- Update dependencies monthly
- Review and remove obsolete tests
- Optimize slow tests

## 📝 Adding New Tests

### Unit Test
```typescript
// tests/unit/my-feature.test.ts
import { test, expect } from 'bun:test';

test('should do something', () => {
  expect(true).toBe(true);
});
```

### E2E Test
```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/my-page');
  await expect(page.locator('h1')).toBeVisible();
});
```

## 🎯 Success Criteria

- ✅ All tests pass consistently
- ✅ Total CI time < 3 minutes
- ✅ Flaky test rate < 5%
- ✅ Type safety enforced
- ✅ Automated deployment ready

## 📞 Support

Issues with CI/CD? Check:
1. GitHub Actions logs
2. Playwright HTML report (artifact)
3. Test results (artifact)
4. This documentation

---

**Last Updated:** 2026-04-15  
**Status:** ✅ Production Ready
