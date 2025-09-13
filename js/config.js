// Centralized configuration for Nexus Ai
export const config = {
    // AI Service Configuration
    ai: {
        defaultService: 'gemini',
        services: {
            gemini: {
                name: 'Gemini',
                apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                requiresApiKey: true
            },
            perplexity: {
                name: 'Perplexity',
                apiUrl: 'https://api.perplexity.ai/chat/completions',
                requiresApiKey: true
            },
            huggingface: {
                name: 'HuggingFace',
                apiUrl: 'https://api-inference.huggingface.co/models',
                requiresApiKey: true
            }
        },
        maxRetries: 3,
        timeout: 30000
    },
    
    // UI Configuration
    ui: {
        theme: 'dark',
        maxChatHistory: 100,
        autoScroll: true,
        typewriterEffect: true,
        animations: true
    },
    
    // Voice Input Configuration
    voice: {
        enabled: true,
        language: 'en-US',
        continuous: false,
        interimResults: true
    },
    
    // History Configuration
    history: {
        maxItems: 50,
        persistToLocalStorage: true,
        storageKey: 'nexus_ai_chat_history'
    }
};