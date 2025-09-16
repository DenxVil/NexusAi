#!/bin/bash

# 🚀 Nexus AI Deployment Verification Script
# This script verifies that all components are properly configured for GitHub Pages + Render deployment

echo "🔍 Nexus AI Deployment Verification"
echo "=================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "server" ]; then
    echo -e "${RED}❌ Error: Not in NexusAi repository root${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking Frontend Configuration (GitHub Pages)${NC}"
echo "------------------------------------------------"

# Check GitHub Actions workflow
if [ -f ".github/workflows/deploy-frontend.yml" ]; then
    echo -e "${GREEN}✅ GitHub Pages deployment workflow found${NC}"
    if grep -q "VITE_API_BASE_URL: https://nexus-ai-backend.onrender.com" .github/workflows/deploy-frontend.yml; then
        echo -e "${GREEN}✅ Frontend configured for Render backend${NC}"
    else
        echo -e "${RED}❌ Frontend not configured for Render backend${NC}"
    fi
else
    echo -e "${RED}❌ GitHub Pages deployment workflow not found${NC}"
fi

# Check Vite configuration
if [ -f "frontend/vite.config.ts" ]; then
    echo -e "${GREEN}✅ Vite configuration found${NC}"
    if grep -q 'base: "/NexusAi/"' frontend/vite.config.ts; then
        echo -e "${GREEN}✅ GitHub Pages base path configured${NC}"
    else
        echo -e "${RED}❌ GitHub Pages base path not configured${NC}"
    fi
else
    echo -e "${RED}❌ Vite configuration not found${NC}"
fi

# Check frontend package.json
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✅ Frontend package.json found${NC}"
    if grep -q '"build": "vite build"' frontend/package.json; then
        echo -e "${GREEN}✅ Vite build script configured${NC}"
    else
        echo -e "${RED}❌ Vite build script not configured${NC}"
    fi
else
    echo -e "${RED}❌ Frontend package.json not found${NC}"
fi

# Check frontend environment example
if [ -f "frontend/.env.example" ]; then
    echo -e "${GREEN}✅ Frontend environment example found${NC}"
    if grep -q "https://nexus-ai-backend.onrender.com" frontend/.env.example; then
        echo -e "${GREEN}✅ Frontend configured for Render backend URL${NC}"
    else
        echo -e "${RED}❌ Frontend not configured for Render backend URL${NC}"
    fi
else
    echo -e "${RED}❌ Frontend environment example not found${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Checking Backend Configuration (Render)${NC}"
echo "---------------------------------------------"

# Check render.yaml configuration
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✅ Render configuration found${NC}"
    if grep -q "name: nexus-ai-backend" render.yaml; then
        echo -e "${GREEN}✅ Render service name configured${NC}"
    else
        echo -e "${RED}❌ Render service name not configured${NC}"
    fi
    if grep -q "rootDir: ./server" render.yaml; then
        echo -e "${GREEN}✅ Render root directory configured${NC}"
    else
        echo -e "${RED}❌ Render root directory not configured${NC}"
    fi
    if grep -q "healthCheckPath: /health" render.yaml; then
        echo -e "${GREEN}✅ Health check path configured${NC}"
    else
        echo -e "${RED}❌ Health check path not configured${NC}"
    fi
else
    echo -e "${RED}❌ Render configuration not found${NC}"
fi

# Check server package.json
if [ -f "server/package.json" ]; then
    echo -e "${GREEN}✅ Server package.json found${NC}"
    if grep -q '"build": "tsc"' server/package.json; then
        echo -e "${GREEN}✅ TypeScript build script configured${NC}"
    else
        echo -e "${RED}❌ TypeScript build script missing${NC}"
    fi
    if grep -q '"start": "node dist/index.js"' server/package.json; then
        echo -e "${GREEN}✅ Start script configured${NC}"
    else
        echo -e "${RED}❌ Start script not configured${NC}"
    fi
else
    echo -e "${RED}❌ Server package.json not found${NC}"
fi

# Check for server source files
if [ -d "server/src" ]; then
    echo -e "${GREEN}✅ Server source directory found${NC}"
    if [ -f "server/src/index.ts" ]; then
        echo -e "${GREEN}✅ Main server file found${NC}"
    else
        echo -e "${RED}❌ Main server file missing${NC}"
    fi
else
    echo -e "${RED}❌ Server source directory missing${NC}"
fi

# Check server environment example
if [ -f "server/.env.example" ]; then
    echo -e "${GREEN}✅ Server environment example found${NC}"
else
    echo -e "${RED}❌ Server environment example not found${NC}"
fi

echo ""
echo -e "${BLUE}🧹 Checking Azure Removal${NC}"
echo "-------------------------"

# Check that Azure files are removed
AZURE_FILES=(
    "azure-infrastructure.tf"
    "azure-app-config.yml"
    "AZURE_DEPLOYMENT.md"
    ".azure-config"
    ".github/workflows/azure-deploy.yml"
)

ALL_REMOVED=true
for file in "${AZURE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${RED}❌ Azure file still exists: $file${NC}"
        ALL_REMOVED=false
    fi
done

if [ "$ALL_REMOVED" = true ]; then
    echo -e "${GREEN}✅ All Azure files have been removed${NC}"
fi

# Check for Azure references in code
if grep -r -i "azure" . --exclude-dir=.git --exclude-dir=node_modules --exclude="verify-deployment.sh" 2>/dev/null | grep -v "DEPLOYMENT.md" | grep -v "DEPLOYMENT_GUIDE.md" >/dev/null; then
    echo -e "${RED}❌ Azure references still found in code${NC}"
else
    echo -e "${GREEN}✅ No Azure references found in code${NC}"
fi

echo ""
echo -e "${BLUE}🏗️ Testing Build Process${NC}"
echo "------------------------"

# Test backend build
echo -e "${YELLOW}🔨 Testing backend build...${NC}"
cd server
if npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend build successful${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
fi
cd ..

# Test frontend build
echo -e "${YELLOW}🔨 Testing frontend build...${NC}"
cd frontend
if npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
fi
cd ..

echo ""
echo -e "${BLUE}📊 Deployment Readiness Summary${NC}"
echo "==============================="

# Check if builds exist
if [ -d "server/dist" ]; then
    echo -e "${GREEN}✅ Backend build artifacts ready${NC}"
else
    echo -e "${RED}❌ Backend build artifacts missing${NC}"
fi

if [ -d "frontend/dist" ]; then
    echo -e "${GREEN}✅ Frontend build artifacts ready${NC}"
else
    echo -e "${RED}❌ Frontend build artifacts missing${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Deployment URLs${NC}"
echo "=================="
echo -e "${GREEN}Frontend (GitHub Pages):${NC} https://denxvil.github.io/NexusAi/"
echo -e "${GREEN}Backend (Render):${NC} https://nexus-ai-backend.onrender.com"
echo -e "${GREEN}Backend Health Check:${NC} https://nexus-ai-backend.onrender.com/health"
echo -e "${GREEN}Telegram Bot:${NC} @NexusAiProbot"

echo ""
echo -e "${GREEN}🎉 Verification complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy backend to Render using render.yaml"
echo "2. Configure environment variables in Render dashboard"
echo "3. Push to main branch to trigger GitHub Pages deployment"
echo "4. Test the deployed application"