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
        
        // Add virtual "auto" service for sequential fallback
        this.services.set('auto', {
            name: 'Auto (Sequential)',
            hasApiKey: () => true, // Auto is always available
            generateResponse: (prompt, options) => this.generateSequentialResponse(prompt, options),
            generateStreamingResponse: (prompt, onChunk, options) => this.generateSequentialStreamingResponse(prompt, onChunk, options)
        });
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
            if (serviceName === 'auto') continue; // Skip auto service in tests
            
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

    // Sequential response generation with fallback
    async generateSequentialResponse(prompt, options = {}) {
        const providers = [
            { name: 'perplexity', service: this.services.get('perplexity') },
            { name: 'gemini', service: this.services.get('gemini') },
            { name: 'huggingface', service: this.services.get('huggingface') }
        ];

        let lastError = null;

        for (const provider of providers) {
            try {
                if (provider.service && provider.service.hasApiKey()) {
                    console.log(`Attempting to generate response with ${provider.name}...`);
                    const response = await provider.service.generateResponse(prompt, options);
                    
                    // Basic response verification
                    const verifiedResponse = this.verifyAndCorrectResponse(response, prompt);
                    console.log(`Successfully generated response with ${provider.name}`);
                    return verifiedResponse;
                }
            } catch (error) {
                console.warn(`${provider.name} failed:`, error);
                lastError = error;
                continue;
            }
        }

        // If all providers fail, throw the last error
        throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Sequential streaming response generation with fallback
    async generateSequentialStreamingResponse(prompt, onChunk, options = {}) {
        const providers = [
            { name: 'perplexity', service: this.services.get('perplexity') },
            { name: 'gemini', service: this.services.get('gemini') },
            { name: 'huggingface', service: this.services.get('huggingface') }
        ];

        let lastError = null;

        for (const provider of providers) {
            try {
                if (provider.service && provider.service.hasApiKey()) {
                    console.log(`Attempting to generate streaming response with ${provider.name}...`);
                    return await provider.service.generateStreamingResponse(prompt, onChunk, options);
                }
            } catch (error) {
                console.warn(`${provider.name} streaming failed:`, error);
                lastError = error;
                continue;
            }
        }

        // If all providers fail, throw the last error
        throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Response verification and correction
    verifyAndCorrectResponse(response, originalPrompt) {
        // Basic response verification and correction
        if (!response || response.trim().length === 0) {
            return "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.";
        }

        // Remove common AI artifacts and improve response quality
        let correctedResponse = response.trim();
        
        // Remove redundant prefixes
        correctedResponse = correctedResponse.replace(/^(Assistant:|AI:|Bot:|Response:)\s*/i, '');
        
        // Ensure proper sentence structure
        if (correctedResponse.length > 0 && !correctedResponse.match(/[.!?]$/)) {
            correctedResponse += '.';
        }

        // Ensure minimum quality response
        if (correctedResponse.length < 10) {
            return `I understand you're asking about "${originalPrompt}". Let me provide a more detailed response: ${correctedResponse}`;
        }

        return correctedResponse;
    }
}