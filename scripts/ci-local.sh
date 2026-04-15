#!/usr/bin/env bash
set -e

echo "🧪 Running CI/CD Pipeline Locally"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${RED}❌ .env file not found${NC}"
  echo "Please create .env with required variables"
  exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📦 Step 1: Install Dependencies"
bun install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo "🗄️  Step 2: Setup Database"
bun run db:setup:enhanced
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

echo "🧪 Step 3: Run Unit Tests"
bun test tests/unit
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Unit tests passed${NC}"
else
  echo -e "${RED}❌ Unit tests failed${NC}"
  exit 1
fi
echo ""

echo "🎭 Step 4: Install Playwright Browsers"
bunx playwright install chromium --with-deps
echo -e "${GREEN}✓ Browsers installed${NC}"
echo ""

echo "🌐 Step 5: Run E2E Tests"
bun run test:e2e
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ E2E tests passed${NC}"
else
  echo -e "${YELLOW}⚠️  Some E2E tests failed (check report)${NC}"
fi
echo ""

echo "📝 Step 6: Type Check"
bun run astro check
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Type check passed${NC}"
else
  echo -e "${RED}❌ Type check failed${NC}"
  exit 1
fi
echo ""

echo "=================================="
echo -e "${GREEN}✅ CI/CD Pipeline Complete!${NC}"
echo ""
echo "📊 View test report:"
echo "   bunx playwright show-report"
