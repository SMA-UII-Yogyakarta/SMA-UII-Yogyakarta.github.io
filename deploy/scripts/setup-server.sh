#!/usr/bin/env bash
# ==============================================================================
# Digital Lab School — Initial Server Setup
# ==============================================================================
# Jalankan SATU KALI saat pertama kali menyiapkan server.
# Tested on: Ubuntu 22.04 / 24.04 LTS, Debian 12
# ==============================================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══ Digital Lab — Server Setup ═══${NC}"

# ── 1. System update ─────────────────────────────────────────────────────────
echo -e "\n${YELLOW}1. Updating system packages...${NC}"
apt update && apt upgrade -y

# ── 2. Install Docker ────────────────────────────────────────────────────────
echo -e "\n${YELLOW}2. Installing Docker...${NC}"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | bash
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}   ✅ Docker installed${NC}"
else
  echo -e "${GREEN}   ✅ Docker already installed: $(docker --version)${NC}"
fi

# ── 3. Install Docker Compose plugin ─────────────────────────────────────────
echo -e "\n${YELLOW}3. Installing Docker Compose...${NC}"
if ! docker compose version &>/dev/null; then
  apt install -y docker-compose-plugin
  echo -e "${GREEN}   ✅ Docker Compose installed${NC}"
else
  echo -e "${GREEN}   ✅ Docker Compose already installed: $(docker compose version)${NC}"
fi

# ── 4. Install Bun (optional — untuk development di server) ──────────────────
echo -e "\n${YELLOW}4. Installing Bun...${NC}"
if ! command -v bun &>/dev/null; then
  curl -fsSL https://bun.sh/install | bash
  echo -e "${GREEN}   ✅ Bun installed${NC}"
else
  echo -e "${GREEN}   ✅ Bun already installed: $(bun --version)${NC}"
fi

# ── 5. Install Git + clone repo ──────────────────────────────────────────────
echo -e "\n${YELLOW}5. Setting up repository...${NC}"
if [ ! -d "digital-lab" ]; then
  git clone https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io.git digital-lab
  cd digital-lab
  git submodule update --init --recursive
else
  echo -e "${GREEN}   ✅ Repository already cloned${NC}"
fi

# ── 6. Setup .env ────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}6. Setting up environment...${NC}"
if [ ! -f ".env" ]; then
  cp deploy/env/.env.production.example .env
  echo -e "${YELLOW}   ⚠️  .env file created. ISI SEMUA NILAI sebelum deploy!${NC}"
  echo "      nano .env"
else
  echo -e "${GREEN}   ✅ .env already exists${NC}"
fi

# ── 7. Setup firewall ───────────────────────────────────────────────────────
echo -e "\n${YELLOW}7. Configuring firewall...${NC}"
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
  echo -e "${GREEN}   ✅ UFW configured${NC}"
else
  echo -e "${YELLOW}   ⚠️  UFW not found, configure firewall manually${NC}"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Server setup selesai!${NC}"
echo ""
echo "Next steps:"
echo "   1. cd digital-lab"
echo "   2. nano .env                          # isi semua nilai"
echo "   3. bash deploy/scripts/deploy.sh      # build + deploy"
echo "   4. # Setup SSL (Let's Encrypt)"
echo "      certbot --nginx -d lab.domain.sch.id"
echo ""
echo "📖 Lihat deploy/README.md untuk dokumentasi lengkap"
