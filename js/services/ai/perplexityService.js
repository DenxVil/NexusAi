import { BaseAIService } from './baseAIService.js';

export class PerplexityService extends BaseAIService {
    constructor(config) {
        super('Perplexity', config);
    }

    formatPrompt(prompt) {
        return {
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful AI assistant with access to current information.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1024,
            temperature: 0.7,
            stream: false
        };
    }

    async generateResponse(prompt, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error('Perplexity API key is required');
        }

        try {
            const requestBody = this.formatPrompt(prompt);

            const response = await this.makeRequest(this.config.apiUrl, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }

            throw new Error('No valid response received from Perplexity');
        } catch (error) {
            this.handleError(error, 'generating response');
        }
    }

    async generateStreamingResponse(prompt, onChunk, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error('Perplexity API key is required');
        }

        try {
            const requestBody = {
                ...this.formatPrompt(prompt),
                stream: true
            };

            const response = await this.makeRequest(this.config.apiUrl, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') return;
                        
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices && parsed.choices[0].delta.content) {
                                accumulatedText += parsed.choices[0].delta.content;
                                onChunk(accumulatedText);
                            }
                        } catch (e) {
                            // Skip malformed JSON
                        }
                    }
                }
            }
        } catch (error) {
            this.handleError(error, 'generating streaming response');
        }
    }
}