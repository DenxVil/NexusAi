// Created with love 🩶 by Denvil 🧑‍💻
// Environment Configuration Service

interface EnvironmentConfig {
  apiUrl: string;
  websiteUrl: string;
  telegramBotUrl: string;
  environment: 'github-pages' | 'azure' | 'local' | 'production';
  features: {
    clientSideApiKeys: boolean;
    offlineMode: boolean;
    pwa: boolean;
    analytics: boolean;
    errorReporting: boolean;
    floating3d: boolean;
    telegramFloat: boolean;
  };
  ai: {
    defaultService: string;
    fallbackService: string;
    enabledServices: string[];
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    animations: boolean;
  };
}

class ConfigurationService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): EnvironmentConfig {
    const environment = this.detectEnvironment();
    
    const baseConfig: EnvironmentConfig = {
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      websiteUrl: process.env.REACT_APP_WEBSITE_URL || 'http://localhost:3000',
      telegramBotUrl: process.env.REACT_APP_TELEGRAM_BOT_URL || 'https://t.me/NexusAiProbot',
      environment,
      features: {
        clientSideApiKeys: process.env.REACT_APP_ENABLE_CLIENT_SIDE_API_KEYS === 'true',
        offlineMode: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
        pwa: process.env.REACT_APP_ENABLE_PWA === 'true',
        analytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
        errorReporting: process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true',
        floating3d: process.env.REACT_APP_ENABLE_3D_BACKGROUND !== 'false',
        telegramFloat: process.env.REACT_APP_ENABLE_FLOATING_TELEGRAM !== 'false',
      },
      ai: {
        defaultService: process.env.REACT_APP_DEFAULT_AI_SERVICE || 'gemini',
        fallbackService: process.env.REACT_APP_FALLBACK_AI_SERVICE || 'huggingface',
        enabledServices: ['gemini', 'perplexity', 'huggingface'],
      },
      ui: {
        theme: (process.env.REACT_APP_THEME as 'light' | 'dark' | 'auto') || 'dark',
        animations: process.env.REACT_APP_ENABLE_ANIMATIONS !== 'false',
      },
    };

    // Environment-specific overrides
    switch (environment) {
      case 'github-pages':
        return {
          ...baseConfig,
          features: {
            ...baseConfig.features,
            clientSideApiKeys: true,
            offlineMode: true,
            pwa: true,
          },
        };
      
      case 'azure':
        return {
          ...baseConfig,
          features: {
            ...baseConfig.features,
            analytics: true,
            errorReporting: true,
          },
        };
      
      case 'local':
        return {
          ...baseConfig,
          features: {
            ...baseConfig.features,
            clientSideApiKeys: false,
            analytics: false,
          },
        };
      
      default:
        return baseConfig;
    }
  }

  private detectEnvironment(): 'github-pages' | 'azure' | 'local' | 'production' {
    // Check explicit environment variable first
    const envVar = process.env.REACT_APP_ENVIRONMENT;
    if (envVar) {
      return envVar as any;
    }

    // Detect based on hostname
    const hostname = window.location.hostname;
    
    if (hostname.includes('github.io')) {
      return 'github-pages';
    }
    
    if (hostname.includes('azurewebsites.net') || hostname.includes('azure')) {
      return 'azure';
    }
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local';
    }
    
    return 'production';
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public getApiUrl(): string {
    return this.config.apiUrl;
  }

  public getWebsiteUrl(): string {
    return this.config.websiteUrl;
  }

  public getTelegramBotUrl(): string {
    return this.config.telegramBotUrl;
  }

  public getEnvironment(): string {
    return this.config.environment;
  }

  public isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  public getAIConfig(): EnvironmentConfig['ai'] {
    return { ...this.config.ai };
  }

  public getUIConfig(): EnvironmentConfig['ui'] {
    return { ...this.config.ui };
  }

  public isClientSideApiKeysEnabled(): boolean {
    return this.config.features.clientSideApiKeys;
  }

  public shouldShowOfflineSupport(): boolean {
    return this.config.features.offlineMode;
  }

  public getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add environment-specific headers
    if (this.config.environment === 'github-pages') {
      headers['X-Client-Platform'] = 'github-pages';
    }

    return headers;
  }
}

// Create singleton instance
export const configService = new ConfigurationService();
export default configService;