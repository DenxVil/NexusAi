# 🌐 Azure Deployment Guide for Nexus AI

This comprehensive guide provides step-by-step instructions for deploying the Nexus AI application to Microsoft Azure using containerized services.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Step 1: Azure Container Registry Setup](#step-1-azure-container-registry-setup)
- [Step 2: Build and Push Docker Images](#step-2-build-and-push-docker-images)
- [Step 3: Azure Cosmos DB Setup](#step-3-azure-cosmos-db-setup)
- [Step 4: Azure App Service Deployment](#step-4-azure-app-service-deployment)
- [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
- [Step 6: Deploy Frontend](#step-6-deploy-frontend)
- [Step 7: Testing and Validation](#step-7-testing-and-validation)
- [Troubleshooting](#troubleshooting)
- [Monitoring and Scaling](#monitoring-and-scaling)

## 🎯 Overview

Nexus AI is deployed on Azure using the following services:
- **Azure Container Registry (ACR)**: Stores Docker images
- **Azure App Service**: Hosts the containerized backend
- **Azure Static Web Apps** or **App Service**: Hosts the frontend
- **Azure Cosmos DB for MongoDB**: Managed database service
- **Azure Application Insights**: Monitoring and analytics

## ✅ Prerequisites

Before starting the deployment, ensure you have:

- [ ] Azure account with an active subscription ([Create free account](https://azure.microsoft.com/free/))
- [ ] Azure CLI installed ([Installation guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- [ ] Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- [ ] Git repository with the Nexus AI code
- [ ] API keys for AI services (Gemini, Perplexity, HuggingFace)
- [ ] Telegram bot token (optional, for Telegram integration)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Azure Cloud                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌──────────────────┐          │
│  │  Static Web App │◄────────┤   Azure CDN      │          │
│  │   (Frontend)    │         │   (Optional)      │          │
│  └────────┬────────┘         └──────────────────┘          │
│           │                                                   │
│           │ HTTPS                                            │
│           ▼                                                   │
│  ┌─────────────────┐         ┌──────────────────┐          │
│  │   App Service   │◄────────┤  Container       │          │
│  │   (Backend)     │         │  Registry (ACR)  │          │
│  └────────┬────────┘         └──────────────────┘          │
│           │                                                   │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐         ┌──────────────────┐          │
│  │  Cosmos DB for  │         │  Application     │          │
│  │    MongoDB      │         │   Insights       │          │
│  └─────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Step 1: Azure Container Registry Setup

### 1.1 Login to Azure

```bash
# Login to your Azure account
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"
```

### 1.2 Create Resource Group

```bash
# Create a resource group in your preferred region
az group create \
  --name nexusai-rg \
  --location eastus
```

### 1.3 Create Container Registry

```bash
# Create Azure Container Registry
az acr create \
  --resource-group nexusai-rg \
  --name nexusaiacr \
  --sku Basic \
  --admin-enabled true
```

**Note**: The ACR name must be globally unique. Replace `nexusaiacr` with your own unique name.

### 1.4 Get ACR Credentials

```bash
# Get login server
az acr show \
  --name nexusaiacr \
  --query loginServer \
  --output table

# Get admin credentials
az acr credential show \
  --name nexusaiacr \
  --query "passwords[0].value" \
  --output table
```

Save these credentials - you'll need them later.

## 🐳 Step 2: Build and Push Docker Images

### 2.1 Login to ACR

```bash
# Login to your container registry
az acr login --name nexusaiacr
```

### 2.2 Build and Push Backend Image

```bash
# Navigate to the repository root
cd /path/to/NexusAi

# Build the backend image
docker build -t nexusaiacr.azurecr.io/nexusai-backend:latest -f server/Dockerfile ./server

# Push the backend image
docker push nexusaiacr.azurecr.io/nexusai-backend:latest
```

### 2.3 Build and Push Frontend Image

```bash
# Build the frontend image
docker build -t nexusaiacr.azurecr.io/nexusai-frontend:latest -f frontend/Dockerfile ./frontend

# Push the frontend image
docker push nexusaiacr.azurecr.io/nexusai-frontend:latest
```

### 2.4 Verify Images

```bash
# List images in your registry
az acr repository list --name nexusaiacr --output table

# Show tags for backend image
az acr repository show-tags --name nexusaiacr --repository nexusai-backend --output table
```

## 💾 Step 3: Azure Cosmos DB Setup

### 3.1 Create Cosmos DB Account

```bash
# Create Cosmos DB account with MongoDB API
az cosmosdb create \
  --name nexusai-cosmos \
  --resource-group nexusai-rg \
  --kind MongoDB \
  --server-version 4.2 \
  --default-consistency-level Session \
  --locations regionName=eastus failoverPriority=0
```

### 3.2 Create Database

```bash
# Create the database
az cosmosdb mongodb database create \
  --account-name nexusai-cosmos \
  --resource-group nexusai-rg \
  --name nexusai
```

### 3.3 Get Connection String

```bash
# Get the connection string
az cosmosdb keys list \
  --name nexusai-cosmos \
  --resource-group nexusai-rg \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" \
  --output tsv
```

Save this connection string - you'll use it as the `MONGO_URI` environment variable.

**Expected format**:
```
mongodb://nexusai-cosmos:<password>@nexusai-cosmos.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@nexusai-cosmos@
```

## 🌐 Step 4: Azure App Service Deployment

### 4.1 Create App Service Plan

```bash
# Create a Linux-based App Service Plan
az appservice plan create \
  --name nexusai-plan \
  --resource-group nexusai-rg \
  --is-linux \
  --sku B1
```

**SKU Options**:
- `B1` - Basic (for development/testing)
- `P1V2` - Premium (for production)
- `P2V2` - Premium (for high traffic)

### 4.2 Create Backend Web App

```bash
# Create the backend web app
az webapp create \
  --resource-group nexusai-rg \
  --plan nexusai-plan \
  --name nexusai-backend \
  --deployment-container-image-name nexusaiacr.azurecr.io/nexusai-backend:latest
```

**Note**: The app name must be globally unique. Replace `nexusai-backend` with your own unique name.

### 4.3 Configure Container Registry Credentials

```bash
# Configure the app to use ACR
az webapp config container set \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --docker-custom-image-name nexusaiacr.azurecr.io/nexusai-backend:latest \
  --docker-registry-server-url https://nexusaiacr.azurecr.io \
  --docker-registry-server-user nexusaiacr \
  --docker-registry-server-password $(az acr credential show --name nexusaiacr --query "passwords[0].value" -o tsv)
```

### 4.4 Enable Continuous Deployment

```bash
# Enable continuous deployment from ACR
az webapp deployment container config \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --enable-cd true
```

## ⚙️ Step 5: Configure Environment Variables

### 5.1 Set Application Settings

```bash
# Set all required environment variables
az webapp config appsettings set \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --settings \
    NODE_ENV=production \
    PORT=5000 \
    MONGO_URI="<your-cosmos-db-connection-string>" \
    JWT_SECRET="<your-secure-jwt-secret>" \
    SESSION_SECRET="<your-secure-session-secret>" \
    GEMINI_API_KEY="<your-gemini-api-key>" \
    PERPLEXITY_API_KEY="<your-perplexity-api-key>" \
    HUGGINGFACE_API_KEY="<your-huggingface-api-key>" \
    TELEGRAM_BOT_TOKEN="<your-telegram-bot-token>" \
    TELEGRAM_ADMIN_UID="<your-telegram-user-id>" \
    CORS_ORIGIN="https://nexusai-frontend.azurewebsites.net" \
    WEBSITE_URL="https://nexusai-frontend.azurewebsites.net" \
    ENABLE_TELEGRAM_BOT=true \
    WEBSITES_PORT=5000
```

### 5.2 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Server port | `5000` |
| `MONGO_URI` | Cosmos DB connection string | `mongodb://...` |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | `your-super-secret-key` |
| `SESSION_SECRET` | Secret for sessions (min 32 chars) | `your-session-secret` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `PERPLEXITY_API_KEY` | Perplexity API key | `pplx-...` |
| `HUGGINGFACE_API_KEY` | HuggingFace API key | `hf_...` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | `1234567890:ABC...` |
| `TELEGRAM_ADMIN_UID` | Telegram admin user ID | `123456789` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://your-frontend-url` |
| `WEBSITES_PORT` | Azure-specific port setting | `5000` |

### 5.3 Generate Secure Secrets

```bash
# Generate a secure JWT secret
openssl rand -base64 32

# Generate a secure session secret
openssl rand -base64 32
```

## 🎨 Step 6: Deploy Frontend

### Option A: Azure Static Web Apps (Recommended)

#### 6.1 Create Static Web App

```bash
# Create static web app
az staticwebapp create \
  --name nexusai-frontend \
  --resource-group nexusai-rg \
  --source https://github.com/yourusername/NexusAi \
  --location eastus2 \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist" \
  --login-with-github
```

#### 6.2 Configure Build Settings

Create `.github/workflows/azure-static-web-apps.yml`:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          api_location: ""
          output_location: "dist"
        env:
          VITE_API_URL: https://nexusai-backend.azurewebsites.net/api
```

### Option B: App Service with Container

#### 6.1 Create Frontend Web App

```bash
# Create frontend web app
az webapp create \
  --resource-group nexusai-rg \
  --plan nexusai-plan \
  --name nexusai-frontend \
  --deployment-container-image-name nexusaiacr.azurecr.io/nexusai-frontend:latest
```

#### 6.2 Configure Container Settings

```bash
# Configure the app to use ACR
az webapp config container set \
  --name nexusai-frontend \
  --resource-group nexusai-rg \
  --docker-custom-image-name nexusaiacr.azurecr.io/nexusai-frontend:latest \
  --docker-registry-server-url https://nexusaiacr.azurecr.io \
  --docker-registry-server-user nexusaiacr \
  --docker-registry-server-password $(az acr credential show --name nexusaiacr --query "passwords[0].value" -o tsv)
```

## ✅ Step 7: Testing and Validation

### 7.1 Test Backend Health

```bash
# Check backend health
curl https://nexusai-backend.azurewebsites.net/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "uptime": "...",
#   "services": { ... }
# }
```

### 7.2 Test Frontend

```bash
# Visit the frontend URL
open https://nexusai-frontend.azurewebsites.net

# Or for Static Web Apps
open https://nexusai-frontend.azurestaticapps.net
```

### 7.3 Test Database Connection

```bash
# Check backend logs for database connection
az webapp log tail --name nexusai-backend --resource-group nexusai-rg

# Look for: "✅ MongoDB connected successfully"
```

### 7.4 Test AI Services

1. Open the frontend application
2. Send a test message through the chat interface
3. Verify you receive an AI-powered response
4. Check the backend logs for any errors

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: Container fails to start

```bash
# Check container logs
az webapp log tail --name nexusai-backend --resource-group nexusai-rg

# Restart the app
az webapp restart --name nexusai-backend --resource-group nexusai-rg
```

#### Issue: Database connection fails

1. Verify connection string is correct
2. Check Cosmos DB firewall rules
3. Ensure the connection string includes `ssl=true`

```bash
# Update firewall to allow Azure services
az cosmosdb update \
  --name nexusai-cosmos \
  --resource-group nexusai-rg \
  --enable-public-network true
```

#### Issue: Environment variables not loading

```bash
# List current app settings
az webapp config appsettings list \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --output table

# Verify specific variable
az webapp config appsettings list \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --query "[?name=='MONGO_URI']"
```

#### Issue: CORS errors

```bash
# Update CORS_ORIGIN environment variable
az webapp config appsettings set \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --settings CORS_ORIGIN="https://nexusai-frontend.azurewebsites.net,https://nexusai-frontend.azurestaticapps.net"
```

#### Issue: High memory usage or crashes

```bash
# Scale up the App Service Plan
az appservice plan update \
  --name nexusai-plan \
  --resource-group nexusai-rg \
  --sku P1V2

# Or scale out (add instances)
az appservice plan update \
  --name nexusai-plan \
  --resource-group nexusai-rg \
  --number-of-workers 2
```

### Viewing Logs

```bash
# Enable application logging
az webapp log config \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --application-logging filesystem \
  --level information

# Stream logs
az webapp log tail --name nexusai-backend --resource-group nexusai-rg

# Download logs
az webapp log download \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --log-file logs.zip
```

## 📊 Monitoring and Scaling

### Application Insights Setup

```bash
# Create Application Insights
az monitor app-insights component create \
  --app nexusai-insights \
  --location eastus \
  --resource-group nexusai-rg \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app nexusai-insights \
  --resource-group nexusai-rg \
  --query instrumentationKey \
  --output tsv

# Add to app settings
az webapp config appsettings set \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="<instrumentation-key>"
```

### Auto-Scaling Configuration

```bash
# Enable autoscale
az monitor autoscale create \
  --resource-group nexusai-rg \
  --resource nexusai-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name nexusai-autoscale \
  --min-count 1 \
  --max-count 5 \
  --count 1

# Add CPU-based scale rule
az monitor autoscale rule create \
  --resource-group nexusai-rg \
  --autoscale-name nexusai-autoscale \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1

az monitor autoscale rule create \
  --resource-group nexusai-rg \
  --autoscale-name nexusai-autoscale \
  --condition "Percentage CPU < 30 avg 5m" \
  --scale in 1
```

### Performance Monitoring

Access these metrics in the Azure Portal:
- CPU Usage
- Memory Usage
- Response Time
- Request Count
- Error Rate
- Database Performance

## 🔐 Security Best Practices

### 1. Enable HTTPS Only

```bash
az webapp update \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --https-only true
```

### 2. Configure Managed Identity

```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --name nexusai-backend \
  --resource-group nexusai-rg

# Use managed identity for ACR pulls
az webapp config set \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --generic-configurations '{"acrUseManagedIdentityCreds": true}'
```

### 3. Restrict Network Access

```bash
# Add IP restrictions
az webapp config access-restriction add \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --rule-name allow-office \
  --action Allow \
  --ip-address 203.0.113.0/24 \
  --priority 100
```

### 4. Use Azure Key Vault for Secrets

```bash
# Create Key Vault
az keyvault create \
  --name nexusai-keyvault \
  --resource-group nexusai-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name nexusai-keyvault \
  --name jwt-secret \
  --value "<your-jwt-secret>"

# Reference in app settings
az webapp config appsettings set \
  --name nexusai-backend \
  --resource-group nexusai-rg \
  --settings JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://nexusai-keyvault.vault.azure.net/secrets/jwt-secret/)"
```

## 💰 Cost Optimization

### Recommended Configurations by Environment

#### Development/Testing
```
- App Service Plan: B1 (Basic)
- Cosmos DB: Serverless
- Static Web Apps: Free tier
Estimated cost: ~$15-30/month
```

#### Production (Low-Medium Traffic)
```
- App Service Plan: P1V2 (Premium)
- Cosmos DB: Provisioned (400 RU/s)
- Static Web Apps: Standard
Estimated cost: ~$100-150/month
```

#### Production (High Traffic)
```
- App Service Plan: P2V2 with autoscaling
- Cosmos DB: Provisioned (1000+ RU/s)
- Static Web Apps: Standard
- Application Insights: Standard
Estimated cost: ~$300-500/month
```

### Cost Monitoring

```bash
# Set up cost alerts
az consumption budget create \
  --amount 100 \
  --budget-name nexusai-budget \
  --category cost \
  --time-grain monthly \
  --time-period start-date=2025-01-01 end-date=2025-12-31
```

## 🚀 CI/CD Pipeline Setup

### Using GitHub Actions

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Login to ACR
      run: az acr login --name nexusaiacr
    
    - name: Build and push backend
      run: |
        docker build -t nexusaiacr.azurecr.io/nexusai-backend:${{ github.sha }} -f server/Dockerfile ./server
        docker tag nexusaiacr.azurecr.io/nexusai-backend:${{ github.sha }} nexusaiacr.azurecr.io/nexusai-backend:latest
        docker push nexusaiacr.azurecr.io/nexusai-backend:${{ github.sha }}
        docker push nexusaiacr.azurecr.io/nexusai-backend:latest
    
    - name: Deploy to App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: nexusai-backend
        images: nexusaiacr.azurecr.io/nexusai-backend:${{ github.sha }}
```

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure Container Registry Documentation](https://docs.microsoft.com/azure/container-registry/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🎉 Deployment Complete!

Your Nexus AI application should now be fully deployed on Azure. You can access it at:

- **Frontend**: `https://nexusai-frontend.azurewebsites.net` or `https://nexusai-frontend.azurestaticapps.net`
- **Backend API**: `https://nexusai-backend.azurewebsites.net/api`
- **Health Check**: `https://nexusai-backend.azurewebsites.net/health`
- **Telegram Bot**: Should be active and responding to messages

---

**Created with love 🩶 by Denvil 🧑‍💻**

For issues or questions, please open an issue in the GitHub repository.
