// Created with love 🩶 by Denvil 🧑‍💻
// Nexus AI Service with Cascading Provider Chain

import config from '../config';

export class AIService {
    private readonly REQUEST_TIMEOUT = config.requestTimeoutMs;
    private readonly MAX_RETRIES = 3;

    constructor() {
        console.log('🤖 Nexus AI Service initialized with cascading provider chain');
    }

    /**
     * Cascading AI Provider Chain: Perplexity → Gemini → HuggingFace
     * Each provider is tried in sequence until one succeeds
     */
    async generateResponse(message: string, chatHistory: any[] = []): Promise<string> {
        const providers = ['perplexity', 'gemini', 'huggingface'];
        let lastError: Error | null = null;

        console.log(`🔄 Starting cascading AI chain for message: "${message.substring(0, 50)}..."`);

        for (const provider of providers) {
            try {
                console.log(`🎯 Attempting ${provider.toUpperCase()} provider...`);
                
                const response = await this.generateResponseWithProvider(provider, message, chatHistory);
                const verifiedResponse = await this.reVerifyAndCorrect(response, message);
                
                console.log(`✅ Success with ${provider.toUpperCase()} provider`);
                return verifiedResponse;
            } catch (error) {
                lastError = error as Error;
                console.warn(`❌ ${provider.toUpperCase()} provider failed:`, error);
                
                // Continue to next provider
                continue;
            }
        }

        // If all providers fail
        console.error('🚨 All AI providers failed in cascading chain');
        throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    /**
     * Generate response using specific provider
     */
    private async generateResponseWithProvider(provider: string, message: string, chatHistory: any[] = []): Promise<string> {
        switch (provider.toLowerCase()) {
            case 'perplexity':
                return this.generatePerplexityResponse(message, chatHistory);
            case 'gemini':
                return this.generateGeminiResponse(message, chatHistory);
            case 'huggingface':
                return this.generateHuggingFaceResponse(message, chatHistory);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Google Gemini Provider - Secondary provider in cascading chain
     */
    private async generateGeminiResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = config.geminiApiKey;
        
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // Build context from chat history
        const context = chatHistory
            .slice(-10) // Last 10 messages for context
            .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const prompt = context ? `${context}\nHuman: ${message}\nAssistant:` : message;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are Nexus AI, a helpful assistant created by Denvil 🧑‍💻. ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: config.maxTokensPerRequest,
                        temperature: 0.7
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!content) {
                throw new Error('No content received from Gemini API');
            }

            return content;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Gemini API request timeout');
            }
            throw error;
        }
    }

    /**
     * Perplexity AI Provider - Primary provider in cascading chain
     */
    private async generatePerplexityResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = config.perplexityApiKey;
        
        if (!apiKey) {
            throw new Error('Perplexity API key not configured');
        }

        // Convert chat history to Perplexity format
        const messages = [
            { role: 'system', content: 'You are Nexus AI, a helpful AI assistant created by Denvil 🧑‍💻. Provide informative and engaging responses with high accuracy.' }
        ];

        // Add recent chat history
        chatHistory.slice(-10).forEach(msg => {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        });

        // Add current message
        messages.push({ role: 'user', content: message });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-small-128k-online',
                    messages: messages,
                    max_tokens: config.maxTokensPerRequest,
                    temperature: 0.7,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            const content = data.choices?.[0]?.message?.content;
            
            if (!content) {
                throw new Error('No content received from Perplexity API');
            }

            return content;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Perplexity API request timeout');
            }
            throw error;
        }
    }

    /**
     * HuggingFace Provider - Tertiary fallback provider in cascading chain
     */
    private async generateHuggingFaceResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = config.huggingfaceApiKey;
        
        if (!apiKey) {
            throw new Error('HuggingFace API key not configured');
        }

        // Build context from chat history
        const context = chatHistory
            .slice(-8) // Smaller context for HuggingFace
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const prompt = context 
            ? `You are Nexus AI, a helpful assistant. Continue this conversation:\n\n${context}\nUser: ${message}\nAssistant:`
            : `You are Nexus AI, a helpful assistant. User: ${message}\nAssistant:`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

        try {
            const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: Math.min(config.maxTokensPerRequest, 500),
                        temperature: 0.7,
                        do_sample: true,
                        return_full_text: false
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            
            if (Array.isArray(data) && data[0]?.generated_text) {
                // Extract only the assistant's response
                const fullText = data[0].generated_text;
                const assistantStart = fullText.lastIndexOf('Assistant:');
                if (assistantStart !== -1) {
                    return fullText.substring(assistantStart + 10).trim();
                }
                return fullText.trim();
            }
            
            throw new Error('No valid content received from HuggingFace API');
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('HuggingFace API request timeout');
            }
            throw error;
        }
    }

    /**
     * Re-verification and correction step
     * This function provides a placeholder for additional quality assurance
     */
    private async reVerifyAndCorrect(response: string, originalMessage: string): Promise<string> {
        try {
            // Basic validation and correction
            let correctedResponse = response.trim();
            
            // Remove potential API artifacts
            correctedResponse = correctedResponse.replace(/^(Assistant:|AI:|Bot:)\s*/i, '');
            
            // Ensure response is not empty
            if (!correctedResponse || correctedResponse.length < 3) {
                throw new Error('Generated response is too short or empty');
            }
            
            // Check for inappropriate content patterns (basic implementation)
            const inappropriatePatterns = [
                /\b(sorry, i cannot|i can't help|i'm not able to)\b/i,
                /\b(error|failed|unable to process)\b/i
            ];
            
            const hasInappropriateContent = inappropriatePatterns.some(pattern => 
                pattern.test(correctedResponse)
            );
            
            if (hasInappropriateContent && correctedResponse.length < 50) {
                // If response seems like an error message and is short, try to improve it
                correctedResponse = `I understand your question about "${originalMessage.substring(0, 30)}...". Let me help you with that. ${correctedResponse}`;
            }
            
            // TODO: Implement more sophisticated verification:
            // - Fact-checking against reliable sources
            // - Content appropriateness validation
            // - Response relevance scoring
            // - Grammar and coherence checking
            // - Bias detection and mitigation
            
            console.log(`✅ Response verified and corrected (length: ${correctedResponse.length})`);
            return correctedResponse;
            
        } catch (error) {
            console.warn('⚠️ Re-verification failed, returning original response:', error);
            return response; // Return original if verification fails
        }
    }

    /**
     * Get available models/providers
     */
    getAvailableModels(): string[] {
        return ['perplexity', 'gemini', 'huggingface'];
    }

    /**
     * Check if a specific model/provider is configured
     */
    isModelConfigured(model: string): boolean {
        switch (model.toLowerCase()) {
            case 'perplexity':
                return !!config.perplexityApiKey;
            case 'gemini':
                return !!config.geminiApiKey;
            case 'huggingface':
                return !!config.huggingfaceApiKey;
            default:
                return false;
        }
    }

    /**
     * Get configuration status for all providers
     */
    getProvidersStatus(): { [key: string]: boolean } {
        return {
            perplexity: this.isModelConfigured('perplexity'),
            gemini: this.isModelConfigured('gemini'),
            huggingface: this.isModelConfigured('huggingface')
        };
    }

    /**
     * Legacy method for backward compatibility
     */
    async generateResponseWithModel(message: string, model: string = 'perplexity', chatHistory: any[] = []): Promise<string> {
        console.warn('⚠️ generateResponseWithModel is deprecated, using cascading chain instead');
        return this.generateResponse(message, chatHistory);
    }
}
