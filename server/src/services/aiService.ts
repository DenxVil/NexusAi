// Created with love 🩶 by Denvil 🧑‍💻

export class AIService {
    constructor() {
        // Initialize with environment variables
    }

    async generateResponse(message: string, model: string = 'auto', chatHistory: any[] = []): Promise<string> {
        // If specific model is requested, try that first
        if (model !== 'auto') {
            try {
                switch (model.toLowerCase()) {
                    case 'gemini':
                        return await this.generateGeminiResponse(message, chatHistory);
                    case 'perplexity':
                        return await this.generatePerplexityResponse(message, chatHistory);
                    case 'huggingface':
                        return await this.generateHuggingFaceResponse(message, chatHistory);
                    default:
                        return await this.generateWithSequentialFallback(message, chatHistory);
                }
            } catch (error) {
                console.error(`Error generating response with ${model}:`, error);
                // Fall back to sequential chain if specific model fails
                return await this.generateWithSequentialFallback(message, chatHistory);
            }
        }
        
        // Use sequential fallback chain for 'auto' mode
        return await this.generateWithSequentialFallback(message, chatHistory);
    }

    private async generateWithSequentialFallback(message: string, chatHistory: any[] = []): Promise<string> {
        const providers = [
            { name: 'perplexity', method: this.generatePerplexityResponse.bind(this) },
            { name: 'gemini', method: this.generateGeminiResponse.bind(this) },
            { name: 'huggingface', method: this.generateHuggingFaceResponse.bind(this) }
        ];

        let lastError: Error | null = null;

        for (const provider of providers) {
            try {
                console.log(`Attempting to generate response with ${provider.name}...`);
                const response = await provider.method(message, chatHistory);
                
                // Verify and correct the response before returning
                const verifiedResponse = await this.verifyAndCorrectResponse(response, message);
                console.log(`Successfully generated response with ${provider.name}`);
                return verifiedResponse;
            } catch (error) {
                console.warn(`${provider.name} failed:`, error);
                lastError = error as Error;
                continue;
            }
        }

        // If all providers fail, throw the last error
        throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    private async verifyAndCorrectResponse(response: string, originalMessage: string): Promise<string> {
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
            return `I understand you're asking about "${originalMessage}". Let me provide a more detailed response: ${correctedResponse}`;
        }

        return correctedResponse;
    }

    private async generateGeminiResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
        
        // Build context from chat history
        const context = chatHistory
            .slice(-10) // Last 10 messages for context
            .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const systemPrompt = "You are Nexus AI, a powerful, accurate, and intelligent assistant created by Denvil. Provide perfect, comprehensive responses with precision.";
        const prompt = context ? `${systemPrompt}\n\n${context}\nHuman: ${message}\nAssistant:` : `${systemPrompt}\n\nHuman: ${message}\nAssistant:`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2000,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json() as any;
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    }

    private async generatePerplexityResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = process.env.PERPLEXITY_API_KEY;
        
        if (!apiKey) {
            throw new Error('Perplexity API key not configured');
        }

        // Convert chat history to Perplexity format
        const messages = [
            { role: 'system', content: 'You are Nexus AI, a powerful and accurate AI assistant created by Denvil. Provide perfect, comprehensive, and helpful responses with precision and intelligence.' }
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

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online', // Top model
                messages: messages,
                max_tokens: 2000,
                temperature: 0.3 // Lower temperature for more accurate responses
            })
        });

        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    }

    private async generateHuggingFaceResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        
        if (!apiKey) {
            throw new Error('HuggingFace API key not configured');
        }

        // Build context from chat history
        const context = chatHistory
            .slice(-6) // Smaller context for HuggingFace
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const prompt = context 
            ? `You are Nexus AI, an intelligent assistant. Continue this conversation:\n\n${context}\nUser: ${message}\nAssistant:`
            : `You are Nexus AI, an intelligent assistant. User: ${message}\nAssistant:`;

        // Use a more reliable model
        const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_length: 200,
                    temperature: 0.7,
                    do_sample: true,
                    pad_token_id: 50256
                },
                options: {
                    wait_for_model: true
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HuggingFace API error: ${response.status} - ${response.statusText}`);
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
        
        return 'Sorry, I could not generate a response.';
    }

    getAvailableModels(): string[] {
        return ['gemini', 'perplexity', 'huggingface'];
    }

    isModelConfigured(model: string): boolean {
        switch (model.toLowerCase()) {
            case 'gemini':
                return !!process.env.GEMINI_API_KEY;
            case 'perplexity':
                return !!process.env.PERPLEXITY_API_KEY;
            case 'huggingface':
                return !!process.env.HUGGINGFACE_API_KEY;
            default:
                return false;
        }
    }
}
