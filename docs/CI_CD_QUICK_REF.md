# CI/CD Quick Reference

## 🚀 Commands

```bash
# Run full CI pipeline locally
bun run ci

# Individual test suites
bun test                    # Unit tests
bun run test:e2e           # E2E tests
bun run check              # Type check
bun run test:all           # All tests

# Debug & Development
bun run test:e2e:ui        # E2E with UI
bun test --watch           # Watch mode
bunx playwright show-report # View last report
```

## 📊 Current Status

| Metric | Value |
|--------|-------|
| Unit Tests | 3/3 (100%) ✅ |
| E2E Tests | 43/44 (97.7%) ✅ |
| Type Check | Passing ✅ |
| CI Time | ~2 minutes |
| Flaky Rate | 2.3% (1 test) |

## 🔐 Required Secrets

```
TURSO_URL
TURSO_TOKEN
OAUTH_GITHUB_CLIENT_ID
OAUTH_GITHUB_CLIENT_SECRET
PUBLIC_SITE_URL
```

## 📁 Key Files

```
.github/workflows/
├── test.yml       # CI tests
└── deploy.yml     # Deployment

tests/
├── unit/          # Unit tests
├── e2e/           # E2E tests
└── helpers/       # Test utilities

docs/
├── CI_CD_GUIDE.md
├── CI_CD_FINAL_REVIEW.md
├── E2E_TESTING_STRATEGY.md
└── TESTING_GUIDE.md
```

## ✅ Pre-Push

1. `bun run ci`
2. All tests pass
3. No TS errors
4. Docs updated

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail locally | `bun run db:setup:enhanced` |
| CI timeout | Check GitHub Actions logs |
| Flaky tests | Run `bun run test:e2e` 3x |
| Type errors | `bun run astro sync` |

## 📞 Help

- GitHub Actions logs
- Playwright report (artifact)
- `docs/CI_CD_GUIDE.md`
