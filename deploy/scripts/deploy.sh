#!/usr/bin/env bash
# ==============================================================================
# Digital Lab School — Deployment Script
# ==============================================================================
# Self-hosted deployment via Docker.
# Jalankan dari direktori root project (tempat deploy/ berada).
#
# Prerequisites:
#   - Docker Engine >= 24, Docker Compose >= 2.24
#   - .env file sudah diisi di root project
#   - Domain sudah指向 ke IP server
#   - Port 80/443 terbuka (jika pakai nginx built-in)
#
# Cara pakai:
#   bash deploy/scripts/deploy.sh
#   bash deploy/scripts/deploy.sh --skip-build   # rebuild tanpa build ulang
#   bash deploy/scripts/deploy.sh --no-cache     # force rebuild tanpa cache
# ==============================================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Config ───────────────────────────────────────────────────────────────────
COMPOSE_FILE="deploy/docker/docker-compose.yml"
SERVICE_NAME="app"

# ── Parse args ───────────────────────────────────────────────────────────────
SKIP_BUILD=false
NO_CACHE=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --no-cache)   NO_CACHE=true ;;
  esac
done

# ── Preflight ────────────────────────────────────────────────────────────────
echo -e "${CYAN}═══ Digital Lab — Deploy ═══${NC}"

if [ ! -f .env ]; then
  echo -e "${RED}❌ .env file not found di root project${NC}"
  echo "   Copy dari: cp deploy/env/.env.production.example .env"
  echo "   Lalu isi semua nilai yang diperlukan."
  exit 1
fi

if ! command -v docker &>/dev/null; then
  echo -e "${RED}❌ Docker tidak ditemukan${NC}"
  exit 1
fi

# ── Pull latest ──────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}📦 Pulling latest changes...${NC}"
git pull origin main
git submodule update --init --recursive 2>/dev/null || true

# ── Build ────────────────────────────────────────────────────────────────────
BUILD_ARGS=()
if [ "$NO_CACHE" = true ]; then
  BUILD_ARGS+=(--no-cache)
fi

if [ "$SKIP_BUILD" = false ]; then
  echo -e "\n${YELLOW}🔨 Building Docker image...${NC}"
  docker compose -f "$COMPOSE_FILE" build "${BUILD_ARGS[@]}" "$SERVICE_NAME"
fi

# ── Deploy ───────────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}🚀 Deploying...${NC}"
docker compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"

# ── Cleanup ──────────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

# ── Verify ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}📋 Container status:${NC}"
docker ps --filter name=digital-lab --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${GREEN}✅ Deploy selesai!${NC}"
echo "   App:  http://localhost:3000"
echo "   Logs: docker compose -f $COMPOSE_FILE logs -f"
