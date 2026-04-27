#!/bin/bash
# ─────────────────────────────────────────────────────────────
# SOS Pet — Script de configuração inicial
# ─────────────────────────────────────────────────────────────

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  🐾  SOS Pet — Setup"
echo "──────────────────────────────"
echo -e "${NC}"

# Verificar Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}❌ Node.js não encontrado. Instale em https://nodejs.org${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ necessário. Versão atual: $(node -v)${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) encontrado${NC}"

# Backend
echo -e "\n${YELLOW}📦 Instalando dependências do backend...${NC}"
cd backend
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠️  Arquivo .env criado a partir do .env.example"
  echo -e "   Edite backend/.env com suas credenciais do PostgreSQL!${NC}"
fi
npm install
echo -e "${GREEN}✅ Backend configurado${NC}"

# Frontend
echo -e "\n${YELLOW}📦 Instalando dependências do frontend...${NC}"
cd ../frontend
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${GREEN}✅ Arquivo .env do frontend criado${NC}"
fi
npm install
echo -e "${GREEN}✅ Frontend configurado${NC}"

cd ..

echo -e "\n${GREEN}────────────────────────────────────"
echo "🚀 Setup concluído!"
echo "────────────────────────────────────${NC}"
echo ""
echo "Próximos passos:"
echo ""
echo "  1. Edite backend/.env com suas credenciais do PostgreSQL"
echo ""
echo "  2. Rode as migrations:"
echo "     ${YELLOW}cd backend && npm run migrate${NC}"
echo ""
echo "  3. Inicie o backend:"
echo "     ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo "  4. Em outro terminal, inicie o frontend:"
echo "     ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "  📡 API:      http://localhost:3001"
echo "  🌐 Frontend: http://localhost:5173"
echo ""
