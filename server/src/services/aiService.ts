// Created with love 🩶 by Denvil 🧑‍💻

export class AIService {
    constructor() {
        // Initialize with environment variables
    }

    async generateResponse(message: string, model: string = 'sequential', chatHistory: any[] = []): Promise<string> {
        // If sequential mode (default), try providers in priority order
        if (model === 'sequential') {
            return this.generateSequentialResponse(message, chatHistory);
        }

        // For specific model requests, try that model directly
        try {
            switch (model.toLowerCase()) {
                case 'gemini':
                    return await this.generateGeminiResponse(message, chatHistory);
                case 'perplexity':
                    return await this.generatePerplexityResponse(message, chatHistory);
                case 'huggingface':
                    return await this.generateHuggingFaceResponse(message, chatHistory);
                default:
                    return await this.generateSequentialResponse(message, chatHistory);
            }
        } catch (error) {
            console.error(`Error generating response with ${model}:`, error);
            throw new Error(`Failed to generate response using ${model} model. Please check your API configuration.`);
        }
    }

    async generateSequentialResponse(message: string, chatHistory: any[] = []): Promise<string> {
        const providers = [
            { name: 'perplexity', fn: this.generatePerplexityResponse.bind(this) },
            { name: 'gemini', fn: this.generateGeminiResponse.bind(this) },
            { name: 'huggingface', fn: this.generateHuggingFaceResponse.bind(this) }
        ];

        let lastError: Error | null = null;

        for (const provider of providers) {
            try {
                console.log(`Attempting to generate response with ${provider.name}...`);
                const response = await provider.fn(message, chatHistory);
                
                // Re-verify and correct the response if needed
                const verifiedResponse = await this.reverifyAndCorrectResponse(response, message);
                console.log(`✅ Successfully generated response with ${provider.name}`);
                return verifiedResponse;
            } catch (error) {
                console.warn(`❌ ${provider.name} failed:`, error instanceof Error ? error.message : error);
                lastError = error instanceof Error ? error : new Error(String(error));
                continue;
            }
        }

        // If all providers fail, throw the last error
        throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    async reverifyAndCorrectResponse(response: string, originalMessage: string): Promise<string> {
        // Placeholder function for future implementation of strict accuracy check
        // This could include:
        // - Fact checking against reliable sources
        // - Grammar and coherence validation
        // - Context appropriateness verification
        // - Safety and content policy compliance
        
        console.log('Response re-verification placeholder called');
        
        // For now, just return the response as-is
        // Future implementation could call another AI service for verification
        return response;
    }

    private async generateGeminiResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        
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
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
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
            { role: 'system', content: 'You are Nexus AI, a helpful AI assistant created by Denvil 🧑‍💻. Provide informative and engaging responses.' }
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
                model: 'llama-3.1-sonar-small-128k-online',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`);
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
            .slice(-8) // Smaller context for HuggingFace
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const prompt = context 
            ? `You are Nexus AI, a helpful assistant. Continue this conversation:\n\n${context}\nUser: ${message}\nAssistant:`
            : `You are Nexus AI, a helpful assistant. User: ${message}\nAssistant:`;

        const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_length: 500,
                    temperature: 0.7,
                    do_sample: true
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HuggingFace API error: ${response.status}`);
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
