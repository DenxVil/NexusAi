// Created with love 🩶 by Denvil 🧑‍💻

import { config } from './config.js';
import { MultiAIService } from './services/ai/multiAIService.js';
import { HistoryService } from './services/historyService.js';
import { VoiceInputService } from './services/voiceInputService.js';
import { LanguageService } from './services/languageService.js';
import { UIManager } from './ui/uiManager.js';

class NexusAiApp {
    constructor() {
        this.config = config;
        this.aiService = null;
        this.historyService = null;
        this.voiceService = null;
        this.languageService = null;
        this.uiManager = null;
        this.currentMessageElement = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize services
            this.languageService = new LanguageService();
            this.aiService = new MultiAIService(this.config);
            this.historyService = new HistoryService(this.config);
            this.voiceService = new VoiceInputService(this.config);
            this.uiManager = new UIManager();

            // Setup UI callbacks
            this.setupUICallbacks();
            
            // Setup voice service callbacks
            this.setupVoiceCallbacks();

            // Initialize UI
            this.uiManager.init();
            
            // Load saved API keys
            this.loadSavedApiKeys();
            
            // Update service selector
            this.updateServiceSelector();
            
            // Load chat history
            this.loadChatHistory();

            console.log('Nexus Ai initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Nexus Ai:', error);
            if (this.uiManager) {
                this.uiManager.showError(`Initialization failed: ${error.message}`);
            }
        }
    }

    setupUICallbacks() {
        this.uiManager.setOnSendMessage((message) => this.handleSendMessage(message));
        this.uiManager.setOnVoiceToggle(() => this.handleVoiceToggle());
        this.uiManager.setOnImageGenerate((prompt) => this.handleImageGenerate(prompt));
        this.uiManager.setOnServiceChange((service) => this.handleServiceChange(service));
        this.uiManager.setOnApiKeyChange((service, apiKey) => this.handleApiKeyChange(service, apiKey));
        this.uiManager.setOnClearHistory(() => this.handleClearHistory());
        this.uiManager.setOnExportHistory(() => this.handleExportHistory());
        this.uiManager.setOnImportHistory((file) => this.handleImportHistory(file));
        this.uiManager.setOnLanguageChange((language) => this.handleLanguageChange(language));
    }

    setupVoiceCallbacks() {
        this.voiceService.setOnResult((result) => {
            if (result.isFinal && result.finalTranscript.trim()) {
                this.uiManager.elements.messageInput.value = result.finalTranscript.trim();
                this.uiManager.autoResizeTextarea(this.uiManager.elements.messageInput);
                this.handleSendMessage(result.finalTranscript.trim());
            } else if (result.interimTranscript) {
                // Show interim results in the input field
                this.uiManager.elements.messageInput.value = result.interimTranscript;
                this.uiManager.autoResizeTextarea(this.uiManager.elements.messageInput);
            }
        });

        this.voiceService.setOnError((error) => {
            this.uiManager.showError(`Voice input error: ${error}`);
        });

        this.voiceService.setOnStatusChange((status) => {
            this.uiManager.updateVoiceStatus(this.voiceService.getStatus());
        });
    }

    async handleSendMessage(message) {
        if (!message.trim()) return;

        try {
            // Add user message to UI
            const userMessageElement = this.uiManager.addMessage(message, 'user', {
                timestamp: new Date().toLocaleTimeString()
            });

            // Show typing indicator
            this.uiManager.showTypingIndicator();

            // Update status
            this.uiManager.updateStatus(this.languageService.translate('generating'), 'info');

            // Get AI response with personality
            let response;
            if (Math.random() < 0.7) { // 70% chance to use emotional response
                response = this.languageService.getRandomAIResponse();
            } else {
                response = await this.aiService.generateResponse(message, {
                    enableFallback: true
                });
            }

            // Hide typing indicator
            this.uiManager.hideTypingIndicator();

            // Add AI response to UI
            const currentService = this.aiService.getCurrentServiceName();
            const aiMessageElement = this.uiManager.addMessage(response, 'assistant', {
                timestamp: new Date().toLocaleTimeString(),
                service: currentService,
                typewriter: this.config.ui.typewriterEffect
            });

            // Add conversation to history
            this.historyService.addConversation(message, response, {
                service: currentService
            });

            this.uiManager.updateStatus('Response generated', 'success');

        } catch (error) {
            console.error('Error sending message:', error);
            this.uiManager.hideTypingIndicator();
            this.uiManager.showError(`Failed to generate response: ${error.message}`);
            
            // Add error message to chat
            this.uiManager.addMessage(
                `Sorry, I encountered an error: ${error.message}`, 
                'assistant', 
                { 
                    timestamp: new Date().toLocaleTimeString(),
                    service: 'error'
                }
            );
        }
    }

    handleVoiceToggle() {
        try {
            if (!this.voiceService.isSupported) {
                this.uiManager.showError('Voice input is not supported in your browser');
                return;
            }

            this.voiceService.toggleListening();
            this.uiManager.updateVoiceStatus(this.voiceService.getStatus());
        } catch (error) {
            this.uiManager.showError(`Voice input error: ${error.message}`);
        }
    }

    handleServiceChange(serviceName) {
        try {
            this.aiService.setCurrentService(serviceName);
            this.uiManager.updateStatus(`Switched to ${serviceName}`, 'success');
            
            // Save current service preference
            localStorage.setItem('nexus_ai_current_service', serviceName);
        } catch (error) {
            this.uiManager.showError(`Failed to switch service: ${error.message}`);
        }
    }

    handleApiKeyChange(serviceName, apiKey) {
        try {
            this.aiService.setApiKey(serviceName, apiKey);
            this.uiManager.updateStatus(`API key updated for ${serviceName}`, 'success');
            
            // Save API key (encrypted in a real implementation)
            localStorage.setItem(`nexus_ai_api_key_${serviceName}`, apiKey);
            
            // Update service selector to reflect availability
            this.updateServiceSelector();
        } catch (error) {
            this.uiManager.showError(`Failed to update API key: ${error.message}`);
        }
    }

    handleClearHistory() {
        this.historyService.clearHistory();
        this.uiManager.clearMessages();
        this.uiManager.updateStatus(this.languageService.translate('historyCleared'), 'success');
    }

    handleLanguageChange(language) {
        this.languageService.setLanguage(language);
        this.uiManager.updateStatus(this.languageService.translate('loaded'), 'success');
    }

    async handleImageGenerate(prompt) {
        try {
            // Add user prompt to UI
            const userMessageElement = this.uiManager.addMessage(`🎨 ${prompt}`, 'user', {
                timestamp: new Date().toLocaleTimeString()
            });

            // Show image generation status
            this.uiManager.updateStatus('Generating image...', 'info');
            
            // Add generating indicator
            const generatingElement = this.uiManager.addMessage('🎨 Generating image, please wait...', 'assistant', {
                timestamp: new Date().toLocaleTimeString(),
                service: 'image-generator'
            });

            // Simulate image generation (in real implementation, call actual API)
            await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

            // Mock image URLs - in real implementation, this would call the backend API
            const mockImageUrls = [
                'https://picsum.photos/512/512?random=' + Math.floor(Math.random() * 1000),
                'https://picsum.photos/512/512?random=' + Math.floor(Math.random() * 1000),
            ];

            const imageUrl = mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];

            // Remove generating message
            generatingElement.remove();

            // Add generated image
            const imageContent = `
                <div class="generated-image">
                    <img src="${imageUrl}" alt="Generated image: ${prompt}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <p style="margin-top: 8px; font-size: 0.9em; color: var(--text-secondary);">Generated image for: "${prompt}"</p>
                </div>
            `;

            this.uiManager.addMessage(imageContent, 'assistant', {
                timestamp: new Date().toLocaleTimeString(),
                service: 'image-generator',
                isHtml: true
            });

            this.uiManager.updateStatus('Image generated successfully!', 'success');

        } catch (error) {
            console.error('Image generation error:', error);
            this.uiManager.showError(`Failed to generate image: ${error.message}`);
        }
    }

    handleExportHistory() {
        try {
            const historyData = this.historyService.exportHistory();
            const blob = new Blob([historyData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `nexus_ai_history_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.uiManager.updateStatus('History exported successfully', 'success');
        } catch (error) {
            this.uiManager.showError(`Failed to export history: ${error.message}`);
        }
    }

    async handleImportHistory(file) {
        try {
            const text = await file.text();
            const importedCount = this.historyService.importHistory(text, true);
            
            // Reload chat history in UI
            this.loadChatHistory();
            
            this.uiManager.updateStatus(`Imported ${importedCount} history items`, 'success');
        } catch (error) {
            this.uiManager.showError(`Failed to import history: ${error.message}`);
        }
    }

    loadSavedApiKeys() {
        const services = this.aiService.getAvailableServices();
        
        services.forEach(serviceName => {
            const savedKey = localStorage.getItem(`nexus_ai_api_key_${serviceName}`);
            if (savedKey) {
                try {
                    this.aiService.setApiKey(serviceName, savedKey);
                    
                    // Update UI input field
                    const input = document.querySelector(`[data-api-key="${serviceName}"]`);
                    if (input) {
                        input.value = savedKey;
                    }
                } catch (error) {
                    console.warn(`Failed to load API key for ${serviceName}:`, error);
                }
            }
        });

        // Load current service preference
        const savedService = localStorage.getItem('nexus_ai_current_service');
        if (savedService && this.aiService.getAvailableServices().includes(savedService)) {
            try {
                this.aiService.setCurrentService(savedService);
            } catch (error) {
                console.warn('Failed to load saved service preference:', error);
            }
        }
    }

    updateServiceSelector() {
        const services = this.aiService.getAvailableServices().map(serviceName => {
            const info = this.aiService.getServiceInfo(serviceName);
            return {
                id: serviceName,
                name: info.name,
                hasApiKey: info.hasApiKey
            };
        });

        this.uiManager.updateServiceSelector(services, this.aiService.getCurrentServiceName());
    }

    loadChatHistory() {
        const history = this.historyService.getHistory();
        
        // Group messages by conversation
        const conversations = {};
        history.forEach(item => {
            if (!conversations[item.conversationId]) {
                conversations[item.conversationId] = [];
            }
            conversations[item.conversationId].push(item);
        });

        // Sort conversations by timestamp and display recent ones
        const sortedConversations = Object.values(conversations)
            .sort((a, b) => new Date(b[0].timestamp) - new Date(a[0].timestamp))
            .slice(0, 10); // Show last 10 conversations

        sortedConversations.forEach(conversation => {
            conversation.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            conversation.forEach(item => {
                this.uiManager.addMessage(
                    item.content,
                    item.type,
                    {
                        id: item.id,
                        timestamp: new Date(item.timestamp).toLocaleTimeString(),
                        service: item.service,
                        animate: false
                    }
                );
            });
        });
    }

    // Public methods for external access
    getConfig() {
        return this.config;
    }

    getAIService() {
        return this.aiService;
    }

    getHistoryService() {
        return this.historyService;
    }

    getVoiceService() {
        return this.voiceService;
    }

    getUIManager() {
        return this.uiManager;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nexusAiApp = new NexusAiApp();
});

// Export for module usage
export default NexusAiApp;