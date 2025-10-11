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
     * Cascading AI Provider Chain: Perplexity → Gemini → HuggingFace → Local Fallback
     * Each provider is tried in sequence until one succeeds
     */
    async generateResponse(message: string, chatHistory: any[] = []): Promise<string> {
        const providers = ['perplexity', 'gemini', 'huggingface'];
        let lastError: Error | null = null;
        let errors: string[] = [];

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
                const errorMsg = `${provider.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
                console.warn(`❌ ${provider.toUpperCase()} provider failed:`, error);
                
                // Continue to next provider
                continue;
            }
        }

        // If all AI providers fail, return a helpful fallback response
        console.error('🚨 All AI providers failed in cascading chain');
        
        return this.generateLocalFallbackResponse(message, errors);
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
     * Optimized for advanced reasoning and comprehensive responses
     */
    private async generateGeminiResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = config.geminiApiKey;
        
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('Gemini API key not configured or empty');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // Build context from chat history with enhanced formatting
        const context = chatHistory
            .slice(-10) // Last 10 messages for context
            .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const enhancedSystemPrompt = `You are Nexus AI, an intelligent assistant created by Denvil 🧑‍💻.

Intelligence Framework:
- Deep understanding of context and nuance
- Multi-step reasoning for complex problems
- Creative problem-solving abilities
- Comprehensive knowledge across diverse topics
- Ability to explain concepts at various complexity levels

Response Strategy:
- Analyze the question thoroughly before responding
- Break down complex topics into digestible parts
- Provide examples and real-world applications
- Use analogies to clarify difficult concepts
- Structure responses with clear formatting
- Include code snippets when relevant (with syntax highlighting)
- Offer follow-up suggestions or related topics

Quality Standards:
- Accuracy over speed
- Depth over brevity (when appropriate)
- Clarity in communication
- Practical, actionable advice
- Ethical and unbiased information

Remember: Your goal is to be genuinely helpful and make complex information accessible.`;

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
                            text: `${enhancedSystemPrompt}\n\n${prompt}`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: config.maxTokensPerRequest,
                        temperature: 0.8, // Slightly higher for more creative responses
                        topP: 0.95,
                        topK: 40
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unable to read error response');
                throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json() as any;
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                throw new Error('No valid content received from Gemini API');
            }

            return content.trim();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Gemini API request timeout');
            }
            if (error instanceof Error) {
                throw new Error(`Gemini provider failed: ${error.message}`);
            }
            throw new Error('Gemini provider failed with unknown error');
        }
    }

    /**
     * Perplexity AI Provider - Primary provider in cascading chain
     * Optimized for internet-connected real-time information
     */
    private async generatePerplexityResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = config.perplexityApiKey;
        
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('Perplexity API key not configured or empty');
        }

        // Convert chat history to Perplexity format with enhanced system prompt
        const messages = [
            { 
                role: 'system', 
                content: `You are Nexus AI, an advanced AI assistant created by Denvil 🧑‍💻. You have access to real-time internet data and current information.

Core Capabilities:
- Provide accurate, well-researched answers using the latest internet data
- Stay updated with current events, trends, and breaking news
- Offer detailed technical explanations with examples
- Cite sources when providing factual information
- Give step-by-step guidance for complex problems
- Understand context from conversation history
- Adapt responses to user's expertise level

Response Guidelines:
- Be informative, concise, and engaging
- Use markdown formatting for better readability
- Include relevant examples and analogies
- Verify facts before presenting them as truth
- Acknowledge uncertainty when appropriate
- Provide actionable insights and recommendations

Always strive for accuracy, clarity, and helpfulness in your responses.` 
            }
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
                    model: 'llama-3.1-sonar-large-128k-online', // Upgraded to large model for better intelligence
                    messages: messages,
                    max_tokens: config.maxTokensPerRequest,
                    temperature: 0.7,
                    top_p: 0.9, // Nucleus sampling for better quality
                    search_domain_filter: ["google.com", "wikipedia.org", "github.com", "stackoverflow.com"], // Focus on quality sources
                    return_related_questions: false,
                    search_recency_filter: "month", // Prioritize recent information
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unable to read error response');
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json() as any;
            const content = data.choices?.[0]?.message?.content;
            
            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                throw new Error('No valid content received from Perplexity API');
            }

            return content.trim();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Perplexity API request timeout');
            }
            if (error instanceof Error) {
                throw new Error(`Perplexity provider failed: ${error.message}`);
            }
            throw new Error('Perplexity provider failed with unknown error');
        }
    }

    /**
     * HuggingFace Provider - Tertiary fallback provider in cascading chain
     * Optimized with better model for conversational AI
     */
    private async generateHuggingFaceResponse(message: string, chatHistory: any[]): Promise<string> {
        const apiKey = config.huggingfaceApiKey;
        
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('HuggingFace API key not configured or empty');
        }

        // Build context from chat history
        const context = chatHistory
            .slice(-8) // Smaller context for HuggingFace
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const systemContext = `You are Nexus AI, an intelligent assistant by Denvil 🧑‍💻. Provide helpful, accurate, and well-structured responses.`;
        
        const prompt = context 
            ? `${systemContext}\n\nConversation:\n${context}\nUser: ${message}\nAssistant:`
            : `${systemContext}\n\nUser: ${message}\nAssistant:`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

        try {
            // Using a better model for improved intelligence
            const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: Math.min(config.maxTokensPerRequest, 1024),
                        temperature: 0.7,
                        top_p: 0.9,
                        do_sample: true,
                        return_full_text: false,
                        repetition_penalty: 1.2
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unable to read error response');
                throw new Error(`HuggingFace API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json() as any;
            
            if (Array.isArray(data) && data[0]?.generated_text) {
                // Extract only the assistant's response
                const fullText = data[0].generated_text;
                const assistantStart = fullText.lastIndexOf('Assistant:');
                let extractedText = '';
                
                if (assistantStart !== -1) {
                    extractedText = fullText.substring(assistantStart + 10).trim();
                } else {
                    extractedText = fullText.trim();
                }
                
                if (!extractedText || extractedText.length === 0) {
                    throw new Error('Empty response from HuggingFace API');
                }
                
                return extractedText;
            }
            
            throw new Error('No valid content received from HuggingFace API');
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('HuggingFace API request timeout');
            }
            if (error instanceof Error) {
                throw new Error(`HuggingFace provider failed: ${error.message}`);
            }
            throw new Error('HuggingFace provider failed with unknown error');
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
     * Generate a helpful local fallback response when all AI providers fail
     */
    private generateLocalFallbackResponse(message: string, errors: string[]): string {
        const fallbackResponses = [
            `I apologize, but I'm currently experiencing technical difficulties with my AI providers. Your message "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}" is important to me, and I want to help you.`,
            
            `Unfortunately, my AI services are temporarily unavailable. I understand you're asking about "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}" and I'd love to assist you once my systems are back online.`,
            
            `I'm having trouble connecting to my AI backends right now. Your question about "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}" deserves a proper response, so please try again in a few moments.`
        ];

        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        const suggestions = this.generateSuggestionsBasedOnMessage(message);
        
        return `${randomResponse}

🔧 **What you can try:**
${suggestions}

🕐 **Status:** All AI providers are currently unavailable
📞 **Support:** Please try again in a few minutes

*I'm Nexus AI, created with love by ◉Ɗєиνιℓ, and I'm working to get back online soon!*`;
    }

    /**
     * Generate helpful suggestions based on the user's message
     */
    private generateSuggestionsBasedOnMessage(message: string): string {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('weather') || lowerMsg.includes('temperature')) {
            return '• Try asking about weather in a specific city\n• Check a weather app for immediate results\n• Use weather-related commands like /weather [city]';
        }
        
        if (lowerMsg.includes('calculate') || lowerMsg.includes('math') || /\d+\s*[\+\-\*\/]\s*\d+/.test(lowerMsg)) {
            return '• Use the /calculate command for math operations\n• Try a calculator app for complex calculations\n• Reformulate your math question more clearly';
        }
        
        if (lowerMsg.includes('image') || lowerMsg.includes('picture') || lowerMsg.includes('draw')) {
            return '• Use the /imagine command to generate images\n• Describe what you want to see in detail\n• Try creative prompts for better results';
        }
        
        if (lowerMsg.includes('define') || lowerMsg.includes('meaning') || lowerMsg.includes('what is')) {
            return '• Use the /define command for word definitions\n• Try rephrasing your question\n• Search for the term in a dictionary';
        }
        
        return '• Try rephrasing your question\n• Use specific commands like /help for assistance\n• Check back in a few minutes when services are restored';
    }
    async generateResponseWithModel(message: string, model: string = 'perplexity', chatHistory: any[] = []): Promise<string> {
        console.warn('⚠️ generateResponseWithModel is deprecated, using cascading chain instead');
        return this.generateResponse(message, chatHistory);
    }
}
