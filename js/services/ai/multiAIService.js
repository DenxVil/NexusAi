import { GeminiService } from './geminiService.js';
import { PerplexityService } from './perplexityService.js';
import { HuggingFaceService } from './huggingFaceService.js';

export class MultiAIService {
    constructor(config) {
        this.config = config;
        this.services = new Map();
        this.currentService = config.ai.defaultService;
        this.initializeServices();
    }

    initializeServices() {
        // Initialize all AI services
        this.services.set('gemini', new GeminiService(this.config.ai.services.gemini));
        this.services.set('perplexity', new PerplexityService(this.config.ai.services.perplexity));
        this.services.set('huggingface', new HuggingFaceService(this.config.ai.services.huggingface));
    }

    setApiKey(serviceName, apiKey) {
        const service = this.services.get(serviceName);
        if (service) {
            service.setApiKey(apiKey);
        } else {
            throw new Error(`Service '${serviceName}' not found`);
        }
    }

    setCurrentService(serviceName) {
        if (this.services.has(serviceName)) {
            this.currentService = serviceName;
        } else {
            throw new Error(`Service '${serviceName}' not available`);
        }
    }

    getCurrentService() {
        return this.services.get(this.currentService);
    }

    getCurrentServiceName() {
        return this.currentService;
    }

    getAvailableServices() {
        return Array.from(this.services.keys());
    }

    getServiceInfo(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            return null;
        }

        return {
            name: service.name,
            hasApiKey: service.hasApiKey(),
            isCurrentService: serviceName === this.currentService
        };
    }

    getAllServicesInfo() {
        const info = {};
        for (const [key, service] of this.services) {
            info[key] = {
                name: service.name,
                hasApiKey: service.hasApiKey(),
                isCurrentService: key === this.currentService
            };
        }
        return info;
    }

    async generateResponse(prompt, options = {}) {
        const service = this.getCurrentService();
        if (!service) {
            throw new Error(`Current service '${this.currentService}' not available`);
        }

        if (!service.hasApiKey()) {
            throw new Error(`API key not set for ${service.name}`);
        }

        try {
            return await service.generateResponse(prompt, options);
        } catch (error) {
            // If current service fails, optionally try fallback
            if (options.enableFallback && this.currentService !== 'gemini') {
                console.warn(`${service.name} failed, falling back to Gemini`);
                const fallbackService = this.services.get('gemini');
                if (fallbackService && fallbackService.hasApiKey()) {
                    return await fallbackService.generateResponse(prompt, options);
                }
            }
            throw error;
        }
    }

    async generateStreamingResponse(prompt, onChunk, options = {}) {
        const service = this.getCurrentService();
        if (!service) {
            throw new Error(`Current service '${this.currentService}' not available`);
        }

        if (!service.hasApiKey()) {
            throw new Error(`API key not set for ${service.name}`);
        }

        try {
            return await service.generateStreamingResponse(prompt, onChunk, options);
        } catch (error) {
            // If current service fails, optionally try fallback
            if (options.enableFallback && this.currentService !== 'gemini') {
                console.warn(`${service.name} streaming failed, falling back to Gemini`);
                const fallbackService = this.services.get('gemini');
                if (fallbackService && fallbackService.hasApiKey()) {
                    return await fallbackService.generateStreamingResponse(prompt, onChunk, options);
                }
            }
            throw error;
        }
    }

    // Auto-select best available service based on API key availability
    autoSelectService() {
        const availableServices = this.getAvailableServices().filter(serviceName => {
            const service = this.services.get(serviceName);
            return service && service.hasApiKey();
        });

        if (availableServices.length === 0) {
            throw new Error('No AI services have API keys configured');
        }

        // Prefer the default service if available, otherwise use the first available
        if (availableServices.includes(this.config.ai.defaultService)) {
            this.setCurrentService(this.config.ai.defaultService);
        } else {
            this.setCurrentService(availableServices[0]);
        }

        return this.currentService;
    }

    // Test connectivity for all services
    async testAllServices() {
        const results = {};
        for (const [serviceName, service] of this.services) {
            try {
                if (service.hasApiKey()) {
                    await service.generateResponse('Hello', { timeout: 5000 });
                    results[serviceName] = { status: 'success', message: 'Service is working' };
                } else {
                    results[serviceName] = { status: 'no_key', message: 'API key not configured' };
                }
            } catch (error) {
                results[serviceName] = { status: 'error', message: error.message };
            }
        }
        return results;
    }
}