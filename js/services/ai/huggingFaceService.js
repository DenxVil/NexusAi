import { BaseAIService } from './baseAIService.js';

export class HuggingFaceService extends BaseAIService {
    constructor(config) {
        super('HuggingFace', config);
        this.model = 'microsoft/DialoGPT-medium'; // Default model
    }

    setModel(model) {
        this.model = model;
    }

    getModelUrl() {
        return `${this.config.apiUrl}/${this.model}`;
    }

    formatPrompt(prompt) {
        return {
            inputs: prompt,
            parameters: {
                max_new_tokens: 512,
                temperature: 0.7,
                do_sample: true,
                return_full_text: false
            },
            options: {
                wait_for_model: true,
                use_cache: false
            }
        };
    }

    async generateResponse(prompt, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error('HuggingFace API key is required');
        }

        try {
            const requestBody = this.formatPrompt(prompt);
            const url = this.getModelUrl();

            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            // Handle different response formats from HuggingFace
            if (Array.isArray(data) && data.length > 0) {
                if (data[0].generated_text) {
                    return data[0].generated_text;
                } else if (data[0].text) {
                    return data[0].text;
                }
            } else if (data.generated_text) {
                return data.generated_text;
            } else if (typeof data === 'string') {
                return data;
            }

            throw new Error('No valid response received from HuggingFace');
        } catch (error) {
            this.handleError(error, 'generating response');
        }
    }

    async generateStreamingResponse(prompt, onChunk, options = {}) {
        // HuggingFace Inference API doesn't support streaming in the same way
        // We'll simulate streaming by breaking up the response
        try {
            const fullResponse = await this.generateResponse(prompt, options);
            const words = fullResponse.split(' ');
            
            for (let i = 0; i < words.length; i++) {
                const chunk = words.slice(0, i + 1).join(' ');
                onChunk(chunk);
                await new Promise(resolve => setTimeout(resolve, 80)); // Simulate streaming delay
            }
        } catch (error) {
            this.handleError(error, 'generating streaming response');
        }
    }

    // Method to get available models (for future use)
    async getAvailableModels() {
        if (!this.hasApiKey()) {
            throw new Error('HuggingFace API key is required');
        }

        try {
            const response = await this.makeRequest('https://api-inference.huggingface.co/models', {
                method: 'GET'
            });

            const models = await response.json();
            return models.filter(model => 
                model.pipeline_tag === 'text-generation' || 
                model.pipeline_tag === 'conversational'
            );
        } catch (error) {
            this.handleError(error, 'fetching available models');
        }
    }
}