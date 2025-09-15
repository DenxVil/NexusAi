// Created with love 🩶 by Denvil 🧑‍💻  
// Client-side AI Service for GitHub Pages deployment

import configService from './config';

interface ClientAIConfig {
  gemini?: string;
  perplexity?: string;
  huggingface?: string;
}

interface AIResponse {
  response: string;
  metadata: {
    model: string;
    tokens: number;
    responseTime: number;
    timestamp: string;
    source: 'backend' | 'client' | 'fallback';
  };
}

class ClientSideAIService {
  private apiKeys: ClientAIConfig = {};
  private fallbackResponses = [
    "I'm currently running in offline mode. Please configure your API keys in the settings to enable full AI functionality.",
    "Hello! I'm Nexus AI. I can help you with various tasks when properly configured with API keys.",
    "I'm here to assist you! For the best experience, please add your AI service API keys in the settings panel.",
    "Welcome to Nexus AI! I'm currently in demonstration mode. Configure API keys for full functionality.",
  ];

  constructor() {
    this.loadApiKeys();
  }

  public setApiKey(service: keyof ClientAIConfig, apiKey: string): void {
    this.apiKeys[service] = apiKey;
    this.saveApiKeys();
  }

  public getApiKey(service: keyof ClientAIConfig): string | undefined {
    return this.apiKeys[service];
  }

  public hasApiKey(service: keyof ClientAIConfig): boolean {
    return !!this.apiKeys[service]?.trim();
  }

  public clearApiKey(service: keyof ClientAIConfig): void {
    delete this.apiKeys[service];
    this.saveApiKeys();
  }

  public clearAllApiKeys(): void {
    this.apiKeys = {};
    this.saveApiKeys();
  }

  private loadApiKeys(): void {
    try {
      const stored = localStorage.getItem('nexus_ai_client_keys');
      if (stored) {
        this.apiKeys = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load client API keys:', error);
      this.apiKeys = {};
    }
  }

  private saveApiKeys(): void {
    try {
      localStorage.setItem('nexus_ai_client_keys', JSON.stringify(this.apiKeys));
    } catch (error) {
      console.warn('Failed to save client API keys:', error);
    }
  }

  public async sendMessage(message: string, preferredModel?: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Try backend API first if available
      if (navigator.onLine && !configService.isFeatureEnabled('offlineMode')) {
        try {
          const backendResponse = await this.sendToBackend(message, preferredModel);
          return {
            ...backendResponse,
            metadata: {
              ...backendResponse.metadata,
              source: 'backend',
              responseTime: Date.now() - startTime,
            }
          };
        } catch (backendError) {
          console.warn('Backend unavailable, falling back to client-side AI:', backendError);
        }
      }

      // Try client-side AI services
      const clientResponse = await this.sendToClientAI(message, preferredModel);
      if (clientResponse) {
        return {
          ...clientResponse,
          metadata: {
            ...clientResponse.metadata,
            source: 'client',
            responseTime: Date.now() - startTime,
          }
        };
      }

      // Fallback response
      return this.generateFallbackResponse(message, startTime);

    } catch (error) {
      console.error('AI service error:', error);
      return this.generateFallbackResponse(message, startTime, true);
    }
  }

  private async sendToBackend(message: string, model?: string): Promise<AIResponse> {
    const response = await fetch(`${configService.getApiUrl()}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({
        message,
        model,
        temperature: 0.7,
        maxTokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  private async sendToClientAI(message: string, preferredModel?: string): Promise<AIResponse | null> {
    const aiConfig = configService.getAIConfig();
    const modelToUse = preferredModel || aiConfig.defaultService;

    // Try primary model
    if (this.hasApiKey(modelToUse as keyof ClientAIConfig)) {
      const response = await this.callAIService(modelToUse, message);
      if (response) return response;
    }

    // Try fallback model
    if (modelToUse !== aiConfig.fallbackService && this.hasApiKey(aiConfig.fallbackService as keyof ClientAIConfig)) {
      const response = await this.callAIService(aiConfig.fallbackService, message);
      if (response) return response;
    }

    // Try any available service
    for (const service of aiConfig.enabledServices) {
      if (service !== modelToUse && service !== aiConfig.fallbackService && this.hasApiKey(service as keyof ClientAIConfig)) {
        const response = await this.callAIService(service, message);
        if (response) return response;
      }
    }

    return null;
  }

  private async callAIService(service: string, message: string): Promise<AIResponse | null> {
    const apiKey = this.getApiKey(service as keyof ClientAIConfig);
    if (!apiKey) return null;

    try {
      switch (service) {
        case 'gemini':
          return await this.callGemini(message, apiKey);
        case 'huggingface':
          return await this.callHuggingFace(message, apiKey);
        default:
          console.warn(`Client-side integration for ${service} not implemented yet`);
          return null;
      }
    } catch (error) {
      console.warn(`Error calling ${service}:`, error);
      return null;
    }
  }

  private async callGemini(message: string, apiKey: string): Promise<AIResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: message
          }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || 'No response generated';

    return {
      response: generatedText,
      metadata: {
        model: 'gemini-pro',
        tokens: generatedText.length / 4, // Rough estimation
        responseTime: 0, // Will be set by caller
        timestamp: new Date().toISOString(),
        source: 'client',
      }
    };
  }

  private async callHuggingFace(message: string, apiKey: string): Promise<AIResponse> {
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: message,
        parameters: {
          max_length: 100,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data[0]?.generated_text || data.generated_text || 'No response generated';

    return {
      response: generatedText,
      metadata: {
        model: 'DialoGPT-medium',
        tokens: generatedText.length / 4,
        responseTime: 0,
        timestamp: new Date().toISOString(),
        source: 'client',
      }
    };
  }

  private generateFallbackResponse(message: string, startTime: number, isError: boolean = false): AIResponse {
    const randomResponse = this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
    
    let response = randomResponse;
    if (isError) {
      response = "I encountered an error while processing your request. Please check your internet connection and API key configuration.";
    }

    return {
      response,
      metadata: {
        model: 'fallback',
        tokens: response.length / 4,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        source: 'fallback',
      }
    };
  }

  public getAvailableServices(): Array<{id: string, name: string, hasApiKey: boolean}> {
    return [
      { id: 'gemini', name: '🤖 Google Gemini', hasApiKey: this.hasApiKey('gemini') },
      { id: 'perplexity', name: '🔍 Perplexity', hasApiKey: this.hasApiKey('perplexity') },
      { id: 'huggingface', name: '🤗 HuggingFace', hasApiKey: this.hasApiKey('huggingface') },
    ];
  }

  public getServiceStatus(): Record<string, boolean> {
    return {
      gemini: this.hasApiKey('gemini'),
      perplexity: this.hasApiKey('perplexity'),
      huggingface: this.hasApiKey('huggingface'),
    };
  }
}

export const clientAIService = new ClientSideAIService();
export default clientAIService;