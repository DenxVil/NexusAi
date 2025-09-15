// Created with love 🩶 by Denvil 🧑‍💻
// Centralized configuration for NEXUS AI

// Detect deployment environment
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const isGitHubPages = location.hostname.includes('github.io');
const isCustomDomain = !isDevelopment && !isGitHubPages;

export const config = {
    // Deployment Configuration
    deployment: {
        environment: isDevelopment ? 'development' : (isGitHubPages ? 'github-pages' : 'production'),
        isDevelopment,
        isGitHubPages,
        isCustomDomain,
        // Backend API URL - only used if available
        apiUrl: isDevelopment ? 'http://localhost:5000/api' : null, // No backend for GitHub Pages
        // Enable backend integration if API URL is available
        useBackend: isDevelopment && location.port !== '8000' // Only use backend in dev when not serving static files
    },

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
        animations: true,
        // Show deployment info in development
        showDeploymentInfo: isDevelopment
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
    },

    // Feature Flags based on deployment
    features: {
        // Enable additional features in development
        debugMode: isDevelopment,
        // Telegram bot integration info (frontend display only)
        telegramBot: true,
        // GitHub Pages specific features
        directApiMode: isGitHubPages || !isDevelopment
    }
};