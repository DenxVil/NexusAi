export class AIService {
    constructor() {
        // Initialize with environment variables
    }

    async generateResponse(message: string, model: string = 'gemini', chatHistory: any[] = []): Promise<string> {
        try {
            switch (model.toLowerCase()) {
                case 'gemini':
                    return this.generateGeminiResponse(message, chatHistory);
                case 'perplexity':
                    return this.generatePerplexityResponse(message, chatHistory);
                case 'huggingface':
                    return this.generateHuggingFaceResponse(message, chatHistory);
                default:
                    return this.generateGeminiResponse(message, chatHistory);
            }
        } catch (error) {
            console.error(`Error generating response with ${model}:`, error);
            throw new Error(`Failed to generate response using ${model} model. Please check your API configuration.`);
        }
    }

    private async generateGeminiResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
        
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
            { role: 'system', content: 'You are Nexus Ai, a helpful AI assistant created by ◉Ɗєиνιℓ. Provide informative and engaging responses.' }
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
            ? `You are Nexus Ai, a helpful assistant. Continue this conversation:\n\n${context}\nUser: ${message}\nAssistant:`
            : `You are Nexus Ai, a helpful assistant. User: ${message}\nAssistant:`;

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
