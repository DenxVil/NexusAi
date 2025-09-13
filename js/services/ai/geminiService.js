import { BaseAIService } from './baseAIService.js';

export class GeminiService extends BaseAIService {
    constructor(config) {
        super('Gemini', config);
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.hasApiKey()) {
            // Gemini uses API key as a query parameter, not in headers
            // But we'll keep this for potential future changes
        }

        return headers;
    }

    buildApiUrl() {
        const baseUrl = this.config.apiUrl;
        if (this.hasApiKey()) {
            return `${baseUrl}?key=${this.apiKey}`;
        }
        return baseUrl;
    }

    formatPrompt(prompt) {
        return {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };
    }

    async generateResponse(prompt, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error('Gemini API key is required');
        }

        try {
            const requestBody = this.formatPrompt(prompt);
            const url = this.buildApiUrl();

            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    return candidate.content.parts[0].text;
                }
            }

            throw new Error('No valid response received from Gemini');
        } catch (error) {
            this.handleError(error, 'generating response');
        }
    }

    async generateStreamingResponse(prompt, onChunk, options = {}) {
        // Note: Gemini API streaming implementation would go here
        // For now, we'll simulate streaming by breaking up the regular response
        try {
            const fullResponse = await this.generateResponse(prompt, options);
            const words = fullResponse.split(' ');
            
            for (let i = 0; i < words.length; i++) {
                const chunk = words.slice(0, i + 1).join(' ');
                onChunk(chunk);
                await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
            }
        } catch (error) {
            this.handleError(error, 'generating streaming response');
        }
    }
}