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
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    echo -e "${RED}❌ Error: Not in NexusAi repository root${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking Frontend Configuration (GitHub Pages)${NC}"
echo "------------------------------------------------"

# Check client package.json for GitHub Pages configuration
if grep -q '"homepage": "https://denxvil.github.io/NexusAi"' client/package.json; then
    echo -e "${GREEN}✅ GitHub Pages homepage configured${NC}"
else
    echo -e "${RED}❌ GitHub Pages homepage not configured${NC}"
fi

if grep -q '"gh-pages"' client/package.json; then
    echo -e "${GREEN}✅ gh-pages dependency found${NC}"
else
    echo -e "${RED}❌ gh-pages dependency missing${NC}"
fi

if grep -q '"deploy"' client/package.json; then
    echo -e "${GREEN}✅ Deploy script configured${NC}"
else
    echo -e "${RED}❌ Deploy script missing${NC}"
fi

# Check for GitHub Pages workflow
if [ -f ".github/workflows/deploy-pages.yml" ]; then
    echo -e "${GREEN}✅ GitHub Pages workflow found${NC}"
else
    echo -e "${RED}❌ GitHub Pages workflow missing${NC}"
fi

# Check for configuration service
if [ -f "client/src/services/config.ts" ]; then
    echo -e "${GREEN}✅ Configuration service found${NC}"
else
    echo -e "${RED}❌ Configuration service missing${NC}"
fi

# Check for client-side AI service
if [ -f "client/src/services/clientAI.ts" ]; then
    echo -e "${GREEN}✅ Client-side AI service found${NC}"
else
    echo -e "${RED}❌ Client-side AI service missing${NC}"
fi

# Check for enhanced main page
if [ -f "client/src/pages/EnhancedMainPage.tsx" ]; then
    echo -e "${GREEN}✅ Enhanced main page found${NC}"
else
    echo -e "${RED}❌ Enhanced main page missing${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Checking Backend Configuration (Render)${NC}"
echo "--------------------------------------------"

# Check render.yaml configuration
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✅ Render configuration found${NC}"
    
    if grep -q "nexus-ai-backend" render.yaml; then
        echo -e "${GREEN}✅ Render service name configured${NC}"
    else
        echo -e "${RED}❌ Render service name not configured${NC}"
    fi
    
    if grep -q "https://denxvil.github.io" render.yaml; then
        echo -e "${GREEN}✅ CORS origin configured for GitHub Pages${NC}"
    else
        echo -e "${RED}❌ CORS origin not configured for GitHub Pages${NC}"
    fi
else
    echo -e "${RED}❌ Render configuration missing${NC}"
fi

# Check server configuration
if [ -f "server/src/config/index.ts" ]; then
    echo -e "${GREEN}✅ Server configuration found${NC}"
    
    if grep -q "getCorsOrigins" server/src/config/index.ts; then
        echo -e "${GREEN}✅ Dynamic CORS configuration found${NC}"
    else
        echo -e "${RED}❌ Dynamic CORS configuration missing${NC}"
    fi
    
    if grep -q "isRender" server/src/config/index.ts; then
        echo -e "${GREEN}✅ Platform detection configured${NC}"
    else
        echo -e "${RED}❌ Platform detection missing${NC}"
    fi
else
    echo -e "${RED}❌ Server configuration missing${NC}"
fi

# Check Render environment template
if [ -f "server/.env.render-template" ]; then
    echo -e "${GREEN}✅ Render environment template found${NC}"
else
    echo -e "${RED}❌ Render environment template missing${NC}"
fi

echo ""
echo -e "${BLUE}🤖 Checking Telegram Integration${NC}"
echo "-----------------------------------"

# Check TelegramFloat component
if [ -f "client/src/components/common/TelegramFloat.tsx" ]; then
    if grep -q "configService" client/src/components/common/TelegramFloat.tsx; then
        echo -e "${GREEN}✅ TelegramFloat uses configuration service${NC}"
    else
        echo -e "${YELLOW}⚠️ TelegramFloat not using configuration service${NC}"
    fi
else
    echo -e "${RED}❌ TelegramFloat component missing${NC}"
fi

# Check Telegram bot service
if [ -f "server/src/services/telegramBot.ts" ]; then
    echo -e "${GREEN}✅ Telegram bot service found${NC}"
else
    echo -e "${RED}❌ Telegram bot service missing${NC}"
fi

echo ""
echo -e "${BLUE}📚 Checking Documentation${NC}"
echo "----------------------------"

if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    echo -e "${GREEN}✅ Deployment guide found${NC}"
else
    echo -e "${RED}❌ Deployment guide missing${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Testing Build Process${NC}"
echo "-------------------------"

# Test client build
echo -e "${YELLOW}Building client...${NC}"
cd client
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Client build successful${NC}"
else
    echo -e "${RED}❌ Client build failed${NC}"
fi
cd ..

# Test server build
echo -e "${YELLOW}Building server...${NC}"
cd server
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server build successful${NC}"
else
    echo -e "${RED}❌ Server build failed${NC}"
fi
cd ..

echo ""
echo -e "${BLUE}📊 Summary${NC}"
echo "----------"

# Count successful checks
total_checks=0
passed_checks=0

# Frontend checks
checks=(
    "client/package.json:homepage"
    "client/package.json:gh-pages"
    ".github/workflows/deploy-pages.yml"
    "client/src/services/config.ts"
    "client/src/services/clientAI.ts"
    "client/src/pages/EnhancedMainPage.tsx"
)

for check in "${checks[@]}"; do
    total_checks=$((total_checks + 1))
    case $check in
        *"package.json:homepage"*)
            if grep -q '"homepage": "https://denxvil.github.io/NexusAi"' client/package.json; then
                passed_checks=$((passed_checks + 1))
            fi
            ;;
        *"package.json:gh-pages"*)
            if grep -q '"gh-pages"' client/package.json; then
                passed_checks=$((passed_checks + 1))
            fi
            ;;
        *)
            if [ -f "$check" ]; then
                passed_checks=$((passed_checks + 1))
            fi
            ;;
    esac
done

# Backend checks
backend_checks=(
    "render.yaml"
    "server/src/config/index.ts"
    "server/.env.render-template"
    "server/src/services/telegramBot.ts"
)

for check in "${backend_checks[@]}"; do
    total_checks=$((total_checks + 1))
    if [ -f "$check" ]; then
        passed_checks=$((passed_checks + 1))
    fi
done

# Documentation check
total_checks=$((total_checks + 1))
if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    passed_checks=$((passed_checks + 1))
fi

echo -e "${GREEN}✅ Passed: $passed_checks/$total_checks checks${NC}"

if [ $passed_checks -eq $total_checks ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready for deployment.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Push to main branch to trigger GitHub Pages deployment"
    echo "2. Configure environment variables in Render dashboard"
    echo "3. Deploy backend to Render"
    echo "4. Test the complete integration"
else
    echo -e "${YELLOW}⚠️ Some checks failed. Please review the output above.${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Deployment URLs:${NC}"
echo "Frontend: https://denxvil.github.io/NexusAi"
echo "Backend: https://nexus-ai-backend.onrender.com"
echo "Telegram: https://t.me/NexusAiProbot"
echo ""
echo "Created with love 🩶 by Denvil 🧑‍💻"