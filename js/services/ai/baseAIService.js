// Abstract base class for AI services
export class BaseAIService {
    constructor(name, config) {
        if (this.constructor === BaseAIService) {
            throw new Error("BaseAIService is abstract and cannot be instantiated directly");
        }
        this.name = name;
        this.config = config;
        this.apiKey = null;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    hasApiKey() {
        return this.apiKey !== null && this.apiKey !== '';
    }

    // Abstract method that must be implemented by subclasses
    async generateResponse(prompt, options = {}) {
        throw new Error("generateResponse method must be implemented by subclass");
    }

    // Abstract method for streaming responses
    async generateStreamingResponse(prompt, onChunk, options = {}) {
        throw new Error("generateStreamingResponse method must be implemented by subclass");
    }

    // Common error handling
    handleError(error, context = '') {
        console.error(`${this.name} Service Error ${context}:`, error);
        
        if (error.status === 401) {
            throw new Error(`Authentication failed for ${this.name}. Please check your API key.`);
        } else if (error.status === 429) {
            throw new Error(`Rate limit exceeded for ${this.name}. Please try again later.`);
        } else if (error.status >= 500) {
            throw new Error(`${this.name} service is currently unavailable. Please try again later.`);
        } else if (!navigator.onLine) {
            throw new Error('No internet connection. Please check your network and try again.');
        } else {
            throw new Error(`${this.name} service error: ${error.message || 'Unknown error occurred'}`);
        }
    }

    // Common request headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.hasApiKey()) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        return headers;
    }

    // Common fetch wrapper with timeout and retry logic
    async makeRequest(url, options = {}, retries = 3) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

        const requestOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (retries > 0 && (error.name === 'AbortError' || error.name === 'NetworkError')) {
                console.warn(`Retrying ${this.name} request. Attempts remaining: ${retries - 1}`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                return this.makeRequest(url, options, retries - 1);
            }
            
            this.handleError(error, 'during request');
        }
    }
}