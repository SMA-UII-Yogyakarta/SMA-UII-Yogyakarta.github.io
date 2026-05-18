#!/usr/bin/env bash
# ==============================================================================
# Digital Lab School — Database Migration Helper
# ==============================================================================
# Jalankan dari root project (tempat deploy/ berada).
#
# Cara pakai:
#   bash deploy/scripts/migrate.sh          # dry-run: preview perubahan
#   bash deploy/scripts/migrate.sh --apply  # apply migration
#   bash deploy/scripts/migrate.sh --seed   # apply + seed data test
#   bash deploy/scripts/migrate.sh --reset  # drop + push + seed (dev)
# ==============================================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══ Digital Lab — Database Migration ═══${NC}"

MODE="${1:-dry-run}"

case "$MODE" in
  dry-run)
    echo -e "\n${YELLOW}🔍 Preview perubahan skema...${NC}"
    bun run --cwd packages/db drizzle-kit check
    echo -e "\n${YELLOW}Untuk apply: bash deploy/scripts/migrate.sh --apply${NC}"
    ;;

  --apply)
    echo -e "\n${YELLOW}📦 Generating migration...${NC}"
    bun run --cwd packages/db drizzle-kit generate
    echo -e "\n${YELLOW}🚀 Pushing ke database...${NC}"
    bun run --cwd packages/db drizzle-kit push
    echo -e "\n${GREEN}✅ Migration applied${NC}"
    ;;

  --seed)
    echo -e "\n${YELLOW}🚀 Pushing schema...${NC}"
    bun run --cwd packages/db drizzle-kit push
    echo -e "\n${YELLOW}🌱 Seeding data...${NC}"
    bun run --cwd packages/db scripts/seed-enhanced.ts
    echo -e "\n${GREEN}✅ Migration + seeding selesai${NC}"
    ;;

  --reset)
    echo -e "\n${YELLOW}🗑️  Dropping all tables...${NC}"
    bun run --cwd packages/db scripts/drop-tables.ts
    echo -e "\n${YELLOW}🚀 Pushing schema...${NC}"
    bun run --cwd packages/db drizzle-kit push
    echo -e "\n${YELLOW}🌱 Seeding data...${NC}"
    bun run --cwd packages/db scripts/seed-enhanced.ts
    echo -e "\n${GREEN}✅ Database reset + seeded${NC}"
    ;;

  *)
    echo -e "${RED}Mode tidak dikenal: $MODE${NC}"
    echo "Usage: bash deploy/scripts/migrate.sh [--apply|--seed|--reset]"
    exit 1
    ;;
esac
