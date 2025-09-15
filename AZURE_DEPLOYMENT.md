# Azure Deployment Guide for Nexus AI
## Optimized for Azure Education Benefits

This guide provides step-by-step instructions for deploying Nexus AI to Azure App Service, leveraging Azure Education benefits for cost optimization.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Azure Resource Setup](#azure-resource-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Process](#deployment-process)
5. [Error Monitoring Setup](#error-monitoring-setup)
6. [Cache Management](#cache-management)
7. [Cost Optimization](#cost-optimization)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Azure Account Setup
- Azure account with Education benefits
- Azure CLI installed
- Node.js 18+ installed locally
- Git configured

### Required Services
- MongoDB Atlas (Free tier recommended)
- Telegram Bot API token
- AI Service API keys (Gemini, Perplexity, HuggingFace)

## Azure Resource Setup

### 1. Create Resource Group
```bash
az group create --name nexus-ai-rg --location "East US"
```

### 2. Create App Service Plan (Education Optimized)
```bash
# B1 Basic plan - Free with Azure Education
az appservice plan create \
  --name nexus-ai-plan \
  --resource-group nexus-ai-rg \
  --sku B1 \
  --is-linux
```

### 3. Create Web App
```bash
az webapp create \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg \
  --plan nexus-ai-plan \
  --runtime "NODE|18-lts"
```

### 4. Create Application Insights (Free Tier)
```bash
az monitor app-insights component create \
  --app nexus-ai-insights \
  --location "East US" \
  --resource-group nexus-ai-rg \
  --application-type web
```

### 5. Create Storage Account (for uploads)
```bash
az storage account create \
  --name nexusaistorage$(date +%s) \
  --resource-group nexus-ai-rg \
  --location "East US" \
  --sku Standard_LRS \
  --kind StorageV2
```

## Environment Configuration

### Application Settings
Configure these in Azure Portal or via CLI:

```bash
# Core settings
az webapp config appsettings set \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg \
  --settings \
    NODE_ENV=production \
    PORT=80 \
    WEBSITE_NODE_DEFAULT_VERSION=18-lts \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    WEBSITE_RUN_FROM_PACKAGE=1

# Application-specific settings
az webapp config appsettings set \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg \
  --settings \
    TELEGRAM_BOT_TOKEN="your_telegram_bot_token" \
    MONGO_URI="your_mongodb_connection_string" \
    JWT_SECRET="your_jwt_secret_key" \
    GEMINI_API_KEY="your_gemini_api_key" \
    PERPLEXITY_API_KEY="your_perplexity_api_key" \
    HUGGINGFACE_API_KEY="your_huggingface_api_key"

# URLs and CORS
az webapp config appsettings set \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg \
  --settings \
    WEBSITE_URL="https://nexus-ai-app.azurewebsites.net" \
    CORS_ORIGIN="https://nexus-ai-app.azurewebsites.net" \
    REACT_APP_API_URL="https://nexus-ai-app.azurewebsites.net/api"

# Performance settings
az webapp config appsettings set \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg \
  --settings \
    RATE_LIMIT_WINDOW_MS=900000 \
    RATE_LIMIT_MAX_REQUESTS=200 \
    ENABLE_RATE_LIMITING=true \
    ENABLE_TELEGRAM_BOT=true \
    ENABLE_SOCKET_IO=true
```

## Deployment Process

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: nexus-ai-app
  NODE_VERSION: '18'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm ci
        cd server && npm ci
        cd ../client && npm ci

    - name: Build application
      run: |
        npm run build
        
    - name: Add build timestamp
      run: echo "BUILD_TIMESTAMP=$(date +%s)" >> $GITHUB_ENV

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
```

### Option 2: Azure CLI Deployment

```bash
# Build the application
npm run build

# Deploy to Azure
az webapp deployment source config-zip \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg \
  --src deployment.zip
```

### Option 3: Git Deployment

```bash
# Configure Git deployment
az webapp deployment source config \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg \
  --repo-url https://github.com/DenxVil/NexusAi \
  --branch main \
  --manual-integration

# Enable continuous deployment
az webapp deployment source sync \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg
```

## Error Monitoring Setup

The application includes automatic error monitoring with Telegram notifications to @p_harsh9.

### Features:
- **Real-time error notifications**: Critical errors sent immediately
- **System health monitoring**: Memory, CPU, and performance metrics
- **Severity classification**: Low, Medium, High, Critical alerts
- **Error aggregation**: Prevents spam with intelligent grouping
- **Startup notifications**: Confirms successful deployment

### Configuration:
Ensure `TELEGRAM_BOT_TOKEN` is configured in Azure App Settings. The monitoring will automatically notify @p_harsh9 for any errors with severity medium or higher.

## Cache Management

### Automated Cache Busting
The application includes automatic cache management to solve website update issues:

- **Version-based caching**: Assets tagged with build timestamps
- **HTTP cache headers**: Optimized for CDN and browser caching
- **Service worker integration**: Progressive web app caching
- **Azure CDN ready**: Pre-configured for Azure CDN

### CDN Setup (Optional)
```bash
# Create CDN profile
az cdn profile create \
  --name nexus-ai-cdn \
  --resource-group nexus-ai-rg \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name nexus-ai \
  --profile-name nexus-ai-cdn \
  --resource-group nexus-ai-rg \
  --origin nexus-ai-app.azurewebsites.net
```

## Cost Optimization for Azure Education

### 1. Service Tier Selection
- **App Service Plan**: B1 Basic (Free with Education)
- **Storage**: Standard LRS (Locally Redundant)
- **Application Insights**: Free tier (5GB/month)
- **CDN**: Standard Microsoft (if needed)

### 2. Scaling Configuration
```bash
# Configure auto-scaling (Basic plan supports manual scaling only)
az monitor autoscale create \
  --resource-group nexus-ai-rg \
  --resource nexus-ai-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name nexus-ai-autoscale \
  --min-count 1 \
  --max-count 2 \
  --count 1
```

### 3. Cost Monitoring
- Set up budget alerts in Azure Cost Management
- Monitor usage through Azure Portal
- Use Azure Advisor recommendations

## Database Setup

### MongoDB Atlas (Recommended)
1. Create free MongoDB Atlas cluster
2. Configure network access (allow Azure IPs)
3. Create database user
4. Get connection string
5. Add to Azure App Settings as `MONGO_URI`

### Example Connection String:
```
mongodb+srv://username:password@cluster0.mongodb.net/nexusai?retryWrites=true&w=majority
```

## Health Monitoring

### Health Check Endpoint
- **URL**: `https://your-app.azurewebsites.net/health`
- **Monitoring**: Automatic health checks configured
- **Metrics**: System performance, error rates, service status

### Application Insights Integration
```bash
# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app nexus-ai-insights \
  --resource-group nexus-ai-rg \
  --query instrumentationKey -o tsv)

# Add to app settings
az webapp config appsettings set \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
```

## Troubleshooting

### Common Issues

#### 1. Website Showing Old Version
**Solution**: The new cache management system automatically handles this:
- Build timestamps ensure fresh content
- Cache headers properly configured
- CDN invalidation paths defined

#### 2. High Memory Usage
**Solution**: Automatic monitoring will alert via Telegram:
- Check `/health` endpoint for memory stats
- Scale up to B2 plan if needed
- Monitor Application Insights for patterns

#### 3. Database Connection Issues
**Solution**:
- Verify MongoDB Atlas network access
- Check connection string in app settings
- Review Application Insights logs

#### 4. Telegram Bot Not Working
**Solution**:
- Verify `TELEGRAM_BOT_TOKEN` in app settings
- Check bot webhook configuration
- Review error logs in Application Insights

### Debugging Commands

```bash
# View application logs
az webapp log tail \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg

# Check app settings
az webapp config appsettings list \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg

# Restart application
az webapp restart \
  --name nexus-ai-app \
  --resource-group nexus-ai-rg
```

## Scaling and Performance

### Vertical Scaling (Upgrade Plan)
```bash
# Upgrade to B2 for better performance
az appservice plan update \
  --name nexus-ai-plan \
  --resource-group nexus-ai-rg \
  --sku B2
```

### Horizontal Scaling (Multiple Instances)
```bash
# Scale to 2 instances
az appservice plan update \
  --name nexus-ai-plan \
  --resource-group nexus-ai-rg \
  --number-of-workers 2
```

## Security Best Practices

1. **Environment Variables**: All secrets in Azure App Settings
2. **HTTPS Only**: Enforced by default on Azure App Service
3. **CORS Configuration**: Properly configured for your domain
4. **Rate Limiting**: Enabled with configurable limits
5. **Error Sanitization**: Production errors don't expose internals

## Monitoring and Alerts

### Error Notifications
- **Target**: @p_harsh9 on Telegram
- **Triggers**: Medium, High, Critical errors
- **Content**: Error details, context, system metrics
- **Frequency**: Intelligent throttling to prevent spam

### Health Monitoring
- **Endpoint**: `/health` - Comprehensive system status
- **Metrics**: Memory, CPU, error rates, service status
- **Integration**: Application Insights for historical data

## Support

For issues or questions:
1. Check the health endpoint: `/health`
2. Review Application Insights logs
3. Check Telegram notifications to @p_harsh9
4. Contact the development team

---

**Created with love 🩶 by Denvil 🧑‍💻**

**Azure Education Benefits Optimization**: This configuration maximizes the value of Azure Education credits while providing production-ready performance and monitoring.