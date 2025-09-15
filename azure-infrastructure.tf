# Azure App Service Deployment for Nexus AI
# Optimized for Azure Education Benefits

# App Service Plan Configuration (Cost-optimized for Education)
resource "azurerm_service_plan" "nexus_ai_plan" {
  name                = "nexus-ai-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  
  # B1 Basic plan - Perfect for development and low-traffic production
  # Free tier available with education benefits
  os_type  = "Linux"
  sku_name = "B1"  # Can be upgraded to B2 or B3 as needed
}

# App Service Configuration
resource "azurerm_linux_web_app" "nexus_ai_app" {
  name                = "nexus-ai-app"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.nexus_ai_plan.location
  service_plan_id     = azurerm_service_plan.nexus_ai_plan.id

  site_config {
    always_on = false  # Keep false for Basic plan to save costs
    
    # Node.js 18 runtime
    linux_fx_version = "NODE|18-lts"
    
    # Application settings
    app_command_line = "npm start"
    
    # Health check configuration
    health_check_path = "/health"
    
    # Enable logging
    application_logs {
      file_system_level = "Information"
    }
    
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 25
      }
    }
  }

  # Application settings (environment variables)
  app_settings = {
    NODE_ENV                    = "production"
    PORT                       = "80"
    WEBSITE_NODE_DEFAULT_VERSION = "18-lts"
    SCM_DO_BUILD_DURING_DEPLOYMENT = "true"
    ENABLE_ORYX_BUILD          = "true"
    
    # Cache busting for website updates
    BUILD_TIMESTAMP            = timestamp()
    WEBSITE_RUN_FROM_PACKAGE   = "1"
    
    # Application-specific settings
    TELEGRAM_BOT_TOKEN         = var.telegram_bot_token
    MONGO_URI                  = var.mongodb_connection_string
    JWT_SECRET                 = var.jwt_secret
    GEMINI_API_KEY            = var.gemini_api_key
    PERPLEXITY_API_KEY        = var.perplexity_api_key
    HUGGINGFACE_API_KEY       = var.huggingface_api_key
    
    # CORS and API URLs
    CORS_ORIGIN               = "https://nexus-ai-app.azurewebsites.net"
    REACT_APP_API_URL         = "https://nexus-ai-app.azurewebsites.net/api"
    WEBSITE_URL               = "https://nexus-ai-app.azurewebsites.net"
    
    # Performance and security
    RATE_LIMIT_WINDOW_MS      = "900000"
    RATE_LIMIT_MAX_REQUESTS   = "200"
    ENABLE_RATE_LIMITING      = "true"
    ENABLE_TELEGRAM_BOT       = "true"
    ENABLE_SOCKET_IO          = "true"
    
    # Azure-specific optimizations
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
    WEBSITES_CONTAINER_START_TIME_LIMIT = "600"
  }

  # Connection strings for databases
  connection_string {
    name  = "DefaultConnection"
    type  = "Custom"
    value = var.mongodb_connection_string
  }

  # Deployment source from GitHub
  source_control {
    repo_url           = "https://github.com/DenxVil/NexusAi"
    branch             = "main"
    use_manual_integration = false
    use_mercurial      = false
  }

  # Enable staging slots for zero-downtime deployments
  # Available with Basic plan and above
  depends_on = [azurerm_service_plan.nexus_ai_plan]
}

# Application Insights for monitoring (Free tier available)
resource "azurerm_application_insights" "nexus_ai_insights" {
  name                = "nexus-ai-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "Node.JS"
  
  tags = {
    Environment = "production"
    Project     = "nexus-ai"
  }
}

# Storage Account for file uploads and logs (LRS for cost optimization)
resource "azurerm_storage_account" "nexus_ai_storage" {
  name                     = "nexusaistorage${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"  # Locally redundant storage for cost optimization
  
  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "POST", "PUT"]
      allowed_origins    = ["https://nexus-ai-app.azurewebsites.net"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
  
  tags = {
    Environment = "production"
    Project     = "nexus-ai"
  }
}

# Container for file uploads
resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.nexus_ai_storage.name
  container_access_type = "private"
}

# CDN Profile for global content delivery
resource "azurerm_cdn_profile" "nexus_ai_cdn" {
  name                = "nexus-ai-cdn"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard_Microsoft"  # Cost-effective option
}

# CDN Endpoint
resource "azurerm_cdn_endpoint" "nexus_ai_endpoint" {
  name                = "nexus-ai"
  profile_name        = azurerm_cdn_profile.nexus_ai_cdn.name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  origin {
    name      = "nexus-ai-origin"
    host_name = azurerm_linux_web_app.nexus_ai_app.default_hostname
  }

  delivery_rule {
    name  = "CacheStaticAssets"
    order = 1

    conditions {
      url_file_extension_condition {
        operator         = "LessThan"
        negate_condition = false
        match_values     = ["js", "css", "png", "jpg", "jpeg", "gif", "ico", "svg"]
      }
    }

    actions {
      cache_expiration_action {
        behavior = "Override"
        duration = "1.00:00:00"  # Cache for 1 day
      }
    }
  }

  # Cache optimization for better performance
  global_delivery_rule {
    cache_expiration_action {
      behavior = "Override"
      duration = "04:00:00"  # 4 hours default cache
    }
  }
}

# Random string for unique resource names
resource "random_string" "storage_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Variables for sensitive data
variable "telegram_bot_token" {
  description = "Telegram Bot Token"
  type        = string
  sensitive   = true
}

variable "mongodb_connection_string" {
  description = "MongoDB Connection String"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret Key"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Google Gemini API Key"
  type        = string
  sensitive   = true
}

variable "perplexity_api_key" {
  description = "Perplexity API Key"
  type        = string
  sensitive   = true
}

variable "huggingface_api_key" {
  description = "HuggingFace API Key"
  type        = string
  sensitive   = true
}

# Outputs
output "app_service_url" {
  value = "https://${azurerm_linux_web_app.nexus_ai_app.default_hostname}"
}

output "cdn_endpoint_url" {
  value = "https://${azurerm_cdn_endpoint.nexus_ai_endpoint.fqdn}"
}

output "application_insights_key" {
  value = azurerm_application_insights.nexus_ai_insights.instrumentation_key
  sensitive = true
}